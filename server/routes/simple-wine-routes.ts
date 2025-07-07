import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { openaiService } from '../services/openai-service';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept common document formats
    const allowedTypes = ['.txt', '.pdf', '.doc', '.docx', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only txt, pdf, doc, docx, and csv files are allowed.') as any);
    }
  }
});

// Simple endpoint to check if the API is working
router.get('/simple-wine/status', (req, res) => {
  res.json({ status: 'ok', message: 'Simple Wine API is operational' });
});

// Upload and analyze wine list endpoint
router.post('/simple-wine/analyze', upload.single('wineFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('[Simple Wine API] File uploaded:', req.file.path);
    
    // Read the file content
    let fileContent = '';
    
    if (req.file.mimetype === 'application/pdf') {
      // This would require PDF parsing logic
      // For now, we'll return a message
      return res.status(200).json({
        success: true,
        message: 'PDF support coming soon',
        filePath: req.file.path,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        analysis: {
          wines: [
            { name: "Sample Wine from PDF", region: "Sample Region", price: "$00.00" }
          ]
        }
      });
    } else {
      // Read as text for non-PDF files
      fileContent = fs.readFileSync(req.file.path, 'utf8');
    }

    // Get restaurant ID if provided
    const restaurantId = req.body.restaurantId || 'none';
    
    // Process with OpenAI
    console.log('[Simple Wine API] Analyzing wine list with OpenAI...');
    
    // Simple check to see if we have access to OpenAI service
    if (!openaiService) {
      console.log('[Simple Wine API] OpenAI service not available');
      return res.status(500).json({ error: 'OpenAI service not available' });
    }

    // Call OpenAI for wine list analysis
    try {
      const messages = [
        {
          role: "system",
          content: `You are a professional wine sommelier AI assistant. Your task is to analyze a wine list and extract structured data about the wines listed. For each wine, identify: 
          1. Name (including vintage if provided)
          2. Type (red, white, sparkling, etc.)
          3. Region/Country of origin
          4. Price (if provided)
          5. Any notable characteristics or descriptions
          
          Return the data in JSON format with this structure:
          {
            "wines": [
              {
                "name": "Wine name with vintage",
                "type": "Wine type",
                "region": "Region, Country",
                "price": "Price as listed",
                "notes": "Notable characteristics"
              }
            ]
          }`
        },
        {
          role: "user",
          content: `Here's a wine list, please extract the structured data about each wine:\n\n${fileContent}`
        }
      ];
      
      const options = {
        response_format: { type: "json_object" }
      };
      
      // Use the createChatCompletion method with gpt-4o model
      const response = await openaiService.createChatCompletion(messages, "gpt-4o", options);

      // Parse the response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        console.error('[Simple Wine API] Error parsing OpenAI response:', parseError);
        parsedResponse = { wines: [] };
      }

      // Return the analysis result
      return res.status(200).json({
        success: true,
        restaurant: restaurantId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        analysis: parsedResponse
      });
      
    } catch (error) {
      console.error('[Simple Wine API] OpenAI API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ 
        error: 'Error analyzing wine list',
        details: errorMessage
      });
    }
    
  } catch (error) {
    console.error('[Simple Wine API] Server error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: 'Server error processing wine list',
      details: errorMessage
    });
  }
});

export default router;