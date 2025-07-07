import { db } from '../server/db';
import { recipes, recipeAnalyses, recipeTrainingData } from '../shared/schema';
import { analyzeRecipeWithAI } from '../server/recipe-analyzer';
import { eq } from 'drizzle-orm';

// Process a specific recipe by ID
async function analyzeRecipeById(recipeId: number) {
  console.log(`Analyzing recipe with ID: ${recipeId}`);

  try {
    // Get the recipe from the database
    const recipe = await db.select().from(recipes).where(eq(recipes.id, recipeId)).then(res => res[0]);
    
    if (!recipe) {
      console.error(`Recipe with ID ${recipeId} not found`);
      return;
    }
    
    console.log(`Recipe found: ${recipe.name}`);
    console.log(`Recipe text: ${recipe.recipeText ? recipe.recipeText.substring(0, 100) + '...' : 'No text available'}`);
    
    if (!recipe.recipeText) {
      console.error(`Recipe has no text to analyze`);
      return;
    }
    
    // Check if analysis already exists
    const existingAnalysis = await db.select()
      .from(recipeAnalyses)
      .where(eq(recipeAnalyses.recipeId, recipeId))
      .then(res => res[0]);
    
    if (existingAnalysis) {
      console.log(`Analysis already exists with ID: ${existingAnalysis.id}`);
      
      // Ask for confirmation to reanalyze
      console.log("Proceeding with reanalysis...");
    }
    
    // Analyze the recipe with AI
    console.log("Analyzing recipe with AI...");
    const analysisResult = await analyzeRecipeWithAI(recipe.recipeText);
    
    console.log("Analysis complete!");
    console.log(`Ingredients found: ${analysisResult.ingredients.length}`);
    console.log(`Techniques found: ${analysisResult.techniques.length}`);
    console.log(`AI enabled: ${analysisResult.isAIEnabled}`);
    
    // Update existing analysis or create a new one
    if (existingAnalysis) {
      // Update existing analysis
      const [updatedAnalysis] = await db.update(recipeAnalyses)
        .set({
          ingredients: analysisResult.ingredients,
          techniques: analysisResult.techniques,
          allergenSummary: analysisResult.allergenSummary || {},
          dietaryRestrictionSummary: analysisResult.dietaryRestrictionSummary || {},
          aiGenerated: analysisResult.isAIEnabled,
          updatedAt: new Date(),
        })
        .where(eq(recipeAnalyses.id, existingAnalysis.id))
        .returning();
      
      console.log(`Updated analysis with ID: ${updatedAnalysis.id}`);
    } else {
      // Create a new analysis
      const [newAnalysis] = await db.insert(recipeAnalyses)
        .values({
          recipeId: recipe.id,
          ingredients: analysisResult.ingredients,
          techniques: analysisResult.techniques,
          allergenSummary: analysisResult.allergenSummary || {},
          dietaryRestrictionSummary: analysisResult.dietaryRestrictionSummary || {},
          aiGenerated: analysisResult.isAIEnabled,
          confidence: 0.85, // Default confidence for initial analysis
        })
        .returning();
      
      console.log(`Created new analysis with ID: ${newAnalysis.id}`);
      
      // Mark recipe for training
      const [trainingData] = await db.insert(recipeTrainingData)
        .values({
          recipeId: recipe.id,
          analysisId: newAnalysis.id,
          includeInTraining: true,
          trainingSetId: `training_${Date.now()}`,
        })
        .returning();
      
      console.log(`Marked recipe for training with ID: ${trainingData.id}`);
    }
    
    // Update recipe status
    await db.update(recipes)
      .set({
        status: 'analyzed',
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, recipeId));
    
    console.log(`Updated recipe status to 'analyzed'`);
    console.log("Recipe analysis complete!");
    
  } catch (error) {
    console.error(`Error analyzing recipe with ID ${recipeId}:`, error);
    throw error;
  }
}

// Get the recipe ID from command line arguments
const recipeId = parseInt(process.argv[2]);

if (!recipeId || isNaN(recipeId)) {
  console.error("Please provide a recipe ID as a command line argument");
  process.exit(1);
}

// Run the function
analyzeRecipeById(recipeId)
  .then(() => {
    console.log(`Completed analysis for recipe ID: ${recipeId}`);
    process.exit(0);
  })
  .catch(error => {
    console.error(`Failed to analyze recipe ${recipeId}:`, error);
    process.exit(1);
  });