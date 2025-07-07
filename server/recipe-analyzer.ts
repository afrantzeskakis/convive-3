import { Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { openaiService } from './services/openai-service';
import { aiCacheService } from './services/ai-cache-service';
import { Pool } from 'pg';

// Get the directory path for the current module with URL-based approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Set up file storage for recipe uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
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

// Initialize multer upload
export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Function to extract text from PDF files
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // This is a placeholder for PDF text extraction
    // In a real implementation, we would use pdfjs-dist to extract text
    // For now, we'll use a simple fs.readFile for demonstration purposes
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('utf8');
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return '';
  }
}

// Function to extract text from TXT files
function extractTextFromTXT(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error('Error extracting text from TXT:', error);
    return '';
  }
}

// Function to extract text based on file type
export async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.pdf':
      return await extractTextFromPDF(filePath);
    case '.txt':
      return extractTextFromTXT(filePath);
    case '.doc':
    case '.docx':
      // In a real implementation, we would use a library like mammoth.js to extract text from DOC/DOCX
      // For now, we'll return a placeholder message
      return 'Text extraction from DOC/DOCX files is not implemented in this demo.';
    default:
      throw new Error(`Unsupported file extension: ${ext}`);
  }
}

// Function to parse individual recipes from text
export function parseRecipesFromText(text: string): Array<{name: string, text: string}> {
  const recipes = [];
  
  // Split by common recipe separators (double newline + capital letter or recipe number patterns)
  const recipePatterns = [
    /\n\n(?=[A-Z][^a-z]*\n)/g,  // Double newline followed by all caps title
    /\n\n(?=\d+\.?\s*[A-Z])/g,   // Double newline followed by number and capital
    /\n{3,}/g,                    // Three or more newlines
    /={3,}\n/g,                   // Three or more equals signs
    /-{3,}\n/g                    // Three or more dashes
  ];
  
  // Try to split the text into sections
  let sections = [text];
  for (const pattern of recipePatterns) {
    const newSections = [];
    for (const section of sections) {
      const parts = section.split(pattern).filter(s => s.trim());
      if (parts.length > 1) {
        newSections.push(...parts);
      } else {
        newSections.push(section);
      }
    }
    sections = newSections;
  }
  
  // Process each section to extract recipe name and content
  for (const section of sections) {
    const trimmedSection = section.trim();
    if (!trimmedSection) continue;
    
    // Extract recipe name from the first line or two
    const lines = trimmedSection.split('\n');
    let recipeName = lines[0].trim();
    
    // If the first line looks like a header separator, use the second line
    if (recipeName.match(/^[=\-_*]+$/) && lines.length > 1) {
      recipeName = lines[1].trim();
    }
    
    // Clean up recipe name (remove numbers, extra punctuation)
    recipeName = recipeName.replace(/^\d+\.?\s*/, '').replace(/[:\-]$/, '').trim();
    
    // Skip if no valid recipe name
    if (!recipeName || recipeName.length < 3) continue;
    
    recipes.push({
      name: recipeName,
      text: trimmedSection
    });
  }
  
  // If no recipes were parsed, treat the entire text as one recipe
  if (recipes.length === 0) {
    const firstLine = text.split('\n')[0].trim();
    recipes.push({
      name: firstLine || 'Untitled Recipe',
      text: text
    });
  }
  
  return recipes;
}

// Interface for ingredient or technique
export interface CulinaryItem {
  type: 'ingredient' | 'technique';
  name: string;
  description: string;
  details?: string;
  allergens?: string[]; // Field to store allergens present in this ingredient
  dietaryRestrictions?: string[]; // Field to store dietary restrictions related to this ingredient
}

// Top 25 most common food allergens
export const commonAllergens = [
  { name: 'milk', alternativeNames: ['dairy', 'lactose', 'whey', 'casein', 'butter', 'cheese', 'cream', 'yogurt'] },
  { name: 'eggs', alternativeNames: ['albumin', 'egg whites', 'egg yolks', 'mayonnaise', 'meringue'] },
  { name: 'peanuts', alternativeNames: ['groundnuts', 'arachis oil', 'peanut butter', 'peanut flour'] },
  { name: 'tree nuts', alternativeNames: ['almonds', 'walnuts', 'cashews', 'pistachios', 'hazelnuts', 'pecans', 'macadamia', 'brazil nuts'] },
  { name: 'soy', alternativeNames: ['soybeans', 'soya', 'tofu', 'edamame', 'miso', 'tempeh', 'soy sauce', 'soy lecithin'] },
  { name: 'wheat', alternativeNames: ['gluten', 'flour', 'bread', 'pasta', 'couscous', 'semolina', 'seitan', 'bulgur'] },
  { name: 'fish', alternativeNames: ['cod', 'salmon', 'tuna', 'tilapia', 'sardines', 'anchovies', 'fish sauce', 'fish oil'] },
  { name: 'shellfish', alternativeNames: ['shrimp', 'crab', 'lobster', 'prawns', 'crayfish', 'scallops', 'clams', 'oysters', 'mussels'] },
  { name: 'sesame', alternativeNames: ['sesame seeds', 'sesame oil', 'tahini', 'halva', 'gomashio'] },
  { name: 'mustard', alternativeNames: ['mustard seeds', 'mustard powder', 'dijon mustard', 'yellow mustard'] },
  { name: 'celery', alternativeNames: ['celery seeds', 'celery salt', 'celeriac', 'celery root'] },
  { name: 'lupin', alternativeNames: ['lupin flour', 'lupin beans', 'lupini'] },
  { name: 'sulfites', alternativeNames: ['sulfur dioxide', 'potassium bisulfite', 'sodium sulfite', 'dried fruits', 'wine'] },
  { name: 'corn', alternativeNames: ['corn starch', 'corn syrup', 'corn flour', 'polenta', 'grits', 'maize'] },
  { name: 'berries', alternativeNames: ['strawberries', 'blueberries', 'raspberries', 'blackberries'] },
  { name: 'citrus fruits', alternativeNames: ['lemons', 'limes', 'oranges', 'grapefruits'] },
  { name: 'nightshades', alternativeNames: ['tomatoes', 'potatoes', 'eggplant', 'peppers', 'paprika', 'cayenne'] },
  { name: 'garlic', alternativeNames: ['garlic powder', 'garlic salt', 'garlic extract'] },
  { name: 'onions', alternativeNames: ['shallots', 'scallions', 'leeks', 'chives', 'onion powder'] },
  { name: 'cocoa', alternativeNames: ['chocolate', 'cacao', 'cocoa butter', 'cocoa powder'] },
  { name: 'avocado', alternativeNames: ['guacamole'] },
  { name: 'kiwi', alternativeNames: ['kiwifruit', 'chinese gooseberry'] },
  { name: 'mango', alternativeNames: [] },
  { name: 'banana', alternativeNames: ['plantain'] },
  { name: 'sunflower seeds', alternativeNames: ['sunflower oil', 'sunflower lecithin'] }
];

// Common dietary restrictions
export const dietaryRestrictions = [
  { name: 'vegetarian', 
    incompatible: [
      { name: 'meat', alternativeNames: ['beef', 'pork', 'lamb', 'veal', 'chicken', 'turkey', 'duck', 'goose', 'rabbit', 'venison', 'bacon', 'ham', 'sausage', 'pepperoni', 'salami', 'prosciutto'] },
      { name: 'fish', alternativeNames: ['cod', 'salmon', 'tuna', 'tilapia', 'sardines', 'anchovies', 'fish sauce', 'fish oil'] },
      { name: 'shellfish', alternativeNames: ['shrimp', 'crab', 'lobster', 'prawns', 'crayfish', 'scallops', 'clams', 'oysters', 'mussels'] },
      { name: 'animal fats', alternativeNames: ['lard', 'tallow', 'suet', 'schmaltz', 'bone broth'] },
      { name: 'gelatin', alternativeNames: ['jello', 'gummy', 'marshmallow'] }
    ]
  },
  { name: 'vegan', 
    incompatible: [
      { name: 'meat', alternativeNames: ['beef', 'pork', 'lamb', 'veal', 'chicken', 'turkey', 'duck', 'goose', 'rabbit', 'venison', 'bacon', 'ham', 'sausage', 'pepperoni', 'salami', 'prosciutto'] },
      { name: 'fish', alternativeNames: ['cod', 'salmon', 'tuna', 'tilapia', 'sardines', 'anchovies', 'fish sauce', 'fish oil'] },
      { name: 'shellfish', alternativeNames: ['shrimp', 'crab', 'lobster', 'prawns', 'crayfish', 'scallops', 'clams', 'oysters', 'mussels'] },
      { name: 'dairy', alternativeNames: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'lactose', 'ghee'] },
      { name: 'eggs', alternativeNames: ['albumin', 'egg whites', 'egg yolks', 'mayonnaise', 'meringue'] },
      { name: 'honey', alternativeNames: ['bee pollen', 'royal jelly', 'propolis'] },
      { name: 'animal fats', alternativeNames: ['lard', 'tallow', 'suet', 'schmaltz', 'bone broth'] },
      { name: 'gelatin', alternativeNames: ['jello', 'gummy', 'marshmallow'] }
    ]
  },
  { name: 'gluten-free', 
    incompatible: [
      { name: 'wheat', alternativeNames: ['flour', 'bread', 'pasta', 'couscous', 'semolina', 'seitan', 'bulgur', 'farina', 'durum'] },
      { name: 'barley', alternativeNames: ['malt', 'beer', 'brewer\'s yeast'] },
      { name: 'rye', alternativeNames: ['pumpernickel', 'rye bread', 'rye flour'] },
      { name: 'triticale', alternativeNames: ['triticale flour'] }
    ]
  },
  { name: 'keto', 
    incompatible: [
      { name: 'grains', alternativeNames: ['wheat', 'rice', 'corn', 'oats', 'barley', 'quinoa', 'millet', 'flour', 'bread', 'pasta', 'cereal'] },
      { name: 'sugar', alternativeNames: ['sucrose', 'glucose', 'fructose', 'maltose', 'dextrose', 'honey', 'maple syrup', 'agave'] },
      { name: 'starchy vegetables', alternativeNames: ['potatoes', 'sweet potatoes', 'yams', 'corn', 'peas', 'carrots'] },
      { name: 'legumes', alternativeNames: ['beans', 'lentils', 'chickpeas', 'peanuts', 'soybeans'] },
      { name: 'fruits', alternativeNames: ['apple', 'banana', 'orange', 'grape', 'peach', 'pear', 'pineapple', 'mango'] }
    ]
  },
  { name: 'paleo', 
    incompatible: [
      { name: 'grains', alternativeNames: ['wheat', 'rice', 'corn', 'oats', 'barley', 'quinoa', 'millet', 'flour', 'bread', 'pasta', 'cereal'] },
      { name: 'dairy', alternativeNames: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'lactose', 'ghee'] },
      { name: 'legumes', alternativeNames: ['beans', 'lentils', 'chickpeas', 'peanuts', 'soybeans'] },
      { name: 'refined sugar', alternativeNames: ['sucrose', 'glucose', 'fructose', 'maltose', 'dextrose', 'syrup'] },
      { name: 'processed oils', alternativeNames: ['vegetable oil', 'canola oil', 'soybean oil', 'corn oil', 'margarine'] }
    ]
  },
  { name: 'halal', 
    incompatible: [
      { name: 'pork', alternativeNames: ['bacon', 'ham', 'lard', 'gelatin', 'pepperoni', 'prosciutto', 'pancetta'] },
      { name: 'alcohol', alternativeNames: ['wine', 'beer', 'liquor', 'rum', 'vodka', 'whiskey', 'brandy', 'cooking wine'] }
    ]
  },
  { name: 'kosher', 
    incompatible: [
      { name: 'pork', alternativeNames: ['bacon', 'ham', 'lard', 'gelatin', 'pepperoni', 'prosciutto', 'pancetta'] },
      { name: 'shellfish', alternativeNames: ['shrimp', 'crab', 'lobster', 'prawns', 'crayfish', 'scallops', 'clams', 'oysters', 'mussels'] },
      { name: 'meat and dairy together', alternativeNames: [] }
    ]
  },
  { name: 'low-FODMAP', 
    incompatible: [
      { name: 'garlic', alternativeNames: ['garlic powder', 'garlic salt', 'garlic extract'] },
      { name: 'onions', alternativeNames: ['shallots', 'scallions', 'leeks', 'onion powder'] },
      { name: 'wheat', alternativeNames: ['flour', 'bread', 'pasta', 'couscous', 'semolina', 'seitan', 'bulgur'] },
      { name: 'high-fructose fruits', alternativeNames: ['apple', 'pear', 'mango', 'watermelon', 'honey'] },
      { name: 'legumes', alternativeNames: ['beans', 'lentils', 'chickpeas', 'soybeans'] },
      { name: 'lactose', alternativeNames: ['milk', 'ice cream', 'yogurt', 'soft cheese'] }
    ]
  }
];

// Function to parse recipe text without AI (fallback method)
export function parseRecipeWithoutAI(text: string): { 
  ingredients: string[],
  techniques: string[],
  fullText: string 
} {
  // Common cooking techniques to identify
  const commonTechniques = [
    'bake', 'broil', 'grill', 'roast', 'sauté', 'fry', 'deep-fry', 'stir-fry',
    'boil', 'simmer', 'poach', 'steam', 'blanch', 'braise', 'stew', 'sous vide',
    'marinate', 'pickle', 'ferment', 'cure', 'smoke', 'deglaze', 'reduce',
    'whip', 'beat', 'fold', 'cream', 'knead', 'proof', 'rest', 'chill', 'freeze',
    'blend', 'puree', 'chop', 'dice', 'slice', 'julienne', 'mince', 'crush',
    'caramelize', 'sear', 'char', 'toast', 'flambé', 'infuse', 'strain', 'filter'
  ];
  
  // Enhanced regex patterns for ingredients
  const ingredientPatterns = [
    // Standard measurement format
    /(\d+(?:\.\d+)?\s*(?:cup|cups|tbsp|tsp|tablespoon|teaspoon|oz|ounce|pound|lb|g|gram|kg|kilogram|ml|milliliter|l|liter|pinch|dash)s?\s+(?:of\s+)?[\w\s-]+)/gi,
    
    // Number + ingredient format
    /(\d+(?:\.\d+)?\s+[\w\s-]+)/gi,
    
    // Common ingredient names with no measurements
    /\b(salt|pepper|garlic|onion|butter|oil|flour|sugar|water|milk|cream|egg|chicken|beef|pork|fish|potato|carrot|celery|tomato|lemon|lime|olive oil|sesame oil|vinegar|wine|stock|broth)\b/gi,
    
    // Foods with quantity and unit
    /((?:[\w\s-]+)\s+\d+\s*(?:g|gram|kg|oz|cup|tbsp|tsp)s?)/gi
  ];
  
  // Lines that might contain ingredients (if they start with a bullet point, dash, number, etc.)
  const linePattern = /^[•\-\*\d\.]+\s*(.*)/gm;
  const lines: string[] = [];
  let match;
  while ((match = linePattern.exec(text)) !== null) {
    lines.push(match[1].trim());
  }
  
  const ingredients: string[] = [];
  const techniques: string[] = [];
  
  // Extract ingredients from whole text using patterns
  ingredientPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Clean up the ingredient
        const ingredient = match.trim();
        if (ingredient && !ingredients.includes(ingredient)) {
          ingredients.push(ingredient);
        }
      });
    }
  });
  
  // Also try to extract ingredients line by line
  lines.forEach(line => {
    // If line contains numbers and common food keywords, it's likely an ingredient
    if (/\d/.test(line) && /\b(oil|salt|pepper|g|kg|cup|tbsp|tsp|tablespoon|teaspoon|ounce|pound|lb)\b/i.test(line)) {
      if (!ingredients.includes(line) && line.length < 100) { // Reasonable length for an ingredient
        ingredients.push(line);
      }
    }
  });
  
  // Identify cooking techniques
  commonTechniques.forEach(technique => {
    const pattern = new RegExp(`\\b${technique}\\b`, 'gi');
    if (pattern.test(text)) {
      techniques.push(technique);
    }
  });
  
  // Remove duplicates and sort by length (shorter ingredients first)
  const uniqueIngredients = Array.from(new Set(ingredients))
    .sort((a, b) => a.length - b.length);
    
  // Remove ingredients that are substrings of other ingredients
  const filteredIngredients = uniqueIngredients.filter((ingredient, index) => {
    for (let i = index + 1; i < uniqueIngredients.length; i++) {
      if (uniqueIngredients[i].includes(ingredient)) {
        return false;
      }
    }
    return true;
  });
  
  return {
    ingredients: filteredIngredients,
    techniques: Array.from(new Set(techniques)), // Remove duplicates
    fullText: text
  };
}

// Function to detect allergens in ingredients
export function detectAllergens(ingredientName: string): string[] {
  const detectedAllergens: string[] = [];
  
  // Convert ingredient name to lowercase for case-insensitive matching
  const lowerIngredient = ingredientName.toLowerCase();
  
  // Check each allergen and its alternative names
  commonAllergens.forEach(allergen => {
    // Check the main allergen name
    if (lowerIngredient.includes(allergen.name)) {
      detectedAllergens.push(allergen.name);
      return; // Skip checking alternative names if main name is found
    }
    
    // Check alternative names
    for (const altName of allergen.alternativeNames) {
      if (lowerIngredient.includes(altName)) {
        detectedAllergens.push(allergen.name); // Add the main allergen name
        return; // Break the loop once found
      }
    }
  });
  
  return detectedAllergens;
}

// Function to detect dietary restrictions for an ingredient
export function detectDietaryRestrictions(ingredientName: string): string[] {
  const restrictedDiets: string[] = [];
  const lowerIngredient = ingredientName.toLowerCase();
  
  // Check each dietary restriction
  dietaryRestrictions.forEach(diet => {
    // Check each incompatible ingredient group for this diet
    for (const incompatibleGroup of diet.incompatible) {
      // Check main ingredient name
      if (lowerIngredient.includes(incompatibleGroup.name)) {
        restrictedDiets.push(diet.name);
        break; // Found a match, no need to check other incompatible ingredients for this diet
      }
      
      // Check alternative names
      for (const altName of incompatibleGroup.alternativeNames) {
        if (lowerIngredient.includes(altName)) {
          restrictedDiets.push(diet.name);
          break; // Found a match, no need to check other alternatives
        }
      }
      
      // If we've already determined this diet is restricted, no need to check further
      if (restrictedDiets.includes(diet.name)) {
        break;
      }
    }
  });
  
  return restrictedDiets;
}

// Function to analyze recipe with OpenAI (to be used when API key is available)
export async function analyzeRecipeWithAI(text: string): Promise<{ 
  ingredients: CulinaryItem[],
  techniques: CulinaryItem[],
  fullText: string,
  isAIEnabled: boolean,
  allergenSummary?: { [key: string]: string[] }, // Map of allergen to ingredients containing it
  dietaryRestrictionSummary?: { [key: string]: string[] } // Map of dietary restriction to ingredients that are incompatible
}> {
  // Check if recipe analysis OpenAI API key is available
  if (!process.env.RECIPE_ANALYSIS_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
    // Fallback to non-AI parsing if no API key
    const basicParsing = parseRecipeWithoutAI(text);
    
    // Process ingredients to add allergen and dietary restriction information
    const ingredients = basicParsing.ingredients.map(name => {
      const allergens = detectAllergens(name);
      const dietaryRestrictions = detectDietaryRestrictions(name);
      return {
        type: 'ingredient' as const,
        name,
        description: 'API key required for detailed information',
        allergens: allergens.length > 0 ? allergens : undefined,
        dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined
      };
    });
    
    // Create allergen summary
    const allergenSummary: { [key: string]: string[] } = {};
    ingredients.forEach(ingredient => {
      if (ingredient.allergens && ingredient.allergens.length > 0) {
        ingredient.allergens.forEach(allergen => {
          if (!allergenSummary[allergen]) {
            allergenSummary[allergen] = [];
          }
          allergenSummary[allergen].push(ingredient.name);
        });
      }
    });
    
    // Create dietary restriction summary
    const dietaryRestrictionSummary: { [key: string]: string[] } = {};
    ingredients.forEach(ingredient => {
      if (ingredient.dietaryRestrictions && ingredient.dietaryRestrictions.length > 0) {
        ingredient.dietaryRestrictions.forEach(diet => {
          if (!dietaryRestrictionSummary[diet]) {
            dietaryRestrictionSummary[diet] = [];
          }
          dietaryRestrictionSummary[diet].push(ingredient.name);
        });
      }
    });
    
    return {
      ingredients,
      techniques: basicParsing.techniques.map(name => ({
        type: 'technique' as const,
        name,
        description: 'API key required for detailed information'
      })),
      fullText: text,
      isAIEnabled: false,
      allergenSummary: Object.keys(allergenSummary).length > 0 ? allergenSummary : undefined,
      dietaryRestrictionSummary: Object.keys(dietaryRestrictionSummary).length > 0 ? dietaryRestrictionSummary : undefined
    };
  }
  
  try {
    // Use the OpenAI service with rate limit handling
    
    // Construct the messages array for the API request
    const messages = [
      {
        role: "system",
        content: "You are a professional culinary expert and allergen specialist. Analyze this recipe and identify all ingredients and cooking techniques. For each ingredient, explain WHY it's being used in this dish and how it contributes to the flavor profile, texture, and dining experience. \n\nIMPORTANT: For EVERY ingredient, you must identify any of the 25 common allergens it contains or is derived from: milk, eggs, peanuts, tree nuts, soy, wheat, fish, shellfish, sesame, mustard, celery, lupin, sulfites, corn, berries, citrus fruits, nightshades, garlic, onions, cocoa, avocado, kiwi, mango, banana, and sunflower seeds.\n\nALSO IMPORTANT: For EVERY ingredient, identify the common dietary restrictions it violates: vegetarian, vegan, gluten-free, keto, paleo, halal, kosher, and low-FODMAP.\n\nFocus on conceptual understanding rather than procedural steps. Format your response as JSON with 'ingredients' and 'techniques' arrays where each item has 'name', 'description', 'allergens' (array of allergen names), and 'dietaryRestrictions' (array of diet names) fields. If no allergens or restrictions apply, use empty arrays."
      },
      {
        role: "user",
        content: text
      }
    ];
    
    // Use the service with automatic model fallback and rate limit handling
    const response = await openaiService.createChatCompletionWithModelFallback(
      messages,
      { response_format: { type: "json_object" } }
    );
    
    // Parse the JSON response
    const content = response.choices[0].message.content || '{"ingredients":[],"techniques":[]}';
    const result = JSON.parse(content);
    
    // Process ingredients - note that the model now includes allergens and dietaryRestrictions directly in the response
    const ingredients = (result.ingredients || []).map((item: any) => {
      // If the OpenAI model didn't provide allergens/dietary restrictions, generate them using our detection logic
      const allergens = item.allergens || detectAllergens(item.name);
      const dietaryRestrictions = item.dietaryRestrictions || detectDietaryRestrictions(item.name);
      
      return {
        type: 'ingredient' as const,
        name: item.name,
        description: item.description,
        allergens: allergens.length > 0 ? allergens : undefined,
        dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined
      };
    });
    
    // Create allergen summary
    const allergenSummary: { [key: string]: string[] } = {};
    ingredients.forEach((ingredient: CulinaryItem) => {
      if (ingredient.allergens && ingredient.allergens.length > 0) {
        ingredient.allergens.forEach((allergen: string) => {
          if (!allergenSummary[allergen]) {
            allergenSummary[allergen] = [];
          }
          allergenSummary[allergen].push(ingredient.name);
        });
      }
    });
    
    // Create dietary restriction summary
    const dietaryRestrictionSummary: { [key: string]: string[] } = {};
    ingredients.forEach((ingredient: CulinaryItem) => {
      if (ingredient.dietaryRestrictions && ingredient.dietaryRestrictions.length > 0) {
        ingredient.dietaryRestrictions.forEach((diet: string) => {
          if (!dietaryRestrictionSummary[diet]) {
            dietaryRestrictionSummary[diet] = [];
          }
          dietaryRestrictionSummary[diet].push(ingredient.name);
        });
      }
    });
    
    return {
      ingredients,
      techniques: result.techniques || [],
      fullText: text,
      isAIEnabled: true,
      allergenSummary: Object.keys(allergenSummary).length > 0 ? allergenSummary : undefined,
      dietaryRestrictionSummary: Object.keys(dietaryRestrictionSummary).length > 0 ? dietaryRestrictionSummary : undefined
    };
  } catch (error) {
    console.error('Error analyzing recipe with AI:', error);
    
    // Fallback to basic parsing on error
    const basicParsing = parseRecipeWithoutAI(text);
    
    // Process ingredients to add allergen and dietary restriction information
    const ingredients = basicParsing.ingredients.map(name => {
      const allergens = detectAllergens(name);
      const dietaryRestrictions = detectDietaryRestrictions(name);
      return {
        type: 'ingredient' as const,
        name,
        description: 'Error fetching AI description',
        allergens: allergens.length > 0 ? allergens : undefined,
        dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined
      };
    });
    
    // Create allergen summary
    const allergenSummary: { [key: string]: string[] } = {};
    ingredients.forEach(ingredient => {
      if (ingredient.allergens && ingredient.allergens.length > 0) {
        ingredient.allergens.forEach(allergen => {
          if (!allergenSummary[allergen]) {
            allergenSummary[allergen] = [];
          }
          allergenSummary[allergen].push(ingredient.name);
        });
      }
    });
    
    // Create dietary restriction summary
    const dietaryRestrictionSummary: { [key: string]: string[] } = {};
    ingredients.forEach(ingredient => {
      if (ingredient.dietaryRestrictions && ingredient.dietaryRestrictions.length > 0) {
        ingredient.dietaryRestrictions.forEach(diet => {
          if (!dietaryRestrictionSummary[diet]) {
            dietaryRestrictionSummary[diet] = [];
          }
          dietaryRestrictionSummary[diet].push(ingredient.name);
        });
      }
    });
    
    return {
      ingredients,
      techniques: basicParsing.techniques.map(name => ({
        type: 'technique' as const,
        name,
        description: 'Error fetching AI description'
      })),
      fullText: text,
      isAIEnabled: false,
      allergenSummary: Object.keys(allergenSummary).length > 0 ? allergenSummary : undefined,
      dietaryRestrictionSummary: Object.keys(dietaryRestrictionSummary).length > 0 ? dietaryRestrictionSummary : undefined
    };
  }
}

// Function to get detailed information about a specific ingredient or technique
export async function getDetailedInfo(item: { type: string, name: string }): Promise<string> {
  // Check if OpenAI service is available
  if (!openaiService.isConfigured()) {
    return 'API key required for detailed information';
  }
  
  try {
    const prompt = item.type === 'ingredient'
      ? `Explain why the ingredient "${item.name}" would be chosen for a dish and what purpose it serves in culinary creation. Focus on how it affects flavor, texture, and dining experience rather than just listing facts. Include cultural significance and how it can transform a dish conceptually.`
      : `Explain why chefs use the "${item.name}" technique and what it achieves in a dish beyond just the mechanical process. Focus on the conceptual purpose - how it transforms ingredients, affects diner experience, and contributes to the overall culinary narrative of a dish. Include cultural context where relevant.`;
    
    // Construct the messages for API and caching
    const messages = [
      {
        role: "system",
        content: "You are a culinary expert focused on explaining the 'why' behind culinary elements. Your goal is to help restaurant staff understand concepts rather than procedures so they can communicate the culinary narrative to diners. Keep explanations conversational and focused on the dining experience."
      },
      {
        role: "user",
        content: prompt
      }
    ];
    
    // Use our OpenAI service with caching and model fallback
    const response = await openaiService.createChatCompletionWithModelFallback(messages);
    
    const content = response.choices[0].message.content;
    return content !== null ? content : 'No information available';
  } catch (error) {
    console.error('Error getting detailed info:', error);
    return 'Error fetching information. Please try again later.';
  }
}

// Handler for recipe upload
export async function handleRecipeUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Get restaurantId from request query or body
    const restaurantId = req.query.restaurantId || req.body.restaurantId;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }
    
    const filePath = req.file.path;
    const notes = req.body.notes || '';
    
    // Extract text from the uploaded file
    const extractedText = await extractTextFromFile(filePath);
    
    // Combine extracted text with any notes
    const fullText = notes ? `${extractedText}\n\nNotes:\n${notes}` : extractedText;
    
    // Parse individual recipes from the uploaded file
    const recipes = parseRecipesFromText(fullText);
    
    // Get restaurant details for cuisine context
    const restaurantResult = await pool.query(
      'SELECT cuisine_description FROM restaurants WHERE id = $1',
      [restaurantId]
    );
    const cuisineDescription = restaurantResult.rows[0]?.cuisine_description || '';
    
    // Process culinary terms for carousel functionality
    const { culinaryKnowledgeService } = await import('./services/culinary-knowledge-service');
    const { recipeEnhancementService } = await import('./services/recipe-enhancement-service');
    
    // Extract culinary terms from all recipes
    const extractedTerms = await culinaryKnowledgeService.extractCulinaryTerms(fullText, cuisineDescription);
    
    // Process terms to generate carousel content
    const termCarouselMap = await culinaryKnowledgeService.batchProcessTerms(extractedTerms, Number(restaurantId));
    
    // Convert to format expected by frontend
    const culinaryTerms = [];
    for (const term of Array.from(termCarouselMap.keys())) {
      const slides = termCarouselMap.get(term) || [];
      culinaryTerms.push({
        term,
        category: 'basic', // Will be categorized by the service
        explanation: slides[0]?.content || `${term} is a culinary element.`,
        carouselContent: slides
      });
    }
    
    // Process each recipe individually and save to database
    const processedRecipes = [];
    for (const recipe of recipes) {
      // Check if recipe already exists for this restaurant
      const existingRecipeQuery = await pool.query(
        'SELECT id, name FROM recipes WHERE restaurant_id = $1 AND LOWER(name) = LOWER($2)',
        [restaurantId, recipe.name]
      );
      
      let recipeId;
      
      if (existingRecipeQuery.rows.length > 0) {
        // Update existing recipe
        recipeId = existingRecipeQuery.rows[0].id;
        await pool.query(
          'UPDATE recipes SET recipe_text = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [recipe.text, recipeId]
        );
      } else {
        // Create new recipe
        const insertResult = await pool.query(
          'INSERT INTO recipes (restaurant_id, name, recipe_text, file_type, status, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [restaurantId, recipe.name, recipe.text, 'txt', 'analyzed', req.user?.id || null]
        );
        recipeId = insertResult.rows[0].id;
      }
      
      // Analyze the recipe
      const analysis = await analyzeRecipeWithAI(recipe.text);
      
      // Enhance the recipe with highlighted text and carousel data
      const enhancedAnalysis = await recipeEnhancementService.enhanceRecipeWithHighlights({
        ...analysis,
        extractedText: recipe.text
      }, culinaryTerms);
      
      // Save or update the analysis
      const existingAnalysisQuery = await pool.query(
        'SELECT * FROM recipe_analyses WHERE recipe_id = $1',
        [recipeId]
      );
      
      if (existingAnalysisQuery.rows.length > 0) {
        // Merge with existing analysis - accumulate culinary knowledge
        const existingAnalysis = existingAnalysisQuery.rows[0];
        
        // Merge ingredients - combine arrays and remove duplicates
        const existingIngredients = typeof existingAnalysis.ingredients === 'string' 
          ? JSON.parse(existingAnalysis.ingredients || '[]')
          : existingAnalysis.ingredients || [];
        const newIngredients = analysis.ingredients || [];
        const mergedIngredients = [...existingIngredients];
        
        // Add new ingredients that don't already exist
        for (const newIngr of newIngredients) {
          const exists = existingIngredients.some((existing: any) => 
            existing.name?.toLowerCase() === newIngr.name?.toLowerCase()
          );
          if (!exists) {
            mergedIngredients.push(newIngr);
          }
        }
        
        // Merge techniques similarly
        const existingTechniques = typeof existingAnalysis.techniques === 'string'
          ? JSON.parse(existingAnalysis.techniques || '[]')
          : existingAnalysis.techniques || [];
        const newTechniques = analysis.techniques || [];
        const mergedTechniques = [...existingTechniques];
        
        for (const newTech of newTechniques) {
          const exists = existingTechniques.some((existing: any) => 
            existing.name?.toLowerCase() === newTech.name?.toLowerCase()
          );
          if (!exists) {
            mergedTechniques.push(newTech);
          }
        }
        
        // Update with merged data
        await pool.query(
          `UPDATE recipe_analyses 
           SET ingredients = $1, techniques = $2, allergen_summary = $3, 
               dietary_restriction_summary = $4, confidence = $5, updated_at = CURRENT_TIMESTAMP 
           WHERE recipe_id = $6`,
          [
            JSON.stringify(mergedIngredients),
            JSON.stringify(mergedTechniques),
            JSON.stringify(analysis.allergenSummary || {}),
            JSON.stringify(analysis.dietaryRestrictionSummary || {}),
            analysis.confidence || 1.0,
            recipeId
          ]
        );
        
        // Use merged data for the response
        analysis.ingredients = mergedIngredients;
        analysis.techniques = mergedTechniques;
      } else {
        // Create new analysis
        await pool.query(
          `INSERT INTO recipe_analyses 
           (recipe_id, ingredients, techniques, allergen_summary, dietary_restriction_summary, confidence) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            recipeId,
            JSON.stringify(analysis.ingredients || []),
            JSON.stringify(analysis.techniques || []),
            JSON.stringify(analysis.allergenSummary || {}),
            JSON.stringify(analysis.dietaryRestrictionSummary || {}),
            analysis.confidence || 1.0
          ]
        );
      }
      
      processedRecipes.push({
        id: recipeId,
        name: recipe.name,
        originalText: recipe.text,
        analysis: {
          ...analysis,
          ...enhancedAnalysis,
          aiEnabled: analysis.isAIEnabled
        }
      });
    }
    
    // Return success without the recipes (they'll be fetched from DB)
    res.status(200).json({
      success: true,
      message: `Successfully processed ${processedRecipes.length} recipe(s)`,
      culinaryTerms: culinaryTerms,
      aiEnabled: true
    });
    
    // Clean up the uploaded file to save space
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
  } catch (error) {
    console.error('Error handling recipe upload:', error);
    res.status(500).json({ error: 'Failed to process recipe' });
  }
}

// Handler for getting detailed information
export async function handleGetDetailedInfo(req: Request, res: Response) {
  try {
    const { type, name, restaurantId } = req.query;
    
    if (!type || !name || (type !== 'ingredient' && type !== 'technique')) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }
    
    const detailedInfo = await getDetailedInfo({ 
      type: type as string, 
      name: name as string 
    });
    
    res.status(200).json({
      success: true,
      info: detailedInfo
    });
  } catch (error) {
    console.error('Error getting detailed info:', error);
    res.status(500).json({ error: 'Failed to get detailed information' });
  }
}

// Handler for checking if AI is enabled (has API key)
export function handleCheckAIStatus(req: Request, res: Response) {
  res.status(200).json({
    enabled: !!process.env.OPENAI_API_KEY
  });
}

// Handler for checking allergens and dietary restrictions in a specific ingredient or recipe
export function handleCheckAllergens(req: Request, res: Response) {
  try {
    const { ingredient, recipe, restaurantId } = req.query;
    
    if (!ingredient && !recipe) {
      return res.status(400).json({ 
        error: 'You must provide either an ingredient or recipe to check'
      });
    }
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }
    
    if (ingredient) {
      // Check allergens and dietary restrictions for a single ingredient
      const allergens = detectAllergens(ingredient as string);
      const dietaryRestrictions = detectDietaryRestrictions(ingredient as string);
      
      return res.status(200).json({
        success: true,
        ingredient: ingredient,
        allergens: allergens,
        dietaryRestrictions: dietaryRestrictions,
        hasAllergens: allergens.length > 0,
        hasDietaryRestrictions: dietaryRestrictions.length > 0
      });
    } else if (recipe) {
      // Process recipe text to detect allergens and dietary restrictions
      const recipeText = recipe as string;
      
      // Simple ingredient extraction (a simplified version just for allergen checking)
      const ingredientRegex = /([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/g;
      const matches = recipeText.match(ingredientRegex) || [];
      
      // Filter out small words and common non-ingredient words
      const commonNonIngredients = ['and', 'or', 'the', 'with', 'without', 'some', 'few', 'mix', 'stir', 'bake', 'cook'];
      const potentialIngredients = matches
        .filter(word => word.length > 2)
        .filter(word => !commonNonIngredients.includes(word.toLowerCase()));
      
      // Check allergens and dietary restrictions for each potential ingredient
      const allergenMap: { [key: string]: string[] } = {};
      const dietaryRestrictionMap: { [key: string]: string[] } = {};
      const detectedIngredients: { 
        name: string, 
        allergens: string[], 
        dietaryRestrictions: string[] 
      }[] = [];
      
      potentialIngredients.forEach((ingredient: string) => {
        const allergens = detectAllergens(ingredient);
        const dietaryRestrictions = detectDietaryRestrictions(ingredient);
        
        // Only add ingredients that have either allergens or dietary restrictions
        if (allergens.length > 0 || dietaryRestrictions.length > 0) {
          detectedIngredients.push({
            name: ingredient,
            allergens: allergens,
            dietaryRestrictions: dietaryRestrictions
          });
          
          // Add to allergen map
          allergens.forEach((allergen: string) => {
            if (!allergenMap[allergen]) {
              allergenMap[allergen] = [];
            }
            if (!allergenMap[allergen].includes(ingredient)) {
              allergenMap[allergen].push(ingredient);
            }
          });
          
          // Add to dietary restriction map
          dietaryRestrictions.forEach((diet: string) => {
            if (!dietaryRestrictionMap[diet]) {
              dietaryRestrictionMap[diet] = [];
            }
            if (!dietaryRestrictionMap[diet].includes(ingredient)) {
              dietaryRestrictionMap[diet].push(ingredient);
            }
          });
        }
      });
      
      return res.status(200).json({
        success: true,
        hasAllergens: Object.keys(allergenMap).length > 0,
        hasDietaryRestrictions: Object.keys(dietaryRestrictionMap).length > 0,
        allergenSummary: allergenMap,
        dietaryRestrictionSummary: dietaryRestrictionMap,
        detectedIngredients: detectedIngredients
      });
    }
  } catch (error) {
    console.error('Error checking ingredients:', error);
    res.status(500).json({ error: 'Failed to analyze ingredients' });
  }
}

// Handler for checking dietary restrictions for an ingredient or recipe
export function handleCheckDietaryRestrictions(req: Request, res: Response) {
  try {
    const { ingredient, recipe, restaurantId } = req.query;
    
    if (!ingredient && !recipe) {
      return res.status(400).json({ 
        error: 'You must provide either an ingredient or recipe to check for dietary restrictions'
      });
    }
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }
    
    if (ingredient) {
      // Check dietary restrictions for a single ingredient
      const restrictions = detectDietaryRestrictions(ingredient as string);
      
      return res.status(200).json({
        success: true,
        ingredient: ingredient,
        dietaryRestrictions: restrictions,
        hasRestrictions: restrictions.length > 0
      });
    } else if (recipe) {
      // Process recipe text to detect dietary restrictions
      const recipeText = recipe as string;
      
      // Simple ingredient extraction (a simplified version just for diet checking)
      const ingredientRegex = /([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/g;
      const matches = recipeText.match(ingredientRegex) || [];
      
      // Filter out small words and common non-ingredient words
      const commonNonIngredients = ['and', 'or', 'the', 'with', 'without', 'some', 'few', 'mix', 'stir', 'bake', 'cook'];
      const potentialIngredients = matches
        .filter(word => word.length > 2)
        .filter(word => !commonNonIngredients.includes(word.toLowerCase()));
      
      // Check dietary restrictions for each potential ingredient
      const dietaryRestrictionMap: { [key: string]: string[] } = {};
      const detectedIngredients: { name: string, dietaryRestrictions: string[] }[] = [];
      
      potentialIngredients.forEach((ingredient: string) => {
        const restrictions = detectDietaryRestrictions(ingredient);
        if (restrictions.length > 0) {
          detectedIngredients.push({
            name: ingredient,
            dietaryRestrictions: restrictions
          });
          
          // Add to dietary restriction map
          restrictions.forEach((diet: string) => {
            if (!dietaryRestrictionMap[diet]) {
              dietaryRestrictionMap[diet] = [];
            }
            if (!dietaryRestrictionMap[diet].includes(ingredient)) {
              dietaryRestrictionMap[diet].push(ingredient);
            }
          });
        }
      });
      
      return res.status(200).json({
        success: true,
        hasRestrictions: Object.keys(dietaryRestrictionMap).length > 0,
        dietaryRestrictionSummary: dietaryRestrictionMap,
        detectedIngredients: detectedIngredients
      });
    }
  } catch (error) {
    console.error('Error checking dietary restrictions:', error);
    res.status(500).json({ error: 'Failed to check dietary restrictions' });
  }
}