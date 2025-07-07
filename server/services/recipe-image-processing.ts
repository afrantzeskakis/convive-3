import * as fs from 'fs';
import * as path from 'path';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Get the directory path for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define uploads directory for recipe images
const UPLOADS_DIR = path.join(__dirname, '../../uploads/recipes');

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Preprocess an image for better OCR results
 * @param imagePath Path to the original image
 * @returns Path to the preprocessed image
 */
export async function preprocessImage(imagePath: string): Promise<string> {
  const preprocessedPath = path.join(
    path.dirname(imagePath),
    `preprocessed_${path.basename(imagePath)}`
  );

  try {
    // Preprocessing pipeline to improve OCR accuracy:
    // 1. Convert to grayscale
    // 2. Apply contrast enhancement
    // 3. Perform slight sharpening
    // 4. Apply mild noise reduction
    await sharp(imagePath)
      .grayscale()
      .normalize() // Normalize the image (stretch histogram)
      .sharpen() // Apply sharpening
      .median(1) // Apply median filter for noise reduction
      .toFile(preprocessedPath);

    return preprocessedPath;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    // If preprocessing fails, return the original image path
    return imagePath;
  }
}

/**
 * Extract text content from a recipe image using OCR
 * @param imagePath Path to the image file
 * @returns Extracted text content
 */
export async function extractTextFromImage(imagePath: string): Promise<string> {
  try {
    // Preprocess the image for better OCR results
    const preprocessedPath = await preprocessImage(imagePath);
    
    // Create a new worker with language set to English
    const worker = await createWorker('eng');
    
    // Configure worker for recipe types of content
    await worker.setParameters({
      tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:\'"\\/|_-+=(){}[]<>!?@#$%^&* ',
      preserve_interword_spaces: '1',
    });

    // Recognize text in the image
    const { data: { text } } = await worker.recognize(preprocessedPath);
    
    // Terminate the worker to free up resources
    await worker.terminate();

    // Check if the preprocessed file is different from the original
    if (preprocessedPath !== imagePath) {
      // Remove the preprocessed file after processing
      try {
        fs.unlinkSync(preprocessedPath);
      } catch (error) {
        console.error('Error removing preprocessed image:', error);
      }
    }

    // Clean up the extracted text
    const cleanedText = cleanOCRText(text);
    
    return cleanedText;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    return '';
  }
}

/**
 * Clean and normalize text extracted from OCR
 * @param text Raw OCR text
 * @returns Cleaned and normalized text
 */
function cleanOCRText(text: string): string {
  if (!text) return '';
  
  // Replace multiple spaces with a single space
  let cleaned = text.replace(/\s+/g, ' ');
  
  // Remove any non-printable characters
  cleaned = cleaned.replace(/[^\x20-\x7E\n\r]/g, '');
  
  // Fix common OCR errors in recipe context
  cleaned = cleaned
    // Fix common OCR errors for measurements
    .replace(/([0-9])l/g, '$1 l') // Add space between number and 'l' for liters
    .replace(/([0-9])g/g, '$1 g') // Add space between number and 'g' for grams
    .replace(/([0-9])rng/g, '$1 mg') // Fix 'mg' misread as 'rng'
    .replace(/([0-9])rnl/g, '$1 ml') // Fix 'ml' misread as 'rnl'
    .replace(/([0-9])c\./g, '$1 c.') // Add space for cups abbreviation
    .replace(/([0-9])tbsp/gi, '$1 tbsp') // Add space for tablespoon
    .replace(/([0-9])tsp/gi, '$1 tsp') // Add space for teaspoon
    .replace(/([0-9])oz/gi, '$1 oz') // Add space for ounce
    
    // Fix common ingredient OCR errors
    .replace(/ollve/gi, 'olive') // Fix olive oil common misread
    .replace(/vrnegar/gi, 'vinegar') // Fix vinegar misread
    .replace(/Sait/gi, 'Salt') // Fix Salt misread
    .replace(/0nion/gi, 'Onion') // Fix Onion misread (0 instead of O)
    .replace(/Carlle/gi, 'Garlic') // Fix Garlic misread
    .replace(/Cilck/gi, 'Click') // Fix Click misread
    
    // Clean up stray punctuation
    .replace(/\s+([.,;:])/g, '$1') // Remove spaces before punctuation
    .replace(/([.,;:])\s+/g, '$1 ') // Ensure single space after punctuation
    
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n'); // Replace 3+ line breaks with 2
    
  return cleaned;
}

/**
 * Save a recipe image file to the uploads directory
 * @param file The uploaded file object
 * @param restaurantId The ID of the restaurant
 * @returns Path to the saved file
 */
export async function saveRecipeImage(
  fileBuffer: Buffer,
  originalFilename: string,
  restaurantId: number
): Promise<string> {
  // Create restaurant-specific directory
  const restaurantDir = path.join(UPLOADS_DIR, `restaurant_${restaurantId}`);
  if (!fs.existsSync(restaurantDir)) {
    fs.mkdirSync(restaurantDir, { recursive: true });
  }
  
  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const uniqueFilename = `recipe_${timestamp}_${path.basename(originalFilename)}`;
  const filePath = path.join(restaurantDir, uniqueFilename);
  
  // Write the file
  fs.writeFileSync(filePath, fileBuffer);
  
  return filePath;
}

/**
 * Process a recipe image file: save it and extract text
 * @param fileBuffer The uploaded file buffer
 * @param originalFilename Original filename
 * @param restaurantId Restaurant ID
 * @returns Object with file path and extracted text
 */
export async function processRecipeImage(
  fileBuffer: Buffer,
  originalFilename: string,
  restaurantId: number
): Promise<{ filePath: string; extractedText: string }> {
  // Save the image
  const filePath = await saveRecipeImage(fileBuffer, originalFilename, restaurantId);
  
  // Extract text from the image
  const extractedText = await extractTextFromImage(filePath);
  
  return {
    filePath,
    extractedText
  };
}