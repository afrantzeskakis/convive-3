import {
  users, type User, type InsertUser,
  userPreferences, type UserPreferences, type InsertUserPreferences,
  restaurants, type Restaurant, type InsertRestaurant,
  meetups, type Meetup, type InsertMeetup,
  meetupParticipants, type MeetupParticipant, type InsertMeetupParticipant,
  messages, type Message, type InsertMessage,
  matchScores, type MatchScore, type InsertMatchScore,
  dinnerChecks, type DinnerCheck, type InsertDinnerCheck,
  dinnerCheckAverages, type DinnerCheckAverage, type InsertDinnerCheckAverage,
  userDinnerChecks, type UserDinnerCheck, type InsertUserDinnerCheck,
  userTicketHistory, type UserTicketHistory, type InsertUserTicketHistory,
  dinnerTickets, type DinnerTicket,
  userSubscriptions, type UserSubscription,
  // New imports for group meetup scheduling and AI reservation
  userLanguages, type UserLanguage, type InsertUserLanguage,
  groupMeetupSessions, type GroupMeetupSession, type InsertGroupMeetupSession,
  groupMeetupParticipants, type GroupMeetupParticipant, type InsertGroupMeetupParticipant,
  restaurantContacts, type RestaurantContact, type InsertRestaurantContact,
  aiVoiceCallLogs, type AiVoiceCallLog, type InsertAiVoiceCallLog,
  // Call management imports
  callScripts, type CallScript, type InsertCallScript,
  callRecordings, type CallRecording, type InsertCallRecording,
  // Restaurant admin features imports
  userActivityLogs, type UserActivityLog, type InsertUserActivityLog,
  hostPerformanceMetrics, type HostPerformanceMetric, type InsertHostPerformanceMetric,
  restaurantAnnouncements, type RestaurantAnnouncement, type InsertRestaurantAnnouncement,
  announcementRecipients, type AnnouncementRecipient, type InsertAnnouncementRecipient,
  messageConnectionExtensions, type MessageConnectionExtension, type InsertMessageConnectionExtension
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gt, sql, inArray, not, gte, lt } from "drizzle-orm";
import { IStorage } from "./storage";
import { DEFAULT_HIGH_CHECK_THRESHOLD } from "@shared/constants";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Now that we've run the migration, we should be able to use the drizzle ORM directly
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        password: users.password,
        fullName: users.fullName,
        email: users.email,
        city: users.city,
        gender: users.gender,
        age: users.age,
        occupation: users.occupation,
        bio: users.bio,
        profilePicture: users.profilePicture,
        lookingFor: users.lookingFor,
        onboardingComplete: users.onboardingComplete,
        role: users.role,
        createdAt: users.createdAt,
        isPremiumUser: users.isPremiumUser,
        averageSpendPerDinner: users.averageSpendPerDinner,
        lifetimeDiningValue: users.lifetimeDiningValue,
        authorizedRestaurants: users.authorizedRestaurants,
        dinnerCount: users.dinnerCount,
        highCheckDinnerCount: users.highCheckDinnerCount,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId
      })
      .from(users)
      .where(eq(users.id, id));
      
      return user || undefined;
    } catch (error) {
      console.error("Error in getUser:", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log(`[DatabaseStorage] Looking for user with username: "${username}"`);
      
      // First, let's debug by listing all users to see what's in the database
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        role: users.role
      }).from(users);
      
      console.log(`[DatabaseStorage] Total users in database: ${allUsers.length}`);
      console.log(`[DatabaseStorage] All usernames:`, allUsers.map(u => u.username));
      
      // Now that we've run the migration, we should be able to use the drizzle ORM directly
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        password: users.password,
        fullName: users.fullName,
        email: users.email,
        city: users.city,
        gender: users.gender,
        age: users.age,
        occupation: users.occupation,
        bio: users.bio,
        profilePicture: users.profilePicture,
        lookingFor: users.lookingFor,
        onboardingComplete: users.onboardingComplete,
        role: users.role,
        createdAt: users.createdAt,
        isPremiumUser: users.isPremiumUser,
        averageSpendPerDinner: users.averageSpendPerDinner,
        lifetimeDiningValue: users.lifetimeDiningValue,
        authorizedRestaurants: users.authorizedRestaurants,
        dinnerCount: users.dinnerCount,
        highCheckDinnerCount: users.highCheckDinnerCount,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId
      })
      .from(users)
      .where(eq(users.username, username));
      
      console.log(`[DatabaseStorage] Found user:`, user ? `Yes (id: ${user.id}, role: ${user.role})` : 'No');
      
      return user || undefined;
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      // Now that we've run the migration, we should be able to use the drizzle ORM directly
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        password: users.password,
        fullName: users.fullName,
        email: users.email,
        city: users.city,
        gender: users.gender,
        age: users.age,
        occupation: users.occupation,
        bio: users.bio,
        profilePicture: users.profilePicture,
        lookingFor: users.lookingFor,
        onboardingComplete: users.onboardingComplete,
        role: users.role,
        createdAt: users.createdAt,
        isPremiumUser: users.isPremiumUser,
        averageSpendPerDinner: users.averageSpendPerDinner,
        lifetimeDiningValue: users.lifetimeDiningValue,
        authorizedRestaurants: users.authorizedRestaurants,
        dinnerCount: users.dinnerCount,
        highCheckDinnerCount: users.highCheckDinnerCount,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId
      })
      .from(users)
      .where(eq(users.email, email));
      
      return user || undefined;
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      console.log('[DatabaseStorage] Creating user with data:', JSON.stringify(insertUser, null, 2));
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      console.log('[DatabaseStorage] User created successfully:', user.id);
      return user;
    } catch (error) {
      console.error('[DatabaseStorage] Error creating user:', error);
      console.error('[DatabaseStorage] Insert data was:', JSON.stringify(insertUser, null, 2));
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async deleteUser(id: number): Promise<void> {
    try {
      // First delete related data
      await db.delete(userPreferences).where(eq(userPreferences.userId, id));
      await db.delete(userLanguages).where(eq(userLanguages.userId, id));
      await db.delete(meetupParticipants).where(eq(meetupParticipants.userId, id));
      await db.delete(messages).where(eq(messages.senderId, id));
      await db.delete(messageConnectionExtensions).where(eq(messageConnectionExtensions.requestedById, id));
      await db.delete(messageConnectionExtensions).where(eq(messageConnectionExtensions.requestedForId, id));
      await db.delete(groupMeetupParticipants).where(eq(groupMeetupParticipants.userId, id));
      await db.delete(userDinnerChecks).where(eq(userDinnerChecks.userId, id));
      await db.delete(userTicketHistory).where(eq(userTicketHistory.userId, id));
      await db.delete(userSubscriptions).where(eq(userSubscriptions.userId, id));
      await db.delete(userActivityLogs).where(eq(userActivityLogs.userId, id));
      await db.delete(announcementRecipients).where(eq(announcementRecipients.userId, id));
      
      // Delete meetups created by user
      await db.delete(meetups).where(eq(meetups.createdBy, id));
      
      // Finally delete the user
      await db.delete(users).where(eq(users.id, id));
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  // User Preferences methods
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [userPref] = await db
      .insert(userPreferences)
      .values(preferences)
      .returning();
    return userPref;
  }

  async updateUserPreferences(userId: number, preferencesData: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const [updatedPreferences] = await db
      .update(userPreferences)
      .set({
        ...preferencesData,
        updatedAt: new Date()
      })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return updatedPreferences || undefined;
  }

  // Restaurant methods
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, id));
    return restaurant || undefined;
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    return db.select().from(restaurants);
  }

  async getFeaturedRestaurants(limit: number = 4): Promise<Restaurant[]> {
    return db
      .select()
      .from(restaurants)
      .where(eq(restaurants.isFeatured, true))
      .limit(limit);
  }
  
  async getRestaurantsByManagerId(managerId: number): Promise<Restaurant[]> {
    return db
      .select()
      .from(restaurants)
      .where(eq(restaurants.managerId, managerId));
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [newRestaurant] = await db
      .insert(restaurants)
      .values(restaurant)
      .returning();
    return newRestaurant;
  }

  async updateRestaurantFeaturedStatus(id: number, isFeatured: boolean): Promise<Restaurant | undefined> {
    const [updatedRestaurant] = await db
      .update(restaurants)
      .set({ isFeatured })
      .where(eq(restaurants.id, id))
      .returning();
    return updatedRestaurant || undefined;
  }

  async deleteRestaurant(id: number): Promise<void> {
    try {
      // First delete related data
      await db.delete(meetups).where(eq(meetups.restaurantId, id));
      await db.delete(restaurantContacts).where(eq(restaurantContacts.restaurantId, id));
      await db.delete(aiVoiceCallLogs).where(eq(aiVoiceCallLogs.restaurantId, id));
      await db.delete(callRecordings).where(eq(callRecordings.restaurantId, id));
      await db.delete(restaurantAnnouncements).where(eq(restaurantAnnouncements.restaurantId, id));
      
      // Remove restaurant from users' authorized restaurants array
      const usersWithRestaurant = await db
        .select()
        .from(users)
        .where(sql`${id} = ANY(${users.authorizedRestaurants})`);
      
      for (const user of usersWithRestaurant) {
        const updatedRestaurants = user.authorizedRestaurants?.filter(r => r !== id) || [];
        await db
          .update(users)
          .set({ authorizedRestaurants: updatedRestaurants })
          .where(eq(users.id, user.id));
      }
      
      // Finally delete the restaurant
      await db.delete(restaurants).where(eq(restaurants.id, id));
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      throw error;
    }
  }

  // Meetup methods
  async getMeetup(id: number): Promise<Meetup | undefined> {
    const [meetup] = await db
      .select()
      .from(meetups)
      .where(eq(meetups.id, id));
    return meetup || undefined;
  }

  async getAllMeetups(): Promise<Meetup[]> {
    return db.select().from(meetups);
  }

  async getUserMeetups(userId: number): Promise<Meetup[]> {
    // Get meetups where user is a creator
    const createdMeetups = await db
      .select()
      .from(meetups)
      .where(eq(meetups.createdBy, userId));

    // Get meetups where user is a participant
    const participatedMeetupIds = await db
      .select({ meetupId: meetupParticipants.meetupId })
      .from(meetupParticipants)
      .where(eq(meetupParticipants.userId, userId));

    const participatedMeetups = await db
      .select()
      .from(meetups)
      .where(
        sql`${meetups.id} IN (${participatedMeetupIds.map(m => m.meetupId).join(', ')})`
      );

    // Merge both arrays and remove duplicates
    const allMeetups = [...createdMeetups, ...participatedMeetups];
    const uniqueMeetups = Array.from(
      new Map(allMeetups.map(meetup => [meetup.id, meetup])).values()
    );

    return uniqueMeetups;
  }

  async getUpcomingMeetups(limit: number = 3): Promise<Meetup[]> {
    const now = new Date();
    return db
      .select()
      .from(meetups)
      .where(gt(meetups.date, now))
      .orderBy(meetups.date)
      .limit(limit);
  }

  async createMeetup(meetup: InsertMeetup): Promise<Meetup> {
    const [newMeetup] = await db
      .insert(meetups)
      .values(meetup)
      .returning();
    return newMeetup;
  }

  async updateMeetupStatus(id: number, status: string): Promise<Meetup | undefined> {
    const [updatedMeetup] = await db
      .update(meetups)
      .set({ status })
      .where(eq(meetups.id, id))
      .returning();
    return updatedMeetup || undefined;
  }

  // Meetup Participants methods
  async getMeetupParticipants(meetupId: number): Promise<MeetupParticipant[]> {
    return db
      .select()
      .from(meetupParticipants)
      .where(eq(meetupParticipants.meetupId, meetupId));
  }

  async addMeetupParticipant(participant: InsertMeetupParticipant): Promise<MeetupParticipant> {
    const [newParticipant] = await db
      .insert(meetupParticipants)
      .values(participant)
      .returning();
    return newParticipant;
  }

  async updateParticipantStatus(meetupId: number, userId: number, status: string): Promise<MeetupParticipant | undefined> {
    const [updatedParticipant] = await db
      .update(meetupParticipants)
      .set({ status })
      .where(
        and(
          eq(meetupParticipants.meetupId, meetupId),
          eq(meetupParticipants.userId, userId)
        )
      )
      .returning();
    return updatedParticipant || undefined;
  }

  // Message methods
  async getMeetupMessages(meetupId: number): Promise<Message[]> {
    try {
      const currentDate = new Date();
      
      // Only return messages that haven't expired (expiresAt is null or in the future)
      const messagesData = await db
        .select({
          id: messages.id,
          meetupId: messages.meetupId,
          senderId: messages.senderId,
          content: messages.content,
          sentAt: messages.sentAt,
          expiresAt: messages.expiresAt,
          sender: {
            id: users.id,
            fullName: users.fullName,
            profilePicture: users.profilePicture
          }
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(and(
          eq(messages.meetupId, meetupId),
          sql`(${messages.expiresAt} IS NULL OR ${messages.expiresAt} > ${currentDate})`
        ))
        .orderBy(messages.sentAt);
        
      return messagesData;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      // Set expiration date to 1 week from now
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      
      // Include the expiration date
      const [newMessage] = await db
        .insert(messages)
        .values({
          ...message,
          expiresAt: expirationDate
        })
        .returning();
        
      return newMessage;
    } catch (error) {
      console.error("Error creating message:", error);
      throw error;
    }
  }
  
  async requestMessageConnectionExtension(extension: InsertMessageConnectionExtension): Promise<MessageConnectionExtension> {
    try {
      const [newExtension] = await db
        .insert(messageConnectionExtensions)
        .values(extension)
        .returning();
        
      return newExtension;
    } catch (error) {
      console.error("Error requesting message connection extension:", error);
      throw error;
    }
  }
  
  async approveMessageConnectionExtension(id: number, userId: number): Promise<MessageConnectionExtension | undefined> {
    try {
      // Add 1 week to expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      
      const [updatedExtension] = await db
        .update(messageConnectionExtensions)
        .set({
          approvedById: userId,
          status: "approved",
          approvedAt: new Date(),
          expiresAt: expirationDate
        })
        .where(eq(messageConnectionExtensions.id, id))
        .returning();
        
      if (updatedExtension) {
        // Also extend all messages in the meetup by 1 week
        await db
          .update(messages)
          .set({
            expiresAt: expirationDate
          })
          .where(eq(messages.meetupId, updatedExtension.meetupId));
      }
        
      return updatedExtension;
    } catch (error) {
      console.error("Error approving message connection extension:", error);
      throw error;
    }
  }
  
  async silentlyDeclineMessageExtension(id: number, userId: number): Promise<boolean> {
    try {
      // Mark as declined but don't notify the requester
      const [result] = await db
        .update(messageConnectionExtensions)
        .set({
          status: "expired", // Marking as expired rather than declined for privacy
          updatedAt: new Date()
        })
        .where(eq(messageConnectionExtensions.id, id))
        .returning();
      
      return !!result;
    } catch (error) {
      console.error("Error silently declining message extension:", error);
      throw error;
    }
  }
  
  async getPendingExtensionsForUser(userId: number): Promise<Array<MessageConnectionExtension & { requestedBy: { fullName: string, profilePicture: string | null } }>> {
    try {
      const extensions = await db
        .select({
          id: messageConnectionExtensions.id,
          meetupId: messageConnectionExtensions.meetupId,
          requestedById: messageConnectionExtensions.requestedById,
          status: messageConnectionExtensions.status,
          requestedAt: messageConnectionExtensions.requestedAt,
          requestedBy: {
            fullName: users.fullName,
            profilePicture: users.profilePicture
          }
        })
        .from(messageConnectionExtensions)
        .innerJoin(users, eq(messageConnectionExtensions.requestedById, users.id))
        .innerJoin(meetupParticipants, and(
          eq(meetupParticipants.meetupId, messageConnectionExtensions.meetupId),
          eq(meetupParticipants.userId, userId)
        ))
        .where(and(
          eq(messageConnectionExtensions.status, "pending"),
          sql`${messageConnectionExtensions.requestedById} != ${userId}`
        ));
        
      return extensions;
    } catch (error) {
      console.error("Error fetching pending extensions:", error);
      throw error;
    }
  }
  
  async hasUserSeenMessageExpirationNotice(userId: number): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      return user?.hasSeenMessageExpirationNotice || false;
    } catch (error) {
      console.error("Error checking if user has seen message expiration notice:", error);
      return false;
    }
  }
  
  async updateUserMessageExpirationNoticeSeen(userId: number): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          hasSeenMessageExpirationNotice: true
        })
        .where(eq(users.id, userId))
        .returning();
        
      return updatedUser;
    } catch (error) {
      console.error("Error updating user message expiration notice:", error);
      throw error;
    }
  }

  // Match Score methods
  async calculateMatchScores(userId: number): Promise<MatchScore[]> {
    const userPrefs = await this.getUserPreferences(userId);
    if (!userPrefs) return [];

    const allUsers = await db
      .select()
      .from(users)
      .where(sql`${users.id} != ${userId}`);

    const results: MatchScore[] = [];

    for (const otherUser of allUsers) {
      const otherUserPrefs = await this.getUserPreferences(otherUser.id);
      if (!otherUserPrefs) continue;

      // Simple compatibility calculation (in a real app, this would be more sophisticated)
      const compatibilityScore = Math.floor(Math.random() * 40) + 60; // 60-100 range for demo

      // Check if score already exists
      const [existingScore] = await db
        .select()
        .from(matchScores)
        .where(
          sql`(${matchScores.user1Id} = ${userId} AND ${matchScores.user2Id} = ${otherUser.id}) OR 
              (${matchScores.user1Id} = ${otherUser.id} AND ${matchScores.user2Id} = ${userId})`
        );

      if (existingScore) {
        // Update existing score
        const [updatedScore] = await db
          .update(matchScores)
          .set({
            compatibilityScore,
            calculatedAt: new Date()
          })
          .where(eq(matchScores.id, existingScore.id))
          .returning();
        
        if (updatedScore) {
          results.push(updatedScore);
        }
      } else {
        // Create new score
        const [newScore] = await db
          .insert(matchScores)
          .values({
            user1Id: userId,
            user2Id: otherUser.id,
            compatibilityScore,
            calculatedAt: new Date()
          })
          .returning();
        
        if (newScore) {
          results.push(newScore);
        }
      }
    }

    return results;
  }

  async getCompatibleMatches(userId: number, limit: number = 3): Promise<Array<User & { compatibilityScore: number }>> {
    await this.calculateMatchScores(userId);

    // Get scores for this user
    const scores = await db
      .select()
      .from(matchScores)
      .where(
        sql`${matchScores.user1Id} = ${userId} OR ${matchScores.user2Id} = ${userId}`
      )
      .orderBy(desc(matchScores.compatibilityScore))
      .limit(limit);

    const results: Array<User & { compatibilityScore: number }> = [];

    for (const score of scores) {
      const matchUserId = score.user1Id === userId ? score.user2Id : score.user1Id;
      const user = await this.getUser(matchUserId);

      if (user) {
        results.push({
          ...user,
          compatibilityScore: score.compatibilityScore
        });
      }

      if (results.length >= limit) break;
    }

    return results;
  }

  // Dinner Check Average methods
  // Temporarily stubbed until migration is run
  async createDinnerCheckAverage(checkData: InsertDinnerCheckAverage): Promise<DinnerCheckAverage> {
    // For now, stub this function until we run migrations
    // This prevents errors when tables don't exist yet
    console.log("Dinner check average data:", checkData);
    
    // Convert some fields to string to match expected types
    const checkAvgStr = typeof checkData.checkAveragePerPerson === 'number' 
      ? checkData.checkAveragePerPerson.toString() 
      : checkData.checkAveragePerPerson;
      
    const totalBillStr = typeof checkData.totalBillAmount === 'number'
      ? checkData.totalBillAmount.toString()
      : checkData.totalBillAmount;
    
    // Return a mock object with correct types
    return {
      id: 1,
      meetupId: checkData.meetupId,
      restaurantId: checkData.restaurantId,
      reportedBy: checkData.reportedBy,
      checkAveragePerPerson: checkAvgStr,
      totalBillAmount: totalBillStr,
      participantCount: checkData.participantCount,
      isHighCheckAverage: parseFloat(checkAvgStr) >= 175,
      notes: checkData.notes || null,
      reportedAt: new Date()
    };
  }
  
  // Temporarily stubbed until migration is run
  async getDinnerCheckAveragesByMeetup(meetupId: number): Promise<DinnerCheckAverage[]> {
    console.log("Getting dinner check averages for meetup:", meetupId);
    return []; // Return empty array until table exists
  }
  
  // Temporarily stubbed until migration is run
  async getDinnerCheckAveragesByRestaurant(restaurantId: number): Promise<DinnerCheckAverage[]> {
    console.log("Getting dinner check averages for restaurant:", restaurantId);
    return []; // Return empty array until table exists
  }
  
  // Temporarily stubbed until migration is run
  async getHighCheckAverages(limit: number = 10): Promise<DinnerCheckAverage[]> {
    console.log("Getting high check averages, limit:", limit);
    return []; // Return empty array until table exists
  }
  
  // Dinner Check methods
  async createDinnerCheck(checkData: InsertDinnerCheck): Promise<DinnerCheck> {
    // Count confirmed participants
    const participants = await db.select({
      count: sql<number>`count(*)`,
      nonHostCount: sql<number>`count(*) FILTER (WHERE ${meetupParticipants.userId} != ${checkData.hostId} OR ${checkData.hostId} IS NULL)`,
    })
    .from(meetupParticipants)
    .where(
      and(
        eq(meetupParticipants.meetupId, checkData.meetupId),
        eq(meetupParticipants.status, "confirmed")
      )
    );
    
    const nonHostCount = participants[0].nonHostCount || checkData.participantCount - 1;
    
    // Calculate amount per diner (total bill divided by non-host participants)
    const amountPerDiner = nonHostCount > 0 
      ? Number(checkData.totalBillAmount) / nonHostCount 
      : Number(checkData.totalBillAmount);
    
    // Insert dinner check record
    const [newCheck] = await db.insert(dinnerChecks).values({
      ...checkData,
      amountPerDiner,
      isHighCheck: amountPerDiner >= 175,
      processedAt: new Date()
    }).returning();
    
    // Create individual user dinner check records for each participant
    await this.createUserDinnerCheckRecords(newCheck);
    
    // Update user dining statistics for all participants
    await this.updateUserDiningStatsFromCheck(newCheck);
    
    return newCheck;
  }
  
  async createUserDinnerCheckRecords(check: DinnerCheck): Promise<void> {
    // Get all confirmed participants for this meetup
    const participants = await db.select({
      userId: meetupParticipants.userId,
    })
    .from(meetupParticipants)
    .where(
      and(
        eq(meetupParticipants.meetupId, check.meetupId),
        eq(meetupParticipants.status, "confirmed")
      )
    );
    
    // Create individual records for each participant
    for (const participant of participants) {
      // Check if this participant is the host
      const isHost = check.hostId !== null && participant.userId === check.hostId;
      
      // For hosts, amount is 0 (they don't pay), for others it's the calculated amount per diner
      const amount = isHost ? 0 : Number(check.amountPerDiner);
      
      // Create the user dinner check record
      await db.insert(userDinnerChecks).values({
        userId: participant.userId,
        dinnerCheckId: check.id,
        meetupId: check.meetupId,
        restaurantId: check.restaurantId,
        amount,
        isHost,
      });
    }
  }
  
  async updateUserDiningStatsFromCheck(check: DinnerCheck): Promise<void> {
    // Get all participants except the host
    const participants = await db.select({
      userId: meetupParticipants.userId,
    })
    .from(meetupParticipants)
    .where(
      and(
        eq(meetupParticipants.meetupId, check.meetupId),
        eq(meetupParticipants.status, "confirmed"),
        // Skip the host if one is assigned
        check.hostId ? not(eq(meetupParticipants.userId, check.hostId)) : undefined
      )
    );
    
    // Update each participant's dining stats
    for (const participant of participants) {
      await this.updateUserDiningStats(participant.userId, Number(check.amountPerDiner));
    }
  }
  
  async getDinnerChecksForMeetup(meetupId: number): Promise<DinnerCheck[]> {
    return await db.select()
      .from(dinnerChecks)
      .where(eq(dinnerChecks.meetupId, meetupId))
      .orderBy(desc(dinnerChecks.reportedAt));
  }
  
  async getDinnerChecksForRestaurant(restaurantId: number): Promise<DinnerCheck[]> {
    return await db.select()
      .from(dinnerChecks)
      .where(eq(dinnerChecks.restaurantId, restaurantId))
      .orderBy(desc(dinnerChecks.reportedAt));
  }
  
  async getMeetupWithHost(meetupId: number): Promise<Meetup & { host?: User }> {
    const [meetup] = await db.select()
      .from(meetups)
      .where(eq(meetups.id, meetupId));
    
    if (!meetup) {
      throw new Error(`Meetup with ID ${meetupId} not found`);
    }
    
    let host: User | undefined;
    
    if (meetup.hostId) {
      host = await this.getUser(meetup.hostId);
    }
    
    return {
      ...meetup,
      host
    };
  }
  
  async assignHostToMeetup(meetupId: number, hostId: number | null): Promise<Meetup> {
    // Update the meetup with the host ID
    const [updatedMeetup] = await db.update(meetups)
      .set({ hostId })
      .where(eq(meetups.id, meetupId))
      .returning();
    
    return updatedMeetup;
  }
  
  async getRestaurantHosts(restaurantId: number): Promise<User[]> {
    // Find users with role restaurant_user who have access to this restaurant
    return await db.select()
      .from(users)
      .where(
        and(
          eq(users.role, "restaurant_user"),
          sql`${restaurantId} = ANY(${users.authorizedRestaurants})` // Check if restaurantId is in the authorizedRestaurants array
        )
      );
  }
  
  // User Premium Status methods
  async updateUserDiningStats(userId: number, checkAmount: number): Promise<User | undefined> {
    // Get current user data
    const [user] = await db.select({
      id: users.id,
      averageSpendPerDinner: users.averageSpendPerDinner,
      dinnerCount: users.dinnerCount,
      lifetimeDiningValue: users.lifetimeDiningValue,
      highCheckDinnerCount: users.highCheckDinnerCount,
    })
    .from(users)
    .where(eq(users.id, userId));
    
    if (!user) return undefined;
    
    // Calculate new values
    const currentDinnerCount = user.dinnerCount || 0;
    const currentLifetimeValue = Number(user.lifetimeDiningValue || 0);
    const currentHighCheckCount = user.highCheckDinnerCount || 0;
    
    // Calculate new average
    let newAverage: number;
    
    if (currentDinnerCount === 0) {
      newAverage = checkAmount;
    } else {
      // Calculate weighted average
      const totalSpendBefore = Number(user.averageSpendPerDinner || 0) * currentDinnerCount;
      const newTotalSpend = totalSpendBefore + checkAmount;
      newAverage = newTotalSpend / (currentDinnerCount + 1);
    }
    
    // Update user's dining statistics
    const [updatedUser] = await db.update(users)
      .set({
        averageSpendPerDinner: newAverage,
        dinnerCount: currentDinnerCount + 1,
        lifetimeDiningValue: currentLifetimeValue + checkAmount,
        highCheckDinnerCount: checkAmount >= 175 
          ? currentHighCheckCount + 1 
          : currentHighCheckCount,
        // If user has attended at least 3 high-check dinners or spent $175+ on average, mark as premium
        isPremiumUser: (currentHighCheckCount + (checkAmount >= 175 ? 1 : 0) >= 3) || newAverage >= 175
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }
  
  // Temporarily stubbed until migration is run
  async getPremiumUsers(): Promise<User[]> {
    console.log("Getting premium users (stubbed)");
    return []; // Return empty array until column exists
  }
  
  // User Ticket History methods - temporarily stubbed until migration is run
  async createTicketHistoryEntry(ticketData: InsertUserTicketHistory): Promise<UserTicketHistory> {
    console.log("Creating ticket history entry:", ticketData);
    
    // Return a mock object with correct fields
    return {
      id: 1,
      userId: ticketData.userId,
      ticketType: ticketData.ticketType,
      purchaseAmount: ticketData.purchaseAmount,
      purchasedAt: new Date(),
      ticketId: ticketData.ticketId || null,
      subscriptionId: ticketData.subscriptionId || null
    };
  }
  
  // Temporarily stubbed until migration is run
  async getUserTicketHistory(userId: number): Promise<UserTicketHistory[]> {
    console.log("Getting ticket history for user:", userId);
    return []; // Return empty array until table exists
  }
  
  async getUserTicketStats(userId: number): Promise<{ 
    totalTickets: number, 
    ticketsByType: Record<string, number>,
    totalSpent: number
  }> {
    const tickets = await this.getUserTicketHistory(userId);
    
    const ticketsByType: Record<string, number> = {};
    let totalSpent = 0;
    
    tickets.forEach(ticket => {
      // Count by type
      if (ticketsByType[ticket.ticketType]) {
        ticketsByType[ticket.ticketType]++;
      } else {
        ticketsByType[ticket.ticketType] = 1;
      }
      
      // Add to total spent
      totalSpent += parseFloat(ticket.purchaseAmount.toString());
    });
    
    return {
      totalTickets: tickets.length,
      ticketsByType,
      totalSpent
    };
  }
  
  // Super Admin Methods
  async getAllUserAnalytics(): Promise<Array<User & { 
    ticketStats: { totalTickets: number, ticketsByType: Record<string, number>, totalSpent: number } 
  }>> {
    const allUsers = await db.select().from(users);
    const results = [];
    
    for (const user of allUsers) {
      // For now, return empty ticket stats since the table doesn't exist yet
      results.push({
        ...user,
        ticketStats: {
          totalTickets: 0,
          ticketsByType: {},
          totalSpent: 0
        }
      });
    }
    
    return results;
  }

  // User Language methods
  async getUserLanguages(userId: number): Promise<UserLanguage[]> {
    try {
      return db
        .select()
        .from(userLanguages)
        .where(eq(userLanguages.userId, userId));
    } catch (error) {
      console.error("Error in getUserLanguages:", error);
      return [];
    }
  }
  
  async addUserLanguage(language: InsertUserLanguage): Promise<UserLanguage> {
    try {
      const [newLanguage] = await db
        .insert(userLanguages)
        .values(language)
        .returning();
      return newLanguage;
    } catch (error) {
      console.error("Error in addUserLanguage:", error);
      throw error;
    }
  }
  
  async removeUserLanguage(userId: number, language: string): Promise<boolean> {
    try {
      const result = await db
        .delete(userLanguages)
        .where(
          and(
            eq(userLanguages.userId, userId),
            eq(userLanguages.language, language)
          )
        );
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error in removeUserLanguage:", error);
      return false;
    }
  }
  
  // Restaurant User Management methods
  async getUsersByRestaurantId(restaurantId: number): Promise<User[]> {
    try {
      const allUsers = await db.select().from(users);
      
      // Filter users that have this restaurant ID in their authorizedRestaurants array
      return allUsers.filter(user => {
        if (!user.authorizedRestaurants) return false;
        return user.authorizedRestaurants.includes(restaurantId);
      });
    } catch (error) {
      console.error("Error getting users by restaurant ID:", error);
      throw error;
    }
  }
  
  async addUserToRestaurant(userId: number, restaurantId: number): Promise<User | undefined> {
    try {
      const user = await this.getUser(userId);
      if (!user) return undefined;
      
      // Create or update the authorizedRestaurants array
      let authorizedRestaurants = user.authorizedRestaurants || [];
      
      // Add the restaurant ID if it's not already in the array
      if (!authorizedRestaurants.includes(restaurantId)) {
        authorizedRestaurants.push(restaurantId);
      }
      
      // Update the user
      const updatedUser = await this.updateUser(userId, {
        authorizedRestaurants
      });
      
      return updatedUser;
    } catch (error) {
      console.error("Error adding user to restaurant:", error);
      throw error;
    }
  }
  
  async removeUserFromRestaurant(userId: number, restaurantId: number): Promise<User | undefined> {
    try {
      const user = await this.getUser(userId);
      if (!user || !user.authorizedRestaurants) return undefined;
      
      // Filter out the restaurant ID from the array
      const authorizedRestaurants = user.authorizedRestaurants.filter(
        id => id !== restaurantId
      );
      
      // Update the user
      const updatedUser = await this.updateUser(userId, {
        authorizedRestaurants
      });
      
      return updatedUser;
    } catch (error) {
      console.error("Error removing user from restaurant:", error);
      throw error;
    }
  }
  
  async updateUserAuthorizedRestaurants(userId: number, restaurantIds: number[]): Promise<User | undefined> {
    try {
      const user = await this.getUser(userId);
      if (!user) return undefined;
      
      // Update the user with the new list of authorized restaurants
      const updatedUser = await this.updateUser(userId, {
        authorizedRestaurants: restaurantIds
      });
      
      return updatedUser;
    } catch (error) {
      console.error("Error updating user's authorized restaurants:", error);
      throw error;
    }
  }
  
  async getRestaurantsByUserId(userId: number): Promise<Restaurant[]> {
    try {
      const user = await this.getUser(userId);
      if (!user || !user.authorizedRestaurants || user.authorizedRestaurants.length === 0) {
        return [];
      }
      
      // Get all restaurants that the user is authorized for
      const restaurantList = await db
        .select()
        .from(restaurants)
        .where(inArray(restaurants.id, user.authorizedRestaurants));
      
      return restaurantList;
    } catch (error) {
      console.error("Error getting restaurants by user ID:", error);
      return [];
    }
  }
  
  // Restaurant content methods
  async getRecipesByRestaurantIds(restaurantIds: number[]): Promise<any[]> {
    try {
      if (!restaurantIds || restaurantIds.length === 0) {
        return [];
      }
      
      // In a real implementation, this would query the recipes table
      // For now, we'll return mock data based on restaurant IDs
      // In a production environment, create proper DB tables for recipes and wine lists
      return [
        {
          id: 1,
          name: "Artisan Pasta Dish",
          restaurant: { id: restaurantIds[0], name: "Restaurant" },
          cuisine: "Italian",
          description: "Handmade pasta with fresh ingredients",
          analysis: {
            ingredients: [
              { name: "Fresh pasta", amount: "200g" },
              { name: "Tomatoes", amount: "4 medium" },
              { name: "Basil", amount: "1 bunch" },
              { name: "Olive oil", amount: "3 tbsp" },
              { name: "Garlic", amount: "3 cloves" }
            ],
            techniques: [
              "Hand-rolling pasta",
              "Slow simmering sauce",
              "Al dente cooking"
            ],
            flavorProfile: [
              { type: "Savory", intensity: 0.8 },
              { type: "Acidity", intensity: 0.6 },
              { type: "Herbaceous", intensity: 0.7 }
            ],
            talkingPoints: [
              "The pasta is made fresh daily using a traditional recipe from Naples.",
              "Our tomatoes are sourced from a local farm that specializes in heirloom varieties.",
              "The technique of slow-simmering allows the flavors to fully develop."
            ],
            dietaryNotes: "Can be made gluten-free upon request. Contains wheat."
          }
        }
      ];
    } catch (error) {
      console.error("Error getting recipes by restaurant IDs:", error);
      return [];
    }
  }
  
  async getWineListsByRestaurantIds(restaurantIds: number[]): Promise<any[]> {
    try {
      if (!restaurantIds || restaurantIds.length === 0) {
        return [];
      }
      
      // In a real implementation, this would query the wine lists table
      // For now, we'll return mock data based on restaurant IDs
      return [
        {
          id: 1,
          name: "Château Margaux 2015",
          vineyard: "Château Margaux",
          year: 2015,
          type: "Red",
          varietal: "Cabernet Sauvignon Blend",
          region: "Bordeaux, France",
          country: "France",
          alcoholContent: "13.5%",
          restaurant: { id: restaurantIds[0], name: "Restaurant" },
          tastingNotes: "Elegant and powerful with notes of blackcurrant, cedar, and violet.",
          flavorProfile: [
            { type: "Fruitiness", intensity: 0.7 },
            { type: "Tannins", intensity: 0.8 },
            { type: "Acidity", intensity: 0.6 },
            { type: "Body", intensity: 0.9 }
          ],
          foodPairings: [
            "Beef filet mignon",
            "Aged cheeses",
            "Duck breast with cherry sauce",
            "Wild mushroom risotto"
          ],
          talkingPoints: [
            "Château Margaux is one of the five First Growth estates from the 1855 Bordeaux Classification.",
            "The 2015 vintage is considered exceptional, with perfect growing conditions.",
            "This wine will continue to evolve and improve for decades.",
            "The estate practices sustainable viticulture techniques."
          ],
          servingSuggestions: "Decant for at least 1 hour before serving at 16-18°C (60-64°F)."
        }
      ];
    } catch (error) {
      console.error("Error getting wine lists by restaurant IDs:", error);
      return [];
    }
  }
  
  // Group Meetup Session methods
  async createGroupMeetupSession(session: InsertGroupMeetupSession): Promise<GroupMeetupSession> {
    try {
      const [newSession] = await db
        .insert(groupMeetupSessions)
        .values(session)
        .returning();
      return newSession;
    } catch (error) {
      console.error("Error in createGroupMeetupSession:", error);
      throw error;
    }
  }
  
  async getGroupMeetupSessions(filters?: { city?: string, language?: string, dayOfWeek?: string, timeSlot?: string }): Promise<GroupMeetupSession[]> {
    try {
      let query = db.select().from(groupMeetupSessions);
      
      if (filters) {
        if (filters.city) {
          query = query.where(eq(groupMeetupSessions.city, filters.city));
        }
        if (filters.language) {
          query = query.where(eq(groupMeetupSessions.language, filters.language));
        }
        if (filters.dayOfWeek) {
          query = query.where(eq(groupMeetupSessions.dayOfWeek, filters.dayOfWeek));
        }
        if (filters.timeSlot) {
          query = query.where(eq(groupMeetupSessions.timeSlot, filters.timeSlot));
        }
      }
      
      return query;
    } catch (error) {
      console.error("Error in getGroupMeetupSessions:", error);
      return [];
    }
  }
  
  async getGroupMeetupSessionById(id: number): Promise<GroupMeetupSession | undefined> {
    try {
      const [session] = await db
        .select()
        .from(groupMeetupSessions)
        .where(eq(groupMeetupSessions.id, id));
      return session || undefined;
    } catch (error) {
      console.error("Error in getGroupMeetupSessionById:", error);
      return undefined;
    }
  }
  
  async updateGroupMeetupSession(id: number, data: Partial<GroupMeetupSession>): Promise<GroupMeetupSession | undefined> {
    try {
      const [updatedSession] = await db
        .update(groupMeetupSessions)
        .set(data)
        .where(eq(groupMeetupSessions.id, id))
        .returning();
      return updatedSession || undefined;
    } catch (error) {
      console.error("Error in updateGroupMeetupSession:", error);
      return undefined;
    }
  }
  
  async getAvailableGroupMeetupSlots(): Promise<GroupMeetupSession[]> {
    try {
      return db
        .select()
        .from(groupMeetupSessions)
        .where(eq(groupMeetupSessions.status, 'open'));
    } catch (error) {
      console.error("Error in getAvailableGroupMeetupSlots:", error);
      return [];
    }
  }
  
  // Group Meetup Participant methods
  async addGroupMeetupParticipant(participant: InsertGroupMeetupParticipant): Promise<GroupMeetupParticipant> {
    try {
      const [newParticipant] = await db
        .insert(groupMeetupParticipants)
        .values(participant)
        .returning();
      return newParticipant;
    } catch (error) {
      console.error("Error in addGroupMeetupParticipant:", error);
      throw error;
    }
  }
  
  async getGroupMeetupParticipants(sessionId: number): Promise<Array<GroupMeetupParticipant & { user: User }>> {
    try {
      const participants = await db
        .select()
        .from(groupMeetupParticipants)
        .where(eq(groupMeetupParticipants.sessionId, sessionId));
      
      const result: Array<GroupMeetupParticipant & { user: User }> = [];
      
      for (const participant of participants) {
        const user = await this.getUser(participant.userId);
        if (user) {
          result.push({ ...participant, user });
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error in getGroupMeetupParticipants:", error);
      return [];
    }
  }
  
  async updateGroupMeetupParticipantStatus(sessionId: number, userId: number, status: string): Promise<GroupMeetupParticipant | undefined> {
    try {
      const [updatedParticipant] = await db
        .update(groupMeetupParticipants)
        .set({ status })
        .where(
          and(
            eq(groupMeetupParticipants.sessionId, sessionId),
            eq(groupMeetupParticipants.userId, userId)
          )
        )
        .returning();
      return updatedParticipant || undefined;
    } catch (error) {
      console.error("Error in updateGroupMeetupParticipantStatus:", error);
      return undefined;
    }
  }
  
  // Restaurant Contact methods
  async getRestaurantContacts(restaurantId: number): Promise<RestaurantContact[]> {
    try {
      return db
        .select()
        .from(restaurantContacts)
        .where(eq(restaurantContacts.restaurantId, restaurantId));
    } catch (error) {
      console.error("Error in getRestaurantContacts:", error);
      return [];
    }
  }
  
  async getRestaurantContactById(id: number): Promise<RestaurantContact | undefined> {
    try {
      const [contact] = await db
        .select()
        .from(restaurantContacts)
        .where(eq(restaurantContacts.id, id));
      return contact || undefined;
    } catch (error) {
      console.error("Error in getRestaurantContactById:", error);
      return undefined;
    }
  }
  
  async createRestaurantContact(contact: InsertRestaurantContact): Promise<RestaurantContact> {
    try {
      const [newContact] = await db
        .insert(restaurantContacts)
        .values(contact)
        .returning();
      return newContact;
    } catch (error) {
      console.error("Error in createRestaurantContact:", error);
      throw error;
    }
  }
  
  async updateRestaurantContact(id: number, data: Partial<RestaurantContact>): Promise<RestaurantContact | undefined> {
    try {
      const [updatedContact] = await db
        .update(restaurantContacts)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(restaurantContacts.id, id))
        .returning();
      return updatedContact || undefined;
    } catch (error) {
      console.error("Error in updateRestaurantContact:", error);
      return undefined;
    }
  }
  
  // AI Voice Call methods
  async createAiVoiceCallLog(log: InsertAiVoiceCallLog): Promise<AiVoiceCallLog> {
    try {
      const [newLog] = await db
        .insert(aiVoiceCallLogs)
        .values({
          ...log,
          startTime: new Date()
        })
        .returning();
      return newLog;
    } catch (error) {
      console.error("Error in createAiVoiceCallLog:", error);
      throw error;
    }
  }
  
  async updateAiVoiceCallLog(id: number, data: Partial<AiVoiceCallLog>): Promise<AiVoiceCallLog | undefined> {
    try {
      const [updatedLog] = await db
        .update(aiVoiceCallLogs)
        .set(data)
        .where(eq(aiVoiceCallLogs.id, id))
        .returning();
      return updatedLog || undefined;
    } catch (error) {
      console.error("Error in updateAiVoiceCallLog:", error);
      return undefined;
    }
  }
  
  async getAiVoiceCallLogs(sessionId: number): Promise<AiVoiceCallLog[]> {
    try {
      return db
        .select()
        .from(aiVoiceCallLogs)
        .where(eq(aiVoiceCallLogs.sessionId, sessionId))
        .orderBy(aiVoiceCallLogs.startTime);
    } catch (error) {
      console.error("Error in getAiVoiceCallLogs:", error);
      return [];
    }
  }
  
  async getLatestAiVoiceCallLog(sessionId: number): Promise<AiVoiceCallLog | undefined> {
    try {
      const logs = await db
        .select()
        .from(aiVoiceCallLogs)
        .where(eq(aiVoiceCallLogs.sessionId, sessionId))
        .orderBy(desc(aiVoiceCallLogs.startTime))
        .limit(1);
      
      return logs.length > 0 ? logs[0] : undefined;
    } catch (error) {
      console.error("Error in getLatestAiVoiceCallLog:", error);
      return undefined;
    }
  }

  // Call Script methods
  async getAllCallScripts(): Promise<CallScript[]> {
    try {
      return db
        .select()
        .from(callScripts)
        .orderBy(desc(callScripts.createdAt));
    } catch (error) {
      console.error("Error in getAllCallScripts:", error);
      return [];
    }
  }
  
  async getCallScript(id: number): Promise<CallScript | undefined> {
    try {
      const [script] = await db
        .select()
        .from(callScripts)
        .where(eq(callScripts.id, id));
      return script || undefined;
    } catch (error) {
      console.error("Error in getCallScript:", error);
      return undefined;
    }
  }
  
  async createCallScript(script: InsertCallScript): Promise<CallScript> {
    try {
      const [newScript] = await db
        .insert(callScripts)
        .values({
          ...script,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return newScript;
    } catch (error) {
      console.error("Error in createCallScript:", error);
      throw error;
    }
  }
  
  async updateCallScript(id: number, data: Partial<CallScript>): Promise<CallScript | undefined> {
    try {
      const [updatedScript] = await db
        .update(callScripts)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(callScripts.id, id))
        .returning();
      return updatedScript || undefined;
    } catch (error) {
      console.error("Error in updateCallScript:", error);
      return undefined;
    }
  }
  
  // Call Recording methods
  async getAllCallRecordings(): Promise<CallRecording[]> {
    try {
      return db
        .select()
        .from(callRecordings)
        .orderBy(desc(callRecordings.createdAt));
    } catch (error) {
      console.error("Error in getAllCallRecordings:", error);
      return [];
    }
  }
  
  async getCallRecordingsWithDetails(): Promise<Array<CallRecording & { callLog: AiVoiceCallLog }>> {
    try {
      const recordings = await this.getAllCallRecordings();
      const result: Array<CallRecording & { callLog: AiVoiceCallLog }> = [];
      
      for (const recording of recordings) {
        const [callLog] = await db
          .select()
          .from(aiVoiceCallLogs)
          .where(eq(aiVoiceCallLogs.id, recording.callLogId));
        
        if (callLog) {
          result.push({
            ...recording,
            callLog
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error in getCallRecordingsWithDetails:", error);
      return [];
    }
  }
  
  async getCallRecording(id: number): Promise<CallRecording | undefined> {
    try {
      const [recording] = await db
        .select()
        .from(callRecordings)
        .where(eq(callRecordings.id, id));
      return recording || undefined;
    } catch (error) {
      console.error("Error in getCallRecording:", error);
      return undefined;
    }
  }

  // User Activity Monitoring methods (Feature #2)
  async logUserActivity(activity: InsertUserActivityLog): Promise<UserActivityLog> {
    try {
      const [userActivity] = await db
        .insert(userActivityLogs)
        .values({
          ...activity,
          createdAt: new Date()
        })
        .returning();
      return userActivity;
    } catch (error) {
      console.error("Error in logUserActivity:", error);
      throw error;
    }
  }

  async getUserActivities(userId: number, restaurantId?: number, limit: number = 50): Promise<UserActivityLog[]> {
    try {
      let query = db.select().from(userActivityLogs).where(eq(userActivityLogs.userId, userId));
      
      if (restaurantId) {
        query = query.where(eq(userActivityLogs.restaurantId, restaurantId));
      }
      
      return await query
        .orderBy(desc(userActivityLogs.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error in getUserActivities:", error);
      throw error;
    }
  }

  async getRestaurantUserActivities(restaurantId: number, limit: number = 100): Promise<UserActivityLog[]> {
    try {
      return await db
        .select()
        .from(userActivityLogs)
        .where(eq(userActivityLogs.restaurantId, restaurantId))
        .orderBy(desc(userActivityLogs.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error in getRestaurantUserActivities:", error);
      throw error;
    }
  }

  async getActivityStatsByRestaurant(restaurantId: number): Promise<any> {
    try {
      // Get all activities for this restaurant
      const activities = await db
        .select()
        .from(userActivityLogs)
        .where(eq(userActivityLogs.restaurantId, restaurantId));

      // Count activities by type
      const activityTypes: Record<string, number> = {};
      for (const activity of activities) {
        activityTypes[activity.activityType] = (activityTypes[activity.activityType] || 0) + 1;
      }
      
      // Count users by activity level
      const userActivities: Record<number, number> = {};
      for (const activity of activities) {
        userActivities[activity.userId] = (userActivities[activity.userId] || 0) + 1;
      }
      
      const userActivityLevels = {
        high: 0,   // > 10 activities
        medium: 0, // 5-10 activities
        low: 0,    // 1-4 activities
        inactive: 0 // 0 activities
      };
      
      // Count users for each activity level
      for (const count of Object.values(userActivities)) {
        if (count > 10) userActivityLevels.high++;
        else if (count >= 5) userActivityLevels.medium++;
        else userActivityLevels.low++;
      }
      
      // Count inactive users (users with restaurant access but no activity)
      const usersWithAccess = await db
        .select()
        .from(users)
        .where(sql`${restaurantId} = ANY(${users.authorizedRestaurants})`);
      
      const activeUserIds = new Set(Object.keys(userActivities).map(Number));
      userActivityLevels.inactive = usersWithAccess.filter(user => !activeUserIds.has(user.id)).length;
      
      // Recent activity timeline (last 7 days)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const recentActivities = await db
        .select()
        .from(userActivityLogs)
        .where(and(
          eq(userActivityLogs.restaurantId, restaurantId),
          gt(userActivityLogs.createdAt, lastWeek)
        ))
        .orderBy(userActivityLogs.createdAt);
      
      // Format activity by day
      const activityTimeline: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        activityTimeline[dateStr] = 0;
      }
      
      for (const activity of recentActivities) {
        const dateStr = activity.createdAt.toISOString().split('T')[0];
        if (activityTimeline[dateStr] !== undefined) {
          activityTimeline[dateStr]++;
        }
      }
      
      return {
        totalActivities: activities.length,
        activityTypes,
        userActivityLevels,
        activityTimeline: Object.entries(activityTimeline).map(([date, count]) => ({ date, count })),
        recentActivities: recentActivities.slice(-10).map(a => ({
          id: a.id,
          userId: a.userId,
          activityType: a.activityType,
          description: a.description,
          createdAt: a.createdAt
        }))
      };
    } catch (error) {
      console.error("Error in getActivityStatsByRestaurant:", error);
      throw error;
    }
  }
  
  // Host Performance Metrics methods (Feature #3)
  async createHostPerformanceMetric(metric: InsertHostPerformanceMetric): Promise<HostPerformanceMetric> {
    try {
      const now = new Date();
      const [hostMetric] = await db
        .insert(hostPerformanceMetrics)
        .values({
          ...metric,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      return hostMetric;
    } catch (error) {
      console.error("Error in createHostPerformanceMetric:", error);
      throw error;
    }
  }

  async getHostPerformanceMetrics(userId: number, restaurantId: number): Promise<HostPerformanceMetric[]> {
    try {
      return await db
        .select()
        .from(hostPerformanceMetrics)
        .where(and(
          eq(hostPerformanceMetrics.userId, userId),
          eq(hostPerformanceMetrics.restaurantId, restaurantId)
        ))
        .orderBy(desc(hostPerformanceMetrics.metricsDate));
    } catch (error) {
      console.error("Error in getHostPerformanceMetrics:", error);
      throw error;
    }
  }

  async getRestaurantPerformanceMetrics(restaurantId: number): Promise<HostPerformanceMetric[]> {
    try {
      return await db
        .select()
        .from(hostPerformanceMetrics)
        .where(eq(hostPerformanceMetrics.restaurantId, restaurantId))
        .orderBy(desc(hostPerformanceMetrics.metricsDate));
    } catch (error) {
      console.error("Error in getRestaurantPerformanceMetrics:", error);
      throw error;
    }
  }

  async getHostPerformanceSummary(userId: number, restaurantId: number): Promise<any> {
    try {
      const metrics = await this.getHostPerformanceMetrics(userId, restaurantId);
      
      if (metrics.length === 0) {
        const user = await this.getUser(userId);
        return {
          hostName: user?.fullName || 'Unknown',
          averages: {
            customerSatisfaction: 0,
            tablesTurned: 0,
            averageSpendPerTable: 0,
            knowledgeScore: 0,
            communicationScore: 0
          },
          trends: {
            satisfaction: [],
            revenue: []
          },
          totalMetrics: 0
        };
      }
      
      // Calculate averages
      const sum = metrics.reduce((acc, metric) => {
        return {
          customerSatisfaction: acc.customerSatisfaction + (metric.customerSatisfactionScore || 0),
          tablesTurned: acc.tablesTurned + (metric.tablesTurned || 0),
          averageSpend: acc.averageSpend + (metric.averageSpendPerTable || 0),
          knowledgeScore: acc.knowledgeScore + (metric.knowledgeScore || 0),
          communicationScore: acc.communicationScore + (metric.communicationScore || 0),
          count: acc.count + 1
        };
      }, { 
        customerSatisfaction: 0, 
        tablesTurned: 0, 
        averageSpend: 0, 
        knowledgeScore: 0, 
        communicationScore: 0, 
        count: 0 
      });
      
      // Calculate trends over time (last 10 metrics)
      const recentMetrics = metrics.slice(0, 10);
      const satisfactionTrend = recentMetrics.map(m => ({
        date: m.metricsDate.toISOString().split('T')[0],
        value: m.customerSatisfactionScore || 0
      }));
      
      const revenueTrend = recentMetrics.map(m => ({
        date: m.metricsDate.toISOString().split('T')[0],
        value: m.averageSpendPerTable ? m.averageSpendPerTable * (m.tablesTurned || 0) : 0
      }));
      
      const user = await this.getUser(userId);
      
      return {
        hostName: user?.fullName || 'Unknown',
        averages: {
          customerSatisfaction: sum.customerSatisfaction / sum.count || 0,
          tablesTurned: sum.tablesTurned / sum.count || 0,
          averageSpendPerTable: sum.averageSpend / sum.count || 0,
          knowledgeScore: sum.knowledgeScore / sum.count || 0,
          communicationScore: sum.communicationScore / sum.count || 0
        },
        trends: {
          satisfaction: satisfactionTrend,
          revenue: revenueTrend
        },
        totalMetrics: metrics.length
      };
    } catch (error) {
      console.error("Error in getHostPerformanceSummary:", error);
      throw error;
    }
  }
  
  // Restaurant Announcements methods (Feature #7 - Communication)
  async createAnnouncement(announcement: InsertRestaurantAnnouncement): Promise<RestaurantAnnouncement> {
    try {
      const now = new Date();
      const [newAnnouncement] = await db
        .insert(restaurantAnnouncements)
        .values({
          ...announcement,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      return newAnnouncement;
    } catch (error) {
      console.error("Error in createAnnouncement:", error);
      throw error;
    }
  }

  async getRestaurantAnnouncements(restaurantId: number): Promise<RestaurantAnnouncement[]> {
    try {
      return await db
        .select()
        .from(restaurantAnnouncements)
        .where(eq(restaurantAnnouncements.restaurantId, restaurantId))
        .orderBy(
          // Sort pinned announcements first, then by date (newest first)
          desc(restaurantAnnouncements.isPinned),
          desc(restaurantAnnouncements.createdAt)
        );
    } catch (error) {
      console.error("Error in getRestaurantAnnouncements:", error);
      throw error;
    }
  }

  async getAnnouncementById(id: number): Promise<RestaurantAnnouncement | undefined> {
    try {
      const [announcement] = await db
        .select()
        .from(restaurantAnnouncements)
        .where(eq(restaurantAnnouncements.id, id));
      return announcement || undefined;
    } catch (error) {
      console.error("Error in getAnnouncementById:", error);
      throw error;
    }
  }

  async updateAnnouncement(id: number, data: Partial<RestaurantAnnouncement>): Promise<RestaurantAnnouncement | undefined> {
    try {
      const [updatedAnnouncement] = await db
        .update(restaurantAnnouncements)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(restaurantAnnouncements.id, id))
        .returning();
      return updatedAnnouncement || undefined;
    } catch (error) {
      console.error("Error in updateAnnouncement:", error);
      throw error;
    }
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(restaurantAnnouncements)
        .where(eq(restaurantAnnouncements.id, id));
      
      // Also delete all recipients for this announcement
      await db
        .delete(announcementRecipients)
        .where(eq(announcementRecipients.announcementId, id));
      
      return true;
    } catch (error) {
      console.error("Error in deleteAnnouncement:", error);
      throw error;
    }
  }
  
  // Announcement Recipients methods
  async addAnnouncementRecipient(recipient: InsertAnnouncementRecipient): Promise<AnnouncementRecipient> {
    try {
      const [newRecipient] = await db
        .insert(announcementRecipients)
        .values({
          ...recipient,
          createdAt: new Date(),
          wasRead: false,
          readAt: null
        })
        .returning();
      return newRecipient;
    } catch (error) {
      console.error("Error in addAnnouncementRecipient:", error);
      throw error;
    }
  }

  async markAnnouncementAsRead(announcementId: number, userId: number): Promise<AnnouncementRecipient | undefined> {
    try {
      const now = new Date();
      const [updatedRecipient] = await db
        .update(announcementRecipients)
        .set({
          wasRead: true,
          readAt: now
        })
        .where(and(
          eq(announcementRecipients.announcementId, announcementId),
          eq(announcementRecipients.userId, userId)
        ))
        .returning();
      return updatedRecipient || undefined;
    } catch (error) {
      console.error("Error in markAnnouncementAsRead:", error);
      throw error;
    }
  }

  async getUnreadAnnouncementsForUser(userId: number, restaurantId?: number): Promise<Array<RestaurantAnnouncement & { restaurant: { name: string } }>> {
    try {
      // Find unread announcements for this user
      const unreadRecipients = await db
        .select()
        .from(announcementRecipients)
        .where(and(
          eq(announcementRecipients.userId, userId),
          eq(announcementRecipients.wasRead, false)
        ));
      
      if (unreadRecipients.length === 0) return [];
      
      // Get the announcements for these recipients
      const unreadAnnouncementIds = unreadRecipients.map(r => r.announcementId);
      
      let query = db
        .select({
          ...restaurantAnnouncements,
          restaurant: {
            name: restaurants.name
          }
        })
        .from(restaurantAnnouncements)
        .innerJoin(restaurants, eq(restaurantAnnouncements.restaurantId, restaurants.id))
        .where(inArray(restaurantAnnouncements.id, unreadAnnouncementIds));
      
      // Filter by restaurant if specified
      if (restaurantId) {
        query = query.where(eq(restaurantAnnouncements.restaurantId, restaurantId));
      }
      
      const announcements = await query.orderBy(desc(restaurantAnnouncements.createdAt));
      
      return announcements;
    } catch (error) {
      console.error("Error in getUnreadAnnouncementsForUser:", error);
      throw error;
    }
  }
  
  // Bulk User Operations methods (Feature #9)
  async bulkAddUsersToRestaurant(userIds: number[], restaurantId: number): Promise<User[]> {
    try {
      const results: User[] = [];
      
      // Get all users in a single query
      const usersToUpdate = await db
        .select()
        .from(users)
        .where(inArray(users.id, userIds));
      
      // Update each user's authorizedRestaurants array
      for (const user of usersToUpdate) {
        const authorizedRestaurants = user.authorizedRestaurants || [];
        
        // Skip if already authorized
        if (authorizedRestaurants.includes(restaurantId)) {
          results.push(user);
          continue;
        }
        
        // Add the restaurant ID
        const updatedRestaurants = [...authorizedRestaurants, restaurantId];
        
        // Update the user
        const [updatedUser] = await db
          .update(users)
          .set({ authorizedRestaurants: updatedRestaurants })
          .where(eq(users.id, user.id))
          .returning();
        
        if (updatedUser) {
          results.push(updatedUser);
        }
      }
      
      return results;
    } catch (error) {
      console.error("Error in bulkAddUsersToRestaurant:", error);
      throw error;
    }
  }

  async bulkRemoveUsersFromRestaurant(userIds: number[], restaurantId: number): Promise<User[]> {
    try {
      const results: User[] = [];
      
      // Get all users in a single query
      const usersToUpdate = await db
        .select()
        .from(users)
        .where(inArray(users.id, userIds));
      
      // Update each user's authorizedRestaurants array
      for (const user of usersToUpdate) {
        const authorizedRestaurants = user.authorizedRestaurants || [];
        
        // Skip if not authorized
        if (!authorizedRestaurants.includes(restaurantId)) {
          continue;
        }
        
        // Remove the restaurant ID
        const updatedRestaurants = authorizedRestaurants.filter(id => id !== restaurantId);
        
        // Update the user
        const [updatedUser] = await db
          .update(users)
          .set({ authorizedRestaurants: updatedRestaurants })
          .where(eq(users.id, user.id))
          .returning();
        
        if (updatedUser) {
          results.push(updatedUser);
        }
      }
      
      return results;
    } catch (error) {
      console.error("Error in bulkRemoveUsersFromRestaurant:", error);
      throw error;
    }
  }

  async bulkUpdateUserRoles(userIds: number[], role: string): Promise<User[]> {
    try {
      const results: User[] = [];
      
      // Update each user one at a time
      for (const userId of userIds) {
        // Skip invalid IDs
        if (!userId) continue;
        
        // Update the user role
        const [updatedUser] = await db
          .update(users)
          .set({ role })
          .where(eq(users.id, userId))
          .returning();
        
        if (updatedUser) {
          results.push(updatedUser);
        }
      }
      
      return results;
    } catch (error) {
      console.error("Error in bulkUpdateUserRoles:", error);
      throw error;
    }
  }
  
  // Message Connection Extension methods - may already be implemented elsewhere in the file
  async hasUserSeenMessageExpirationNotice(userId: number): Promise<boolean> {
    try {
      const [user] = await db
        .select({ hasSeenMessageExpirationNotice: users.hasSeenMessageExpirationNotice })
        .from(users)
        .where(eq(users.id, userId));
      
      return !!user?.hasSeenMessageExpirationNotice;
    } catch (error) {
      console.error("Error in hasUserSeenMessageExpirationNotice:", error);
      throw error;
    }
  }
  
  async updateUserMessageExpirationNoticeSeen(userId: number): Promise<User | undefined> {
    try {
      return this.updateUser(userId, { hasSeenMessageExpirationNotice: true });
    } catch (error) {
      console.error("Error in updateUserMessageExpirationNoticeSeen:", error);
      throw error;
    }
  }

  // Dinner Check methods
  async createDinnerCheck(check: InsertDinnerCheck): Promise<DinnerCheck> {
    try {
      const [newCheck] = await db.insert(dinnerChecks).values({
        ...check,
        reportedAt: new Date(),
        inputDeadline: null,
        inputRequiredBy: null,
        inputProvided: false,
        isOverdue: false,
        notificationSent: false
      }).returning();
      
      return newCheck;
    } catch (error) {
      console.error("Error creating dinner check:", error);
      throw error;
    }
  }

  async getAllDinnerChecks(): Promise<DinnerCheck[]> {
    try {
      return await db
        .select()
        .from(dinnerChecks)
        .orderBy(desc(dinnerChecks.reportedAt));
    } catch (error) {
      console.error("Error getting all dinner checks:", error);
      return [];
    }
  }

  async getDinnerCheckById(checkId: number): Promise<DinnerCheck | undefined> {
    try {
      const [check] = await db
        .select()
        .from(dinnerChecks)
        .where(eq(dinnerChecks.id, checkId));
      
      return check || undefined;
    } catch (error) {
      console.error("Error getting dinner check by ID:", error);
      throw error;
    }
  }

  async getDinnerChecksByRestaurantIds(restaurantIds: number[]): Promise<DinnerCheck[]> {
    try {
      return await db
        .select()
        .from(dinnerChecks)
        .where(inArray(dinnerChecks.restaurantId, restaurantIds))
        .orderBy(desc(dinnerChecks.reportedAt));
    } catch (error) {
      console.error("Error getting dinner checks by restaurant IDs:", error);
      return [];
    }
  }

  async getDinnerChecksByHostId(hostId: number): Promise<DinnerCheck[]> {
    try {
      return await db
        .select()
        .from(dinnerChecks)
        .where(eq(dinnerChecks.hostId, hostId))
        .orderBy(desc(dinnerChecks.reportedAt));
    } catch (error) {
      console.error("Error getting dinner checks by host ID:", error);
      return [];
    }
  }

  async getRestaurantsByAdminId(adminId: number): Promise<Restaurant[]> {
    try {
      return await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.managerId, adminId));
    } catch (error) {
      console.error("Error getting restaurants by admin ID:", error);
      return [];
    }
  }

  async getUserAverageCheckAmount(userId: number): Promise<number> {
    try {
      // Get the user's average check amount from their database record
      const [user] = await db
        .select({
          averageSpendPerDinner: users.averageSpendPerDinner
        })
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user || user.averageSpendPerDinner === null) {
        return 0;
      }
      
      return user.averageSpendPerDinner;
    } catch (error) {
      console.error("Error getting user average check amount:", error);
      return 0;
    }
  }

  async getHighRollerStatus(userId: number): Promise<boolean> {
    try {
      const avgAmount = await this.getUserAverageCheckAmount(userId);
      return avgAmount > DEFAULT_HIGH_CHECK_THRESHOLD;
    } catch (error) {
      console.error("Error determining high roller status:", error);
      return false;
    }
  }

  async updateDinnerCheck(id: number, data: Partial<DinnerCheck>): Promise<DinnerCheck | undefined> {
    try {
      const [updatedCheck] = await db
        .update(dinnerChecks)
        .set(data)
        .where(eq(dinnerChecks.id, id))
        .returning();
      
      return updatedCheck || undefined;
    } catch (error) {
      console.error("Error updating dinner check:", error);
      throw error;
    }
  }

  // Recipe methods
  async getRecipes(): Promise<any[]> {
    try {
      const result = await db.execute(`
        SELECT 
          r.id,
          r.name,
          r.recipe_text as recipeText,
          r.description,
          r.restaurant_id as restaurantId,
          r.created_by as createdBy,
          r.created_at as createdAt
        FROM recipes r
        ORDER BY r.created_at DESC
      `);
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching recipes:", error);
      throw error;
    }
  }

  async getRecipeAnalyses(): Promise<any[]> {
    try {
      const result = await db.execute(`
        SELECT 
          ra.id,
          ra.recipe_id as recipeId,
          ra.ingredients,
          ra.techniques,
          ra.allergen_summary as allergenSummary,
          ra.dietary_restriction_summary as dietaryRestrictionSummary,
          ra.confidence,
          ra.created_at as createdAt
        FROM recipe_analyses ra
        ORDER BY ra.created_at DESC
      `);
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching recipe analyses:", error);
      throw error;
    }
  }

  // Wine methods
  async createWine(wine: any): Promise<any> {
    try {
      const result = await db.execute(sql`
        INSERT INTO wines (wine_name, producer, vintage, region, description, verified, verified_source, description_enhanced)
        VALUES (${wine.wine_name}, ${wine.producer}, ${wine.vintage}, ${wine.region}, ${wine.description}, ${wine.verified}, ${wine.verified_source}, ${wine.description_enhanced || null})
        RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error creating wine:", error);
      throw error;
    }
  }

  async getWinePromotions(userId?: number): Promise<any[]> {
    try {
      // Return empty array for now as wine promotions table may not exist
      return [];
    } catch (error) {
      console.error("Error fetching wine promotions:", error);
      return [];
    }
  }

  async createWinePromotion(promotion: any): Promise<any> {
    try {
      // Placeholder implementation
      return { id: 1, ...promotion, createdAt: new Date() };
    } catch (error) {
      console.error("Error creating wine promotion:", error);
      throw error;
    }
  }

  async getWineAnalytics(userId?: number): Promise<any> {
    try {
      // Return basic analytics
      return {
        totalRecommendations: 0,
        successfulMatches: 0,
        popularGrapes: [],
        topRegions: []
      };
    } catch (error) {
      console.error("Error fetching wine analytics:", error);
      return {};
    }
  }
}