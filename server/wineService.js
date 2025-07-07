/**
 * Direct Wine Processing Service
 * 
 * Processes wine lists line-by-line and stores wines directly in PostgreSQL
 */

import pg from 'pg';
import { OpenAI } from 'openai';

// Database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Ensures the wines table exists in the database
 */
export async function setupWineTable() {
  try {
    // Create the wines table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS wines (
        id SERIAL PRIMARY KEY,
        cache_key TEXT UNIQUE NOT NULL,
        wine_name TEXT NOT NULL,
        vintage TEXT,
        producer TEXT,
        region TEXT,
        country TEXT,
        varietals TEXT,
        wine_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS wines_wine_name_idx ON wines (wine_name);
      CREATE INDEX IF NOT EXISTS wines_vintage_idx ON wines (vintage);
      CREATE INDEX IF NOT EXISTS wines_producer_idx ON wines (producer);
      CREATE INDEX IF NOT EXISTS wines_region_idx ON wines (region);
      CREATE INDEX IF NOT EXISTS wines_country_idx ON wines (country);
    `;
    
    await pool.query(createTableSQL);
    
    // Check if wines table has records
    const countResult = await pool.query('SELECT COUNT(*) FROM wines');
    const count = parseInt(countResult.rows[0].count);
    
    console.log(`Wine table ready with ${count} existing wines`);
    return count;
  } catch (error) {
    console.error("Error setting up wine table:", error);
    throw error;
  }
}

/**
 * Process wine list, analyzing each line and storing in database
 */
export async function processWineList(wineListText) {
  try {
    await setupWineTable();
    
    console.log(`Processing wine list (${wineListText.length} characters)`);
    
    // Split into lines and filter out very short lines
    const lines = wineListText.split('\n').filter(line => line.trim().length > 3);
    console.log(`Wine list contains ${lines.length} lines to process`);
    
    let processedCount = 0;
    let errorCount = 0;
    let sampleWines = [];
    
    // Process each line as a potential wine
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      try {
        // Extract wine info with GPT-4o
        const wine = await extractWineInfo(line);
        
        if (wine && wine.name) {
          // Store wine in database
          await storeWineInDatabase(wine);
          processedCount++;
          
          // Keep a sample of wines to return (first 20)
          if (sampleWines.length < 20) {
            sampleWines.push(wine);
          }
          
          // Log progress periodically
          if (processedCount % 100 === 0 || i === lines.length - 1) {
            console.log(`Progress: ${processedCount}/${lines.length} wines processed`);
          }
        }
      } catch (error) {
        console.error(`Error processing line: ${line.substring(0, 30)}...`, error);
        errorCount++;
      }
      
      // Small delay to avoid rate limiting (only for large lists)
      if (lines.length > 100 && i < lines.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    // Get final count of wines in database
    const dbCount = await pool.query('SELECT COUNT(*) FROM wines');
    const totalInDatabase = parseInt(dbCount.rows[0].count);
    
    console.log(`Processing complete: ${processedCount} wines processed, ${errorCount} errors`);
    console.log(`Total wines in database: ${totalInDatabase}`);
    
    return {
      success: true,
      processedCount,
      errorCount,
      totalInDatabase,
      sampleWines,
      message: `Successfully processed ${processedCount} wines. Total in database: ${totalInDatabase}`
    };
  } catch (error) {
    console.error("Wine list processing error:", error);
    return {
      success: false,
      message: `Error processing wine list: ${error.message}`,
      processedCount: 0,
      errorCount: 1
    };
  }
}

/**
 * Extract wine information using GPT-4o
 */
async function extractWineInfo(line) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a wine expert AI that extracts structured information from wine list entries.
Extract the following fields from the wine list entry (leave fields empty if information is not present):
- name: The name of the wine
- producer: The producer/winery 
- vintage: The year the wine was produced (as a string)
- region: The specific region
- country: The country of origin
- varietals: The grape varietals (comma-separated)
- wineStyle: The style (red, white, sparkling, etc.)
- restaurant_price: Any price information
- description: A brief description if available

Respond ONLY with a JSON object. No explanations.`
        },
        {
          role: "user",
          content: line
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });
    
    const content = response.choices[0].message.content;
    if (content) {
      const wine = JSON.parse(content);
      return wine;
    }
    
    // Fallback extraction if OpenAI fails
    return {
      name: line,
      vintage: line.match(/\b(19|20)\d{2}\b/)?.[0] || ''
    };
  } catch (error) {
    console.error('Error extracting wine info:', error);
    
    // Return basic info in case of error
    return {
      name: line,
      vintage: line.match(/\b(19|20)\d{2}\b/)?.[0] || ''
    };
  }
}

/**
 * Store wine in PostgreSQL database
 */
async function storeWineInDatabase(wine) {
  // Create a cache key for deduplication
  const vintage = wine.vintage || '';
  const cacheKey = `${wine.name}_${vintage}`.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '');
  
  // Format wine data for database storage
  const wineData = {
    name: { 
      value: wine.name, 
      confidence: 90, 
      source: { type: 'gpt4o', confidence: 90 }, 
      estimated: false 
    },
    vintage: wine.vintage ? { 
      value: wine.vintage, 
      confidence: 85, 
      source: { type: 'gpt4o', confidence: 85 }, 
      estimated: false 
    } : undefined,
    producer: wine.producer ? { 
      value: wine.producer, 
      confidence: 85, 
      source: { type: 'gpt4o', confidence: 85 }, 
      estimated: false 
    } : undefined,
    region: wine.region ? { 
      value: wine.region, 
      confidence: 80, 
      source: { type: 'gpt4o', confidence: 80 }, 
      estimated: false 
    } : undefined,
    country: wine.country ? { 
      value: wine.country, 
      confidence: 85, 
      source: { type: 'gpt4o', confidence: 85 }, 
      estimated: false 
    } : undefined,
    varietals: wine.varietals ? { 
      value: typeof wine.varietals === 'string' ? wine.varietals : wine.varietals.join(', '), 
      confidence: 80, 
      source: { type: 'gpt4o', confidence: 80 }, 
      estimated: false 
    } : undefined,
    wineStyle: wine.wineStyle,
    description: wine.description,
    price: wine.restaurant_price
  };
  
  // Use UPSERT to avoid duplicates
  const query = `
    INSERT INTO wines (
      cache_key, wine_name, vintage, producer, region, country, varietals, wine_data
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
    ) ON CONFLICT (cache_key) 
    DO UPDATE SET
      wine_name = EXCLUDED.wine_name,
      vintage = EXCLUDED.vintage,
      producer = EXCLUDED.producer,
      region = EXCLUDED.region,
      country = EXCLUDED.country,
      varietals = EXCLUDED.varietals,
      wine_data = EXCLUDED.wine_data,
      updated_at = CURRENT_TIMESTAMP
  `;
  
  const params = [
    cacheKey,
    wine.name,
    wine.vintage || null,
    wine.producer || null,
    wine.region || null,
    wine.country || null,
    typeof wine.varietals === 'string' ? wine.varietals : 
      Array.isArray(wine.varietals) ? wine.varietals.join(', ') : null,
    JSON.stringify(wineData)
  ];
  
  await pool.query(query, params);
}

/**
 * Get wines from database with pagination and search
 */
export async function getAllWines(page = 1, pageSize = 20, search = '') {
  try {
    // Validate params
    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;
    
    // Build query
    const params = [];
    let whereClause = '';
    
    // Add search condition if provided
    if (search && search.trim()) {
      whereClause = `
        WHERE 
          wine_name ILIKE $1 OR 
          COALESCE(vintage, '') ILIKE $1 OR 
          COALESCE(producer, '') ILIKE $1 OR 
          COALESCE(region, '') ILIKE $1 OR 
          COALESCE(country, '') ILIKE $1 OR
          COALESCE(varietals, '') ILIKE $1
      `;
      params.push(`%${search}%`);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM wines ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / validPageSize) || 1;
    
    // Get paginated wines
    let dataParams = [...params];
    let dataQuery;
    
    if (params.length > 0) {
      dataParams.push(validPageSize, offset);
      dataQuery = `
        SELECT wine_data 
        FROM wines 
        ${whereClause}
        ORDER BY wine_name, vintage
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
    } else {
      dataParams.push(validPageSize, offset);
      dataQuery = `
        SELECT wine_data 
        FROM wines
        ORDER BY wine_name, vintage
        LIMIT $1 OFFSET $2
      `;
    }
    
    const result = await pool.query(dataQuery, dataParams);
    const wines = result.rows.map(row => row.wine_data);
    
    console.log(`Retrieved ${wines.length} wines from database (page ${validPage}/${totalPages})`);
    
    return {
      wines,
      totalCount,
      totalPages
    };
  } catch (error) {
    console.error("Error retrieving wines:", error);
    return {
      wines: [],
      totalCount: 0,
      totalPages: 0
    };
  }
}