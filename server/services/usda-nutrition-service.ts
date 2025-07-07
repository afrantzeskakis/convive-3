/**
 * USDA FoodData Central API Integration
 * Provides authentic nutritional data for recipe analysis
 */

interface USDAFood {
  fdcId: number;
  description: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }>;
  servingSize?: number;
  servingSizeUnit?: string;
}

interface NutritionalProfile {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  calcium: number;
  iron: number;
  vitaminC: number;
  vitaminA: number;
}

interface AllergenInfo {
  containsDairy: boolean;
  containsEggs: boolean;
  containsGluten: boolean;
  containsNuts: boolean;
  containsSoy: boolean;
  containsShellfish: boolean;
  containsFish: boolean;
  containsSesame: boolean;
  containsSulfites: boolean;
}

interface DietaryCompatibility {
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  nutFree: boolean;
  kosher: boolean;
  halal: boolean;
  keto: boolean;
  paleo: boolean;
}

class USDANutritionService {
  private baseUrl = 'https://api.nal.usda.gov/fdc/v1';

  /**
   * Search for food items in USDA database
   */
  async searchFood(query: string, pageSize: number = 25): Promise<USDAFood[]> {
    try {
      const response = await fetch(`${this.baseUrl}/foods/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          pageSize: pageSize,
          dataType: ['Foundation', 'SR Legacy', 'Branded'],
          sortBy: 'dataType.keyword',
          sortOrder: 'asc'
        })
      });

      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      const data = await response.json();
      return data.foods || [];
    } catch (error) {
      console.error('Error searching USDA food database:', error);
      throw error;
    }
  }

  /**
   * Get detailed nutritional information for a specific food item
   */
  async getFoodDetails(fdcId: number): Promise<USDAFood | null> {
    try {
      const response = await fetch(`${this.baseUrl}/food/${fdcId}`);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching food details:', error);
      return null;
    }
  }

  /**
   * Calculate nutritional profile for an ingredient with quantity
   */
  calculateNutrition(foodData: USDAFood, quantity: number, unit: string): NutritionalProfile {
    // Convert quantity to grams (base unit for USDA data)
    const gramsPerUnit = this.convertToGrams(unit);
    const totalGrams = quantity * gramsPerUnit;
    
    // Extract key nutrients (nutrient IDs from USDA database)
    const nutrients = foodData.foodNutrients;
    const per100g = {
      calories: this.getNutrientValue(nutrients, 1008) || 0, // Energy
      protein: this.getNutrientValue(nutrients, 1003) || 0, // Protein
      carbohydrates: this.getNutrientValue(nutrients, 1005) || 0, // Carbohydrate
      fat: this.getNutrientValue(nutrients, 1004) || 0, // Total lipid (fat)
      fiber: this.getNutrientValue(nutrients, 1079) || 0, // Fiber, total dietary
      sugar: this.getNutrientValue(nutrients, 2000) || 0, // Sugars, total
      sodium: this.getNutrientValue(nutrients, 1093) || 0, // Sodium
      calcium: this.getNutrientValue(nutrients, 1087) || 0, // Calcium
      iron: this.getNutrientValue(nutrients, 1089) || 0, // Iron
      vitaminC: this.getNutrientValue(nutrients, 1162) || 0, // Vitamin C
      vitaminA: this.getNutrientValue(nutrients, 1106) || 0, // Vitamin A
    };

    // Calculate for actual quantity
    const multiplier = totalGrams / 100;
    return {
      calories: Math.round(per100g.calories * multiplier),
      protein: Math.round((per100g.protein * multiplier) * 10) / 10,
      carbohydrates: Math.round((per100g.carbohydrates * multiplier) * 10) / 10,
      fat: Math.round((per100g.fat * multiplier) * 10) / 10,
      fiber: Math.round((per100g.fiber * multiplier) * 10) / 10,
      sugar: Math.round((per100g.sugar * multiplier) * 10) / 10,
      sodium: Math.round((per100g.sodium * multiplier) * 10) / 10,
      calcium: Math.round((per100g.calcium * multiplier) * 10) / 10,
      iron: Math.round((per100g.iron * multiplier) * 100) / 100,
      vitaminC: Math.round((per100g.vitaminC * multiplier) * 10) / 10,
      vitaminA: Math.round((per100g.vitaminA * multiplier) * 10) / 10,
    };
  }

  /**
   * Analyze allergens in food description
   */
  analyzeAllergens(foodDescription: string): AllergenInfo {
    const desc = foodDescription.toLowerCase();
    
    return {
      containsDairy: /milk|dairy|cheese|butter|cream|yogurt|whey|casein|lactose/.test(desc),
      containsEggs: /egg|albumen|lecithin/.test(desc),
      containsGluten: /wheat|barley|rye|gluten|flour|bread|pasta/.test(desc),
      containsNuts: /almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia|brazil nut|pine nut/.test(desc),
      containsSoy: /soy|soya|tofu|tempeh|miso|edamame/.test(desc),
      containsShellfish: /shrimp|crab|lobster|crawfish|scallop|clam|mussel|oyster/.test(desc),
      containsFish: /fish|salmon|tuna|cod|halibut|sardine|anchovy/.test(desc),
      containsSesame: /sesame|tahini/.test(desc),
      containsSulfites: /sulfite|sulfur dioxide|wine|dried fruit/.test(desc),
    };
  }

  /**
   * Determine dietary compatibility
   */
  analyzeDietaryCompatibility(foodDescription: string, allergens: AllergenInfo): DietaryCompatibility {
    const desc = foodDescription.toLowerCase();
    const isAnimalProduct = /meat|beef|pork|chicken|turkey|fish|seafood|dairy|egg|honey|gelatin/.test(desc);
    
    return {
      vegan: !isAnimalProduct && !allergens.containsDairy && !allergens.containsEggs,
      vegetarian: !/meat|beef|pork|chicken|turkey|fish|seafood|gelatin/.test(desc),
      glutenFree: !allergens.containsGluten,
      dairyFree: !allergens.containsDairy,
      nutFree: !allergens.containsNuts,
      kosher: !/pork|shellfish|mix.*meat.*dairy/.test(desc), // Simplified kosher check
      halal: !/pork|alcohol|wine/.test(desc), // Simplified halal check
      keto: true, // Would need carb calculation for accurate determination
      paleo: !/grain|legume|dairy|sugar|processed/.test(desc), // Simplified paleo check
    };
  }

  /**
   * Process complete recipe for nutritional analysis
   */
  async analyzeRecipe(ingredients: Array<{name: string, quantity: number, unit: string}>): Promise<{
    totalNutrition: NutritionalProfile;
    perServing: NutritionalProfile;
    allergens: AllergenInfo;
    dietaryCompatibility: DietaryCompatibility;
    servings: number;
  }> {
    const totalNutrition: NutritionalProfile = {
      calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0,
      sugar: 0, sodium: 0, calcium: 0, iron: 0, vitaminC: 0, vitaminA: 0
    };

    const allAllergens: AllergenInfo = {
      containsDairy: false, containsEggs: false, containsGluten: false,
      containsNuts: false, containsSoy: false, containsShellfish: false,
      containsFish: false, containsSesame: false, containsSulfites: false
    };

    let overallDietaryCompatibility: DietaryCompatibility = {
      vegan: true, vegetarian: true, glutenFree: true, dairyFree: true,
      nutFree: true, kosher: true, halal: true, keto: true, paleo: true
    };

    // Process each ingredient
    for (const ingredient of ingredients) {
      try {
        const searchResults = await this.searchFood(ingredient.name, 5);
        if (searchResults.length > 0) {
          const bestMatch = searchResults[0];
          const nutrition = this.calculateNutrition(bestMatch, ingredient.quantity, ingredient.unit);
          
          // Add to totals
          Object.keys(totalNutrition).forEach(key => {
            (totalNutrition as any)[key] += (nutrition as any)[key];
          });

          // Check allergens
          const ingredientAllergens = this.analyzeAllergens(bestMatch.description);
          Object.keys(allAllergens).forEach(key => {
            if ((ingredientAllergens as any)[key]) {
              (allAllergens as any)[key] = true;
            }
          });

          // Check dietary compatibility
          const compatibility = this.analyzeDietaryCompatibility(bestMatch.description, ingredientAllergens);
          Object.keys(overallDietaryCompatibility).forEach(key => {
            if (!(compatibility as any)[key]) {
              (overallDietaryCompatibility as any)[key] = false;
            }
          });
        }
      } catch (error) {
        console.error(`Error processing ingredient ${ingredient.name}:`, error);
      }
    }

    const servings = 4; // Default servings, could be extracted from recipe
    const perServing: NutritionalProfile = {} as NutritionalProfile;
    Object.keys(totalNutrition).forEach(key => {
      (perServing as any)[key] = Math.round(((totalNutrition as any)[key] / servings) * 10) / 10;
    });

    return {
      totalNutrition,
      perServing,
      allergens: allAllergens,
      dietaryCompatibility: overallDietaryCompatibility,
      servings
    };
  }

  private getNutrientValue(nutrients: any[], nutrientId: number): number | null {
    const nutrient = nutrients.find(n => n.nutrientId === nutrientId);
    return nutrient ? nutrient.value : null;
  }

  private convertToGrams(unit: string): number {
    const unitMap: { [key: string]: number } = {
      'g': 1,
      'gram': 1,
      'grams': 1,
      'kg': 1000,
      'kilogram': 1000,
      'oz': 28.35,
      'ounce': 28.35,
      'ounces': 28.35,
      'lb': 453.59,
      'pound': 453.59,
      'pounds': 453.59,
      'cup': 240, // approximate for liquids
      'cups': 240,
      'tbsp': 15,
      'tablespoon': 15,
      'tablespoons': 15,
      'tsp': 5,
      'teaspoon': 5,
      'teaspoons': 5,
      'ml': 1, // approximate for liquids
      'milliliter': 1,
      'milliliters': 1,
      'l': 1000,
      'liter': 1000,
      'liters': 1000,
    };
    
    return unitMap[unit.toLowerCase()] || 100; // Default to 100g if unit not found
  }
}

export const usdaNutritionService = new USDANutritionService();