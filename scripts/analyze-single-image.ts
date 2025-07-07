import * as fs from 'fs';
import * as path from 'path';
import { processRecipeImage } from '../server/services/recipe-image-processing';
import { parseRecipeWithoutAI, detectAllergens, detectDietaryRestrictions } from '../server/recipe-analyzer';

/**
 * Analyzes a single recipe image file
 */
async function analyzeSingleImage(imagePath: string) {
  try {
    console.log(`Analyzing image: ${imagePath}`);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`File not found: ${imagePath}`);
      return;
    }
    
    // Get file information
    const stats = fs.statSync(imagePath);
    console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Read the image file
    const fileBuffer = fs.readFileSync(imagePath);
    const fileName = path.basename(imagePath);
    
    // Process the image (save and extract text)
    console.log("Extracting text with OCR...");
    const { filePath, extractedText } = await processRecipeImage(
      fileBuffer,
      fileName,
      1 // Default restaurant ID = 1
    );
    
    console.log(`Image saved to: ${filePath}`);
    console.log(`Extracted text length: ${extractedText.length} characters`);
    console.log("Extracted text:");
    console.log("------------------------------------");
    console.log(extractedText);
    console.log("------------------------------------");
    
    // Parse the extracted text
    console.log("Analyzing text with fallback parser...");
    const parseResult = parseRecipeWithoutAI(extractedText);
    
    console.log(`Found ${parseResult.ingredients.length} ingredients and ${parseResult.techniques.length} techniques`);
    
    // Process ingredients to detect allergens and dietary restrictions
    const ingredientsWithDetails = parseResult.ingredients.map(name => {
      const allergens = detectAllergens(name);
      const dietaryRestrictions = detectDietaryRestrictions(name);
      
      return {
        name,
        allergens: allergens.length > 0 ? allergens : [],
        dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : []
      };
    });
    
    // Create allergen and dietary restriction summaries
    const allergenSummary: { [key: string]: string[] } = {};
    const dietaryRestrictionSummary: { [key: string]: string[] } = {};
    
    ingredientsWithDetails.forEach(ingredient => {
      ingredient.allergens.forEach(allergen => {
        if (!allergenSummary[allergen]) {
          allergenSummary[allergen] = [];
        }
        allergenSummary[allergen].push(ingredient.name);
      });
      
      ingredient.dietaryRestrictions.forEach(restriction => {
        if (!dietaryRestrictionSummary[restriction]) {
          dietaryRestrictionSummary[restriction] = [];
        }
        dietaryRestrictionSummary[restriction].push(ingredient.name);
      });
    });
    
    console.log("\nIngredients:");
    ingredientsWithDetails.forEach(ing => {
      console.log(`- ${ing.name}`);
      if (ing.allergens.length > 0) {
        console.log(`  Allergens: ${ing.allergens.join(', ')}`);
      }
      if (ing.dietaryRestrictions.length > 0) {
        console.log(`  Dietary restrictions: ${ing.dietaryRestrictions.join(', ')}`);
      }
    });
    
    console.log("\nTechniques:");
    parseResult.techniques.forEach(tech => {
      console.log(`- ${tech}`);
    });
    
    console.log("\nAllergen Summary:");
    Object.keys(allergenSummary).forEach(allergen => {
      console.log(`- ${allergen}: ${allergenSummary[allergen].join(', ')}`);
    });
    
    console.log("\nDietary Restriction Summary:");
    Object.keys(dietaryRestrictionSummary).forEach(restriction => {
      console.log(`- ${restriction}: ${dietaryRestrictionSummary[restriction].join(', ')}`);
    });
    
    console.log("\nAnalysis complete!");
    
  } catch (error) {
    console.error('Error analyzing image:', error);
  }
}

// Get the image path from command line arguments
const imagePath = process.argv[2];

if (!imagePath) {
  console.error("Please provide an image file path as a command line argument");
  process.exit(1);
}

// Run the function
analyzeSingleImage(imagePath)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Failed to analyze image:', error);
    process.exit(1);
  });