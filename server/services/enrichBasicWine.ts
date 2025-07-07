import { BasicWineInfo, EnrichedWine } from './sommelier-service';

/**
 * Enriches a basic wine info into a structured enriched wine format
 * without making an API call to OpenAI
 */
export function enrichBasicWine(wine: BasicWineInfo): EnrichedWine {
  // Convert the basic wine info to an enriched format
  const enrichedWine: EnrichedWine = {
    name: {
      value: wine.name,
      confidence: 95,
      source: { type: 'tech_sheet', confidence: 95 },
      estimated: false
    },
    vintage: {
      value: wine.vintage || "Unknown",
      confidence: wine.vintage ? 90 : 10,
      source: { type: wine.vintage ? 'tech_sheet' : 'regional_estimate', confidence: wine.vintage ? 90 : 10 },
      estimated: !wine.vintage
    },
    producer: {
      value: wine.producer || "Unknown Producer",
      confidence: wine.producer ? 90 : 10,
      source: { type: wine.producer ? 'tech_sheet' : 'regional_estimate', confidence: wine.producer ? 90 : 10 },
      estimated: !wine.producer
    },
    region: {
      value: wine.region || "Unknown Region",
      confidence: wine.region ? 90 : 10,
      source: { type: wine.region ? 'tech_sheet' : 'regional_estimate', confidence: wine.region ? 90 : 10 },
      estimated: !wine.region
    },
    country: {
      value: wine.country || "Unknown Country",
      confidence: wine.country ? 90 : 10,
      source: { type: wine.country ? 'tech_sheet' : 'regional_estimate', confidence: wine.country ? 90 : 10 },
      estimated: !wine.country
    },
    varietals: {
      value: wine.varietals || ["Unknown Varietal"],
      confidence: wine.varietals ? 90 : 10,
      source: { type: wine.varietals ? 'tech_sheet' : 'regional_estimate', confidence: wine.varietals ? 90 : 10 },
      estimated: !wine.varietals
    },
    restaurant_price: wine.restaurant_price
  };
  
  return enrichedWine;
}