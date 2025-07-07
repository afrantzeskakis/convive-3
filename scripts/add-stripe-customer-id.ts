import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    // Check if the column already exists
    const result = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
    `);
    
    const columnExists = result.rows.length > 0;
    
    if (!columnExists) {
      console.log('Adding stripe_customer_id column to users table...');
      
      // Add the column
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN stripe_customer_id TEXT
      `);
      
      console.log('Column added successfully.');
    } else {
      console.log('stripe_customer_id column already exists.');
    }
  } catch (error) {
    console.error('Error updating database:', error);
  }
  
  process.exit(0);
}

main();