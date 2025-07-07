/**
 * Update a specific wine with corrected Vivino data to test the complete fix
 */

import { ApifyClient } from 'apify-client';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

async function updateWineWithCorrectedData() {
  try {
    console.log("Updating wine with corrected Vivino data...");

    // Get a Tignanello wine that was previously verified but has null tasting notes
    const result = await pool.query(`
      SELECT * FROM wines 
      WHERE wine_name = 'Tignanello' 
      AND producer = 'Antinori' 
      AND verified = true 
      AND tasting_notes IS NULL
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log("No suitable wine found for update");
      return;
    }

    const wine = result.rows[0];
    console.log(`Updating wine: ${wine.wine_name} ${wine.vintage} by ${wine.producer}`);

    const searchQuery = `${wine.producer} ${wine.wine_name} ${wine.vintage}`;
    
    const run = await apifyClient.actor("canadesk/vivino").call({
      search: searchQuery,
      maxItems: 1
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      console.log("No Vivino data found");
      return;
    }

    const vivinoData = items[0];

    // Extract data using corrected logic
    let tastingNotes = null;
    
    // Try wine highlights first
    if (vivinoData.highlights && Array.isArray(vivinoData.highlights)) {
      const highlights = vivinoData.highlights
        .filter(h => h && typeof h === 'string')
        .slice(0, 3);
      if (highlights.length > 0) {
        tastingNotes = highlights.join(', ');
      }
    }
    
    // Try taste structure with proper type checking
    if (!tastingNotes && vivinoData.taste?.structure) {
      const structure = vivinoData.taste.structure;
      const structureNotes = [];
      
      if (structure.acidity && typeof structure.acidity !== 'object') {
        structureNotes.push(`Acidity: ${structure.acidity}`);
      }
      if (structure.intensity && typeof structure.intensity !== 'object') {
        structureNotes.push(`Intensity: ${structure.intensity}`);
      }
      if (structure.sweetness && typeof structure.sweetness !== 'object') {
        structureNotes.push(`Sweetness: ${structure.sweetness}`);
      }
      if (structure.tannin && typeof structure.tannin !== 'object') {
        structureNotes.push(`Tannin: ${structure.tannin}`);
      }
      
      if (structureNotes.length > 0) {
        tastingNotes = structureNotes.join(', ');
      }
    }

    // Update the wine with corrected data
    const updateResult = await pool.query(`
      UPDATE wines SET
        vivino_id = $1,
        vivino_url = $2,
        vivino_rating = $3,
        wine_type = COALESCE(wine_type, $4),
        tasting_notes = $5,
        updated_at = NOW()
      WHERE id = $6
    `, [
      vivinoData.wine?.id?.toString() || null,
      vivinoData.url || null,
      vivinoData.summary?.rating?.toString() || null,
      vivinoData.wine?.style?.name || 'Red',
      tastingNotes,
      wine.id
    ]);

    console.log("\n=== UPDATE RESULTS ===");
    console.log("Wine ID:", vivinoData.wine?.id);
    console.log("Rating:", vivinoData.summary?.rating);
    console.log("Wine Type:", vivinoData.wine?.style?.name);
    console.log("Tasting Notes:", tastingNotes);
    console.log("Database updated:", updateResult.rowCount > 0 ? "Yes" : "No");

    if (tastingNotes && tastingNotes !== '[object Object]') {
      console.log("\n✓ SUCCESS: Wine updated with proper tasting notes");
    } else {
      console.log("\n✗ ISSUE: Tasting notes still not properly extracted");
    }

  } catch (error) {
    console.error("Error updating wine:", error);
  } finally {
    await pool.end();
  }
}

updateWineWithCorrectedData();
