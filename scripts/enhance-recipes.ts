import { db } from '../server/db';
import { recipes, recipeAnalyses, restaurants } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function enhanceRecipes(restaurantId: number) {
  console.log(`Starting recipe enhancement for restaurant ${restaurantId}...`);
  
  try {
    // Get all recipes with their analyses
    const recipesWithAnalyses = await db.select({
      recipeId: recipes.id,
      recipeName: recipes.name,
      recipeText: recipes.recipeText,
      recipeDescription: recipes.description,
      recipeCuisine: recipes.cuisine,
      analysisId: recipeAnalyses.id,
      ingredients: recipeAnalyses.ingredients,
    })
      .from(recipes)
      .innerJoin(recipeAnalyses, eq(recipes.id, recipeAnalyses.recipeId))
      .where(eq(recipes.restaurantId, restaurantId));
    
    if (recipesWithAnalyses.length === 0) {
      console.log("No analyzed recipes found for this restaurant");
      return;
    }
    
    console.log(`Found ${recipesWithAnalyses.length} recipes to enhance`);
    
    // Get restaurant for cuisine context
    const [restaurant] = await db.select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId));
    
    const { culinaryKnowledgeService } = await import('../server/services/culinary-knowledge-service');
    const { recipeEnhancementService } = await import('../server/services/recipe-enhancement-service');
    
    let enhancedCount = 0;
    const errors = [];
    
    // Process each recipe
    for (const recipeData of recipesWithAnalyses) {
      try {
        console.log(`Enhancing recipe: ${recipeData.recipeName}`);
        
        const cuisineDescription = restaurant.cuisine || recipeData.recipeCuisine || 'International';
        const recipeText = recipeData.recipeText || recipeData.recipeDescription || '';
        
        if (!recipeText) {
          console.log(`Skipping ${recipeData.recipeName} - no recipe text`);
          continue;
        }
        
        // Extract culinary terms with carousel content
        const extractedTerms = await culinaryKnowledgeService.extractCulinaryTerms(recipeText, cuisineDescription);
        console.log(`  - Extracted ${extractedTerms.length} terms`);
        
        const termCarouselMap = await culinaryKnowledgeService.batchProcessTerms(extractedTerms, restaurantId);
        
        // Convert to culinary terms format
        const culinaryTerms = [];
        for (const term of Array.from(termCarouselMap.keys())) {
          const slides = termCarouselMap.get(term) || [];
          culinaryTerms.push({
            term,
            category: 'basic',
            explanation: slides[0]?.content || `${term} is a culinary element.`,
            carouselContent: slides
          });
        }
        
        console.log(`  - Generated carousel content for ${culinaryTerms.length} terms`);
        
        // Enhance with highlighting
        const analysisData = {
          extractedText: recipeText,
          ingredients: recipeData.ingredients || [],
          instructions: recipeText ? recipeText.split('\n').filter((line: string) => line.trim()) : []
        };
        
        const enhancedRecipe = await recipeEnhancementService.enhanceRecipeWithHighlights(
          analysisData,
          culinaryTerms
        );
        
        // Update the analysis with enhanced data
        await db.update(recipeAnalyses)
          .set({
            highlightedText: enhancedRecipe.highlightedText,
            highlightedTerms: enhancedRecipe.highlightedTerms,
            culinaryKnowledge: enhancedRecipe.culinaryKnowledge,
            updatedAt: new Date()
          })
          .where(eq(recipeAnalyses.recipeId, recipeData.recipeId));
        
        console.log(`  ✓ Enhanced with ${enhancedRecipe.highlightedTerms.length} highlighted terms`);
        enhancedCount++;
        
      } catch (error) {
        console.error(`Error enhancing recipe ${recipeData.recipeName}:`, error);
        errors.push({ recipe: recipeData.recipeName, error: error.message });
      }
    }
    
    console.log(`\n✅ Enhancement complete!`);
    console.log(`Enhanced ${enhancedCount} of ${recipesWithAnalyses.length} recipes`);
    if (errors.length > 0) {
      console.log(`\n⚠️ Errors occurred for ${errors.length} recipes:`);
      errors.forEach(e => console.log(`  - ${e.recipe}: ${e.error}`));
    }
    
  } catch (error) {
    console.error("Error batch enhancing recipes:", error);
  }
  
  process.exit(0);
}

// Run the enhancement for restaurant 7
const restaurantId = parseInt(process.argv[2] || '7');
console.log(`\nEnhancing recipes for restaurant ID: ${restaurantId}\n`);

enhanceRecipes(restaurantId);