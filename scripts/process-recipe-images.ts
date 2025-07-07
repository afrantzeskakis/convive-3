import { db } from '../server/db';
import { processRecipeImage } from '../server/services/recipe-image-processing';
import { analyzeRecipeWithAI } from '../server/recipe-analyzer';
import { recipes, recipeAnalyses, recipeTrainingData } from '../shared/schema';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

// Default restaurant ID for uploaded recipes
const DEFAULT_RESTAURANT_ID = 1; // Bella Italia Restaurant

/**
 * Process recipe images from the attached_assets directory
 */
async function processRecipeImages() {
  console.log("Starting recipe image processing...");

  try {
    // Path to attached recipe images
    const assetsDir = path.join(process.cwd(), 'attached_assets');
    
    // Check if directory exists
    if (!fs.existsSync(assetsDir)) {
      console.error(`Assets directory not found: ${assetsDir}`);
      return;
    }
    
    // Get all image files from the directory
    const files = fs.readdirSync(assetsDir);
    const imageFiles = files.filter(file => {
      const extension = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(extension);
    });
    
    console.log(`Found ${imageFiles.length} image files to process`);
    
    // Process each image file
    for (const [index, file] of imageFiles.entries()) {
      const filePath = path.join(assetsDir, file);
      console.log(`Processing image ${index + 1}/${imageFiles.length}: ${file}`);
      
      try {
        // Read the image file
        const fileBuffer = fs.readFileSync(filePath);
        
        // Get basic image info
        const imageInfo = await sharp(fileBuffer).metadata();
        console.log(`Image dimensions: ${imageInfo.width}x${imageInfo.height}, format: ${imageInfo.format}`);
        
        // Process the image (OCR and text extraction)
        const { filePath: savedPath, extractedText } = await processRecipeImage(
          fileBuffer,
          file,
          DEFAULT_RESTAURANT_ID
        );
        
        console.log(`Image saved to: ${savedPath}`);
        console.log(`Extracted text length: ${extractedText.length} characters`);
        
        // Save recipe to database
        const [recipe] = await db.insert(recipes).values({
          restaurantId: DEFAULT_RESTAURANT_ID,
          name: `Recipe from ${file}`,
          description: `Automatically extracted from ${file}`,
          dishType: null,
          cuisine: null,
          recipeText: extractedText,
          originalFilePath: savedPath,
          fileType: path.extname(file).substring(1),
          isImage: true,
          status: 'analyzed',
          createdBy: null,
        }).returning();
        
        console.log(`Created recipe record with ID: ${recipe.id}`);
        
        // Analyze the recipe with AI
        console.log("Analyzing recipe with AI...");
        const analysisResult = await analyzeRecipeWithAI(extractedText);
        
        // Store analysis results
        const [analysis] = await db.insert(recipeAnalyses).values({
          recipeId: recipe.id,
          ingredients: analysisResult.ingredients,
          techniques: analysisResult.techniques,
          allergenSummary: analysisResult.allergenSummary || {},
          dietaryRestrictionSummary: analysisResult.dietaryRestrictionSummary || {},
          aiGenerated: analysisResult.isAIEnabled,
          confidence: 0.85, // Default confidence for initial analysis
        }).returning();
        
        console.log(`Created analysis record with ID: ${analysis.id}`);
        
        // Mark recipe for training
        const [trainingData] = await db.insert(recipeTrainingData).values({
          recipeId: recipe.id,
          analysisId: analysis.id,
          includeInTraining: true,
          trainingSetId: `initial_training_${Date.now()}`,
        }).returning();
        
        console.log(`Marked recipe for training with ID: ${trainingData.id}`);
        console.log(`Successfully processed and analyzed: ${file}`);
        console.log("---------------------------------------------------");
      } catch (error) {
        console.error(`Error processing image ${file}:`, error);
      }
    }
    
    console.log("Recipe image processing complete!");
  } catch (error) {
    console.error("Error during recipe image processing:", error);
    throw error;
  }
}

// Run the function
processRecipeImages()
  .then(() => {
    console.log("Recipe image processing complete!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Failed to process recipe images:", error);
    process.exit(1);
  });