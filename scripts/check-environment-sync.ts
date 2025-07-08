import { db } from '../server/db';
import { users, restaurants } from '../shared/schema';
import { restaurantWinesIsolated } from '../shared/wine-schema';
import { sql } from 'drizzle-orm';

async function checkEnvironmentSync() {
  console.log('=== Environment Sync Check ===\n');
  
  // 1. Check database connection
  console.log('1. DATABASE CONNECTION:');
  console.log('   URL:', process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'Not set');
  
  try {
    // 2. Check tables exist
    console.log('\n2. DATABASE TABLES:');
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('   Found tables:');
    tables.rows.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });
    
    // 3. Check user data
    console.log('\n3. USER DATA:');
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const userList = await db.select({ username: users.username, role: users.role }).from(users);
    
    console.log(`   Total users: ${userCount[0].count}`);
    console.log('   Users:');
    userList.forEach(u => {
      console.log(`   - ${u.username} (${u.role})`);
    });
    
    // 4. Check session data
    console.log('\n4. SESSION DATA:');
    const sessionCount = await db.execute(sql`SELECT count(*) FROM session`);
    console.log(`   Active sessions: ${sessionCount.rows[0].count}`);
    
    // 5. Check restaurant data
    console.log('\n5. RESTAURANT DATA:');
    try {
      const restaurantCount = await db.select({ count: sql<number>`count(*)` }).from(restaurants);
      console.log(`   Total restaurants: ${restaurantCount[0].count}`);
    } catch (e) {
      console.log('   Restaurants table not found or error');
    }
    
    // 6. Check wine data
    console.log('\n6. WINE DATA:');
    try {
      const wineCount = await db.select({ count: sql<number>`count(*)` }).from(restaurantWinesIsolated);
      console.log(`   Total wines: ${wineCount[0].count}`);
    } catch (e) {
      console.log('   Wine table not found or error');
    }
    
    // 7. Environment info
    console.log('\n7. ENVIRONMENT INFO:');
    console.log('   NODE_ENV:', process.env.NODE_ENV || 'Not set');
    console.log('   Port:', process.env.PORT || '5000');
    console.log('   Session Secret:', process.env.SESSION_SECRET ? 'Set' : 'Not set');
    console.log('   OpenAI Key:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');
    
  } catch (error) {
    console.error('Error checking environment:', error);
  } finally {
    process.exit(0);
  }
}

checkEnvironmentSync();