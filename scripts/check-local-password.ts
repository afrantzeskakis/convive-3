import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function checkLocalPassword() {
  try {
    // Get the superadmin user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'superadmin'))
      .limit(1);
    
    if (!user) {
      console.log('❌ No superadmin user found');
      return;
    }
    
    console.log('Found user:', {
      id: user.id,
      username: user.username,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });
    
    // Test the password
    const testPassword = 'convive2023';
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    console.log(`\nPassword check for '${testPassword}': ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    // Show the password hash pattern
    console.log('\nPassword hash starts with:', user.password.substring(0, 29));
    console.log('Expected bcrypt format: $2a$ or $2b$');
    
  } catch (error) {
    console.error('Error checking password:', error);
  } finally {
    process.exit(0);
  }
}

checkLocalPassword();