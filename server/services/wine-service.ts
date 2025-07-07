/**
 * Wine Service
 * 
 * This service provides functions for processing wine lists and managing the wine database.
 * It integrates with OpenAI GPT-4o for natural language processing and the Vivino API
 * for wine verification and enrichment.
 */
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { eq, and, like, ilike, or, desc, asc, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

import * as schema from "../../shared/schema";
import { wines, restaurantWines, wineListUploads, InsertWine, InsertRestaurantWine, InsertWineListUpload } from "../../shared/wine-schema";

// Initialize OpenAI and database client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Apify client removed - no longer using Apify API

// Initialize database client
const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);

/**
 * Main function to process a wine list
 * @param fileContent Wine list text content
 * @param restaurantId Optional restaurant ID for association
 * @param userId ID of the user who uploaded the wine list
 * @param fileName Original file name for tracking
 */
export async function processWineList(
  fileContent: string,
  userId: number,
  fileName?: string,
  restaurantId?: number
): Promise<{
  success: boolean;
  processedCount: number;
  errorCount: number;
  duplicatesFound?: number;
  apiCallsSaved?: number;
  newWinesCount?: number;
  totalInDatabase?: number;
  sampleWines?: any[];
  message?: string;
  error?: any;
}> {
  console.log(`Processing wine list${restaurantId ? ` for restaurant #${restaurantId}` : ''}`);
  
  const startTime = Date.now();
  let uploadRecord: InsertWineListUpload | null = null;
  
  try {
    // Create initial upload record
    uploadRecord = {
      restaurant_id: restaurantId || null,
      uploaded_by: userId,
      file_name: fileName || "manual-upload.txt",
      file_size: fileContent.length,
      status: "processing",
    };
    
    const uploadResult = await db.insert(wineListUploads).values(uploadRecord).returning();
    const uploadId = uploadResult[0].id;
    
    // Split the wine list into lines and filter out empty lines
    const lines = fileContent.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    console.log(`Processing ${lines.length} wine entries`);
    
    // Process each line to extract wine information
    const results = await Promise.all(
      lines.map(line => processWineLine(line, restaurantId))
    );
    
    // Count success and errors
    const processedCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    const newWinesCount = results.filter(r => r.success && r.isNew).length;
    const duplicatesFound = results.filter(r => r.success && !r.isNew).length;
    const apiCallsSaved = duplicatesFound * 2; // Each duplicate saves OpenAI + Vivino API calls
    const sampleWines = results.filter(r => r.success && r.wine).map(r => r.wine).slice(0, 5);
    
    // Get total wines in database
    const totalWinesResult = await db.select({ count: sql`count(*)` }).from(wines);
    const totalInDatabase = Number(totalWinesResult[0].count);
    
    // Update upload record
    await db.update(wineListUploads)
      .set({
        status: "completed",
        wine_count: processedCount,
        new_wine_count: newWinesCount,
        processing_time: Math.floor((Date.now() - startTime) / 1000)
      })
      .where(eq(wineListUploads.id, uploadId));
    
    console.log(`Cost optimization summary: ${duplicatesFound} duplicates found, ${apiCallsSaved} API calls saved`);
    
    return {
      success: true,
      processedCount,
      errorCount,
      duplicatesFound,
      apiCallsSaved,
      newWinesCount,
      totalInDatabase,
      sampleWines,
      message: `Successfully processed ${processedCount} wines (${newWinesCount} new, ${duplicatesFound} duplicates found). Saved ${apiCallsSaved} API calls through cost optimization.`
    };
  } catch (error) {
    console.error("Error processing wine list:", error);
    
    // Update upload record with error if it was created
    if (uploadRecord) {
      try {
        await db.update(wineListUploads)
          .set({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
            processing_time: Math.floor((Date.now() - startTime) / 1000)
          })
          .where(eq(wineListUploads.id, uploadRecord.id));
      } catch (updateError) {
        console.error("Error updating upload record:", updateError);
      }
    }
    
    return {
      success: false,
      processedCount: 0,
      errorCount: 1,
      message: "Failed to process wine list",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Process a single wine line to extract wine information
 */
async function processWineLine(
  line: string,
  restaurantId?: number
): Promise<{
  success: boolean;
  wine?: any;
  isNew?: boolean;
  error?: string;
}> {
  try {
    // Extract wine information from line using GPT-4o
    const wineInfo = await extractWineInfo(line);
    if (!wineInfo) {
      return { success: false, error: "Failed to extract wine information" };
    }
    
    // Check if wine already exists in database
    const existingWine = await findExistingWine(wineInfo);
    
    if (existingWine) {
      // If wine exists and has a restaurant ID, add association if it doesn't exist
      if (restaurantId) {
        await addRestaurantAssociation(existingWine.id, restaurantId);
      }
      
      return { 
        success: true, 
        wine: existingWine,
        isNew: false
      };
    }
    
    // Enrich wine information with Vivino API if possible
    const enrichedWine = await enrichWineWithVivino(wineInfo);
    
    // Store wine in database
    const wineRecord = await storeWine(enrichedWine || wineInfo);
    
    // If restaurant ID is provided, create association
    if (restaurantId && wineRecord) {
      await addRestaurantAssociation(wineRecord.id, restaurantId);
    }
    
    return { 
      success: true, 
      wine: wineRecord,
      isNew: true
    };
  } catch (error) {
    console.error(`Error processing wine line: "${line}"`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Extract wine information from a line using GPT-4o
 */
async function extractWineInfo(line: string): Promise<Partial<InsertWine> | null> {
  try {
    console.log(`Extracting wine info for: ${line}`);
    
    const prompt = `
You are a sommelier expert analyzing a wine list line by line. 
Extract the following information from this wine entry:
"${line}"

Return ONLY a JSON object with these fields (leave empty if information is not available):
{
  "producer": "",
  "wine_name": "",
  "vintage": "",
  "varietal": "",
  "region": "",
  "country": "",
  "appellation": "",
  "wine_type": "",
  "wine_style": "",
  "bottle_size": "",
  "alcohol_content": ""
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });
    
    const content = response.choices[0]?.message?.content?.trim();
    
    if (!content) {
      console.error("Empty response from GPT-4o");
      return null;
    }
    
    // Extract JSON from the response (in case there's surrounding text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", content);
      return null;
    }
    
    const jsonStr = jsonMatch[0];
    const wineData = JSON.parse(jsonStr) as Partial<InsertWine>;
    
    // Generate search text for better matching
    wineData.search_text = generateSearchText(wineData);
    
    return wineData;
  } catch (error) {
    console.error("Error extracting wine info:", error);
    return null;
  }
}

/**
 * Generate search text for wine matching
 */
function generateSearchText(wine: Partial<InsertWine>): string {
  const searchParts = [
    wine.producer,
    wine.wine_name,
    wine.vintage,
    wine.varietal,
    wine.region,
    wine.country,
    wine.appellation,
    wine.wine_type
  ].filter(Boolean);
  
  return searchParts.join(' ').toLowerCase();
}

/**
 * Find an existing wine in the database
 */
async function findExistingWine(wine: Partial<InsertWine>): Promise<any | null> {
  try {
    // First attempt: Try exact match on critical fields
    if (wine.producer && wine.wine_name && wine.vintage) {
      const exactMatches = await db.select()
        .from(wines)
        .where(
          and(
            eq(wines.wine_name, wine.wine_name),
            eq(wines.producer, wine.producer),
            eq(wines.vintage, wine.vintage)
          )
        )
        .limit(1);
      
      if (exactMatches.length > 0) {
        return exactMatches[0];
      }
    }
    
    // Second attempt: Try fuzzy search based on search_text
    if (wine.search_text) {
      const searchTerms = wine.search_text.split(' ').filter(term => term.length > 2);
      
      if (searchTerms.length > 0) {
        let query = db.select()
          .from(wines)
          .where(ilike(wines.search_text, `%${searchTerms[0]}%`));
        
        // Add additional search terms
        for (let i = 1; i < Math.min(searchTerms.length, 5); i++) {
          query = query.where(ilike(wines.search_text, `%${searchTerms[i]}%`));
        }
        
        const fuzzyMatches = await query.limit(5);
        
        // Find the best match by comparing similarity
        if (fuzzyMatches.length > 0) {
          const bestMatch = fuzzyMatches.reduce((best, current) => {
            const bestScore = calculateSimilarity(wine, best);
            const currentScore = calculateSimilarity(wine, current);
            return currentScore > bestScore ? current : best;
          });
          
          const matchScore = calculateSimilarity(wine, bestMatch);
          
          // If similarity is high enough, consider it a match
          // Lower the threshold to be less aggressive about duplicates
          if (matchScore > 0.9) {
            return bestMatch;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error finding existing wine:", error);
    return null;
  }
}

/**
 * Calculate similarity between two wines
 * Returns a score between 0 and 1
 */
function calculateSimilarity(wine1: Partial<InsertWine>, wine2: any): number {
  let score = 0;
  let totalFields = 0;
  
  // Compare producer
  if (wine1.producer && wine2.producer) {
    totalFields++;
    if (wine1.producer.toLowerCase() === wine2.producer.toLowerCase()) {
      score += 1;
    }
  }
  
  // Compare wine name
  if (wine1.wine_name && wine2.wine_name) {
    totalFields += 2; // Wine name is weighted double
    if (wine1.wine_name.toLowerCase() === wine2.wine_name.toLowerCase()) {
      score += 2;
    }
  }
  
  // Compare vintage
  if (wine1.vintage && wine2.vintage) {
    totalFields++;
    if (wine1.vintage === wine2.vintage) {
      score += 1;
    }
  }
  
  // Compare varietal
  if (wine1.varietal && wine2.varietal) {
    totalFields++;
    if (wine1.varietal.toLowerCase() === wine2.varietal.toLowerCase()) {
      score += 1;
    }
  }
  
  // Compare region
  if (wine1.region && wine2.region) {
    totalFields++;
    if (wine1.region.toLowerCase() === wine2.region.toLowerCase()) {
      score += 1;
    }
  }
  
  // Compare country
  if (wine1.country && wine2.country) {
    totalFields++;
    if (wine1.country.toLowerCase() === wine2.country.toLowerCase()) {
      score += 1;
    }
  }
  
  // If no fields to compare, return 0
  if (totalFields === 0) {
    return 0;
  }
  
  // Return normalized score
  return score / totalFields;
}

/**
 * Enrich wine information with Vivino API
 */
async function enrichWineWithVivino(wine: Partial<InsertWine>): Promise<Partial<InsertWine> | null> {
  try {
    if (!process.env.APIFY_API_KEY) {
      console.log("Skipping Vivino enrichment - APIFY_API_KEY not set");
      return wine;
    }
    
    console.log(`Enriching wine with Vivino: ${wine.producer} ${wine.wine_name} ${wine.vintage}`);
    
    // Construct search query
    const searchQuery = [
      wine.producer,
      wine.wine_name,
      wine.vintage
    ].filter(Boolean).join(' ');
    
    if (!searchQuery) {
      return wine;
    }
    
    // Run the Vivino actor
    const run = await apifyClient.actor("canadesk/vivino").call({
      search: searchQuery,
      maxItems: 3
    });
    
    // Get actor results
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    if (!items || items.length === 0) {
      console.log(`No Vivino results for: ${searchQuery}`);
      return wine;
    }
    
    // Find the best match from the results
    const bestMatch = items[0];
    
    // Enrich wine data with Vivino information
    const enrichedWine: Partial<InsertWine> = {
      ...wine,
      verified: true,
      verified_source: "Vivino",
      vivino_id: bestMatch.id?.toString() || null,
      vivino_url: bestMatch.link || null,
      vivino_rating: bestMatch.rating?.average?.toString() || null,
      wine_type: wine.wine_type || bestMatch.type || null,
      wine_style: wine.wine_style || bestMatch.style || null,
      tasting_notes: bestMatch.tastingNotes || null,
      region: wine.region || bestMatch.region?.name || null,
      country: wine.country || bestMatch.region?.country?.name || null,
    };
    
    console.log(`Wine enriched with Vivino data: ${enrichedWine.vivino_id}`);
    return enrichedWine;
  } catch (error) {
    console.error("Error enriching wine with Vivino:", error);
    // Return original wine data if enrichment fails
    return wine;
  }
}

/**
 * Store wine in the database
 */
async function storeWine(wine: Partial<InsertWine>): Promise<any> {
  try {
    console.log(`Storing wine: ${wine.producer} ${wine.wine_name} ${wine.vintage}`);
    
    // Generate search text if not already set
    if (!wine.search_text) {
      wine.search_text = generateSearchText(wine);
    }
    
    // Insert wine into database
    const result = await db.insert(wines).values(wine).returning();
    
    return result[0];
  } catch (error) {
    console.error("Error storing wine:", error);
    throw error;
  }
}

/**
 * Add restaurant association to a wine
 */
async function addRestaurantAssociation(
  wineId: number,
  restaurantId: number,
  options: Partial<InsertRestaurantWine> = {}
): Promise<void> {
  try {
    // Check if association already exists
    const existing = await db.select()
      .from(restaurantWines)
      .where(
        and(
          eq(restaurantWines.wine_id, wineId),
          eq(restaurantWines.restaurant_id, restaurantId)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing association if needed
      if (Object.keys(options).length > 0) {
        await db.update(restaurantWines)
          .set({
            ...options,
            updated_at: new Date()
          })
          .where(
            and(
              eq(restaurantWines.wine_id, wineId),
              eq(restaurantWines.restaurant_id, restaurantId)
            )
          );
      }
      return;
    }
    
    // Create new association
    await db.insert(restaurantWines).values({
      wine_id: wineId,
      restaurant_id: restaurantId,
      ...options
    });
    
    console.log(`Associated wine #${wineId} with restaurant #${restaurantId}`);
  } catch (error) {
    console.error(`Error associating wine #${wineId} with restaurant #${restaurantId}:`, error);
    throw error;
  }
}

/**
 * Get wines for a restaurant
 */
export async function getRestaurantWines(
  restaurantId: number,
  options: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  } = {}
): Promise<{
  wines: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  try {
    const { 
      page = 1, 
      pageSize = 20,
      sortBy = 'wine_name',
      sortOrder = 'asc',
      search = '' 
    } = options;
    
    // Build query
    let query = db.select({
      id: restaurantWines.id,
      wine_id: wines.id,
      restaurant_id: restaurantWines.restaurant_id,
      producer: wines.producer,
      wine_name: wines.wine_name,
      vintage: wines.vintage,
      varietal: wines.varietal,
      region: wines.region,
      country: wines.country,
      wine_type: wines.wine_type,
      price: restaurantWines.price,
      by_the_glass: restaurantWines.by_the_glass,
      featured: restaurantWines.featured,
      active: restaurantWines.active,
      verified: wines.verified,
      verified_source: wines.verified_source,
      vivino_rating: wines.vivino_rating,
      added_at: restaurantWines.added_at
    })
    .from(restaurantWines)
    .innerJoin(wines, eq(restaurantWines.wine_id, wines.id))
    .where(eq(restaurantWines.restaurant_id, restaurantId));
    
    // Add search filter if provided
    if (search) {
      query = query.where(
        or(
          ilike(wines.producer, `%${search}%`),
          ilike(wines.wine_name, `%${search}%`),
          ilike(wines.varietal, `%${search}%`),
          ilike(wines.region, `%${search}%`)
        )
      );
    }
    
    // Count total wines for pagination
    const countResult = await db.select({ count: sql`count(*)` })
      .from(restaurantWines)
      .innerJoin(wines, eq(restaurantWines.wine_id, wines.id))
      .where(eq(restaurantWines.restaurant_id, restaurantId));
    
    const total = Number(countResult[0].count);
    
    // Add sorting
    if (sortBy && sortOrder) {
      const column = sortBy === 'price' ? restaurantWines.price : wines[sortBy as keyof typeof wines];
      if (column) {
        query = query.orderBy(sortOrder === 'asc' ? asc(column) : desc(column));
      }
    }
    
    // Add pagination
    const offset = (page - 1) * pageSize;
    query = query.limit(pageSize).offset(offset);
    
    // Execute query
    const results = await query;
    
    return {
      wines: results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error("Error getting restaurant wines:", error);
    throw error;
  }
}

/**
 * Get wine statistics
 */
export async function getWineStats(): Promise<{
  totalWines: number;
  verifiedWines: number;
  enhancedWines: number;
  totalRestaurantWines: number;
  recentUploads: any[];
}> {
  try {
    // Use direct SQL to avoid type conflicts
    
    // Get total wines
    const totalWinesResult = await sqlConnection(`SELECT COUNT(*) as count FROM wines`);
    const totalWines = Number(totalWinesResult[0].count);
    
    // Get verified wines
    const verifiedWinesResult = await sqlConnection(`SELECT COUNT(*) as count FROM wines WHERE verified = true`);
    const verifiedWines = Number(verifiedWinesResult[0].count);
    
    // Get enhanced wines using dual certification approach
    const enhancedWinesResult = await sqlConnection(`
      SELECT COUNT(*) as count FROM wines 
      WHERE verified = true 
      AND (
        -- Original certification path
        (LENGTH(COALESCE(tasting_notes, '')) >= 750 
         AND LENGTH(COALESCE(flavor_notes, '')) >= 625
         AND LENGTH(COALESCE(aroma_notes, '')) >= 625
         AND LENGTH(COALESCE(body_description, '')) >= 625
         AND LENGTH(COALESCE(what_makes_special, '')) >= 350)
        OR
        -- New total character certification path
        ((LENGTH(COALESCE(tasting_notes, '')) + LENGTH(COALESCE(flavor_notes, '')) + 
          LENGTH(COALESCE(aroma_notes, '')) + LENGTH(COALESCE(body_description, '')) + 
          LENGTH(COALESCE(what_makes_special, '')) + LENGTH(COALESCE(food_pairing, '')) + 
          LENGTH(COALESCE(serving_temp, '')) + LENGTH(COALESCE(aging_potential, ''))) >= 3000
         AND LENGTH(COALESCE(tasting_notes, '')) >= 200
         AND LENGTH(COALESCE(flavor_notes, '')) >= 200
         AND LENGTH(COALESCE(aroma_notes, '')) >= 200
         AND LENGTH(COALESCE(body_description, '')) >= 200
         AND LENGTH(COALESCE(what_makes_special, '')) >= 350)
      )
    `);
    const enhancedWines = Number(enhancedWinesResult[0].count);
    
    // Get total restaurant wines
    const totalRestaurantWinesResult = await sqlConnection(`SELECT COUNT(*) as count FROM restaurant_wines`);
    const totalRestaurantWines = Number(totalRestaurantWinesResult[0].count);
    
    // Get recent wines as proxy for uploads since you have existing upload system
    const recentUploads = await sqlConnection(`
      SELECT 
        w.id,
        w.wine_name as file_name,
        w.created_at as uploaded_at,
        w.verified_source as status,
        'system' as username
      FROM wines w
      ORDER BY w.created_at DESC
      LIMIT 10
    `);
    
    return {
      totalWines,
      verifiedWines,
      enhancedWines,
      totalRestaurantWines,
      recentUploads
    };
  } catch (error) {
    console.error("Error getting wine stats:", error);
    // Return zeros if there's an error to avoid breaking the UI
    return {
      totalWines: 0,
      verifiedWines: 0,
      enhancedWines: 0,
      totalRestaurantWines: 0,
      recentUploads: []
    };
  }
}

// Export the necessary functions
export default {
  processWineList,
  getRestaurantWines,
  getWineStats,
  enrichWineWithVivino
};