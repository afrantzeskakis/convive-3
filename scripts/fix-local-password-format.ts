import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function fixLocalPasswordFormat() {
  try {
    console.log('Fixing local superadmin password format...');
    
    // Hash the password using the correct format
    const hashedPassword = await hashPassword('convive2023');
    
    console.log('New password hash format:', hashedPassword.substring(0, 50) + '...');
    
    // Update the superadmin password
    const result = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.username, 'superadmin'))
      .returning();
    
    if (result.length > 0) {
      console.log('✅ Local superadmin password fixed successfully!');
      console.log('Username: superadmin');
      console.log('Password: convive2023');
    } else {
      console.log('❌ No superadmin user found');
    }
  } catch (error) {
    console.error('Error fixing password:', error);
  } finally {
    process.exit(0);
  }
}

fixLocalPasswordFormat();