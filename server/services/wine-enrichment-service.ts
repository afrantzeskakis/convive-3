import { openaiService } from './openai-service';
import { pool } from '../db';

interface WineProfile {
  tasting_notes: string;
  flavor_notes: string;
  aroma_notes: string;
  body_description: string;
  texture: string;
  balance: string;
  tannin_level: string;
  acidity: string;
  finish_length: string;
  food_pairing: string;
  serving_temp: string;
  oak_influence: string;
  aging_potential: string;
  blend_description: string;
}

/**
 * Generate comprehensive wine profile using GPT-4
 */
export async function generateWineProfile(wine: {
  wine_name: string;
  producer?: string;
  vintage?: string;
  region?: string;
  country?: string;
  varietals?: string;
  wine_type?: string;
}): Promise<WineProfile | null> {
  try {
    const wineDescription = `${wine.producer || ''} ${wine.wine_name} ${wine.vintage || ''} from ${wine.region || ''}, ${wine.country || ''} - ${wine.varietals || wine.wine_type || 'wine'}`.trim();

    const completion = await openaiService.createChatCompletion({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Master Sommelier and wine expert. Generate a comprehensive professional wine profile for the given wine. Provide authentic, realistic characteristics based on the producer, region, vintage, and varietal. Return ONLY a JSON object with the following structure:

{
  "tasting_notes": "Professional tasting description (2-3 sentences)",
  "flavor_notes": "Primary and secondary flavors (comma-separated list)",
  "aroma_notes": "Aromatic characteristics (comma-separated list)",
  "body_description": "light/medium/full",
  "texture": "Mouthfeel description (1-2 words)",
  "balance": "Overall balance assessment (1-2 words)",
  "tannin_level": "Tannin description for reds (silky/firm/assertive/etc)",
  "acidity": "Acidity level (low/medium/high)",
  "finish_length": "short/medium/long",
  "food_pairing": "Recommended food pairings (comma-separated)",
  "serving_temp": "Optimal serving temperature",
  "oak_influence": "none/light/medium/heavy",
  "aging_potential": "Current drinking window and aging potential",
  "blend_description": "Grape composition if known, or varietals"
}

Base your response on authentic wine knowledge for this specific producer, region, vintage, and style.`
        },
        {
          role: "user",
          content: `Generate a professional wine profile for: ${wineDescription}`
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return null;

    try {
      const profile = JSON.parse(response) as WineProfile;
      return profile;
    } catch (parseError) {
      console.error('Failed to parse wine profile JSON:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Failed to generate wine profile:', error);
    return null;
  }
}

/**
 * Enrich a single wine with comprehensive profile data
 */
export async function enrichWineWithProfile(wineId: number): Promise<boolean> {
  try {
    // Get wine data
    const result = await pool.query('SELECT * FROM wines WHERE id = $1', [wineId]);
    if (result.rows.length === 0) return false;

    const wine = result.rows[0];

    // Generate comprehensive profile
    const profile = await generateWineProfile(wine);
    if (!profile) return false;

    // Update wine with enriched data
    await pool.query(`
      UPDATE wines SET 
        tasting_notes = COALESCE(tasting_notes, $1),
        flavor_notes = COALESCE(flavor_notes, $2),
        aroma_notes = COALESCE(aroma_notes, $3),
        body_description = COALESCE(body_description, $4),
        texture = COALESCE(texture, $5),
        balance = COALESCE(balance, $6),
        tannin_level = COALESCE(tannin_level, $7),
        acidity = COALESCE(acidity, $8),
        finish_length = COALESCE(finish_length, $9),
        food_pairing = COALESCE(food_pairing, $10),
        serving_temp = COALESCE(serving_temp, $11),
        oak_influence = COALESCE(oak_influence, $12),
        aging_potential = COALESCE(aging_potential, $13),
        blend_description = COALESCE(blend_description, $14),
        description_enhanced = COALESCE(description_enhanced, $15),
        updated_at = NOW()
      WHERE id = $16
    `, [
      profile.tasting_notes,
      profile.flavor_notes,
      profile.aroma_notes,
      profile.body_description,
      profile.texture,
      profile.balance,
      profile.tannin_level,
      profile.acidity,
      profile.finish_length,
      profile.food_pairing,
      profile.serving_temp,
      profile.oak_influence,
      profile.aging_potential,
      profile.blend_description,
      `${profile.tasting_notes} | Flavors: ${profile.flavor_notes} | Pairs with: ${profile.food_pairing}`,
      wineId
    ]);

    console.log(`Successfully enriched wine: ${wine.wine_name}`);
    return true;
  } catch (error) {
    console.error(`Failed to enrich wine ${wineId}:`, error);
    return false;
  }
}

/**
 * Batch enrich wines that lack comprehensive profiles
 */
export async function batchEnrichWines(limit: number = 10): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const stats = { processed: 0, succeeded: 0, failed: 0 };

  try {
    // Get wines that need enrichment
    const result = await pool.query(`
      SELECT id, wine_name, producer, vintage, region, country, varietals, wine_type
      FROM wines 
      WHERE (general_guest_experience IS NULL OR flavor_notes IS NULL OR food_pairing IS NULL)
      AND wine_name IS NOT NULL
      ORDER BY id
      LIMIT $1
    `, [limit]);

    for (const wine of result.rows) {
      stats.processed++;
      
      const success = await enrichWineWithProfile(wine.id);
      if (success) {
        stats.succeeded++;
      } else {
        stats.failed++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Batch enrichment completed: ${stats.succeeded}/${stats.processed} wines enriched`);
    return stats;
  } catch (error) {
    console.error('Batch enrichment failed:', error);
    return stats;
  }
}