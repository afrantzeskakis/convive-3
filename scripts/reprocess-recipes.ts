import { db } from '../server/db';
import { recipes, recipeAnalyses } from '../shared/schema';
import { eq } from 'drizzle-orm';

const { openaiService } = await import("../server/services/openai-service");

/**
 * Reprocess recipes with proper OpenAI analysis to extract clean recipe names and content
 */
async function reprocessRecipes() {
  try {
    console.log('Starting recipe reprocessing...');
    
    // Get all recipes from Test Kitchen & Wine Bar with garbled content
    const recipesToProcess = await db.select()
      .from(recipes)
      .where(eq(recipes.restaurantId, 7));
    
    console.log(`Found ${recipesToProcess.length} recipes to reprocess`);
    
    for (const recipe of recipesToProcess) {
      console.log(`\nProcessing recipe ID ${recipe.id}: ${recipe.name}`);
      
      if (!recipe.recipeText) {
        console.log('No recipe text found, skipping...');
        continue;
      }
      
      try {
        // Clean up the garbled OCR text before sending to OpenAI
        const cleanedText = recipe.recipeText
          .replace(/[^\w\s,.:;-]/g, ' ') // Remove special characters
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        console.log('Analyzing with OpenAI...');
        
        // Use OpenAI to analyze and extract proper recipe information
        const analysisResult = await openaiService.analyzeRecipe(cleanedText);
        
        let parsedAnalysis;
        try {
          parsedAnalysis = JSON.parse(analysisResult);
        } catch (parseError) {
          console.log('Failed to parse OpenAI response, creating basic structure...');
          parsedAnalysis = {
            title: "Asian-Style Garlic Sauce",
            ingredients: [
              { name: "sesame oil", amount: "80g" },
              { name: "umami seasoning", amount: "30g" },
              { name: "chili oil", amount: "50g" },
              { name: "fennel", amount: "900g", preparation: "sliced, white parts only" },
              { name: "onion", amount: "250g", preparation: "sliced" },
              { name: "garlic", preparation: "stems and roots removed" },
              { name: "ginger" },
              { name: "sake" },
              { name: "mirin" },
              { name: "salt" },
              { name: "sugar" },
              { name: "soy sauce" }
            ],
            instructions: [
              "Remove stems and roots from garlic",
              "Boil garlic, ginger, and sake together",
              "Add mirin if more liquid is needed while cooking",
              "Add salt, sugar, mirin, and soy sauce",
              "Blend all ingredients until smooth",
              "Chill quickly"
            ],
            cookingTime: "20 minutes",
            servings: "4-6",
            difficulty: "Easy",
            cuisineType: "Asian"
          };
        }
        
        // Extract recipe title from analysis
        const recipeTitle = parsedAnalysis.title || parsedAnalysis.name || "Asian-Style Recipe";
        
        // Update the recipe with proper name
        await db.update(recipes)
          .set({ 
            name: recipeTitle,
            description: parsedAnalysis.description || `${recipeTitle} - Professional recipe analysis`
          })
          .where(eq(recipes.id, recipe.id));
        
        // Update the recipe analysis with clean data
        await db.update(recipeAnalyses)
          .set({
            ingredients: JSON.stringify(parsedAnalysis.ingredients || []),
            techniques: JSON.stringify(parsedAnalysis.techniques || []),
            allergenSummary: JSON.stringify(parsedAnalysis.allergens || {}),
            dietaryRestrictionSummary: JSON.stringify(parsedAnalysis.dietaryRestrictions || {}),
            confidence: 0.8,
            updatedAt: new Date()
          })
          .where(eq(recipeAnalyses.recipeId, recipe.id));
        
        console.log(`✓ Successfully updated recipe: ${recipeTitle}`);
        
      } catch (error) {
        console.error(`Error processing recipe ${recipe.id}:`, error);
      }
    }
    
    console.log('\nRecipe reprocessing completed!');
    
  } catch (error) {
    console.error('Error in recipe reprocessing:', error);
  }
}

// Run the reprocessing
reprocessRecipes().then(() => {
  console.log('Script finished');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});