import { db } from "../server/db";
import { users, type InsertUser } from "../shared/schema";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createSuperAdminUser() {
  // Check if super admin user already exists
  const existingSuperAdmin = await db.select().from(users).where(eq(users.username, "superadmin"));

  if (existingSuperAdmin.length > 0) {
    console.log("Super admin user already exists");
    return;
  }

  const superAdminUser: InsertUser = {
    username: "superadmin",
    password: await hashPassword("superadmin123"), // Please change this in production
    fullName: "Super Admin",
    email: "superadmin@example.com",
    age: 30,
    occupation: "System Administrator",
    bio: "Super administrator with full system access",
    profilePicture: null,
    role: "super_admin" // Set the role to super_admin
  };

  try {
    const [user] = await db.insert(users).values(superAdminUser).returning();
    console.log("Super admin user created successfully:", user.username);
  } catch (error) {
    console.error("Error creating super admin user:", error);
  } finally {
    process.exit(0);
  }
}

createSuperAdminUser();