import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Migration script to add premium user fields and related tables
 */
async function main() {
  console.log("Starting migration to add premium user fields and tables...");

  try {
    // Add premium user fields to users table
    console.log("Adding premium user fields to users table...");
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_premium_user BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS average_spend_per_dinner DECIMAL(10,2) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS lifetime_dining_value DECIMAL(10,2) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS dinner_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS high_check_dinner_count INTEGER DEFAULT 0
    `);
    console.log("✓ Premium user fields added to users table");

    // Create dinner_check_averages table
    console.log("Creating dinner_check_averages table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS dinner_check_averages (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
        meetup_id INTEGER NOT NULL REFERENCES meetups(id),
        reported_by INTEGER NOT NULL REFERENCES users(id),
        check_average_per_person DECIMAL(10,2) NOT NULL,
        total_bill_amount DECIMAL(10,2) NOT NULL,
        participant_count INTEGER NOT NULL,
        is_high_check_average BOOLEAN DEFAULT FALSE,
        notes TEXT,
        reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log("✓ dinner_check_averages table created");

    // Create subscription plans table if it doesn't exist
    console.log("Creating subscription_plans table if it doesn't exist...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        dinners_per_month INTEGER NOT NULL,
        stripe_price_id VARCHAR(100),
        is_premium BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log("✓ subscription_plans table created");

    // Create user subscriptions table if it doesn't exist
    console.log("Creating user_subscriptions table if it doesn't exist...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        stripe_subscription_id VARCHAR(100),
        start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        end_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log("✓ user_subscriptions table created");

    // Create dinner tickets table if it doesn't exist
    console.log("Creating dinner_tickets table if it doesn't exist...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS dinner_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        ticket_type VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        is_premium BOOLEAN DEFAULT FALSE,
        stripe_payment_intent_id VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        used_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log("✓ dinner_tickets table created");

    // Create user_ticket_history table
    console.log("Creating user_ticket_history table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_ticket_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        ticket_id INTEGER REFERENCES dinner_tickets(id),
        subscription_id INTEGER REFERENCES user_subscriptions(id),
        ticket_type VARCHAR(50) NOT NULL,
        purchase_amount DECIMAL(10,2) NOT NULL,
        purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log("✓ user_ticket_history table created");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });