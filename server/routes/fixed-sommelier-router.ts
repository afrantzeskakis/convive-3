import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import pg from 'pg';
const { Pool } = pg;
import OpenAI from 'openai';

// Initialize the router
const router = Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Setup wine table if it doesn't exist
async function setupWineTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wines (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        vintage TEXT,
        producer TEXT,
        region TEXT,
        varietal TEXT,
        price NUMERIC,
        style TEXT,
        aroma TEXT,
        taste TEXT,
        food_pairings TEXT,
        restaurant_id INTEGER,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("Wine table initialized successfully");
  } catch (error) {
    console.error("Error initializing wine table:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Process wine list using GPT-4o and store in database - with batching and delays
async function processWineList(wineListText: string) {
  try {
    await setupWineTable();
    
    console.log(`Processing wine list (${wineListText.length} characters)`);
    
    // Split into lines and filter out very short lines
    const lines = wineListText.split('\n').filter(line => line.trim().length > 3);
    console.log(`Wine list contains ${lines.length} lines to process`);
    
    let processedCount = 0;
    let errorCount = 0;
    let sampleWines: any[] = [];
    
    // Determine batch size based on total lines
    const BATCH_SIZE = lines.length > 1000 ? 30 :
                      lines.length > 500 ? 50 :
                      lines.length > 100 ? 100 : 200;
    
    // Process in batches
    for (let batchStart = 0; batchStart < lines.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, lines.length);
      console.log(`Processing batch ${batchStart + 1}-${batchEnd} of ${lines.length} wines`);
      
      // Process each line in the current batch
      for (let i = batchStart; i < batchEnd; i++) {
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
            if (processedCount % 25 === 0 || i === lines.length - 1) {
              console.log(`Progress: ${processedCount}/${lines.length} wines processed`);
            }
          }
        } catch (error) {
          console.error(`Error processing line: ${line.substring(0, 30)}...`, error instanceof Error ? error.message : String(error));
          errorCount++;
        }
        
        // Add a delay between processing each wine to reduce load
        if (i < batchEnd - 1) {
          const delayTime = lines.length > 1000 ? 300 : 
                           lines.length > 500 ? 200 : 
                           lines.length > 100 ? 100 : 50;
          
          await new Promise(resolve => setTimeout(resolve, delayTime));
        }
      }
      
      // Add a longer pause between batches to let the system recover
      if (batchStart + BATCH_SIZE < lines.length) {
        console.log(`Batch complete. Pausing before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
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
    console.error("Wine list processing error:", error instanceof Error ? error.message : String(error));
    return {
      success: false,
      message: `Error processing wine list: ${error instanceof Error ? error.message : String(error)}`,
      processedCount: 0,
      errorCount: 1,
      totalInDatabase: 0,
      sampleWines: []
    };
  }
}

// Extract wine information from a single line using GPT-4o
async function extractWineInfo(line: string) {
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
            "name": "Full wine name",
            "vintage": "Year or vintage",
            "producer": "Winery or producer",
            "region": "Region of origin",
            "varietal": "Grape varietals",
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
      const wine = JSON.parse(content);
      
      // If empty object or no name, this isn't a wine
      if (!wine.name || Object.keys(wine).length === 0) {
        return null;
      }
      
      return wine;
    } catch (parseError) {
      console.error("Error parsing wine JSON:", parseError);
      return null;
    }
  } catch (error) {
    console.error("Error extracting wine info:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Store wine in database with deduplication
async function storeWineInDatabase(wine: any) {
  try {
    // Check if wine already exists
    const existingWine = await pool.query(
      'SELECT id FROM wines WHERE name = $1 AND producer = $2 AND vintage = $3',
      [wine.name, wine.producer, wine.vintage]
    );

    // If wine already exists, don't insert again
    if (existingWine.rows.length > 0) {
      console.log(`Wine already exists: ${wine.name} (${wine.producer}, ${wine.vintage})`);
      return existingWine.rows[0].id;
    }

    // Insert new wine
    const result = await pool.query(
      `INSERT INTO wines (
        name, vintage, producer, region, 
        varietal, price, style, aroma, 
        taste, food_pairings, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING id`,
      [
        wine.name,
        wine.vintage,
        wine.producer,
        wine.region,
        wine.varietal,
        wine.price ? parseFloat(wine.price) : null,
        wine.style,
        wine.aroma,
        wine.taste,
        wine.food_pairings,
        wine.notes
      ]
    );

    return result.rows[0].id;
  } catch (error) {
    console.error("Error storing wine in database:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Get all wines from database with pagination and search
async function getAllWines(page = 1, pageSize = 20, search = '') {
  try {
    let query = 'SELECT * FROM wines';
    const params: any[] = [];
    
    // Add search condition if provided
    if (search) {
      query += ' WHERE name ILIKE $1 OR producer ILIKE $1 OR region ILIKE $1 OR varietal ILIKE $1';
      params.push(`%${search}%`);
    }
    
    // Add pagination
    query += ' ORDER BY name LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(pageSize);
    params.push((page - 1) * pageSize);
    
    // Execute query
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM wines';
    if (search) {
      countQuery += ' WHERE name ILIKE $1 OR producer ILIKE $1 OR region ILIKE $1 OR varietal ILIKE $1';
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
  } catch (error) {
    console.error("Error retrieving wines:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Extract text from uploaded file
async function extractTextFromFile(filePath: string): Promise<string> {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return text;
  } catch (error) {
    console.error("Error reading file:", error instanceof Error ? error.message : String(error));
    throw new Error('Failed to read uploaded file');
  }
}

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
}

// Check if OpenAI API is working
function checkSommelierService(req: Request, res: Response, next: NextFunction) {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      success: false,
      message: 'Sommelier service is not available - missing OpenAI API key'
    });
  }
  next();
}

// Status endpoint
router.get('/status', (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  
  res.json({
    success: true,
    status: hasApiKey ? 'available' : 'unavailable',
    message: hasApiKey ? 'Sommelier service is available' : 'Sommelier service is unavailable - missing API key'
  });
});

// Process wine list endpoint
router.post('/ingest-wine-list', checkSommelierService, upload.single('file'), async (req, res) => {
  try {
    let wineListText = '';
    
    // Get wine list text from request body or file
    if (req.body.text) {
      wineListText = req.body.text;
    } else if (req.file) {
      wineListText = await extractTextFromFile(req.file.path);
      
      // Clean up uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No wine list text or file provided'
      });
    }
    
    if (!wineListText || wineListText.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Wine list text is too short or invalid'
      });
    }
    
    // Process wine list
    const processResult = await processWineList(wineListText);
    
    if (!processResult.success) {
      return res.status(500).json({
        success: false,
        message: processResult.message
      });
    }
    
    // Return success with sample wines
    return res.json({
      success: true,
      message: processResult.message,
      wines: processResult.sampleWines,
      stats: {
        processed: processResult.processedCount,
        errors: processResult.errorCount,
        databaseTotal: processResult.totalInDatabase
      }
    });
  } catch (error) {
    console.error('Error processing wine list:', error instanceof Error ? error.message : String(error));
    return res.status(500).json({
      success: false,
      message: `Error processing wine list: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

// Get wines endpoint with pagination and search
router.get('/wines', async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;
    const search = req.query.search as string || '';
    
    const result = await getAllWines(page, pageSize, search);
    
    res.json({
      success: true,
      wines: result.wines,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error retrieving wines:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      message: `Error retrieving wines: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

// Get wine by ID endpoint
router.get('/wines/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wine ID'
      });
    }
    
    const result = await pool.query('SELECT * FROM wines WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Wine not found'
      });
    }
    
    res.json({
      success: true,
      wine: result.rows[0]
    });
  } catch (error) {
    console.error('Error retrieving wine:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      message: `Error retrieving wine: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

export default router;