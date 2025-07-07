/**
 * Enhanced Research Enrichment Service - Restored Version
 * 
 * Optimized single API call approach to prevent database connection timeouts
 * while completing "What Makes This Wine Special" content for remaining wines
 */

import OpenAI from 'openai';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    completionRate: number;
  }> {
    console.log('\n🔬 Starting Enhanced Research Enrichment for Research-Verified Wines');
    
    const researchVerifiedWines = await sql`
      SELECT * FROM wines 
      WHERE verified = true 
        AND verified_source = 'Research Verified'
        AND (what_makes_special IS NULL OR LENGTH(what_makes_special) < 100)
      ORDER BY wine_rating DESC NULLS LAST
      LIMIT 25
    `;

    console.log(`📊 Found ${researchVerifiedWines.length} research-verified wines needing enhancement`);

    for (const wine of researchVerifiedWines) {
      const success = await this.enhanceResearchVerifiedWine(wine);
      this.processedCount++;
      
      if (success) {
        this.enhancedCount++;
        console.log(`  ✅ Enhanced ${wine.wine_name} (${this.enhancedCount}/${researchVerifiedWines.length})`);
      } else {
        this.skippedCount++;
        console.log(`  ⚠️ Skipped ${wine.wine_name}`);
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const completionRate = Math.round((this.enhancedCount / this.processedCount) * 100);
    
    console.log(`\n📈 Enhanced Research Enrichment Complete:`);
    console.log(`   Processed: ${this.processedCount} wines`);
    console.log(`   Enhanced: ${this.enhancedCount} wines`);
    console.log(`   Skipped: ${this.skippedCount} wines`);
    console.log(`   Success Rate: ${completionRate}%`);

    return {
      processed: this.processedCount,
      enhanced: this.enhancedCount,
      skipped: this.skippedCount,
      completionRate
    };
  }

  public async enhanceResearchVerifiedWine(wine: any): Promise<boolean> {
    try {
      console.log(`  🔍 Enhancing ${wine.wine_name}...`);

      const needsAgingDisclaimer = wine.vintage && (new Date().getFullYear() - parseInt(wine.vintage)) > 15;

      // Single optimized API call combining all enhancement needs
      const enhancementPrompt = `Enhance this research-verified wine with comprehensive professional content:

Wine Details:
- Name: ${wine.wine_name}
- Producer: ${wine.producer || 'Not specified'}
- Vintage: ${wine.vintage || 'Not specified'}
- Region: ${wine.region || 'Not specified'}, ${wine.country || 'Not specified'}
- Type: ${wine.wine_type || 'Not specified'}
- Rating: ${wine.wine_rating || 'Not specified'}

Existing Authentic Data (preserve as foundation):
- Tasting Notes: ${wine.tasting_notes || 'Not available'}
- Flavor Profile: ${wine.flavor_notes || 'Not available'}
- Aroma Profile: ${wine.aroma_notes || 'Not available'}
- Body Description: ${wine.body_description || 'Not available'}

ENHANCEMENT REQUIREMENTS:

1. WHAT MAKES THIS WINE SPECIAL (Primary Focus - 400-500 words):
Create compelling prestige analysis covering:
- Terroir uniqueness: specific geological features, microclimate advantages, vineyard significance
- Critical acclaim: documented scores, awards, professional recognition with specifics
- Scarcity factors: production limitations, allocation systems, vintage rarity
- Cultural significance: estate heritage, historical importance, traditional methods
- Investment value: market performance, collector demand, aging potential

2. ENHANCED PROFILES (expand authentic data with professional depth):
- Tasting Notes: Enhance with sophisticated descriptors while preserving authentic foundation
- Flavor Notes: Add complexity layers and professional terminology
- Aroma Notes: Expand with nuanced aromatic descriptors
- Body Description: Professional structural analysis with mouthfeel details
- Food Pairing: Detailed recommendations explaining wine characteristics that complement dishes
- Serving Temperature: Precise recommendations with reasoning
- Aging Potential: Comprehensive analysis${needsAgingDisclaimer ? ' with disclaimer about unpredictable aging effects for older bottles' : ''}

Focus on verifiable facts with 90%+ confidence. Use label-specific details, not general producer information.

Respond with JSON:
{
  "what_makes_special": "comprehensive 400-500 word prestige analysis",
  "tasting_notes": "enhanced professional tasting notes preserving authentic foundation",
  "flavor_notes": "enhanced flavor profile with added complexity",
  "aroma_notes": "enhanced aromatic profile with sophisticated descriptors",
  "body_description": "professional body and structure analysis",
  "food_pairing": "detailed food pairing recommendations with explanations",
  "serving_temp": "precise serving temperature guidance with reasoning",
  "aging_potential": "comprehensive aging potential analysis${needsAgingDisclaimer ? ' with aging disclaimer' : ''}"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a wine enhancement specialist creating comprehensive professional profiles. Use authentic data as foundation and expand with verifiable prestige analysis and educational content."
          },
          {
            role: "user",
            content: enhancementPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000
      });

      let enhanced: EnhancedWineProfile;
      try {
        enhanced = JSON.parse(response.choices[0].message.content || '{}');
      } catch (error) {
        console.log(`  ❌ JSON parsing failed for ${wine.wine_name}, skipping...`);
        return false;
      }

      // Validate essential content
      if (!enhanced.what_makes_special || enhanced.what_makes_special.length < 300) {
        console.log(`  ❌ Insufficient special content for ${wine.wine_name}, skipping...`);
        return false;
      }

      // Update database with enhanced content
      await sql`
        UPDATE wines 
        SET 
          what_makes_special = ${enhanced.what_makes_special},
          tasting_notes = COALESCE(${enhanced.tasting_notes}, tasting_notes),
          flavor_notes = COALESCE(${enhanced.flavor_notes}, flavor_notes),
          aroma_notes = COALESCE(${enhanced.aroma_notes}, aroma_notes),
          body_description = COALESCE(${enhanced.body_description}, body_description),
          food_pairing = COALESCE(${enhanced.food_pairing}, food_pairing),
          serving_temp = COALESCE(${enhanced.serving_temp}, serving_temp),
          aging_potential = COALESCE(${enhanced.aging_potential}, aging_potential),
          verified_source = 'Enhanced Research',
          updated_at = NOW()
        WHERE id = ${wine.id}
      `;

      return true;

    } catch (error) {
      console.error(`  ❌ Enhancement failed for ${wine.wine_name}:`, error.message);
      return false;
    }
  }

  async processAllWinesNeedingSpecialContent(): Promise<{
    processed: number;
    enhanced: number;
    skipped: number;
    completionRate: number;
  }> {
    console.log('\n🔬 Processing All Wines Needing Special Content');
    
    // Get all wines needing special content regardless of source
    const winesNeedingSpecial = await sql`
      SELECT * FROM wines 
      WHERE verified = true 
        AND (what_makes_special IS NULL OR LENGTH(what_makes_special) < 100)
      ORDER BY wine_rating DESC NULLS LAST
      LIMIT 50
    `;

    console.log(`📊 Found ${winesNeedingSpecial.length} wines needing special content`);

    let processed = 0;
    let enhanced = 0;
    let skipped = 0;

    for (const wine of winesNeedingSpecial) {
      const success = await this.enhanceResearchVerifiedWine(wine);
      processed++;
      
      if (success) {
        enhanced++;
        console.log(`  ✅ Enhanced ${wine.wine_name} (${enhanced}/${winesNeedingSpecial.length})`);
      } else {
        skipped++;
        console.log(`  ⚠️ Skipped ${wine.wine_name}`);
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    const completionRate = Math.round((enhanced / processed) * 100);
    
    console.log(`\n📈 Special Content Processing Complete:`);
    console.log(`   Processed: ${processed} wines`);
    console.log(`   Enhanced: ${enhanced} wines`);
    console.log(`   Skipped: ${skipped} wines`);
    console.log(`   Success Rate: ${completionRate}%`);

    return {
      processed,
      enhanced,
      skipped,
      completionRate
    };
  }

  async getEnhancementProgress(): Promise<{
    totalVerified: number;
    hasSpecialContent: number;
    needsSpecialContent: number;
    completionPercentage: number;
  }> {
    const stats = await sql`
      SELECT 
        COUNT(*) as total_verified,
        COUNT(CASE WHEN what_makes_special IS NOT NULL AND LENGTH(what_makes_special) > 100 THEN 1 END) as has_special_content
      FROM wines WHERE verified = true
    `;

    const totalVerified = Number(stats[0].total_verified);
    const hasSpecialContent = Number(stats[0].has_special_content);
    const needsSpecialContent = totalVerified - hasSpecialContent;
    const completionPercentage = Math.round((hasSpecialContent / totalVerified) * 100);

    return {
      totalVerified,
      hasSpecialContent,
      needsSpecialContent,
      completionPercentage
    };
  }
}

export const enhancedResearchEnrichment = new EnhancedResearchEnrichment();