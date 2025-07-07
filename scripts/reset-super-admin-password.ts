import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function resetSuperAdminPassword() {
  try {
    // New password for the super admin
    const newPassword = "convive2023";
    
    // Hash the password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the user with username 'superadmin'
    const updatedUsers = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, "superadmin"))
      .returning();
    
    if (updatedUsers.length === 0) {
      console.log("No super admin user found with username 'superadmin'");
      return;
    }
    
    console.log(`Password reset successful for user: ${updatedUsers[0].username}`);
    console.log(`New password: ${newPassword}`);
  } catch (error) {
    console.error("Error resetting super admin password:", error);
  } finally {
    // Close the connection
    process.exit(0);
  }
}

// Run the reset function
resetSuperAdminPassword();