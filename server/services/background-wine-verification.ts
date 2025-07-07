/**
 * Background Wine Verification Service
 * 
 * Wine verification disabled - Apify removed
 */

import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

interface VerificationProgress {
  isRunning: boolean;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  startTime: Date;
  lastUpdate: Date;
}

let verificationState: VerificationProgress = {
  isRunning: false,
  totalProcessed: 0,
  successCount: 0,
  errorCount: 0,
  startTime: new Date(),
  lastUpdate: new Date()
};

/**
 * Start background wine verification process
 */
export async function startBackgroundVerification(batchSize: number = 20): Promise<void> {
  console.log("Background verification disabled - Apify removed");
  return;
}

/**
 * Process wines in background with rate limiting
 */
async function processWinesInBackground(batchSize: number): Promise<void> {
  try {
    while (verificationState.isRunning) {
      // Get batch of unverified wines
      const result = await pool.query(`
        SELECT id, wine_name, producer, vintage
        FROM wines 
        WHERE verified IS NULL OR verified = false
        ORDER BY id
        LIMIT $1
      `, [batchSize]);

      if (result.rows.length === 0) {
        console.log("All wines verified - background process complete");
        verificationState.isRunning = false;
        break;
      }

      console.log(`Processing batch of ${result.rows.length} wines`);

      for (const wine of result.rows) {
        if (!verificationState.isRunning) break;

        try {
          const verified = await verifyWineWithVivino(wine);
          if (verified) {
            verificationState.successCount++;
          } else {
            verificationState.errorCount++;
          }
          
          verificationState.totalProcessed++;
          verificationState.lastUpdate = new Date();

          // Rate limiting - 3 second delay between requests
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          console.error(`Failed to verify wine ${wine.wine_name}:`, error);
          verificationState.errorCount++;
          verificationState.totalProcessed++;
        }
      }

      // Progress update
      console.log(`Progress: ${verificationState.successCount} verified, ${verificationState.errorCount} errors, ${verificationState.totalProcessed} total processed`);
    }
  } catch (error) {
    console.error("Background verification process error:", error);
    verificationState.isRunning = false;
  }
}

/**
 * Verify a single wine with Vivino data
 */
async function verifyWineWithVivino(wine: any): Promise<boolean> {
  console.log("Wine verification disabled - Apify removed");
  return false;
}

/**
 * Stop background verification
 */
export function stopBackgroundVerification(): void {
  verificationState.isRunning = false;
  console.log("Background verification stopped");
}

/**
 * Get verification progress
 */
export function getVerificationProgress(): VerificationProgress {
  return { ...verificationState };
}

/**
 * Get verification statistics from database
 */
export async function getVerificationStats(): Promise<{
  totalWines: number;
  verifiedWines: number;
  unverifiedWines: number;
  verificationRate: number;
}> {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN verified = true THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN verified IS NULL OR verified = false THEN 1 ELSE 0 END) as unverified
      FROM wines
    `);

    const row = result.rows[0];
    const totalWines = parseInt(row.total);
    const verifiedWines = parseInt(row.verified);
    const unverifiedWines = parseInt(row.unverified);
    const verificationRate = totalWines > 0 ? (verifiedWines / totalWines) * 100 : 0;

    return {
      totalWines,
      verifiedWines,
      unverifiedWines,
      verificationRate: Math.round(verificationRate * 100) / 100
    };
  } catch (error) {
    console.error("Error getting verification stats:", error);
    return {
      totalWines: 0,
      verifiedWines: 0,
      unverifiedWines: 0,
      verificationRate: 0
    };
  }
}