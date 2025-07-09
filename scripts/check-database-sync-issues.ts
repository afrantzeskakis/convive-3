/**
 * Comprehensive database sync checker
 * Identifies all potential schema mismatches between local and production
 */

import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function checkDatabaseSync() {
  console.log("🔍 Checking for database sync issues...\n");
  
  const issues: string[] = [];
  
  try {
    // 1. Check all tables exist
    console.log("1. Checking tables...");
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const expectedTables = [
      'users',
      'session',
      'restaurants',
      'restaurant_wines_isolated',
      'recipes',
      'recipe_analyses',
      'recipe_training_data',
      'restaurant_sync_status',
      'restaurant_wine_descriptions',
      'wine_recommendation_logs',
      'culinary_term_cache',
      'user_preferences',
      'meetups',
      'meetup_participants',
      'messages',
      'message_connection_extensions',
      'match_scores',
      'subscription_plans',
      'user_subscriptions',
      'user_ticket_history',
      'dinner_tickets',
      'dinner_check_averages',
      'call_scripts',
      'call_recordings'
    ];
    
    const existingTables = tables.rows.map((r: any) => r.table_name);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      issues.push(`Missing tables: ${missingTables.join(', ')}`);
      console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
    } else {
      console.log(`✅ All expected tables exist`);
    }
    
    // 2. Check nullable constraints on key columns
    console.log("\n2. Checking nullable constraints...");
    const columnChecks = [
      { table: 'users', column: 'email', should_be_nullable: true },
      { table: 'users', column: 'username', should_be_nullable: false },
      { table: 'users', column: 'password', should_be_nullable: false },
      { table: 'users', column: 'full_name', should_be_nullable: false },
      { table: 'restaurants', column: 'manager_id', should_be_nullable: true }
    ];
    
    for (const check of columnChecks) {
      const result = await db.execute(sql`
        SELECT is_nullable 
        FROM information_schema.columns 
        WHERE table_name = ${check.table} 
        AND column_name = ${check.column}
      `);
      
      if (result.rows.length > 0) {
        const isNullable = result.rows[0].is_nullable === 'YES';
        if (isNullable !== check.should_be_nullable) {
          const issue = `${check.table}.${check.column} should be ${check.should_be_nullable ? 'nullable' : 'NOT NULL'}`;
          issues.push(issue);
          console.log(`❌ ${issue}`);
        } else {
          console.log(`✅ ${check.table}.${check.column} nullable constraint is correct`);
        }
      }
    }
    
    // 3. Check for orphaned data
    console.log("\n3. Checking for orphaned data...");
    
    // Check for restaurants without managers
    const orphanedRestaurants = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM restaurants 
      WHERE manager_id IS NOT NULL 
      AND manager_id NOT IN (SELECT id FROM users)
    `);
    
    if (parseInt(orphanedRestaurants.rows[0].count) > 0) {
      issues.push(`Found ${orphanedRestaurants.rows[0].count} restaurants with invalid manager_id`);
      console.log(`❌ Found ${orphanedRestaurants.rows[0].count} restaurants with invalid manager_id`);
    } else {
      console.log(`✅ No orphaned restaurants found`);
    }
    
    // 4. Check unique constraints
    console.log("\n4. Checking unique constraints...");
    const uniqueChecks = await db.execute(sql`
      SELECT 
        tc.table_name,
        kcu.column_name,
        tc.constraint_type
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    const expectedUniques = [
      'users.username',
      'users.email'
    ];
    
    const existingUniques = uniqueChecks.rows.map((r: any) => `${r.table_name}.${r.column_name}`);
    const missingUniques = expectedUniques.filter(u => !existingUniques.some(e => e === u));
    
    if (missingUniques.length > 0) {
      issues.push(`Missing unique constraints: ${missingUniques.join(', ')}`);
      console.log(`❌ Missing unique constraints: ${missingUniques.join(', ')}`);
    } else {
      console.log(`✅ All expected unique constraints exist`);
    }
    
    // Summary
    console.log("\n📊 SUMMARY");
    console.log("==========");
    if (issues.length === 0) {
      console.log("✅ No database sync issues found!");
    } else {
      console.log(`❌ Found ${issues.length} sync issues:`);
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }
    
    process.exit(issues.length > 0 ? 1 : 0);
  } catch (error) {
    console.error("Error checking database sync:", error);
    process.exit(1);
  }
}

checkDatabaseSync();