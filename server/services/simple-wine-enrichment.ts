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
 * Generate wine profile based on varietal and region knowledge
 */
function generateWineProfileFromData(wine: {
  wine_name: string;
  producer?: string;
  vintage?: string;
  region?: string;
  country?: string;
  varietals?: string;
  wine_type?: string;
}): WineProfile {
  const varietal = wine.varietals?.toLowerCase() || wine.wine_type?.toLowerCase() || '';
  const region = wine.region?.toLowerCase() || '';
  const country = wine.country?.toLowerCase() || '';
  
  // Generate profile based on wine characteristics
  let profile: WineProfile = {
    tasting_notes: '',
    flavor_notes: '',
    aroma_notes: '',
    body_description: '',
    texture: '',
    balance: '',
    tannin_level: '',
    acidity: '',
    finish_length: '',
    food_pairing: '',
    serving_temp: '',
    oak_influence: '',
    aging_potential: '',
    blend_description: ''
  };

  // Nebbiolo characteristics (Barolo, Barbaresco)
  if (varietal.includes('nebbiolo') || region.includes('piedmont') || wine.wine_name.toLowerCase().includes('barolo') || wine.wine_name.toLowerCase().includes('barbaresco')) {
    profile = {
      tasting_notes: "Complex and powerful with intense fruit flavors, featuring dark cherry, plum, and rose petal notes. This wine shows exceptional structure with firm tannins and bright acidity, developing tertiary aromas of leather, tar, and earth with age.",
      flavor_notes: "Dark cherry, plum, rose petal, leather, tar, tobacco, truffle, dried herbs",
      aroma_notes: "Intense rose, violet, cherry, leather, tar, earth, spices",
      body_description: "full",
      texture: "firm, structured",
      balance: "excellent",
      tannin_level: "high, firm",
      acidity: "high",
      finish_length: "long",
      food_pairing: "Braised beef, game meats, aged cheeses, risotto with truffles, lamb, wild boar",
      serving_temp: "16-18°C (61-64°F)",
      oak_influence: "medium",
      aging_potential: "15-25 years from vintage",
      blend_description: "100% Nebbiolo"
    };
  }
  // Sangiovese characteristics (Chianti, Brunello)
  else if (varietal.includes('sangiovese') || region.includes('tuscany') || wine.wine_name.toLowerCase().includes('chianti') || wine.wine_name.toLowerCase().includes('brunello')) {
    profile = {
      tasting_notes: "Elegant and food-friendly with bright cherry flavors and earthy undertones. Shows excellent acidity and moderate tannins with notes of herbs, leather, and mineral complexity typical of Tuscan terroir.",
      flavor_notes: "Red cherry, plum, herbs, leather, earth, tobacco, dried tomato",
      aroma_notes: "Cherry, violet, herbs, earth, leather, spices",
      body_description: "medium to full",
      texture: "smooth, elegant",
      balance: "excellent",
      tannin_level: "medium to high",
      acidity: "high",
      finish_length: "medium to long",
      food_pairing: "Italian cuisine, grilled meats, pasta with red sauce, aged pecorino, wild game",
      serving_temp: "16-18°C (61-64°F)",
      oak_influence: "light to medium",
      aging_potential: "10-20 years from vintage",
      blend_description: varietal.includes('sangiovese') ? "Sangiovese dominant blend" : "100% Sangiovese"
    };
  }
  // Pinot Noir characteristics
  else if (varietal.includes('pinot noir')) {
    profile = {
      tasting_notes: "Elegant and silky with red fruit character and earthy complexity. Shows refined tannins and bright acidity with subtle oak influence, displaying terroir-driven mineral notes and floral aromatics.",
      flavor_notes: "Red cherry, raspberry, strawberry, earth, mushroom, spices, cola",
      aroma_notes: "Red berries, rose, earth, forest floor, spices",
      body_description: region.includes('burgundy') ? "medium" : "light to medium",
      texture: "silky, refined",
      balance: "excellent",
      tannin_level: "low to medium",
      acidity: "high",
      finish_length: "medium to long",
      food_pairing: "Salmon, duck, mushroom dishes, soft cheeses, roasted chicken",
      serving_temp: "14-16°C (57-61°F)",
      oak_influence: "light to medium",
      aging_potential: "8-15 years from vintage",
      blend_description: "100% Pinot Noir"
    };
  }
  // Cabernet Sauvignon characteristics
  else if (varietal.includes('cabernet sauvignon')) {
    profile = {
      tasting_notes: "Full-bodied and structured with blackcurrant and cassis flavors. Shows excellent aging potential with firm tannins, good acidity, and complex oak integration featuring cedar, vanilla, and spice notes.",
      flavor_notes: "Blackcurrant, cassis, blackberry, cedar, vanilla, tobacco, chocolate",
      aroma_notes: "Blackcurrant, cedar, vanilla, herbs, tobacco",
      body_description: "full",
      texture: "structured, powerful",
      balance: "excellent",
      tannin_level: "high",
      acidity: "medium to high",
      finish_length: "long",
      food_pairing: "Red meat, steak, lamb, aged cheeses, hearty stews",
      serving_temp: "16-18°C (61-64°F)",
      oak_influence: "medium to heavy",
      aging_potential: "10-25 years from vintage",
      blend_description: varietal.includes('blend') ? "Cabernet Sauvignon blend" : "100% Cabernet Sauvignon"
    };
  }
  // Chardonnay characteristics
  else if (varietal.includes('chardonnay')) {
    const isOaked = !wine.wine_name.toLowerCase().includes('unoaked');
    profile = {
      tasting_notes: isOaked ? 
        "Rich and complex with tropical fruit flavors and creamy oak integration. Shows excellent balance between fruit and oak with notes of vanilla, butter, and subtle spice." :
        "Fresh and mineral-driven with citrus and stone fruit flavors. Clean and crisp with bright acidity and pure fruit expression.",
      flavor_notes: isOaked ? 
        "Tropical fruit, apple, pear, vanilla, butter, honey, nuts" :
        "Citrus, green apple, pear, mineral, stone fruit",
      aroma_notes: isOaked ? 
        "Tropical fruit, vanilla, toast, butter, honey" :
        "Citrus, apple, mineral, floral",
      body_description: isOaked ? "full" : "medium",
      texture: isOaked ? "creamy, rich" : "crisp, clean",
      balance: "excellent",
      tannin_level: "none",
      acidity: isOaked ? "medium" : "high",
      finish_length: "medium to long",
      food_pairing: isOaked ?
        "Lobster, roasted chicken, creamy pasta, soft cheeses" :
        "Shellfish, light fish, salads, goat cheese",
      serving_temp: "8-12°C (46-54°F)",
      oak_influence: isOaked ? "medium to heavy" : "none",
      aging_potential: isOaked ? "5-10 years" : "2-5 years",
      blend_description: "100% Chardonnay"
    };
  }
  // Default wine profile
  else {
    const isRed = wine.wine_type?.toLowerCase().includes('red') || 
                 ['merlot', 'syrah', 'shiraz', 'malbec', 'tempranillo'].some(v => varietal.includes(v));
    
    if (isRed) {
      profile = {
        tasting_notes: "Well-structured red wine with dark fruit flavors and balanced tannins. Shows good complexity with notes of spice, earth, and subtle oak influence.",
        flavor_notes: "Dark fruit, berries, spices, earth, vanilla",
        aroma_notes: "Dark fruit, spices, earth, oak",
        body_description: "medium to full",
        texture: "smooth, balanced",
        balance: "good",
        tannin_level: "medium",
        acidity: "medium",
        finish_length: "medium",
        food_pairing: "Red meat, pasta with red sauce, aged cheeses",
        serving_temp: "16-18°C (61-64°F)",
        oak_influence: "light to medium",
        aging_potential: "5-10 years from vintage",
        blend_description: wine.varietals || "Red wine blend"
      };
    } else {
      profile = {
        tasting_notes: "Fresh and elegant white wine with bright fruit flavors and crisp acidity. Shows good balance with clean finish and subtle complexity.",
        flavor_notes: "Citrus, stone fruit, apple, mineral",
        aroma_notes: "Fresh fruit, floral, mineral",
        body_description: "light to medium",
        texture: "crisp, clean",
        balance: "good",
        tannin_level: "none",
        acidity: "medium to high",
        finish_length: "medium",
        food_pairing: "Seafood, light pasta, salads, soft cheeses",
        serving_temp: "8-12°C (46-54°F)",
        oak_influence: "light",
        aging_potential: "2-5 years from vintage",
        blend_description: wine.varietals || "White wine blend"
      };
    }
  }

  return profile;
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
    const profile = generateWineProfileFromData(wine);

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
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Batch enrichment completed: ${stats.succeeded}/${stats.processed} wines enriched`);
    return stats;
  } catch (error) {
    console.error('Batch enrichment failed:', error);
    return stats;
  }
}