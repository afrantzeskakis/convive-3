import { pool } from '../db';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIWineProfile {
  tasting_notes: string;
  flavor_notes: string;
  aroma_notes: string;
  body_description: string;
  food_pairing: string;
  serving_temp: string;
  aging_potential: string;
  blend_description: string;
  confidence_level: 'high' | 'medium' | 'low';
}

/**
 * AI-Enhanced Wine Enrichment - Single API call approach
 * Replaces template randomization with wine-specific AI generation
 */
export async function enrichWineWithAI(wineId: number): Promise<boolean> {
  try {
    const result = await pool.query('SELECT * FROM wines WHERE id = $1', [wineId]);
    if (result.rows.length === 0) return false;

    const wine = result.rows[0];
    const profile = await generateAIWineProfile(wine);
    
    if (!profile || profile.confidence_level === 'low') {
      console.log(`Skipping ${wine.wine_name}: AI confidence too low`);
      return false;
    }

    await pool.query(`
      UPDATE wines SET 
        verified = true,
        verified_source = 'AI Research',
        tasting_notes = $1,
        flavor_notes = $2,
        aroma_notes = $3,
        body_description = $4,
        food_pairing = $5,
        serving_temp = $6,
        aging_potential = $7,
        blend_description = $8,
        description_enhanced = $9,
        updated_at = NOW()
      WHERE id = $10
    `, [
      profile.tasting_notes,
      profile.flavor_notes,
      profile.aroma_notes,
      profile.body_description,
      profile.food_pairing,
      profile.serving_temp,
      profile.aging_potential,
      profile.blend_description,
      `AI-generated wine profile with ${profile.confidence_level} confidence for ${wine.wine_name}`,
      wineId
    ]);

    return true;
  } catch (error) {
    console.error(`Failed to enrich wine ${wineId} with AI:`, error);
    return false;
  }
}

async function generateAIWineProfile(wine: any): Promise<AIWineProfile | null> {
  const prompt = `Generate accurate wine profile for: "${wine.wine_name}" by ${wine.producer || 'producer'}${wine.vintage ? ` from ${wine.vintage}` : ''}.
Region: ${wine.region || 'unknown'}, ${wine.country || 'unknown'}
Varietals: ${wine.varietals || wine.wine_type || 'unknown'}

Create wine-specific content (not generic templates) based on your knowledge of this producer, region, and vintage. If you lack specific knowledge, indicate lower confidence.

Respond with JSON:
{
  "tasting_notes": "detailed tasting description (75+ words) specific to this wine",
  "flavor_notes": "specific flavor descriptors for this wine/producer style",
  "aroma_notes": "aromatic profile specific to this wine's characteristics",
  "body_description": "body, tannin, acidity specific to this wine",
  "food_pairing": "pairing recommendations based on this wine's specific profile",
  "serving_temp": "optimal temperature for this wine type",
  "aging_potential": "aging recommendation based on this specific wine/vintage",
  "blend_description": "accurate description of this wine's composition",
  "confidence_level": "high|medium|low - your confidence in this specific wine knowledge"
}`;

  try {
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a wine expert providing specific, accurate wine profiles. Only provide high-confidence information you know about specific wines/producers. Mark lower confidence when uncertain."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1000
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('API timeout')), 10000)
      )
    ]);

    const profile = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate minimum content requirements
    if (!profile.tasting_notes || profile.tasting_notes.length < 75) {
      return null;
    }

    return profile;
  } catch (error) {
    console.error('AI wine profile generation failed:', error);
    return null;
  }
}

/**
 * Batch AI enrichment with confidence filtering
 */
export async function batchEnrichWinesWithAI(limit: number = 5): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  lowConfidence: number;
}> {
  const stats = { processed: 0, succeeded: 0, failed: 0, lowConfidence: 0 };

  try {
    const result = await pool.query(`
      SELECT id, wine_name, producer, vintage, region, country, varietals, wine_type
      FROM wines 
      WHERE (verified = false OR verified IS NULL)
      AND wine_name IS NOT NULL
      ORDER BY id
      LIMIT $1
    `, [limit]);

    console.log(`Starting AI wine enrichment for ${result.rows.length} wines`);

    for (const wine of result.rows) {
      stats.processed++;
      
      const success = await enrichWineWithAI(wine.id);
      if (success) {
        stats.succeeded++;
        console.log(`✓ AI Enriched: ${wine.wine_name}`);
      } else {
        stats.failed++;
        stats.lowConfidence++;
        console.log(`✗ Low confidence: ${wine.wine_name}`);
      }

      // Rate limiting for API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`AI enrichment completed: ${stats.succeeded}/${stats.processed} wines enriched`);
    return stats;
  } catch (error) {
    console.error('Batch AI enrichment failed:', error);
    return stats;
  }
}