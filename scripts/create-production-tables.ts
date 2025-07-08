import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { hashPassword } from "../server/auth";

async function createProductionTables() {
  console.log("Creating production tables...");
  
  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        city VARCHAR(255),
        gender VARCHAR(50),
        age INTEGER,
        occupation VARCHAR(255),
        bio TEXT,
        profile_picture TEXT,
        looking_for VARCHAR(50),
        onboarding_complete BOOLEAN DEFAULT false,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_premium_user BOOLEAN DEFAULT false,
        average_spend_per_dinner INTEGER DEFAULT 0,
        lifetime_dining_value INTEGER DEFAULT 0,
        authorized_restaurants INTEGER[],
        dinner_count INTEGER DEFAULT 0,
        high_check_dinner_count INTEGER DEFAULT 0,
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        has_seen_message_expiration_notice BOOLEAN DEFAULT false
      )
    `);
    console.log("✅ Users table created");

    // Create sessions table for authentication
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session(expire)
    `);
    console.log("✅ Session table created");

    // Check existing users
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    console.log(`Current users in database: ${userCount.rows[0].count}`);

    // Create super admin if doesn't exist
    const existingAdmin = await db.execute(sql`
      SELECT id FROM users WHERE username = 'superadmin'
    `);

    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await hashPassword("convive2023");
      
      await db.execute(sql`
        INSERT INTO users (
          username, password, full_name, email, city, gender, age,
          occupation, bio, profile_picture, looking_for, onboarding_complete, role
        ) VALUES (
          'superadmin', ${hashedPassword}, 'Super Admin', 'admin@convive.com',
          'San Francisco', 'Other', 30, 'System Administrator',
          'System administrator account', '', 'friends', true, 'super_admin'
        )
      `);
      console.log("✅ Super admin user created");
    } else {
      console.log("✅ Super admin already exists");
    }

    // Verify
    const finalCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    console.log(`✅ Total users: ${finalCount.rows[0].count}`);
    
    console.log("\n✅ Production setup complete!");
    console.log("\nYou can now login at https://convive-3-production.up.railway.app/ with:");
    console.log("Username: superadmin");
    console.log("Password: convive2023");
    
  } catch (error) {
    console.error("Error:", error);
  }
  
  process.exit(0);
}

createProductionTables();