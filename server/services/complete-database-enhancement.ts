/**
 * Complete Database Enhancement Service
 * 
 * Processes the entire wine database in three sequential stages:
 * 1. Research Verification - Validates unverified wines through GPT-4o knowledge
 * 2. Enhanced Research Enrichment - Applies comprehensive depth to all verified wines
 * 3. Educational Content - Creates theoretical profiles for rejected wines
 */

import { Pool } from 'pg';
import { gpt4oFallback } from './gpt4o-wine-fallback';
import { batchEnhancementService } from './batch-enhancement-service';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  query_timeout: 60000,
  statement_timeout: 60000,
});

interface CompleteDatabaseStats {
  totalProcessed: number;
  researchVerified: number;
  enhancedWines: number;
  educationalContent: number;
  skipped: number;
  processingTimeMinutes: number;
}

class CompleteDatabaseEnhancement {
  private startTime: number = 0;
  private totalProcessed: number = 0;
  private researchVerified: number = 0;
  private enhancedWines: number = 0;
  private educationalContent: number = 0;
  private skipped: number = 0;

  async processEntireDatabase(): Promise<CompleteDatabaseStats> {
    this.startTime = Date.now();
    
    try {
      console.log('🚀 Starting Complete Database Enhancement for all wines...');
      
      // Get total wine count
      const totalCount = await pool.query('SELECT COUNT(*) as total FROM wines');
      const totalWines = parseInt(totalCount.rows[0].total);
      console.log(`📊 Total wines in database: ${totalWines}`);

      // Stage 1: Research Verification for unverified wines
      console.log('\n📋 STAGE 1: Research Verification');
      const researchStats = await this.processResearchVerification();
      this.researchVerified = researchStats.succeeded;
      console.log(`   ✓ Research verified: ${this.researchVerified} wines`);

      // Stage 2: Enhanced Research Enrichment for all verified wines
      console.log('\n🔬 STAGE 2: Enhanced Research Enrichment');
      const enhancementStats = await this.processEnhancedResearchEnrichment();
      this.enhancedWines = enhancementStats.enhanced;
      console.log(`   ✓ Enhanced: ${this.enhancedWines} wines`);

      // Stage 3: Educational Content for rejected wines
      console.log('\n📚 STAGE 3: Educational Content Generation');
      const educationalStats = await this.processEducationalContent();
      this.educationalContent = educationalStats.educational;
      console.log(`   ✓ Educational content: ${this.educationalContent} wines`);

      // Calculate final statistics
      this.totalProcessed = this.researchVerified + this.enhancedWines + this.educationalContent;
      const processingTimeMs = Date.now() - this.startTime;
      const processingTimeMinutes = Math.round(processingTimeMs / 60000 * 100) / 100;

      const finalStats: CompleteDatabaseStats = {
        totalProcessed: this.totalProcessed,
        researchVerified: this.researchVerified,
        enhancedWines: this.enhancedWines,
        educationalContent: this.educationalContent,
        skipped: this.skipped,
        processingTimeMinutes
      };

      console.log('\n✅ Complete Database Enhancement finished!');
      console.log(`   Total processed: ${finalStats.totalProcessed} wines`);
      console.log(`   Research verified: ${finalStats.researchVerified} wines`);
      console.log(`   Enhanced profiles: ${finalStats.enhancedWines} wines`);
      console.log(`   Educational content: ${finalStats.educationalContent} wines`);
      console.log(`   Processing time: ${finalStats.processingTimeMinutes} minutes`);

      return finalStats;

    } catch (error) {
      console.error('Error in complete database enhancement:', error);
      throw error;
    }
  }

  private async processResearchVerification(): Promise<{ succeeded: number; processed: number }> {
    try {
      // Get unverified wines count
      const unverifiedCount = await pool.query(`
        SELECT COUNT(*) as total 
        FROM wines 
        WHERE verified = false OR verified IS NULL
      `);
      
      const unverifiedWines = parseInt(unverifiedCount.rows[0].total);
      console.log(`   Found ${unverifiedWines} unverified wines for research validation`);

      if (unverifiedWines === 0) {
        return { succeeded: 0, processed: 0 };
      }

      // Process through GPT-4o research verification
      const stats = await gpt4oFallback.processFailedVivinoWines(unverifiedWines);
      
      return {
        succeeded: stats.succeeded,
        processed: stats.processed
      };

    } catch (error) {
      console.error('Error in research verification stage:', error);
      return { succeeded: 0, processed: 0 };
    }
  }

  private async processEnhancedResearchEnrichment(): Promise<{ enhanced: number; processed: number }> {
    try {
      // Process all research-verified wines with batch enhancement
      const stats = await batchEnhancementService.processBatchEnhancement();
      
      return {
        enhanced: stats.successfulEnhancements,
        processed: stats.totalProcessed
      };

    } catch (error) {
      console.error('Error in enhanced research enrichment stage:', error);
      return { enhanced: 0, processed: 0 };
    }
  }

  private async processEducationalContent(): Promise<{ educational: number; processed: number }> {
    try {
      // Get wines that are still unverified (rejected from research stage)
      const rejectedWines = await pool.query(`
        SELECT id 
        FROM wines 
        WHERE verified = false OR verified IS NULL
        ORDER BY id
      `);

      if (rejectedWines.rows.length === 0) {
        console.log('   No rejected wines found - all wines successfully verified');
        return { educational: 0, processed: 0 };
      }

      console.log(`   Found ${rejectedWines.rows.length} rejected wines for educational content`);

      // Process rejected wines with educational content
      const rejectedWineIds = rejectedWines.rows.map(row => row.id);
      const stats = await gpt4oFallback.processRejectedWinesAsLastResort(rejectedWineIds);

      return {
        educational: stats.educational,
        processed: stats.processed
      };

    } catch (error) {
      console.error('Error in educational content stage:', error);
      return { educational: 0, processed: 0 };
    }
  }
}

export const completeDatabaseEnhancement = new CompleteDatabaseEnhancement();