/**
 * Enhanced Research Enrichment Service
 * 
 * Takes existing authentic research-verified wine data and enhances it with comprehensive
 * theoretical depth while preserving the authentic foundation. Uses theoretical framework
 * only for elaboration and nuance, never contradicting existing authentic data.
 */

import { Pool } from 'pg';
import OpenAI from 'openai';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EnhancedWineProfile {
  tasting_notes: string;
  flavor_notes: string;
  aroma_notes: string;
  what_makes_special: string;
  body_description: string;
  food_pairing: string;
  serving_temp: string;
  aging_potential: string;
}

class EnhancedResearchEnrichment {
  private processedCount = 0;
  private enhancedCount = 0;
  private skippedCount = 0;

  async processAllResearchVerifiedWines(): Promise<{
    processed: number;
    enhanced: number;
    skipped: number;
  }> {
    try {
      console.log('🔬 Starting Enhanced Research Enrichment for all verified wines...');
      
      // Get all verified wines that need enhancement (including "What Makes This Wine Special" content)
      const wines = await pool.query(`
        SELECT id, wine_name, producer, vintage, wine_rating, wine_type, region, country,
               tasting_notes, flavor_notes, aroma_notes, body_description, 
               food_pairing, serving_temp, aging_potential, verified_source, what_makes_special
        FROM wines 
        WHERE verified = true 
        AND (
          (verified_source LIKE '%Research%' AND (
            LENGTH(COALESCE(tasting_notes, '')) < 750 
            OR LENGTH(COALESCE(flavor_notes, '')) < 625
            OR LENGTH(COALESCE(aroma_notes, '')) < 625
            OR LENGTH(COALESCE(body_description, '')) < 625
          ))
          OR (what_makes_special IS NULL OR LENGTH(COALESCE(what_makes_special, '')) < 100)
        )
        ORDER BY wine_rating DESC NULLS LAST, id
      `);

      console.log(`Found ${wines.rows.length} research-verified wines ready for enhancement`);

      for (const wine of wines.rows) {
        this.processedCount++;
        console.log(`\n[${this.processedCount}/${wines.rows.length}] Enhancing: ${wine.wine_name} by ${wine.producer} (${wine.vintage})`);
        
        const enhanced = await this.enhanceResearchVerifiedWine(wine);
        if (enhanced) {
          this.enhancedCount++;
          console.log(`  ✓ Enhanced with comprehensive depth while preserving authentic foundation`);
        } else {
          this.skippedCount++;
          console.log(`  ⚠️ Skipped - enhancement not needed or failed`);
        }

        // Rate limiting for API calls
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const stats = {
        processed: this.processedCount,
        enhanced: this.enhancedCount,
        skipped: this.skippedCount
      };

      console.log(`\n✅ Enhanced Research Enrichment completed:`);
      console.log(`   Enhanced: ${stats.enhanced} wines`);
      console.log(`   Skipped: ${stats.skipped} wines`);
      console.log(`   Total processed: ${stats.processed} wines`);

      return stats;

    } catch (error) {
      console.error('Error in enhanced research enrichment:', error);
      throw error;
    }
  }

  public async enhanceResearchVerifiedWine(wine: any): Promise<boolean> {
    try {
      // Check if wine needs aging disclaimer (very old and obscure)
      const currentYear = new Date().getFullYear();
      const vintageYear = wine.vintage ? parseInt(wine.vintage) : null;
      const wineAge = vintageYear ? currentYear - vintageYear : 0;
      const needsAgingDisclaimer = wineAge >= 30 && vintageYear; // 30+ years old with known vintage

      // Create comprehensive enhancement prompt that uses authentic data as constraints
      const enhancementPrompt = `You are enhancing an existing research-verified wine profile. Use the authentic data provided as the absolute foundation and ONLY add theoretical depth for elaboration and nuance. Never contradict or change the existing authentic information.

AUTHENTIC WINE DATA (DO NOT CHANGE):
Wine: ${wine.wine_name} by ${wine.producer} (${wine.vintage})
Rating: ${wine.wine_rating || 'Not specified'}
Type: ${wine.wine_type || 'Not specified'}
Region: ${wine.region || 'Not specified'}
Country: ${wine.country || 'Not specified'}

${needsAgingDisclaimer ? `AGING NOTICE: This wine is from ${wine.vintage} (${wineAge} years old). Include disclaimers about potential aging changes where appropriate.` : ''}

EXISTING AUTHENTIC CONTENT (PRESERVE AND ELABORATE):
Current Tasting Notes: ${wine.tasting_notes || 'Limited information available'}
Current Flavor Notes: ${wine.flavor_notes || 'Basic profile available'}
Current Aroma Notes: ${wine.aroma_notes || 'General characteristics noted'}
Current Body Description: ${wine.body_description || 'Structure outlined'}
Current Food Pairing: ${wine.food_pairing || 'General suggestions available'}
Current Serving Temperature: ${wine.serving_temp || 'Standard recommendations'}
Current Aging Potential: ${wine.aging_potential || 'Basic assessment available'}

ENHANCEMENT INSTRUCTIONS:
1. Preserve all authentic data exactly as provided
2. Use theoretical framework ONLY to elaborate and add nuance
3. Expand existing content with sensory detail and professional depth
4. Maintain consistency with the verified rating and characteristics
5. Add educational value through detailed explanations
${needsAgingDisclaimer ? '6. Include aging disclaimers noting that descriptions may reflect the wine when first bottled and that extended aging may have changed characteristics unpredictably' : ''}

Create enhanced versions that expand each section to 140-190 words while maintaining the authentic foundation. Use the theoretical framework for sensory development, structural analysis, and educational depth.

Respond with JSON:
{
  "tasting_notes": "Enhanced tasting progression with authentic data preserved${needsAgingDisclaimer ? '. Include aging disclaimer for very old wines' : ''}",
  "flavor_notes": "Expanded flavor analysis using authentic profile as foundation", 
  "aroma_notes": "Detailed aromatic development based on authentic characteristics",
  "what_makes_special": "What makes this wine special - Extended prestige analysis with maximum processing time (3-5 minutes). Focus on terroir as primary distinction: unique geological features (soil composition, drainage, mineral content), microclimate advantages (elevation, aspect, temperature variations), historical vineyard significance, geographic exclusivity. Include verified critical acclaim, awards, scarcity factors, and cultural significance. Use 90%+ confidence threshold - omit uncertain information entirely rather than qualifying it. Be label-specific, not producer-general. Create compelling sales narrative that justifies premium pricing.",
  "body_description": "Comprehensive structural analysis with authentic elements intact${needsAgingDisclaimer ? '. Note potential aging changes for old bottles' : ''}",
  "food_pairing": "Expanded pairing suggestions building on authentic recommendations",
  "serving_temp": "Detailed service recommendations enhancing authentic guidelines",
  "aging_potential": "Comprehensive aging analysis expanding authentic assessment${needsAgingDisclaimer ? '. Include disclaimer about unpredictable aging effects for very old bottles' : ''}"
}`;

      // Single optimized API call for connection stability
      console.log(`  🔍 Generating comprehensive enhancement for ${wine.wine_name}...`);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a wine enhancement specialist creating sales-focused content. Use the authentic data as foundation and expand with comprehensive prestige analysis."
          },
          {
            role: "user",
            content: enhancementPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 2000
      });

      let enhancedProfile;
      try {
        enhancedProfile = JSON.parse(response.choices[0].message.content || '{}');
      } catch (error) {
        console.log(`  ⚠️ Enhancement failed for ${wine.wine_name}, skipping...`);
        return false;
      }

      Using these comprehensive research findings, create enhanced wine profile with sales-focused content.`;

      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Master sommelier and wine education specialist creating comprehensive wine profiles from verified research data. Focus on authentic enhancement while maintaining verified accuracy."
          },
          {
            role: "user",
            content: finalPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 2000
      });

      let enhanced: EnhancedWineProfile;
      try {
        enhanced = JSON.parse(finalResponse.choices[0].message.content || '{}') as EnhancedWineProfile;
      } catch (error) {
        console.log(`  ⚠️ Final response JSON parsing failed for ${wine.wine_name}, attempting fallback parsing...`);
        // Fallback: extract JSON from markdown response
        const content = finalResponse.choices[0].message.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            enhanced = JSON.parse(jsonMatch[0]) as EnhancedWineProfile;
          } catch (fallbackError) {
            console.log(`  ❌ Final fallback parsing also failed for ${wine.wine_name}, skipping...`);
            return false;
          }
        } else {
          console.log(`  ❌ No JSON found in final response for ${wine.wine_name}, skipping...`);
          return false;
        }
      }

      // Validate enhancement quality - dual certification approach
      const validEnhancementOriginal = 
        enhanced.tasting_notes?.length >= 750 &&
        enhanced.flavor_notes?.length >= 625 &&
        enhanced.aroma_notes?.length >= 625 &&
        enhanced.what_makes_special?.length >= 350 &&
        enhanced.body_description?.length >= 625 &&
        enhanced.food_pairing?.length >= 250 &&
        enhanced.serving_temp?.length >= 190 &&
        enhanced.aging_potential?.length >= 250;

      // New total character approach with minimum content safeguards
      const totalCharacters = 
        (enhanced.tasting_notes?.length || 0) +
        (enhanced.flavor_notes?.length || 0) +
        (enhanced.aroma_notes?.length || 0) +
        (enhanced.what_makes_special?.length || 0) +
        (enhanced.body_description?.length || 0) +
        (enhanced.food_pairing?.length || 0) +
        (enhanced.serving_temp?.length || 0) +
        (enhanced.aging_potential?.length || 0);

      const validEnhancementNew = 
        totalCharacters >= 3000 &&
        enhanced.tasting_notes?.length >= 200 &&
        enhanced.flavor_notes?.length >= 200 &&
        enhanced.aroma_notes?.length >= 200 &&
        enhanced.what_makes_special?.length >= 350 &&
        enhanced.body_description?.length >= 200;

      const validEnhancement = validEnhancementOriginal || validEnhancementNew;

      if (!validEnhancement) {
        console.log(`  ❌ Enhancement quality insufficient`);
        return false;
      }

      // Update wine with enhanced content while preserving verified status
      await pool.query(`
        UPDATE wines 
        SET 
          tasting_notes = $1,
          flavor_notes = $2,
          aroma_notes = $3,
          what_makes_special = $4,
          body_description = $5,
          food_pairing = $6,
          serving_temp = $7,
          aging_potential = $8,
          verified_source = $9,
          updated_at = NOW()
        WHERE id = $10
      `, [
        enhanced.tasting_notes,
        enhanced.flavor_notes,
        enhanced.aroma_notes,
        enhanced.what_makes_special,
        enhanced.body_description,
        enhanced.food_pairing,
        enhanced.serving_temp,
        enhanced.aging_potential,
        `${wine.verified_source} - Enhanced`, // Mark as enhanced while preserving original source
        wine.id
      ]);

      return true;

    } catch (error) {
      console.error(`Error enhancing wine ${wine.id}:`, error);
      return false;
    }
  }
}

export const enhancedResearchEnrichment = new EnhancedResearchEnrichment();