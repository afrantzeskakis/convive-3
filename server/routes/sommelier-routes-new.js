/**
 * Sommelier Routes
 * 
 * Provides API endpoints for wine list processing, wine search, and recommendations
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const wineProcessor = require('../services/wine-processor');

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Check if OpenAI API is available
function checkSommelierService(req, res, next) {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      success: false,
      message: 'Sommelier service is not available - missing OpenAI API key'
    });
  }
  next();
}

// Extract text from uploaded file
async function extractTextFromFile(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return text;
  } catch (error) {
    console.error("Error reading file:", error);
    throw new Error('Failed to read uploaded file');
  }
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
    const processResult = await wineProcessor.processWineList(wineListText);
    
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
    console.error('Error processing wine list:', error);
    return res.status(500).json({
      success: false,
      message: `Error processing wine list: ${error.message || error}`
    });
  }
});

// Get wines endpoint with pagination and search
router.get('/wines', async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 20;
    const search = req.query.search || '';
    
    const result = await wineProcessor.getAllWines(page, pageSize, search);
    
    res.json({
      success: true,
      wines: result.wines,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error retrieving wines:', error);
    res.status(500).json({
      success: false,
      message: `Error retrieving wines: ${error.message || error}`
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
    
    const wine = await wineProcessor.getWineById(id);
    
    if (!wine) {
      return res.status(404).json({
        success: false,
        message: 'Wine not found'
      });
    }
    
    res.json({
      success: true,
      wine
    });
  } catch (error) {
    console.error('Error retrieving wine:', error);
    res.status(500).json({
      success: false,
      message: `Error retrieving wine: ${error.message || error}`
    });
  }
});

// Wine recommendation endpoint
router.post('/recommend', checkSommelierService, async (req, res) => {
  try {
    const { food, price, style, preferences } = req.body;
    
    if (!food && !style && !preferences) {
      return res.status(400).json({
        success: false,
        message: 'At least one criteria (food, style, or preferences) is required'
      });
    }
    
    // Build search criteria for the database
    let query = 'SELECT * FROM wines WHERE 1=1';
    const params = [];
    
    // Add style filter
    if (style) {
      query += ' AND style ILIKE $' + (params.length + 1);
      params.push(`%${style}%`);
    }
    
    // Add price range filter
    if (price && price.max) {
      query += ' AND price <= $' + (params.length + 1);
      params.push(price.max);
    }
    
    if (price && price.min) {
      query += ' AND price >= $' + (params.length + 1);
      params.push(price.min);
    }
    
    // Add food pairing filter if specified
    if (food) {
      query += ' AND food_pairings ILIKE $' + (params.length + 1);
      params.push(`%${food}%`);
    }
    
    // Limit results
    query += ' ORDER BY RANDOM() LIMIT 5';
    
    // Get wines from database
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query(query, params);
    
    // Return results
    res.json({
      success: true,
      recommendations: result.rows,
      criteria: {
        food,
        price,
        style,
        preferences
      }
    });
  } catch (error) {
    console.error('Error getting wine recommendations:', error);
    res.status(500).json({
      success: false,
      message: `Error getting wine recommendations: ${error.message || error}`
    });
  }
});

module.exports = router;