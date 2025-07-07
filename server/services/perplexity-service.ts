/**
 * Perplexity AI API service for restaurant awards discovery
 */

import { Award } from '../../client/src/api/restaurant-awards';

const API_BASE_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Checks if the Perplexity API service is configured with a valid key
 * 
 * @returns Promise with availability status and message
 */
export async function checkPerplexityApiAvailability(): Promise<{
  available: boolean;
  message: string;
}> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    return {
      available: false,
      message: 'Perplexity API key is not configured'
    };
  }
  
  return {
    available: true,
    message: 'Perplexity API service is configured and available'
  };
}

/**
 * Fetches restaurant awards using the Perplexity API
 * 
 * @param restaurantName The name of the restaurant to search for awards
 * @param location Optional restaurant location for more accurate results
 * @returns Array of award objects
 */
export async function getRestaurantAwards(
  restaurantName: string,
  location?: string
): Promise<Award[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.log('Perplexity API key not configured, cannot fetch restaurant awards');
    return [];
  }
  
  try {
    const locationStr = location ? ` in ${location}` : '';
    const userPrompt = `Find awards, accolades, and recognition received by the restaurant "${restaurantName}"${locationStr}. 
    Only include verified awards from reputable sources like Michelin, James Beard Foundation, local restaurant awards, 
    food critics associations, etc. Format as a list of specific awards with the award name, organization that granted it, 
    year received, and category if applicable. Do not include any general reputation information, only specific awards.`;
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a culinary researcher specializing in restaurant awards and recognition. Provide accurate, verified information about restaurant awards and accolades. Return data in a clean, structured format. If you cannot find verified award information for a restaurant, clearly state this rather than making up awards."
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1000,
        search_domain_filter: ["dining", "restaurants", "culinary", "food"],
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "year",
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      })
    });

    if (!response.ok) {
      console.error(`Perplexity API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Process the response to extract awards
    return parseAwardsFromResponse(content);
    
  } catch (error) {
    console.error('Error fetching restaurant awards:', error);
    return [];
  }
}

/**
 * Parses awards data from Perplexity API response text
 * 
 * @param responseText The text response from Perplexity API
 * @returns Structured array of award objects
 */
function parseAwardsFromResponse(responseText: string): Award[] {
  // Check if the response indicates no awards found
  if (
    responseText.toLowerCase().includes('no awards found') ||
    responseText.toLowerCase().includes('could not find any awards') ||
    responseText.toLowerCase().includes('no verified awards') ||
    responseText.toLowerCase().includes('unable to find') ||
    responseText.toLowerCase().includes('no record of') ||
    responseText.toLowerCase().includes('no specific awards')
  ) {
    return [];
  }
  
  try {
    const awards: Award[] = [];
    
    // Split the response into lines to process each award
    const lines = responseText.split('\n').filter(line => line.trim().length > 0);
    
    let currentAward: Partial<Award> | null = null;
    
    for (const line of lines) {
      // Look for patterns indicating award entries
      const trimmedLine = line.trim();
      
      // Skip header lines or non-award content
      if (
        trimmedLine.startsWith('#') || 
        trimmedLine.toLowerCase().includes('awards for') ||
        trimmedLine.toLowerCase().includes('awards and recognition') ||
        trimmedLine.toLowerCase() === 'awards:' ||
        trimmedLine.toLowerCase() === 'accolades:' ||
        trimmedLine.toLowerCase() === 'recognition:'
      ) {
        continue;
      }
      
      // Check if this is a new award entry (often starts with number, bullet, or year)
      const isNewAward = /^(\d+\.\s|\-\s|\*\s|\d{4}:)/.test(trimmedLine) || 
                         /^[A-Z].*Award/.test(trimmedLine) ||
                         /^[A-Z].*Star/.test(trimmedLine);
      
      if (isNewAward || currentAward === null) {
        // Save previous award if exists
        if (currentAward && currentAward.name && currentAward.organization && currentAward.year) {
          awards.push(currentAward as Award);
        }
        
        // Start a new award
        currentAward = {};
        
        // Parse award details from the line
        const awardInfo = trimmedLine
          .replace(/^\d+\.\s|\-\s|\*\s/, '') // Remove list markers
          .trim();
        
        // Extract year if present in the line
        const yearMatch = awardInfo.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          currentAward.year = yearMatch[0];
        }
        
        // Try to extract award name and organization
        if (awardInfo.includes(' from ') || awardInfo.includes(' by ')) {
          const parts = awardInfo.split(/ from | by /);
          currentAward.name = parts[0].trim();
          const orgParts = parts[1].split(',');
          currentAward.organization = orgParts[0].trim();
        } else if (awardInfo.includes(':')) {
          const parts = awardInfo.split(':');
          currentAward.name = parts[0].trim();
          currentAward.organization = parts[1].trim();
        } else {
          // Simple case where we just have a name
          currentAward.name = awardInfo;
        }
        
        // Check for category information
        if (awardInfo.includes('category') || awardInfo.includes('Category')) {
          const categoryMatch = awardInfo.match(/category:?\s*"([^"]+)"|category:?\s*([^,]+)/i);
          if (categoryMatch) {
            currentAward.category = (categoryMatch[1] || categoryMatch[2]).trim();
          }
        }
      } else if (currentAward) {
        // This is additional information for the current award
        if (!currentAward.year && /\b(19|20)\d{2}\b/.test(trimmedLine)) {
          const yearMatch = trimmedLine.match(/\b(19|20)\d{2}\b/);
          if (yearMatch) {
            currentAward.year = yearMatch[0];
          }
        }
        
        if (!currentAward.organization && (
            trimmedLine.includes('awarded by') || 
            trimmedLine.includes('given by') ||
            trimmedLine.includes('from the')
        )) {
          const orgMatch = trimmedLine.match(/(awarded by|given by|from the)\s+([^,\.]+)/i);
          if (orgMatch) {
            currentAward.organization = orgMatch[2].trim();
          }
        }
        
        // Add as description if we have the main details already
        if (currentAward.name && currentAward.organization && !currentAward.description) {
          currentAward.description = trimmedLine;
        }
      }
    }
    
    // Add the last award if it exists
    if (currentAward && currentAward.name && currentAward.organization && currentAward.year) {
      awards.push(currentAward as Award);
    }
    
    return awards;
  } catch (error) {
    console.error('Error parsing awards from response:', error);
    return [];
  }
}