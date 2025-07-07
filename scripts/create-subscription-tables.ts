import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import ws from 'ws';

// Configure neon to use the WebSocket implementation
neonConfig.webSocketConstructor = ws;

/**
 * Script to create subscription plans and user subscriptions tables
 */
async function createSubscriptionTables() {
  console.log("Creating subscription tables...");
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  
  // Create database connection
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  try {
    // Create subscription_plans table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        tier TEXT NOT NULL DEFAULT 'standard',
        dinner_count INTEGER NOT NULL,
        duration_months INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stripe_price_id TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create user_subscriptions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        tier TEXT NOT NULL DEFAULT 'standard',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        dinners_remaining INTEGER NOT NULL,
        cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create dinner_tickets table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS dinner_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        meetup_id INTEGER REFERENCES meetups(id),
        tier TEXT NOT NULL DEFAULT 'standard',
        price DECIMAL(10,2) NOT NULL,
        payment_intent_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
        used_at TIMESTAMP,
        expires_at TIMESTAMP
      );
    `);
    
    // Create some initial subscription plans if none exist
    // Use SQL directly rather than the schema to avoid column missing errors
    const plansResult = await db.execute(sql`SELECT COUNT(*) FROM subscription_plans`);
    if (plansResult.rows[0].count === '0') {
      // Insert plans using raw SQL
      await db.execute(sql`
        INSERT INTO subscription_plans 
          (name, description, tier, dinner_count, duration_months, price, active) 
        VALUES
          ('Standard Monthly', 'Standard tier with 2 dinners per month', 'standard', 2, 1, 179.99, true),
          ('Standard Quarterly', 'Standard tier with 2 dinners per month, quarterly plan', 'standard', 6, 3, 499.99, true),
          ('High Roller Monthly', 'Premium high roller tier with 2 dinners per month', 'high_roller', 2, 1, 299.99, true),
          ('High Roller Quarterly', 'Premium high roller tier with 2 dinners per month, quarterly plan', 'high_roller', 6, 3, 799.99, true)
      `);
      console.log("Initial subscription plans created");
    }
    
    console.log("Subscription tables created successfully!");
  } catch (error) {
    console.error("Error creating subscription tables:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

createSubscriptionTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to create subscription tables:", error);
    process.exit(1);
  });