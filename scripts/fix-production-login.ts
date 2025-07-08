import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function fixProductionLogin() {

  try {
    console.log("🔍 Checking production database...");
    
    // First, list all users to see what's in production
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role
    }).from(users);
    
    console.log(`\n📊 Total users in production database: ${allUsers.length}`);
    console.log("👥 Users found:");
    allUsers.forEach(u => {
      console.log(`   - ${u.username} (ID: ${u.id}, Role: ${u.role}, Email: ${u.email})`);
    });
    
    // Check if superadmin exists
    const [superAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.username, "superadmin"));
    
    if (!superAdmin) {
      console.log("\n❌ Super admin user NOT found in production database!");
      console.log("✨ Creating super admin user...");
      
      const hashedPassword = await hashPassword("convive2023");
      
      const [newUser] = await db.insert(users).values({
        username: "superadmin",
        password: hashedPassword,
        fullName: "Super Admin",
        email: "superadmin@example.com",
        role: "super_admin",
        age: 30,
        occupation: "System Administrator",
        bio: "Super administrator with full system access",
        profilePicture: null,
        city: null,
        gender: null,
        lookingFor: null,
        onboardingComplete: true,
        isPremiumUser: false,
        averageSpendPerDinner: null,
        lifetimeDiningValue: null,
        authorizedRestaurants: null,
        dinnerCount: 0,
        highCheckDinnerCount: 0,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      }).returning();
      
      console.log("✅ Super admin created successfully!");
      console.log(`   Username: ${newUser.username}`);
      console.log(`   Password: convive2023`);
    } else {
      console.log("\n✅ Super admin found! Resetting password...");
      
      const hashedPassword = await hashPassword("convive2023");
      
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.username, "superadmin"));
      
      console.log("✅ Password reset successful!");
      console.log(`   Username: superadmin`);
      console.log(`   Password: convive2023`);
    }
    
    console.log("\n🎉 Production database fixed! You can now log in on Railway.");
    
  } catch (error) {
    console.error("\n❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

fixProductionLogin();