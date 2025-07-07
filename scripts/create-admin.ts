import { db } from "../server/db";
import { users, type InsertUser } from "../shared/schema";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { eq, sql } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  // Check if admin user already exists
  const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));

  if (existingAdmin.length > 0) {
    console.log("Admin user already exists");
    return;
  }

  const adminUser: InsertUser = {
    username: "admin",
    password: await hashPassword("admin123"), // Please change this in production
    fullName: "Admin User",
    email: "admin@example.com",
    age: 30,
    occupation: "Administrator",
    bio: "System administrator",
    profilePicture: null
  };

  try {
    const [user] = await db.insert(users).values(adminUser).returning();
    console.log("Admin user created successfully:", user.username);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();