import { pool, db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Migration script to add the messaging expiration functionality
 * Adds:
 * 1. expiresAt column to messages table
 * 2. Creates message_connection_extensions table
 * 3. Adds hasSeenMessageExpirationNotice to users table
 */
async function updateMessagingSchema() {
  console.log("Starting messaging schema update...");

  try {
    // 1. Add expiresAt column to messages table if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'messages' AND column_name = 'expires_at'
        ) THEN
          ALTER TABLE messages ADD COLUMN expires_at TIMESTAMP;
        END IF;
      END $$;
    `);
    console.log("Added expiresAt column to messages table");

    // 2. Set expiration dates for existing messages (1 week from now)
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    await db.execute(sql`
      UPDATE messages 
      SET expires_at = ${oneWeekFromNow}
      WHERE expires_at IS NULL;
    `);
    console.log("Set expiration dates for existing messages");

    // 3. Create message_connection_extensions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS message_connection_extensions (
        id SERIAL PRIMARY KEY,
        meetup_id INTEGER NOT NULL REFERENCES meetups(id),
        requested_by_id INTEGER NOT NULL REFERENCES users(id),
        approved_by_id INTEGER REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
        approved_at TIMESTAMP,
        expires_at TIMESTAMP
      );
    `);
    console.log("Created message_connection_extensions table");

    // 4. Add hasSeenMessageExpirationNotice column to users table if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'has_seen_message_expiration_notice'
        ) THEN
          ALTER TABLE users ADD COLUMN has_seen_message_expiration_notice BOOLEAN DEFAULT false;
        END IF;
      END $$;
    `);
    console.log("Added hasSeenMessageExpirationNotice column to users table");

    console.log("Messaging schema update completed successfully");
  } catch (error) {
    console.error("Error updating messaging schema:", error);
    throw error;
  }
}

// Run the migration
updateMessagingSchema()
  .then(() => {
    console.log("Messaging schema update completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error updating messaging schema:", error);
    process.exit(1);
  });