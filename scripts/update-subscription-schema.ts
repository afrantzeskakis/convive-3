import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import ws from 'ws';

// Configure neon to use the WebSocket implementation
neonConfig.webSocketConstructor = ws;

/**
 * Migration script to update subscription plans and user subscriptions
 * with tier field, and dinner tickets with tier and expiresAt fields
 */
async function updateSubscriptionSchema() {
  console.log("Updating subscription plans and dinner tickets schema...");
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  
  // Create database connection
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  try {
    // Add tier field to subscription_plans if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS(
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name='subscription_plans' AND column_name='tier'
        ) THEN 
          ALTER TABLE subscription_plans ADD COLUMN tier text NOT NULL DEFAULT 'standard';
        END IF;
      END $$;
    `);
    
    // Add tier field to user_subscriptions if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS(
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name='user_subscriptions' AND column_name='tier'
        ) THEN 
          ALTER TABLE user_subscriptions ADD COLUMN tier text NOT NULL DEFAULT 'standard';
        END IF;
      END $$;
    `);
    
    // Add tier and expiresAt fields to dinner_tickets if they don't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS(
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name='dinner_tickets' AND column_name='tier'
        ) THEN 
          ALTER TABLE dinner_tickets ADD COLUMN tier text NOT NULL DEFAULT 'standard';
        END IF;
        
        IF NOT EXISTS(
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name='dinner_tickets' AND column_name='expires_at'
        ) THEN 
          ALTER TABLE dinner_tickets ADD COLUMN expires_at timestamp;
        END IF;
      END $$;
    `);
    
    console.log("Schema updated successfully!");
  } catch (error) {
    console.error("Error updating subscription schema:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

updateSubscriptionSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });