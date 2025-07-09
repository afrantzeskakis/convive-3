import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function makeEmailOptional() {
  try {
    console.log("Making email field optional in users table...");
    
    // Alter the users table to make email nullable
    await db.execute(sql`
      ALTER TABLE users 
      ALTER COLUMN email DROP NOT NULL
    `);
    
    console.log("✓ Successfully made email field optional");
    
    // Verify the change
    const result = await db.execute(sql`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'email'
    `);
    
    console.log("\nEmail column status:", result.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error("Error updating database schema:", error);
    process.exit(1);
  }
}

makeEmailOptional();