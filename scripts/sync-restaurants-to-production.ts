/**
 * Script to sync restaurants from local to production
 * This will add the missing restaurants to the production database
 */

import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

async function syncRestaurants() {
  // Use the production DATABASE_URL from Railway
  const productionUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!productionUrl) {
    console.error('Please set PRODUCTION_DATABASE_URL environment variable');
    process.exit(1);
  }

  const db = neon(productionUrl);

  try {
    console.log('Checking existing restaurants in production...');
    
    // Get current restaurants
    const existingRestaurants = await db`SELECT id, name FROM restaurants ORDER BY id`;
    console.log(`Found ${existingRestaurants.length} restaurants in production:`, existingRestaurants);

    // Define all restaurants that should exist
    const allRestaurants = [
      { 
        id: 1, 
        name: 'Bella Italia Restaurant',
        description: 'Authentic Italian cuisine in a cozy atmosphere.',
        cuisine_type: 'Italian',
        address: '123 Main St, New York, NY',
        is_featured: true,
        price_range: '$$$'
      },
      {
        id: 2,
        name: 'Sakura Japanese Bistro',
        description: 'Modern Japanese cuisine with fresh ingredients.',
        cuisine_type: 'Japanese', 
        address: '789 East St, Manhattan, NY',
        is_featured: true,
        price_range: '$$'
      },
      {
        id: 3,
        name: 'Page Turner Café',
        description: 'Cozy café with great brunch options.',
        cuisine_type: 'Café',
        address: '456 Park Ave, Brooklyn, NY',
        is_featured: false,
        price_range: '$$'
      },
      {
        id: 4,
        name: "Olivia's Mediterranean",
        description: 'Mediterranean cuisine with a modern twist.',
        cuisine_type: 'Mediterranean',
        address: '321 West St, New York, NY',
        is_featured: true,
        price_range: '$$$'
      },
      {
        id: 5,
        name: 'Italian Bistro',
        description: 'Classic Italian dishes in an elegant setting.',
        cuisine_type: 'Italian',
        address: '555 5th Ave, New York, NY',
        is_featured: false,
        price_range: '$$$$'
      },
      {
        id: 6,
        name: 'Sushi Paradise',
        description: 'Premium sushi and Japanese fusion.',
        cuisine_type: 'Japanese',
        address: '888 Madison Ave, New York, NY',
        is_featured: true,
        price_range: '$$$$'
      },
      {
        id: 7,
        name: 'Test Kitchen & Wine Bar',
        description: 'Innovative cuisine with extensive wine selection.',
        cuisine_type: 'Contemporary',
        address: '999 Park Ave, New York, NY',
        is_featured: true,
        price_range: '$$$'
      }
    ];

    // Check which restaurants are missing
    const existingIds = existingRestaurants.map(r => r.id);
    const missingRestaurants = allRestaurants.filter(r => !existingIds.includes(r.id));

    if (missingRestaurants.length === 0) {
      console.log('All restaurants already exist in production!');
      return;
    }

    console.log(`\nNeed to add ${missingRestaurants.length} restaurants:`);
    missingRestaurants.forEach(r => console.log(`- ${r.name} (ID: ${r.id})`));

    // Insert missing restaurants
    for (const restaurant of missingRestaurants) {
      try {
        await db`
          INSERT INTO restaurants (id, name, description, cuisine_type, address, is_featured, price_range)
          VALUES (${restaurant.id}, ${restaurant.name}, ${restaurant.description}, 
                  ${restaurant.cuisine_type}, ${restaurant.address}, ${restaurant.is_featured}, 
                  ${restaurant.price_range})
        `;
        console.log(`✅ Added: ${restaurant.name}`);
      } catch (error) {
        console.error(`❌ Failed to add ${restaurant.name}:`, error);
      }
    }

    // Verify final count
    const finalRestaurants = await db`SELECT id, name FROM restaurants ORDER BY id`;
    console.log(`\nFinal restaurant count: ${finalRestaurants.length}`);
    finalRestaurants.forEach(r => console.log(`- ${r.name} (ID: ${r.id})`));

  } catch (error) {
    console.error('Error syncing restaurants:', error);
  }
}

// Run the sync
syncRestaurants();