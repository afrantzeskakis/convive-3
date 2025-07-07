/**
 * Direct Wine List Processing Script using GPT-4o
 * 
 * This script provides a direct way to process wine lists with GPT-4o
 * and store them in the PostgreSQL database.
 * 
 * Run this script with Node.js:
 * node scripts/wine-upload-via-gpt4o.js <path-to-wine-list.txt>
 */

require('dotenv').config();
const fs = require('fs');
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

// Process a wine list text file
async function processWineList(filePath) {
  try {
    console.log(`Processing wine list from ${filePath}`);
    
    // Read the wine list file
    const wineListText = fs.readFileSync(filePath, 'utf8');
    
    // Split into lines
    const lines = wineListText.split('\n').filter(line => line.trim().length > 0);
    console.log(`Wine list contains ${lines.length} lines`);
    
    let processedCount = 0;
    let errorCount = 0;
    
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
    
    // Clean up
    await pool.end();
    
  } catch (error) {
    console.error('Error processing wine list:', error.message);
    process.exit(1);
  }
}

// Extract wine information from a line using GPT-4o
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

// Store wine in PostgreSQL database
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

// Check command-line arguments
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.log('Usage: node scripts/wine-upload-via-gpt4o.js <path-to-wine-list.txt>');
  process.exit(1);
}

// Run the script
processWineList(args[0]);