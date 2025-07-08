import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function pushSchemaToProduction() {
  console.log("Checking production database connection...");
  
  try {
    // First verify we're connected to the right database
    const dbInfo = await db.execute(sql`
      SELECT current_database(), current_user, version()
    `);
    
    console.log("Connected to database:", dbInfo.rows[0].current_database);
    console.log("As user:", dbInfo.rows[0].current_user);
    
    // Check current tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`Found ${tables.rows.length} tables in public schema`);
    
    if (tables.rows.length === 0) {
      console.log("\n⚠️  Production database is empty!");
      console.log("\nTo create tables, run:");
      console.log("  npm run db:push:pg");
      console.log("\nThen run:");
      console.log("  npx tsx scripts/setup-production-database.ts");
    } else {
      console.log("Tables found:", tables.rows.map(r => r.table_name).join(", "));
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
  
  process.exit(0);
}

pushSchemaToProduction();