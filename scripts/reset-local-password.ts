import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function resetLocalPassword() {
  try {
    console.log('Resetting local superadmin password...');
    
    // Hash the original password
    const hashedPassword = await bcrypt.hash('convive2023', 10);
    
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
      console.log('✅ Local superadmin password reset successfully!');
      console.log('Username: superadmin');
      console.log('Password: convive2023');
    } else {
      console.log('❌ No superadmin user found');
    }
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    process.exit(0);
  }
}

resetLocalPassword();