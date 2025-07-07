import { db } from '../server/db';
import { storage } from '../server/database-storage';

// This script creates a test message extension request and allows you to test both
// approving and declining the extension

async function runTest() {
  console.log('🔍 Testing message extension functionality...');
  
  // Create a mock meetup message connection extension between users 1 and 2
  // This simulates user 1 requesting a connection extension with user 2
  try {
    // First, check if we have valid users to test with
    const user1 = await storage.getUser(1);
    const user2 = await storage.getUser(2);
    
    if (!user1 || !user2) {
      console.error('❌ Test users with IDs 1 and 2 not found. Please create test users first.');
      process.exit(1);
    }
    
    console.log(`📊 Test users: ${user1.username} (ID: 1) and ${user2.username} (ID: 2)`);
    
    // Create a mock meetup if we don't have one
    let meetupId: number;
    const mockMeetup = await db.query.meetups.findFirst({
      where: (meetups, { eq }) => eq(meetups.createdBy, 1)
    });
    
    if (mockMeetup) {
      meetupId = mockMeetup.id;
      console.log(`🍽️ Using existing meetup: ID ${meetupId}`);
    } else {
      const newMeetup = await storage.createMeetup({
        title: 'Test Meetup',
        restaurantId: 1,
        date: new Date(),
        startTime: '19:00',
        endTime: '21:00',
        maxParticipants: 4,
        createdBy: 1,
        status: 'scheduled'
      });
      meetupId = newMeetup.id;
      console.log(`🍽️ Created new test meetup: ID ${meetupId}`);
      
      // Add users to the meetup
      await storage.addMeetupParticipant({
        meetupId,
        userId: 1,
        status: 'confirmed'
      });
      
      await storage.addMeetupParticipant({
        meetupId,
        userId: 2,
        status: 'confirmed'
      });
      
      console.log('👥 Added users to the meetup');
    }
    
    // Create a test message in the meetup
    const message = await storage.createMessage({
      meetupId,
      content: 'Hello! This is a test message.',
      senderId: 1
    });
    console.log(`💬 Created test message: "${message.content}"`);
    
    // Create extension request
    const extension = await storage.requestMessageConnectionExtension({
      meetupId,
      requestedById: 1,
      requestedUserId: 2,
      status: 'pending',
    });
    
    console.log(`🔗 Created message extension request: ID ${extension.id}`);
    console.log('📝 Status: pending');
    
    // Show mock UI for testing
    console.log('\n----- TEST INTERFACE -----');
    console.log('User 2 sees a notification: "User 1 would like to continue messaging with you for another week."');
    console.log('Options: [Approve] [Decline] [Maybe Later]\n');
    
    // Prompt for action type
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('What action would you like to test? (approve/decline/exit): ', async (answer: string) => {
      if (answer.toLowerCase() === 'approve') {
        // Test approval
        const updated = await storage.approveMessageConnectionExtension(extension.id, 2);
        console.log('\n✅ Extension approved!');
        console.log('📝 New status:', updated?.status);
        console.log('📆 Expiration date:', updated?.expiresAt);
      } else if (answer.toLowerCase() === 'decline') {
        // Test silent decline
        const result = await storage.silentlyDeclineMessageExtension(extension.id, 2);
        console.log('\n🔕 Extension silently declined!');
        console.log('📝 Result:', result ? 'Success' : 'Failed');
        
        // Check the actual status (this would not be shown to users, just for testing)
        const checkExtension = await db.query.messageConnectionExtensions.findFirst({
          where: (ext, { eq }) => eq(ext.id, extension.id)
        });
        console.log('📝 Actual status (hidden from requester):', checkExtension?.status);
      } else {
        console.log('Exiting test...');
      }
      
      readline.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
runTest();