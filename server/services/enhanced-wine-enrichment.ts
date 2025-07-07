import OpenAI from 'openai';
import { restaurantWineStorage } from '../storage/restaurant-wine-storage';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Enhanced Wine Enrichment with Unique Descriptors
 * Addresses repetitive content issues by using more natural prompting
 */

/**
 * Stage 1: Wine Identity and Authentication
 */
async function authenticateWine(wine: any) {
  const prompt = `You are analyzing this wine for a fine dining establishment. Focus on authentic characteristics.

Wine: ${wine.wine_name}
Producer: ${wine.producer || 'Unknown'}
Region: ${wine.region || 'Unknown'}
Vintage: ${wine.vintage || 'NV'}

Provide this wine's authentic profile in JSON format. Avoid generic wine terminology. Write naturally about what makes this specific wine distinctive:

{
  "basic_profile": "Describe this wine's identity, producer reputation, and regional significance. What makes this producer or vineyard unique? What is their winemaking philosophy? How does this wine represent its terroir? Write as flowing paragraphs, not structured lists."
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 1500
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Stage 2: Terroir and Unique Characteristics  
 */
async function analyzeTerroirCharacteristics(wine: any, stage1Data: any) {
  const prompt = `Building on the wine identity, now focus on what makes this wine special and distinctive.

Wine: ${wine.wine_name} from ${wine.region}
Producer Context: ${stage1Data.basic_profile}

IMPORTANT: Never use phrases like "characteristic of [grape variety]", "true to the [grape]", "typical of [varietal]", or "authentic to [grape variety]". Focus on specific terroir, winemaking techniques, and unique qualities instead.

Write about the unique aspects of this wine:

{
  "terroir_characteristics": "Explain the specific terroir influences - soil types, climate, elevation, aspect. How do these factors create unique characteristics in this wine compared to neighbors? What makes this vineyard site special?",
  "what_makes_special": "What sets this wine apart from others in its category? Producer innovations, vineyard practices, winemaking techniques, historical significance, or unique grape clones. Focus on distinctive qualities rather than generic wine terms."
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.25,
    max_tokens: 2000
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Stage 3: Sensory Profile with Authentic Descriptors
 */
async function createSensoryProfile(wine: any, stage1Data: any, stage2Data: any) {
  const prompt = `Create an authentic tasting profile for this wine. Avoid formulaic wine language.

Wine: ${wine.wine_name}
Terroir Context: ${stage2Data.terroir_characteristics}
Special Qualities: ${stage2Data.what_makes_special}

CRITICAL: Never use phrases like "characteristic of [grape variety]", "true to the [grape]", "typical of [varietal]", or "authentic to [grape variety]". Focus on specific flavors, aromas, and sensations.

Write naturally about how this wine actually tastes and presents. Use specific, evocative language rather than generic wine terms:

{
  "general_guest_experience": "Describe the complete sensory experience from opening to finish. How does this wine present itself? What would a guest notice and appreciate? Write about the wine's personality and character.",
  "aroma_notes": "Describe the aromatics using specific, memorable descriptors. What scents emerge? How do they evolve? Avoid 'primary/secondary' language - just describe what you smell.",
  "flavor_notes": "Detail the flavor journey from first sip to finish. Use evocative language that helps someone understand this wine's taste profile. What flavors stand out? How do they interact?",
  "body_description": "Describe the wine's physical presence in the mouth. How does it feel? What's the weight, texture, structure? How does it move across the palate?"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 3000
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Stage 4: Service and Pairing Recommendations
 */
async function createServiceRecommendations(wine: any, stage3Data: any) {
  const prompt = `Provide practical service guidance for this wine in a restaurant setting.

Wine: ${wine.wine_name}
Sensory Profile: ${stage3Data.general_guest_experience}

Focus on actionable advice for service staff and specific pairing ideas:

{
  "food_pairing": "Suggest specific dishes and ingredients that complement this wine. What cooking methods work best? Which cuisines? Give concrete examples servers can recommend to guests.",
  "serving_temp": "What's the optimal service temperature and why? How should staff handle this wine - decanting, glassware, timing considerations?",
  "aging_potential": "Should guests drink this now or cellar it? What changes can they expect over time? Practical storage advice if applicable."
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.25,
    max_tokens: 2500
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Enhanced enrichment process for individual wines
 */
export async function enhanceWineNaturally(wineId: number): Promise<boolean> {
  try {
    console.log(`🍇 Starting enhanced enrichment for wine ID: ${wineId}`);
    
    // Get wine data
    const wine = await restaurantWineStorage.getWineById(wineId);
    if (!wine) {
      console.error(`Wine not found: ${wineId}`);
      return false;
    }

    // Mark as processing
    await restaurantWineStorage.updateWineEnrichment(wineId, {
      enrichment_status: 'processing',
      enrichment_started_at: new Date()
    });

    // Stage 1: Authentication and Identity
    const stage1Data = await authenticateWine(wine);
    console.log(`Stage 1 complete for: ${wine.wine_name}`);

    // Stage 2: Terroir Analysis  
    const stage2Data = await analyzeTerroirCharacteristics(wine, stage1Data);
    console.log(`Stage 2 complete for: ${wine.wine_name}`);

    // Stage 3: Sensory Profile
    const stage3Data = await createSensoryProfile(wine, stage1Data, stage2Data);
    console.log(`Stage 3 complete for: ${wine.wine_name}`);

    // Stage 4: Service Recommendations
    const stage4Data = await createServiceRecommendations(wine, stage3Data);
    console.log(`Stage 4 complete for: ${wine.wine_name}`);

    // Combine all data
    const enrichmentData = {
      general_guest_experience: stage3Data.general_guest_experience,
      flavor_notes: stage3Data.flavor_notes,
      aroma_notes: stage3Data.aroma_notes,
      what_makes_special: stage2Data.what_makes_special,
      body_description: stage3Data.body_description,
      food_pairing: stage4Data.food_pairing,
      serving_temp: stage4Data.serving_temp,
      aging_potential: stage4Data.aging_potential,
      enrichment_status: 'completed',
      enrichment_completed_at: new Date()
    };

    // Save enriched data
    await restaurantWineStorage.updateWineEnrichment(wineId, enrichmentData);
    console.log(`✅ Enhanced enrichment completed for: ${wine.wine_name}`);
    
    return true;
  } catch (error) {
    console.error(`Enhanced enrichment failed for wine ${wineId}:`, error);
    
    // Mark as failed
    await restaurantWineStorage.updateWineEnrichment(wineId, {
      enrichment_status: 'failed'
    });
    
    return false;
  }
}

/**
 * Test enhanced enrichment on a small sample
 */
export async function testEnhancedEnrichment(sampleSize: number = 5): Promise<void> {
  try {
    console.log(`🧪 Testing enhanced enrichment on ${sampleSize} wines`);
    
    // Get a sample of wines with repetitive content
    const wines = await restaurantWineStorage.getWinesByRestaurant(1);
    const testWines = wines
      .filter(wine => wine.enrichment_status === 'completed')
      .slice(0, sampleSize);

    for (const wine of testWines) {
      console.log(`Testing enhanced enrichment for: ${wine.wine_name}`);
      await enhanceWineNaturally(wine.id);
      
      // Wait 2 seconds between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`✅ Enhanced enrichment test completed for ${sampleSize} wines`);
  } catch (error) {
    console.error('Enhanced enrichment test failed:', error);
  }
}