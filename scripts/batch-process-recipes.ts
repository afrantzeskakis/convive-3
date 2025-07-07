import { db } from '../server/db';
import { processRecipeImage } from '../server/services/recipe-image-processing';
import { parseRecipeWithoutAI, detectAllergens, detectDietaryRestrictions } from '../server/recipe-analyzer';
import { recipes, recipeAnalyses, recipeTrainingData } from '../shared/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

// Default restaurant ID for uploaded recipes
const DEFAULT_RESTAURANT_ID = 1; // Bella Italia Restaurant

/**
 * Process multiple recipe images at once
 * @param imagePaths Array of paths to recipe images
 */
async function batchProcessRecipes(imagePaths: string[]) {
  console.log(`Starting batch processing of ${imagePaths.length} recipes...`);

  for (const [index, imagePath] of imagePaths.entries()) {
    try {
      const filename = path.basename(imagePath);
      console.log(`\n[${index + 1}/${imagePaths.length}] Processing: ${filename}`);
      
      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        console.error(`  ERROR: File not found: ${imagePath}`);
        continue;
      }
      
      // Read the image file
      const fileBuffer = fs.readFileSync(imagePath);
      
      // Get basic image info
      const imageInfo = await sharp(fileBuffer).metadata();
      console.log(`  Image dimensions: ${imageInfo.width}x${imageInfo.height}, format: ${imageInfo.format}`);
      
      // Process the image (OCR and text extraction)
      console.log("  Extracting text with OCR...");
      const { filePath: savedPath, extractedText } = await processRecipeImage(
        fileBuffer,
        filename,
        DEFAULT_RESTAURANT_ID
      );
      
      console.log(`  Image saved to: ${savedPath}`);
      console.log(`  Extracted text length: ${extractedText.length} characters`);
      
      if (extractedText.length < 10) {
        console.log("  WARNING: Very little text extracted, may need to improve OCR settings");
      }
      
      // Save recipe to database
      const [recipe] = await db.insert(recipes).values({
        restaurantId: DEFAULT_RESTAURANT_ID,
        name: `Recipe from ${filename}`,
        description: `Automatically extracted from ${filename}`,
        dishType: null,
        cuisine: null,
        recipeText: extractedText,
        originalFilePath: savedPath,
        fileType: path.extname(filename).substring(1),
        isImage: true,
        status: 'pending',
        createdBy: null,
      }).returning();
      
      console.log(`  Created recipe record with ID: ${recipe.id}`);
      
      // Parse recipe with fallback method
      console.log("  Analyzing recipe with fallback parser...");
      const parseResult = parseRecipeWithoutAI(extractedText);
      
      // Process ingredients to add allergen and dietary restriction information
      const processedIngredients = parseResult.ingredients.map(name => {
        const allergens = detectAllergens(name);
        const dietaryRestrictions = detectDietaryRestrictions(name);
        
        return {
          type: 'ingredient' as const,
          name,
          description: 'Extracted with fallback parser',
          allergens: allergens.length > 0 ? allergens : undefined,
          dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined
        };
      });
      
      // Process techniques
      const processedTechniques = parseResult.techniques.map(name => {
        return {
          type: 'technique' as const,
          name,
          description: 'Extracted with fallback parser'
        };
      });
      
      console.log(`  Found ${processedIngredients.length} ingredients and ${processedTechniques.length} techniques`);
      
      // Create allergen summary
      const allergenSummary: { [key: string]: string[] } = {};
      processedIngredients.forEach(ingredient => {
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
      processedIngredients.forEach(ingredient => {
        if (ingredient.dietaryRestrictions && ingredient.dietaryRestrictions.length > 0) {
          ingredient.dietaryRestrictions.forEach(restriction => {
            if (!dietaryRestrictionSummary[restriction]) {
              dietaryRestrictionSummary[restriction] = [];
            }
            dietaryRestrictionSummary[restriction].push(ingredient.name);
          });
        }
      });
      
      // Store analysis results
      const [analysis] = await db.insert(recipeAnalyses).values({
        recipeId: recipe.id,
        ingredients: processedIngredients,
        techniques: processedTechniques,
        allergenSummary: allergenSummary,
        dietaryRestrictionSummary: dietaryRestrictionSummary,
        aiGenerated: false,
        confidence: 0.70, // Lower confidence for fallback parsing
      }).returning();
      
      console.log(`  Created analysis record with ID: ${analysis.id}`);
      
      // Mark recipe for training
      const [trainingData] = await db.insert(recipeTrainingData).values({
        recipeId: recipe.id,
        analysisId: analysis.id,
        includeInTraining: true,
        trainingSetId: `batch_fallback_${Date.now()}`,
      }).returning();
      
      console.log(`  Marked recipe for training with ID: ${trainingData.id}`);
      
      // Update recipe status
      await db.update(recipes)
        .set({
          status: 'analyzed',
          updatedAt: new Date(),
        })
        .where(eq(recipes.id, recipe.id));
      
      console.log(`  Updated recipe status to 'analyzed'`);
      
      // Print sample of ingredients and techniques
      if (processedIngredients.length > 0) {
        console.log("\n  Sample ingredients:");
        processedIngredients.slice(0, Math.min(5, processedIngredients.length)).forEach(ing => {
          console.log(`  - ${ing.name}`);
        });
      }
      
      if (processedTechniques.length > 0) {
        console.log("\n  Identified techniques:");
        processedTechniques.forEach(tech => {
          console.log(`  - ${tech.name}`);
        });
      }
      
      console.log(`\n✅ Successfully processed recipe: ${filename}`);
      
    } catch (error) {
      console.error(`Error processing image ${imagePaths[index]}:`, error);
    }
  }
  
  console.log("\nBatch processing complete!");
}

/**
 * Main function to process all images in a directory
 */
async function processAllRecipeImages(directory: string, startIdx: number = 0, endIdx: number = -1) {
  try {
    // Check if directory exists
    if (!fs.existsSync(directory)) {
      console.error(`Assets directory not found: ${directory}`);
      return;
    }
    
    // Get all image files from the directory
    const files = fs.readdirSync(directory);
    const imageFiles = files.filter(file => {
      const extension = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(extension);
    });
    
    console.log(`Found ${imageFiles.length} image files in ${directory}`);
    
    // If a specific range was requested
    const startIndex = startIdx >= 0 ? startIdx : 0;
    const endIndex = endIdx >= 0 ? Math.min(endIdx, imageFiles.length - 1) : imageFiles.length - 1;
    
    // Create full paths for the selected range of images
    const imagePaths = imageFiles
      .slice(startIndex, endIndex + 1) // +1 because slice end is exclusive
      .map(file => path.join(directory, file));
    
    console.log(`Processing ${imagePaths.length} images (indexes ${startIndex} to ${endIndex})`);
    
    // Process images in batch
    await batchProcessRecipes(imagePaths);
    
  } catch (error) {
    console.error("Error during batch recipe processing:", error);
    throw error;
  }
}

// Directory of recipe images
const assetsDir = path.join(process.cwd(), 'attached_assets');

// Get command line arguments
const args = process.argv.slice(2);
const startIdx = args.length > 0 ? parseInt(args[0]) : 1; // Skip first image (already processed)
const endIdx = args.length > 1 ? parseInt(args[1]) : -1;  // Process all remaining by default

// Run the batch processing
processAllRecipeImages(assetsDir, startIdx, endIdx)
  .then(() => {
    console.log("Batch recipe processing complete!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Failed to process recipe images:", error);
    process.exit(1);
  });