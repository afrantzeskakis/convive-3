/**
 * Trace the exact search query that produced the "Malbec" result
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function traceSearchQuery() {
  console.log('🔍 TRACING EXACT SEARCH QUERY THAT RETURNED "MALBEC"');
  console.log('=' .repeat(70));
  
  try {
    // Get the wine that was just enriched (the one that returned "Malbec")
    const enrichedWines = await sql`
      SELECT id, producer, wine_name, vintage, varietals
      FROM wines 
      WHERE verified = true AND verified_source = 'vivino'
      ORDER BY id DESC
      LIMIT 1
    `;
    
    if (enrichedWines.length === 0) {
      console.log('❌ No recently enriched wines found');
      return;
    }
    
    const wine = enrichedWines[0];
    
    console.log('🍷 WINE DATA FROM DATABASE:');
    console.log(`   ID: ${wine.id}`);
    console.log(`   Producer: "${wine.producer}"`);
    console.log(`   Wine Name: "${wine.wine_name}"`);
    console.log(`   Vintage: "${wine.vintage}"`);
    console.log(`   Varietals: "${wine.varietals}"`);
    
    // Reconstruct the exact search query that was sent
    const searchQuery = `${wine.producer || ''} ${wine.wine_name} ${wine.vintage || ''}`.trim();
    
    console.log('\n🔍 RECONSTRUCTED SEARCH QUERY:');
    console.log(`   Exact query sent to API: "${searchQuery}"`);
    
    console.log('\n📋 ANALYSIS:');
    console.log('-' .repeat(70));
    
    // Check if this is a scanning issue or API issue
    if (!wine.producer || wine.producer === '' || wine.producer === 'N/A') {
      console.log('🚨 WINE LIST SCANNING ISSUE: Producer name missing or empty');
      console.log('   → Problem: Wine list parser not extracting producer correctly');
    }
    
    if (!wine.wine_name || wine.wine_name === '' || wine.wine_name === 'N/A') {
      console.log('🚨 WINE LIST SCANNING ISSUE: Wine name missing or empty');
      console.log('   → Problem: Wine list parser not extracting wine name correctly');
    }
    
    if (searchQuery.trim() === '' || searchQuery.length < 5) {
      console.log('🚨 SEARCH QUERY TOO VAGUE: Query too short or empty');
      console.log('   → This would explain generic "Malbec" result');
    } else {
      console.log('✅ SEARCH QUERY LOOKS REASONABLE: Problem likely with API matching');
    }
    
    console.log('\n🎯 ROOT CAUSE DETERMINATION:');
    if (searchQuery.includes('Screaming Eagle')) {
      console.log('→ API SEARCH ISSUE: Good wine name but API not finding specific bottle');
    } else {
      console.log('→ WINE LIST SCANNING ISSUE: Original wine list not parsed correctly');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

traceSearchQuery();