/**
 * Creates the missing call_recordings table
 */

import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createCallRecordingsTable() {
  try {
    console.log("Creating call_recordings table...");
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS call_recordings (
        id SERIAL PRIMARY KEY,
        call_script_id INTEGER NOT NULL REFERENCES call_scripts(id),
        recording_url TEXT NOT NULL,
        duration INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    
    console.log("✅ Successfully created call_recordings table");
    
    // Verify the table was created
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'call_recordings'
      )
    `);
    
    if (result.rows[0].exists) {
      console.log("✅ Table verified successfully");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating table:", error);
    process.exit(1);
  }
}

createCallRecordingsTable();