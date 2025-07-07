/**
 * Batch Enhancement Service
 * 
 * Processes wines in manageable batches to prevent database connection timeouts
 * and optimize resource usage during large-scale enhancement operations.
 */

import { Pool } from 'pg';
import { enhancedResearchEnrichment } from './enhanced-research-enrichment';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

interface BatchStats {
  totalProcessed: number;
  successfulEnhancements: number;
  skipped: number;
  errors: number;
  processingTimeMinutes: number;
}

class BatchEnhancementService {
  private readonly BATCH_SIZE = 5; // Process 5 wines at a time
  private readonly BATCH_DELAY = 2000; // 2 second delay between batches
  private readonly CONNECTION_TIMEOUT = 30000; // 30 second timeout per wine

  async processBatchEnhancement(): Promise<BatchStats> {
    const startTime = Date.now();
    let totalProcessed = 0;
    let successfulEnhancements = 0;
    let skipped = 0;
    let errors = 0;

    try {
      // Get all verified wines that need enhancement using SQL
      const result = await pool.query(`
        SELECT * FROM wines 
        WHERE verified = true 
        ORDER BY id
      `);

      const verifiedWines = result.rows;
      console.log(`   Found ${verifiedWines.length} verified wines for enhancement`);

      if (verifiedWines.length === 0) {
        return {
          totalProcessed: 0,
          successfulEnhancements: 0,
          skipped: 0,
          errors: 0,
          processingTimeMinutes: 0
        };
      }

      // Process wines in batches
      const totalBatches = Math.ceil(verifiedWines.length / this.BATCH_SIZE);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIdx = batchIndex * this.BATCH_SIZE;
        const endIdx = Math.min(startIdx + this.BATCH_SIZE, verifiedWines.length);
        const batch = verifiedWines.slice(startIdx, endIdx);

        console.log(`   📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} wines)`);

        // Process each wine in the current batch
        for (const wine of batch) {
          totalProcessed++;

          try {
            // Check if wine already has complete enhancement
            if (this.hasCompleteEnhancement(wine)) {
              console.log(`   ⏭️ Skipping ${wine.wine_name} - already enhanced`);
              skipped++;
              continue;
            }

            // Enhanced processing with timeout protection
            const enhancementResult = await Promise.race([
              enhancedResearchEnrichment.enhanceResearchVerifiedWine(wine),
              this.createTimeoutPromise()
            ]);

            if (enhancementResult === 'TIMEOUT') {
              console.log(`   ⏰ Timeout processing ${wine.wine_name}, moving to next wine`);
              errors++;
              continue;
            }

            if (enhancementResult) {
              console.log(`   ✓ Enhanced: ${wine.wine_name}`);
              successfulEnhancements++;
            } else {
              console.log(`   ❌ Failed to enhance: ${wine.wine_name}`);
              errors++;
            }

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.log(`   ❌ Error processing ${wine.wine_name}: ${errorMessage}`);
            errors++;
          }
        }

        // Add delay between batches to prevent overwhelming the system
        if (batchIndex < totalBatches - 1) {
          console.log(`   ⏸️ Batch delay - waiting ${this.BATCH_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY));
        }
      }

      const processingTimeMs = Date.now() - startTime;
      const processingTimeMinutes = Math.round(processingTimeMs / 60000 * 100) / 100;

      console.log(`\n   ✅ Batch processing complete:`);
      console.log(`   Total processed: ${totalProcessed}`);
      console.log(`   Successful enhancements: ${successfulEnhancements}`);
      console.log(`   Skipped (already enhanced): ${skipped}`);
      console.log(`   Errors: ${errors}`);
      console.log(`   Processing time: ${processingTimeMinutes} minutes`);

      return {
        totalProcessed,
        successfulEnhancements,
        skipped,
        errors,
        processingTimeMinutes
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in batch enhancement service:', errorMessage);
      const processingTimeMs = Date.now() - startTime;
      const processingTimeMinutes = Math.round(processingTimeMs / 60000 * 100) / 100;

      return {
        totalProcessed,
        successfulEnhancements,
        skipped,
        errors: errors + 1,
        processingTimeMinutes
      };
    }
  }

  private hasCompleteEnhancement(wine: any): boolean {
    // Check if wine has sufficient enhancement content
    const hasBasicContent = wine.tasting_notes && wine.tasting_notes.length > 500;
    const hasPrestigeContent = wine.prestige_cuvee_description && wine.prestige_cuvee_description.length > 300;
    const hasEnhancedRegion = wine.region_enhanced && wine.region_enhanced.length > 200;
    
    return hasBasicContent && hasPrestigeContent && hasEnhancedRegion;
  }

  private createTimeoutPromise(): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => resolve('TIMEOUT'), this.CONNECTION_TIMEOUT);
    });
  }

  // Get processing statistics
  async getProcessingStats(): Promise<{
    totalWines: number;
    verifiedWines: number;
    enhancedWines: number;
    enhancementRate: number;
  }> {
    try {
      const [totalResult, verifiedResult, enhancedResult] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM wines'),
        pool.query('SELECT COUNT(*) as count FROM wines WHERE verified = true'),
        pool.query(`
          SELECT COUNT(*) as count FROM wines 
          WHERE verified = true 
          AND tasting_notes IS NOT NULL 
          AND LENGTH(tasting_notes) > 500
          AND prestige_cuvee_description IS NOT NULL 
          AND LENGTH(prestige_cuvee_description) > 300
        `)
      ]);
      
      return {
        totalWines: parseInt(totalResult.rows[0].count),
        verifiedWines: parseInt(verifiedResult.rows[0].count),
        enhancedWines: parseInt(enhancedResult.rows[0].count),
        enhancementRate: verifiedResult.rows[0].count > 0 ? (enhancedResult.rows[0].count / verifiedResult.rows[0].count) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting processing stats:', error);
      return {
        totalWines: 0,
        verifiedWines: 0,
        enhancedWines: 0,
        enhancementRate: 0
      };
    }
  }
}

export const batchEnhancementService = new BatchEnhancementService();