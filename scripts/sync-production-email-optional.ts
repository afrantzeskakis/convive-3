/**
 * Production database schema sync script
 * This script ensures the email field is optional in the production database
 * Run this on Railway console or as part of deployment
 */

import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function syncProductionSchema() {
  console.log("🔄 Syncing production database schema...");
  
  try {
    // Check current email column status
    const currentStatus = await db.execute(sql`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'email'
    `);
    
    console.log("Current email column status:", currentStatus.rows[0]);
    
    if (currentStatus.rows[0]?.is_nullable === 'NO') {
      console.log("⚠️  Email column is currently NOT NULL, updating...");
      
      // Make email nullable
      await db.execute(sql`
        ALTER TABLE users 
        ALTER COLUMN email DROP NOT NULL
      `);
      
      console.log("✅ Successfully made email field optional");
    } else {
      console.log("✅ Email column is already nullable, no changes needed");
    }
    
    // Verify the final state
    const finalStatus = await db.execute(sql`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'email'
    `);
    
    console.log("Final email column status:", finalStatus.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error syncing database schema:", error);
    process.exit(1);
  }
}

// Run the sync
syncProductionSchema();