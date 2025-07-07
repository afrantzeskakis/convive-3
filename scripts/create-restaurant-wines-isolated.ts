/**
 * Direct SQL script to create restaurant_wines_isolated table
 * Run this against your production database to fix the missing table issue
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createRestaurantWinesIsolated() {
  try {
    console.log("Creating restaurant_wines_isolated table...");
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS restaurant_wines_isolated (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
        
        -- Basic wine information
        wine_name VARCHAR(255) NOT NULL,
        producer VARCHAR(255),
        vintage VARCHAR(10),
        region VARCHAR(255),
        country VARCHAR(255),
        varietals VARCHAR(255),
        wine_type VARCHAR(50),
        
        -- Enrichment status fields
        verified BOOLEAN DEFAULT false,
        verified_source VARCHAR(100),
        enrichment_status VARCHAR(50) DEFAULT 'pending',
        enrichment_started_at TIMESTAMP,
        enrichment_completed_at TIMESTAMP,
        
        -- Complete 5-stage enhancement fields
        wine_rating DECIMAL(3,2),
        general_guest_experience TEXT,
        flavor_notes TEXT,
        aroma_notes TEXT,
        what_makes_special TEXT,
        body_description TEXT,
        food_pairing TEXT,
        serving_temp VARCHAR(100),
        aging_potential TEXT,
        
        -- Restaurant-specific fields
        menu_price DECIMAL(10,2),
        cost_price DECIMAL(10,2),
        inventory_count INTEGER DEFAULT 0,
        wine_list_category VARCHAR(100),
        
        -- Metadata
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        -- Unique constraint
        CONSTRAINT restaurant_wine_unique UNIQUE (restaurant_id, wine_name, producer, vintage)
      );
    `;
    
    await pool.query(createTableSQL);
    console.log("✓ restaurant_wines_isolated table created successfully");
    
    // Create indexes for better query performance
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_restaurant_wines_isolated_restaurant_id 
        ON restaurant_wines_isolated(restaurant_id);
      
      CREATE INDEX IF NOT EXISTS idx_restaurant_wines_isolated_enrichment_status 
        ON restaurant_wines_isolated(enrichment_status);
        
      CREATE INDEX IF NOT EXISTS idx_restaurant_wines_isolated_verified 
        ON restaurant_wines_isolated(verified);
    `;
    
    await pool.query(createIndexesSQL);
    console.log("✓ Indexes created successfully");
    
  } catch (error) {
    console.error("Error creating table:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
createRestaurantWinesIsolated()
  .then(() => {
    console.log("Database setup completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database setup failed:", error);
    process.exit(1);
  });