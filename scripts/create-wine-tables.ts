/**
 * Script to create wine database tables
 * This script will set up the database tables for the wine database system
 */
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import * as schema from "../shared/schema";
import * as wineSchema from "../shared/wine-schema";
import { sql } from "drizzle-orm";

async function createWineTables() {
  console.log("Creating wine database tables...");
  
  try {
    // Initialize Neon database client
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql, { schema: { ...schema, ...wineSchema } });
    
    // First check if tables already exist
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'wines'
      );
    `;
    
    if (tableCheck[0].exists) {
      console.log("Wine tables already exist. Exiting.");
      return;
    }
    
    // Create wines table
    await sql`
      CREATE TABLE IF NOT EXISTS wines (
        id SERIAL PRIMARY KEY,
        producer VARCHAR(255),
        wine_name VARCHAR(255) NOT NULL,
        vintage VARCHAR(10),
        varietal VARCHAR(255),
        region VARCHAR(255),
        country VARCHAR(255),
        appellation VARCHAR(255),
        wine_type VARCHAR(50),
        wine_style VARCHAR(100),
        bottle_size VARCHAR(50),
        alcohol_content VARCHAR(10),
        verified BOOLEAN DEFAULT FALSE,
        verified_source VARCHAR(100),
        tasting_notes TEXT,
        vivino_id VARCHAR(100),
        vivino_url VARCHAR(255),
        vivino_rating VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        search_text TEXT
      )
    `;
    console.log("Created wines table");
    
    // Create restaurant_wines table
    await sql`
      CREATE TABLE IF NOT EXISTS restaurant_wines (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
        wine_id INTEGER NOT NULL REFERENCES wines(id),
        price VARCHAR(50),
        by_the_glass BOOLEAN DEFAULT FALSE,
        custom_description TEXT,
        featured BOOLEAN DEFAULT FALSE,
        active BOOLEAN DEFAULT TRUE,
        added_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(restaurant_id, wine_id)
      )
    `;
    console.log("Created restaurant_wines table");
    
    // Create wine_list_uploads table
    await sql`
      CREATE TABLE IF NOT EXISTS wine_list_uploads (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES restaurants(id),
        uploaded_by INTEGER NOT NULL,
        file_name VARCHAR(255),
        file_size INTEGER,
        wine_count INTEGER,
        new_wine_count INTEGER,
        status VARCHAR(50) DEFAULT 'completed',
        processing_time INTEGER,
        uploaded_at TIMESTAMP DEFAULT NOW(),
        error_message TEXT
      )
    `;
    console.log("Created wine_list_uploads table");
    
    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_wines_name ON wines(wine_name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_wines_producer ON wines(producer)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_wines_region ON wines(region)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_wines_varietal ON wines(varietal)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_wines_search_text ON wines(search_text)`;
    console.log("Created indexes for wines table");
    
    console.log("Successfully created all wine database tables and indexes");
  } catch (error) {
    console.error("Error creating wine tables:", error);
    throw error;
  }
}

// Run the function immediately when imported directly
// This is the ESM equivalent of the CommonJS require.main === module check
createWineTables()
  .then(() => {
    console.log("Wine table creation completed");
  })
  .catch((error) => {
    console.error("Wine table creation failed:", error);
    process.exit(1);
  });

export { createWineTables };