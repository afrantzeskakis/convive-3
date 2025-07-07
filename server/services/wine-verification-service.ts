/**
 * Wine Verification Service
 * 
 * Background service to verify wines - Apify removed
 */

import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

interface Wine {
  id: number;
  wine_name: string;
  producer: string;
  vintage?: string;
  verified?: boolean;
}

interface VivinoData {
  id?: string;
  name?: string;
  link?: string;
  rating?: {
    average?: number;
  };
  type?: string;
  style?: string;
  region?: {
    name?: string;
    country?: {
      name?: string;
    };
  };
  tastingNotes?: string;
  description?: string;
}

/**
 * Verify a single wine with Vivino data
 */
export async function verifyWineWithVivino(wine: Wine): Promise<boolean> {
  try {
    console.log(`Wine verification disabled - Apify removed`);
    return false;
  } catch (error) {
    console.error(`Error in wine verification:`, error);
    return false;
  }
}

/**
 * Verify all unverified wines in the database
 */
export async function verifyAllWines(batchSize: number = 10): Promise<void> {
  try {
    if (!process.env.APIFY_API_TOKEN) {
      console.log("Cannot verify wines - APIFY_API_TOKEN not set");
      return;
    }

    console.log("Starting bulk wine verification with Vivino...");

    // Get unverified wines
    const result = await pool.query(`
      SELECT id, wine_name, producer, vintage, verified
      FROM wines 
      WHERE verified IS NULL OR verified = false
      ORDER BY id
      LIMIT $1
    `, [batchSize]);

    if (result.rows.length === 0) {
      console.log("No unverified wines found");
      return;
    }

    console.log(`Found ${result.rows.length} wines to verify`);

    let successCount = 0;
    let errorCount = 0;

    // Process wines in sequence to avoid rate limiting
    for (const wine of result.rows) {
      try {
        const verified = await verifyWineWithVivino(wine);
        if (verified) {
          successCount++;
        } else {
          errorCount++;
        }

        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to verify wine ${wine.wine_name}:`, error);
        errorCount++;
      }
    }

    console.log(`Wine verification complete: ${successCount} verified, ${errorCount} errors`);
  } catch (error) {
    console.error("Error in bulk wine verification:", error);
  }
}

/**
 * Get verification statistics
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