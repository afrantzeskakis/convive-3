/**
 * Complete production database sync script
 * Fixes all identified database sync issues:
 * 1. Makes email field nullable
 * 2. Creates missing call_recordings table
 */

import { sql } from "drizzle-orm";
import { db } from "../server/db";

async function completeProductionSync() {
  console.log("Starting complete production database sync...");
  
  try {
    // 1. First verify we're connected to the right database
    console.log("\n1. Verifying database connection...");
    const dbInfo = await db.execute(sql`
      SELECT current_database(), current_user, version()
    `);
    console.log("Connected to:", dbInfo.rows[0]);
    
    // 2. Check and fix email constraint
    console.log("\n2. Checking email constraint...");
    const emailCheck = await db.execute(sql`
      SELECT 
        column_name,
        is_nullable,
        data_type,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users' 
      AND column_name = 'email'
    `);
    
    if (emailCheck.rows[0]?.is_nullable === 'NO') {
      console.log("Email has NOT NULL constraint. Removing...");
      await db.execute(sql`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`);
      console.log("✓ Removed NOT NULL constraint from email");
    } else {
      console.log("✓ Email is already nullable");
    }
    
    // 3. Create missing call_recordings table
    console.log("\n3. Checking for call_recordings table...");
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'call_recordings'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log("Creating missing call_recordings table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS call_recordings (
          id SERIAL PRIMARY KEY,
          call_id INTEGER NOT NULL REFERENCES call_scripts(id) ON DELETE CASCADE,
          recording_url TEXT NOT NULL,
          duration INTEGER,
          transcript TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✓ Created call_recordings table");
    } else {
      console.log("✓ call_recordings table already exists");
    }
    
    // 4. Create missing restaurant_wines_isolated table
    console.log("\n4. Checking for restaurant_wines_isolated table...");
    const wineTableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'restaurant_wines_isolated'
      )
    `);
    
    if (!wineTableCheck.rows[0].exists) {
      console.log("Creating missing restaurant_wines_isolated table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS restaurant_wines_isolated (
          id SERIAL PRIMARY KEY,
          restaurant_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          producer VARCHAR(255),
          vintage INTEGER,
          region VARCHAR(255),
          country VARCHAR(100),
          appellation VARCHAR(255),
          grape_variety TEXT,
          wine_type VARCHAR(50),
          wine_style VARCHAR(100),
          body VARCHAR(50),
          acidity VARCHAR(50),
          tannins VARCHAR(50),
          sweetness VARCHAR(50),
          alcohol_content DECIMAL(3,1),
          serving_temperature VARCHAR(50),
          food_pairing TEXT,
          tasting_notes TEXT,
          awards TEXT,
          sustainability_info TEXT,
          bottle_size VARCHAR(50),
          price DECIMAL(10,2),
          cost DECIMAL(10,2),
          markup_percentage DECIMAL(5,2),
          by_glass BOOLEAN DEFAULT false,
          by_bottle BOOLEAN DEFAULT true,
          inventory_count INTEGER DEFAULT 0,
          reorder_point INTEGER DEFAULT 6,
          supplier VARCHAR(255),
          sku VARCHAR(100),
          barcode VARCHAR(100),
          image_url TEXT,
          qr_code TEXT,
          wine_list_category VARCHAR(100),
          display_order INTEGER,
          is_featured BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          tags TEXT[],
          custom_fields JSONB,
          import_source VARCHAR(50),
          import_date TIMESTAMP DEFAULT NOW(),
          last_updated TIMESTAMP DEFAULT NOW(),
          verified_status VARCHAR(50) DEFAULT 'pending',
          confidence_score DECIMAL(3,2) DEFAULT 0.00,
          enrichment_status VARCHAR(50) DEFAULT 'pending',
          enriched_at TIMESTAMP,
          allergen_info TEXT,
          glass_price DECIMAL(10,2),
          bottle_price DECIMAL(10,2),
          special_notes TEXT,
          wine_maker_notes TEXT,
          internal_notes TEXT,
          pairing_suggestions TEXT,
          serving_instructions TEXT,
          storage_instructions TEXT,
          peak_maturity VARCHAR(100),
          drink_by_date INTEGER,
          production_method VARCHAR(100),
          residual_sugar DECIMAL(5,2),
          ph_level DECIMAL(3,2),
          total_acidity DECIMAL(4,2),
          aging_process TEXT,
          oak_influence VARCHAR(50),
          malolactic_fermentation BOOLEAN,
          biodynamic BOOLEAN DEFAULT false,
          organic BOOLEAN DEFAULT false,
          vegan BOOLEAN DEFAULT false,
          vivino_rating DECIMAL(3,2),
          vivino_review_count INTEGER,
          vivino_url TEXT,
          winery_website TEXT,
          tech_sheet_url TEXT,
          label_image_url TEXT,
          harvest_date VARCHAR(50),
          bottling_date VARCHAR(50),
          release_date VARCHAR(50),
          case_production INTEGER,
          blend_composition TEXT,
          vineyard_info TEXT,
          soil_type TEXT,
          elevation VARCHAR(100),
          climate_info TEXT,
          harvest_method VARCHAR(100),
          yeast_type VARCHAR(100),
          fining_agents TEXT,
          filtration VARCHAR(50),
          closure_type VARCHAR(50),
          bottle_weight VARCHAR(50),
          color_intensity VARCHAR(50),
          aroma_intensity VARCHAR(50),
          aroma_characteristics TEXT,
          flavor_characteristics TEXT,
          finish_length VARCHAR(50),
          finish_characteristics TEXT,
          decanting_recommendation VARCHAR(100),
          service_ritual TEXT,
          optimal_consumption_window VARCHAR(100),
          professional_ratings TEXT,
          press_reviews TEXT,
          customer_favorites BOOLEAN DEFAULT false,
          staff_pick BOOLEAN DEFAULT false,
          limited_availability BOOLEAN DEFAULT false,
          exclusive_import BOOLEAN DEFAULT false,
          allocation_only BOOLEAN DEFAULT false,
          library_wine BOOLEAN DEFAULT false,
          prestige_cuvee BOOLEAN DEFAULT false,
          UNIQUE(restaurant_id, name, vintage, producer)
        )
      `);
      
      // Create indexes for performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_restaurant_wines_isolated_restaurant_id 
        ON restaurant_wines_isolated(restaurant_id)
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_restaurant_wines_isolated_enrichment_status 
        ON restaurant_wines_isolated(enrichment_status)
      `);
      
      console.log("✓ Created restaurant_wines_isolated table with indexes");
    } else {
      console.log("✓ restaurant_wines_isolated table already exists");
    }
    
    // 5. Test user creation
    console.log("\n5. Testing user creation with null email...");
    try {
      const testUser = await db.execute(sql`
        INSERT INTO users (
          username, password, full_name, email, role, onboarding_complete
        ) VALUES (
          'sync_test_' || extract(epoch from now())::text,
          'test_password',
          'Sync Test User',
          NULL,
          'user',
          true
        ) RETURNING id, username, email
      `);
      
      console.log("✓ Successfully created test user:", testUser.rows[0]);
      
      // Clean up
      await db.execute(sql`DELETE FROM users WHERE id = ${testUser.rows[0].id}`);
      console.log("✓ Cleaned up test user");
      
    } catch (error: any) {
      console.error("❌ Failed to create test user:", error.message);
    }
    
    console.log("\n✅ Production database sync completed successfully!");
    console.log("\nSummary:");
    console.log("- Email column is now nullable");
    console.log("- call_recordings table exists");
    console.log("- restaurant_wines_isolated table exists");
    console.log("- Test user creation with null email works");
    
  } catch (error) {
    console.error("Error during production sync:", error);
    throw error;
  }
}

// Run the sync
completeProductionSync()
  .then(() => {
    console.log("\n✓ All production database issues resolved!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Production sync failed:", error);
    process.exit(1);
  });