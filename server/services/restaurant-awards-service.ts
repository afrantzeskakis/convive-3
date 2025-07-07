import { db } from "../db";
import { restaurants } from "@shared/schema";
import { eq } from "drizzle-orm";
import fetch from "node-fetch";
import { z } from "zod";

// Helper function for sleep (delay)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Cache configuration for award lookups to avoid making too many requests
// Note: In a production setting, you would use a proper KV store (Redis, etc.)
// This is a simplified in-memory cache for demo purposes
const lookupCache = new Map<string, AwardSearchResult>();

// Perplexity API key - get from env variable
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// Type for award data
interface Award {
  name: string;          // Award name
  organization: string;  // Awarding organization
  year: string;          // Year awarded
  category?: string;     // Optional award category
  description?: string;  // Optional description of the award
}

interface AwardSearchResult {
  awards: Award[];
  retrievedAt: Date;
  source: string;
}

/**
 * Async service that looks up awards for a restaurant via Perplexity API
 * Stores results in a cache to avoid redundant lookups
 */
export async function findRestaurantAwards(restaurantName: string, city: string): Promise<Award[]> {
  // First check cache
  const cacheKey = `${restaurantName.toLowerCase()}-${city.toLowerCase()}`;
  const cachedResult = lookupCache.get(cacheKey);

  // Return cached results if they exist and are less than 30 days old
  if (cachedResult) {
    const cacheAge = new Date().getTime() - cachedResult.retrievedAt.getTime();
    const cacheMaxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    if (cacheAge < cacheMaxAge) {
      console.log(`Returning cached awards for ${restaurantName} in ${city}`);
      return cachedResult.awards;
    }
  }

  // If no valid cache, proceed with API lookup
  try {
    if (!PERPLEXITY_API_KEY) {
      console.error("PERPLEXITY_API_KEY not set in environment variables");
      return [];
    }

    // Create a prompt for the Perplexity API
    const query = `
      Find a list of awards and recognitions that "${restaurantName}" restaurant in ${city} has received.
      Only include official awards from recognized organizations like Michelin, James Beard, 
      local "Best of" awards, Wine Spectator, etc. 
      
      Format your response as a JSON array with objects having these properties:
      - name: Award name
      - organization: Organization giving the award
      - year: Year of the award
      - category: Category of the award (optional)
      - description: Brief description of the significance (optional)
      
      Return ONLY the JSON array without any additional text, explanations, or markdown.
      If no awards can be found, return an empty array [].
    `;

    // Make the API call to Perplexity
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant focused on finding factual information about restaurant awards and accolades. Return only JSON data without any additional text."
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.1, // Low temperature for more factual responses
        search_recency_filter: "year" // Search for results from the last year
      })
    });

    if (!response.ok) {
      console.error(`Error from Perplexity API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(errorText);
      return [];
    }

    const data = await response.json();
    
    // Parse the response content as JSON
    const content = data.choices[0].message.content.trim();
    
    let awards: Award[] = [];
    
    try {
      // Handle potential formatting issues in the response
      const cleanedContent = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      // Validate the response with Zod
      const AwardSchema = z.object({
        name: z.string(),
        organization: z.string(),
        year: z.string(),
        category: z.string().optional(),
        description: z.string().optional()
      });
      
      const AwardArraySchema = z.array(AwardSchema);
      
      awards = AwardArraySchema.parse(JSON.parse(cleanedContent));
      
      // Save to cache
      lookupCache.set(cacheKey, {
        awards,
        retrievedAt: new Date(),
        source: "perplexity"
      });
      
      return awards;
    } catch (e) {
      console.error("Error parsing awards data:", e);
      console.error("Raw content:", content);
      return [];
    }
  } catch (error) {
    console.error("Error fetching restaurant awards:", error);
    return [];
  }
}

/**
 * Updates a restaurant's awards in the database
 */
export async function updateRestaurantAwards(restaurantId: number): Promise<boolean> {
  try {
    // First get the restaurant details
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId));
    
    if (!restaurant) {
      console.error(`Restaurant with ID ${restaurantId} not found`);
      return false;
    }
    
    // Extract city from address (assuming format like "123 Main St, New York, NY 10001")
    const addressParts = restaurant.address.split(',');
    let city = "Unknown";
    
    if (addressParts.length >= 2) {
      city = addressParts[1].trim();
    }
    
    // Look up awards
    const awards = await findRestaurantAwards(restaurant.name, city);
    
    // Update the restaurant record
    await db
      .update(restaurants)
      .set({
        awards: awards.length > 0 ? awards : null
      })
      .where(eq(restaurants.id, restaurantId));
    
    return true;
  } catch (error) {
    console.error("Error updating restaurant awards:", error);
    return false;
  }
}

/**
 * Batch processes all restaurants to update their awards
 * Can be run as a scheduled job (e.g., monthly)
 */
export async function updateAllRestaurantAwards(options: { 
  batchSize?: number,
  delayBetweenRequests?: number 
} = {}): Promise<{ success: number, failed: number }> {
  const batchSize = options.batchSize || 5;
  const delayMs = options.delayBetweenRequests || 1000;
  
  let success = 0;
  let failed = 0;
  
  try {
    // Get all restaurants
    const allRestaurants = await db.select().from(restaurants);
    
    // Process in batches
    for (let i = 0; i < allRestaurants.length; i += batchSize) {
      const batch = allRestaurants.slice(i, i + batchSize);
      
      // Process each restaurant in the batch
      const promises = batch.map(async (restaurant) => {
        const result = await updateRestaurantAwards(restaurant.id);
        if (result) {
          success++;
        } else {
          failed++;
        }
      });
      
      // Wait for batch to complete
      await Promise.all(promises);
      
      // Delay before next batch to avoid rate limiting
      if (i + batchSize < allRestaurants.length) {
        await sleep(delayMs);
      }
    }
    
    return { success, failed };
  } catch (error) {
    console.error("Error in batch update of restaurant awards:", error);
    return { success, failed };
  }
}

/**
 * Hook function to be called when a new restaurant is added
 */
export async function onRestaurantCreated(restaurantId: number): Promise<void> {
  try {
    // Automatically look up and update awards for new restaurant
    await updateRestaurantAwards(restaurantId);
  } catch (error) {
    console.error(`Error processing awards for new restaurant ${restaurantId}:`, error);
  }
}