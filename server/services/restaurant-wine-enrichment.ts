/**
 * Restaurant Wine Enrichment Service
 * Knowledge-based wine enrichment using GPT-4o training data with low temperature
 */

import OpenAI from 'openai';

// Initialize OpenAI with the API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 5-Stage Enhanced Wine Enrichment Process
 * Stage 1: Initial Research and Basic Profile
 * Stage 2: Deep Terroir and Production Analysis  
 * Stage 3: Advanced Tasting Profile Development
 * Stage 4: Comprehensive Food Pairing and Service Analysis
 * Stage 5: Final Integration and Quality Validation
 */

/**
 * Stage 1: Initial Research and Basic Profile
 */
async function stage1InitialResearch(wine) {
  const prompt = `As a Master Sommelier, conduct comprehensive initial research for this wine. Provide extensive detail in each section.

Wine: ${wine.wine_name}
Producer: ${wine.producer}
Vintage: ${wine.vintage}
Region: ${wine.region}
Type: ${wine.wine_type}

Provide detailed Stage 1 research in JSON format:
{
  "wine_rating": "Professional rating out of 100 from established critics with detailed commentary (Wine Spectator, Robert Parker, James Suckling, Jancis Robinson if known)",
  "producer_reputation": "Comprehensive 8-10 sentence analysis of the producer's complete history, founding story, generational changes, winemaking philosophy, vineyard practices, technological innovations, awards, market position, and distinctive approach to viticulture",
  "vintage_conditions": "Detailed 6-8 sentence analysis of the specific vintage including weather patterns, seasonal variations, harvest conditions, rainfall, temperature fluctuations, disease pressure, yield variations, and how these factors influenced wine quality and style",
  "basic_profile": "Extensive 8-10 sentence initial wine profile covering complete style analysis, quality tier assessment, structural characteristics, complexity level, aging potential, market positioning, collector interest, and comparative context within the appellation"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "You are a Master Sommelier with 30+ years experience writing comprehensive wine analyses. CRITICAL REQUIREMENT: You MUST write EXACTLY the number of sentences specified for each field. Count carefully - each sentence must end with a period. Write detailed, professional analysis with comprehensive coverage. Minimum 1000+ characters per major field. Do not summarize or abbreviate - provide full expert analysis." 
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 4000
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Stage 2: Deep Terroir and Production Analysis
 */
async function stage2TerroirAnalysis(wine, stage1Data) {
  const prompt = `Building on Stage 1 research, now provide comprehensive terroir and production analysis for this wine.

Wine: ${wine.wine_name} by ${wine.producer} (${wine.vintage})
Producer Context: ${stage1Data.producer_reputation}
Vintage Context: ${stage1Data.vintage_conditions}

Provide detailed Stage 2 terroir analysis in JSON format:
{
  "terroir_characteristics": "Write EXACTLY 8 distinct sentences for terroir analysis. SENTENCE 1: Describe geological substrate composition and soil drainage patterns. SENTENCE 2: Analyze microclimate variations and elevation effects on grape development. SENTENCE 3: Detail slope orientation and seasonal temperature fluctuation impacts. SENTENCE 4: Examine rainfall distribution and wind exposure patterns. SENTENCE 5: Discuss rootstock selection and vine density decisions. SENTENCE 6: Evaluate canopy management practices and neighboring vineyard influences. SENTENCE 7: Explain how terroir elements shape aromatic profile development. SENTENCE 8: Conclude with terroir's impact on structural development and flavor complexity.",
  "winemaking_techniques": "Write EXACTLY 8 distinct sentences for winemaking analysis. SENTENCE 1: Detail harvest timing strategies and sorting procedures. SENTENCE 2: Describe fermentation vessel selection and temperature control protocols. SENTENCE 3: Analyze maceration duration and punch-down schedules. SENTENCE 4: Examine malolactic fermentation decisions and aging vessel choices. SENTENCE 5: Detail oak origins, toast levels, and lees contact duration. SENTENCE 6: Discuss blending philosophy and clarification methods. SENTENCE 7: Evaluate bottling timing and final production decisions. SENTENCE 8: Conclude with how winemaking impacts final wine character and aging potential.",
  "what_makes_special": "Write EXACTLY 8 distinct sentences explaining what makes this wine exceptional. SENTENCE 1: Describe unique terroir expressions and vineyard site characteristics. SENTENCE 2: Detail innovative winemaking approaches and producer expertise. SENTENCE 3: Explain historical significance and appellation status. SENTENCE 4: Analyze rarity factors and production limitations. SENTENCE 5: Detail critical acclaim and professional recognition. SENTENCE 6: Establish benchmark status among regional peers. SENTENCE 7: Assess collector demand and investment potential. SENTENCE 8: Conclude why this wine stands apart from competitors."
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 2500
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Stage 3: Advanced Tasting Profile Development
 */
async function stage3TastingProfile(wine, stage1Data, stage2Data) {
  const prompt = `Develop comprehensive tasting analysis building on previous research. CRITICAL ACCURACY REQUIREMENT: Only describe characteristics authentic to this wine's actual grape varieties and region.

Wine: ${wine.wine_name} by ${wine.producer} (${wine.vintage})
Grape Varieties: ${wine.varietals || 'Determine from wine name/region'}
Basic Profile: ${stage1Data.basic_profile}
Terroir Influence: ${stage2Data.terroir_characteristics}

MANDATORY GRAPE ACCURACY CHECK:
- Champagne wines (Krug, Dom Pérignon, etc.) = ONLY Chardonnay, Pinot Noir, Pinot Meunier characteristics
- Barolo wines = ONLY Nebbiolo characteristics  
- Bordeaux wines = ONLY Cabernet Sauvignon, Merlot, Cabernet Franc characteristics
- Burgundy wines = ONLY Pinot Noir, Chardonnay, Gamay, Aligoté, or other authorized Burgundy varietals
- Chianti/Sangiovese wines = ONLY Sangiovese characteristics
- Rioja wines = ONLY Tempranillo characteristics (with minor Garnacha/Graciano)
- Syrah/Shiraz wines = ONLY Syrah characteristics
- Riesling wines = ONLY Riesling characteristics
- Brunello wines = ONLY Sangiovese characteristics
- Port wines = ONLY Portuguese varieties (Touriga Nacional, Tinta Roriz, etc.)
- Sauternes wines = ONLY Sémillon, Sauvignon Blanc, Muscadelle characteristics
- Never describe grape characteristics that don't match the actual wine type

Create detailed Stage 3 tasting analysis in JSON format:
{
  "general_guest_experience": "Write EXACTLY 8 distinct sentences for comprehensive guest experience description. SENTENCE 1: Describe visual appearance including color depth and clarity. SENTENCE 2: Detail aromatic profile with intensity and primary fruit characteristics. SENTENCE 3: Analyze palate entry with texture and first flavor impressions. SENTENCE 4: Examine mid-palate development and structural components. SENTENCE 5: Assess tannin integration and alcohol balance. SENTENCE 6: Describe flavor persistence and complexity layers. SENTENCE 7: Detail finish length and lingering characteristics. SENTENCE 8: Conclude with overall quality assessment and regional comparison.",
  "aroma_notes": "Write EXACTLY 8 distinct sentences for aromatic analysis. CRITICAL: Only describe characteristics authentic to this wine's actual grape varieties (Champagne=Chardonnay/Pinot/Meunier, Barolo=Nebbiolo, Bordeaux=Cabernet/Merlot/Franc, Burgundy=Pinot Noir/Chardonnay/Gamay/Aligoté, Chianti=Sangiovese, Rioja=Tempranillo, Syrah=Syrah only, Riesling=Riesling only). SENTENCE 1: Describe primary fruit aromatics authentic to the actual grape varieties used. SENTENCE 2: Detail floral bouquet characteristics specific to this wine type. SENTENCE 3: Identify spice notes and mineral elements authentic to the region. SENTENCE 4: Analyze oak integration appropriate to this wine style. SENTENCE 5: Examine fermentation aromatics specific to this production method. SENTENCE 6: Describe aging characteristics authentic to this wine category. SENTENCE 7: Track aromatic intensity using varied language (avoid 'dominated by'). SENTENCE 8: Compare to authentic regional peers with accurate descriptors.",
  "flavor_notes": "Write EXACTLY 8 distinct sentences for flavor profile analysis. MANDATORY: Only describe flavors authentic to this wine's actual grape varieties - never mix characteristics from different wine types. Verify grape accuracy: Burgundy=Pinot Noir/Chardonnay/Gamay/Aligoté/authorized Burgundy varietals, Chianti=Sangiovese, Rioja=Tempranillo, Syrah=Syrah, Riesling=Riesling, Brunello=Sangiovese, Port=Portuguese varieties, Sauternes=Sémillon/Sauvignon Blanc. SENTENCE 1: Describe primary fruit flavors authentic to the actual grapes used in this wine. SENTENCE 2: Identify secondary flavors specific to this wine's production method. SENTENCE 3: Detail aging flavors appropriate to this wine style and category. SENTENCE 4: Rate flavor intensity using varied language (avoid 'dominated by' phrases). SENTENCE 5: Analyze flavor expression using authentic descriptors for this wine type. SENTENCE 6: Examine characteristics specific to this wine's vintage and region. SENTENCE 7: Project evolution based on this wine's actual aging potential. SENTENCE 8: Conclude with flavor signatures authentic to this specific producer and wine style.",
  "body_description": "Write EXACTLY 8 distinct sentences for structural analysis. SENTENCE 1: Analyze acidity levels and pH implications. SENTENCE 2: Describe tannin structure including grain size and integration. SENTENCE 3: Assess alcohol perception and heat balance. SENTENCE 4: Detail glycerol presence and mouthfeel richness. SENTENCE 5: Examine mineral backbone and overall body weight classification. SENTENCE 6: Track texture progression from entry to finish. SENTENCE 7: Evaluate structural balance and aging potential indicators. SENTENCE 8: Compare structure to regional norms with food pairing considerations."
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "You are a Master Sommelier with 30+ years experience. CRITICAL: You MUST write the EXACT number of sentences requested for each field - no more, no less. Count each sentence ending with a period carefully. Each sentence must be a complete, detailed sentence with professional wine analysis. Write comprehensive paragraphs. Do not use abbreviations, bullet points, or numbered lists. Every response must contain full sentences that provide detailed wine expertise." 
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 4000
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Stage 4: Comprehensive Food Pairing and Service Analysis
 */
async function stage4ServiceAnalysis(wine, stage3Data) {
  const prompt = `Create comprehensive service and pairing analysis for this wine.

Wine: ${wine.wine_name} by ${wine.producer} (${wine.vintage})
Guest Experience: ${stage3Data.general_guest_experience}
Body Analysis: ${stage3Data.body_description}

Provide detailed Stage 4 service analysis in JSON format:
{
  "food_pairing": "Write EXACTLY 8 distinct sentences for comprehensive food pairing analysis. SENTENCE 1: Recommend specific main dishes with optimal preparation methods. SENTENCE 2: Suggest protein selections and cooking techniques that complement the wine structure. SENTENCE 3: Analyze sauce and seasoning compatibility with wine characteristics. SENTENCE 4: Identify regional cuisine matches based on terroir harmony. SENTENCE 5: Examine texture contrasts and weight matching principles. SENTENCE 6: Discuss tannin-protein and acidity-fat interaction dynamics. SENTENCE 7: Provide specific cheese recommendations and dessert pairing possibilities. SENTENCE 8: Conclude with signature pairings that showcase this wine's unique qualities.",
  "serving_temp": "Write EXACTLY 8 distinct sentences for serving temperature analysis. SENTENCE 1: Recommend optimal serving temperature ranges for this wine style. SENTENCE 2: Explain seasonal adjustments and cellar temperature considerations. SENTENCE 3: Detail temperature effects on aromatic expression and flavor release. SENTENCE 4: Provide cooling methods and timing recommendations. SENTENCE 5: Discuss serving progression strategies for multiple pours. SENTENCE 6: Analyze glassware temperature considerations and warming effects. SENTENCE 7: Compare service temperatures for different dining contexts. SENTENCE 8: Conclude with specific temperature optimization guidance based on wine age.",
  "aging_potential": "Write EXACTLY 8 distinct sentences for cellaring analysis. SENTENCE 1: Define optimal drinking windows with specific timeline ranges. SENTENCE 2: Detail cellaring condition requirements including temperature and humidity. SENTENCE 3: Describe evolution characteristics through different aging phases. SENTENCE 4: Identify peak maturity indicators and recognition signs. SENTENCE 5: Analyze storage position recommendations and cork monitoring. SENTENCE 6: Discuss bottle variation expectations and provenance importance. SENTENCE 7: Evaluate drinking versus holding decision factors. SENTENCE 8: Conclude with detailed aging transformation predictions for structure and flavors."
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 2500
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Stage 5: Final Integration and Quality Validation
 */
async function stage5FinalIntegration(wine, allStages) {
  // Integrate all stages into final comprehensive wine profile
  const finalData = {
    wine_rating: allStages.stage1.wine_rating,
    general_guest_experience: allStages.stage3.general_guest_experience,
    flavor_notes: allStages.stage3.flavor_notes,
    aroma_notes: allStages.stage3.aroma_notes,
    what_makes_special: allStages.stage2.what_makes_special,
    body_description: allStages.stage3.body_description,
    food_pairing: allStages.stage4.food_pairing,
    serving_temp: allStages.stage4.serving_temp,
    aging_potential: allStages.stage4.aging_potential
  };

  // Ensure wine rating is within valid range
  if (finalData.wine_rating) {
    const numericRating = parseFloat(finalData.wine_rating);
    if (!isNaN(numericRating)) {
      finalData.wine_rating = Math.max(85, Math.min(100, numericRating));
    } else {
      finalData.wine_rating = 90; // Default for premium wines
    }
  }

  console.log(`✓ 5-Stage enrichment completed for ${wine.wine_name} - Rating: ${finalData.wine_rating}`);
  return finalData;
}

/**
 * Main enrichment function using 5-stage process
 */
async function enrichRestaurantWine(wine) {
  try {
    console.log(`Starting 5-stage enrichment for: ${wine.wine_name} by ${wine.producer} (${wine.vintage})`);
    
    // Execute all 5 stages
    const stage1 = await stage1InitialResearch(wine);
    console.log(`✓ Stage 1 complete - Initial research`);
    
    const stage2 = await stage2TerroirAnalysis(wine, stage1);
    console.log(`✓ Stage 2 complete - Terroir analysis`);
    
    const stage3 = await stage3TastingProfile(wine, stage1, stage2);
    console.log(`✓ Stage 3 complete - Tasting profile`);
    
    const stage4 = await stage4ServiceAnalysis(wine, stage3);
    console.log(`✓ Stage 4 complete - Service analysis`);
    
    const finalData = await stage5FinalIntegration(wine, { stage1, stage2, stage3, stage4 });
    console.log(`✓ Stage 5 complete - Final integration`);
    
    return finalData;

  } catch (error) {
    console.error(`Error in 5-stage enrichment for ${wine.wine_name}:`, error);
    
    // Reset wine status to pending if it failed during processing
    try {
      const { db } = await import('../db.js');
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`
        UPDATE restaurant_wines_isolated 
        SET enrichment_status = 'pending', 
            enrichment_started_at = NULL
        WHERE id = ${wine.id}
      `);
      console.log(`Reset wine ${wine.id} to pending status after error`);
    } catch (resetError) {
      console.error('Failed to reset wine status after error:', resetError);
    }
    
    throw new Error(`5-stage wine enrichment failed: ${error.message}`);
  }
}

/**
 * Batch process multiple wines for enrichment
 * Handles rate limiting and error recovery
 */
async function batchEnrichWines(wines, maxConcurrent = 3) {
  const results = [];
  const errors = [];
  
  console.log(`Starting batch enrichment for ${wines.length} wines`);
  
  for (let i = 0; i < wines.length; i += maxConcurrent) {
    const batch = wines.slice(i, i + maxConcurrent);
    const batchPromises = batch.map(async (wine) => {
      try {
        const enrichmentData = await enrichRestaurantWine(wine);
        return { wine, enrichmentData, success: true };
      } catch (error) {
        console.error(`Failed to enrich wine ${wine.wine_name}:`, error);
        return { wine, error: error.message, success: false };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(result => {
      if (result.success) {
        results.push(result);
      } else {
        errors.push(result);
      }
    });
    
    // Rate limiting delay between batches
    if (i + maxConcurrent < wines.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`Batch enrichment completed: ${results.length} successful, ${errors.length} failed`);
  return { results, errors };
}

/**
 * Export the enrichment function
 */
export { enrichRestaurantWine, batchEnrichWines };