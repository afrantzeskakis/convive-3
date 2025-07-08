/**
 * Railway production database sync
 * Run this in Railway console to create missing tables
 */

const { db } = require('./server/db');
const { sql } = require('drizzle-orm');

async function syncDatabase() {
  console.log('Creating missing tables in production...');
  
  // Create restaurants table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS restaurants (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      cuisine_type VARCHAR(255),
      cuisine_description TEXT,
      address TEXT NOT NULL,
      distance VARCHAR(50),
      image_url TEXT,
      rating VARCHAR(10),
      ambiance VARCHAR(50),
      noise_level VARCHAR(50),
      price_range VARCHAR(10),
      features JSONB,
      awards JSONB,
      menu_url VARCHAR(255),
      is_featured BOOLEAN DEFAULT false,
      manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  
  console.log('✅ Database sync complete!');
}

syncDatabase().catch(console.error);