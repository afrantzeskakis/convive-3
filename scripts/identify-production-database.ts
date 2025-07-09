/**
 * Identify which database production is using
 * Run this on BOTH local and Railway to compare
 */

import { sql } from "drizzle-orm";
import { db } from "../server/db";

async function identifyDatabase() {
  console.log("=== DATABASE IDENTIFICATION ===\n");
  
  try {
    // 1. Get database URL (masked)
    const dbUrl = process.env.DATABASE_URL || 'Not set';
    const maskedUrl = dbUrl.replace(/:\/\/[^@]*@/, '://***@');
    console.log("DATABASE_URL:", maskedUrl);
    
    // 2. Get database info
    const dbInfo = await db.execute(sql`
      SELECT 
        current_database() as db_name,
        pg_database_size(current_database()) as size_bytes,
        (pg_database_size(current_database()) / 1024 / 1024) as size_mb
    `);
    console.log("\nDatabase:", dbInfo.rows[0]);
    
    // 3. Count records
    console.log("\n=== RECORD COUNTS ===");
    const counts = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM restaurants) as restaurants,
        (SELECT COUNT(*) FROM wines) as wines,
        (SELECT COUNT(*) FROM restaurant_wines_isolated) as isolated_wines
    `);
    console.log("Counts:", counts.rows[0]);
    
    // 4. List restaurants with IDs
    console.log("\n=== RESTAURANTS ===");
    const restaurants = await db.execute(sql`
      SELECT id, name 
      FROM restaurants 
      ORDER BY id
    `);
    
    restaurants.rows.forEach(r => {
      console.log(`ID ${r.id}: ${r.name}`);
    });
    
    // 5. Create a unique database fingerprint
    const fingerprint = await db.execute(sql`
      SELECT 
        md5(string_agg(name || id::text, ',' ORDER BY id)) as restaurant_hash
      FROM restaurants
    `);
    console.log("\nDatabase Fingerprint:", fingerprint.rows[0].restaurant_hash);
    
    // 6. Check environment
    console.log("\n=== ENVIRONMENT ===");
    console.log("NODE_ENV:", process.env.NODE_ENV || 'not set');
    console.log("Running on:", process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Local/Replit');
    
  } catch (error) {
    console.error("Error:", error);
  }
}

identifyDatabase()
  .then(() => {
    console.log("\n✓ Identification complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Failed:", error);
    process.exit(1);
  });