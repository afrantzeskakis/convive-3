import { db } from '../db';
import { recipes, recipeAnalyses, recipeTrainingData, type InsertRecipe, type InsertRecipeAnalysis, type InsertRecipeTrainingData } from '../../shared/schema';
import { analyzeRecipeWithAI } from '../recipe-analyzer';
import { processRecipeImage } from './recipe-image-processing';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';

// Initialize OpenAI - will be used for fine-tuning if API key is available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn('OPENAI_API_KEY is not set. Recipe training capabilities will be limited.');
}

/**
 * Add a new recipe to the database
 * @param recipe Recipe data to insert
 * @returns The inserted recipe
 */
export async function addRecipe(recipe: InsertRecipe): Promise<typeof recipes.$inferSelect> {
  const [insertedRecipe] = await db.insert(recipes).values(recipe).returning();
  return insertedRecipe;
}

/**
 * Process and analyze a recipe image
 * @param fileBuffer Uploaded file buffer
 * @param filename Original filename
 * @param recipeData Additional recipe data
 * @returns Created recipe with analysis
 */
export async function processAndAnalyzeRecipeImage(
  fileBuffer: Buffer,
  filename: string,
  recipeData: {
    restaurantId: number;
    name: string;
    description?: string;
    dishType?: string;
    cuisine?: string;
    createdBy?: number;
  }
): Promise<{
  recipe: typeof recipes.$inferSelect;
  analysis: typeof recipeAnalyses.$inferSelect | null;
}> {
  try {
    // Process the image to extract text
    const { filePath, extractedText } = await processRecipeImage(
      fileBuffer,
      filename,
      recipeData.restaurantId
    );
    
    // Create recipe entry
    const recipe = await addRecipe({
      restaurantId: recipeData.restaurantId,
      name: recipeData.name,
      description: recipeData.description,
      dishType: recipeData.dishType,
      cuisine: recipeData.cuisine,
      recipeText: extractedText,
      originalFilePath: filePath,
      fileType: filePath.split('.').pop()?.toLowerCase() || 'unknown',
      isImage: true,
      createdBy: recipeData.createdBy,
    });
    
    // Analyze the extracted text with our recipe analyzer
    const analysisResult = await analyzeRecipeWithAI(extractedText);
    
    // Save the analysis results
    const [analysis] = await db.insert(recipeAnalyses).values({
      recipeId: recipe.id,
      ingredients: analysisResult.ingredients,
      techniques: analysisResult.techniques,
      allergenSummary: analysisResult.allergenSummary || {},
      dietaryRestrictionSummary: analysisResult.dietaryRestrictionSummary || {},
      aiGenerated: analysisResult.isAIEnabled,
      confidence: 0.85, // Default confidence for initial analysis
    }).returning();
    
    return {
      recipe,
      analysis,
    };
  } catch (error) {
    console.error('Error processing and analyzing recipe image:', error);
    throw error;
  }
}

/**
 * Save feedback for recipe analysis
 * @param analysisId Analysis ID
 * @param feedback Feedback data
 * @returns Updated analysis
 */
export async function saveAnalysisFeedback(
  analysisId: number,
  feedback: {
    rating: number;
    notes?: string;
  }
): Promise<typeof recipeAnalyses.$inferSelect> {
  const [updatedAnalysis] = await db.update(recipeAnalyses)
    .set({
      feedbackRating: feedback.rating,
      feedbackNotes: feedback.notes,
      updatedAt: new Date(),
    })
    .where(eq(recipeAnalyses.id, analysisId))
    .returning();
  
  return updatedAnalysis;
}

/**
 * Mark a recipe for inclusion in training
 * @param recipeId Recipe ID
 * @param analysisId Analysis ID
 * @param include Whether to include in training
 * @returns Training data entry
 */
export async function setRecipeTrainingStatus(
  recipeId: number,
  analysisId: number,
  include: boolean
): Promise<typeof recipeTrainingData.$inferSelect> {
  // Check if there's an existing training data entry
  const existingEntries = await db.select()
    .from(recipeTrainingData)
    .where(eq(recipeTrainingData.recipeId, recipeId));
  
  if (existingEntries.length > 0) {
    // Update existing entry
    const [updatedEntry] = await db.update(recipeTrainingData)
      .set({
        includeInTraining: include,
        updatedAt: new Date(),
      })
      .where(eq(recipeTrainingData.id, existingEntries[0].id))
      .returning();
    
    return updatedEntry;
  } else {
    // Create new entry
    const [newEntry] = await db.insert(recipeTrainingData)
      .values({
        recipeId,
        analysisId,
        includeInTraining: include,
        trainingSetId: `training_set_${Date.now()}`,
      })
      .returning();
    
    return newEntry;
  }
}

/**
 * Get recipes that are marked for training
 * @returns Array of recipe IDs for training
 */
export async function getRecipesForTraining(): Promise<number[]> {
  const trainingData = await db.select({
    recipeId: recipeTrainingData.recipeId,
  })
    .from(recipeTrainingData)
    .where(eq(recipeTrainingData.includeInTraining, true));
  
  return trainingData.map(item => item.recipeId);
}

/**
 * Create training data in the format required by OpenAI fine-tuning
 * @param recipeIds Recipe IDs to include
 * @returns Training data in OpenAI format
 */
export async function createTrainingData(recipeIds: number[]): Promise<any[]> {
  // Fetch recipes and their analyses
  const recipesWithAnalyses = await Promise.all(
    recipeIds.map(async (recipeId) => {
      const recipe = await db.select().from(recipes).where(eq(recipes.id, recipeId)).then(res => res[0]);
      
      if (!recipe) return null;
      
      const analysis = await db.select()
        .from(recipeAnalyses)
        .where(eq(recipeAnalyses.recipeId, recipeId))
        .then(res => res[0]);
      
      return { recipe, analysis };
    })
  );
  
  // Filter out any null entries and format for OpenAI
  const trainingData = recipesWithAnalyses
    .filter(Boolean)
    .map(({ recipe, analysis }) => ({
      messages: [
        {
          role: "system",
          content: "You are a professional culinary expert and allergen specialist. Analyze this recipe and identify all ingredients and cooking techniques. For each ingredient, explain WHY it's being used in this dish and how it contributes to the flavor profile, texture, and dining experience. \n\nIMPORTANT: For EVERY ingredient, you must identify any of the 25 common allergens it contains or is derived from and identify common dietary restrictions it violates."
        },
        {
          role: "user",
          content: recipe.recipeText
        },
        {
          role: "assistant",
          content: JSON.stringify({
            ingredients: analysis.ingredients,
            techniques: analysis.techniques,
            allergenSummary: analysis.allergenSummary,
            dietaryRestrictionSummary: analysis.dietaryRestrictionSummary
          })
        }
      ]
    }));
  
  return trainingData;
}

/**
 * Initialize fine-tuning job with OpenAI
 * @param trainingData Training data for fine-tuning
 * @returns Job ID if successful
 */
export async function initializeFineTuning(trainingData: any[]): Promise<string | null> {
  if (!openai) {
    console.error('OpenAI client not initialized. Cannot fine-tune.');
    return null;
  }
  
  try {
    // Generate a unique file name for the upload
    const fileName = `recipe_training_${Date.now()}.jsonl`;
    
    // Convert training data to JSONL format
    const jsonlData = trainingData.map(item => JSON.stringify(item)).join('\n');
    
    // Upload the training data file to OpenAI
    const file = await openai.files.create({
      file: Buffer.from(jsonlData),
      purpose: 'fine-tune'
    });
    
    // Create fine-tuning job
    const fineTuningJob = await openai.fineTuning.jobs.create({
      training_file: file.id,
      model: 'gpt-4o-2024-05-13', // ensure you're using a supported model
      suffix: 'recipe-analysis-specialist',
    });
    
    return fineTuningJob.id;
  } catch (error) {
    console.error('Error initializing fine-tuning:', error);
    return null;
  }
}

/**
 * Check status of a fine-tuning job
 * @param jobId Fine-tuning job ID
 * @returns Job status or null if error
 */
export async function checkFineTuningStatus(jobId: string): Promise<any | null> {
  if (!openai) {
    console.error('OpenAI client not initialized. Cannot check fine-tuning status.');
    return null;
  }
  
  try {
    const job = await openai.fineTuning.jobs.retrieve(jobId);
    return job;
  } catch (error) {
    console.error('Error checking fine-tuning status:', error);
    return null;
  }
}

/**
 * List all recipes with their analysis status
 * @param restaurantId Optional restaurant ID filter
 * @returns List of recipes with analysis information
 */
export async function listRecipesWithAnalysisStatus(restaurantId?: number): Promise<any[]> {
  let query = db.select({
    id: recipes.id,
    name: recipes.name,
    description: recipes.description,
    restaurant: recipes.restaurantId,
    status: recipes.status,
    isImage: recipes.isImage,
    createdAt: recipes.createdAt,
    hasAnalysis: recipeAnalyses.id,
    feedbackRating: recipeAnalyses.feedbackRating,
  })
    .from(recipes)
    .leftJoin(recipeAnalyses, eq(recipes.id, recipeAnalyses.recipeId));
  
  if (restaurantId) {
    query = query.where(eq(recipes.restaurantId, restaurantId));
  }
  
  return await query;
}