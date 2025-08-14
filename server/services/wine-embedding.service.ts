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
    limit: number = 3,
    wineType?: 'red' | 'white' | 'rosé' | 'sparkling' | 'dessert'
  ): Promise<any[]> {
    try {
      // Convert embedding array to PostgreSQL vector format
      const vectorString = `[${queryEmbedding.join(',')}]`;
      
      // Build price filter
      let priceFilter = sql`1=1`;
      if (priceMin !== undefined && priceMax !== undefined) {
        priceFilter = sql`${restaurantWinesIsolated.menu_price} BETWEEN ${priceMin} AND ${priceMax}`;
      }
      
      // Build wine type filter
      let typeFilter = sql`1=1`;
      if (wineType) {
        // Map wine type to expected database values
        const typeMapping: Record<string, string[]> = {
          'red': ['Red', 'red', 'Red Wine', 'RED'],
          'white': ['White', 'white', 'White Wine', 'WHITE'],
          'rosé': ['Rosé', 'rosé', 'Rose', 'rose', 'ROSÉ'],
          'sparkling': ['Sparkling', 'sparkling', 'Champagne', 'champagne', 'Prosecco', 'prosecco', 'Cava', 'cava', 'SPARKLING'],
          'dessert': ['Dessert', 'dessert', 'Sweet', 'sweet', 'Port', 'port', 'DESSERT']
        };
        const typeValues = typeMapping[wineType] || [wineType];
        typeFilter = sql`LOWER(${restaurantWinesIsolated.wine_type}) = ANY(ARRAY[${sql.raw(typeValues.map(t => `'${t.toLowerCase()}'`).join(','))}])`;
      }

      // Get top matches first - if wine type is specified, try to find matches with that type
      let topResults = await db.execute(sql`
        SELECT 
          *,
          1 - (${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector) as similarity
        FROM ${restaurantWinesIsolated}
        WHERE 
          ${restaurantWinesIsolated.restaurant_id} = ${restaurantId}
          AND ${restaurantWinesIsolated.wine_embedding} IS NOT NULL
          AND ${priceFilter}
          AND ${typeFilter}
        ORDER BY ${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector
        LIMIT ${Math.min(limit, 2)}
      `);
      
      // If we don't have enough results with strict type filtering, expand to include generic "wine" type
      if (topResults.rows.length < Math.min(limit, 2) && wineType) {
        const expandedTypeFilter = sql`LOWER(${restaurantWinesIsolated.wine_type}) IN ('${wineType.toLowerCase()}', 'wine')`;
        topResults = await db.execute(sql`
          SELECT 
            *,
            1 - (${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector) as similarity
          FROM ${restaurantWinesIsolated}
          WHERE 
            ${restaurantWinesIsolated.restaurant_id} = ${restaurantId}
            AND ${restaurantWinesIsolated.wine_embedding} IS NOT NULL
            AND ${priceFilter}
            AND ${expandedTypeFilter}
          ORDER BY ${restaurantWinesIsolated.wine_embedding} <=> ${vectorString}::vector
          LIMIT ${Math.min(limit, 2)}
        `);
      }

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
        
        // For wild card, be more flexible with wine type - include generic "wine" entries if specific type has few matches
        let wildCardTypeFilter = typeFilter;
        if (wineType) {
          const typeMapping: Record<string, string[]> = {
            'red': ['Red', 'red', 'Red Wine', 'RED', 'wine'], // Include generic "wine" for more options
            'white': ['White', 'white', 'White Wine', 'WHITE', 'wine'],
            'rosé': ['Rosé', 'rosé', 'Rose', 'rose', 'ROSÉ', 'wine'],
            'sparkling': ['Sparkling', 'sparkling', 'Champagne', 'champagne', 'Prosecco', 'prosecco', 'Cava', 'cava', 'SPARKLING', 'wine'],
            'dessert': ['Dessert', 'dessert', 'Sweet', 'sweet', 'Port', 'port', 'DESSERT', 'wine']
          };
          const typeValues = typeMapping[wineType] || [wineType, 'wine'];
          wildCardTypeFilter = sql`LOWER(${restaurantWinesIsolated.wine_type}) = ANY(ARRAY[${sql.raw(typeValues.map(t => `'${t.toLowerCase()}'`).join(','))}])`;
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
            AND ${wildCardTypeFilter}
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