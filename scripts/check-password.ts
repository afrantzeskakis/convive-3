import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function hashPassword(password: string): Promise<string> {
  const salt = "a7dffea01a50269eee7a16972c274f5d"; // Use the same salt as in the database
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  // The password from the database (without salt)
  const storedPassword = "763fbbc63eafecad9b9d8004a0418b3288d67e675e98c8b78c7f82d4dc589802a9143ddf7a21984fcac4970ac4f01426e83bd11225bda270e9ebd20a0f43f010.a7dffea01a50269eee7a16972c274f5d";
  
  // Try comparing with "password"
  const passwordToCheck = "password";
  const hashedPassword = await hashPassword(passwordToCheck);
  
  console.log("Admin user password hash in DB:", storedPassword);
  console.log("Hashed 'password':", hashedPassword);
  
  const isMatch = await comparePasswords(passwordToCheck, storedPassword);
  console.log(`Password "${passwordToCheck}" matches: ${isMatch}`);
  
  // This is for debugging. In a real application, we would never output this
  // Try a few other passwords
  for (const testPassword of ["admin", "Admin", "admin123", "test"]) {
    const testMatch = await comparePasswords(testPassword, storedPassword);
    console.log(`Password "${testPassword}" matches: ${testMatch}`);
  }
}

main().catch(console.error);