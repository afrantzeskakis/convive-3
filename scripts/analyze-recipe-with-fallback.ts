import { db } from '../server/db';
import { recipes, recipeAnalyses, recipeTrainingData } from '../shared/schema';
import { parseRecipeWithoutAI, detectAllergens, detectDietaryRestrictions } from '../server/recipe-analyzer';
import { eq } from 'drizzle-orm';

/**
 * Analyzes a recipe using only the fallback parser (no OpenAI API calls)
 */
async function analyzeRecipeWithFallback(recipeId: number) {
  console.log(`Analyzing recipe with ID: ${recipeId} using fallback parser...`);

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
    
    // Check if recipe has already been analyzed
    const existingAnalysis = await db.select()
      .from(recipeAnalyses)
      .where(eq(recipeAnalyses.recipeId, recipeId))
      .orderBy(recipeAnalyses.createdAt, 'desc')
      .limit(1);
    
    if (existingAnalysis.length > 0) {
      const analysis = existingAnalysis[0];
      console.log(`Found existing analysis with ID: ${analysis.id}`);
      console.log(`Analysis contains ${analysis.ingredients.length} ingredients and ${analysis.techniques.length} techniques`);
      console.log("Using cached analysis result");
      
      // Print sample of ingredients and techniques from existing analysis
      console.log("\nSample ingredients:");
      analysis.ingredients.slice(0, 5).forEach((ing: any) => {
        console.log(`- ${ing.name}`);
      });
      
      console.log("\nIdentified techniques:");
      analysis.techniques.forEach((tech: any) => {
        console.log(`- ${tech.name}`);
      });
      
      return analysis;
    }
    
    // Parse the recipe using our fallback method
    console.log("Parsing recipe text with fallback method...");
    const parseResult = parseRecipeWithoutAI(recipe.recipeText);
    
    console.log(`Parsing complete! Found ${parseResult.ingredients.length} ingredients and ${parseResult.techniques.length} techniques.`);
    
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
    
    console.log("Allergens detected:", Object.keys(allergenSummary).join(", ") || "None");
    console.log("Dietary restrictions affected:", Object.keys(dietaryRestrictionSummary).join(", ") || "None");
    
    // Create analysis record
    const [analysis] = await db.insert(recipeAnalyses).values({
      recipeId: recipe.id,
      ingredients: processedIngredients,
      techniques: processedTechniques,
      allergenSummary: allergenSummary,
      dietaryRestrictionSummary: dietaryRestrictionSummary,
      aiGenerated: false,
      confidence: 0.70, // Lower confidence for fallback parsing
    }).returning();
    
    console.log(`Created analysis record with ID: ${analysis.id}`);
    
    // Mark recipe for training
    const [trainingData] = await db.insert(recipeTrainingData).values({
      recipeId: recipe.id,
      analysisId: analysis.id,
      includeInTraining: true,
      trainingSetId: `fallback_training_${Date.now()}`,
    }).returning();
    
    console.log(`Marked recipe for training with ID: ${trainingData.id}`);
    
    // Update recipe status
    await db.update(recipes)
      .set({
        status: 'analyzed',
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, recipeId));
    
    console.log(`Updated recipe status to 'analyzed'`);
    console.log("Recipe analysis with fallback parser complete!");
    
    // Print sample of ingredients and techniques
    console.log("\nSample ingredients:");
    processedIngredients.slice(0, 5).forEach(ing => {
      console.log(`- ${ing.name}`);
    });
    
    console.log("\nIdentified techniques:");
    processedTechniques.forEach(tech => {
      console.log(`- ${tech.name}`);
    });
    
    return analysis;
    
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
analyzeRecipeWithFallback(recipeId)
  .then(() => {
    console.log(`Completed fallback analysis for recipe ID: ${recipeId}`);
    process.exit(0);
  })
  .catch(error => {
    console.error(`Failed to analyze recipe ${recipeId}:`, error);
    process.exit(1);
  });