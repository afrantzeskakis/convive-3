/**
 * Fix verified wine data extraction to use actual Vivino characteristics
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function extractDetailedFlavorProfile(flavorArray) {
  if (!Array.isArray(flavorArray)) return '';
  
  const flavorDescriptors = [];
  
  flavorArray.forEach(flavorGroup => {
    if (flavorGroup.primary_keywords && Array.isArray(flavorGroup.primary_keywords)) {
      // Get the top 3 most mentioned flavors from each group
      const topFlavors = flavorGroup.primary_keywords
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(keyword => keyword.name);
      
      flavorDescriptors.push(...topFlavors);
    }
  });
  
  return flavorDescriptors.slice(0, 8).join(', '); // Top 8 most prominent flavors
}

function createDetailedTastingNotes(vivinoData) {
  const { summary, taste } = vivinoData;
  
  // Extract taste profile characteristics
  const profile = summary.taste_profile || {};
  const characteristics = [];
  
  if (profile.bold) characteristics.push('bold');
  if (profile.smooth) characteristics.push('smooth');
  if (profile.dry) characteristics.push('dry');
  if (profile.soft) characteristics.push('soft');
  if (profile.tannic) characteristics.push('tannic');
  if (profile.acidic) characteristics.push('acidic');
  
  // Get structure data
  const structure = taste?.structure || {};
  const acidity = structure.acidity ? Math.round(structure.acidity * 10) / 10 : null;
  const tannin = structure.tannin ? Math.round(structure.tannin * 10) / 10 : null;
  const intensity = structure.intensity ? Math.round(structure.intensity * 10) / 10 : null;
  
  // Build comprehensive tasting notes
  let tastingNotes = `This ${summary.type?.toLowerCase() || 'wine'} displays ${characteristics.join(' and ')} characteristics`;
  
  if (intensity) {
    tastingNotes += ` with ${intensity >= 4 ? 'high' : intensity >= 3 ? 'medium' : 'moderate'} intensity`;
  }
  
  if (summary.flavors && summary.flavors.length > 0) {
    tastingNotes += `. Primary flavor profile showcases ${summary.flavors.slice(0, 4).join(', ').toLowerCase()}`;
  }
  
  if (acidity && tannin) {
    tastingNotes += `. Structure shows ${acidity >= 3 ? 'elevated' : 'moderate'} acidity and ${tannin >= 3 ? 'substantial' : 'gentle'} tannins`;
  }
  
  tastingNotes += `. Verified rating of ${summary.rating}/5 from ${summary.rating_count} professional reviews.`;
  
  return tastingNotes;
}

function createAromaticProfile(flavorArray, summaryFlavors) {
  if (!Array.isArray(flavorArray)) return 'Complex aromatic profile';
  
  // Find floral and aromatic groups
  const floralGroup = flavorArray.find(f => f.group === 'floral');
  const spiceGroup = flavorArray.find(f => f.group === 'spices');
  const fruitGroups = flavorArray.filter(f => f.group.includes('fruit'));
  
  let aromatic = 'Aromatic profile reveals';
  
  if (floralGroup?.primary_keywords?.length > 0) {
    const florals = floralGroup.primary_keywords.slice(0, 2).map(k => k.name).join(' and ');
    aromatic += ` delicate ${florals} notes`;
  }
  
  if (spiceGroup?.primary_keywords?.length > 0) {
    const spices = spiceGroup.primary_keywords.slice(0, 2).map(k => k.name).join(' and ');
    aromatic += aromatic.includes('notes') ? `, complemented by ${spices}` : ` ${spices} characteristics`;
  }
  
  if (fruitGroups.length > 0 && summaryFlavors?.length > 0) {
    aromatic += ` with underlying ${summaryFlavors.slice(0, 2).join(' and ').toLowerCase()} aromatics`;
  }
  
  return aromatic + '.';
}

function createBodyDescription(structure, tasteProfile, rating) {
  if (!structure) return 'Well-structured wine';
  
  const intensity = structure.intensity || 0;
  const tannin = structure.tannin || 0;
  const acidity = structure.acidity || 0;
  
  let body = '';
  
  if (intensity >= 4) {
    body = 'Full-bodied with commanding presence';
  } else if (intensity >= 3) {
    body = 'Medium to full-bodied with substantial weight';
  } else {
    body = 'Medium-bodied with elegant proportions';
  }
  
  if (tannin >= 3) {
    body += ', structured tannins';
  } else if (tannin >= 2) {
    body += ', balanced tannins';
  } else {
    body += ', gentle tannins';
  }
  
  if (acidity >= 3) {
    body += ' and vibrant acidity';
  } else if (acidity >= 2) {
    body += ' and moderate acidity';
  }
  
  if (tasteProfile?.smooth) {
    body += '. Smooth texture';
  }
  
  if (rating >= 4.2) {
    body += ' showcasing exceptional quality and complexity.';
  } else if (rating >= 4.0) {
    body += ' demonstrating excellent balance and finesse.';
  } else {
    body += ' offering pleasant drinking characteristics.';
  }
  
  return body;
}

async function fixVerifiedWineData() {
  try {
    console.log('Fixing verified wine data with detailed Vivino characteristics...');
    
    // Get wines that were enriched but have poor data extraction
    const result = await pool.query(`
      SELECT id, wine_name, producer, vintage, verified_source, vivino_rating
      FROM wines 
      WHERE verified_source = 'Vivino' 
      AND (flavor_notes LIKE '%object Object%' OR tasting_notes LIKE '%displays authentic characteristics%')
      ORDER BY id DESC
      LIMIT 5
    `);

    console.log(`Found ${result.rows.length} wines with poor data extraction to fix`);
    
    for (const wine of result.rows) {
      console.log(`\nRe-processing: ${wine.wine_name} by ${wine.producer || 'Unknown'}`);
      
      const searchQuery = `${wine.producer || ''} ${wine.wine_name} ${wine.vintage || ''}`.trim();
      
      const apifyResponse = await fetch('https://api.apify.com/v2/acts/canadesk~vivino/run-sync-get-dataset-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`
        },
        body: JSON.stringify({
          searchTerms: [searchQuery],
          maxItems: 1,
          proxyConfiguration: { useApifyProxy: true }
        })
      });

      if (!apifyResponse.ok) {
        console.error(`API error for ${wine.wine_name}:`, apifyResponse.status);
        continue;
      }

      const items = await apifyResponse.json();
      
      if (!items || items.length === 0) {
        console.log(`No data found for: ${searchQuery}`);
        continue;
      }

      const vivinoItem = items[0];
      const { wine: wineData, winery, region, country, taste, summary, highlights } = vivinoItem;
      
      // Extract detailed characteristics using proper parsing
      const detailedFlavors = extractDetailedFlavorProfile(taste?.flavor || []);
      const tastingNotes = createDetailedTastingNotes(vivinoItem);
      const aromaticProfile = createAromaticProfile(taste?.flavor || [], summary?.flavors || []);
      const bodyDescription = createBodyDescription(taste?.structure, summary?.taste_profile, summary?.rating);
      
      // Extract food pairings properly
      const foodPairings = summary?.pairings ? summary.pairings.join(', ') : 'Versatile pairing options';
      
      // Create comprehensive description from highlights
      let enhancedDescription = `Verified Vivino data (${summary?.rating}/5 from ${summary?.rating_count} reviews)`;
      if (highlights && highlights.length > 0) {
        enhancedDescription += `. ${highlights[0].message}`;
      }
      enhancedDescription += `. ${summary?.type} wine from ${summary?.country || country?.name || 'premium region'}.`;
      
      // Update wine with properly extracted data
      await pool.query(`
        UPDATE wines SET 
          tasting_notes = $1,
          flavor_notes = $2,
          aroma_notes = $3,
          body_description = $4,
          food_pairing = $5,
          description_enhanced = $6,
          wine_type = COALESCE(wine_type, $7)
        WHERE id = $8
      `, [
        tastingNotes,
        detailedFlavors,
        aromaticProfile,
        bodyDescription,
        foodPairings,
        enhancedDescription,
        summary?.type?.toLowerCase() || 'red',
        wine.id
      ]);

      console.log(`✓ Fixed data extraction for: ${wine.wine_name}`);
      console.log(`  Flavors: ${detailedFlavors.substring(0, 60)}...`);
      console.log(`  Tasting: ${tastingNotes.substring(0, 80)}...`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Show improved results
    const improvedResult = await pool.query(`
      SELECT wine_name, producer, vintage, vivino_rating,
             SUBSTRING(tasting_notes, 1, 100) as tasting_preview,
             SUBSTRING(flavor_notes, 1, 80) as flavor_preview,
             SUBSTRING(aroma_notes, 1, 60) as aroma_preview
      FROM wines 
      WHERE verified_source = 'Vivino'
      AND tasting_notes NOT LIKE '%displays authentic characteristics%'
      ORDER BY id DESC 
      LIMIT 5
    `);

    console.log(`\n=== WINES WITH IMPROVED VIVINO DATA EXTRACTION ===`);
    improvedResult.rows.forEach((wine, index) => {
      console.log(`\n${index + 1}. ${wine.wine_name} by ${wine.producer || 'Unknown'} (${wine.vintage || 'N/A'})`);
      console.log(`   Rating: ${wine.vivino_rating}/5`);
      console.log(`   Tasting: ${wine.tasting_preview}...`);
      console.log(`   Flavors: ${wine.flavor_preview}...`);
      console.log(`   Aromatics: ${wine.aroma_preview}...`);
    });

  } catch (error) {
    console.error('Error fixing wine data:', error);
  } finally {
    await pool.end();
  }
}

fixVerifiedWineData();