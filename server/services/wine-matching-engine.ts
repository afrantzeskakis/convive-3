/**
 * Wine Matching Engine
 * Core algorithm for matching guest descriptions to restaurant wine inventory
 */

import { neon } from "@neondatabase/serverless";
import { ParsedWineCharacteristics, parseCharacteristicRange, convertNumericScale } from "./wine-description-parser";

const sql = neon(process.env.DATABASE_URL!);

export interface WineMatch {
  wine_id: number;
  restaurant_wine_id: number;
  wine_name: string;
  producer: string;
  vintage?: string;
  price: string;
  match_score: number;
  match_type: "perfect" | "surprise";
  characteristics: {
    acidity?: string;
    tannins?: string;
    intensity?: string;
    sweetness?: string;
    body_description?: string;
  };
  description: string;
  missed_criteria?: string[];
}

export interface WineRecommendationResult {
  recommendations: WineMatch[];
  guest_preferences: ParsedWineCharacteristics;
  total_inventory_count: number;
  processing_time_ms: number;
}

/**
 * Main wine recommendation function - returns exactly 3 wines
 * 2 perfect matches + 1 surprise option
 */
export async function getWineRecommendations(
  restaurantId: number,
  guestPreferences: ParsedWineCharacteristics
): Promise<WineRecommendationResult> {
  const startTime = Date.now();

  try {
    // Get restaurant's available wine inventory with cached characteristics
    const inventory = await sql`
      SELECT 
        rw.id as restaurant_wine_id,
        w.id as wine_id,
        w.wine_name,
        w.producer,
        w.vintage,
        w.wine_type,
        w.acidity,
        w.tannins,
        w.intensity,
        w.sweetness,
        w.body_description,
        w.flavor_notes,
        w.finish_length,
        w.oak_influence,
        w.wine_rating,
        rw.price,
        rw.promotion_priority,
        rw.custom_description
      FROM restaurant_wines rw
      JOIN wines w ON rw.wine_id = w.id
      WHERE rw.restaurant_id = ${restaurantId}
        AND rw.is_available = true
        AND rw.active = true
      ORDER BY rw.promotion_priority DESC, w.wine_rating DESC
    `;

    if (inventory.length === 0) {
      return {
        recommendations: [],
        guest_preferences: guestPreferences,
        total_inventory_count: 0,
        processing_time_ms: Date.now() - startTime
      };
    }

    // Score each wine against guest preferences
    const scoredWines = inventory.map(wine => {
      const wineWithScore = {
        ...wine,
        match_score: calculateMatchScore(wine, guestPreferences),
        missed_criteria: findMissedCriteria(wine, guestPreferences)
      };
      return wineWithScore;
    });

    // Sort by match score
    scoredWines.sort((a, b) => b.match_score - a.match_score);

    // Select recommendations: 2 perfect matches + 1 surprise
    const recommendations: WineMatch[] = [];

    // Get top 2 perfect matches (high scores)
    const perfectMatches = scoredWines
      .filter((wine: any) => wine.match_score >= 0.7) // High confidence threshold
      .slice(0, 2);

    // Get 1 surprise option (good wine that might miss 1 criterion)
    const surpriseOptions = scoredWines
      .filter((wine: any) => 
        wine.match_score >= 0.4 && 
        wine.match_score < 0.7 &&
        !perfectMatches.includes(wine)
      )
      .slice(0, 1);

    // Format perfect matches
    perfectMatches.forEach((wine: any) => {
      recommendations.push(formatWineMatch(wine, "perfect"));
    });

    // Format surprise option
    surpriseOptions.forEach((wine: any) => {
      recommendations.push(formatWineMatch(wine, "surprise"));
    });

    // If we don't have enough recommendations, fill with best available
    while (recommendations.length < 3 && recommendations.length < inventory.length) {
      const remaining = scoredWines.find(wine => 
        !recommendations.some(rec => rec.wine_id === (wine as any).wine_id)
      );
      if (remaining) {
        recommendations.push(formatWineMatch(remaining, "perfect"));
      } else {
        break;
      }
    }

    const result: WineRecommendationResult = {
      recommendations: recommendations.slice(0, 3), // Ensure exactly 3 or fewer
      guest_preferences: guestPreferences,
      total_inventory_count: inventory.length,
      processing_time_ms: Date.now() - startTime
    };

    // Log recommendation for analytics
    await logWineRecommendation(restaurantId, guestPreferences, result);

    return result;

  } catch (error) {
    console.error("Error generating wine recommendations:", error);
    return {
      recommendations: [],
      guest_preferences: guestPreferences,
      total_inventory_count: 0,
      processing_time_ms: Date.now() - startTime
    };
  }
}

/**
 * Calculate match score between wine and guest preferences (0-1 scale)
 */
function calculateMatchScore(wine: any, preferences: ParsedWineCharacteristics): number {
  let score = 0;
  let criteria = 0;

  // Color matching (critical)
  if (preferences.color) {
    criteria++;
    if (wine.wine_type?.toLowerCase().includes(preferences.color.toLowerCase())) {
      score += 0.3; // High weight for color match
    }
  }

  // Characteristic matching using our Vivino 1-5 scale
  if (preferences.tannins && wine.tannins) {
    criteria++;
    const range = parseCharacteristicRange(preferences.tannins.toString());
    // Handle both numeric and string values from database
    const wineValue = typeof wine.tannins === 'string' ? 
      parseFloat(wine.tannins.split('(')[1]?.split(' ')[0] || '3') : 
      parseFloat(wine.tannins);
    if (!isNaN(wineValue) && wineValue >= range.min && wineValue <= range.max) {
      score += 0.2;
    }
  }

  if (preferences.acidity && wine.acidity) {
    criteria++;
    const range = parseCharacteristicRange(preferences.acidity.toString());
    // Handle both numeric and string values from database
    const wineValue = typeof wine.acidity === 'string' ? 
      parseFloat(wine.acidity.split('(')[1]?.split(' ')[0] || '3') : 
      parseFloat(wine.acidity);
    if (!isNaN(wineValue) && wineValue >= range.min && wineValue <= range.max) {
      score += 0.2;
    }
  }

  if (preferences.body && wine.body_description) {
    criteria++;
    if (wine.body_description.toLowerCase().includes(preferences.body.toLowerCase())) {
      score += 0.15;
    }
  }

  if (preferences.sweetness && wine.sweetness) {
    criteria++;
    const range = parseCharacteristicRange(preferences.sweetness.toString());
    const wineValue = parseFloat(wine.sweetness);
    if (wineValue >= range.min && wineValue <= range.max) {
      score += 0.1;
    }
  }

  // Flavor notes matching
  if (preferences.flavor_notes && wine.flavor_notes) {
    criteria++;
    const wineNotes = wine.flavor_notes.toLowerCase();
    const matchingNotes = preferences.flavor_notes.filter(note => 
      wineNotes.includes(note.toLowerCase())
    );
    if (matchingNotes.length > 0) {
      score += 0.05 * matchingNotes.length;
    }
  }

  // Normalize score based on available criteria
  return criteria > 0 ? Math.min(score, 1.0) : 0;
}

/**
 * Find which criteria the wine doesn't match for surprise recommendations
 */
function findMissedCriteria(wine: any, preferences: ParsedWineCharacteristics): string[] {
  const missed: string[] = [];

  if (preferences.color && !wine.wine_type?.toLowerCase().includes(preferences.color.toLowerCase())) {
    missed.push(`wine color (requested ${preferences.color})`);
  }

  if (preferences.body && !wine.body_description?.toLowerCase().includes(preferences.body.toLowerCase())) {
    missed.push(`body style (requested ${preferences.body})`);
  }

  if (preferences.tannins && wine.tannins) {
    const range = parseCharacteristicRange(preferences.tannins.toString());
    const wineValue = parseFloat(wine.tannins);
    if (!(wineValue >= range.min && wineValue <= range.max)) {
      missed.push(`tannin level (requested ${preferences.tannins})`);
    }
  }

  return missed;
}

/**
 * Format wine data for recommendation response
 */
function formatWineMatch(wine: any, matchType: "perfect" | "surprise"): WineMatch {
  const characteristics = {
    acidity: wine.acidity ? convertNumericScale(parseFloat(wine.acidity)) : undefined,
    tannins: wine.tannins ? convertNumericScale(parseFloat(wine.tannins)) : undefined,
    intensity: wine.intensity ? convertNumericScale(parseFloat(wine.intensity)) : undefined,
    sweetness: wine.sweetness ? convertNumericScale(parseFloat(wine.sweetness)) : undefined,
    body_description: wine.body_description || undefined,
  };

  // Generate professional description using wine descriptors
  let description = "";
  if (wine.custom_description) {
    description = wine.custom_description;
  } else {
    const descriptors: string[] = [];
    
    if (characteristics.body_description) {
      descriptors.push(`${characteristics.body_description}-bodied`);
    }
    
    if (wine.flavor_notes) {
      const notes = wine.flavor_notes.split(',').slice(0, 2);
      descriptors.push(`with ${notes.join(' and ')} flavors`);
    }
    
    if (characteristics.tannins && wine.wine_type?.toLowerCase().includes('red')) {
      descriptors.push(`${characteristics.tannins.split(' ')[0]} tannins`);
    }
    
    if (characteristics.acidity) {
      descriptors.push(`${characteristics.acidity.split(' ')[0]} acidity`);
    }

    description = descriptors.join(', ').replace(/^,\s*/, '');
  }

  return {
    wine_id: wine.wine_id,
    restaurant_wine_id: wine.restaurant_wine_id,
    wine_name: wine.wine_name,
    producer: wine.producer,
    vintage: wine.vintage,
    price: wine.price || "Market Price",
    match_score: wine.match_score,
    match_type: matchType,
    characteristics,
    description,
    missed_criteria: matchType === "surprise" ? wine.missed_criteria : undefined
  };
}

/**
 * Log wine recommendation for analytics
 */
async function logWineRecommendation(
  restaurantId: number,
  preferences: ParsedWineCharacteristics,
  result: WineRecommendationResult
): Promise<void> {
  try {
    await sql`
      INSERT INTO wine_recommendation_logs (
        restaurant_id,
        search_query,
        recommended_wine_ids,
        guest_preferences
      ) VALUES (
        ${restaurantId},
        ${"Guest wine request"}, 
        ${JSON.stringify(result.recommendations.map(r => r.wine_id))},
        ${JSON.stringify(preferences)}
      )
    `;
  } catch (error) {
    console.error("Error logging wine recommendation:", error);
  }
}