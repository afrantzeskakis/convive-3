import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createRestaurantsTable() {
  try {
    console.log("Creating restaurants table in production...");
    
    // Create the restaurants table
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
    
    console.log("✓ Restaurants table created successfully");
    
    // Insert sample restaurants
    await db.execute(sql`
      INSERT INTO restaurants (name, description, cuisine_type, address, distance, image_url, rating, ambiance, noise_level, price_range, features, menu_url, is_featured)
      VALUES 
        ('Bella Italia Restaurant', 'Authentic Italian cuisine in a cozy atmosphere.', 'Italian, Pasta, Pizza', '123 Main St, New York, NY', '1.5 mi', 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17', '4.6', 'Elegant', 'Moderate', '$$$', ARRAY['Outdoor Seating', 'Wine List', 'Vegetarian Options'], '/menu/bella-italia', true),
        ('Sakura Japanese Bistro', 'Modern Japanese cuisine with a focus on fresh ingredients.', 'Japanese, Sushi, Asian Fusion', '789 East St, Manhattan, NY', '0.8 mi', 'https://images.unsplash.com/photo-1552566626-52f8b828add9', '4.5', 'Modern', 'Lively', '$$', ARRAY['Sushi Bar', 'Sake Selection', 'Private Dining'], '/menu/sakura-bistro', true),
        ('Page Turner Café', 'Cozy café with great brunch options and book-themed ambiance.', 'Café, Brunch, Vegetarian', '456 Park Ave, Brooklyn, NY', '0.5 mi', 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2', '4.7', 'Casual', 'Quiet', '$$', ARRAY['Book Exchange', 'Organic Coffee', 'Vegan Options'], '/menu/page-turner', false),
        ('Olivias Mediterranean', 'Fresh Mediterranean cuisine with vegetarian-friendly options.', 'Mediterranean, Vegetarian-Friendly', '555 Ocean Dr, New York, NY', '1.2 mi', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b', '4.8', 'Cozy', 'Quiet', '$$', ARRAY['Outdoor Seating', 'Mezze Platters', 'Gluten-Free Options'], '/menu/olivias', false)
    `);
    
    console.log("✓ Sample restaurants inserted");
    
    // Verify the table
    const result = await db.execute(sql`SELECT COUNT(*) FROM restaurants`);
    console.log(`✓ Restaurants table now has ${result.rows[0].count} entries`);
    
  } catch (error) {
    console.error("Error creating restaurants table:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

createRestaurantsTable();