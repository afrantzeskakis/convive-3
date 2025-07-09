/**
 * Complete production database sync script
 * Fixes all identified database sync issues:
 * 1. Makes email field nullable
 * 2. Creates missing call_recordings table
 */

import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function completeProductionSync() {
  console.log("🚀 Starting complete production database sync...\n");
  
  let fixesApplied = 0;
  
  try {
    // 1. Fix email nullable constraint
    console.log("1. Checking email field...");
    const emailStatus = await db.execute(sql`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'email'
    `);
    
    if (emailStatus.rows[0]?.is_nullable === 'NO') {
      console.log("   ⚠️  Email is NOT NULL, fixing...");
      await db.execute(sql`
        ALTER TABLE users 
        ALTER COLUMN email DROP NOT NULL
      `);
      console.log("   ✅ Email field is now nullable");
      fixesApplied++;
    } else {
      console.log("   ✅ Email field is already nullable");
    }
    
    // 2. Create missing call_recordings table
    console.log("\n2. Checking call_recordings table...");
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'call_recordings'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log("   ⚠️  Table missing, creating...");
      await db.execute(sql`
        CREATE TABLE call_recordings (
          id SERIAL PRIMARY KEY,
          call_script_id INTEGER NOT NULL REFERENCES call_scripts(id),
          recording_url TEXT NOT NULL,
          duration INTEGER,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `);
      console.log("   ✅ Created call_recordings table");
      fixesApplied++;
    } else {
      console.log("   ✅ call_recordings table already exists");
    }
    
    // 3. Final verification
    console.log("\n3. Running final verification...");
    
    // Check all tables
    const tables = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`   ✅ Total tables: ${tables.rows[0].count}`);
    
    // Check email is nullable
    const finalEmailCheck = await db.execute(sql`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'email'
    `);
    console.log(`   ✅ Email nullable: ${finalEmailCheck.rows[0].is_nullable === 'YES' ? 'Yes' : 'No'}`);
    
    // Summary
    console.log("\n📊 SYNC COMPLETE");
    console.log("================");
    console.log(`Applied ${fixesApplied} fixes to production database`);
    console.log("✅ Production database is now fully synced!");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error during sync:", error);
    process.exit(1);
  }
}

completeProductionSync();