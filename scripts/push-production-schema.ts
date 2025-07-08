import { db, pool } from "../server/db";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

async function pushProductionSchema() {
  try {
    console.log("🚀 Pushing database schema to production...");
    console.log("📍 Database URL:", process.env.DATABASE_URL ? "Connected" : "Not configured");
    
    // Run migrations
    await migrate(db, { migrationsFolder: "./migrations" });
    
    console.log("✅ Database schema pushed successfully!");
    console.log("🎉 Your production database now has all required tables.");
    
  } catch (error) {
    console.error("❌ Error pushing schema:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

pushProductionSchema();