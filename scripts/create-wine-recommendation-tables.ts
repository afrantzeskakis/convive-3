/**
 * Script to create wine recommendation system tables
 * This adds the new tables needed for the wine recommendation feature
 */

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function createWineRecommendationTables() {
  console.log("🍷 Creating wine recommendation system tables...");
  
  try {
    // Add new columns to existing wines table for Vivino characteristics
    console.log("📊 Adding Vivino characteristics columns to wines table...");
    await sql`
      ALTER TABLE wines 
      ADD COLUMN IF NOT EXISTS acidity DECIMAL(3,2),
      ADD COLUMN IF NOT EXISTS tannins DECIMAL(3,2), 
      ADD COLUMN IF NOT EXISTS intensity DECIMAL(3,2),
      ADD COLUMN IF NOT EXISTS sweetness DECIMAL(3,2),
      ADD COLUMN IF NOT EXISTS body_description VARCHAR(50),
      ADD COLUMN IF NOT EXISTS flavor_notes TEXT,
      ADD COLUMN IF NOT EXISTS finish_length VARCHAR(20),
      ADD COLUMN IF NOT EXISTS oak_influence VARCHAR(20)
    `;

    // Update restaurant_wines table for inventory management
    console.log("🏪 Adding inventory management columns to restaurant_wines table...");
    await sql`
      ALTER TABLE restaurant_wines 
      ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS promotion_priority INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS date_added TIMESTAMP DEFAULT NOW()
    `;

    // Create wine recommendation logs table
    console.log("📝 Creating wine recommendation logs table...");
    await sql`
      CREATE TABLE IF NOT EXISTS wine_recommendation_logs (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
        search_query TEXT NOT NULL,
        recommended_wine_ids JSONB,
        guest_preferences JSONB,
        server_user_id INTEGER,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create restaurant sync status table
    console.log("🔄 Creating restaurant sync status table...");
    await sql`
      CREATE TABLE IF NOT EXISTS restaurant_sync_status (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) UNIQUE,
        last_sync_date TIMESTAMP,
        next_sync_date TIMESTAMP NOT NULL,
        sync_status VARCHAR(50) DEFAULT 'pending',
        wine_count_synced INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create restaurant wine descriptions table
    console.log("✍️ Creating restaurant wine descriptions table...");
    await sql`
      CREATE TABLE IF NOT EXISTS restaurant_wine_descriptions (
        id SERIAL PRIMARY KEY,
        restaurant_wine_id INTEGER NOT NULL,
        custom_description TEXT NOT NULL,
        admin_user_id INTEGER NOT NULL REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create indexes for better performance
    console.log("⚡ Creating performance indexes...");
    await sql`
      CREATE INDEX IF NOT EXISTS idx_wines_characteristics 
      ON wines(acidity, tannins, intensity, sweetness) 
      WHERE acidity IS NOT NULL OR tannins IS NOT NULL OR intensity IS NOT NULL OR sweetness IS NOT NULL
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_restaurant_wines_available 
      ON restaurant_wines(restaurant_id, is_available, promotion_priority)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_wine_recommendation_logs_restaurant 
      ON wine_recommendation_logs(restaurant_id, timestamp)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_restaurant_sync_status_next_sync 
      ON restaurant_sync_status(next_sync_date, sync_status)
    `;

    console.log("✅ Wine recommendation system tables created successfully!");
    console.log("\n🎯 Ready for:");
    console.log("   • Wine characteristic storage from Vivino API");
    console.log("   • Monthly sync scheduling");
    console.log("   • Wine recommendation matching");
    console.log("   • Restaurant inventory management");
    console.log("   • Manual wine descriptions");
    console.log("   • Analytics and performance tracking");

  } catch (error) {
    console.error("❌ Error creating wine recommendation tables:", error);
    throw error;
  }
}

// Run the script
createWineRecommendationTables()
  .then(() => {
    console.log("🍷 Wine recommendation database setup complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed to create wine recommendation tables:", error);
    process.exit(1);
  });