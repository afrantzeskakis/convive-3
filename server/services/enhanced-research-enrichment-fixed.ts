/**
 * Enhanced Research Enrichment Service - Connection Stable Version
 * 
 * Optimized for database connection stability with single API call approach
 * to avoid timeout issues during "What Makes This Wine Special" content generation
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

class EnhancedResearchEnrichmentFixed {
  private processedCount = 0;
  private enhancedCount = 0;
  private skippedCount = 0;

  async processAllWinesNeedingSpecialContent(): Promise<{
    processed: number;
    enhanced: number;
    skipped: number;
    completionRate: number;
  }> {
    console.log('\n🔬 Starting Enhanced Research Enrichment - Special Content Focus');
    
    // Get wines that need "What Makes This Wine Special" content
    const winesNeedingSpecial = await sql`
      SELECT * FROM wines 
      WHERE verified = true 
        AND (what_makes_special IS NULL OR LENGTH(what_makes_special) < 100)
      ORDER BY wine_rating DESC NULLS LAST
      LIMIT 50
    `;

    console.log(`📊 Found ${winesNeedingSpecial.length} wines needing special content`);

    for (const wine of winesNeedingSpecial) {
      const success = await this.enhanceWineWithSpecialContent(wine);
      this.processedCount++;
      
      if (success) {
        this.enhancedCount++;
        console.log(`  ✅ Enhanced ${wine.wine_name} (${this.enhancedCount}/${winesNeedingSpecial.length})`);
      } else {
        this.skippedCount++;
        console.log(`  ⚠️ Skipped ${wine.wine_name} (${this.skippedCount} total skipped)`);
      }

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
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

  public async enhanceWineWithSpecialContent(wine: any): Promise<boolean> {
    try {
      console.log(`  🔍 Generating special content for ${wine.wine_name}...`);

      // Single optimized API call for both special content and enhancements
      const enhancementPrompt = `Create comprehensive wine enhancement focusing on "What Makes This Wine Special" prestige analysis:

Wine Details:
- Name: ${wine.wine_name}
- Producer: ${wine.producer || 'Not specified'}
- Vintage: ${wine.vintage || 'Not specified'}
- Region: ${wine.region || 'Not specified'}, ${wine.country || 'Not specified'}
- Type: ${wine.wine_type || 'Not specified'}
- Rating: ${wine.wine_rating || 'Not specified'}

Existing Authentic Data:
- Tasting Notes: ${wine.tasting_notes || 'Not available'}
- Flavor Profile: ${wine.flavor_notes || 'Not available'}
- Aroma Profile: ${wine.aroma_notes || 'Not available'}

ENHANCEMENT REQUIREMENTS:

1. WHAT MAKES THIS WINE SPECIAL (Primary Focus - 400-500 words):
Create compelling prestige analysis covering:
- Terroir uniqueness: geological features, microclimate, vineyard sites
- Critical acclaim: specific scores, awards, professional recognition
- Scarcity factors: production limits, allocation systems, rarity
- Cultural significance: estate heritage, historical importance
- Investment value: market performance, collector demand

2. ENHANCED PROFILES:
- Tasting Notes: Expand authentic notes with professional depth
- Flavor Notes: Add complexity layers to existing flavors
- Aroma Notes: Enhance with sophisticated descriptors
- Body Description: Professional structural analysis
- Food Pairing: Detailed pairing explanations with wine characteristics
- Serving Temperature: Precise service recommendations
- Aging Potential: Comprehensive aging analysis

Focus on verifiable facts with 90%+ confidence. Use label-specific details, not general producer information.

Respond with JSON:
{
  "what_makes_special": "comprehensive 400-500 word prestige analysis",
  "tasting_notes": "enhanced professional tasting notes",
  "flavor_notes": "enhanced flavor profile",
  "aroma_notes": "enhanced aromatic profile", 
  "body_description": "professional body and structure analysis",
  "food_pairing": "detailed food pairing recommendations",
  "serving_temp": "precise serving temperature guidance",
  "aging_potential": "comprehensive aging potential analysis"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a master sommelier specializing in prestige wine analysis and sales justification. Create compelling content that highlights what makes each wine special while preserving authentic foundation data."
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

      let enhancedProfile: EnhancedWineProfile;
      try {
        enhancedProfile = JSON.parse(response.choices[0].message.content || '{}');
      } catch (error) {
        console.log(`  ❌ JSON parsing failed for ${wine.wine_name}, skipping...`);
        return false;
      }

      // Validate essential content
      if (!enhancedProfile.what_makes_special || enhancedProfile.what_makes_special.length < 200) {
        console.log(`  ❌ Insufficient special content for ${wine.wine_name}, skipping...`);
        return false;
      }

      // Update database with enhanced content
      await sql`
        UPDATE wines 
        SET 
          what_makes_special = ${enhancedProfile.what_makes_special},
          tasting_notes = COALESCE(${enhancedProfile.tasting_notes}, tasting_notes),
          flavor_notes = COALESCE(${enhancedProfile.flavor_notes}, flavor_notes),
          aroma_notes = COALESCE(${enhancedProfile.aroma_notes}, aroma_notes),
          body_description = COALESCE(${enhancedProfile.body_description}, body_description),
          food_pairing = COALESCE(${enhancedProfile.food_pairing}, food_pairing),
          serving_temp = COALESCE(${enhancedProfile.serving_temp}, serving_temp),
          aging_potential = COALESCE(${enhancedProfile.aging_potential}, aging_potential),
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

export const enhancedResearchEnrichmentFixed = new EnhancedResearchEnrichmentFixed();