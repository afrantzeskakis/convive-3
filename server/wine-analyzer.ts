import { Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

// Set up file storage for wine list uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/wine');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create file filter for document types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload a PDF, TXT, DOC, or DOCX file.'));
  }
};

// Initialize multer upload for wine lists
export const uploadWineList = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize multer upload for wine resource PDFs
const resourceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/wine-resources');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename but make it safe
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, safeName);
  }
});

// Initialize multer upload for wine resources
export const uploadWineResource = multer({ 
  storage: resourceStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for resources
});

// Function to extract text from PDF files (uses existing function from recipe-analyzer)
async function extractTextFromPDF(filePath: string): Promise<string> {
  // This is a placeholder - we'll depend on the recipe-analyzer implementation
  // In a production environment, you'd extract this function to a shared utility
  try {
    const { extractTextFromPDF } = require('./recipe-analyzer');
    return await extractTextFromPDF(filePath);
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return "Error extracting text from PDF. Text extraction not available.";
  }
}

// Function to extract text from TXT files
function extractTextFromTXT(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

// Function to extract text from files based on extension
export async function extractTextFromFile(filePath: string): Promise<string> {
  const extension = path.extname(filePath).toLowerCase();
  
  switch (extension) {
    case '.pdf':
      return extractTextFromPDF(filePath);
    case '.txt':
      return extractTextFromTXT(filePath);
    case '.doc':
    case '.docx':
      // For production, you'd need a library to extract text from Word docs
      return "Text extraction from Word documents is not implemented in this demo version.";
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
}

// Wine interface
export interface WineItem {
  name: string;
  year?: string;
  type: string; // red, white, sparkling, etc.
  varietals: string[];
  region?: string;
  country?: string;
  price?: string;
  tasting_notes: string[];
  pairing_suggestions: string[];
  description: string;
}

// Function to parse wine list without AI (fallback method)
export function parseWineListWithoutAI(text: string): { 
  wines: Partial<WineItem>[],
  fullText: string 
} {
  // Simple regex patterns for wine entries
  const wineEntryPattern = /([A-Z][A-Za-z\s']+)(?:\s+(\d{4}))?\s+(?:\$(\d+(?:\.\d{2})?))/g;
  const wineTypeKeywords = {
    red: ['red', 'cabernet', 'merlot', 'pinot noir', 'syrah', 'shiraz', 'malbec', 'zinfandel'],
    white: ['white', 'chardonnay', 'sauvignon blanc', 'pinot grigio', 'riesling', 'gewürztraminer'],
    sparkling: ['champagne', 'prosecco', 'cava', 'sparkling'],
    rosé: ['rosé', 'blush', 'pink'],
    dessert: ['port', 'dessert wine', 'sauternes', 'ice wine', 'late harvest']
  };
  
  const wines: Partial<WineItem>[] = [];
  let match;
  
  while ((match = wineEntryPattern.exec(text)) !== null) {
    const name = match[1]?.trim();
    const year = match[2];
    const price = match[3];
    
    if (name) {
      // Try to determine wine type based on keywords
      let type = 'unknown';
      for (const [wineType, keywords] of Object.entries(wineTypeKeywords)) {
        if (keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
          type = wineType;
          break;
        }
      }
      
      wines.push({
        name,
        year,
        price: price ? `$${price}` : undefined,
        type,
        varietals: [],
        tasting_notes: [],
        pairing_suggestions: [],
        description: 'API key required for detailed information'
      });
    }
  }
  
  return {
    wines,
    fullText: text
  };
}

// Function to analyze wine list with OpenAI
export async function analyzeWineListWithAI(text: string): Promise<{ 
  wines: WineItem[],
  fullText: string,
  isAIEnabled: boolean
}> {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    // Fallback to non-AI parsing if no API key
    const basicParsing = parseWineListWithoutAI(text);
    
    return {
      wines: basicParsing.wines as WineItem[],
      fullText: text,
      isAIEnabled: false
    };
  }
  
  try {
    // Initialize OpenAI client (will be active when API key is provided)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional sommelier specializing in wine analysis and recommendations. Extract all wines from the provided wine list, including details such as name, year, type, varietals, region, country, price (if available), and any descriptions. For each wine, add brief tasting notes and pairing suggestions based on your expertise. Format your response as a JSON array of wine objects."
        },
        {
          role: "user",
          content: text || ""
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      wines: result.wines || [],
      fullText: text,
      isAIEnabled: true
    };
  } catch (error) {
    console.error('Error analyzing wine list with AI:', error);
    // Fallback to basic parsing on error
    const basicParsing = parseWineListWithoutAI(text);
    return {
      wines: basicParsing.wines as WineItem[],
      fullText: text,
      isAIEnabled: false
    };
  }
}

// Function to get wine recommendations based on user preferences
export async function getWineRecommendations(
  wines: WineItem[], 
  preferences: string
): Promise<{ recommendations: WineItem[], explanations: string[] }> {
  // If no OpenAI key, just return the wines
  if (!process.env.OPENAI_API_KEY) {
    return {
      recommendations: wines.slice(0, 3), // Return first 3 wines as a basic recommendation
      explanations: [
        "Basic recommendation (AI not enabled)",
        "Basic recommendation (AI not enabled)",
        "Basic recommendation (AI not enabled)"
      ]
    };
  }
  
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Check if price is explicitly mentioned in preferences
    const priceSpecified = /price|cost|expensive|cheap|affordable|budget|luxury|premium|dollars|\$/.test(preferences.toLowerCase());
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a wine sommelier making personalized recommendations. 
          A customer has provided their preferences and you need to recommend wines from the available list.
          
          ${!priceSpecified ? 
          "Since the customer did not specify a price range, select 3 wines across different price points (budget, mid-range, premium)." : 
          "Select the 3 best matching wines based on the customer's preferences."}
          
          Base your recommendations on taste profile, food pairings, price point, or any other criteria mentioned.
          For each recommendation, include a brief, conversational explanation of why this wine matches the customer's preferences.
          
          Return your response in this JSON format:
          {
            "recommendations": [index1, index2, index3],
            "explanations": ["reason for wine 1", "reason for wine 2", "reason for wine 3"]
          }
          
          Where index1, index2, etc. are indices referring to the position of the recommended wines in the provided list.`
        },
        {
          role: "user",
          content: `Customer preferences: "${preferences}"\n\nAvailable wines: ${JSON.stringify(wines)}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    const recommendedIndices = result.recommendations || [];
    const explanations = result.explanations || [];
    
    // Return the recommended wines or top 3 if no recommendations
    if (recommendedIndices.length > 0) {
      const recommendedWines = recommendedIndices
        .map((index: number) => wines[index])
        .filter((wine: WineItem) => wine); // Filter out any undefined entries
      
      return {
        recommendations: recommendedWines,
        explanations: explanations.slice(0, recommendedWines.length)
      };
    } else {
      return {
        recommendations: wines.slice(0, 3),
        explanations: ["No specific match found", "No specific match found", "No specific match found"]
      };
    }
  } catch (error) {
    console.error('Error getting wine recommendations:', error);
    return {
      recommendations: wines.slice(0, 3), // Return first 3 wines as fallback
      explanations: ["Error generating recommendations", "Error generating recommendations", "Error generating recommendations"]
    };
  }
}

// Get detailed information about a wine (using external sources)
export async function getDetailedWineInfo(wine: WineItem): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return 'Detailed wine information will be available once the API key is provided.';
  }
  
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Construct a prompt that mentions using wine-searcher, wine folly, etc.
    const prompt = `
      Provide detailed information about this wine:
      Name: ${wine.name}
      Year: ${wine.year || 'Unknown'}
      Type: ${wine.type}
      Varietals: ${wine.varietals.join(', ')}
      Region: ${wine.region || 'Unknown'}
      Country: ${wine.country || 'Unknown'}
      
      Include information from Wine Folly, Wine-Searcher Grape Varieties Encyclopedia, 
      Wikipedia, and any available Wine Tech Sheets. Cover the following aspects:
      1. Detailed flavor profile and tasting notes
      2. Information about the winery and winemaking techniques
      3. Specifics about the region and terroir
      4. Food pairing recommendations with explanation
      5. Aging potential and serving suggestions
      6. Any notable awards or ratings
    `;
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a wine expert with access to knowledge from Wine Folly, Wine-Searcher, Wikipedia, and wine tech sheets. Provide comprehensive, accurate information about wines for a restaurant sommelier to share with customers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });
    
    return response.choices[0].message.content || "No information available";
  } catch (error) {
    console.error('Error getting detailed wine information:', error);
    return 'Error retrieving detailed wine information. Please try again later.';
  }
}

// Function to get all resource files
export function getWineResourceFiles(): string[] {
  const resourceDir = path.join(__dirname, '../uploads/wine-resources');
  if (!fs.existsSync(resourceDir)) {
    fs.mkdirSync(resourceDir, { recursive: true });
    return [];
  }
  
  return fs.readdirSync(resourceDir);
}

// Handler for wine list upload
export async function handleWineListUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const notes = req.body.notes || '';
    
    // Extract text from the uploaded file
    const extractedText = await extractTextFromFile(filePath);
    
    // Combine extracted text with any notes
    const fullText = notes ? `${extractedText}\n\nNotes:\n${notes}` : extractedText;
    
    // Analyze the wine list
    const analysis = await analyzeWineListWithAI(fullText);
    
    // Return the analysis
    res.status(200).json({
      success: true,
      analysis: analysis,
      aiEnabled: analysis.isAIEnabled
    });
    
    // Clean up the uploaded file to save space
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
  } catch (error) {
    console.error('Error handling wine list upload:', error);
    res.status(500).json({ error: 'Failed to process wine list' });
  }
}

// Handler for getting wine recommendations
export async function handleGetWineRecommendations(req: Request, res: Response) {
  try {
    const { wines, preferences } = req.body;
    
    if (!wines || !Array.isArray(wines) || !preferences) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
    
    const result = await getWineRecommendations(wines, preferences);
    
    res.status(200).json({
      success: true,
      recommendations: result.recommendations,
      explanations: result.explanations
    });
  } catch (error) {
    console.error('Error getting wine recommendations:', error);
    res.status(500).json({ error: 'Failed to get wine recommendations' });
  }
}

// Handler for getting detailed wine information
export async function handleGetDetailedWineInfo(req: Request, res: Response) {
  try {
    const wine = req.body.wine;
    
    if (!wine || !wine.name) {
      return res.status(400).json({ error: 'Invalid wine data' });
    }
    
    const detailedInfo = await getDetailedWineInfo(wine);
    
    res.status(200).json({
      success: true,
      info: detailedInfo
    });
  } catch (error) {
    console.error('Error getting detailed wine info:', error);
    res.status(500).json({ error: 'Failed to get detailed wine information' });
  }
}

// Handler for wine resource upload
export async function handleWineResourceUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Wine resource uploaded successfully',
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error handling wine resource upload:', error);
    res.status(500).json({ error: 'Failed to upload wine resource' });
  }
}

// Handler for listing wine resources
export async function handleListWineResources(req: Request, res: Response) {
  try {
    const resources = getWineResourceFiles();
    
    res.status(200).json({
      success: true,
      resources
    });
  } catch (error) {
    console.error('Error listing wine resources:', error);
    res.status(500).json({ error: 'Failed to list wine resources' });
  }
}

// Handler for checking if AI is enabled (has API key)
export function handleCheckAIStatus(req: Request, res: Response) {
  res.status(200).json({
    enabled: !!process.env.OPENAI_API_KEY
  });
}

// Handler for checking if Wine AI is enabled (has API key)
export function handleWineAIStatus(req: Request, res: Response) {
  res.status(200).json({
    enabled: !!process.env.OPENAI_API_KEY
  });
}