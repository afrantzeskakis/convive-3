import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { aiCacheService } from './ai-cache-service';

// ES Module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define interfaces for wine data
export interface WineEnrichmentSource {
  type: 'tech_sheet' | 'winery_website' | 'importer_website' | 'wine_searcher' | 'research_database' | 'regional_estimate';
  confidence: number;
  url?: string;
}

export interface WineAttribute {
  value: string | number | string[];
  confidence: number;
  source: WineEnrichmentSource;
  estimated: boolean;
}

export interface EnrichedWine {
  name: WineAttribute;
  vintage: WineAttribute;
  producer: WineAttribute;
  region: WineAttribute;
  subregion?: WineAttribute;
  country: WineAttribute;
  varietals: WineAttribute;
  blend_percentages?: WineAttribute;
  body: WineAttribute;
  tannin?: WineAttribute;
  acidity: WineAttribute;
  alcohol_percent: WineAttribute;
  oak?: WineAttribute;
  flavors_raw: WineAttribute;
  flavors_normalized: WineAttribute;
  aromas: WineAttribute;
  style_summary: WineAttribute;
  food_pairings: WineAttribute;
  serving_temp_celsius?: WineAttribute;
  notable_attributes?: WineAttribute;
  restaurant_price: WineAttribute;
}

export interface BasicWineInfo {
  name: string;
  restaurant_price?: string;
  vintage?: string;
  producer?: string;
  region?: string;
  country?: string;
  varietals?: string[];
}

/**
 * Service implementing the Claude Sommelier specification
 */
export class SommelierService {
  private client: OpenAI;
  private cacheEnabled = true;
  private cacheFile = path.join(__dirname, '../../uploads/cached_wine_data.json');
  private resourcesDir = path.join(__dirname, '../../uploads/wine-resources');
  
  constructor() {
    // Initialize OpenAI client
    this.client = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    
    // Ensure the resources directory exists
    if (!fs.existsSync(this.resourcesDir)) {
      fs.mkdirSync(this.resourcesDir, { recursive: true });
    }
    
    // Ensure cache directory exists
    const cacheDir = path.dirname(this.cacheFile);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    console.log('Sommelier service initialized');
  }

  /**
   * Ingest a wine list and extract basic information
   * Handles large wine lists by processing in chunks
   * @param text The wine list text to process
   * @param progressCallback Optional callback function to report progress
   */
  async ingestWineList(
    text: string, 
    progressCallback?: (progress: {
      currentBatch: number;
      totalBatches: number;
      processedWines: number;
      totalWines: number;
      percentComplete: number;
    }) => void
  ): Promise<BasicWineInfo[]> {
    try {
      // For extremely large files (over 100K characters), process in smaller batches
      // but process the entire list to ensure completeness
      if (text.length > 100000) {
        console.log(`Wine list is extremely large (${text.length} characters). Processing in optimized batches.`);
        
        // Split the text into lines
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        console.log(`Wine list has ${lines.length} lines to process`);
        
        // Process the entire list in smaller batches with optimized batch size
        // Use smaller batch size (2000 characters) for very large files to reduce likelihood of token limit errors
        return await this.processWineListInChunks(text, 2000, progressCallback);
      } 
      
      // For moderately large files
      else if (text.length > 20000) {
        console.log(`Wine list is large (${text.length} characters). Processing in small chunks.`);
        return await this.processWineListInChunks(text, 3000, progressCallback);
      } 
      
      // For smaller files
      else {
        console.log(`Wine list is small (${text.length} characters). Processing in one go.`);
        
        // Still report progress for small files (just one batch)
        if (progressCallback) {
          progressCallback({
            currentBatch: 1,
            totalBatches: 1,
            processedWines: 0,
            totalWines: 1, // We don't know exact count yet
            percentComplete: 10 // Start at 10%
          });
        }
        
        const wines = await this.processWineListChunk(text);
        
        // Report completion for small files
        if (progressCallback) {
          progressCallback({
            currentBatch: 1,
            totalBatches: 1,
            processedWines: wines.length,
            totalWines: wines.length,
            percentComplete: 100
          });
        }
        
        return wines;
      }
    } catch (error) {
      console.error('Error ingesting wine list:', error);
      throw error;
    }
  }
  
  /**
   * Process a wine list by breaking it into smaller chunks
   * @param text The wine list text
   * @param chunkSize The maximum size of each chunk in tokens
   * @param progressCallback Optional callback to report progress
   */
  private async processWineListInChunks(
    text: string, 
    chunkSize: number,
    progressCallback?: (progress: {
      currentBatch: number;
      totalBatches: number;
      processedWines: number;
      totalWines: number;
      percentComplete: number;
    }) => void
  ): Promise<BasicWineInfo[]> {
    // Rough estimate of tokens (characters / 4)
    const estimatedTokens = text.length / 4;
    console.log(`Processing text with ~${estimatedTokens} estimated tokens in chunks of ~${chunkSize} tokens`);
    
    const allWines: BasicWineInfo[] = [];
    const lines = text.split('\n');
    let currentChunk: string[] = [];
    let currentTokens = 0;
    let chunkCounter = 0;
    
    // Estimate total batches
    const totalBatches = Math.max(1, Math.ceil(estimatedTokens / chunkSize));
    
    // Try to estimate total wines (very rough estimate)
    const estimatedTotalWines = Math.ceil(lines.length / 5); // Assuming every 5 lines is a wine entry
    let processedWines = 0;
    
    // Send initial progress update
    if (progressCallback) {
      progressCallback({
        currentBatch: 0,
        totalBatches,
        processedWines: 0,
        totalWines: estimatedTotalWines,
        percentComplete: 0
      });
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineTokens = line.length / 4;
      
      // Add line to current chunk if it fits
      if (currentTokens + lineTokens <= chunkSize) {
        currentChunk.push(line);
        currentTokens += lineTokens;
      } else {
        // Process current chunk if it's not empty
        if (currentChunk.length > 0) {
          chunkCounter++;
          console.log(`Processing chunk ${chunkCounter} with ~${currentTokens} tokens...`);
          
          // Update progress before processing
          if (progressCallback) {
            progressCallback({
              currentBatch: chunkCounter,
              totalBatches,
              processedWines,
              totalWines: estimatedTotalWines,
              percentComplete: Math.round((chunkCounter - 1) * 100 / totalBatches)
            });
          }
          
          let chunkFailed = false;
          try {
            const chunkWines = await this.processWineListChunk(currentChunk.join('\n'));
            console.log(`Extracted ${chunkWines.length} wines from chunk ${chunkCounter}`);
            allWines.push(...chunkWines);
            
            // Update processed wines count
            processedWines += chunkWines.length;
            
            // Update progress after processing
            if (progressCallback) {
              progressCallback({
                currentBatch: chunkCounter,
                totalBatches,
                processedWines,
                totalWines: Math.max(estimatedTotalWines, processedWines), // Update estimate if needed
                percentComplete: Math.round(chunkCounter * 100 / totalBatches)
              });
            }
          } catch (error) {
            console.error(`Error processing chunk ${chunkCounter}:`, error);
            chunkFailed = true;
          }
          
          // If the chunk failed, try processing it in smaller pieces
          if (chunkFailed) {
            console.log(`Retrying failed chunk ${chunkCounter} with smaller pieces...`);
            
            // Wait a bit before retrying to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const retryLines = currentChunk.filter(line => line.trim().length > 0);
            console.log(`Retrying with ${retryLines.length} lines in smaller batches...`);
            
            // Process in small batches of 3 lines at a time (even smaller than final chunk retry)
            for (let i = 0; i < retryLines.length; i += 3) {
              const smallBatch = retryLines.slice(i, Math.min(i + 3, retryLines.length)).join('\n');
              if (smallBatch.trim().length > 0) {
                try {
                  console.log(`Retrying lines ${i+1}-${Math.min(i+3, retryLines.length)} of ${retryLines.length}...`);
                  const retryWines = await this.processWineListChunk(smallBatch);
                  console.log(`Recovered ${retryWines.length} wines from retry batch`);
                  allWines.push(...retryWines);
                  processedWines += retryWines.length;
                } catch (retryError) {
                  console.error(`Failed to process small batch during retry:`, retryError);
                  
                  // Final attempt with individual lines
                  for (let j = i; j < Math.min(i + 3, retryLines.length); j++) {
                    const line = retryLines[j];
                    if (line.trim().length > 20) { // Only process substantial lines
                      try {
                        const lastChanceWines = await this.processWineListChunk(line);
                        if (lastChanceWines.length > 0) {
                          console.log(`Recovered ${lastChanceWines.length} wines from single line`);
                          allWines.push(...lastChanceWines);
                          processedWines += lastChanceWines.length;
                        }
                      } catch (e) {
                        // Ignore errors on last attempt
                      }
                    }
                    // Small delay between lines
                    await new Promise(resolve => setTimeout(resolve, 300));
                  }
                }
                // Delay between small batches
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          }
          
          // Reset for next chunk
          currentChunk = [line];
          currentTokens = lineTokens;
          
          // Add a dynamic delay between chunks to avoid rate limiting
          // Longer delay for larger chunks
          const delayMs = Math.max(2000, Math.min(6000, currentTokens * 2));
          console.log(`Waiting ${delayMs}ms before processing next chunk...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    // Process the final chunk if it's not empty
    if (currentChunk.length > 0) {
      chunkCounter++;
      console.log(`Processing final chunk ${chunkCounter} with ~${currentTokens} tokens...`);
      
      // Update progress before processing final chunk
      if (progressCallback) {
        progressCallback({
          currentBatch: chunkCounter,
          totalBatches,
          processedWines,
          totalWines: estimatedTotalWines,
          percentComplete: Math.round((chunkCounter - 1) * 100 / totalBatches)
        });
      }
      
      let failedFinalChunk = false;
      try {
        const chunkWines = await this.processWineListChunk(currentChunk.join('\n'));
        console.log(`Extracted ${chunkWines.length} wines from final chunk`);
        allWines.push(...chunkWines);
        
        // Update processed wines count
        processedWines += chunkWines.length;
      } catch (error) {
        console.error(`Error processing final chunk:`, error);
        failedFinalChunk = true;
      }
      
      // Retry failed final chunk with smaller pieces if it failed
      if (failedFinalChunk) {
        console.log("Retrying failed final chunk with smaller pieces...");
        
        // Wait longer before retrying to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const retryLines = currentChunk.filter(line => line.trim().length > 0);
        console.log(`Retrying with ${retryLines.length} lines in smaller batches...`);
        
        // Process in small batches of 5 lines at a time
        for (let i = 0; i < retryLines.length; i += 5) {
          const smallBatch = retryLines.slice(i, Math.min(i + 5, retryLines.length)).join('\n');
          if (smallBatch.trim().length > 0) {
            try {
              console.log(`Retrying lines ${i+1}-${Math.min(i+5, retryLines.length)} of ${retryLines.length}...`);
              const retryWines = await this.processWineListChunk(smallBatch);
              console.log(`Recovered ${retryWines.length} wines from retry batch`);
              allWines.push(...retryWines);
              processedWines += retryWines.length;
            } catch (retryError) {
              console.error(`Failed to process small batch during retry:`, retryError);
              
              // Last attempt - try line by line for this batch
              for (let j = i; j < Math.min(i + 5, retryLines.length); j++) {
                const line = retryLines[j];
                if (line.trim().length > 20) { // Only process longer lines that might be wines
                  try {
                    console.log(`Last chance attempt for line ${j+1}...`);
                    const lastChanceWines = await this.processWineListChunk(line);
                    if (lastChanceWines.length > 0) {
                      console.log(`Recovered ${lastChanceWines.length} wines from single line`);
                      allWines.push(...lastChanceWines);
                      processedWines += lastChanceWines.length;
                    }
                  } catch (e) {
                    // Ignore errors on last attempt
                    console.error(`Could not process line ${j+1} even with single line approach`);
                  }
                }
                // Small delay between lines
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
            // Delay between small batches
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }
    }
    
    // Send final progress update
    if (progressCallback) {
      progressCallback({
        currentBatch: totalBatches,
        totalBatches,
        processedWines,
        totalWines: processedWines, // Now we know the exact count
        percentComplete: 100
      });
    }
    
    console.log(`Completed processing ${chunkCounter} chunks, found ${allWines.length} wines total`);
    return allWines;
  }
  
  /**
   * Process a chunk of the wine list
   * This is a helper method for ingestWineList
   */
  private async processWineListChunk(textChunk: string): Promise<BasicWineInfo[]> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional sommelier analyzing a restaurant wine list. 
            Extract each wine entry with the following information:
            - name (including producer)
            - vintage (if present)
            - restaurant_price (as listed)
            
            Return the information in this JSON format:
            { "wines": [{ "name": "...", "vintage": "...", "restaurant_price": "..." }] }
            
            If the price is not provided, just omit that field.
            If the vintage is not provided, just omit that field.
            
            IMPORTANT: This may be just a partial list or section of a larger wine list. Only extract the entries that are clearly wines.`
          },
          {
            role: "user",
            content: textChunk
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.wines || [];
    } catch (error) {
      console.error('Error processing wine list chunk:', error);
      return []; // Return empty array for this chunk so other chunks can still be processed
    }
  }

  /**
   * Enrich a wine with detailed information from verified sources
   */
  async enrichWine(wine: BasicWineInfo): Promise<EnrichedWine> {
    // Generate cache key for this wine
    const cacheKey = `${wine.name}_${wine.vintage || 'NV'}`;
    
    // Check if we have this wine in our cache
    const cachedWine = await this.getFromCache(cacheKey);
    if (cachedWine) {
      console.log(`Using cached data for ${wine.name}`);
      return cachedWine;
    }
    
    // Prepare a comprehensive prompt for the AI to enrich the wine
    const prompt = `
      Enrich this wine with detailed, accurate information:
      Name: ${wine.name}
      ${wine.vintage ? `Vintage: ${wine.vintage}` : ''}
      ${wine.restaurant_price ? `Restaurant Price: ${wine.restaurant_price}` : ''}
      
      IMPORTANT INSTRUCTIONS:
      1. Use ONLY verified sources in this priority order:
         a) Technical sheets from producer/importer matching exact wine and vintage
         b) Winery official website product pages
         c) Trusted importer/distributor websites (Kermit Lynch, Skurnik, Winebow, etc.)
         d) Structured attributes from Wine-Searcher or research databases (varietal, region only)
         e) Controlled inference from regional/varietal/vintage characteristics
      
      2. For each attribute, provide:
         - Specific value
         - Confidence (as percentage)
         - Source type
         - Explicit disclaimer if confidence < 82% (mark as "estimated")
      
      3. For EVERY attribute, never display confidence lower than 82% - instead label as 82% with clear 'estimated' flag
      
      4. Normalize flavor descriptors (e.g., "blackcurrant" → "dark fruit") but keep original terms
      
      5. Be transparent - if there's limited information, clearly state: "This is a rarer label with limited documentation; these descriptors are estimated based on typical regional/varietal/vintage norms."
      
      Return the results as a JSON object following this exact schema.
    `;
    
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a wine expert with access to technical sheets, winery websites, and trusted sources. 
            Your task is to enrich wine entries with accurate, sourced information.
            You must ALWAYS follow the source prioritization in the prompt.
            NEVER invent information - use only verified sources or explicitly mark as estimated with 82% confidence.
            Return your response as a complete, valid JSON object matching the expected schema of an EnrichedWine.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const enrichedWine = JSON.parse(response.choices[0].message.content || "{}") as EnrichedWine;
      
      // Save to cache
      await this.saveToCache(cacheKey, enrichedWine);
      
      return enrichedWine;
    } catch (error) {
      console.error(`Error enriching wine ${wine.name}:`, error);
      throw error;
    }
  }

  /**
   * Recommend wines based on customer preferences
   */
  async recommendWines(
    wines: EnrichedWine[], 
    customerPreferences: string
  ): Promise<{ 
    recommendations: EnrichedWine[], 
    explanations: string[], 
    confidence_scores: number[],
    differentiating_factors: string[][]
  }> {
    try {
      // Prepare a recommendation prompt for the AI
      const prompt = `
        Generate wine recommendations based on these customer preferences:
        "${customerPreferences}"
        
        Available wines: ${JSON.stringify(wines.map(w => ({
          name: w.name.value,
          vintage: w.vintage?.value || "NV",
          price: w.restaurant_price?.value || "Unknown",
          body: w.body?.value || "Unknown",
          acidity: w.acidity?.value || "Unknown",
          varietals: w.varietals?.value || "Unknown",
          region: w.region?.value || "Unknown",
          country: w.country?.value || "Unknown",
          style: w.style_summary?.value || "Unknown",
          flavors: w.flavors_normalized?.value || "Unknown"
        })))}
        
        REQUIREMENTS:
        1. Return exactly 3 matching bottles
        2. For each recommended wine, provide:
           - A detailed explanation of why it matches
           - A clear confidence score (%) using this formula:
             Confidence Score (%) = min(100, (Raw flavor exact matches * 10) + 
                                  (Normalized flavor matches * 5) + 
                                  (Exact body match * 10) + 
                                  (Exact tannin match * 5) +
                                  (Exact acidity match * 5) + 
                                  (Food pairing match * 10) +
                                  (Within price range match * 15))
           - 4 distinct differentiating attributes for each wine (even if differences are subtle)

        3. If no wines score ≥80%, clearly state "No exact match found; showing closest recommendations"
        
        4. For differentiating factors, consider:
           - Region/subregion (e.g., different villages in Burgundy)
           - Producer style (traditional vs. modern)
           - Vintage characteristics
           - Soil type impact
           - Oak presence/type/duration
           - Aging potential
        
        5. Ensure differentiating factors are explained in approachable language with clear translations of wine terms
        
        Return the response as a complete JSON object.
      `;
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional sommelier making recommendations based on a customer's request.
            You must provide EXACTLY THREE wine recommendations, each with exactly FOUR key differentiating factors.
            Your response must follow the JSON schema exactly.
            Provide recommendations with differentiating factors that are clearly explained in approachable language.
            Always translate technical wine terms into plain language.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Find the actual wine objects from the provided indices or names
      const recommendedWines = result.recommended_indices 
        ? result.recommended_indices.map((idx: number) => wines[idx])
        : result.recommended_wines.map((name: string) => {
            return wines.find(w => 
              w.name.value.toString().toLowerCase() === name.toLowerCase() ||
              w.name.value.toString().toLowerCase().includes(name.toLowerCase())
            );
          });
      
      return {
        recommendations: recommendedWines.filter(Boolean), // Filter out any undefined entries
        explanations: result.explanations || [],
        confidence_scores: result.confidence_scores || [],
        differentiating_factors: result.differentiating_factors || []
      };
      
    } catch (error) {
      console.error('Error generating wine recommendations:', error);
      throw error;
    }
  }

  /**
   * Format wine recommendations for display to restaurant staff
   */
  formatRecommendations(
    wines: EnrichedWine[], 
    explanations: string[], 
    confidenceScores: number[],
    differentiatingFactors: string[][]
  ): string {
    let output = `Here are 3 wines matching your guest's request:\n\n`;
    
    wines.forEach((wine, index) => {
      const name = wine.name.value;
      const vintage = wine.vintage?.value || 'NV';
      const region = wine.region?.value || '';
      const price = wine.restaurant_price?.value || '';
      
      // Format the wine name, region and price
      output += `${index + 1}. ${name} ${vintage}, ${region}, ${price}\n`;
      
      // Add explanation
      output += `   - ${explanations[index]}\n`;
      
      // Add differentiating factors
      output += `   - Four key differences:\n`;
      differentiatingFactors[index].forEach(factor => {
        output += `     * ${factor}\n`;
      });
      
      output += '\n';
    });
    
    // If any confidence scores are low, add disclaimer
    if (confidenceScores.some(score => score < 80)) {
      output += `Note: No exact matches found; showing the closest available recommendations based on your request.\n`;
    }
    
    return output;
  }

  /**
   * Get a wine from the cache
   */
  private async getFromCache(cacheKey: string): Promise<EnrichedWine | null> {
    if (!this.cacheEnabled) return null;
    
    try {
      if (!fs.existsSync(this.cacheFile)) {
        return null;
      }
      
      const cacheData = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8')) as Record<string, EnrichedWine>;
      return cacheData[cacheKey] || null;
    } catch (error) {
      console.error('Error reading from sommelier cache:', error);
      return null;
    }
  }

  /**
   * Save a wine to the cache
   * @private
   */
  /**
   * Get all wines from the database
   * For testing purposes, this returns the wines from the cache
   */
  async getAllWines(): Promise<any[]> {
    try {
      // Read the cache file (contains all previously processed wines)
      if (fs.existsSync(this.cacheFile)) {
        // Improved robust cache reading with larger file support
        try {
          const cacheData = fs.readFileSync(this.cacheFile, 'utf8');
          const parsedCache = JSON.parse(cacheData);
          
          // Extract all wines from the cache
          const wines = Object.values(parsedCache);
          console.log(`Retrieved ${wines.length} wines from cache`);
          
          if (wines.length === 0) {
            console.warn("Wine cache file exists but contains no wines. This may indicate a parsing issue.");
          }
          
          return wines;
        } catch (parseError) {
          console.error('Error parsing wine cache file:', parseError);
          
          // For large JSON files, try a streaming approach with a simplified object
          console.log("Attempting to read large cache file with streaming...");
          
          // Use a more direct approach for large files
          try {
            const fileStats = fs.statSync(this.cacheFile);
            console.log(`Cache file size: ${fileStats.size} bytes`);
            
            // Attempt direct reading of large files
            const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB limit
            
            if (fileStats.size > MAX_FILE_SIZE) {
              console.warn(`Wine cache file is very large (${Math.round(fileStats.size/1024/1024)}MB). Using chunked processing.`);
              
              // Read the file in chunks if needed
              const fileData = fs.readFileSync(this.cacheFile, {encoding: 'utf8'});
              
              try {
                const parsedData = JSON.parse(fileData);
                const wines = Object.values(parsedData);
                console.log(`Successfully processed large cache with ${wines.length} wines`);
                return wines;
              } catch (largeParseError) {
                console.error('Error parsing large wine cache:', largeParseError);
                return [];
              }
            } else {
              // For smaller files, try the standard approach again with error details
              try {
                const rawData = fs.readFileSync(this.cacheFile, 'utf8');
                const parsedData = JSON.parse(rawData);
                const wines = Object.values(parsedData);
                console.log(`Retrieved ${wines.length} wines from cache (second attempt)`);
                return wines;
              } catch (finalError) {
                console.error('Final attempt to parse cache failed:', finalError);
                return [];
              }
            }
          } catch (statError) {
            console.error('Error checking cache file stats:', statError);
            return [];
          }
        }
      }
      
      // If no cache file exists, return an empty array
      console.log("No wine cache file found. Returning empty array.");
      return [];
    } catch (error) {
      console.error('Error retrieving all wines:', error);
      return []; // Return empty array in case of error
    }
  }
  
  private async saveToCache(cacheKey: string, wine: EnrichedWine): Promise<void> {
    if (!this.cacheEnabled) return;
    
    // Use a safer approach for writing to the cache file with retries
    const maxRetries = 3;
    let attempt = 0;
    let success = false;
    
    while (attempt < maxRetries && !success) {
      try {
        let cacheData: Record<string, EnrichedWine> = {};
        
        // Read existing cache with retry mechanism
        if (fs.existsSync(this.cacheFile)) {
          try {
            const fileContent = fs.readFileSync(this.cacheFile, 'utf8');
            if (fileContent.trim()) {
              cacheData = JSON.parse(fileContent) as Record<string, EnrichedWine>;
            }
          } catch (readError) {
            console.error(`Error reading cache file (attempt ${attempt + 1}):`, readError);
            
            // If it's a parsing error, we'll create a backup of the corrupted file
            // and start with a fresh cache to prevent data loss
            if (readError instanceof SyntaxError) {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const backupPath = `${this.cacheFile}.corrupted.${timestamp}`;
              fs.copyFileSync(this.cacheFile, backupPath);
              console.log(`Created backup of corrupted cache file at ${backupPath}`);
            }
          }
        }
        
        // Add the new wine to the cache
        cacheData[cacheKey] = wine;
        
        // Create a temp file and then rename to avoid partial writes
        const tempCacheFile = `${this.cacheFile}.temp`;
        fs.writeFileSync(tempCacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
        
        // In Windows, we need to unlink the destination file first
        if (fs.existsSync(this.cacheFile)) {
          fs.unlinkSync(this.cacheFile);
        }
        
        fs.renameSync(tempCacheFile, this.cacheFile);
        console.log(`Wine cached: ${cacheKey}`);
        success = true;
      } catch (error) {
        attempt++;
        console.error(`Error writing to sommelier cache (attempt ${attempt}):`, error);
        
        // Wait before retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    if (!success) {
      console.error(`Failed to cache wine ${cacheKey} after ${maxRetries} attempts`);
    }
  }
  
  /**
   * Save a basic wine directly to the cache without full enrichment
   * This is used for bulk uploads to ensure all wines are saved
   * @param wine Basic wine information
   * @param cacheKey The key to use for storing in cache
   */
  async saveWineToCache(wine: BasicWineInfo, cacheKey: string): Promise<void> {
    try {
      // Convert the basic wine info to an enriched format
      const enrichedWine: EnrichedWine = {
        name: {
          value: wine.name,
          confidence: 95,
          source: { type: 'tech_sheet' as any, confidence: 95 },
          estimated: false
        },
        vintage: {
          value: wine.vintage || "Unknown",
          confidence: wine.vintage ? 90 : 10,
          source: { type: wine.vintage ? 'tech_sheet' as any : 'regional_estimate' as any, confidence: wine.vintage ? 90 : 10 },
          estimated: !wine.vintage
        },
        producer: {
          value: wine.producer || "Unknown Producer",
          confidence: wine.producer ? 90 : 10,
          source: { type: wine.producer ? 'tech_sheet' as any : 'regional_estimate' as any, confidence: wine.producer ? 90 : 10 },
          estimated: !wine.producer
        },
        region: {
          value: wine.region || "Unknown Region",
          confidence: wine.region ? 90 : 10,
          source: { type: wine.region ? 'tech_sheet' as any : 'regional_estimate' as any, confidence: wine.region ? 90 : 10 },
          estimated: !wine.region
        },
        country: {
          value: wine.country || "Unknown Country",
          confidence: wine.country ? 90 : 10,
          source: { type: wine.country ? 'tech_sheet' as any : 'regional_estimate' as any, confidence: wine.country ? 90 : 10 },
          estimated: !wine.country
        },
        varietals: {
          value: wine.varietals || ["Unknown"],
          confidence: wine.varietals ? 90 : 10,
          source: { type: wine.varietals ? 'tech_sheet' as any : 'regional_estimate' as any, confidence: wine.varietals ? 90 : 10 },
          estimated: !wine.varietals
        },
        restaurant_price: {
          value: wine.restaurant_price || "Unknown",
          confidence: wine.restaurant_price ? 95 : 10,
          source: { type: wine.restaurant_price ? 'tech_sheet' as any : 'regional_estimate' as any, confidence: wine.restaurant_price ? 95 : 10 },
          estimated: !wine.restaurant_price
        },
        body: {
          value: "medium",
          confidence: 50,
          source: { type: 'regional_estimate' as any, confidence: 50 },
          estimated: true
        },
        acidity: {
          value: "medium",
          confidence: 50,
          source: { type: 'regional_estimate' as any, confidence: 50 },
          estimated: true
        },
        alcohol_percent: {
          value: "13.5%",
          confidence: 50,
          source: { type: 'regional_estimate' as any, confidence: 50 },
          estimated: true
        },
        flavors_raw: {
          value: [],
          confidence: 40,
          source: { type: 'regional_estimate' as any, confidence: 40 },
          estimated: true
        },
        flavors_normalized: {
          value: [],
          confidence: 40,
          source: { type: 'regional_estimate' as any, confidence: 40 },
          estimated: true
        },
        aromas: {
          value: [],
          confidence: 40,
          source: { type: 'regional_estimate' as any, confidence: 40 },
          estimated: true
        },
        style_summary: {
          value: "Wine extracted from bulk import. Details pending full analysis.",
          confidence: 40,
          source: { type: 'regional_estimate' as any, confidence: 40 },
          estimated: true
        },
        food_pairings: {
          value: [],
          confidence: 40,
          source: { type: 'regional_estimate' as any, confidence: 40 },
          estimated: true
        }
      };
      
      // Save to cache
      await this.saveToCache(cacheKey, enrichedWine);
      console.log(`Basic wine data cached for ${wine.name}`);
    } catch (error) {
      console.error(`Error saving wine ${wine.name} to cache:`, error);
      throw new Error(`Failed to save wine to cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Enable or disable caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    console.log(`Sommelier wine caching ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Check if the OpenAI API key is configured
   */
  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
}

// Create a singleton instance
export const sommelierService = new SommelierService();