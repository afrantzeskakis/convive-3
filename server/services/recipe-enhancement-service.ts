/**
 * Recipe Enhancement Service
 * Processes recipes to identify and highlight culinary terms for interactive learning
 */

interface HighlightedTerm {
  term: string;
  category: 'basic' | 'intermediate' | 'advanced' | 'cultural';
  startIndex: number;
  endIndex: number;
  definition: string;
  hasCarousel: boolean;
}

interface EnhancedRecipe {
  originalText: string;
  highlightedText: string;
  highlightedTerms: HighlightedTerm[];
  ingredients: any[];
  instructions: string[];
  culinaryKnowledge: any[];
}

class RecipeEnhancementService {
  
  /**
   * Process a recipe to add interactive highlighting for culinary terms
   */
  async enhanceRecipeWithHighlights(recipeAnalysis: any, culinaryTerms: any[]): Promise<EnhancedRecipe> {
    try {
      const originalText = recipeAnalysis.extractedText || '';
      const ingredients = recipeAnalysis.ingredients || [];
      const instructions = recipeAnalysis.instructions || [];

      // Create highlighted terms data structure
      const highlightedTerms: HighlightedTerm[] = [];
      let highlightedText = originalText;

      // Process each culinary term for highlighting
      for (const termData of culinaryTerms) {
        const { term, category, carouselContent } = termData;
        
        // Find all occurrences of this term in the text (case insensitive)
        const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
        let match;
        
        while ((match = regex.exec(originalText)) !== null) {
          const highlightedTerm: HighlightedTerm = {
            term: match[0], // Preserve original case
            category,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            definition: this.extractQuickDefinition(carouselContent),
            hasCarousel: carouselContent && carouselContent.length > 0
          };
          
          highlightedTerms.push(highlightedTerm);
        }
      }

      // Sort terms by position for proper highlighting
      highlightedTerms.sort((a, b) => a.startIndex - b.startIndex);

      // Generate highlighted HTML with click handlers
      highlightedText = this.generateHighlightedHTML(originalText, highlightedTerms);

      return {
        originalText,
        highlightedText,
        highlightedTerms,
        ingredients,
        instructions,
        culinaryKnowledge: culinaryTerms
      };

    } catch (error) {
      console.error('Error enhancing recipe with highlights:', error);
      // Return basic structure if enhancement fails
      return {
        originalText: recipeAnalysis.extractedText || '',
        highlightedText: recipeAnalysis.extractedText || '',
        highlightedTerms: [],
        ingredients: recipeAnalysis.ingredients || [],
        instructions: recipeAnalysis.instructions || [],
        culinaryKnowledge: culinaryTerms || []
      };
    }
  }

  /**
   * Extract quick definition from carousel content for popup display
   */
  private extractQuickDefinition(carouselContent: any[]): string {
    if (!carouselContent || carouselContent.length === 0) {
      return 'Culinary term with detailed information available';
    }

    // Look for technique or culture slide for quick definition
    const techniqueSlide = carouselContent.find(slide => slide.type === 'technique');
    const cultureSlide = carouselContent.find(slide => slide.type === 'culture');
    
    if (techniqueSlide && techniqueSlide.content) {
      return this.truncateText(techniqueSlide.content, 120);
    }
    
    if (cultureSlide && cultureSlide.content) {
      return this.truncateText(cultureSlide.content, 120);
    }

    // Fall back to first available slide
    const firstSlide = carouselContent[0];
    return firstSlide ? this.truncateText(firstSlide.content, 120) : 'Detailed culinary information available';
  }

  /**
   * Truncate text to specified length with proper word boundaries
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  /**
   * Escape special regex characters in term for safe searching
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate HTML with highlighted terms and click handlers
   */
  private generateHighlightedHTML(originalText: string, highlightedTerms: HighlightedTerm[]): string {
    if (highlightedTerms.length === 0) return originalText;

    let result = '';
    let lastIndex = 0;

    // Process each highlighted term
    for (const termData of highlightedTerms) {
      // Add text before this term
      result += originalText.substring(lastIndex, termData.startIndex);
      
      // Add highlighted term with appropriate styling and data attributes
      const categoryClass = this.getCategoryClass(termData.category);
      const highlightedSpan = `<span 
        class="culinary-term ${categoryClass}" 
        data-term="${termData.term}"
        data-category="${termData.category}"
        data-definition="${this.escapeHtml(termData.definition)}"
        data-has-carousel="${termData.hasCarousel}"
        onclick="handleCulinaryTermClick('${termData.term}')"
        onmouseover="showQuickTooltip(this)"
        onmouseout="hideQuickTooltip()"
      >${termData.term}</span>`;
      
      result += highlightedSpan;
      lastIndex = termData.endIndex;
    }

    // Add remaining text
    result += originalText.substring(lastIndex);

    return result;
  }

  /**
   * Get CSS class for term category
   */
  private getCategoryClass(category: string): string {
    const classMap: Record<string, string> = {
      'basic': 'term-basic',
      'intermediate': 'term-intermediate', 
      'advanced': 'term-advanced',
      'cultural': 'term-cultural'
    };
    
    return classMap[category] || 'term-basic';
  }

  /**
   * Escape HTML characters for safe attribute values
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Generate dietary analysis for specific terms
   */
  async analyzeDietaryRestrictions(term: string, context: string): Promise<any> {
    try {
      const { usdaNutritionService } = await import('./usda-nutrition-service');
      
      // For ingredients, get nutritional and dietary analysis
      if (this.isIngredient(term, context)) {
        const searchResults = await usdaNutritionService.searchFood(term, 3);
        if (searchResults.length > 0) {
          const ingredientData = searchResults[0];
          const allergens = usdaNutritionService.analyzeAllergens(ingredientData.description);
          const dietary = usdaNutritionService.analyzeDietaryCompatibility(ingredientData.description, allergens);
          
          return {
            allergens,
            dietaryCompatibility: dietary,
            nutritionalHighlights: this.extractNutritionalHighlights(ingredientData)
          };
        }
      }

      // For techniques, analyze general dietary implications
      return this.analyzeTechniqueDietaryImpact(term);
      
    } catch (error) {
      console.error('Error analyzing dietary restrictions for term:', term, error);
      return {
        allergens: {},
        dietaryCompatibility: {},
        nutritionalHighlights: null
      };
    }
  }

  /**
   * Determine if a term is an ingredient vs technique
   */
  private isIngredient(term: string, context: string): boolean {
    // Simple heuristic - ingredients are often nouns, techniques are often verbs
    const techniqueKeywords = ['sear', 'braise', 'confit', 'sauté', 'julienne', 'chiffonade', 'reduce', 'caramelize'];
    return !techniqueKeywords.some(keyword => term.toLowerCase().includes(keyword.toLowerCase()));
  }

  /**
   * Extract key nutritional highlights for display
   */
  private extractNutritionalHighlights(foodData: any): any {
    if (!foodData.foodNutrients) return null;
    
    const nutrients = foodData.foodNutrients;
    return {
      calories: this.getNutrientValue(nutrients, 1008),
      protein: this.getNutrientValue(nutrients, 1003),
      fiber: this.getNutrientValue(nutrients, 1079),
      vitaminC: this.getNutrientValue(nutrients, 1162)
    };
  }

  /**
   * Get specific nutrient value by ID
   */
  private getNutrientValue(nutrients: any[], nutrientId: number): number | null {
    const nutrient = nutrients.find(n => n.nutrientId === nutrientId);
    return nutrient ? nutrient.value : null;
  }

  /**
   * Analyze dietary impact of cooking techniques
   */
  private analyzeTechniqueDietaryImpact(technique: string): any {
    const techniqueLower = technique.toLowerCase();
    
    // Basic analysis of how techniques affect dietary compatibility
    const impacts = {
      allergens: {},
      dietaryCompatibility: {
        vegan: !techniqueLower.includes('butter') && !techniqueLower.includes('cream'),
        vegetarian: !techniqueLower.includes('lard') && !techniqueLower.includes('bacon'),
        glutenFree: !techniqueLower.includes('flour') && !techniqueLower.includes('bread'),
        dairyFree: !techniqueLower.includes('butter') && !techniqueLower.includes('cream'),
        lowSodium: !techniqueLower.includes('salt') && !techniqueLower.includes('cure')
      },
      nutritionalHighlights: null
    };

    return impacts;
  }
}

export const recipeEnhancementService = new RecipeEnhancementService();