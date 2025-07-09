import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkUser() {
  try {
    console.log("Checking for user 'restadmin1'...");
    
    // Query for all users to see what's in the database
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        email: users.email,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(users.createdAt);
    
    console.log('\nAll users in database:');
    allUsers.forEach(u => {
      console.log(`- ${u.username} (ID: ${u.id}, Role: ${u.role}, Created: ${u.createdAt})`);
    });
    
    // Query for the restadmin1 user
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, 'restadmin1'));
    
    if (result.length === 0) {
      console.log('User "restadmin1" not found in database');
    } else {
      const user = result[0];
      console.log('\nUser found:');
      console.log('ID:', user.id);
      console.log('Username:', user.username);
      console.log('Role:', user.role);
      console.log('Email:', user.email || 'null');
      console.log('Full Name:', user.fullName);
      console.log('Created At:', user.createdAt);
      console.log('\nPassword hash format check:');
      console.log('Has password:', !!user.password);
      console.log('Password length:', user.password?.length || 0);
      console.log('Contains dot separator:', user.password?.includes('.') || false);
      console.log('First 30 chars:', user.password?.substring(0, 30) + '...');
      
      // Check password format more thoroughly
      if (user.password) {
        const parts = user.password.split('.');
        console.log('\nPassword structure:');
        console.log('Number of parts:', parts.length);
        if (parts.length === 2) {
          console.log('Hash length:', parts[0].length);
          console.log('Salt length:', parts[1].length);
          console.log('Expected format: ✓ (should be hash.salt)');
        } else {
          console.log('Unexpected format! Should have exactly 2 parts separated by dot');
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking user:', error);
    process.exit(1);
  }
}

checkUser();