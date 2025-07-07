/**
 * Extract proper descriptive tasting notes from Vivino data
 */

import { ApifyClient } from 'apify-client';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

async function extractProperTastingNotes() {
  try {
    console.log("Extracting proper descriptive tasting notes...");

    const searchQuery = "Antinori Tignanello 1993";
    
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
    let properTastingNotes = null;
    
    // First try wine highlights (most descriptive professional notes)
    if (vivinoData.highlights && Array.isArray(vivinoData.highlights)) {
      const highlights = vivinoData.highlights
        .filter(h => h && typeof h === 'string' && h.length > 10)
        .slice(0, 3);
      if (highlights.length > 0) {
        properTastingNotes = highlights.join('. ');
        console.log("Found highlights:", properTastingNotes);
      }
    }
    
    // Try flavor descriptors
    if (!properTastingNotes && vivinoData.taste?.flavor && Array.isArray(vivinoData.taste.flavor)) {
      const flavorNotes = vivinoData.taste.flavor
        .filter(f => f && f.primary_keyword && typeof f.primary_keyword === 'string')
        .map(f => f.primary_keyword)
        .slice(0, 6);
      if (flavorNotes.length > 0) {
        properTastingNotes = `Flavors of ${flavorNotes.join(', ')}`;
        console.log("Found flavors:", properTastingNotes);
      }
    }
    
    // Try professional reviews as fallback
    if (!properTastingNotes && vivinoData.reviews && Array.isArray(vivinoData.reviews)) {
      const professionalReview = vivinoData.reviews
        .find(r => r.note && r.note.length > 50 && r.language === 'en');
      if (professionalReview) {
        properTastingNotes = professionalReview.note.substring(0, 200).trim();
        if (properTastingNotes.length === 200) {
          properTastingNotes += '...';
        }
        console.log("Found review excerpt:", properTastingNotes);
      }
    }

    if (properTastingNotes) {
      // Update the wine with proper descriptive tasting notes
      const updateResult = await pool.query(`
        UPDATE wines SET
          tasting_notes = $1
        WHERE id = 285
      `, [properTastingNotes]);

      console.log("\n=== PROPER TASTING NOTES UPDATE ===");
      console.log("New tasting notes:", properTastingNotes);
      console.log("Rows updated:", updateResult.rowCount);
      
      if (updateResult.rowCount > 0) {
        console.log("✓ SUCCESS: Wine updated with proper descriptive tasting notes");
      }
    } else {
      console.log("✗ No proper descriptive tasting notes found in Vivino data");
      
      // Show what data is available
      console.log("\nAvailable data structure:");
      console.log("Highlights:", vivinoData.highlights);
      console.log("Flavors:", vivinoData.taste?.flavor?.slice(0, 3));
      console.log("Reviews count:", vivinoData.reviews?.length || 0);
    }

  } catch (error) {
    console.error("Error extracting tasting notes:", error);
  } finally {
    await pool.end();
  }
}

extractProperTastingNotes();
