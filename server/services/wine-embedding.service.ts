import OpenAI from "openai";
import { db } from "../db";
import { restaurantWinesIsolated } from "@shared/wine-schema";
import { eq, isNull, and, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Model configuration
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

export class WineEmbeddingService {
  /**
   * Generate embeddings for a batch of wines
   */
  async generateWineEmbeddings(wineIds: number[]): Promise<void> {
    try {
      // Fetch wines that need embeddings
      const wines = await db
        .select()
        .from(restaurantWinesIsolated)
        .where(
          and(
            inArray(restaurantWinesIsolated.id, wineIds),
            isNull(restaurantWinesIsolated.wine_embedding)
          )
        );

      console.log(`[WineEmbedding] Processing ${wines.length} wines for embeddings`);

      for (const wine of wines) {
        try {
          // Create comprehensive wine description for embedding
          const wineDescription = this.createWineDescription(wine);
          
          // Generate embedding
          const embedding = await this.generateEmbedding(wineDescription);
          
          // Store embedding in database
          await db
            .update(restaurantWinesIsolated)
            .set({
              wine_embedding: embedding,
              embedding_generated_at: new Date(),
              embedding_model: EMBEDDING_MODEL,
              updated_at: new Date()
            })
            .where(eq(restaurantWinesIsolated.id, wine.id));
          
          console.log(`[WineEmbedding] Generated embedding for wine ${wine.id}: ${wine.wine_name}`);
          
          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`[WineEmbedding] Error processing wine ${wine.id}:`, error);
        }
      }
    } catch (error) {
      console.error("[WineEmbedding] Error in batch processing:", error);
      throw error;
    }
  }

  /**
   * Generate embeddings for all wines without embeddings
   */
  async generateAllMissingEmbeddings(restaurantId?: number): Promise<number> {
    try {
      const whereClause = restaurantId 
        ? and(
            eq(restaurantWinesIsolated.restaurant_id, restaurantId),
            isNull(restaurantWinesIsolated.wine_embedding)
          )
        : isNull(restaurantWinesIsolated.wine_embedding);

      const wines = await db
        .select({ id: restaurantWinesIsolated.id })
        .from(restaurantWinesIsolated)
        .where(whereClause);

      const wineIds = wines.map(w => w.id);
      
      if (wineIds.length === 0) {
        console.log("[WineEmbedding] No wines need embeddings");
        return 0;
      }

      // Process in batches of 10
      const batchSize = 10;
      for (let i = 0; i < wineIds.length; i += batchSize) {
        const batch = wineIds.slice(i, i + batchSize);
        await this.generateWineEmbeddings(batch);
      }

      return wineIds.length;
    } catch (error) {
      console.error("[WineEmbedding] Error generating missing embeddings:", error);
      throw error;
    }
  }

  /**
   * Generate embedding for a query
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      return await this.generateEmbedding(query);
    } catch (error) {
      console.error("[WineEmbedding] Error generating query embedding:", error);
      throw error;
    }
  }

  /**
   * Find similar wines using vector similarity
   */
  async findSimilarWines(
    queryEmbedding: number[], 
    restaurantId: number, 
    priceMin?: number,
    priceMax?: number,
    limit: number = 3
  ): Promise<any[]> {
    try {
      // Convert embedding array to PostgreSQL vector format
      const vectorString = `[${queryEmbedding.join(',')}]`;
      
      // Build price filter
      let priceFilter = sql`1=1`;
      if (priceMin !== undefined && priceMax !== undefined) {
        priceFilter = sql`${restaurantWinesIsolated.menu_price} BETWEEN ${priceMin} AND ${priceMax}`;
      }

      // Get top matches first
      const topResults = await db.execute(sql`
        SELECT 
          *,
          1 - (${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector) as similarity
        FROM ${restaurantWinesIsolated}
        WHERE 
          ${restaurantWinesIsolated.restaurant_id} = ${restaurantId}
          AND ${restaurantWinesIsolated.wine_embedding} IS NOT NULL
          AND ${priceFilter}
        ORDER BY ${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector
        LIMIT ${Math.min(limit, 2)}
      `);

      // If we need a 3rd recommendation, get it with slightly more conservative criteria
      if (limit > 2 && topResults.rows.length >= 2) {
        // Expand price range by 20% for more conservative wild card
        const expandedPriceMin = priceMin ? Math.floor(priceMin * 0.8) : undefined;
        const expandedPriceMax = priceMax ? Math.ceil(priceMax * 1.2) : undefined;
        
        // Build expanded price filter
        let expandedPriceFilter = sql`1=1`;
        if (expandedPriceMin !== undefined && expandedPriceMax !== undefined) {
          expandedPriceFilter = sql`${restaurantWinesIsolated.menu_price} BETWEEN ${expandedPriceMin} AND ${expandedPriceMax}`;
        }

        // Get wines that are good matches but not in top 2
        const excludedIds = topResults.rows.map((r: any) => r.id);
        
        // Build the query with proper exclusion
        let excludeClause = sql`1=1`;
        if (excludedIds.length > 0) {
          excludeClause = sql`${restaurantWinesIsolated.id} != ALL(ARRAY[${sql.raw(excludedIds.join(','))}]::int[])`;
        }
        
        const wildCardResults = await db.execute(sql`
          SELECT 
            *,
            1 - (${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector) as similarity
          FROM ${restaurantWinesIsolated}
          WHERE 
            ${restaurantWinesIsolated.restaurant_id} = ${restaurantId}
            AND ${restaurantWinesIsolated.wine_embedding} IS NOT NULL
            AND ${expandedPriceFilter}
            AND ${excludeClause}
            AND (1 - (${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector)) > 0.7
          ORDER BY ${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector
          LIMIT 5
        `);

        // Select wild card from results with some variety
        if (wildCardResults.rows.length > 0) {
          // Pick 2nd best wild card option for more interesting but still conservative choice
          const wildCardIndex = Math.min(1, wildCardResults.rows.length - 1);
          return [...topResults.rows, wildCardResults.rows[wildCardIndex]];
        }
      }

      return topResults.rows;
    } catch (error) {
      console.error("[WineEmbedding] Error finding similar wines:", error);
      throw error;
    }
  }

  /**
   * Create a comprehensive wine description for embedding
   */
  private createWineDescription(wine: any): string {
    const parts = [];

    // Basic info
    parts.push(`${wine.wine_name} by ${wine.producer}`);
    
    if (wine.vintage && wine.vintage !== "NV") {
      parts.push(`Vintage ${wine.vintage}`);
    }
    
    // Wine type and characteristics
    if (wine.type) parts.push(wine.type);
    if (wine.grape_variety) parts.push(`Made from ${wine.grape_variety}`);
    if (wine.region) parts.push(`From ${wine.region}`);
    if (wine.country) parts.push(wine.country);
    
    // Tasting profile
    if (wine.tasting_notes) {
      parts.push(`Tasting notes: ${wine.tasting_notes}`);
    }
    
    // Food pairing
    if (wine.food_pairing) {
      parts.push(`Pairs well with ${wine.food_pairing}`);
    }
    
    // Special attributes
    if (wine.is_natural_wine) parts.push("Natural wine");
    if (wine.is_biodynamic) parts.push("Biodynamic");
    if (wine.prestige_level) parts.push(`${wine.prestige_level} prestige`);
    
    // Service info
    if (wine.serving_temp) {
      parts.push(`Best served at ${wine.serving_temp}`);
    }
    
    // Price category (generalized)
    if (wine.menu_price) {
      const priceNum = typeof wine.menu_price === 'string' ? parseFloat(wine.menu_price) : Number(wine.menu_price);
      let priceCategory = "affordable";
      if (priceNum > 200) priceCategory = "luxury";
      else if (priceNum > 100) priceCategory = "premium";
      else if (priceNum > 50) priceCategory = "mid-range";
      parts.push(`${priceCategory} price point`);
    }

    return parts.join(". ");
  }

  /**
   * Generate embedding using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error("[WineEmbedding] OpenAI API error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const wineEmbeddingService = new WineEmbeddingService();