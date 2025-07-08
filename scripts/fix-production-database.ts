import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function fixProductionDatabase() {
  try {
    console.log("🔧 Fixing production database...");
    console.log("📍 Database URL:", process.env.DATABASE_URL ? "Connected" : "Not configured");
    
    // First, check if we can connect to the database
    const testConnection = await db.execute(sql`SELECT current_database(), current_schema()`);
    console.log("✅ Database connection successful");
    console.log("📊 Current database:", testConnection.rows[0]);
    
    // Check if users table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    const tableExists = tableCheck.rows[0]?.exists;
    console.log("📋 Users table exists:", tableExists);
    
    if (!tableExists) {
      console.log("⚠️ Users table doesn't exist. Creating it now...");
      
      // Create users table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password TEXT NOT NULL,
          "fullName" VARCHAR(255),
          email VARCHAR(255) UNIQUE,
          city VARCHAR(255),
          gender VARCHAR(50),
          age INTEGER,
          occupation VARCHAR(255),
          bio TEXT,
          "profilePicture" VARCHAR(255),
          "lookingFor" VARCHAR(255),
          "onboardingComplete" BOOLEAN DEFAULT FALSE,
          role VARCHAR(50) DEFAULT 'user',
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "isPremiumUser" BOOLEAN DEFAULT FALSE,
          "averageSpendPerDinner" DECIMAL(10, 2),
          "lifetimeDiningValue" DECIMAL(10, 2),
          "authorizedRestaurants" INTEGER[],
          "dinnerCount" INTEGER DEFAULT 0,
          "highCheckDinnerCount" INTEGER DEFAULT 0,
          "stripeCustomerId" VARCHAR(255),
          "stripeSubscriptionId" VARCHAR(255),
          "hasSeenMessageExpirationNotice" BOOLEAN DEFAULT FALSE
        )
      `);
      
      console.log("✅ Users table created successfully");
    }
    
    // Check if super admin exists
    const superAdminCheck = await db.execute(sql`
      SELECT id, username, role FROM users WHERE username = 'superadmin'
    `);
    
    if (superAdminCheck.rows.length === 0) {
      console.log("⚠️ Super admin doesn't exist. Creating it now...");
      
      const hashedPassword = await hashPassword("convive2023");
      
      await db.execute(sql`
        INSERT INTO users (username, password, "fullName", email, role, "onboardingComplete")
        VALUES ('superadmin', ${hashedPassword}, 'Super Administrator', 'superadmin@convive.com', 'super_admin', true)
      `);
      
      console.log("✅ Super admin created successfully");
    } else {
      console.log("✅ Super admin already exists");
      console.log("👤 Super admin info:", superAdminCheck.rows[0]);
      
      // Reset the password just to be sure
      console.log("🔑 Resetting super admin password...");
      const hashedPassword = await hashPassword("convive2023");
      
      await db.execute(sql`
        UPDATE users 
        SET password = ${hashedPassword}
        WHERE username = 'superadmin'
      `);
      
      console.log("✅ Super admin password reset successfully");
    }
    
    // Count total users
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    console.log("👥 Total users in database:", userCount.rows[0]?.count);
    
    // Check database schema permissions
    const schemaCheck = await db.execute(sql`
      SELECT schema_name, schema_owner 
      FROM information_schema.schemata 
      WHERE schema_name = 'public'
    `);
    console.log("🔐 Schema info:", schemaCheck.rows[0]);
    
    console.log("\n✅ Production database fix completed!");
    console.log("🎉 You should now be able to login with:");
    console.log("   Username: superadmin");
    console.log("   Password: convive2023");
    
  } catch (error) {
    console.error("❌ Error fixing production database:", error);
    
    // If we get a "relation does not exist" error, try to diagnose further
    if (error instanceof Error && error.message.includes("relation") && error.message.includes("does not exist")) {
      console.log("\n🔍 Diagnosing database issue...");
      
      try {
        // List all tables in the database
        const tables = await db.execute(sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name
        `);
        
        console.log("📋 Tables in database:");
        tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
        
      } catch (diagError) {
        console.error("❌ Error during diagnosis:", diagError);
      }
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the fix
fixProductionDatabase();