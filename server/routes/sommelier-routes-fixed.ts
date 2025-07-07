/**
 * Sommelier Routes
 * 
 * Provides API endpoints for wine list processing, wine search, and recommendations
 */

import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import * as wineProcessor from '../services/wine-processor-service';

// Create router
const router = Router();

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Check if OpenAI API is available
function checkSommelierService(req: Request, res: Response, next: NextFunction) {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      success: false,
      message: 'Sommelier service is not available - missing OpenAI API key'
    });
  }
  next();
}

// Extract text from uploaded file
async function extractTextFromFile(filePath: string): Promise<string> {
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
  } catch (error: any) {
    console.error('Error processing wine list:', error);
    return res.status(500).json({
      success: false,
      message: `Error processing wine list: ${error.message || String(error)}`
    });
  }
});

// Get wines endpoint with pagination and search
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
  } catch (error) {
    console.error('Error retrieving wines:', error);
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
      message: `Error retrieving wine: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

export default router;