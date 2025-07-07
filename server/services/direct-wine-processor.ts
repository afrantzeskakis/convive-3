// Import database connection
const pg = require('pg');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
import OpenAI from 'openai';

// Initialize OpenAI client 
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Wine information type definition
 */
export interface WineInfo {
  name: string;
  vintage?: string;
  producer?: string;
  region?: string;
  country?: string;
  varietals?: string | string[];
  restaurant_price?: string;
  description?: string;
  wineStyle?: string;
  bodyRating?: number;
  tanninRating?: number;
  acidityRating?: number;
  sweetness?: string;
  alcohol?: string;
  foodPairings?: string[];
  [key: string]: any;
}

/**
 * Direct wine processor with GPT-4o
 */
export class DirectWineProcessor {
  /**
   * Process a wine list line by line with direct database storage
   */
  async processWineList(wineListText: string): Promise<{
    success: boolean;
    processedCount: number;
    message: string;
  }> {
    try {
      console.log(`Processing wine list (${wineListText.length} characters)`);
      
      // Split wine list into individual lines
      const lines = wineListText.split('\n').filter(line => line.trim().length > 0);
      console.log(`Wine list contains ${lines.length} lines`);
      
      let processedCount = 0;
      let errorCount = 0;
      
      // Process each wine line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip very short lines that likely aren't wines
        if (line.length < 4) continue;
        
        try {
          // Extract wine info using GPT-4o
          const wine = await this.extractWineInfo(line);
          
          if (wine && wine.name) {
            // Store wine in database
            await this.storeWineInDatabase(wine);
            processedCount++;
            
            // Log progress for large batches
            if (processedCount % 100 === 0 || i === lines.length - 1) {
              console.log(`Progress: ${processedCount}/${lines.length} wines processed`);
            }
          }
        } catch (error) {
          console.error(`Error processing wine line: ${line}`, error);
          errorCount++;
        }
        
        // Add a small delay to avoid overwhelming the API or database
        if (i < lines.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      console.log(`Wine list processing complete. Processed ${processedCount} wines with ${errorCount} errors.`);
      
      return {
        success: true,
        processedCount,
        message: `Successfully processed ${processedCount} wines from the wine list.`
      };
    } catch (error) {
      console.error('Error processing wine list:', error);
      return {
        success: false,
        processedCount: 0,
        message: `Failed to process wine list: ${error.message}`
      };
    }
  }
  
  /**
   * Extract wine information from a line of text using GPT-4o
   */
  private async extractWineInfo(line: string): Promise<WineInfo | null> {
    try {
      // For shorter lines, we'll use basic extraction before calling GPT-4o
      let basicWine: WineInfo = {
        name: line
      };
      
      // Look for vintage year pattern (4 digits)
      const vintageMatch = line.match(/\b(19|20)\d{2}\b/);
      if (vintageMatch) {
        basicWine.vintage = vintageMatch[0];
        // Clean up the name
        basicWine.name = line.replace(vintageMatch[0], '').trim()
          .replace(/\s{2,}/g, ' ')
          .replace(/[,.;:]+$/, '');
      }
      
      // If OpenAI API key is available, enhance with GPT-4o
      if (process.env.OPENAI_API_KEY) {
        console.log(`Enhancing wine info with GPT-4o: ${line.substring(0, 30)}...`);
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a wine expert AI that extracts structured wine information from text.
Extract the following fields from the wine list entry (leave fields empty if not present):
- name: The name of the wine
- producer: The producer/winery 
- vintage: The year the wine was produced
- region: The specific region
- country: The country of origin
- varietals: The grape varietals (comma-separated)
- wineStyle: The style (red, white, sparkling, etc.)
- restaurant_price: Any price information
- description: A brief description if available

Respond ONLY with a JSON object. No explanations.`
            },
            {
              role: "user",
              content: line
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        });
        
        const content = response.choices[0].message.content;
        if (content) {
          const enhancedWine = JSON.parse(content) as WineInfo;
          return enhancedWine;
        }
      }
      
      // Return basic wine info if GPT-4o enhancement failed or no API key
      return basicWine;
    } catch (error) {
      console.error('Error extracting wine info:', error);
      // Return basic info instead of failing
      return {
        name: line,
        vintage: line.match(/\b(19|20)\d{2}\b/)?.[0]
      };
    }
  }
  
  /**
   * Store wine in PostgreSQL database
   */
  private async storeWineInDatabase(wine: WineInfo): Promise<void> {
    try {
      // Create a cache key for deduplication
      const vintage = wine.vintage || '';
      const cacheKey = `${wine.name}_${vintage}`.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w_]/g, '');
      
      // Format wine data for database storage
      const wineData = {
        name: { 
          value: wine.name, 
          confidence: 90, 
          source: { type: 'gpt4o', confidence: 90 }, 
          estimated: false 
        },
        vintage: wine.vintage ? { 
          value: wine.vintage, 
          confidence: 85, 
          source: { type: 'gpt4o', confidence: 85 }, 
          estimated: false 
        } : undefined,
        producer: wine.producer ? { 
          value: wine.producer, 
          confidence: 85, 
          source: { type: 'gpt4o', confidence: 85 }, 
          estimated: false 
        } : undefined,
        region: wine.region ? { 
          value: wine.region, 
          confidence: 80, 
          source: { type: 'gpt4o', confidence: 80 }, 
          estimated: false 
        } : undefined,
        country: wine.country ? { 
          value: wine.country, 
          confidence: 85, 
          source: { type: 'gpt4o', confidence: 85 }, 
          estimated: false 
        } : undefined,
        varietals: wine.varietals ? { 
          value: typeof wine.varietals === 'string' ? wine.varietals : wine.varietals.join(', '), 
          confidence: 80, 
          source: { type: 'gpt4o', confidence: 80 }, 
          estimated: false 
        } : undefined,
        description: wine.description,
        wineStyle: wine.wineStyle,
        bodyRating: wine.bodyRating,
        tanninRating: wine.tanninRating,
        acidityRating: wine.acidityRating
      };
      
      // Store wine in database with UPSERT logic
      const query = `
        INSERT INTO wines (
          cache_key, wine_name, vintage, producer, region, country, varietals, wine_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) ON CONFLICT (cache_key) 
        DO UPDATE SET
          wine_name = EXCLUDED.wine_name,
          vintage = EXCLUDED.vintage,
          producer = EXCLUDED.producer,
          region = EXCLUDED.region,
          country = EXCLUDED.country,
          varietals = EXCLUDED.varietals,
          wine_data = EXCLUDED.wine_data
      `;
      
      const params = [
        cacheKey,
        wine.name,
        wine.vintage || null,
        wine.producer || null,
        wine.region || null,
        wine.country || null,
        typeof wine.varietals === 'string' ? wine.varietals : 
          Array.isArray(wine.varietals) ? wine.varietals.join(', ') : null,
        JSON.stringify(wineData)
      ];
      
      await pool.query(query, params);
    } catch (error) {
      console.error(`Error storing wine in database: ${wine.name}`, error);
      throw error;
    }
  }
  
  /**
   * Get all wines from database with pagination
   */
  async getAllWines(page: number = 1, pageSize: number = 20, search: string = ''): Promise<{
    wines: any[];
    totalCount: number;
    totalPages: number;
  }> {
    try {
      // Validate pagination params
      const validPage = Math.max(1, page);
      const validPageSize = Math.max(1, Math.min(100, pageSize));
      const offset = (validPage - 1) * validPageSize;
      
      // Build query parameters
      const params = [];
      let whereClause = '';
      
      // Add search condition if provided
      if (search && search.trim()) {
        whereClause = `
          WHERE 
            wine_name ILIKE $1 OR 
            COALESCE(vintage, '') ILIKE $1 OR 
            COALESCE(producer, '') ILIKE $1 OR 
            COALESCE(region, '') ILIKE $1 OR 
            COALESCE(country, '') ILIKE $1 OR
            COALESCE(varietals, '') ILIKE $1
        `;
        params.push(`%${search}%`);
      }
      
      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) FROM wines ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / validPageSize) || 1;
      
      // Get paginated wines
      let dataParams = [...params];
      if (params.length > 0) {
        dataParams.push(validPageSize, offset);
        var dataQuery = `
          SELECT wine_data 
          FROM wines 
          ${whereClause}
          ORDER BY wine_name, vintage
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
      } else {
        dataParams.push(validPageSize, offset);
        var dataQuery = `
          SELECT wine_data 
          FROM wines
          ORDER BY wine_name, vintage
          LIMIT $1 OFFSET $2
        `;
      }
      
      // Execute query and format results
      const result = await pool.query(dataQuery, dataParams);
      const wines = result.rows.map(row => row.wine_data);
      
      console.log(`Retrieved ${wines.length} wines from database (page ${validPage}/${totalPages})`);
      console.log(`Total wines in database: ${totalCount}`);
      
      return {
        wines,
        totalCount,
        totalPages
      };
    } catch (error) {
      console.error('Error retrieving wines from database:', error);
      return {
        wines: [],
        totalCount: 0,
        totalPages: 0
      };
    }
  }
  
  /**
   * Get total number of wines in database
   */
  async getWineCount(): Promise<number> {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM wines');
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting wine count:', error);
      return 0;
    }
  }
}

// Create a singleton instance
export const directWineProcessor = new DirectWineProcessor();