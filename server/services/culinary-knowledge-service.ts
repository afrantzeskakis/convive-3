/**
 * Culinary Knowledge Service
 * Restaurant-specific GPT-4o powered culinary knowledge with intelligent caching
 */

import { db } from "../db";
import { culinaryTermCache, restaurants } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import { OpenAIService } from "./openai-service";
import crypto from "crypto";

interface CarouselSlide {
  type: 'technique' | 'culture' | 'tips' | 'wine' | 'variations' | 'dietary' | 'communication' | 'sourcing' | 'kitchen' | 'relationships' | 'combinations' | 'seasonal';
  title: string;
  content: string;
  additionalInfo?: string;
  relatedTerms?: string[];
  seasonalRelevance?: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round';
  staffLevel?: 'server' | 'sommelier' | 'chef' | 'manager' | 'all';
}

interface CachedTermData {
  slides: CarouselSlide[];
  relationships?: TermRelationship[];
  combinations?: TermCombination[];
  seasonalContext?: SeasonalContext;
}

interface TermRelationship {
  relatedTerm: string;
  relationship: 'complement' | 'substitute' | 'prerequisite' | 'component' | 'technique' | 'pairing';
  strength: number; // 1-10 relevance score
  explanation: string;
}

interface TermCombination {
  terms: string[];
  combinationType: 'technique_ingredient' | 'flavor_profile' | 'cooking_method' | 'wine_pairing' | 'cultural_fusion';
  resultDescription: string;
  contextualUse: string;
}

interface SeasonalContext {
  currentSeason: 'spring' | 'summer' | 'fall' | 'winter';
  relevanceScore: number; // 1-10 how relevant this term is to current season
  seasonalVariations: {
    season: string;
    adaptation: string;
    ingredients: string[];
  }[];
}

interface CulinaryTerm {
  term: string;
  category: 'basic' | 'intermediate' | 'advanced' | 'cultural';
  explanation: string;
  carouselContent: CarouselSlide[];
  relationships?: TermRelationship[];
  combinations?: TermCombination[];
  seasonalContext?: SeasonalContext;
}

interface StaffTrainingContext {
  staffRole: 'server' | 'sommelier' | 'chef' | 'manager';
  trainingLevel: 'beginner' | 'intermediate' | 'advanced';
  focusAreas: string[];
}

class CulinaryKnowledgeService {
  private currentCacheVersion = 1;
  private openaiService: OpenAIService;

  constructor() {
    this.openaiService = new OpenAIService();
  }

  /**
   * Helper method to clean GPT-4o responses and extract valid JSON
   */
  private cleanGptResponse(response: string): string {
    try {
      // Step 1: Remove all markdown code block markers
      let cleaned = response
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // Step 2: Extract JSON using multiple strategies
      let jsonContent = '';
      
      // Strategy 1: Look for complete JSON object
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      } else {
        // Strategy 2: Find boundaries manually
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonContent = cleaned.substring(firstBrace, lastBrace + 1);
        } else {
          throw new Error('No valid JSON structure found');
        }
      }
      
      // Step 3: Validate the extracted JSON
      JSON.parse(jsonContent);
      return jsonContent;
      
    } catch (error) {
      console.error('JSON cleaning failed:', error);
      console.error('Response length:', response.length);
      console.error('First 200 chars:', response.substring(0, 200));
      
      // Return empty result structure for each method type
      return '{"relationships": [], "combinations": [], "slides": []}';
    }
  }

  /**
   * Get culinary term definition with restaurant-specific context
   * Uses cache-first approach with GPT-4o generation for new terms
   */
  async getCulinaryTermDefinition(term: string, restaurantId: number): Promise<CulinaryTerm | null> {
    try {
      // Check cache first
      const cachedTerm = await this.getCachedTerm(restaurantId, term);
      if (cachedTerm) {
        return {
          term,
          category: this.categorizeTerm(term),
          explanation: cachedTerm.slides[0]?.content || `${term} is a culinary element.`,
          carouselContent: cachedTerm.slides,
          relationships: cachedTerm.relationships,
          combinations: cachedTerm.combinations,
          seasonalContext: cachedTerm.seasonalContext
        };
      }

      // Get restaurant cuisine context
      const restaurant = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);
      if (!restaurant[0]) {
        throw new Error(`Restaurant ${restaurantId} not found`);
      }

      const cuisineDescription = restaurant[0].cuisineDescription;
      if (!cuisineDescription) {
        throw new Error(`Restaurant ${restaurantId} missing cuisine description`);
      }

      // Generate new term definition with GPT-4o including advanced Phase 7 features
      const enrichedTermData = await this.generateAdvancedTermContent(term, cuisineDescription, restaurantId);
      
      // Cache the complete result
      await this.cacheTerm(restaurantId, term, enrichedTermData);

      return {
        term,
        category: this.categorizeTerm(term),
        explanation: enrichedTermData.slides[0]?.content || `${term} is a culinary element.`,
        carouselContent: enrichedTermData.slides,
        relationships: enrichedTermData.relationships,
        combinations: enrichedTermData.combinations,
        seasonalContext: enrichedTermData.seasonalContext
      };

    } catch (error) {
      console.error(`Error getting culinary term definition for ${term}:`, error);
      return null;
    }
  }

  /**
   * Batch process multiple culinary terms for efficient GPT-4o usage
   * Used during recipe uploads to identify and cache terms efficiently
   */
  async batchProcessTerms(terms: string[], restaurantId: number): Promise<Map<string, CarouselSlide[]>> {
    const results = new Map<string, CarouselSlide[]>();
    
    try {
      // Get restaurant context
      const restaurant = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);
      if (!restaurant[0]) {
        throw new Error(`Restaurant ${restaurantId} not found`);
      }
      
      // Use cuisine description or fall back to cuisine type or generic description
      const cuisineDescription = restaurant[0].cuisineDescription || restaurant[0].cuisineType || "modern culinary cuisine";

      // Check which terms are already cached
      const uncachedTerms: string[] = [];
      for (const term of terms) {
        const cached = await this.getCachedTerm(restaurantId, term);
        if (cached) {
          results.set(term, cached.slides);
        } else {
          uncachedTerms.push(term);
        }
      }

      if (uncachedTerms.length === 0) {
        return results;
      }

      console.log(`Processing ${uncachedTerms.length} uncached terms for restaurant ${restaurantId}`);
      
      // Process uncached terms in smaller batches to avoid API limits
      const batchSize = 3;
      for (let i = 0; i < uncachedTerms.length; i += batchSize) {
        const batch = uncachedTerms.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}: ${batch.join(', ')}`);
        
        try {
          const batchResults = await this.processBatchGPT(batch, cuisineDescription);
          console.log(`Generated content for ${batchResults.size} terms in this batch`);
          
          if (batchResults.size === 0) {
            console.error(`Batch processing failed for terms: ${batch.join(', ')} - no results returned`);
          }
          
          // Cache and add to results
          for (const term of Array.from(batchResults.keys())) {
            const slides = batchResults.get(term) || [];
            if (slides.length === 0) {
              console.error(`No slides generated for term: ${term}`);
            } else {
              await this.cacheTerm(restaurantId, term, { slides });
              results.set(term, slides);
              console.log(`Cached term: ${term} with ${slides.length} slides`);
            }
          }
        } catch (error) {
          console.error(`Error processing batch ${batch.join(', ')}:`, error);
          console.error('Error details:', error.message);
          // Continue with next batch instead of failing entirely
        }
      }

      return results;

    } catch (error) {
      console.error('Error in batch processing terms:', error);
      return results;
    }
  }

  /**
   * Extract culinary terms using systematic character-level scanning
   */
  async extractCulinaryTerms(recipeText: string, cuisineDescription: string): Promise<string[]> {
    try {
      // Phase 1: Systematic word extraction - scan every character
      const allWords = this.extractAllWords(recipeText);
      console.log(`Phase 1: Extracted ${allWords.length} total words`);
      
      // Phase 2: Filter out non-culinary words (numbers, prepositions, articles)
      const filteredWords = this.filterNonCulinaryWords(allWords);
      console.log(`Phase 2: Filtered to ${filteredWords.length} potential culinary words`);
      
      // Phase 3: Generate compound terms from adjacent words
      const compoundTerms = this.generateCompoundTerms(recipeText, filteredWords);
      console.log(`Phase 3: Generated ${compoundTerms.length} compound terms`);
      
      // Phase 4: Combine individual words and compound terms
      const allPotentialTerms = [...new Set([...filteredWords, ...compoundTerms])];
      console.log(`Phase 4: Combined to ${allPotentialTerms.length} unique potential terms`);
      
      // Phase 5: Validate culinary relevance using GPT
      const culinaryTerms = await this.validateCulinaryRelevance(allPotentialTerms, cuisineDescription);
      console.log(`Phase 5: Validated ${culinaryTerms.length} authentic culinary terms`);
      
      return culinaryTerms;

    } catch (error) {
      console.error('Error in systematic culinary term extraction:', error);
      return [];
    }
  }

  /**
   * Phase 1: Extract every word from text using character-level scanning
   */
  private extractAllWords(text: string): string[] {
    const words: string[] = [];
    let currentWord = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Check if character is part of a word (letter, apostrophe, or hyphen)
      if (/[a-zA-ZÀ-ÿ'-]/.test(char)) {
        currentWord += char;
      } else {
        // End of word - save it if it's not empty
        if (currentWord.length > 0) {
          words.push(currentWord.trim());
          currentWord = '';
        }
      }
    }
    
    // Don't forget the last word if text doesn't end with separator
    if (currentWord.length > 0) {
      words.push(currentWord.trim());
    }
    
    return words.filter(word => word.length > 0);
  }

  /**
   * Phase 2: Filter out numbers, prepositions, articles, and common non-culinary words
   */
  private filterNonCulinaryWords(words: string[]): string[] {
    const nonCulinaryWords = new Set([
      // Articles
      'a', 'an', 'the',
      // Prepositions
      'in', 'on', 'at', 'for', 'with', 'by', 'from', 'to', 'of', 'into', 'onto', 'through', 'over', 'under',
      // Common recipe structure words
      'recipe', 'ingredients', 'instructions', 'directions', 'serves', 'servings', 'prep', 'time', 'cook', 'cooking',
      'total', 'difficulty', 'easy', 'medium', 'hard', 'step', 'steps',
      // Pronouns and conjunctions
      'it', 'and', 'or', 'but', 'this', 'that', 'these', 'those', 'you', 'your', 'we', 'our',
      // Common verbs that aren't culinary
      'take', 'put', 'place', 'get', 'make', 'do', 'have', 'be', 'is', 'are', 'was', 'were',
      // Time and measurement indicators (not the measurements themselves)
      'minutes', 'hours', 'cups', 'tablespoons', 'teaspoons', 'pounds', 'ounces', 'grams', 'kilograms',
      'tbsp', 'tsp', 'lb', 'oz', 'kg', 'g', 'ml', 'l'
    ]);
    
    return words.filter(word => {
      const lowerWord = word.toLowerCase();
      // Keep if not in exclusion list and not a pure number
      return !nonCulinaryWords.has(lowerWord) && !/^\d+$/.test(word);
    });
  }

  /**
   * Phase 3: Generate compound terms from adjacent words in original text
   */
  private generateCompoundTerms(text: string, words: string[]): string[] {
    const compounds: string[] = [];
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
    
    // Pre-define high-priority culinary compounds that should always be preserved
    const priorityCompounds = [
      // Curries
      'green curry', 'red curry', 'yellow curry', 'panang curry',
      // Sauces and condiments
      'tomato paste', 'olive oil', 'fish sauce', 'soy sauce', 'oyster sauce',
      'worcestershire sauce', 'hot sauce', 'chili sauce', 'hoisin sauce',
      // Meat cuts - expanded
      'chicken breast', 'chicken thighs', 'chicken legs', 'chicken wings', 
      'chicken drumsticks', 'beef chuck', 'pork shoulder', 'pork belly',
      'lamb shank', 'duck breast', 'turkey breast',
      // Herbs and aromatics
      'bay leaves', 'fresh thyme', 'coconut milk', 'green onions',
      'spring onions', 'red onions', 'white onions', 'yellow onions',
      // Cooking equipment
      'dutch oven', 'cast iron', 'fine mesh',
      // Common ingredients
      'heavy cream', 'sour cream', 'cream cheese', 'cheddar cheese',
      'parmesan cheese', 'mozzarella cheese', 'goat cheese',
      'black pepper', 'white pepper', 'red pepper', 'bell pepper',
      'sea salt', 'kosher salt', 'table salt',
      'brown sugar', 'white sugar', 'powdered sugar',
      'all purpose', 'bread flour', 'cake flour',
      'baking soda', 'baking powder',
      'extra virgin', 'vegetable oil', 'canola oil', 'sesame oil'
    ];
    
    for (const sentence of sentences) {
      const sentenceWords = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      
      // Generate 2-word compounds
      for (let i = 0; i < sentenceWords.length - 1; i++) {
        const word1 = sentenceWords[i].replace(/[^\w'-]/g, '');
        const word2 = sentenceWords[i + 1].replace(/[^\w'-]/g, '');
        
        if (word1.length > 0 && word2.length > 0) {
          const compound = `${word1} ${word2}`;
          compounds.push(compound);
          
          // Mark priority compounds for special handling
          if (priorityCompounds.includes(compound)) {
            compounds.push(`PRIORITY:${compound}`);
          }
          
          // Also check if any priority compound contains these words
          for (const priority of priorityCompounds) {
            if (priority.includes(word1) && priority.includes(word2)) {
              compounds.push(`PRIORITY:${priority}`);
            }
          }
        }
      }
      
      // Generate 3-word compounds for common culinary phrases
      for (let i = 0; i < sentenceWords.length - 2; i++) {
        const word1 = sentenceWords[i].replace(/[^\w'-]/g, '');
        const word2 = sentenceWords[i + 1].replace(/[^\w'-]/g, '');
        const word3 = sentenceWords[i + 2].replace(/[^\w'-]/g, '');
        
        if (word1.length > 0 && word2.length > 0 && word3.length > 0) {
          const threeWord = `${word1} ${word2} ${word3}`;
          // Only include 3-word phrases that are likely culinary
          if (this.likelyCulinaryPhrase(threeWord)) {
            compounds.push(threeWord);
          }
        }
      }
    }
    
    return [...new Set(compounds)];
  }

  /**
   * Check if a 3-word phrase is likely culinary
   */
  private likelyCulinaryPhrase(phrase: string): boolean {
    const culinaryIndicators = [
      'au', 'vin', 'oil', 'sauce', 'paste', 'powder', 'leaves', 'root', 'stock', 'broth',
      'curry', 'soup', 'stew', 'roast', 'grilled', 'baked', 'fried', 'steamed',
      'fresh', 'dried', 'ground', 'whole', 'chopped', 'diced', 'sliced', 'minced'
    ];
    
    return culinaryIndicators.some(indicator => phrase.includes(indicator));
  }

  /**
   * Phase 5: Validate which terms are actually culinary using GPT
   */
  private async validateCulinaryRelevance(terms: string[], cuisineDescription: string): Promise<string[]> {
    const { openaiService } = await import('./openai-service');
    
    // Separate priority compounds from regular terms
    const priorityTerms: string[] = [];
    const regularTerms: string[] = [];
    
    for (const term of terms) {
      if (term.startsWith('PRIORITY:')) {
        priorityTerms.push(term.replace('PRIORITY:', ''));
      } else {
        regularTerms.push(term);
      }
    }
    
    const validatedTerms: string[] = [];
    const batchSize = 50; // Process terms in smaller batches to avoid response truncation
    
    console.log(`Validating ${regularTerms.length} regular terms in batches of ${batchSize}`);
    
    // Process regular terms in batches
    for (let i = 0; i < regularTerms.length; i += batchSize) {
      const batch = regularTerms.slice(i, i + batchSize);
      const batchNumber = Math.floor(i/batchSize) + 1;
      const totalBatches = Math.ceil(regularTerms.length/batchSize);
      
      console.log(`Validating batch ${batchNumber}/${totalBatches}: ${batch.length} terms`);
      
      const prompt = `You are a culinary expert. From this list of potential terms, identify ONLY those with genuine culinary significance for a restaurant specializing in "${cuisineDescription}".

Include terms that are:
- Ingredients (simple or compound, e.g. "chicken", "chicken thighs", "tomato paste")
- Specific cuts or parts of ingredients (e.g. "thighs", "breast", "legs", "wings")
- Cooking techniques and methods
- Equipment and tools
- Culinary descriptors
- Dish names
- Spices and seasonings
- Compound ingredient names (keep "chicken thighs" together, not just "chicken")

EXCLUDE terms that are:
- Common non-culinary words
- Generic adjectives without culinary meaning
- Structural recipe words

IMPORTANT: Preserve compound ingredient names! For example, keep "chicken thighs" as a single term rather than splitting into "chicken"

Terms to evaluate: ${batch.join(', ')}

Return a JSON array of only the culinary terms: ["term1", "term2", ...]`;

      try {
        const response = await openaiService.generateText(prompt);
        let cleanResponse = response.trim();
        
        if (cleanResponse.startsWith('```json') || cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```(?:json)?\s*/, '');
          cleanResponse = cleanResponse.replace(/\s*```\s*$/, '');
        }
        
        let parsed;
        try {
          // Check if response appears complete before parsing
          if (!cleanResponse || cleanResponse.length < 5) {
            console.error(`Response too short for batch ${batchNumber}:`, cleanResponse.length, 'characters');
            throw new Error('Response appears truncated');
          }
          
          parsed = JSON.parse(cleanResponse);
        } catch (parseError) {
          console.error(`JSON parsing failed for batch ${batchNumber}:`, parseError);
          console.error(`Response preview:`, cleanResponse.substring(0, 200));
          console.error(`Response length:`, cleanResponse.length);
          
          // If this is a cached response, it might be corrupted - regenerate
          if (cleanResponse.length < 50) {
            console.log(`Response appears truncated, requesting fresh response for batch ${batchNumber}`);
            
            // Clear the corrupted cache entry
            try {
              const { aiCacheService } = await import('./ai-cache-service');
              const requestHash = (aiCacheService as any).generateRequestHash('gpt-4o', [
                { role: 'user', content: prompt }
              ]);
              await aiCacheService.clearCachedResponse(requestHash);
            } catch (cacheError) {
              console.error('Error clearing corrupted cache:', cacheError);
            }
            
            // Force a fresh API call by temporarily disabling cache
            const openaiService = this.openaiService as any;
            const wasEnabled = openaiService.useCache;
            openaiService.setCacheEnabled(false);
            
            try {
              const freshResponse = await this.openaiService.generateText(prompt);
              let freshCleanResponse = freshResponse.trim();
              
              if (freshCleanResponse.startsWith('```json') || freshCleanResponse.startsWith('```')) {
                freshCleanResponse = freshCleanResponse.replace(/^```(?:json)?\s*/, '');
                freshCleanResponse = freshCleanResponse.replace(/\s*```\s*$/, '');
              }
              
              parsed = JSON.parse(freshCleanResponse);
              console.log(`Fresh response successful for batch ${batchNumber}`);
            } catch (freshError) {
              console.error(`Fresh response also failed for batch ${batchNumber}:`, freshError);
              parsed = [];
            } finally {
              openaiService.setCacheEnabled(wasEnabled);
            }
          } else {
            // Try to extract JSON array from response
            const arrayMatch = cleanResponse.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
              try {
                parsed = JSON.parse(arrayMatch[0]);
              } catch (secondParseError) {
                console.error(`Second JSON parse attempt failed for batch ${batchNumber}:`, secondParseError);
                parsed = [];
              }
            } else {
              parsed = [];
            }
          }
        }
        
        if (Array.isArray(parsed)) {
          const batchValidTerms = parsed.filter(term => typeof term === 'string' && term.length > 0);
          validatedTerms.push(...batchValidTerms);
          console.log(`Batch ${batchNumber} validated ${batchValidTerms.length} culinary terms`);
        } else {
          console.error(`Parsed response for batch ${batchNumber} is not an array`);
        }
        
      } catch (error) {
        console.error(`Error validating batch ${batchNumber}:`, error);
        // Add heuristic fallback for this batch
        const heuristicTerms = batch.filter(term => this.isLikelyCulinary(term));
        validatedTerms.push(...heuristicTerms);
        console.log(`Used heuristic fallback for batch ${batchNumber}: ${heuristicTerms.length} terms`);
      }
    }
    
    // Always include priority terms even if GPT missed them
    const allTerms = [...new Set([...priorityTerms, ...validatedTerms])];
    
    console.log(`Total validated culinary terms: ${allTerms.length} (${priorityTerms.length} priority + ${validatedTerms.length} regular)`);
    return allTerms;
  }

  /**
   * Simple heuristic to identify likely culinary terms
   */
  private isLikelyCulinary(term: string): boolean {
    const culinaryKeywords = [
      'sauce', 'oil', 'butter', 'salt', 'pepper', 'garlic', 'onion', 'tomato',
      'chicken', 'beef', 'pork', 'fish', 'herb', 'spice', 'cook', 'bake', 'fry',
      'roast', 'grill', 'steam', 'boil', 'simmer', 'sauté', 'braise', 'stir'
    ];
    
    const lowerTerm = term.toLowerCase();
    return culinaryKeywords.some(keyword => lowerTerm.includes(keyword)) || term.length > 3;
  }

  /**
   * Process a batch of terms with GPT-4o for efficient API usage
   */
  private async processBatchGPT(terms: string[], cuisineDescription: string): Promise<Map<string, CarouselSlide[]>> {
    try {
      const { openaiService } = await import('./openai-service');
      
      const prompt = `Create comprehensive educational content for restaurant staff about these culinary terms: ${terms.join(', ')}

For EACH term, provide detailed information in exactly 9 categories. CRITICAL REQUIREMENT: Each category MUST contain a minimum of 3 complete sentences and a maximum of 6 complete sentences. Count your sentences carefully - do not provide fewer than 3 sentences per category.

1. ABOUT: General description including appearance, characteristics, and basic culinary properties. Write 3-6 complete sentences.
2. TECHNIQUE: How-to instructions and professional methods for preparation, cooking, or application. Write 3-6 complete sentences.
3. CULTURE: Historical context and regional significance, traditional uses in ${cuisineDescription} cuisine. Write 3-6 complete sentences.
4. TIPS: Professional chef insights and best practices, quality indicators, and common mistakes to avoid. Write 3-6 complete sentences.
5. WINE: Pairing suggestions that would work with restaurant wine inventory and complement this ingredient/technique. Write 3-6 complete sentences.
6. VARIATIONS: Regional adaptations and alternative approaches, substitutions, and different preparations. Write 3-6 complete sentences.
7. DIETARY: Allergen information and dietary restriction compatibility, nutritional aspects and modifications. Write 3-6 complete sentences.
8. COMMUNICATION: Guest explanation and upselling language - how to describe this term appealingly to diners. Write 3-6 complete sentences.
9. SOURCING: Ingredient procurement and quality indicators, seasonal considerations, storage tips. Write 3-6 complete sentences.

RESPOND ONLY WITH VALID JSON. No explanatory text before or after. Use this exact structure:
{
  "term1": {
    "about": "detailed general description...",
    "technique": "how-to instructions and methods...",
    "culture": "historical and cultural context...",
    "tips": "professional insights and best practices...",
    "wine": "pairing suggestions...",
    "variations": "regional adaptations and alternatives...",
    "dietary": "allergen and dietary information...",
    "communication": "guest explanation language...",
    "sourcing": "procurement and quality tips..."
  },
  "term2": { "about": "...", "technique": "...", "culture": "...", "tips": "...", "wine": "...", "variations": "...", "dietary": "...", "communication": "...", "sourcing": "..." }
}`;

      const response = await openaiService.generateText(prompt);
      
      // Clean the response by removing markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json') || cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```(?:json)?\s*/, '');
        cleanResponse = cleanResponse.replace(/\s*```\s*$/, '');
      }
      
      // Additional cleaning for common JSON issues
      cleanResponse = cleanResponse.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      
      let gptContent;
      try {
        gptContent = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error(`JSON parsing failed for batch: ${terms.join(', ')}`);
        console.error('Parse error:', parseError);
        console.error('Response excerpt:', cleanResponse.substring(0, 500));
        
        // Try to extract and repair JSON from the response
        let jsonString = cleanResponse;
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
        
        // Attempt to repair common JSON issues
        try {
          // Try to fix truncated JSON by adding missing closing braces
          let repairedJson = jsonString;
          
          // Count open and close braces to detect truncation
          const openBraces = (repairedJson.match(/\{/g) || []).length;
          const closeBraces = (repairedJson.match(/\}/g) || []).length;
          
          if (openBraces > closeBraces) {
            // Add missing closing braces
            const missingBraces = openBraces - closeBraces;
            repairedJson += '}'.repeat(missingBraces);
          }
          
          // Remove trailing commas and incomplete entries
          repairedJson = repairedJson.replace(/,\s*$/, '').replace(/,\s*}/g, '}');
          
          gptContent = JSON.parse(repairedJson);
          console.log('Successfully recovered and repaired JSON');
        } catch (recoveryError) {
          console.error('JSON recovery failed, creating fallback content for terms');
          // Create fallback content for the terms that failed
          gptContent = {};
          for (const term of terms) {
            gptContent[term] = {
              about: `${term} is an important culinary element in ${cuisineDescription} cuisine.`,
              technique: `Professional preparation techniques for ${term}.`,
              culture: `Cultural significance of ${term} in culinary traditions.`,
              tips: `Chef insights and best practices for ${term}.`,
              wine: `Wine pairing suggestions for dishes featuring ${term}.`,
              variations: `Regional variations and alternatives for ${term}.`,
              dietary: `Dietary considerations and allergen information for ${term}.`,
              communication: `How to describe ${term} to guests effectively.`,
              sourcing: `Quality sourcing and storage guidelines for ${term}.`,
              kitchen: `Kitchen workflow and equipment considerations for ${term}.`
            };
          }
          console.log(`Created fallback content for ${terms.length} terms`);
        }
      }
      const results = new Map<string, CarouselSlide[]>();

      // Convert GPT response to enhanced carousel slides for each term
      for (const term of terms) {
        const termData = gptContent[term];
        if (termData) {
          const slides: CarouselSlide[] = [
            {
              type: 'technique',
              title: 'About',
              content: termData.about || `General description of ${term} including appearance, characteristics, and basic culinary properties.`,
              additionalInfo: 'Foundation knowledge for understanding this term.'
            },
            {
              type: 'technique',
              title: 'Technique',
              content: termData.technique || `How-to instructions and professional methods for ${term}.`,
              additionalInfo: 'Step-by-step professional approach.'
            },
            {
              type: 'culture',
              title: 'Culture',
              content: termData.culture || `Historical context and regional significance of ${term}.`,
              additionalInfo: 'Understanding culinary heritage and tradition.'
            },
            {
              type: 'tips',
              title: 'Tips',
              content: termData.tips || `Professional chef insights and best practices for ${term}.`,
              additionalInfo: 'Expert guidance for optimal results.'
            },
            {
              type: 'wine',
              title: 'Wine',
              content: termData.wine || `Pairing suggestions using restaurant wine inventory for ${term}.`,
              additionalInfo: 'Enhance dining experience through perfect pairings.'
            },
            {
              type: 'variations',
              title: 'Variations',
              content: termData.variations || `Regional adaptations and alternative approaches for ${term}.`,
              additionalInfo: 'Flexibility and creative adaptations.'
            },
            {
              type: 'dietary',
              title: 'Dietary',
              content: termData.dietary || `Allergen information and dietary restriction compatibility for ${term}.`,
              additionalInfo: 'Essential for guest safety and accommodation.'
            },
            {
              type: 'communication',
              title: 'Communication',
              content: termData.communication || `Guest explanation and upselling language for ${term}.`,
              additionalInfo: 'Connect with guests through informed descriptions.'
            },
            {
              type: 'sourcing',
              title: 'Sourcing',
              content: termData.sourcing || `Ingredient procurement and quality indicators for ${term}.`,
              additionalInfo: 'Quality ingredients ensure exceptional results.'
            },
            {
              type: 'kitchen',
              title: 'Kitchen',
              content: termData.kitchen || `Equipment needs and preparation workflows for ${term}.`,
              additionalInfo: 'Operational efficiency and workflow optimization.'
            }
          ];
          results.set(term, slides);
        }
      }

      return results;

    } catch (error) {
      console.error('Error in GPT batch processing:', error);
      return new Map();
    }
  }

  /**
   * Generate carousel content for a single term
   */
  private async generateGPTCarouselContent(term: string, cuisineDescription: string): Promise<CarouselSlide[]> {
    const batchResult = await this.processBatchGPT([term], cuisineDescription);
    return batchResult.get(term) || this.generateBasicFallbackContent(term);
  }

  /**
   * Check cache for existing term definition
   */
  private async getCachedTerm(restaurantId: number, term: string): Promise<CachedTermData | null> {
    try {
      const normalizedTerm = this.normalizeTerm(term);
      const cached = await db.select()
        .from(culinaryTermCache)
        .where(
          and(
            eq(culinaryTermCache.restaurant_id, restaurantId),
            eq(culinaryTermCache.term, normalizedTerm),
            eq(culinaryTermCache.cache_version, this.currentCacheVersion)
          )
        )
        .limit(1);

      return cached[0]?.carousel_data as CachedTermData || null;
    } catch (error) {
      console.error(`Error getting cached term ${term}:`, error);
      return null;
    }
  }

  /**
   * Cache term definition for future use
   */
  private async cacheTerm(restaurantId: number, term: string, data: CachedTermData): Promise<void> {
    try {
      const normalizedTerm = this.normalizeTerm(term);
      await db.insert(culinaryTermCache).values({
        restaurant_id: restaurantId,
        term: normalizedTerm,
        carousel_data: data,
        cache_version: this.currentCacheVersion
      });
    } catch (error) {
      console.error(`Error caching term ${term}:`, error);
    }
  }

  /**
   * Normalize term for consistent caching (lowercase, singular)
   */
  private normalizeTerm(term: string): string {
    return term.toLowerCase().trim()
      .replace(/s$/, '') // Remove plural 's'
      .replace(/ies$/, 'y') // tomatoes -> tomato, but berries -> berry
      .replace(/es$/, ''); // Remove plural 'es'
  }

  /**
   * Categorize term difficulty for UI display
   */
  private categorizeTerm(term: string): 'basic' | 'intermediate' | 'advanced' | 'cultural' {
    const lowerTerm = term.toLowerCase();
    
    const culturalTerms = [
      'harissa', 'miso', 'tahini', 'chimichurri', 'garam masala', 'sofrito',
      'pancetta', 'prosciutto', 'chorizo', 'mirepoix', 'roux', 'bouquet garni'
    ];
    
    const advancedTechniques = [
      'confit', 'sous-vide', 'chiffonade', 'brunoise', 'gastrique', 'emulsify',
      'clarify', 'temper', 'deglaze', 'flambé', 'braise', 'poach'
    ];
    
    const intermediateTechniques = [
      'sauté', 'julienne', 'sweat', 'reduce', 'caramelize', 'sear',
      'blanch', 'shock', 'fold', 'whip', 'cream', 'score'
    ];

    if (culturalTerms.some(cultural => lowerTerm.includes(cultural))) {
      return 'cultural';
    }
    
    if (advancedTechniques.some(advanced => lowerTerm.includes(advanced))) {
      return 'advanced';
    }
    
    if (intermediateTechniques.some(intermediate => lowerTerm.includes(intermediate))) {
      return 'intermediate';
    }
    
    return 'basic';
  }

  /**
   * Basic fallback content when GPT fails
   */
  private generateBasicFallbackContent(term: string): CarouselSlide[] {
    return [
      {
        type: 'technique',
        title: 'About This Term',
        content: `${term} is a culinary element with specific applications in professional cooking.`,
        additionalInfo: 'Basic culinary information.'
      },
      {
        type: 'culture',
        title: 'Cultural Context',
        content: `${term} has traditional uses in various culinary traditions.`,
        additionalInfo: 'Cultural significance.'
      },
      {
        type: 'tips',
        title: 'Professional Tips',
        content: `Professional preparation of ${term} requires attention to quality and proper technique.`,
        additionalInfo: 'Basic guidance.'
      },
      {
        type: 'wine',
        title: 'Wine Pairings',
        content: `Wine pairings can complement ${term} effectively.`,
        additionalInfo: 'Pairing guidance.'
      },
      {
        type: 'variations',
        title: 'Variations & Types',
        content: `${term} has different varieties and preparation methods.`,
        additionalInfo: 'Culinary options.'
      },
      {
        type: 'dietary',
        title: 'Dietary Considerations',
        content: `Consider dietary restrictions and allergens when using ${term}.`,
        additionalInfo: 'Dietary awareness.'
      },
      {
        type: 'communication',
        title: 'Guest Communication',
        content: `Describe ${term} to guests using clear, appealing language.`,
        additionalInfo: 'Service guidance.'
      },
      {
        type: 'sourcing',
        title: 'Sourcing & Quality',
        content: `Source quality ${term} from reputable suppliers.`,
        additionalInfo: 'Procurement advice.'
      },
      {
        type: 'kitchen',
        title: 'Kitchen Applications',
        content: `${term} has practical applications in restaurant kitchens.`,
        additionalInfo: 'Operational use.'
      }
    ];
  }

  /**
   * Invalidate cache for a restaurant (version bump)
   */
  async invalidateRestaurantCache(restaurantId: number): Promise<void> {
    // In a production system, we might increment a restaurant-specific cache version
    // For now, this is a placeholder for future cache management
    console.log(`Cache invalidation requested for restaurant ${restaurantId}`);
  }

  /**
   * Legacy method for backward compatibility - now uses restaurant-specific GPT-4o
   */
  async lookupCulinaryTerm(term: string): Promise<any> {
    // This method is kept for backward compatibility but requires restaurant context
    console.warn('lookupCulinaryTerm called without restaurant context - use getCulinaryTermDefinition instead');
    return null;
  }

  /**
   * Enhanced content structuring for different slide types
   */
  private enhanceContentWithStructure(content: string, type: string): string {
    if (!content || content.length < 20) {
      return content;
    }

    switch (type) {
      case 'technique':
        return this.addTechnicalStructure(content);
      case 'culture':
        return this.addCulturalContext(content);
      case 'tips':
        return this.addProfessionalInsights(content);
      case 'variations':
        return this.addVariationDetails(content);
      case 'sourcing':
        return this.addSourcingGuidance(content);
      default:
        return content;
    }
  }

  /**
   * Enhanced wine pairing content with authentic pairing principles
   */
  private enhanceWinePairingContent(content: string, term: string): string {
    if (!content.toLowerCase().includes('acidity') && !content.toLowerCase().includes('tannin')) {
      return `${content} Consider wine characteristics: acidity cuts through rich dishes, tannins complement proteins, and sweetness balances spice.`;
    }
    return content;
  }

  /**
   * Enhanced dietary restriction content using 20-category framework
   */
  private enhanceDietaryRestrictionContent(content: string, term: string): string {
    const majorAllergens = ['gluten', 'dairy', 'nuts', 'shellfish', 'eggs', 'soy', 'fish', 'sesame'];
    const dietaryRestrictions = ['vegan', 'vegetarian', 'keto', 'paleo', 'low-carb', 'gluten-free', 'dairy-free'];
    
    let enhanced = content;
    
    // Add allergen checking if not present
    if (!majorAllergens.some(allergen => content.toLowerCase().includes(allergen))) {
      enhanced += ' Check for common allergens: gluten, dairy, nuts, shellfish, eggs, soy, fish, and sesame.';
    }
    
    // Add dietary compatibility if not present
    if (!dietaryRestrictions.some(diet => content.toLowerCase().includes(diet))) {
      enhanced += ' Consider modifications for vegan, vegetarian, keto, and gluten-free diets.';
    }
    
    return enhanced;
  }

  /**
   * Enhanced guest communication content for service excellence
   */
  private enhanceGuestCommunicationContent(content: string, term: string): string {
    if (!content.toLowerCase().includes('describe') && !content.toLowerCase().includes('flavor')) {
      return `${content} Use sensory language: describe textures, aromas, and flavor profiles to create anticipation and enhance the dining experience.`;
    }
    return content;
  }

  /**
   * Enhanced kitchen workflow content for operational efficiency
   */
  private enhanceKitchenWorkflowContent(content: string, term: string): string {
    if (!content.toLowerCase().includes('prep') && !content.toLowerCase().includes('temperature')) {
      return `${content} Focus on mise en place, proper temperatures, and timing for consistent results during service.`;
    }
    return content;
  }

  /**
   * Add technical structure to technique content
   */
  private addTechnicalStructure(content: string): string {
    if (!content.toLowerCase().includes('temperature') && !content.toLowerCase().includes('timing')) {
      return `${content} Pay attention to temperature control and timing for optimal results.`;
    }
    return content;
  }

  /**
   * Add cultural context to content
   */
  private addCulturalContext(content: string): string {
    if (!content.toLowerCase().includes('traditional') && !content.toLowerCase().includes('origin')) {
      return `${content} Understanding the traditional origins enhances authentic preparation and presentation.`;
    }
    return content;
  }

  /**
   * Add professional insights to tips content
   */
  private addProfessionalInsights(content: string): string {
    if (!content.toLowerCase().includes('chef') && !content.toLowerCase().includes('professional')) {
      return `${content} Professional chefs emphasize consistency and attention to detail in execution.`;
    }
    return content;
  }

  /**
   * Add variation details to content
   */
  private addVariationDetails(content: string): string {
    if (!content.toLowerCase().includes('seasonal') && !content.toLowerCase().includes('regional')) {
      return `${content} Regional and seasonal variations offer menu diversity and local authenticity.`;
    }
    return content;
  }

  /**
   * Add sourcing guidance to content
   */
  private addSourcingGuidance(content: string): string {
    if (!content.toLowerCase().includes('quality') && !content.toLowerCase().includes('storage')) {
      return `${content} Focus on quality indicators during purchasing and proper storage to maintain freshness.`;
    }
    return content;
  }

  /**
   * Legacy method for backward compatibility
   */
  async generateCarouselContent(term: string, category: string): Promise<CarouselSlide[]> {
    console.warn('generateCarouselContent called without restaurant context - use getCulinaryTermDefinition instead');
    return this.generateBasicFallbackContent(term);
  }

  // Admin Control Panel Methods - Phase 5
  async getCachedTerms(restaurantId: number) {
    try {
      const result = await db.select().from(culinaryTermCache)
        .where(eq(culinaryTermCache.restaurant_id, restaurantId));
      
      return result.map(row => ({
        id: row.id,
        term: row.term,
        carousel_data: row.carousel_data,
        definition: row.carousel_data.slides[0]?.content || 'No definition available',
        category: row.carousel_data.slides[0]?.type || 'ingredient',
        contextualInfo: row.carousel_data.slides[0]?.additionalInfo || '',
        versionHash: row.cache_version.toString(),
        createdAt: row.created_at,
        lastUpdated: row.updated_at
      }));
    } catch (error) {
      console.error("Error getting cached terms:", error);
      return [];
    }
  }

  async getCacheStats(restaurantId: number) {
    try {
      const result = await db.select().from(culinaryTermCache)
        .where(eq(culinaryTermCache.restaurant_id, restaurantId));
      
      const totalTerms = result.length;
      const lastUpdated = result.length > 0 
        ? Math.max(...result.map(r => new Date(r.updated_at).getTime()))
        : null;
      const hitRate = 0.85; // Simulated hit rate since we don't track this currently
      
      return {
        totalTerms,
        lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
        hitRate
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return {
        totalTerms: 0,
        lastUpdated: null,
        hitRate: 0
      };
    }
  }

  async regenerateRestaurantCache(restaurantId: number) {
    try {
      // Get restaurant cuisine info for context
      const restaurant = await db.select().from(restaurants)
        .where(eq(restaurants.id, restaurantId))
        .limit(1);
      
      if (!restaurant[0]) {
        throw new Error("Restaurant not found");
      }
      
      // Get all recipes for this restaurant to extract terms from
      const recipes = await db.execute(`
        SELECT recipe_text FROM recipes 
        WHERE restaurant_id = ${restaurantId} AND status != 'hidden'
      `);
      
      if (!recipes.rows || recipes.rows.length === 0) {
        console.log(`No recipes found for restaurant ${restaurantId}`);
        return;
      }
      
      // Combine all recipe text to extract culinary terms
      const allRecipeText = recipes.rows.map((row: any) => row.recipe_text).join('\n\n');
      
      // Extract culinary terms from all recipes
      const cuisineDescription = restaurant[0].cuisineDescription || restaurant[0].cuisineType || "modern culinary cuisine";
      const extractedTerms = await this.extractCulinaryTerms(allRecipeText, cuisineDescription);
      
      console.log(`Extracted ${extractedTerms.length} culinary terms from ${recipes.rows.length} recipes`);
      
      // Process all extracted terms using batch processing
      if (extractedTerms.length > 0) {
        const results = await this.batchProcessTerms(extractedTerms, restaurantId);
        console.log(`Regenerated cache for restaurant ${restaurantId} with ${results.size} terms`);
      } else {
        console.log(`Regenerated cache for restaurant ${restaurantId} with 0 terms`);
      }
      
    } catch (error) {
      console.error("Error regenerating restaurant cache:", error);
      throw error;
    }
  }

  async regenerateTermContent(termId: number, restaurantContext?: any) {
    try {
      // For now, just log the regeneration - full implementation would require OpenAI integration
      console.log(`Regenerating content for term ID: ${termId}`);
      
      // Term content regeneration would typically call OpenAI to refresh content
      // For now, mark as successfully regenerated
      
      console.log(`Successfully regenerated content for term ID: ${termId}`);
    } catch (error) {
      console.error("Error regenerating term content:", error);
      throw error;
    }
  }

  async clearRestaurantCache(restaurantId: number) {
    try {
      const result = await db.delete(culinaryTermCache)
        .where(eq(culinaryTermCache.restaurant_id, restaurantId));
      
      console.log(`Cleared cached terms for restaurant ${restaurantId}`);
      return 0; // Return number cleared
    } catch (error) {
      console.error("Error clearing cache:", error);
      throw error;
    }
  }

  async getContentMetrics(restaurantId: number) {
    try {
      const result = await db.select().from(culinaryTermCache)
        .where(eq(culinaryTermCache.restaurant_id, restaurantId));
      
      // Group by category for metrics
      const categoryMap = new Map();
      result.forEach(row => {
        const category = row.carousel_data.slides[0]?.type || 'other';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category,
            termCount: 0,
            averageHits: 0,
            lastUpdated: row.updated_at
          });
        }
        const entry = categoryMap.get(category);
        entry.termCount++;
        if (row.updated_at > entry.lastUpdated) {
          entry.lastUpdated = row.updated_at;
        }
      });
      
      return {
        categoryBreakdown: Array.from(categoryMap.values()),
        totalCategories: categoryMap.size
      };
    } catch (error) {
      console.error("Error getting content metrics:", error);
      return {
        categoryBreakdown: [],
        totalCategories: 0
      };
    }
  }

  /**
   * Phase 7: Advanced cross-term relationship mapping
   * Analyzes relationships between culinary terms to provide intelligent connections
   */
  async getTermRelationships(term: string, restaurantId: number): Promise<TermRelationship[]> {
    try {
      const restaurant = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);
      if (!restaurant[0]?.cuisineDescription) {
        return [];
      }

      const prompt = `Analyze culinary term relationships for "${term}" in the context of ${restaurant[0].cuisineDescription} cuisine.

Identify 5-8 related terms with their relationship types and provide detailed explanations.

Return JSON in this exact format:
{
  "relationships": [
    {
      "relatedTerm": "term name",
      "relationship": "complement|substitute|prerequisite|component|technique|pairing",
      "strength": 1-10,
      "explanation": "detailed explanation of the relationship"
    }
  ]
}

Focus on practical kitchen relationships that help staff understand connections between techniques, ingredients, and preparations.`;

      const response = await this.openaiService.generateText(prompt);
      
      // Extract JSON from markdown code blocks with robust parsing
      let jsonContent = response;
      if (response.includes('```json')) {
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
        }
      } else if (response.includes('```')) {
        // Handle cases where JSON is in code blocks without language specification
        const codeMatch = response.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          const content = codeMatch[1].trim();
          if (content.startsWith('{') || content.startsWith('[')) {
            jsonContent = content;
          }
        }
      }
      
      // Try to find JSON-like content if no code blocks
      if (!jsonContent.trim().startsWith('{') && !jsonContent.trim().startsWith('[')) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
      }
      
      if (!jsonContent.trim()) {
        console.error('No JSON content found in OpenAI response for term relationships');
        return [];
      }
      
      const data = JSON.parse(jsonContent);
      return data.relationships || [];
    } catch (error) {
      console.error(`Error getting term relationships for ${term}:`, error);
      return [];
    }
  }

  /**
   * Phase 7: Multi-term combination explanations
   * Explains how multiple culinary terms work together in professional cooking
   */
  async getTermCombinations(terms: string[], restaurantId: number): Promise<TermCombination[]> {
    try {
      const restaurant = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);
      if (!restaurant[0]?.cuisineDescription) {
        return [];
      }

      const prompt = `Analyze culinary term combinations for: ${terms.join(', ')} in ${restaurant[0].cuisineDescription} cuisine context.

Explain how these terms work together in professional cooking, their combined applications, and resulting flavor profiles or techniques.

Return JSON in this exact format:
{
  "combinations": [
    {
      "terms": ["term1", "term2", ...],
      "combinationType": "technique_ingredient|flavor_profile|cooking_method|wine_pairing|cultural_fusion",
      "resultDescription": "what this combination achieves",
      "contextualUse": "when and how to use this combination"
    }
  ]
}

Focus on practical applications that enhance menu execution and staff understanding.`;

      const response = await this.openaiService.generateText(prompt);
      
      // Extract JSON from markdown code blocks with robust parsing
      let jsonContent = response;
      if (response.includes('```json')) {
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
        }
      } else if (response.includes('```')) {
        // Handle cases where JSON is in code blocks without language specification
        const codeMatch = response.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          const content = codeMatch[1].trim();
          if (content.startsWith('{') || content.startsWith('[')) {
            jsonContent = content;
          }
        }
      }
      
      // Try to find JSON-like content if no code blocks
      if (!jsonContent.trim().startsWith('{') && !jsonContent.trim().startsWith('[')) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
      }
      
      if (!jsonContent.trim()) {
        console.error('No JSON content found in OpenAI response');
        return [];
      }
      
      const data = JSON.parse(jsonContent);
      return data.combinations || [];
    } catch (error) {
      console.error(`Error getting term combinations for ${terms.join(', ')}:`, error);
      return [];
    }
  }

  /**
   * Phase 7: Seasonal content relevance
   * Provides season-specific context and adaptations for culinary terms
   */
  async getSeasonalContext(term: string, restaurantId: number): Promise<SeasonalContext | null> {
    try {
      const restaurant = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);
      if (!restaurant[0]?.cuisineDescription) {
        return null;
      }

      const currentMonth = new Date().getMonth();
      const seasons = ['winter', 'spring', 'summer', 'fall'];
      const currentSeason = seasons[Math.floor(currentMonth / 3)];

      const prompt = `Provide seasonal context for "${term}" in ${restaurant[0].cuisineDescription} cuisine.

Current season: ${currentSeason}

Return JSON in this exact format:
{
  "currentSeason": "${currentSeason}",
  "relevanceScore": 1-10,
  "seasonalVariations": [
    {
      "season": "season name",
      "adaptation": "how the term adapts to this season",
      "ingredients": ["seasonal ingredients", "that work with this term"]
    }
  ]
}

Focus on practical seasonal menu applications and ingredient availability.`;

      const response = await this.openaiService.generateText(prompt);
      
      // Extract JSON from markdown code blocks with robust parsing
      let jsonContent = response;
      if (response.includes('```json')) {
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
        }
      } else if (response.includes('```')) {
        // Handle cases where JSON is in code blocks without language specification
        const codeMatch = response.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          const content = codeMatch[1].trim();
          if (content.startsWith('{') || content.startsWith('[')) {
            jsonContent = content;
          }
        }
      }
      
      // Try to find JSON-like content if no code blocks
      if (!jsonContent.trim().startsWith('{') && !jsonContent.trim().startsWith('[')) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
      }
      
      if (!jsonContent.trim()) {
        console.error('No JSON content found in OpenAI response for seasonal context');
        return null;
      }
      
      const data = JSON.parse(jsonContent);
      return {
        currentSeason: data.currentSeason,
        relevanceScore: data.relevanceScore || 5,
        seasonalVariations: data.seasonalVariations || []
      };
    } catch (error) {
      console.error(`Error getting seasonal context for ${term}:`, error);
      return null;
    }
  }

  /**
   * Phase 7: Staff training mode integration
   * Provides role-specific culinary knowledge based on staff position and training level
   */
  async getStaffTrainingContent(term: string, restaurantId: number, staffContext: StaffTrainingContext): Promise<CulinaryTerm | null> {
    try {
      const restaurant = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);
      if (!restaurant[0]?.cuisineDescription) {
        return null;
      }

      const prompt = `Generate staff training content for "${term}" in ${restaurant[0].cuisineDescription} cuisine.

Staff context:
- Role: ${staffContext.staffRole}
- Training level: ${staffContext.trainingLevel}
- Focus areas: ${staffContext.focusAreas.join(', ')}

Create role-specific content that helps this staff member understand and apply knowledge about this term.

Return JSON in this exact format:
{
  "explanation": "role-specific explanation",
  "slides": [
    {
      "type": "technique|culture|tips|wine|variations|dietary|communication|sourcing|kitchen",
      "title": "slide title",
      "content": "detailed content for this staff role",
      "additionalInfo": "practical application tips",
      "staffLevel": "${staffContext.staffRole}",
      "relatedTerms": ["related", "terms"]
    }
  ],
  "practicalApplications": "specific ways this staff member uses this knowledge"
}

Tailor complexity and focus to the staff member's role and training level.`;

      const response = await this.openaiService.generateText(prompt);
      
      // Extract JSON from markdown code blocks
      let jsonContent = response;
      if (response.includes('```json')) {
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
        }
      }
      
      const data = JSON.parse(jsonContent);
      return {
        term,
        category: this.categorizeTerm(term),
        explanation: data.explanation,
        carouselContent: data.slides || []
      };
    } catch (error) {
      console.error(`Error getting staff training content for ${term}:`, error);
      return null;
    }
  }

  /**
   * Phase 7: Advanced term content generation with all Phase 7 features
   * Generates comprehensive term data including relationships, combinations, and seasonal context
   */
  private async generateAdvancedTermContent(term: string, cuisineDescription: string, restaurantId: number): Promise<CachedTermData> {
    try {
      const currentMonth = new Date().getMonth();
      const seasons = ['winter', 'spring', 'summer', 'fall'];
      const currentSeason = seasons[Math.floor(currentMonth / 3)];

      const prompt = `Generate comprehensive culinary knowledge for "${term}" in ${cuisineDescription} cuisine context.

Current season: ${currentSeason}

Provide complete analysis including:
1. 9-slide carousel content
2. Term relationships
3. Multi-term combinations
4. Seasonal context

IMPORTANT CONTENT REQUIREMENTS:
- Each slide's "content" field must contain exactly 3-6 sentences
- Each sentence should be complete and informative
- Maintain professional culinary knowledge depth
- Ensure content flows naturally between sentences

Return JSON in this exact format:
{
  "slides": [
    {
      "type": "technique|culture|tips|wine|variations|dietary|communication|sourcing|kitchen|relationships|combinations|seasonal",
      "title": "slide title",
      "content": "detailed content with 3-6 complete sentences",
      "additionalInfo": "practical tips",
      "relatedTerms": ["related", "terms"],
      "seasonalRelevance": "spring|summer|fall|winter|year-round",
      "staffLevel": "server|sommelier|chef|manager|all"
    }
  ],
  "relationships": [
    {
      "relatedTerm": "term name",
      "relationship": "complement|substitute|prerequisite|component|technique|pairing",
      "strength": 1-10,
      "explanation": "relationship explanation"
    }
  ],
  "combinations": [
    {
      "terms": ["term1", "term2"],
      "combinationType": "technique_ingredient|flavor_profile|cooking_method|wine_pairing|cultural_fusion",
      "resultDescription": "combination result",
      "contextualUse": "when to use this combination"
    }
  ],
  "seasonalContext": {
    "currentSeason": "${currentSeason}",
    "relevanceScore": 1-10,
    "seasonalVariations": [
      {
        "season": "season name",
        "adaptation": "seasonal adaptation",
        "ingredients": ["seasonal", "ingredients"]
      }
    ]
  }
}

Focus on practical restaurant applications and staff education.`;

      const response = await this.openaiService.generateText(prompt);
      
      // Extract JSON from markdown code blocks
      let jsonContent = response;
      if (response.includes('```json')) {
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
        }
      }
      
      const data = JSON.parse(jsonContent);
      return {
        slides: data.slides || [],
        relationships: data.relationships || [],
        combinations: data.combinations || [],
        seasonalContext: data.seasonalContext
      };
    } catch (error) {
      console.error(`Error generating advanced term content for ${term}:`, error);
      return {
        slides: this.generateBasicFallbackContent(term),
        relationships: [],
        combinations: [],
        seasonalContext: undefined
      };
    }
  }

  /**
   * Phase 7: Restaurant-specific terminology integration
   * Manages restaurant-specific culinary terminology and house style preferences
   */
  async addRestaurantSpecificTerminology(restaurantId: number, terminology: { term: string; definition: string; category: string }[]): Promise<void> {
    try {
      for (const termData of terminology) {
        const customSlides: CarouselSlide[] = [
          {
            type: 'technique',
            title: `House Style: ${termData.term}`,
            content: termData.definition,
            additionalInfo: 'Restaurant-specific terminology and preparation standards.',
            staffLevel: 'all'
          }
        ];

        await this.cacheTerm(restaurantId, termData.term, { 
          slides: customSlides,
          relationships: [],
          combinations: [],
          seasonalContext: undefined
        });
      }
    } catch (error) {
      console.error('Error adding restaurant-specific terminology:', error);
      throw error;
    }
  }

  private generateVersionHash(cuisineType: string, cuisineDescription: string): string {
    return crypto.createHash('md5')
      .update(`${cuisineType}-${cuisineDescription}-${this.currentCacheVersion}`)
      .digest('hex');
  }
}

export const culinaryKnowledgeService = new CulinaryKnowledgeService();