/**
 * Test corrected Vivino data extraction to fix "[object Object]" issues
 */

import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

async function testCorrectedExtraction() {
  try {
    console.log("Testing corrected Vivino data extraction...");

    const searchQuery = "Antinori Tignanello 2020";
    
    const run = await apifyClient.actor("canadesk/vivino").call({
      search: searchQuery,
      maxItems: 1
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      console.log("No results found");
      return;
    }

    const vivinoData = items[0];

    // Test corrected tasting notes extraction
    let tastingNotes = null;
    
    // Try wine highlights first
    if (vivinoData.highlights && Array.isArray(vivinoData.highlights)) {
      const highlights = vivinoData.highlights
        .filter(h => h && typeof h === 'string')
        .slice(0, 3);
      if (highlights.length > 0) {
        tastingNotes = highlights.join(', ');
        console.log("✓ Extracted from highlights:", tastingNotes);
      }
    }
    
    // Try taste structure with proper type checking
    if (!tastingNotes && vivinoData.taste?.structure) {
      const structure = vivinoData.taste.structure;
      const structureNotes = [];
      
      // Safely extract values, ensuring they're not objects
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
        console.log("✓ Extracted from structure:", tastingNotes);
      }
    }
    
    // Try flavors as fallback
    if (!tastingNotes && vivinoData.taste?.flavor && Array.isArray(vivinoData.taste.flavor)) {
      const flavorNotes = vivinoData.taste.flavor
        .filter(f => f && f.primary_keyword)
        .map(f => f.primary_keyword)
        .slice(0, 4);
      if (flavorNotes.length > 0) {
        tastingNotes = flavorNotes.join(', ');
        console.log("✓ Extracted from flavors:", tastingNotes);
      }
    }

    const extractedData = {
      wine_id: vivinoData.wine?.id?.toString() || null,
      rating: vivinoData.summary?.rating?.toString() || null,
      wine_type: vivinoData.wine?.style?.name || 'Wine',
      tasting_notes: tastingNotes,
      region: vivinoData.wine?.region?.name || null,
      country: vivinoData.wine?.region?.country?.name || null,
      wine_url: vivinoData.url || null
    };

    console.log("\n=== CORRECTED EXTRACTION RESULTS ===");
    console.log("Wine ID:", extractedData.wine_id);
    console.log("Rating:", extractedData.rating);
    console.log("Wine Type:", extractedData.wine_type);
    console.log("Tasting Notes:", extractedData.tasting_notes);
    console.log("Region:", extractedData.region);
    console.log("Country:", extractedData.country);

    if (extractedData.tasting_notes && extractedData.tasting_notes !== '[object Object]') {
      console.log("\n✓ SUCCESS: Proper tasting notes extracted");
      return extractedData;
    } else {
      console.log("\n✗ ISSUE: Tasting notes extraction needs improvement");
      return null;
    }

  } catch (error) {
    console.error("Error testing extraction:", error);
    return null;
  }
}

testCorrectedExtraction();
