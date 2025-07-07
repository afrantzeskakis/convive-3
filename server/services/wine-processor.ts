/**
 * Wine List Processor
 * 
 * Processes wine lists using OpenAI GPT-4o and stores data in the PostgreSQL database.
 * Handles large lists with batching and throttling to prevent server crashes.
 */

import pg from 'pg';
import { OpenAI } from 'openai';

// Database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Wine interface
interface Wine {
  wine_name: string;
  vintage?: string | null;
  producer?: string | null;
  region?: string | null;
  country?: string | null;
  varietals?: string | null;
  wine_data?: any;
  cache_key?: string;
}

// Progress update interface
interface ProgressUpdate {
  total: number;
  processed: number;
  errors: number;
  percent: number;
  currentBatch: number;
  totalBatches: number;
  status: 'pending' | 'processing' | 'complete' | 'error';
  message: string;
  startTime?: Date;
  lastUpdateTime: Date;
}

// Process result interface
interface ProcessResult {
  success: boolean;
  processedCount: number;
  errorCount: number;
  totalInDatabase: number;
  sampleWines: Wine[];
  message: string;
  progressId?: string;
}

// Global maps to store processing progress and results
const progressUpdates = new Map<string, ProgressUpdate>();
const processResults = new Map<string, ProcessResult>();

/**
 * Generate a unique ID for progress tracking
 */
function generateProgressId(): string {
  return `wine-process-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Update the progress for a specific process
 */
function updateProgress(progressId: string, updates: Partial<ProgressUpdate>): void {
  const currentProgress = progressUpdates.get(progressId);
  
  if (currentProgress) {
    progressUpdates.set(progressId, {
      ...currentProgress,
      ...updates,
      lastUpdateTime: new Date()
    });
  }
}

/**
 * Get the current progress for a process
 */
export function getProcessProgress(progressId: string): ProgressUpdate | null {
  return progressUpdates.get(progressId) || null;
}

/**
 * Start the wine list processing in the background and return a progress ID
 * for tracking
 */
export function startWineListProcessing(wineListText: string): string {
  const progressId = generateProgressId();
  
  // Initialize progress tracking
  progressUpdates.set(progressId, {
    total: 0, // Will be updated after parsing the text
    processed: 0,
    errors: 0,
    percent: 0,
    currentBatch: 0,
    totalBatches: 0,
    status: 'pending',
    message: 'Initializing wine list processing...',
    startTime: new Date(),
    lastUpdateTime: new Date()
  });
  
  // Process in background
  (async () => {
    try {
      const result = await processWineList(wineListText);
      // Store the result for later retrieval
      processResults.set(progressId, result);
    } catch (error: any) {
      console.error("Background wine processing error:", error);
      
      // Update progress to error state
      updateProgress(progressId, {
        status: 'error',
        message: `Error processing wine list: ${error?.message || String(error)}`
      });
      
      // Store error result
      processResults.set(progressId, {
        success: false,
        processedCount: 0,
        errorCount: 1,
        totalInDatabase: 0,
        sampleWines: [],
        message: `Error processing wine list: ${error?.message || String(error)}`,
        progressId
      });
    }
  })();
  
  return progressId;
}

/**
 * Get the final results for a completed process
 */
export function getProcessResults(progressId: string): ProcessResult | null {
  return processResults.get(progressId) || null;
}

/**
 * Setup wine table in the database
 */
export async function setupWineTable(): Promise<void> {
  try {
    // Check if table exists
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wines')"
    );
    
    if (!tableCheck.rows[0].exists) {
      console.log("Creating wines table...");
      await pool.query(`
        CREATE TABLE wines (
          id SERIAL PRIMARY KEY,
          wine_name TEXT NOT NULL,
          vintage TEXT,
          producer TEXT,
          region TEXT,
          country TEXT,
          varietals TEXT,
          wine_data JSONB,
          cache_key TEXT UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("Wines table created successfully");
    } else {
      console.log("Wines table already exists");
      
      // Check if cache_key column exists
      const cacheKeyCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wines' AND column_name = 'cache_key')"
      );
      
      if (!cacheKeyCheck.rows[0].exists) {
        console.log("Adding cache_key column to wines table...");
        await pool.query("ALTER TABLE wines ADD COLUMN cache_key TEXT");
        await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS wines_cache_key_idx ON wines (cache_key) WHERE cache_key IS NOT NULL");
        console.log("Added cache_key column");
      }
    }
  } catch (error) {
    console.error("Error setting up wine table:", error);
    throw error;
  }
}

/**
 * Process a wine list text into structured wine data with real-time progress tracking
 */
export async function processWineList(wineListText: string): Promise<ProcessResult> {
  // Generate progress ID for tracking
  const progressId = generateProgressId();
  
  try {
    // Make sure our table exists
    await setupWineTable();
    
    console.log(`Processing wine list (${wineListText.length} characters)`);
    
    // Split into lines and filter out very short lines
    const lines = wineListText.split('\n').filter(line => line.trim().length > 3);
    console.log(`Wine list contains ${lines.length} lines to process`);
    
    let processedCount = 0;
    let errorCount = 0;
    let sampleWines: Wine[] = [];
    
    // Determine batch size based on list size
    const BATCH_SIZE = lines.length > 1000 ? 25 :
                      lines.length > 500 ? 50 :
                      lines.length > 100 ? 100 : 200;
    
    const totalBatches = Math.ceil(lines.length / BATCH_SIZE);
    
    // Initialize progress tracking
    progressUpdates.set(progressId, {
      total: lines.length,
      processed: 0,
      errors: 0,
      percent: 0,
      currentBatch: 1,
      totalBatches,
      status: 'processing',
      message: 'Starting wine list processing...',
      startTime: new Date(),
      lastUpdateTime: new Date()
    });
    
    // Process in batches
    for (let batchStart = 0; batchStart < lines.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, lines.length);
      const currentBatch = Math.floor(batchStart / BATCH_SIZE) + 1;
      
      console.log(`Processing batch ${currentBatch} of ${totalBatches} (${batchStart + 1}-${batchEnd} of ${lines.length} lines)`);
      
      // Update progress at start of batch
      updateProgress(progressId, {
        message: `Processing batch ${currentBatch} of ${totalBatches}...`,
        currentBatch,
        percent: Math.round((processedCount / lines.length) * 100)
      });
      
      // Process each line in current batch
      for (let i = batchStart; i < batchEnd; i++) {
        const line = lines[i].trim();
        
        try {
          // Extract wine info with GPT-4o
          const wine = await extractWineInfo(line);
          
          if (wine && wine.wine_name) {
            // Store wine in database
            await storeWineInDatabase(wine);
            processedCount++;
            
            // Keep a sample of wines to return
            if (sampleWines.length < 20) {
              sampleWines.push(wine);
            }
            
            // Update progress more frequently for better user feedback
            if (processedCount % 5 === 0 || i === lines.length - 1) {
              const percent = Math.round((processedCount / lines.length) * 100);
              updateProgress(progressId, {
                processed: processedCount,
                percent,
                message: `Processing wines: ${processedCount} of ${lines.length} (${percent}%)`
              });
            }
            
            // Log progress periodically to console
            if (processedCount % 25 === 0 || i === batchEnd - 1) {
              console.log(`Progress: ${processedCount}/${lines.length} wines processed (${Math.round((processedCount / lines.length) * 100)}%)`);
            }
          }
        } catch (error: any) {
          console.error(`Error processing line: ${line.substring(0, 30)}...`, error?.message || error);
          errorCount++;
          
          // Update error count in progress
          updateProgress(progressId, {
            errors: errorCount,
            message: `Processing wines: ${processedCount} of ${lines.length} (${errorCount} errors)`
          });
        }
        
        // Add delay between processing each wine
        if (i < batchEnd - 1) {
          const delayTime = lines.length > 1000 ? 250 : 
                          lines.length > 500 ? 150 : 
                          lines.length > 100 ? 100 : 50;
          
          await new Promise(resolve => setTimeout(resolve, delayTime));
        }
      }
      
      // Add longer pause between batches
      if (batchStart + BATCH_SIZE < lines.length) {
        console.log(`Batch ${currentBatch} complete. Pausing before next batch...`);
        updateProgress(progressId, {
          message: `Batch ${currentBatch} complete. Preparing next batch...`,
          processed: processedCount,
          percent: Math.round((processedCount / lines.length) * 100)
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Get total count in database
    const dbCount = await pool.query('SELECT COUNT(*) FROM wines');
    const totalInDatabase = parseInt(dbCount.rows[0].count);
    
    console.log(`Processing complete: ${processedCount} wines processed, ${errorCount} errors`);
    console.log(`Total wines in database: ${totalInDatabase}`);
    
    // Update progress to complete
    updateProgress(progressId, {
      status: 'complete',
      processed: processedCount,
      errors: errorCount,
      percent: 100,
      message: `Processing complete: ${processedCount} wines processed, ${errorCount} errors`
    });
    
    return {
      success: true,
      processedCount,
      errorCount,
      totalInDatabase,
      sampleWines,
      message: `Successfully processed ${processedCount} wines. Total in database: ${totalInDatabase}`,
      progressId
    };
  } catch (error: any) {
    console.error("Wine list processing error:", error?.message || error);
    
    // Update progress to error state if progress tracking was initiated
    if (progressId) {
      updateProgress(progressId, {
        status: 'error',
        message: `Error processing wine list: ${error?.message || String(error)}`
      });
    }
    
    return {
      success: false,
      message: `Error processing wine list: ${error?.message || String(error)}`,
      processedCount: 0,
      errorCount: 1,
      totalInDatabase: 0,
      sampleWines: [],
      progressId
    };
  }
}

/**
 * Extract wine information from a single line of text
 */
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
        vintage: parsedData.vintage || null,
        producer: parsedData.producer || null,
        region: parsedData.region || null,
        country: parsedData.country || null,
        varietals: parsedData.varietals || null,
        // Store additional fields as JSON
        wine_data: JSON.stringify({
          price: parsedData.price || null,
          style: parsedData.style || null,
          aroma: parsedData.aroma || null,
          taste: parsedData.taste || null,
          food_pairings: parsedData.food_pairings || null
        })
      };
      
      // Generate a cache key to avoid duplicates
      wine.cache_key = `${wine.wine_name}|${wine.vintage || ''}|${wine.producer || ''}`;
      
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

/**
 * Store wine in database with deduplication
 */
export async function storeWineInDatabase(wine: Wine): Promise<number> {
  try {
    // Make sure wine has a cache key
    if (!wine.cache_key) {
      wine.cache_key = `${wine.wine_name}|${wine.vintage || ''}|${wine.producer || ''}`;
    }
    
    // Check if wine already exists
    const existingWine = await pool.query(
      'SELECT id FROM wines WHERE cache_key = $1',
      [wine.cache_key]
    );

    // If wine already exists, don't insert again
    if (existingWine.rows.length > 0) {
      console.log(`Wine already exists: ${wine.wine_name}`);
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
        wine.cache_key
      ]
    );

    return result.rows[0].id;
  } catch (error: any) {
    console.error("Error storing wine in database:", error?.message || error);
    throw error;
  }
}

/**
 * Get all wines with pagination and search
 */
export async function getAllWines(page = 1, pageSize = 20, search = '') {
  try {
    let query = 'SELECT * FROM wines';
    const params: any[] = [];
    
    if (search) {
      query += ' WHERE wine_name ILIKE $1 OR producer ILIKE $1 OR region ILIKE $1 OR varietals ILIKE $1';
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY wine_name LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(pageSize);
    params.push((page - 1) * pageSize);
    
    const result = await pool.query(query, params);
    
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

/**
 * Get wine by ID
 */
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

/**
 * Simple test function to analyze a single wine line
 */
export async function analyzeSingleWine(line: string) {
  try {
    await setupWineTable();
    const wine = await extractWineInfo(line);
    
    if (!wine) {
      return {
        success: false,
        message: "Could not extract wine information"
      };
    }
    
    const wineId = await storeWineInDatabase(wine);
    return {
      success: true,
      wine,
      id: wineId,
      message: "Wine analyzed and stored successfully"
    };
  } catch (error: any) {
    console.error("Error analyzing wine:", error);
    return {
      success: false,
      message: `Error analyzing wine: ${error?.message || String(error)}`
    };
  }
}