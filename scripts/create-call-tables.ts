import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createTables() {
  try {
    console.log('Creating call management tables...');
    
    // Create callScripts table first (since it doesn't depend on other tables)
    console.log('Creating call_scripts table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS call_scripts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        script_content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        script_type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by INTEGER REFERENCES users(id),
        last_modified_by INTEGER REFERENCES users(id)
      );
    `);
    
    // Insert sample call script
    console.log('Inserting sample call script...');
    await db.execute(sql`
      INSERT INTO call_scripts (name, description, script_content, script_type, created_at, updated_at)
      VALUES (
        'Standard Reservation Script', 
        'Default script for making restaurant reservations',
        'Hello, I am calling on behalf of Convive to make a reservation for a party of {party_size} on {date} at {time}. We would need a table for a social dining experience. The reservation would be under the name {reservation_name}. Could you please confirm if this is available? ... Great, thank you. Our confirmation code is {confirmation_code}. Have a wonderful day!',
        'reservation',
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('Call scripts created successfully!');
  } catch (error) {
    console.error('Error creating call management tables:', error);
  } finally {
    process.exit(0);
  }
}

createTables();