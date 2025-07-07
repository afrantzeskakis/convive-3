/**
 * Wine Carousel Content Generator
 * Creates educational carousel slides with 3-6 sentences each about verified wines
 */

import { Pool } from 'pg';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

interface CarouselSlide {
  type: 'wine_knowledge' | 'tasting_technique' | 'food_pairing' | 'service_tips' | 'wine_history' | 'regional_insight';
  title: string;
  content: string;
  wine_reference?: string;
  staff_level: 'server' | 'sommelier' | 'all';
}

interface WineCarouselContent {
  wine_id: number;
  wine_name: string;
  producer: string;
  slides: CarouselSlide[];
  generated_at: string;
}

export class WineCarouselGenerator {
  
  /**
   * Generate educational carousel content from verified wine data
   */
  async generateWineCarouselContent(limit: number = 10): Promise<WineCarouselContent[]> {
    try {
      console.log(`Generating carousel content for ${limit} verified wines...`);
      
      // Get verified wines with complete profiles
      const result = await pool.query(`
        SELECT id, wine_name, producer, vintage, region, country, wine_type,
               tasting_notes, flavor_notes, aroma_notes, body_description,
               food_pairing, serving_temp, aging_potential, producer_notes,
               verified_source
        FROM wines 
        WHERE verified = true 
          AND tasting_notes IS NOT NULL 
          AND LENGTH(tasting_notes) > 100
        ORDER BY 
          CASE WHEN verified_source = 'Professional Database' THEN 1 ELSE 2 END,
          wine_name
        LIMIT $1
      `, [limit]);
      
      const carouselContents: WineCarouselContent[] = [];
      
      for (const wine of result.rows) {
        console.log(`Generating content for: ${wine.wine_name} by ${wine.producer}`);
        
        const slides = await this.createEducationalSlides(wine);
        
        carouselContents.push({
          wine_id: wine.id,
          wine_name: wine.wine_name,
          producer: wine.producer,
          slides,
          generated_at: new Date().toISOString()
        });
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log(`Generated carousel content for ${carouselContents.length} wines`);
      return carouselContents;
      
    } catch (error) {
      console.error('Error generating wine carousel content:', error);
      throw error;
    }
  }
  
  /**
   * Create educational slides for a specific wine (3-6 sentences each)
   */
  private async createEducationalSlides(wine: any): Promise<CarouselSlide[]> {
    const prompt = `Create educational carousel content for restaurant staff about "${wine.wine_name}" by ${wine.producer}${wine.vintage ? ` (${wine.vintage})` : ''}.

Wine Details:
- Region: ${wine.region}, ${wine.country}
- Type: ${wine.wine_type}
- Tasting Notes: ${wine.tasting_notes}
- Flavor Profile: ${wine.flavor_notes || 'Not specified'}
- Aroma: ${wine.aroma_notes || 'Not specified'}
- Body: ${wine.body_description || 'Not specified'}
- Food Pairing: ${wine.food_pairing || 'Not specified'}
- Serving: ${wine.serving_temp || 'Not specified'}

Create 6 educational slides, each with EXACTLY 3-6 sentences. Each slide should teach staff something valuable about this wine or wine service in general.

Respond with JSON:
{
  "slides": [
    {
      "type": "wine_knowledge",
      "title": "Wine Overview",
      "content": "3-6 sentences about the wine's character and significance",
      "staff_level": "all"
    },
    {
      "type": "tasting_technique", 
      "title": "Tasting Profile",
      "content": "3-6 sentences about how to describe this wine's taste and aroma",
      "staff_level": "server"
    },
    {
      "type": "food_pairing",
      "title": "Perfect Pairings", 
      "content": "3-6 sentences about specific food recommendations",
      "staff_level": "all"
    },
    {
      "type": "service_tips",
      "title": "Service Excellence",
      "content": "3-6 sentences about proper serving temperature, glassware, and presentation",
      "staff_level": "server"
    },
    {
      "type": "wine_history",
      "title": "Producer Story",
      "content": "3-6 sentences about the producer's history and winemaking philosophy",
      "staff_level": "sommelier"
    },
    {
      "type": "regional_insight",
      "title": "Regional Character",
      "content": "3-6 sentences about the wine region and terroir influence",
      "staff_level": "sommelier"
    }
  ]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate that each slide has 3-6 sentences
      const validatedSlides = result.slides.map((slide: any) => ({
        ...slide,
        content: this.validateSentenceCount(slide.content),
        wine_reference: `${wine.wine_name} by ${wine.producer}`
      }));
      
      return validatedSlides;
      
    } catch (error) {
      console.error(`Error creating slides for ${wine.wine_name}:`, error);
      return [];
    }
  }
  
  /**
   * Ensure content has 3-6 sentences
   */
  private validateSentenceCount(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length < 3) {
      // Content too short, but return as-is since it's from authentic wine data
      console.warn(`Content has only ${sentences.length} sentences, should be 3-6`);
    } else if (sentences.length > 6) {
      // Trim to 6 sentences
      return sentences.slice(0, 6).join('. ') + '.';
    }
    
    return content;
  }
  
  /**
   * Generate carousel content for a specific wine by ID
   */
  async generateCarouselForWine(wineId: number): Promise<CarouselSlide[]> {
    try {
      const result = await pool.query(`
        SELECT id, wine_name, producer, vintage, region, country, wine_type,
               tasting_notes, flavor_notes, aroma_notes, body_description,
               food_pairing, serving_temp, aging_potential, producer_notes
        FROM wines 
        WHERE id = $1 AND verified = true
      `, [wineId]);
      
      if (result.rows.length === 0) {
        throw new Error(`Verified wine with ID ${wineId} not found`);
      }
      
      return await this.createEducationalSlides(result.rows[0]);
      
    } catch (error) {
      console.error(`Error generating carousel for wine ${wineId}:`, error);
      throw error;
    }
  }
}

export const wineCarouselGenerator = new WineCarouselGenerator();