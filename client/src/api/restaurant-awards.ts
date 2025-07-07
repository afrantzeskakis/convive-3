/**
 * API client for restaurant awards service
 */

export interface Award {
  name: string;
  organization: string;
  year: string;
  category?: string;
  description?: string;
}

export interface AwardsResponse {
  restaurantId: number;
  restaurantName: string;
  awards: Award[];
  apiConfigured: boolean;
}

/**
 * Checks if the awards service is available (Perplexity API is configured)
 * 
 * @returns Promise with service availability status
 */
export async function checkAwardsServiceAvailability(): Promise<{
  available: boolean;
  message: string;
}> {
  try {
    const response = await fetch('/api/awards/status');
    
    if (!response.ok) {
      return {
        available: false,
        message: 'Error checking awards service status'
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking awards service availability:', error);
    return {
      available: false,
      message: 'Failed to check awards service status'
    };
  }
}

/**
 * Fetches awards for a specific restaurant
 * 
 * @param restaurantId ID of the restaurant
 * @returns Promise with restaurant awards data
 */
export async function getRestaurantAwards(restaurantId: number): Promise<AwardsResponse> {
  try {
    const response = await fetch(`/api/awards/restaurant/${restaurantId}`);
    
    if (response.status === 202) {
      // API is not configured but the request was accepted
      const data = await response.json();
      return {
        restaurantId,
        restaurantName: '',
        awards: [],
        apiConfigured: false
      };
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch awards: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching awards for restaurant ${restaurantId}:`, error);
    
    // Return a default response with empty awards
    return {
      restaurantId,
      restaurantName: '',
      awards: [],
      apiConfigured: false
    };
  }
}