/**
 * GPT-4o Wine Description Parser
 * Parses guest wine descriptions and manual restaurant input for wine matching
 */

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ParsedWineCharacteristics {
  color?: "red" | "white" | "rosé" | "sparkling";
  body?: "light" | "medium" | "full";
  tannins?: number; // 1-5 scale
  acidity?: number; // 1-5 scale
  sweetness?: number; // 1-5 scale
  intensity?: number; // 1-5 scale
  flavor_notes?: string[];
  price_range?: "budget" | "mid-range" | "premium" | "luxury";
  oak_influence?: "none" | "light" | "medium" | "heavy";
  finish_length?: "short" | "medium" | "long";
  confidence_score?: number; // 0-1 how confident the parsing is
}

/**
 * Parses guest wine descriptions for recommendation matching
 */
export async function parseGuestWineDescription(description: string): Promise<ParsedWineCharacteristics> {
  try {
    const prompt = `You are a professional sommelier analyzing a guest's wine request. Parse this description and extract wine characteristics in JSON format.

Guest request: "${description}"

Extract these characteristics using the 1-5 scale where:
- 1 = low/light
- 2 = medium-low  
- 3 = medium
- 4 = medium-high
- 5 = high/full

Return JSON with these fields (only include fields you can confidently determine):
{
  "color": "red|white|rosé|sparkling",
  "body": "light|medium|full", 
  "tannins": 1-5,
  "acidity": 1-5,
  "sweetness": 1-5,
  "intensity": 1-5,
  "flavor_notes": ["flavor1", "flavor2"],
  "price_range": "budget|mid-range|premium|luxury",
  "oak_influence": "none|light|medium|heavy",
  "finish_length": "short|medium|long",
  "confidence_score": 0-1
}

Examples:
- "Something bold and red" → {"color": "red", "body": "full", "tannins": 4, "intensity": 4, "confidence_score": 0.8}
- "Light white wine, crisp" → {"color": "white", "body": "light", "acidity": 4, "confidence_score": 0.9}
- "Not too expensive, fruity" → {"price_range": "budget", "flavor_notes": ["fruity"], "confidence_score": 0.6}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    return parsed as ParsedWineCharacteristics;

  } catch (error) {
    console.error("Error parsing guest wine description:", error);
    return { confidence_score: 0 };
  }
}

/**
 * Validates and parses manual wine descriptions from restaurant admins
 * Provides guidance on required fields for reliable wine matching
 */
export async function parseManualWineDescription(description: string): Promise<{
  characteristics: ParsedWineCharacteristics;
  completeness_score: number;
  missing_fields: string[];
  suggestions: string[];
}> {
  try {
    const prompt = `You are helping a restaurant admin input a wine description for their sommelier AI system. 

Wine description: "${description}"

For reliable wine matching, analyze this description and:
1. Extract all possible characteristics using the 1-5 scale
2. Identify missing critical fields 
3. Provide specific suggestions to improve the description

Required fields for optimal matching:
- Wine color (red, white, rosé, sparkling)
- Body description (light, medium, full-bodied)
- Primary flavor notes (minimum 2-3 descriptors)
- Tannin level for reds (1=low, 3=medium, 5=high)
- Acidity level (1=low, 3=medium, 5=high)
- Sweetness level (1=dry, 3=off-dry, 5=sweet)

Return JSON:
{
  "characteristics": {
    "color": "red|white|rosé|sparkling",
    "body": "light|medium|full",
    "tannins": 1-5,
    "acidity": 1-5, 
    "sweetness": 1-5,
    "intensity": 1-5,
    "flavor_notes": ["flavor1", "flavor2"],
    "oak_influence": "none|light|medium|heavy",
    "finish_length": "short|medium|long"
  },
  "completeness_score": 0-1,
  "missing_fields": ["field1", "field2"],
  "suggestions": [
    "Add tannin description for better red wine matching",
    "Include specific fruit flavors like 'blackberry, plum'"
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;

  } catch (error) {
    console.error("Error parsing manual wine description:", error);
    return {
      characteristics: {},
      completeness_score: 0,
      missing_fields: ["Unable to parse description"],
      suggestions: ["Please provide a more detailed wine description"]
    };
  }
}

/**
 * Converts 1-5 numeric scale to our terminology system
 */
export function convertNumericScale(value: number): string {
  if (!value) return "unknown";
  const rounded = Math.round(value);
  const terms: { [key: number]: string } = { 1: 'low', 2: 'medium-low', 3: 'medium', 4: 'medium-high', 5: 'high' };
  return `${terms[rounded]} (${value.toFixed(2)} out of 5)`;
}

/**
 * Converts our terminology back to numeric ranges for matching
 */
export function parseCharacteristicRange(term: string): { min: number; max: number } {
  const lowerTerm = term.toLowerCase();
  
  if (lowerTerm.includes('low') && !lowerTerm.includes('medium')) {
    return { min: 1.0, max: 1.5 };
  } else if (lowerTerm.includes('medium-low')) {
    return { min: 1.6, max: 2.5 };
  } else if (lowerTerm.includes('medium') && !lowerTerm.includes('high') && !lowerTerm.includes('low')) {
    return { min: 2.6, max: 3.5 };
  } else if (lowerTerm.includes('medium-high')) {
    return { min: 3.6, max: 4.5 };
  } else if (lowerTerm.includes('high')) {
    return { min: 4.6, max: 5.0 };
  }
  
  // Default to medium range if unclear
  return { min: 2.6, max: 3.5 };
}