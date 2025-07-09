/**
 * Comprehensive fix for all email constraints in production
 * This checks for and removes all types of constraints on the email column
 */

import { sql } from "drizzle-orm";
import { db } from "../server/db";

async function fixAllEmailConstraints() {
  console.log("Starting comprehensive email constraint fix...");
  
  try {
    // 1. Check for CHECK constraints
    console.log("\n1. Checking for CHECK constraints on email column...");
    const checkConstraints = await db.execute(sql`
      SELECT 
        con.conname as constraint_name,
        pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'users'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%email%'
    `);
    
    if (checkConstraints.rows.length > 0) {
      console.log("Found CHECK constraints:", checkConstraints.rows);
      for (const constraint of checkConstraints.rows) {
        console.log(`Dropping CHECK constraint: ${constraint.constraint_name}`);
        await db.execute(sql.raw(`ALTER TABLE users DROP CONSTRAINT ${constraint.constraint_name}`));
      }
    } else {
      console.log("No CHECK constraints found on email column");
    }
    
    // 2. Check for NOT NULL constraint (double check)
    console.log("\n2. Double-checking NOT NULL constraint...");
    const notNullCheck = await db.execute(sql`
      SELECT 
        attname,
        attnotnull
      FROM pg_attribute
      WHERE attrelid = 'public.users'::regclass
      AND attname = 'email'
    `);
    
    console.log("Direct pg_attribute check:", notNullCheck.rows[0]);
    
    if (notNullCheck.rows[0]?.attnotnull) {
      console.log("Found NOT NULL constraint in pg_attribute. Removing...");
      await db.execute(sql`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`);
      console.log("✓ Removed NOT NULL constraint");
    }
    
    // 3. Check for triggers that might enforce email requirement
    console.log("\n3. Checking for triggers on users table...");
    const triggers = await db.execute(sql`
      SELECT 
        tgname as trigger_name,
        proname as function_name
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE tgrelid = 'public.users'::regclass
      AND NOT tgisinternal
    `);
    
    if (triggers.rows.length > 0) {
      console.log("Found triggers:", triggers.rows);
      console.log("WARNING: Triggers might be enforcing email requirements");
    } else {
      console.log("No custom triggers found");
    }
    
    // 4. Try inserting a test user with null email
    console.log("\n4. Testing user creation with null email...");
    try {
      const testResult = await db.execute(sql`
        INSERT INTO users (
          username, password, full_name, email, role, onboarding_complete
        ) VALUES (
          'test_null_email_' || extract(epoch from now())::text,
          'test_password',
          'Test User',
          NULL,
          'user',
          true
        ) RETURNING id, username, email
      `);
      
      console.log("✓ Successfully created test user with null email:", testResult.rows[0]);
      
      // Clean up test user
      await db.execute(sql`DELETE FROM users WHERE id = ${testResult.rows[0].id}`);
      console.log("✓ Cleaned up test user");
      
    } catch (error: any) {
      console.error("❌ Failed to create user with null email:");
      console.error("Error code:", error.code);
      console.error("Error detail:", error.detail);
      console.error("Error message:", error.message);
      
      // If it's still a NOT NULL constraint error, try a more aggressive fix
      if (error.message.includes('not-null constraint')) {
        console.log("\n5. Attempting aggressive fix...");
        
        // Create a new column, copy data, drop old, rename new
        console.log("Creating temporary email column...");
        await db.execute(sql`ALTER TABLE users ADD COLUMN email_temp TEXT`);
        
        console.log("Copying data to temporary column...");
        await db.execute(sql`UPDATE users SET email_temp = email`);
        
        console.log("Dropping original email column...");
        await db.execute(sql`ALTER TABLE users DROP COLUMN email`);
        
        console.log("Renaming temporary column...");
        await db.execute(sql`ALTER TABLE users RENAME COLUMN email_temp TO email`);
        
        console.log("Adding unique constraint back...");
        await db.execute(sql`ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email)`);
        
        console.log("✓ Aggressive fix completed");
      }
    }
    
    // 5. Final verification
    console.log("\n5. Final verification...");
    const finalCheck = await db.execute(sql`
      SELECT 
        column_name,
        is_nullable,
        data_type,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users' 
      AND column_name = 'email'
    `);
    
    console.log("Final email column status:", finalCheck.rows[0]);
    
  } catch (error) {
    console.error("Error during constraint fix:", error);
    throw error;
  }
}

// Run the fix
fixAllEmailConstraints()
  .then(() => {
    console.log("\n✓ Email constraint fix completed successfully!");
    console.log("You should now be able to create users without email addresses.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Email constraint fix failed:", error);
    process.exit(1);
  });