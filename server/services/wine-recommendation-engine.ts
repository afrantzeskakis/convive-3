/**
 * Wine Recommendation Engine
 * Phase 6: Intelligent wine matching system that processes guest descriptions
 * and matches them to restaurant-specific wine inventories
 */

import { openaiService } from './openai-service';
import { storage } from '../storage';

interface WineMatch {
  wineId: number;
  wineName: string;
  producer: string;
  vintage?: string;
  region: string;
  matchScore: number;
  matchReasons: string[];
  description: string;
  professionalDescriptors: {
    structure: string;
    flavor: string;
    aroma: string;
    finish: string;
  };
  priceRange?: string;
  availability: 'in-stock' | 'limited' | 'ask-server';
}

interface GuestRequest {
  description: string;
  occasion?: string;
  foodPairing?: string;
  pricePreference?: 'budget' | 'mid-range' | 'premium' | 'luxury';
  stylePreference?: 'light' | 'medium' | 'full-bodied';
}

export class WineRecommendationEngine {
  
  /**
   * Main recommendation function - processes guest description and returns wine matches
   */
  async getWineRecommendations(
    guestRequest: GuestRequest,
    restaurantId: number,
    maxRecommendations: number = 3
  ): Promise<WineMatch[]> {
    try {
      // Get restaurant's wine inventory
      const restaurantWines = await this.getRestaurantWineInventory(restaurantId);
      
      if (restaurantWines.length === 0) {
        throw new Error('No wines available in restaurant inventory');
      }

      // Analyze guest request using GPT-4o
      const analysisPrompt = this.buildAnalysisPrompt(guestRequest, restaurantWines);
      const analysisResult = await openaiService.generateText(analysisPrompt, 'gpt-4o');
      
      // Parse and structure the recommendations
      const recommendations = await this.parseRecommendations(analysisResult, restaurantWines);
      
      // Sort by match score and return top recommendations
      return recommendations
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, maxRecommendations);
        
    } catch (error) {
      console.error('Error generating wine recommendations:', error);
      throw new Error('Unable to generate wine recommendations');
    }
  }

  /**
   * Get restaurant's current wine inventory
   */
  private async getRestaurantWineInventory(restaurantId: number) {
    // This would integrate with the wine database system
    // For now, return a structured wine list
    return [
      {
        id: 1,
        name: 'Château Margaux 2015',
        producer: 'Château Margaux',
        vintage: '2015',
        region: 'Margaux, Bordeaux',
        style: 'Full-bodied red',
        grapes: ['Cabernet Sauvignon', 'Merlot', 'Petit Verdot'],
        description: 'Elegant Bordeaux with refined tannins and complex fruit layers',
        priceRange: 'luxury',
        inStock: true
      },
      {
        id: 2,
        name: 'Sancerre Les Monts Damnés 2021',
        producer: 'Chavignol',
        vintage: '2021',
        region: 'Loire Valley',
        style: 'Light-bodied white',
        grapes: ['Sauvignon Blanc'],
        description: 'Crisp minerality with citrus and herb notes',
        priceRange: 'premium',
        inStock: true
      },
      {
        id: 3,
        name: 'Barolo Brunate 2018',
        producer: 'Giuseppe Rinaldi',
        vintage: '2018',
        region: 'Piedmont',
        style: 'Full-bodied red',
        grapes: ['Nebbiolo'],
        description: 'Powerful structure with rose petal aromatics and earthy complexity',
        priceRange: 'luxury',
        inStock: true
      }
    ];
  }

  /**
   * Build GPT-4o prompt for wine analysis and matching
   */
  private buildAnalysisPrompt(guestRequest: GuestRequest, wines: any[]): string {
    return `You are an expert sommelier analyzing a guest's wine request and matching it to available wines.

GUEST REQUEST:
"${guestRequest.description}"
${guestRequest.occasion ? `Occasion: ${guestRequest.occasion}` : ''}
${guestRequest.foodPairing ? `Food pairing: ${guestRequest.foodPairing}` : ''}
${guestRequest.pricePreference ? `Price preference: ${guestRequest.pricePreference}` : ''}

AVAILABLE WINES:
${wines.map((wine, index) => `
${index + 1}. ${wine.name} (${wine.producer})
   - Vintage: ${wine.vintage}
   - Region: ${wine.region}
   - Style: ${wine.style}
   - Grapes: ${wine.grapes.join(', ')}
   - Description: ${wine.description}
   - Price: ${wine.priceRange}
`).join('')}

TASK:
Analyze the guest request and provide wine recommendations. For each recommended wine, provide:

1. Match score (1-100)
2. Why this wine matches the request
3. Professional tasting descriptors in 4 categories:
   - Structure (body, tannins, acidity)
   - Flavor (primary and secondary flavors)
   - Aroma (nose characteristics)
   - Finish (length and aftertaste)

Return as JSON array:
[{
  "wineIndex": 1,
  "matchScore": 85,
  "matchReasons": ["Elegant style matches sophisticated occasion", "Complex flavors complement the request"],
  "professionalDescriptors": {
    "structure": "Full-bodied with firm but refined tannins, balanced acidity",
    "flavor": "Dark fruit core with cassis and blackberry, hints of cedar and tobacco",
    "aroma": "Intense bouquet of dark berries, violets, and subtle oak spice",
    "finish": "Long, persistent finish with lingering fruit and mineral notes"
  }
}]

Focus on authentic wine characteristics and provide professional-quality descriptions.`;
  }

  /**
   * Parse GPT-4o response into structured wine recommendations
   */
  private async parseRecommendations(analysisResult: string, wines: any[]): Promise<WineMatch[]> {
    try {
      // Clean the response and parse JSON
      const cleanedResult = analysisResult.replace(/```json|```/g, '').trim();
      const recommendations = JSON.parse(cleanedResult);
      
      return recommendations.map((rec: any) => {
        const wine = wines[rec.wineIndex - 1];
        return {
          wineId: wine.id,
          wineName: wine.name,
          producer: wine.producer,
          vintage: wine.vintage,
          region: wine.region,
          matchScore: rec.matchScore,
          matchReasons: rec.matchReasons,
          description: wine.description,
          professionalDescriptors: rec.professionalDescriptors,
          priceRange: wine.priceRange,
          availability: wine.inStock ? 'in-stock' : 'ask-server'
        };
      });
    } catch (error) {
      console.error('Error parsing wine recommendations:', error);
      // Return fallback recommendations
      return wines.slice(0, 3).map((wine, index) => ({
        wineId: wine.id,
        wineName: wine.name,
        producer: wine.producer,
        vintage: wine.vintage,
        region: wine.region,
        matchScore: 75 - (index * 10),
        matchReasons: ['Professional selection based on style and quality'],
        description: wine.description,
        professionalDescriptors: {
          structure: 'Well-balanced with harmonious elements',
          flavor: 'Complex and distinctive character',
          aroma: 'Expressive nose with varietal character',
          finish: 'Clean and satisfying finish'
        },
        priceRange: wine.priceRange,
        availability: wine.inStock ? 'in-stock' : 'ask-server'
      }));
    }
  }

  /**
   * Quick wine style matching for offline scenarios
   */
  async getQuickStyleMatches(
    styleRequest: string,
    restaurantId: number
  ): Promise<WineMatch[]> {
    const wines = await this.getRestaurantWineInventory(restaurantId);
    
    // Simple keyword matching for offline functionality
    const keywords = styleRequest.toLowerCase();
    
    return wines
      .filter(wine => {
        const wineText = `${wine.style} ${wine.description} ${wine.grapes.join(' ')}`.toLowerCase();
        return keywords.split(' ').some(keyword => wineText.includes(keyword));
      })
      .slice(0, 3)
      .map(wine => ({
        wineId: wine.id,
        wineName: wine.name,
        producer: wine.producer,
        vintage: wine.vintage,
        region: wine.region,
        matchScore: 70,
        matchReasons: ['Style compatibility match'],
        description: wine.description,
        professionalDescriptors: {
          structure: 'Characteristic structure for this style',
          flavor: 'Representative flavors of the region and grape varieties',
          aroma: 'Typical aromatic profile',
          finish: 'Well-integrated finish'
        },
        priceRange: wine.priceRange,
        availability: wine.inStock ? 'in-stock' : 'ask-server'
      }));
  }
}

export const wineRecommendationEngine = new WineRecommendationEngine();