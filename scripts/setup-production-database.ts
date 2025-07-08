import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { users } from "@shared/schema";
import bcrypt from "bcryptjs";

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function setupProductionDatabase() {
  console.log("Setting up production database...");
  
  try {
    // First check what tables exist
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log("Existing tables:", tablesResult.rows.map(r => r.table_name));
    
    // Create super admin user after schema is pushed
    const hashedPassword = await hashPassword("convive2023");
    
    // Check if super admin already exists
    const existingAdmin = await db.execute(sql`
      SELECT id FROM users WHERE username = 'superadmin'
    `);
    
    if (existingAdmin.rows.length === 0) {
      // Insert super admin user
      await db.insert(users).values({
        username: 'superadmin',
        password: hashedPassword,
        fullName: 'Super Admin',
        email: 'admin@convive.com',
        city: 'San Francisco',
        gender: 'Other',
        age: 30,
        occupation: 'System Administrator',
        bio: 'System administrator account',
        profilePicture: '',
        lookingFor: 'friends',
        onboardingComplete: true,
        role: 'super_admin'
      });
      
      console.log("✅ Super admin user created successfully");
    } else {
      console.log("✅ Super admin user already exists");
    }
    
    // Verify the user was created
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    console.log(`Total users in database: ${userCount.rows[0].count}`);
    
    console.log("✅ Production database setup complete!");
    
  } catch (error) {
    console.error("Error setting up production database:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

setupProductionDatabase();