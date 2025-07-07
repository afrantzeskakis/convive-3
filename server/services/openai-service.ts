import OpenAI from 'openai';
import { aiCacheService } from './ai-cache-service';

/**
 * A service wrapper for OpenAI API calls with built-in rate limiting handling and caching
 */
export class OpenAIService {
  private client: OpenAI;
  private rateLimitDelay: number = 1000; // Start with 1 second delay
  private maxRetries: number = 3;
  private useFallback: boolean = false;
  private useCache: boolean = true;

  constructor() {
    // Configure the OpenAI client with the dedicated recipe analysis key if available,
    // falling back to the general key
    this.client = new OpenAI({
      apiKey: process.env.RECIPE_ANALYSIS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID, // Optional organization ID
      maxRetries: 0, // We'll handle retries ourselves
      defaultHeaders: {
        'OpenAI-Beta': 'assistants=v1' // Use latest API features
      }
    });

    // Check if keys are available
    if (!process.env.RECIPE_ANALYSIS_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
      this.useFallback = true;
      console.warn('OpenAI API keys are not configured. Using fallback parsing methods.');
    } else {
      console.log('OpenAI service initialized. Using dedicated recipe key: ' + 
        (process.env.RECIPE_ANALYSIS_OPENAI_API_KEY ? 'Yes' : 'No'));
    }
  }

  /**
   * Send a chat completion request to OpenAI with automatic retry on rate limits and caching
   */
  async createChatCompletion(messages: any[], model: string = 'gpt-3.5-turbo', options: any = {}) {
    if (this.useFallback) {
      throw new Error('OpenAI API is not configured. Use fallback methods instead.');
    }
    
    // Check cache first if enabled
    if (this.useCache) {
      const cachedResponse = await aiCacheService.getCachedResponse(model, messages);
      if (cachedResponse) {
        console.log(`[OpenAI] Using cached response for model: ${model}`);
        return cachedResponse;
      }
    }

    let attempt = 0;
    let delay = this.rateLimitDelay;

    while (attempt < this.maxRetries) {
      try {
        console.log(`[OpenAI] Making API request to model: ${model} (attempt ${attempt + 1}/${this.maxRetries})`);
        
        // Try to make the API call
        const result = await this.client.chat.completions.create({
          model,
          messages,
          ...options
        });
        
        // If successful, reset the rate limit delay to default
        this.rateLimitDelay = 1000;
        
        // Cache the successful response if caching is enabled
        if (this.useCache) {
          await aiCacheService.cacheResponse(model, messages, result);
        }
        
        return result;
      } catch (error: any) {
        attempt++;
        
        // Handle rate limit errors
        if (error.status === 429) {
          console.warn(`[OpenAI] Rate limit hit (attempt ${attempt}/${this.maxRetries}). Waiting ${delay}ms before retry.`);
          
          // If we have retries left, wait and try again
          if (attempt < this.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            this.rateLimitDelay = delay; // Save for future requests
          } else {
            console.error('[OpenAI] Rate limit retry attempts exceeded. Using fallback method.');
            throw error;
          }
        } else {
          // For other errors, just throw
          console.error('[OpenAI] API error:', error.message);
          throw error;
        }
      }
    }

    throw new Error('Maximum retry attempts exceeded');
  }

  /**
   * Try multiple models in sequence, starting with the most powerful
   * and falling back to more reliable/lower-cost models
   */
  async createChatCompletionWithModelFallback(messages: any[], options: any = {}) {
    // Check cache for any model - we'll accept cached results from any model
    if (this.useCache) {
      // Try to find responses in cache from any model, starting with the most powerful
      const models = ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'];
      
      for (const model of models) {
        const cachedResponse = await aiCacheService.getCachedResponse(model, messages);
        if (cachedResponse) {
          console.log(`[OpenAI] Using cached response from model: ${model}`);
          return cachedResponse;
        }
      }
    }
  
    // If no cached response, try API calls with model fallback
    const modelsToTry = [
      'gpt-4o',      // First try the most powerful model (if rate limit allows)
      'gpt-4',       // Then try standard GPT-4
      'gpt-3.5-turbo' // Finally, fallback to the most reliable option
    ];

    for (const model of modelsToTry) {
      try {
        console.log(`[OpenAI] Trying model: ${model}`);
        return await this.createChatCompletion(messages, model, options);
      } catch (error: any) {
        if (error.status === 429 && model !== modelsToTry[modelsToTry.length - 1]) {
          // If rate limited and we have models left to try, continue to next model
          console.warn(`[OpenAI] Rate limit hit on model ${model}, trying next model...`);
          continue;
        }
        throw error; // Other errors or if we're out of models
      }
    }

    throw new Error('All OpenAI models failed');
  }

  /**
   * Enable or disable the caching system
   */
  setCacheEnabled(enabled: boolean): void {
    this.useCache = enabled;
    console.log(`[OpenAI] Response caching ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Generate text using OpenAI for general purposes
   */
  async generateText(prompt: string, model: string = 'gpt-4o'): Promise<string> {
    const messages = [
      { role: 'user', content: prompt }
    ];

    const response = await this.createChatCompletion(messages, model);
    return response.choices?.[0]?.message?.content || '';
  }

  /**
   * Analyze recipe content and extract structured information
   */
  async analyzeRecipe(recipeText: string): Promise<string> {
    const prompt = `Analyze this recipe and extract structured information. Return a JSON object with:
    - title: recipe name
    - ingredients: array of ingredient objects with name, quantity, unit
    - instructions: array of step-by-step instructions
    - servings: number of servings
    - cookTime: estimated cooking time
    - difficulty: beginner/intermediate/advanced

    Recipe text: ${recipeText}

    Return only valid JSON.`;

    return await this.generateText(prompt, 'gpt-4o');
  }

  /**
   * Enhance wine description with professional tasting notes and characteristics
   */
  async enhanceWineDescription(description: string, wineName: string): Promise<string | null> {
    if (this.useFallback) {
      return null;
    }

    const prompt = `As a professional sommelier, enhance this wine description with detailed tasting notes and characteristics:

Wine: ${wineName}
Original Description: ${description}

Provide a comprehensive enhancement that includes:
- Detailed tasting notes (aroma, flavor, texture)
- Food pairing suggestions
- Serving recommendations
- Professional sommelier insights

Keep the enhancement informative yet accessible. Return only the enhanced description text.`;

    try {
      return await this.generateText(prompt, 'gpt-4o');
    } catch (error) {
      console.error('Error enhancing wine description:', error);
      return null;
    }
  }

  /**
   * Check if the OpenAI service is properly configured
   */
  isConfigured(): boolean {
    return !this.useFallback;
  }
}

// Create a singleton instance
export const openaiService = new OpenAIService();

/**
 * Function to check if OpenAI API is properly configured
 */
export function isOpenAIConfigured(): boolean {
  return openaiService.isConfigured();
}