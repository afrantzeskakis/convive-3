/**
 * Wine Processing Service (Updated)
 * 
 * Processes wine lists with GPT-4o and stores data in the wines table
 * with the correct column structure
 */

import fs from 'fs';
import pg from 'pg';
import OpenAI from 'openai';

// Initialize PostgreSQL connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Interface for wine data matching the database structure
interface Wine {
  wine_name: string;
  vintage?: string;
  producer?: string;
  region?: string;
  country?: string;
  varietals?: string;
  wine_data?: any;
}

// Process result interface
interface ProcessResult {
  success: boolean;
  processedCount: number;
  errorCount: number;
  totalInDatabase: number;
  sampleWines: Wine[];
  message: string;
}

// Process wine list - with batching and throttling
export async function processWineList(wineListText: string): Promise<ProcessResult> {
  try {
    console.log(`Processing wine list (${wineListText.length} characters)`);
    
    // Split into lines and filter out very short lines
    const lines = wineListText.split('\n').filter(line => line.trim().length > 3);
    console.log(`Wine list contains ${lines.length} lines to process`);
    
    let processedCount = 0;
    let errorCount = 0;
    let sampleWines: Wine[] = [];
    
    // Determine batch size based on total lines
    const BATCH_SIZE = lines.length > 1000 ? 25 :
                      lines.length > 500 ? 50 :
                      lines.length > 100 ? 100 : 200;
    
    // Process in batches to avoid memory issues
    for (let batchStart = 0; batchStart < lines.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, lines.length);
      console.log(`Processing batch ${batchStart + 1}-${batchEnd} of ${lines.length} lines`);
      
      // Process each line in current batch
      for (let i = batchStart; i < batchEnd; i++) {
        const line = lines[i].trim();
        
        try {
          // Extract wine info from line
          const wine = await extractWineInfo(line);
          
          if (wine && wine.wine_name) {
            // Store wine in database
            await storeWineInDatabase(wine);
            processedCount++;
            
            // Keep a sample of wines to return
            if (sampleWines.length < 20) {
              sampleWines.push(wine);
            }
            
            // Log progress periodically
            if (processedCount % 25 === 0 || i === batchEnd - 1) {
              console.log(`Progress: ${processedCount}/${lines.length} wines processed`);
            }
          }
        } catch (error: any) {
          console.error(`Error processing line: ${line.substring(0, 30)}...`, error?.message || error);
          errorCount++;
        }
        
        // Add delay between processing each line to prevent rate limiting and reduce memory pressure
        if (i < batchEnd - 1) {
          const delayTime = lines.length > 1000 ? 250 : 
                           lines.length > 500 ? 150 : 
                           lines.length > 100 ? 100 : 50;
          
          await new Promise(resolve => setTimeout(resolve, delayTime));
        }
      }
      
      // Add longer pause between batches
      if (batchStart + BATCH_SIZE < lines.length) {
        console.log(`Batch complete. Pausing before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
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
  } catch (error: any) {
    console.error("Wine list processing error:", error?.message || error);
    return {
      success: false,
      message: `Error processing wine list: ${error?.message || String(error)}`,
      processedCount: 0,
      errorCount: 1,
      totalInDatabase: 0,
      sampleWines: []
    };
  }
}

// Extract wine info from a single line using GPT-4o
export async function extractWineInfo(line: string): Promise<Wine | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: "You are a wine sommelier expert. Extract structured wine information from the text."
        },
        {
          role: "user",
          content: `Extract wine information from this text: "${line}". 
          If this doesn't appear to be a wine entry, respond with {}.
          Otherwise, return a JSON object with these fields (leave empty if not present):
          {
            "wine_name": "Full wine name",
            "vintage": "Year or vintage",
            "producer": "Winery or producer",
            "region": "Region of origin",
            "country": "Country of origin",
            "varietals": "Grape varietals",
            "price": "Price (numeric only, no currency)",
            "style": "Wine style (red, white, rose, sparkling, etc)",
            "aroma": "Brief description of aromas",
            "taste": "Brief description of taste profile",
            "food_pairings": "Recommended food pairings"
          }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return null;
    }

    try {
      const parsedData = JSON.parse(content);
      
      // If empty object or no wine_name, this isn't a wine
      if (!parsedData.wine_name || Object.keys(parsedData).length === 0) {
        return null;
      }
      
      // Format the data to match our database structure
      const wine: Wine = {
        wine_name: parsedData.wine_name,
        vintage: parsedData.vintage,
        producer: parsedData.producer,
        region: parsedData.region,
        country: parsedData.country,
        varietals: parsedData.varietals,
        // Store all the additional fields as JSON in wine_data
        wine_data: JSON.stringify({
          price: parsedData.price,
          style: parsedData.style,
          aroma: parsedData.aroma,
          taste: parsedData.taste,
          food_pairings: parsedData.food_pairings
        })
      };
      
      return wine;
    } catch (parseError) {
      console.error("Error parsing wine JSON:", parseError);
      return null;
    }
  } catch (error: any) {
    console.error("Error extracting wine info:", error?.message || error);
    throw error;
  }
}

// Store wine in database with deduplication - updated for the actual table structure
export async function storeWineInDatabase(wine: Wine): Promise<number> {
  try {
    // Generate a cache key to avoid duplicates
    const cacheKey = `${wine.wine_name}|${wine.vintage || ''}|${wine.producer || ''}`;
    
    // Check if wine already exists
    const existingWine = await pool.query(
      'SELECT id FROM wines WHERE cache_key = $1',
      [cacheKey]
    );

    // If wine already exists, don't insert again
    if (existingWine.rows.length > 0) {
      console.log(`Wine already exists: ${wine.wine_name} (${wine.producer}, ${wine.vintage})`);
      return existingWine.rows[0].id;
    }

    // Insert new wine
    const result = await pool.query(
      `INSERT INTO wines (
        wine_name, vintage, producer, region, 
        country, varietals, wine_data, cache_key
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING id`,
      [
        wine.wine_name,
        wine.vintage,
        wine.producer,
        wine.region,
        wine.country,
        wine.varietals,
        wine.wine_data,
        cacheKey
      ]
    );

    return result.rows[0].id;
  } catch (error: any) {
    console.error("Error storing wine in database:", error?.message || error);
    throw error;
  }
}

// Get all wines with pagination and search
export async function getAllWines(page = 1, pageSize = 20, search = '') {
  try {
    let query = 'SELECT * FROM wines';
    const params: any[] = [];
    
    // Add search condition if provided
    if (search) {
      query += ' WHERE wine_name ILIKE $1 OR producer ILIKE $1 OR region ILIKE $1 OR varietals ILIKE $1';
      params.push(`%${search}%`);
    }
    
    // Add pagination
    query += ' ORDER BY wine_name LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(pageSize);
    params.push((page - 1) * pageSize);
    
    // Execute query
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM wines';
    if (search) {
      countQuery += ' WHERE wine_name ILIKE $1 OR producer ILIKE $1 OR region ILIKE $1 OR varietals ILIKE $1';
    }
    
    const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);
    const total = parseInt(countResult.rows[0].count);
    
    return {
      wines: result.rows,
      pagination: {
        total,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
        pageSize
      }
    };
  } catch (error: any) {
    console.error("Error retrieving wines:", error?.message || error);
    throw error;
  }
}

// Get wine by ID
export async function getWineById(id: number) {
  try {
    const result = await pool.query('SELECT * FROM wines WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error: any) {
    console.error("Error retrieving wine:", error?.message || error);
    throw error;
  }
}