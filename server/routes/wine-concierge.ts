import { Router } from "express";
import { z } from "zod";
import { wineEmbeddingService } from "../services/wine-embedding.service";
import { db } from "../db";
import { restaurantWinesIsolated } from "@shared/wine-schema";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

// Schema for wine recommendation request
const recommendationSchema = z.object({
  restaurantId: z.number(),
  query: z.string().min(1),
  priceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional()
});

// Parse price from query
function parsePriceFromQuery(query: string): { cleanQuery: string, priceMin?: number, priceMax?: number } {
  const priceRegex = /\$(\d+)(?:\s*-\s*\$?(\d+))?|\b(\d+)\s*(?:dollars?|usd)?\b/gi;
  let cleanQuery = query;
  let priceMin: number | undefined;
  let priceMax: number | undefined;

  const matches = query.matchAll(priceRegex);
  for (const match of matches) {
    const price1 = parseInt(match[1] || match[3]);
    const price2 = match[2] ? parseInt(match[2]) : undefined;
    
    if (!isNaN(price1)) {
      if (price2 && !isNaN(price2)) {
        // Price range
        priceMin = price1;
        priceMax = price2;
      } else {
        // Single price - apply ±10% flexibility
        priceMin = Math.floor(price1 * 0.9);
        priceMax = Math.ceil(price1 * 1.1);
      }
      
      // Remove price from query
      cleanQuery = cleanQuery.replace(match[0], '').trim();
      break; // Only process first price match
    }
  }

  return { cleanQuery, priceMin, priceMax };
}

/**
 * Get wine recommendations based on guest query
 */
router.post("/recommend", async (req, res) => {
  try {
    const data = recommendationSchema.parse(req.body);
    
    // Parse price from query if not provided explicitly
    const { cleanQuery, priceMin, priceMax } = parsePriceFromQuery(data.query);
    
    // Use parsed prices if not provided in request
    const finalPriceMin = data.priceRange?.min ?? priceMin;
    const finalPriceMax = data.priceRange?.max ?? priceMax;

    console.log(`[WineConcierge] Processing query: "${data.query}"`);
    console.log(`[WineConcierge] Clean query: "${cleanQuery}"`);
    console.log(`[WineConcierge] Price range: $${finalPriceMin} - $${finalPriceMax}`);

    // Generate embedding for the query
    const queryEmbedding = await wineEmbeddingService.generateQueryEmbedding(cleanQuery);

    // Find similar wines
    const recommendations = await wineEmbeddingService.findSimilarWines(
      queryEmbedding,
      data.restaurantId,
      finalPriceMin,
      finalPriceMax,
      3 // Get top 3 recommendations
    );

    // Format response with comparison highlights
    const formattedRecommendations = recommendations.map((wine, index) => {
      // Determine if this is the wild card (3rd recommendation)
      const isWildCard = index === 2;
      
      return {
        id: wine.id,
        wine_name: wine.wine_name,
        producer: wine.producer,
        vintage: wine.vintage,
        type: wine.type,
        region: wine.region,
        country: wine.country,
        price: wine.menu_price,
        grape_variety: wine.grape_variety || wine.varietals,
        tasting_notes: wine.tasting_notes || wine.general_guest_experience,
        food_pairing: wine.food_pairing,
        serving_temp: wine.serving_temp,
        glass_price: wine.glass_price,
        what_makes_special: wine.what_makes_special,
        similarity_score: wine.similarity,
        is_wild_card: isWildCard,
        match_reason: isWildCard 
          ? "Surprise pick - different but delightful"
          : index === 0 
            ? "Best match for your preferences"
            : "Strong alternative option"
      };
    });

    res.json({
      query: data.query,
      clean_query: cleanQuery,
      price_range: {
        min: finalPriceMin,
        max: finalPriceMax
      },
      recommendations: formattedRecommendations,
      generated_at: new Date()
    });
  } catch (error) {
    console.error("[WineConcierge] Error processing recommendation:", error);
    res.status(500).json({ 
      message: "Failed to generate recommendations",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Generate embeddings for wines (admin endpoint)
 */
router.post("/embeddings/generate", async (req, res) => {
  try {
    const { restaurantId, wineIds } = req.body;

    if (wineIds && Array.isArray(wineIds)) {
      // Generate for specific wines
      await wineEmbeddingService.generateWineEmbeddings(wineIds);
      res.json({ 
        message: `Started generating embeddings for ${wineIds.length} wines`,
        wine_count: wineIds.length
      });
    } else {
      // Generate for all missing embeddings
      const count = await wineEmbeddingService.generateAllMissingEmbeddings(restaurantId);
      res.json({ 
        message: `Started generating embeddings for ${count} wines`,
        wine_count: count
      });
    }
  } catch (error) {
    console.error("[WineConcierge] Error generating embeddings:", error);
    res.status(500).json({ 
      message: "Failed to generate embeddings",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Get embedding statistics
 */
router.get("/embeddings/stats/:restaurantId", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);

    const totalWines = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(restaurantWinesIsolated)
      .where(eq(restaurantWinesIsolated.restaurant_id, restaurantId));

    const winesWithEmbeddings = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(restaurantWinesIsolated)
      .where(
        and(
          eq(restaurantWinesIsolated.restaurant_id, restaurantId),
          sql`${restaurantWinesIsolated.wine_embedding} IS NOT NULL`
        )
      );

    const total = totalWines[0]?.count || 0;
    const withEmbeddings = winesWithEmbeddings[0]?.count || 0;
    
    res.json({
      restaurant_id: restaurantId,
      total_wines: total,
      wines_with_embeddings: withEmbeddings,
      wines_without_embeddings: total - withEmbeddings,
      percentage_complete: total > 0 
        ? Math.round((withEmbeddings / total) * 100)
        : 0
    });
  } catch (error) {
    console.error("[WineConcierge] Error fetching embedding stats:", error);
    res.status(500).json({ 
      message: "Failed to fetch embedding statistics",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;