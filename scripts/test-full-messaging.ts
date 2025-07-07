import { db } from '../server/db';
import { storage } from '../server/database-storage';
import { addDays, subDays } from 'date-fns';
import * as readline from 'readline';

// This script creates a complete test environment for the messaging system
// It allows testing the entire message feature including:
// 1. Message expiration
// 2. Extension requests
// 3. Approval/decline of extensions
// 4. First-time user notification

async function runFullTest() {
  console.log('🚀 Setting up complete messaging system test environment...');
  
  try {
    // First, check if we have valid users to test with
    let user1 = await storage.getUser(1);
    let user2 = await storage.getUser(2);
    
    if (!user1) {
      console.log('Creating test user 1 (regular user)...');
      user1 = await storage.createUser({
        username: 'testuser1',
        password: 'password123',
        fullName: 'Test User One',
        email: 'testuser1@example.com',
        city: 'New York',
        gender: 'Male',
        age: 30,
        occupation: 'Software Engineer',
        bio: 'I love trying new restaurants',
        interests: ['italian', 'french', 'sushi'],
        profilePicture: null,
        userType: 'user',
        hasSeenMessageExpirationNotice: false,
        isPremiumUser: false,
        averageSpendPerDinner: 85,
        lifetimeDiningValue: 425,
        dinnerCount: 5,
        highRollerStatus: false,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      });
      console.log('✅ Created test user 1: ID', user1.id);
    } else {
      console.log('✅ Using existing test user 1:', user1.username);
    }
    
    if (!user2) {
      console.log('Creating test user 2 (regular user)...');
      user2 = await storage.createUser({
        username: 'testuser2',
        password: 'password123',
        fullName: 'Test User Two',
        email: 'testuser2@example.com',
        city: 'Chicago',
        gender: 'Female',
        age: 28,
        occupation: 'Marketing Executive',
        bio: 'Foodie and wine enthusiast',
        interests: ['seafood', 'wine', 'fine dining'],
        profilePicture: null,
        userType: 'user',
        hasSeenMessageExpirationNotice: true,
        isPremiumUser: false,
        averageSpendPerDinner: 95,
        lifetimeDiningValue: 475,
        dinnerCount: 5,
        highRollerStatus: false,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      });
      console.log('✅ Created test user 2: ID', user2.id);
    } else {
      console.log('✅ Using existing test user 2:', user2.username);
    }
    
    // Create or get a restaurant
    let restaurant = await db.query.restaurants.findFirst();
    if (!restaurant) {
      console.log('Creating test restaurant...');
      restaurant = await storage.createRestaurant({
        name: 'Test Fine Dining',
        address: '123 Test Street, Testville',
        description: 'An exclusive restaurant for testing purposes',
        cuisineType: 'International',
        distance: '2.5 miles',
        imageUrl: null,
        rating: '4.8',
        ambiance: 'Elegant',
        noiseLevel: 'Moderate',
        priceRange: '$$$',
        averageEntreePrice: '45',
        alcohol: 'Full Bar',
        isFeatured: true,
        managerId: null
      });
      console.log('✅ Created test restaurant: ID', restaurant.id);
    } else {
      console.log('✅ Using existing restaurant:', restaurant.name);
    }
    
    // Create a test meetup
    console.log('Creating test meetup...');
    const meetup = await storage.createMeetup({
      title: 'Test Dining Experience',
      date: new Date(),
      restaurantId: restaurant.id,
      startTime: '19:00',
      endTime: '21:00',
      maxParticipants: 6,
      createdBy: user1.id,
      status: 'completed'
    });
    console.log('✅ Created test meetup: ID', meetup.id);
    
    // Add both users as participants
    await storage.addMeetupParticipant({
      meetupId: meetup.id,
      userId: user1.id,
      status: 'confirmed'
    });
    
    await storage.addMeetupParticipant({
      meetupId: meetup.id,
      userId: user2.id,
      status: 'confirmed'
    });
    console.log('✅ Added both users as participants');
    
    // Create messages with different expiration dates
    console.log('Creating test messages with different expiration dates...');
    
    // 1. Active message from user 1
    const activeMessage1 = await storage.createMessage({
      meetupId: meetup.id,
      content: 'I really enjoyed the dinner last night! The wine pairing was excellent.',
      senderId: user1.id
    });
    
    // 2. Active message from user 2
    const activeMessage2 = await storage.createMessage({
      meetupId: meetup.id,
      content: 'Yes, it was great! I loved the dessert too. We should meet up again sometime.',
      senderId: user2.id
    });
    
    // 3. Almost expired message from user 1
    const almostExpiredMessage = await storage.createMessage({
      meetupId: meetup.id,
      content: 'This message is almost expired!',
      senderId: user1.id,
      sentAt: subDays(new Date(), 6), // 6 days ago
      expiresAt: addDays(new Date(), 1) // Expires tomorrow
    });
    
    // 4. Expired message from user 2
    const expiredMessage = await storage.createMessage({
      meetupId: meetup.id,
      content: 'This message is already expired.',
      senderId: user2.id,
      sentAt: subDays(new Date(), 8), // 8 days ago
      expiresAt: subDays(new Date(), 1) // Expired yesterday
    });
    
    console.log('✅ Created test messages with various expiration states');
    
    // Reset User 1's expiration notice seen flag to test first-time notification
    if (user1.hasSeenMessageExpirationNotice) {
      await db.update(db.schema.users)
        .set({ hasSeenMessageExpirationNotice: false })
        .where(db.eq(db.schema.users.id, user1.id));
      console.log('✅ Reset User 1\'s expiration notice flag to test first-time notification');
    }
    
    // Create an extension request
    console.log('Creating message extension request from User 1 to User 2...');
    const extension = await storage.requestMessageConnectionExtension({
      meetupId: meetup.id,
      requestedById: user1.id,
      requestedUserId: user2.id,
      status: 'pending'
    });
    console.log('✅ Created extension request: ID', extension.id);
    
    // Show instructions for testing in the UI
    console.log('\n' + '='.repeat(50));
    console.log('🧪 TEST ENVIRONMENT READY');
    console.log('='.repeat(50));
    console.log('\nTo test the complete messaging system:');
    console.log('\n1. Log in as User 1 (testuser1/password123):');
    console.log('   - You should see the first-time expiration notice');
    console.log('   - You will see the test meetup in your messages');
    console.log('   - You can send new messages and request extensions');
    
    console.log('\n2. Log in as User 2 (testuser2/password123):');
    console.log('   - You should see a pending extension request from User 1');
    console.log('   - You can approve or silently decline the request');
    console.log('   - You will NOT see the first-time notice (already seen)');
    
    console.log('\n3. Messages will show various expiration states:');
    console.log('   - Active messages (with a week left)');
    console.log('   - An almost-expired message (expires tomorrow)');
    console.log('   - An expired message');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nWould you like to interact with the test environment via CLI? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        await showCliMenu(rl, user1, user2, meetup, extension);
      } else {
        console.log('\nYou can now test the messaging UI in the application.');
        rl.close();
        process.exit(0);
      }
    });
    
  } catch (error) {
    console.error('❌ Test setup failed with error:', error);
    process.exit(1);
  }
}

async function showCliMenu(rl: readline.Interface, user1: any, user2: any, meetup: any, extension: any) {
  console.log('\n' + '-'.repeat(50));
  console.log('CLI TEST MENU');
  console.log('-'.repeat(50));
  console.log('1. View messages in the meetup');
  console.log('2. Send a new message as User 1');
  console.log('3. Send a new message as User 2');
  console.log('4. Check extension request status');
  console.log('5. Approve extension (as User 2)');
  console.log('6. Silently decline extension (as User 2)');
  console.log('7. Create a new extension request (as User 1)');
  console.log('8. Reset expiration notice flags');
  console.log('9. Exit');
  
  rl.question('\nSelect an option (1-9): ', async (answer) => {
    switch (answer) {
      case '1': 
        await viewMessages(meetup.id);
        break;
      case '2':
        await sendMessagePrompt(rl, meetup.id, user1.id);
        break;
      case '3':
        await sendMessagePrompt(rl, meetup.id, user2.id);
        break;
      case '4':
        await checkExtensionStatus(extension.id);
        break;
      case '5':
        await approveExtension(extension.id, user2.id);
        break;
      case '6':
        await declineExtension(extension.id, user2.id);
        break;
      case '7':
        await createNewExtension(meetup.id, user1.id, user2.id);
        break;
      case '8':
        await resetExpirationFlags(user1.id, user2.id);
        break;
      case '9':
        console.log('Exiting test environment...');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('Invalid option. Please try again.');
    }
    
    // Show menu again after action is complete
    setTimeout(() => showCliMenu(rl, user1, user2, meetup, extension), 1000);
  });
}

async function viewMessages(meetupId: number) {
  try {
    const messages = await storage.getMeetupMessages(meetupId);
    console.log('\n📨 MESSAGES IN MEETUP:');
    console.log('='.repeat(50));
    
    for (const msg of messages) {
      const sender = await storage.getUser(msg.senderId);
      console.log(`From: ${sender?.fullName} (${sender?.username})`);
      console.log(`Content: ${msg.content}`);
      console.log(`Sent at: ${msg.sentAt.toLocaleString()}`);
      
      if (msg.expiresAt) {
        const now = new Date();
        const expired = now > msg.expiresAt;
        console.log(`Expires: ${msg.expiresAt.toLocaleString()} ${expired ? '(EXPIRED)' : ''}`);
      } else {
        console.log('Expires: Not set');
      }
      console.log('-'.repeat(50));
    }
  } catch (error) {
    console.error('Error viewing messages:', error);
  }
}

async function sendMessagePrompt(rl: readline.Interface, meetupId: number, senderId: number) {
  rl.question('Enter message content: ', async (content) => {
    try {
      const message = await storage.createMessage({
        meetupId,
        content,
        senderId
      });
      console.log(`✅ Message sent: "${content}"`);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });
}

async function checkExtensionStatus(extensionId: number) {
  try {
    const extension = await db.query.messageConnectionExtensions.findFirst({
      where: (ext, { eq }) => eq(ext.id, extensionId)
    });
    
    if (!extension) {
      console.log('❌ Extension request not found');
      return;
    }
    
    console.log('\n🔗 EXTENSION REQUEST STATUS:');
    console.log('='.repeat(50));
    console.log(`ID: ${extension.id}`);
    console.log(`Status: ${extension.status}`);
    console.log(`Requested at: ${extension.requestedAt.toLocaleString()}`);
    
    if (extension.approvedAt) {
      console.log(`Approved at: ${extension.approvedAt.toLocaleString()}`);
    }
    
    if (extension.expiresAt) {
      console.log(`Expires at: ${extension.expiresAt.toLocaleString()}`);
    }
  } catch (error) {
    console.error('Error checking extension status:', error);
  }
}

async function approveExtension(extensionId: number, userId: number) {
  try {
    const result = await storage.approveMessageConnectionExtension(extensionId, userId);
    if (result) {
      console.log('✅ Extension request approved');
      console.log(`New status: ${result.status}`);
      console.log(`Expiration date: ${result.expiresAt?.toLocaleString()}`);
    } else {
      console.log('❌ Could not approve extension (not found or already processed)');
    }
  } catch (error) {
    console.error('Error approving extension:', error);
  }
}

async function declineExtension(extensionId: number, userId: number) {
  try {
    const result = await storage.silentlyDeclineMessageExtension(extensionId, userId);
    if (result) {
      console.log('✅ Extension request silently declined');
      
      // This would not be shown to the user in the real app, just for testing
      const extension = await db.query.messageConnectionExtensions.findFirst({
        where: (ext, { eq }) => eq(ext.id, extensionId)
      });
      console.log(`Actual status (hidden from requester): ${extension?.status}`);
    } else {
      console.log('❌ Could not decline extension (not found or already processed)');
    }
  } catch (error) {
    console.error('Error declining extension:', error);
  }
}

async function createNewExtension(meetupId: number, requestedById: number, requestedUserId: number) {
  try {
    const extension = await storage.requestMessageConnectionExtension({
      meetupId,
      requestedById,
      requestedUserId,
      status: 'pending'
    });
    console.log('✅ Created new extension request: ID', extension.id);
  } catch (error) {
    console.error('Error creating extension request:', error);
  }
}

async function resetExpirationFlags(user1Id: number, user2Id: number) {
  try {
    await db.update(db.schema.users)
      .set({ hasSeenMessageExpirationNotice: false })
      .where(db.eq(db.schema.users.id, user1Id));
    
    await db.update(db.schema.users)
      .set({ hasSeenMessageExpirationNotice: false })
      .where(db.eq(db.schema.users.id, user2Id));
    
    console.log('✅ Reset expiration notice flags for both users');
  } catch (error) {
    console.error('Error resetting flags:', error);
  }
}

// Run the full test
runFullTest();