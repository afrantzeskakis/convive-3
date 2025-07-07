import OpenAI from 'openai';
// Import database connection
import { pool } from '../db';

// Initialize OpenAI client
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
 * GPT-4o powered wine list processor
 */
export class GPT4OWineProcessor {
  /**
   * Process a wine list using GPT-4o, line by line
   */
  async processWineList(wineListText: string, 
                         progressCallback?: (progress: any) => void): Promise<WineInfo[]> {
    console.log(`Processing wine list using GPT-4o processor (${wineListText.length} characters)`);
    
    // Split the list into lines
    const lines = wineListText.split('\n').filter(line => line.trim().length > 0);
    console.log(`Wine list contains ${lines.length} lines`);
    
    // For large lists, we'll process each line as a separate wine
    // This handles lists of 5,000+ wines efficiently
    const allWines: WineInfo[] = [];
    let processedCount = 0;
    
    // Process in batches of 20 lines to avoid overwhelming the database
    const batchSize = 20;
    const totalBatches = Math.ceil(lines.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, lines.length);
      const batchLines = lines.slice(batchStart, batchEnd);
      
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (lines ${batchStart + 1}-${batchEnd})`);
      
      // Process each line in this batch
      for (const line of batchLines) {
        try {
          if (line.trim().length > 3) { // Skip very short lines
            const wine = await this.processWineLine(line);
            if (wine) {
              allWines.push(wine);
              
              // Store wine in database
              await this.storeWineInDatabase(wine);
              
              processedCount++;
              if (processedCount % 100 === 0) {
                console.log(`Processed ${processedCount}/${lines.length} wines`);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing line: ${line}`, error);
        }
      }
      
      // Update progress callback
      if (progressCallback) {
        progressCallback({
          currentBatch: batchIndex + 1,
          totalBatches,
          processedWines: processedCount,
          totalWines: lines.length,
          percentComplete: Math.round((batchIndex + 1) * 100 / totalBatches)
        });
      }
      
      // Add a delay between batches to avoid rate limits (3 requests/minute)
      if (batchIndex < totalBatches - 1) {
        console.log('Pausing between batches to avoid rate limits...');
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20 second pause
      }
    }
    
    console.log(`Successfully processed ${processedCount} wines from wine list`);
    return allWines;
  }
  
  /**
   * Process a single line of a wine list using GPT-4o
   */
  private async processWineLine(line: string): Promise<WineInfo | null> {
    try {
      // The simplest approach is to just extract wine name and vintage if present
      // This is fast and works for most wine list formats
      let wineName = line.trim();
      let vintage: string | undefined = undefined;
      
      // Look for vintage year (4 digits) in the wine name
      const vintageMatch = line.match(/\b(19|20)\d{2}\b/);
      if (vintageMatch) {
        vintage = vintageMatch[0];
        // Remove the vintage from the name for cleaner storage
        wineName = line.replace(vintageMatch[0], '').trim();
        // Remove extra spaces and punctuation
        wineName = wineName.replace(/\s{2,}/g, ' ').replace(/[,.;:]+$/, '');
      }
      
      // For more detailed extraction, use GPT-4o
      // This is more expensive but gives better results
      if (process.env.OPENAI_API_KEY) {
        try {
          const wineInfo = await this.extractWineInfoWithGPT4O(line);
          if (wineInfo) {
            return wineInfo;
          }
        } catch (gptError) {
          console.error(`Error using GPT-4o for line: ${line}`, gptError);
          // Fall back to basic extraction
        }
      }
      
      // Return basic wine info if GPT extraction failed
      return {
        name: wineName,
        vintage: vintage
      };
    } catch (error) {
      console.error(`Error processing wine line: ${line}`, error);
      return null;
    }
  }
  
  /**
   * Extract detailed wine information using GPT-4o
   */
  private async extractWineInfoWithGPT4O(line: string): Promise<WineInfo | null> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a wine expert AI assistant that extracts structured wine information from text.
Extract ONLY the following fields from the wine list entry (leave blank if not present):
- name: The name of the wine
- producer: The producer/winery that made the wine
- vintage: The year the wine was produced
- region: The specific region where the wine was produced
- country: The country of origin
- varietals: The grape varietals used (comma-separated)
- wineStyle: The style of wine (e.g., red, white, sparkling, etc.)
- restaurant_price: Any price information in the entry

Respond ONLY with a JSON object. No explanations or other text.
When uncertain, leave fields empty rather than guessing.`
          },
          {
            role: "user",
            content: line
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
      
      // Extract and parse the response
      const content = response.choices[0].message.content;
      if (content) {
        const wineInfo = JSON.parse(content) as WineInfo;
        return wineInfo;
      }
      
      return null;
    } catch (error) {
      console.error(`GPT-4o extraction error:`, error);
      return null;
    }
  }
  
  /**
   * Store wine information in PostgreSQL database
   */
  private async storeWineInDatabase(wine: WineInfo): Promise<void> {
    try {
      // Create a cache key for the wine
      const vintage = wine.vintage || '';
      const cacheKey = `${wine.name}_${vintage}`.replace(/\s+/g, '_').toLowerCase();
      
      // Extract fields for database indexing
      const wineName = wine.name;
      const producer = wine.producer || null;
      const region = wine.region || null;
      const country = wine.country || null;
      const varietals = wine.varietals ? 
        (typeof wine.varietals === 'string' ? wine.varietals : wine.varietals.join(', ')) : 
        null;
      
      // Store in PostgreSQL
      const query = `
        INSERT INTO wines 
          (cache_key, wine_name, vintage, producer, region, country, varietals, wine_data)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (cache_key) 
        DO UPDATE SET
          wine_name = EXCLUDED.wine_name,
          vintage = EXCLUDED.vintage,
          producer = EXCLUDED.producer,
          region = EXCLUDED.region,
          country = EXCLUDED.country,
          varietals = EXCLUDED.varietals,
          wine_data = EXCLUDED.wine_data
      `;
      
      const wineData = JSON.stringify({
        name: { value: wine.name, confidence: 90, source: { type: 'gpt4o', confidence: 90 }, estimated: false },
        vintage: wine.vintage ? 
          { value: wine.vintage, confidence: 90, source: { type: 'gpt4o', confidence: 90 }, estimated: false } : 
          undefined,
        producer: wine.producer ? 
          { value: wine.producer, confidence: 85, source: { type: 'gpt4o', confidence: 85 }, estimated: false } : 
          undefined,
        region: wine.region ? 
          { value: wine.region, confidence: 85, source: { type: 'gpt4o', confidence: 85 }, estimated: false } : 
          undefined,
        country: wine.country ? 
          { value: wine.country, confidence: 90, source: { type: 'gpt4o', confidence: 90 }, estimated: false } : 
          undefined,
        varietals: wine.varietals ? 
          { value: wine.varietals, confidence: 85, source: { type: 'gpt4o', confidence: 85 }, estimated: false } : 
          undefined,
        restaurant_price: wine.restaurant_price,
        wineStyle: wine.wineStyle,
        description: wine.description,
        bodyRating: wine.bodyRating,
        tanninRating: wine.tanninRating,
        acidityRating: wine.acidityRating,
        sweetness: wine.sweetness,
        alcohol: wine.alcohol,
        foodPairings: wine.foodPairings
      });
      
      await pool.query(query, [
        cacheKey,
        wineName,
        wine.vintage || null,
        producer,
        region,
        country,
        varietals,
        wineData
      ]);
      
      console.log(`GPT-4o wine saved to database: ${cacheKey}`);
    } catch (error) {
      console.error(`Error storing wine in database:`, error);
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
      // Build the query parameters
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
      
      // Calculate pagination
      const offset = (page - 1) * pageSize;
      const totalPages = Math.ceil(totalCount / pageSize) || 1;
      
      // Validate page number
      const validPage = Math.max(1, Math.min(page, totalPages));
      const validOffset = (validPage - 1) * pageSize;
      
      // Get paginated wines
      let queryParams = [...params];
      if (params.length > 0) {
        queryParams.push(pageSize, validOffset);
        var dataQuery = `
          SELECT wine_data 
          FROM wines 
          ${whereClause}
          ORDER BY wine_name, vintage
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
      } else {
        queryParams.push(pageSize, validOffset);
        var dataQuery = `
          SELECT wine_data 
          FROM wines
          ORDER BY wine_name, vintage
          LIMIT $1 OFFSET $2
        `;
      }
      
      // Execute query and map results
      const result = await pool.query(dataQuery, queryParams);
      const wines = result.rows.map(row => row.wine_data);
      
      console.log(`Retrieved ${wines.length} wines from database (page ${validPage}/${totalPages}, total: ${totalCount})`);
      
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
}

// Create singleton instance
export const gpt4oWineProcessor = new GPT4OWineProcessor();