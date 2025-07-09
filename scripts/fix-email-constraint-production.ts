/**
 * Direct fix for email NOT NULL constraint in production
 * Run this script in Railway console to fix the user creation issue
 */

import { sql } from "drizzle-orm";
import { db } from "../server/db";

async function fixEmailConstraint() {
  console.log("Starting email constraint fix...");
  
  try {
    // First, check current constraint status
    const constraintCheck = await db.execute(sql`
      SELECT 
        c.column_name,
        c.is_nullable,
        c.data_type
      FROM information_schema.columns c
      WHERE c.table_name = 'users' 
      AND c.column_name = 'email'
    `);
    
    console.log("Current email column status:", constraintCheck.rows[0]);
    
    if (constraintCheck.rows[0]?.is_nullable === 'NO') {
      console.log("Email column has NOT NULL constraint. Removing it...");
      
      // Remove NOT NULL constraint from email column
      await db.execute(sql`
        ALTER TABLE users ALTER COLUMN email DROP NOT NULL
      `);
      
      console.log("✓ Successfully removed NOT NULL constraint from email column");
      
      // Verify the change
      const verifyCheck = await db.execute(sql`
        SELECT 
          c.column_name,
          c.is_nullable,
          c.data_type
        FROM information_schema.columns c
        WHERE c.table_name = 'users' 
        AND c.column_name = 'email'
      `);
      
      console.log("Updated email column status:", verifyCheck.rows[0]);
      
      if (verifyCheck.rows[0]?.is_nullable === 'YES') {
        console.log("✓ Email column is now nullable - users can be created without email!");
      } else {
        console.log("❌ Failed to update email column constraint");
      }
    } else {
      console.log("✓ Email column is already nullable - no changes needed");
    }
    
  } catch (error) {
    console.error("Error fixing email constraint:", error);
    throw error;
  }
}

// Run the fix
fixEmailConstraint()
  .then(() => {
    console.log("Email constraint fix completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Email constraint fix failed:", error);
    process.exit(1);
  });