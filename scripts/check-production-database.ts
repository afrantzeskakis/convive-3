/**
 * Check which database production is actually using
 */

import { sql } from "drizzle-orm";
import { db } from "../server/db";

async function checkProductionDatabase() {
  console.log("=== PRODUCTION DATABASE CHECK ===\n");
  
  try {
    // 1. Check database connection info
    const dbInfo = await db.execute(sql`
      SELECT 
        current_database() as database_name,
        inet_server_addr() as server_address,
        pg_database_size(current_database()) as database_size
    `);
    console.log("Database Info:", dbInfo.rows[0]);
    
    // 2. Check DATABASE_URL
    console.log("\nDATABASE_URL endpoint:", process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);
    
    // 3. Count data in each table
    console.log("\n=== DATA COUNTS ===");
    
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    console.log("Users:", userCount.rows[0].count);
    
    const restaurantCount = await db.execute(sql`SELECT COUNT(*) as count FROM restaurants`);
    console.log("Restaurants:", restaurantCount.rows[0].count);
    
    // 4. List all restaurants
    console.log("\n=== ALL RESTAURANTS ===");
    const restaurants = await db.execute(sql`
      SELECT id, name 
      FROM restaurants 
      ORDER BY id
    `);
    
    restaurants.rows.forEach(r => {
      console.log(`${r.id}. ${r.name}`);
    });
    
    // 5. Check for multiple databases
    console.log("\n=== DATABASE CONNECTIONS ===");
    const connections = await db.execute(sql`
      SELECT 
        datname,
        pid,
        usename,
        application_name,
        client_addr
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);
    
    console.log(`Active connections: ${connections.rows.length}`);
    
  } catch (error) {
    console.error("Error checking database:", error);
  }
}

checkProductionDatabase()
  .then(() => {
    console.log("\n✓ Check complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Check failed:", error);
    process.exit(1);
  });