/**
 * Sommelier API Routes
 * 
 * Provides API endpoints for:
 * - Status checks
 * - Wine list processing
 * - Wine database queries
 * - Wine analysis
 */

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import pg from 'pg';
import * as wineProcessor from '../services/wine-processor';
import { verifyAllWines, getVerificationStats } from '../services/wine-verification-service.js';
import { startBackgroundVerification, stopBackgroundVerification, getVerificationProgress } from '../services/background-wine-verification.js';

const router = express.Router();
// Set up multer for file uploads with size limit
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Check if OpenAI API is available
function checkApiKey(req: Request, res: Response, next: NextFunction) {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      success: false,
      message: "OpenAI API key is missing. Sommelier service is not available."
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

// Analyze a single wine line
router.post('/analyze-wine', checkApiKey, express.json(), async (req, res) => {
  try {
    if (!req.body.text) {
      return res.status(400).json({
        success: false,
        message: "No wine text provided. Please include a 'text' field in your request."
      });
    }
    
    const result = await wineProcessor.analyzeSingleWine(req.body.text);
    res.json(result);
  } catch (error: any) {
    console.error("Error analyzing wine:", error);
    res.status(500).json({
      success: false,
      message: `Error analyzing wine: ${error?.message || String(error)}`
    });
  }
});

// Upload wine list as text
router.post('/ingest-wine-list', checkApiKey, express.json(), async (req, res) => {
  try {
    console.log("Received wine list upload request:", req.body);
    
    if (!req.body.text && !req.body.wineListText) {
      return res.status(400).json({
        success: false,
        message: "No wine list text provided. Please include a 'text' or 'wineListText' field in your request."
      });
    }
    
    const wineListText = req.body.text || req.body.wineListText;
    
    if (wineListText.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Wine list text is too short. Please provide a longer list."
      });
    }
    
    const result = await wineProcessor.processWineList(wineListText);
    res.json(result);
  } catch (error: any) {
    console.error("Error processing wine list:", error);
    res.status(500).json({
      success: false,
      message: `Error processing wine list: ${error?.message || String(error)}`
    });
  }
});

// Upload wine list file
router.post('/ingest-wine-list-file', checkApiKey, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please provide a file."
      });
    }
    
    // Read file content
    let wineListText: string;
    try {
      wineListText = fs.readFileSync(req.file.path, 'utf8');
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: `Could not read file: ${error?.message || String(error)}`
      });
    }
    
    if (wineListText.length < 10) {
      return res.status(400).json({
        success: false,
        message: "File content is too short. Please provide a file with more wine data."
      });
    }
    
    const result = await wineProcessor.processWineList(wineListText);
    res.json(result);
  } catch (error: any) {
    console.error("Error processing wine list file:", error);
    res.status(500).json({
      success: false,
      message: `Error processing wine list file: ${error?.message || String(error)}`
    });
  }
});

// Get all wines with pagination and search
router.get('/wines', async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;
    const search = req.query.search as string || '';
    
    const result = await wineProcessor.getAllWines(page, pageSize, search);
    res.json({
      success: true,
      wines: result.wines,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error("Error retrieving wines:", error);
    res.status(500).json({
      success: false,
      message: `Error retrieving wines: ${error?.message || String(error)}`
    });
  }
});

// Get wine by ID
router.get('/wines/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wine ID. Please provide a numeric ID."
      });
    }
    
    const wine = await wineProcessor.getWineById(id);
    
    if (!wine) {
      return res.status(404).json({
        success: false,
        message: "Wine not found. The requested wine does not exist."
      });
    }
    
    res.json({
      success: true,
      wine
    });
  } catch (error: any) {
    console.error("Error retrieving wine:", error);
    res.status(500).json({
      success: false,
      message: `Error retrieving wine: ${error?.message || String(error)}`
    });
  }
});

// Unified endpoint to process wine list (accepts both text and file uploads)
router.post('/process-wine-list', checkApiKey, upload.single('wineListFile'), async (req, res) => {
  try {
    let wineListText: string = '';
    
    // Check if this is a file upload
    if (req.file) {
      console.log("Processing file upload:", req.file.originalname);
      
      try {
        wineListText = fs.readFileSync(req.file.path, 'utf8');
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: `Could not read file: ${error?.message || String(error)}`
        });
      }
    } 
    // Check if this is a JSON body with wineListText
    else if (req.body.wineListText) {
      console.log("Processing text upload");
      wineListText = req.body.wineListText;
    }
    // Neither file nor text was provided
    else {
      return res.status(400).json({
        success: false,
        message: "No wine list provided. Please include a file upload or wineListText in the request."
      });
    }
    
    if (wineListText.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Wine list is too short. Please provide more wine data."
      });
    }
    
    // Start the processing and return a tracking ID so client can poll for progress
    const progressId = wineProcessor.startWineListProcessing(wineListText);
    
    res.json({
      success: true,
      message: "Wine list processing started",
      progressId
    });
  } catch (error: any) {
    console.error("Error processing wine list:", error);
    res.status(500).json({
      success: false,
      message: `Error processing wine list: ${error?.message || String(error)}`
    });
  }
});

// Get processing progress by ID
router.get('/progress/:progressId', async (req, res) => {
  try {
    const { progressId } = req.params;
    
    if (!progressId) {
      return res.status(400).json({
        success: false,
        message: "Missing progress ID"
      });
    }
    
    const progress = wineProcessor.getProcessProgress(progressId);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress tracking not found for the given ID"
      });
    }
    
    res.json(progress);
  } catch (error: any) {
    console.error("Error retrieving progress:", error);
    res.status(500).json({
      success: false,
      message: `Error retrieving progress: ${error?.message || String(error)}`
    });
  }
});

// Get final results by progress ID
router.get('/results/:progressId', async (req, res) => {
  try {
    const { progressId } = req.params;
    
    if (!progressId) {
      return res.status(400).json({
        success: false,
        message: "Missing progress ID"
      });
    }
    
    const results = wineProcessor.getProcessResults(progressId);
    
    if (!results) {
      return res.status(404).json({
        success: false,
        message: "Results not found for the given progress ID"
      });
    }
    
    res.json(results);
  } catch (error: any) {
    console.error("Error retrieving results:", error);
    res.status(500).json({
      success: false,
      message: `Error retrieving results: ${error?.message || String(error)}`
    });
  }
});

// Verify wines with Vivino data in background
router.post('/verify-wines', checkApiKey, async (req, res) => {
  try {
    const batchSize = req.body.batchSize || 10;
    
    if (!process.env.APIFY_API_TOKEN) {
      return res.status(503).json({
        success: false,
        message: "Wine verification unavailable - APIFY_API_TOKEN not configured"
      });
    }
    
    // Start verification in background
    verifyAllWines(batchSize).catch(error => {
      console.error("Background wine verification error:", error);
    });
    
    res.json({
      success: true,
      message: `Wine verification started for ${batchSize} wines with authentic Vivino data`
    });
  } catch (error: any) {
    console.error("Error starting wine verification:", error);
    res.status(500).json({
      success: false,
      message: `Error starting wine verification: ${error?.message || String(error)}`
    });
  }
});

// Get verification statistics
router.get('/verification-stats', async (req, res) => {
  try {
    const stats = await getVerificationStats();
    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error("Error getting verification stats:", error);
    res.status(500).json({
      success: false,
      message: `Error getting verification stats: ${error?.message || String(error)}`
    });
  }
});

// Start background wine verification
router.post('/start-background-verification', checkApiKey, async (req, res) => {
  try {
    const batchSize = req.body.batchSize || 20;
    
    if (!process.env.APIFY_API_TOKEN) {
      return res.status(503).json({
        success: false,
        message: "Background verification unavailable - APIFY_API_TOKEN not configured"
      });
    }
    
    await startBackgroundVerification(batchSize);
    
    res.json({
      success: true,
      message: `Background wine verification started with batch size ${batchSize}`,
      batchSize
    });
  } catch (error: any) {
    console.error("Error starting background verification:", error);
    res.status(500).json({
      success: false,
      message: `Error starting background verification: ${error?.message || String(error)}`
    });
  }
});

// Stop background wine verification
router.post('/stop-background-verification', checkApiKey, async (req, res) => {
  try {
    stopBackgroundVerification();
    
    res.json({
      success: true,
      message: 'Background wine verification stopped'
    });
  } catch (error: any) {
    console.error("Error stopping background verification:", error);
    res.status(500).json({
      success: false,
      message: `Error stopping background verification: ${error?.message || String(error)}`
    });
  }
});

// Get background verification progress
router.get('/verification-progress', async (req, res) => {
  try {
    const progress = getVerificationProgress();
    res.json({
      success: true,
      ...progress
    });
  } catch (error: any) {
    console.error("Error getting verification progress:", error);
    res.status(500).json({
      success: false,
      message: `Error getting verification progress: ${error?.message || String(error)}`
    });
  }
});

// Search wines with enriched Vivino data
router.get('/search', async (req, res) => {
  try {
    const { q, verified_only } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }
    
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    let query = `
      SELECT 
        id, wine_name, producer, vintage, region, country,
        verified, verified_source, vivino_rating, wine_type,
        tasting_notes, vivino_url, vivino_id,
        created_at
      FROM wines 
      WHERE (
        LOWER(wine_name) LIKE LOWER($1) OR 
        LOWER(producer) LIKE LOWER($1) OR
        LOWER(region) LIKE LOWER($1) OR
        LOWER(country) LIKE LOWER($1)
      )
    `;
    
    const params = [`%${q}%`];
    
    if (verified_only === 'true') {
      query += ' AND verified = true';
    }
    
    query += ' ORDER BY verified DESC, vivino_rating DESC NULLS LAST, wine_name ASC LIMIT 50';
    
    const result = await pool.query(query, params);
    await pool.end();
    
    res.json({ 
      success: true, 
      wines: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error searching wines:', error);
    res.status(500).json({ success: false, error: 'Failed to search wines' });
  }
});

// Get detailed wine information by ID
router.get('/wine/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, error: 'Valid wine ID is required' });
    }
    
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    const result = await pool.query(`
      SELECT 
        id, wine_name, producer, vintage, region, country,
        verified, verified_source, vivino_rating, wine_type,
        tasting_notes, vivino_url, vivino_id, created_at,
        price_range, alcohol_content, serving_temp
      FROM wines 
      WHERE id = $1
    `, [id]);
    
    await pool.end();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Wine not found' });
    }
    
    res.json({ success: true, wine: result.rows[0] });
  } catch (error) {
    console.error('Error getting wine details:', error);
    res.status(500).json({ success: false, error: 'Failed to get wine details' });
  }
});

export default router;