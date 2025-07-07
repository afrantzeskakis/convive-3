import { Router } from 'express';
import { storage } from '../storage';
import { restaurantWineStorage } from '../storage/restaurant-wine-storage';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import mammoth from 'mammoth';
import { db } from '../db.js';
// Using direct database table access
import { eq, desc } from 'drizzle-orm';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Dynamically import pdf-parse to avoid module loading issues
let pdfParse: any = null;
try {
  pdfParse = require('pdf-parse');
} catch (error) {
  console.warn('PDF parsing disabled - pdf-parse module not available');
}

// Get wine statistics for a restaurant
router.get('/stats', async (req, res) => {
  try {
    const { restaurantId } = req.query;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }
    
    const stats = await restaurantWineStorage.getWineStatsByRestaurant(Number(restaurantId));
    res.json(stats);
  } catch (error) {
    console.error('Error fetching wine stats:', error);
    res.status(500).json({ error: 'Failed to fetch wine statistics' });
  }
});

// Get wines for a restaurant with optional filtering
router.get('/wines', async (req, res) => {
  try {
    const { restaurantId, search, status, page = 1, limit = 50 } = req.query;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Get wines directly from database to ensure all enriched fields are included
    let wines = await restaurantWineStorage.getWinesByRestaurant(Number(restaurantId));

    // Apply search filter BEFORE pagination if provided
    if (search) {
      const searchTerm = search.toString().toLowerCase().trim();
      console.log(`Search term: "${searchTerm}"`);
      
      wines = wines.filter(wine => {
        if (!wine) return false;
        
        // Enhanced search that handles complex wine names
        const searchableText = [
          wine.wine_name || '',
          wine.producer || '',
          wine.region || '',
          wine.varietals || '',
          wine.vintage || ''
        ].join(' ').toLowerCase();
        
        // For single words, use simple includes
        if (!searchTerm.includes(' ')) {
          const matches = searchableText.includes(searchTerm);
          return matches;
        }
        
        // For multi-word searches, check if all parts are found
        const searchParts = searchTerm.split(' ').filter(part => part.length > 0);
        return searchParts.every(part => searchableText.includes(part));
      });
      
      console.log(`Search results: ${wines.length} wines found`);
    }

    // Apply status filter if provided
    if (status && status !== 'all') {
      wines = wines.filter(wine => wine && wine.enrichment_status === status);
    }

    // Get total count for pagination
    const totalCount = wines.length;

    // Apply pagination AFTER filtering
    const offset = (Number(page) - 1) * Number(limit);
    wines = wines.slice(offset, offset + Number(limit));

    res.json(wines);
  } catch (error) {
    console.error('Error fetching wines:', error);
    res.status(500).json({ error: 'Failed to fetch wines' });
  }
});

// Get all restaurants for selection
router.get('/list', async (req, res) => {
  try {
    const restaurants = await storage.getAllRestaurants();
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});



// Parse different file formats to extract wine data
async function parseWineFile(fileBuffer: Buffer, filename: string): Promise<any[]> {
  const fileExtension = filename.split('.').pop()?.toLowerCase();
  const wines: any[] = [];

  try {
    if (fileExtension === 'csv') {
      // Process CSV file
      await new Promise((resolve, reject) => {
        const stream = Readable.from(fileBuffer.toString());
        stream
          .pipe(csv())
          .on('data', (row) => {
            if (row.wine_name || row.name || row.Wine || row.Name) {
              wines.push(extractWineData(row));
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });
    } else if (fileExtension === 'txt') {
      // Process plain text file
      const text = fileBuffer.toString('utf-8');
      const lines = text.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const wineData = parseWineFromText(line);
        if (wineData) {
          wines.push(wineData);
        }
      }
    } else if (fileExtension === 'docx') {
      // Process Word document
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const text = result.value;
      const lines = text.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const wineData = parseWineFromText(line);
        if (wineData) {
          wines.push(wineData);
        }
      }
    } else if (fileExtension === 'doc') {
      // Handle legacy Word documents by treating as text
      const text = fileBuffer.toString('utf-8');
      const lines = text.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const wineData = parseWineFromText(line);
        if (wineData) {
          wines.push(wineData);
        }
      }
    } else if (fileExtension === 'pdf') {
      // Process PDF file
      const pdfData = await pdfParse(fileBuffer);
      const text = pdfData.text;
      const lines = text.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const wineData = parseWineFromText(line);
        if (wineData) {
          wines.push(wineData);
        }
      }
    } else {
      throw new Error(`Unsupported file format: ${fileExtension}`);
    }
  } catch (error) {
    console.error('Error parsing file:', error);
    throw error;
  }

  return wines;
}

// Extract wine data from structured row (CSV)
function extractWineData(row: any): any {
  return {
    wine_name: row.wine_name || row.name || row.Wine || row.Name || row.WINE || row.wine,
    producer: row.producer || row.Producer || row.winery || row.Winery || row.PRODUCER || row.maker,
    vintage: row.vintage || row.Vintage || row.year || row.Year || row.VINTAGE,
    region: row.region || row.Region || row.appellation || row.Appellation || row.REGION,
    wine_type: row.wine_type || row.type || row.Type || row.style || row.Style || row.COLOR || row.color,
    enrichment_status: 'pending'
  };
}

// Parse wine data from text line using intelligent pattern matching
function parseWineFromText(line: string): any | null {
  const trimmedLine = line.trim();
  
  // Skip empty lines, headers, or lines that don't look like wine entries
  if (!trimmedLine || 
      trimmedLine.length < 10 || 
      /^(wine|producer|vintage|region|type|name)/i.test(trimmedLine) ||
      /^[-=+*#]+$/.test(trimmedLine)) {
    return null;
  }

  // Pattern matching for different wine list formats
  const patterns = [
    // Format: "Wine Name, Producer, Vintage, Region"
    /^([^,]+),\s*([^,]+),\s*(\d{4}),\s*(.+)$/,
    // Format: "Producer Wine Name Vintage Region"
    /^(\w+(?:\s+\w+)*)\s+([^0-9]+)\s+(\d{4})\s+(.+)$/,
    // Format: "Wine Name by Producer (Vintage) - Region"
    /^(.+?)\s+by\s+(.+?)\s*\((\d{4})\)\s*-?\s*(.*)$/,
    // Format: "Wine Name | Producer | Vintage | Region"
    /^([^|]+)\|\s*([^|]+)\|\s*(\d{4})\|\s*(.+)$/,
    // Format: "Wine Name - Producer - Vintage - Region"
    /^([^-]+)-\s*([^-]+)-\s*(\d{4})-\s*(.+)$/,
    // Format: "Wine Name Producer Vintage"  (minimal)
    /^(.+?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(\d{4})$/
  ];

  for (const pattern of patterns) {
    const match = trimmedLine.match(pattern);
    if (match) {
      return {
        wine_name: match[1]?.trim() || '',
        producer: match[2]?.trim() || '',
        vintage: match[3]?.trim() || '',
        region: match[4]?.trim() || '',
        wine_type: inferWineType(match[1] || ''),
        enrichment_status: 'pending'
      };
    }
  }

  // Fallback: treat entire line as wine name if it contains wine-related terms
  if (/\b(chardonnay|cabernet|merlot|pinot|sauvignon|riesling|shiraz|malbec|tempranillo|sangiovese|grenache|syrah|zinfandel|champagne|prosecco|chianti|bordeaux|burgundy|rioja|barolo|chablis)\b/i.test(trimmedLine)) {
    return {
      wine_name: trimmedLine,
      producer: '',
      vintage: extractYear(trimmedLine) || '',
      region: '',
      wine_type: inferWineType(trimmedLine),
      enrichment_status: 'pending'
    };
  }

  return null;
}

// Infer wine type from wine name
function inferWineType(wineName: string): string {
  const name = wineName.toLowerCase();
  
  if (/\b(chardonnay|sauvignon blanc|riesling|pinot grigio|pinot gris|albariño|gewürztraminer|moscato|chablis|sancerre)\b/.test(name)) {
    return 'white';
  } else if (/\b(cabernet|merlot|pinot noir|syrah|shiraz|malbec|tempranillo|sangiovese|grenache|zinfandel|chianti|bordeaux|barolo|rioja)\b/.test(name)) {
    return 'red';
  } else if (/\b(rosé|rosato|provence)\b/.test(name)) {
    return 'rosé';
  } else if (/\b(champagne|prosecco|cava|sparkling|crémant)\b/.test(name)) {
    return 'sparkling';
  } else if (/\b(port|sherry|madeira|dessert|ice wine|sauternes)\b/.test(name)) {
    return 'dessert';
  }
  
  return 'wine';
}

// Extract year from text
function extractYear(text: string): string | null {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? yearMatch[0] : null;
}

// Upload wine list for a restaurant  
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { restaurantId } = req.body;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Parse wines from uploaded file
    const wines = await parseWineFile(req.file.buffer, req.file.originalname);
    
    if (wines.length === 0) {
      return res.status(400).json({ error: 'No wine data found in file. Please check the file format and content.' });
    }

    // Add restaurantId to each wine
    wines.forEach(wine => wine.restaurantId = parseInt(restaurantId));

    // Save wines to database
    const savedWines = [];
    const errors = [];
    
    for (const wine of wines) {
      try {
        if (wine.wine_name && wine.wine_name.trim()) {
          const savedWine = await restaurantWineStorage.createWine(wine);
          savedWines.push(savedWine);
        }
      } catch (error) {
        errors.push({ wine: wine.wine_name, error: error.message });
      }
    }

    // Trigger automatic enrichment for newly uploaded wines
    if (savedWines.length > 0) {
      console.log(`Starting automatic enrichment for ${savedWines.length} newly uploaded wines`);
      setTimeout(async () => {
        try {
          const { enrichRestaurantWine } = await import('../services/restaurant-wine-enrichment.js');
          
          for (const wine of savedWines.slice(0, 3)) { // Limit to first 3 wines
            try {
              await restaurantWineStorage.updateWineStatus(wine.id, 'processing');
              const enrichmentData = await enrichRestaurantWine(wine);
              
              await restaurantWineStorage.updateWineEnrichment(wine.id, {
                wine_rating: enrichmentData.wine_rating?.toString(),
                general_guest_experience: enrichmentData.general_guest_experience,
                flavor_notes: enrichmentData.flavor_notes,
                aroma_notes: enrichmentData.aroma_notes,
                what_makes_special: enrichmentData.what_makes_special,
                body_description: enrichmentData.body_description,
                food_pairing: enrichmentData.food_pairing,
                serving_temp: enrichmentData.serving_temp,
                aging_potential: enrichmentData.aging_potential,
                enrichment_status: 'completed'
              });
              
              console.log(`✓ Auto-enriched with improved prompts: ${wine.wine_name} ${wine.vintage || ''}`);
            } catch (enrichError) {
              console.error(`✗ Failed to auto-enrich: ${wine.wine_name}`, enrichError.message);
              await restaurantWineStorage.updateWineStatus(wine.id, 'failed');
            }
          }
          console.log('Automatic enrichment process completed');
        } catch (error) {
          console.error('Error in automatic enrichment:', error);
        }
      }, 2000); // Start enrichment 2 seconds after upload
    }

    res.json({
      message: `Successfully uploaded ${savedWines.length} wines from ${req.file.originalname}`,
      winesUploaded: savedWines.length,
      totalInFile: wines.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      supportedFormats: ['CSV', 'TXT', 'DOCX', 'DOC', 'PDF']
    });

  } catch (error) {
    console.error('Error uploading wine list:', error);
    res.status(500).json({ 
      error: 'Failed to upload wine list', 
      details: error.message,
      supportedFormats: ['CSV', 'TXT', 'DOCX', 'DOC', 'PDF']
    });
  }
});

// Start enrichment for a specific wine
router.post('/enrich/:id', async (req, res) => {
  try {
    const wineId = parseInt(req.params.id);
    const wine = await restaurantWineStorage.getWineById(wineId);
    
    if (!wine) {
      return res.status(404).json({ error: 'Wine not found' });
    }

    // Update status to processing
    await restaurantWineStorage.updateWineStatus(wineId, 'processing');

    // Start enrichment process (this would typically be done in a background job)
    // Execute enrichment immediately
    try {
      const { enrichRestaurantWine } = await import('../services/restaurant-wine-enrichment.js');
      const enrichmentData = await enrichRestaurantWine(wine);
      
      await restaurantWineStorage.updateWineEnrichment(wineId, {
        wine_rating: enrichmentData.wine_rating?.toString(),
        general_guest_experience: enrichmentData.general_guest_experience,
        flavor_notes: enrichmentData.flavor_notes,
        aroma_notes: enrichmentData.aroma_notes,
        what_makes_special: enrichmentData.what_makes_special,
        body_description: enrichmentData.body_description,
        food_pairing: enrichmentData.food_pairing,
        serving_temp: enrichmentData.serving_temp,
        aging_potential: enrichmentData.aging_potential
      });
      
      await restaurantWineStorage.updateWineStatus(wineId, 'completed');
      console.log(`✓ Wine enrichment completed for: ${wine.wine_name}`);
    } catch (error) {
      console.error(`✗ Wine enrichment failed for: ${wine.wine_name}`, error);
      await restaurantWineStorage.updateWineStatus(wineId, 'failed');
    }

    res.json({ message: 'Enrichment started', wineId });
  } catch (error) {
    console.error('Error starting enrichment:', error);
    res.status(500).json({ error: 'Failed to start enrichment' });
  }
});

// Start/stop the enrichment daemon
router.post('/daemon/start', async (req, res) => {
  try {
    const { wineEnrichmentDaemon } = await import('../services/wine-enrichment-daemon.js');
    await wineEnrichmentDaemon.start();
    res.json({ message: 'Wine enrichment daemon started', status: wineEnrichmentDaemon.getStatus() });
  } catch (error) {
    console.error('Error starting daemon:', error);
    res.status(500).json({ error: 'Failed to start enrichment daemon' });
  }
});

router.post('/daemon/stop', async (req, res) => {
  try {
    const { wineEnrichmentDaemon } = await import('../services/wine-enrichment-daemon.js');
    wineEnrichmentDaemon.stop();
    res.json({ message: 'Wine enrichment daemon stopped', status: wineEnrichmentDaemon.getStatus() });
  } catch (error) {
    console.error('Error stopping daemon:', error);
    res.status(500).json({ error: 'Failed to stop enrichment daemon' });
  }
});

router.get('/daemon/status', async (req, res) => {
  try {
    const { wineEnrichmentDaemon } = await import('../services/wine-enrichment-daemon.js');
    res.json({ status: wineEnrichmentDaemon.getStatus() });
  } catch (error) {
    console.error('Error getting daemon status:', error);
    res.status(500).json({ error: 'Failed to get daemon status' });
  }
});

// Batch enrichment endpoint for existing wines (legacy compatibility + daemon trigger)
router.post('/enrich-batch', async (req, res) => {
  try {
    const { restaurantId, limit = 476 } = req.body;
    
    // Start the daemon if not already running
    const { wineEnrichmentDaemon } = await import('../services/wine-enrichment-daemon.js');
    await wineEnrichmentDaemon.start();
    
    const pendingWines = await restaurantWineStorage.getPendingWines(limit);
    const winesToEnrich = restaurantId 
      ? pendingWines.filter(w => w.restaurantId === parseInt(restaurantId))
      : pendingWines;
    
    console.log(`Daemon triggered for ${winesToEnrich.length} pending wines`);
    
    res.json({ 
      message: `Wine enrichment daemon activated for continuous processing`,
      pendingWines: winesToEnrich.length,
      daemonStatus: wineEnrichmentDaemon.getStatus()
    });
    
  } catch (error) {
    console.error('Batch enrichment error:', error);
    res.status(500).json({ error: 'Failed to start batch enrichment' });
  }
});

// Enhanced enrichment test endpoint
router.post('/test-enhanced-enrichment', async (req, res) => {
  try {
    const { sampleSize = 3 } = req.body;
    
    // Import the enhanced enrichment service
    const { testEnhancedEnrichment } = await import('../services/enhanced-wine-enrichment');
    
    // Run test
    await testEnhancedEnrichment(sampleSize);
    
    res.json({ 
      message: `Enhanced enrichment test started for ${sampleSize} wines`,
      status: 'success'
    });
  } catch (error) {
    console.error('Enhanced enrichment test failed:', error);
    res.status(500).json({ error: 'Enhanced enrichment test failed' });
  }
});

export default router;