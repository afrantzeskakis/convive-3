import { db } from '../server/db';
import { storage } from '../server/database-storage';
import { groupFormationService } from '../server/services/group-formation';

/**
 * This script tests the group formation algorithm with different user counts
 * to demonstrate how it forms balanced groups with the following constraints:
 * - Target: 5-6 users + 1 host per table (most common)
 * - Maximum: 7 users + 1 host (rare, but allowed if needed)
 * - Minimum: 4 users + 1 host (absolute minimum)
 */

async function runGroupFormationTest() {
  console.log('🧪 Testing Group Formation Algorithm');
  console.log('====================================');
  
  try {
    // Test scenarios with different user counts
    // These scenarios test a range of cases:
    // - Very small number of users (4-8)
    // - Numbers that would create unbalanced groups with previous algorithm (13, 17, 19)
    // - Numbers where 7-person groups might be needed (23, 31, 37)
    // - Larger groups to verify scalability (45, 60)
    const scenarios = [4, 5, 8, 9, 13, 17, 19, 23, 31, 37, 45, 60];
    
    for (const userCount of scenarios) {
      console.log(`\n📊 SCENARIO: ${userCount} users`);
      console.log('-'.repeat(50));
      
      // Create test users if needed
      const userIds = await ensureTestUsers(userCount);
      
      // Form optimal groups
      console.log(`Forming optimal groups for ${userCount} users...`);
      const groups = await groupFormationService.formOptimalGroups(userIds);
      
      // Display results
      console.log(`✅ Created ${groups.length} groups:`);
      
      let totalUsers = 0;
      let standardGroups = 0; // 5-6 users
      let largeGroups = 0;    // 7 users (rare)
      let smallGroups = 0;    // 4 users (minimum)
      let tooSmallGroups = 0; // <4 users (only in extreme cases)
      
      groups.forEach((group, index) => {
        const size = group.users.length;
        let groupType = '';
        
        if (size === 7) {
          groupType = '📈 LARGE GROUP';
          largeGroups++;
        } else if (size >= 5 && size <= 6) {
          groupType = '✓ Standard Size';
          standardGroups++;
        } else if (size === 4) {
          groupType = '📉 MINIMUM SIZE';
          smallGroups++;
        } else if (size < 4) {
          groupType = '⚠️ TOO SMALL';
          tooSmallGroups++;
        }
        
        console.log(`  Group ${index + 1}: ${size} users ${groupType} (Compatibility: ${group.averageCompatibility.toFixed(2)})`);
        
        // List users in group
        group.users.forEach(user => {
          console.log(`    - ${user.fullName} (ID: ${user.id})`);
        });
        
        totalUsers += size;
      });
      
      // Calculate group size distribution
      console.log(`\n📊 Group Size Distribution:`);
      console.log(`  Standard groups (5-6 users): ${standardGroups} (${Math.round(standardGroups/groups.length*100)}%)`);
      console.log(`  Large groups (7 users):     ${largeGroups} (${Math.round(largeGroups/groups.length*100)}%)`);
      console.log(`  Minimum groups (4 users):   ${smallGroups} (${Math.round(smallGroups/groups.length*100)}%)`);
      if (tooSmallGroups > 0) {
        console.log(`  Too small groups (<4 users): ${tooSmallGroups} (${Math.round(tooSmallGroups/groups.length*100)}%) - These should be rare!`);
      }
      
      console.log(`\nTotal: ${totalUsers} users in ${groups.length} groups`);
      console.log(`Average group size: ${(totalUsers / groups.length).toFixed(2)} users per group`);
      console.log(`Each group will also have 1 host (not included in counts above)`);
      
      // Calculate total people including hosts
      const totalPeople = totalUsers + groups.length; // Add one host per group
      console.log(`Total people including hosts: ${totalPeople}`);
      
      // Optional: Create actual meetups for these groups
      const createMeetups = false; // Set to true if you want to create actual meetups
      if (createMeetups) {
        const restaurantId = 1; // Assuming you have at least one restaurant
        const date = new Date();
        date.setDate(date.getDate() + 7); // One week from now
        
        const meetupIds = await groupFormationService.createMeetupsFromGroups(
          groups,
          restaurantId,
          date,
          '19:00',
          '21:00'
        );
        
        console.log(`Created ${meetupIds.length} meetups: ${meetupIds.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

/**
 * Ensures we have enough test users for the scenario
 */
async function ensureTestUsers(count: number): Promise<number[]> {
  // First check if we have enough existing users
  const existingUsers = await storage.getAllUsers();
  if (existingUsers.length >= count) {
    return existingUsers.slice(0, count).map(user => user.id);
  }
  
  // Create additional test users as needed
  const userIds: number[] = existingUsers.map(user => user.id);
  
  for (let i = existingUsers.length; i < count; i++) {
    // Generate a unique username
    const username = `testuser${i + 1}`;
    
    // Create the user
    const user = await storage.createUser({
      username,
      password: 'password123',
      fullName: `Test User ${i + 1}`,
      email: `${username}@example.com`,
      city: ['New York', 'Chicago', 'Los Angeles', 'Miami', 'Seattle'][i % 5],
      gender: i % 2 === 0 ? 'Male' : 'Female',
      age: 25 + (i % 15),
      occupation: ['Engineer', 'Designer', 'Doctor', 'Chef', 'Teacher'][i % 5],
      bio: `Test user for group formation algorithm`,
      interests: [
        ['italian', 'wine', 'seafood'][i % 3],
        ['french', 'cocktails', 'steak'][(i + 1) % 3],
        ['sushi', 'beer', 'vegetarian'][(i + 2) % 3]
      ],
      profilePicture: null,
      userType: 'user',
      hasSeenMessageExpirationNotice: false,
      isPremiumUser: i % 5 === 0, // Every 5th user is premium
      averageSpendPerDinner: 75 + (i * 5) % 50,
      lifetimeDiningValue: 300 + (i * 50) % 500,
      dinnerCount: 3 + (i % 5),
      highRollerStatus: i % 10 === 0, // Every 10th user is high roller
      stripeCustomerId: null,
      stripeSubscriptionId: null
    });
    
    userIds.push(user.id);
  }
  
  return userIds;
}

// Run the test
runGroupFormationTest();