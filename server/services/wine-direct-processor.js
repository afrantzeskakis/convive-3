/**
 * Direct Wine Processor Service
 * 
 * Uses GPT-4o to process wine lists and store them directly in the PostgreSQL database.
 * This implementation ensures all processed wines are properly stored.
 */

// Import required modules
const { Pool } = require('pg');
const { OpenAI } = require('openai');

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Process a wine list and store each wine in the database
 * @param {string} wineListText - The wine list text with one wine per line
 * @returns {Promise<Object>} Processing results with success status and counts
 */
async function processWineList(wineListText) {
  try {
    console.log(`Processing wine list (${wineListText.length} characters)`);
    
    // Split into lines
    const lines = wineListText.split('\n').filter(line => line.trim().length > 0);
    console.log(`Wine list contains ${lines.length} lines`);
    
    let processedCount = 0;
    let errorCount = 0;
    let processedWines = [];
    
    // Process each line as a potential wine
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip very short lines
      if (line.length < 4) continue;
      
      try {
        // Extract wine info with GPT-4o
        const wine = await extractWineInfo(line);
        
        if (wine && wine.name) {
          // Store in database
          await storeWineInDatabase(wine);
          processedCount++;
          processedWines.push(wine);
          
          // Log progress for large batches
          if (processedCount % 100 === 0 || i === lines.length - 1) {
            console.log(`Progress: ${processedCount}/${lines.length} wines processed`);
          }
        }
      } catch (error) {
        console.error(`Error processing line: ${line.substring(0, 30)}...`, error.message);
        errorCount++;
      }
      
      // Add a small delay between API calls to avoid rate limiting
      if (i < lines.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    // Count wines in database
    const countResult = await pool.query('SELECT COUNT(*) FROM wines');
    const totalInDatabase = parseInt(countResult.rows[0].count);
    
    console.log('\nProcessing complete!');
    console.log(`Successfully processed ${processedCount} wines with ${errorCount} errors`);
    console.log(`Total wines now in database: ${totalInDatabase}`);
    
    return {
      success: true,
      processedCount,
      errorCount,
      totalInDatabase,
      processedWines: processedWines.slice(0, 20), // Return only first 20 for UI display
      message: `Successfully processed ${processedCount} wines. Total in database: ${totalInDatabase}`
    };
    
  } catch (error) {
    console.error('Error processing wine list:', error.message);
    return {
      success: false,
      processedCount: 0,
      errorCount: 1,
      message: `Error: ${error.message}`
    };
  }
}

/**
 * Extract wine information from a line using GPT-4o
 * @param {string} line - The line of text containing wine information
 * @returns {Promise<Object>} Extracted wine information
 */
async function extractWineInfo(line) {
  try {
    // For shorter lines, extract basic info before calling API
    let basicWine = {
      name: line
    };
    
    // Look for vintage year (4 digits)
    const vintageMatch = line.match(/\b(19|20)\d{2}\b/);
    if (vintageMatch) {
      basicWine.vintage = vintageMatch[0];
      // Clean up the name
      basicWine.name = line.replace(vintageMatch[0], '').trim()
        .replace(/\s{2,}/g, ' ')
        .replace(/[,.;:]+$/, '');
    }
    
    // If OpenAI API key is available, enhance with GPT-4o
    if (process.env.OPENAI_API_KEY) {
      console.log(`Enhancing with GPT-4o: ${line.substring(0, 30)}...`);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model released May 13, 2024
        messages: [
          {
            role: "system",
            content: `You are a wine expert AI that extracts structured information from wine list entries.
Extract the following fields from the wine list entry (leave fields empty if information is not present):
- name: The name of the wine
- producer: The producer/winery 
- vintage: The year the wine was produced
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
        const enhancedWine = JSON.parse(content);
        return enhancedWine;
      }
    }
    
    // Return basic wine info if GPT-4o enhancement failed
    return basicWine;
  } catch (error) {
    console.error('Error extracting wine info:', error.message);
    // Return basic info instead of failing
    return {
      name: line,
      vintage: line.match(/\b(19|20)\d{2}\b/)?.[0]
    };
  }
}

/**
 * Store wine in PostgreSQL database
 * @param {Object} wine - The wine object to store
 * @returns {Promise<void>}
 */
async function storeWineInDatabase(wine) {
  try {
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
      description: wine.description,
      wineStyle: wine.wineStyle,
      bodyRating: wine.bodyRating,
      tanninRating: wine.tanninRating,
      acidityRating: wine.acidityRating
    };
    
    // Store wine in database with UPSERT logic
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
        wine_data = EXCLUDED.wine_data
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
  } catch (error) {
    console.error(`Error storing wine in database: ${wine.name}`, error.message);
    throw error;
  }
}

/**
 * Get all wines from the database with pagination and search
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Number of wines per page
 * @param {string} search - Optional search term
 * @returns {Promise<Object>} Paginated wines and metadata
 */
async function getAllWines(page = 1, pageSize = 20, search = '') {
  try {
    // Validate pagination params
    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;
    
    // Build query parameters
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
    
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM wines ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / validPageSize) || 1;
    
    // Get paginated wines
    let dataParams = [...params];
    if (params.length > 0) {
      dataParams.push(validPageSize, offset);
      var dataQuery = `
        SELECT wine_data 
        FROM wines 
        ${whereClause}
        ORDER BY wine_name, vintage
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
    } else {
      dataParams.push(validPageSize, offset);
      var dataQuery = `
        SELECT wine_data 
        FROM wines
        ORDER BY wine_name, vintage
        LIMIT $1 OFFSET $2
      `;
    }
    
    // Execute query and format results
    const result = await pool.query(dataQuery, dataParams);
    const wines = result.rows.map(row => row.wine_data);
    
    console.log(`Retrieved ${wines.length} wines from database (page ${validPage}/${totalPages})`);
    console.log(`Total wines in database: ${totalCount}`);
    
    return {
      wines,
      totalCount,
      totalPages
    };
  } catch (error) {
    console.error('Error retrieving wines from database:', error);
    return {
      wines: [],
      totalCount: 0,
      totalPages: 0
    };
  }
}

// Export functions
module.exports = {
  processWineList,
  getAllWines
};