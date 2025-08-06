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

      // Query for similar wines using cosine distance
      const results = await db.execute(sql`
        SELECT 
          *,
          1 - (${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector) as similarity
        FROM ${restaurantWinesIsolated}
        WHERE 
          ${restaurantWinesIsolated.restaurant_id} = ${restaurantId}
          AND ${restaurantWinesIsolated.wine_embedding} IS NOT NULL
          AND ${priceFilter}
        ORDER BY ${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector
        LIMIT ${limit}
      `);

      return results.rows;
    } catch (error) {
      console.error("[WineEmbedding] Error finding similar wines:", error);
      throw error;
    }
  }

  /**
   * Find a wild card wine that's intentionally different
   */
  async findWildCardWine(
    queryEmbedding: number[],
    restaurantId: number,
    priceMin?: number,
    priceMax?: number,
    excludeWineNames: string[] = []
  ): Promise<any | null> {
    try {
      // Convert embedding array to PostgreSQL vector format
      const vectorString = `[${queryEmbedding.join(',')}]`;
      
      // Build price filter
      let priceFilter = sql`1=1`;
      if (priceMin !== undefined && priceMax !== undefined) {
        priceFilter = sql`${restaurantWinesIsolated.menu_price} BETWEEN ${priceMin} AND ${priceMax}`;
      }

      // Build exclusion filter for wine names (to avoid same wine different vintage)
      let exclusionFilter = sql`1=1`;
      if (excludeWineNames.length > 0) {
        // Extract base wine names without vintage
        const baseNames = excludeWineNames.map(name => {
          // Remove vintage year (4 digits) from wine name
          return name.replace(/\b(19|20)\d{2}\b/g, '').trim();
        });
        
        // Exclude wines with similar base names
        const conditions = baseNames.map(baseName => 
          sql`${restaurantWinesIsolated.wine_name} NOT ILIKE ${`%${baseName}%`}`
        );
        
        if (conditions.length > 0) {
          exclusionFilter = sql`(${conditions.reduce((a, b) => sql`${a} AND ${b}`)})`;
        }
      }

      // Strategy 1: Find wines with moderate distance (not too similar, not too different)
      // Target wines with similarity between 0.3 and 0.7 (adventurous but not random)
      const wildCardResult = await db.execute(sql`
        SELECT 
          *,
          1 - (${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector) as similarity
        FROM ${restaurantWinesIsolated}
        WHERE 
          ${restaurantWinesIsolated.restaurant_id} = ${restaurantId}
          AND ${restaurantWinesIsolated.wine_embedding} IS NOT NULL
          AND ${priceFilter}
          AND ${exclusionFilter}
          AND (1 - (${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector)) BETWEEN 0.3 AND 0.7
        ORDER BY RANDOM()
        LIMIT 1
      `);

      if (wildCardResult.rows.length > 0) {
        return wildCardResult.rows[0];
      }

      // Strategy 2: If no moderate distance wines, get any different wine
      const fallbackResult = await db.execute(sql`
        SELECT 
          *,
          1 - (${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector) as similarity
        FROM ${restaurantWinesIsolated}
        WHERE 
          ${restaurantWinesIsolated.restaurant_id} = ${restaurantId}
          AND ${restaurantWinesIsolated.wine_embedding} IS NOT NULL
          AND ${priceFilter}
          AND ${exclusionFilter}
        ORDER BY ${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector DESC
        LIMIT 1
      `);

      return fallbackResult.rows.length > 0 ? fallbackResult.rows[0] : null;
    } catch (error) {
      console.error("[WineEmbedding] Error finding wild card wine:", error);
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