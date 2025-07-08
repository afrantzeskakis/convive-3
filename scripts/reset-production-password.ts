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

async function resetProductionPassword() {
  try {
    const newPassword = "convive2023";
    const hashedPassword = await hashPassword(newPassword);
    
    console.log("Resetting password for superadmin in production database...");
    
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, "superadmin"))
      .returning();
    
    if (result.length > 0) {
      console.log("✓ Password reset successful for user: superadmin");
      console.log("✓ New password: convive2023");
      console.log("✓ Database: Production (Railway)");
    } else {
      console.log("✗ No user found with username: superadmin");
    }
  } catch (error) {
    console.error("Error resetting password:", error);
  } finally {
    process.exit(0);
  }
}

resetProductionPassword();