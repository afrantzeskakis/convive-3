import {
  users, type User, type InsertUser,
  userPreferences, type UserPreferences, type InsertUserPreferences,
  restaurants, type Restaurant, type InsertRestaurant,
  meetups, type Meetup, type InsertMeetup,
  meetupParticipants, type MeetupParticipant, type InsertMeetupParticipant,
  messages, type Message, type InsertMessage,
  messageConnectionExtensions, type MessageConnectionExtension, type InsertMessageConnectionExtension,
  matchScores, type MatchScore, type InsertMatchScore,
  userLanguages, type UserLanguage, type InsertUserLanguage,
  groupMeetupSessions, type GroupMeetupSession, type InsertGroupMeetupSession,
  groupMeetupParticipants, type GroupMeetupParticipant, type InsertGroupMeetupParticipant,
  restaurantContacts, type RestaurantContact, type InsertRestaurantContact,
  aiVoiceCallLogs, type AiVoiceCallLog, type InsertAiVoiceCallLog,
  callScripts, type CallScript, type InsertCallScript,
  callRecordings, type CallRecording, type InsertCallRecording,
  userActivityLogs, type UserActivityLog, type InsertUserActivityLog,
  hostPerformanceMetrics, type HostPerformanceMetric, type InsertHostPerformanceMetric,
  restaurantAnnouncements, type RestaurantAnnouncement, type InsertRestaurantAnnouncement,
  announcementRecipients, type AnnouncementRecipient, type InsertAnnouncementRecipient,
  dinnerChecks, type DinnerCheck, type InsertDinnerCheck,
  dinnerCheckAverages, type DinnerCheckAverage, type InsertDinnerCheckAverage,
  userDinnerChecks, type UserDinnerCheck, type InsertUserDinnerCheck
} from "@shared/schema";
import { DatabaseStorage } from './database-storage';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // User Preferences methods
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences | undefined>;
  
  // Restaurant methods
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getAllRestaurants(): Promise<Restaurant[]>;
  getFeaturedRestaurants(limit?: number): Promise<Restaurant[]>;
  getRestaurantsByManagerId(managerId: number): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurantFeaturedStatus(id: number, isFeatured: boolean): Promise<Restaurant | undefined>;
  
  // Restaurant User management methods
  getUsersByRestaurantId(restaurantId: number): Promise<User[]>;
  getRestaurantsByUserId(userId: number): Promise<Restaurant[]>;
  addUserToRestaurant(userId: number, restaurantId: number): Promise<User | undefined>;
  removeUserFromRestaurant(userId: number, restaurantId: number): Promise<User | undefined>;
  updateUserAuthorizedRestaurants(userId: number, restaurantIds: number[]): Promise<User | undefined>;
  
  // Restaurant content methods
  getRecipesByRestaurantIds(restaurantIds: number[]): Promise<any[]>;
  getWineListsByRestaurantIds(restaurantIds: number[]): Promise<any[]>;
  
  // Meetup methods
  getMeetup(id: number): Promise<Meetup | undefined>;
  getAllMeetups(): Promise<Meetup[]>;
  getUserMeetups(userId: number): Promise<Meetup[]>;
  getUpcomingMeetups(limit?: number): Promise<Meetup[]>;
  createMeetup(meetup: InsertMeetup): Promise<Meetup>;
  updateMeetupStatus(id: number, status: string): Promise<Meetup | undefined>;
  
  // Meetup Participants methods
  getMeetupParticipants(meetupId: number): Promise<MeetupParticipant[]>;
  addMeetupParticipant(participant: InsertMeetupParticipant): Promise<MeetupParticipant>;
  updateParticipantStatus(meetupId: number, userId: number, status: string): Promise<MeetupParticipant | undefined>;
  
  // Message methods
  getMeetupMessages(meetupId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Message Connection Extension methods
  requestMessageConnectionExtension(extension: InsertMessageConnectionExtension): Promise<MessageConnectionExtension>;
  approveMessageConnectionExtension(id: number, userId: number): Promise<MessageConnectionExtension | undefined>;
  silentlyDeclineMessageExtension(id: number, userId: number): Promise<boolean>;
  getPendingExtensionsForUser(userId: number): Promise<Array<MessageConnectionExtension & { requestedBy: { fullName: string, profilePicture: string | null } }>>;
  hasUserSeenMessageExpirationNotice(userId: number): Promise<boolean>;
  updateUserMessageExpirationNoticeSeen(userId: number): Promise<User | undefined>;
  
  // Match Score methods
  calculateMatchScores(userId: number): Promise<MatchScore[]>;
  getCompatibleMatches(userId: number, limit?: number): Promise<Array<User & { compatibilityScore: number }>>;
  
  // User Language methods
  getUserLanguages(userId: number): Promise<UserLanguage[]>;
  addUserLanguage(language: InsertUserLanguage): Promise<UserLanguage>;
  removeUserLanguage(userId: number, language: string): Promise<boolean>;
  
  // Group Meetup Session methods
  createGroupMeetupSession(session: InsertGroupMeetupSession): Promise<GroupMeetupSession>;
  getGroupMeetupSessions(filters?: { city?: string, language?: string, dayOfWeek?: string, timeSlot?: string }): Promise<GroupMeetupSession[]>;
  getGroupMeetupSessionById(id: number): Promise<GroupMeetupSession | undefined>;
  updateGroupMeetupSession(id: number, data: Partial<GroupMeetupSession>): Promise<GroupMeetupSession | undefined>;
  getAvailableGroupMeetupSlots(): Promise<GroupMeetupSession[]>;
  
  // Group Meetup Participant methods
  addGroupMeetupParticipant(participant: InsertGroupMeetupParticipant): Promise<GroupMeetupParticipant>;
  getGroupMeetupParticipants(sessionId: number): Promise<Array<GroupMeetupParticipant & { user: User }>>;
  updateGroupMeetupParticipantStatus(sessionId: number, userId: number, status: string): Promise<GroupMeetupParticipant | undefined>;
  
  // Restaurant Contact methods
  getRestaurantContacts(restaurantId: number): Promise<RestaurantContact[]>;
  getRestaurantContactById(id: number): Promise<RestaurantContact | undefined>;
  createRestaurantContact(contact: InsertRestaurantContact): Promise<RestaurantContact>;
  updateRestaurantContact(id: number, data: Partial<RestaurantContact>): Promise<RestaurantContact | undefined>;
  
  // AI Voice Call methods
  createAiVoiceCallLog(log: InsertAiVoiceCallLog): Promise<AiVoiceCallLog>;
  updateAiVoiceCallLog(id: number, data: Partial<AiVoiceCallLog>): Promise<AiVoiceCallLog | undefined>;
  getAiVoiceCallLogs(sessionId: number): Promise<AiVoiceCallLog[]>;
  getLatestAiVoiceCallLog(sessionId: number): Promise<AiVoiceCallLog | undefined>;
  
  // Call Script methods
  getAllCallScripts(): Promise<CallScript[]>;
  getCallScript(id: number): Promise<CallScript | undefined>;
  createCallScript(script: InsertCallScript): Promise<CallScript>;
  updateCallScript(id: number, data: Partial<CallScript>): Promise<CallScript | undefined>;
  
  // Call Recording methods
  getAllCallRecordings(): Promise<CallRecording[]>;
  getCallRecordingsWithDetails(): Promise<Array<CallRecording & { callLog: AiVoiceCallLog }>>;
  getCallRecording(id: number): Promise<CallRecording | undefined>;
  
  // Message Connection Extension methods - these are placeholders that will be implemented separately
  requestMessageConnectionExtension(extension: InsertMessageConnectionExtension): Promise<MessageConnectionExtension>;
  approveMessageConnectionExtension(id: number, userId: number): Promise<MessageConnectionExtension | undefined>;
  silentlyDeclineMessageExtension(id: number, userId: number): Promise<boolean>;
  getPendingExtensionsForUser(userId: number): Promise<Array<MessageConnectionExtension & { requestedBy: { fullName: string, profilePicture: string | null } }>>;
  hasUserSeenMessageExpirationNotice(userId: number): Promise<boolean>;
  updateUserMessageExpirationNoticeSeen(userId: number): Promise<User | undefined>;
  
  // User Activity Monitoring methods (Feature #2)
  logUserActivity(activity: InsertUserActivityLog): Promise<UserActivityLog>;
  getUserActivities(userId: number, restaurantId?: number, limit?: number): Promise<UserActivityLog[]>;
  getRestaurantUserActivities(restaurantId: number, limit?: number): Promise<UserActivityLog[]>;
  getActivityStatsByRestaurant(restaurantId: number): Promise<any>; // Summary stats for dashboard
  
  // Host Performance Metrics methods (Feature #3)
  createHostPerformanceMetric(metric: InsertHostPerformanceMetric): Promise<HostPerformanceMetric>;
  getHostPerformanceMetrics(userId: number, restaurantId: number): Promise<HostPerformanceMetric[]>;
  getRestaurantPerformanceMetrics(restaurantId: number): Promise<HostPerformanceMetric[]>;
  getHostPerformanceSummary(userId: number, restaurantId: number): Promise<any>; // Summary stats
  
  // Restaurant Announcements methods (Feature #7 - Communication)
  createAnnouncement(announcement: InsertRestaurantAnnouncement): Promise<RestaurantAnnouncement>;
  getRestaurantAnnouncements(restaurantId: number): Promise<RestaurantAnnouncement[]>;
  getAnnouncementById(id: number): Promise<RestaurantAnnouncement | undefined>;
  updateAnnouncement(id: number, data: Partial<RestaurantAnnouncement>): Promise<RestaurantAnnouncement | undefined>;
  deleteAnnouncement(id: number): Promise<boolean>;
  
  // Announcement Recipients methods
  addAnnouncementRecipient(recipient: InsertAnnouncementRecipient): Promise<AnnouncementRecipient>;
  markAnnouncementAsRead(announcementId: number, userId: number): Promise<AnnouncementRecipient | undefined>;
  getUnreadAnnouncementsForUser(userId: number, restaurantId?: number): Promise<Array<RestaurantAnnouncement & { restaurant: { name: string } }>>;
  
  // Bulk User Operations methods (Feature #9)
  bulkAddUsersToRestaurant(userIds: number[], restaurantId: number): Promise<User[]>;
  bulkRemoveUsersFromRestaurant(userIds: number[], restaurantId: number): Promise<User[]>;
  bulkUpdateUserRoles(userIds: number[], role: string): Promise<User[]>;
  
  // Dinner Check methods
  createDinnerCheck(check: InsertDinnerCheck): Promise<DinnerCheck>;
  getAllDinnerChecks(): Promise<DinnerCheck[]>;
  getDinnerCheckById(checkId: number): Promise<DinnerCheck | undefined>;
  getDinnerChecksByRestaurantIds(restaurantIds: number[]): Promise<DinnerCheck[]>;
  getDinnerChecksByHostId(hostId: number): Promise<DinnerCheck[]>;
  getRestaurantsByAdminId(adminId: number): Promise<Restaurant[]>;
  getUserAverageCheckAmount(userId: number): Promise<number>;
  getHighRollerStatus(userId: number): Promise<boolean>;
  updateDinnerCheck(id: number, data: Partial<DinnerCheck>): Promise<DinnerCheck | undefined>;
  
  // Recipe methods
  getRecipes(): Promise<any[]>;
  getRecipeAnalyses(): Promise<any[]>;
  
  // Wine methods
  createWine(wine: any): Promise<any>;
  getWinePromotions(userId?: number): Promise<any[]>;
  createWinePromotion(promotion: any): Promise<any>;
  getWineAnalytics(userId?: number): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userPreferences: Map<number, UserPreferences>;
  private restaurants: Map<number, Restaurant>;
  private meetups: Map<number, Meetup>;
  private meetupParticipants: Map<number, MeetupParticipant>;
  private messages: Map<number, Message>;
  private matchScores: Map<number, MatchScore>;
  private userLanguages: Map<number, UserLanguage>;
  private groupMeetupSessions: Map<number, GroupMeetupSession>;
  private groupMeetupParticipants: Map<number, GroupMeetupParticipant>;
  private restaurantContacts: Map<number, RestaurantContact>;
  private aiVoiceCallLogs: Map<number, AiVoiceCallLog>;
  private callScripts: Map<number, CallScript>;
  private callRecordings: Map<number, CallRecording>;
  private userActivityLogs: Map<number, UserActivityLog>;
  private hostPerformanceMetrics: Map<number, HostPerformanceMetric>;
  private restaurantAnnouncements: Map<number, RestaurantAnnouncement>;
  private announcementRecipients: Map<number, AnnouncementRecipient>;
  private dinnerChecks: Map<number, DinnerCheck>;
  private dinnerCheckAverages: Map<number, DinnerCheckAverage>;
  private userDinnerChecks: Map<number, UserDinnerCheck>;
  
  private currentUserId: number;
  private currentPreferencesId: number;
  private currentRestaurantId: number;
  private currentMeetupId: number;
  private currentParticipantId: number;
  private currentMessageId: number;
  private currentMatchScoreId: number;
  private currentUserLanguageId: number;
  private currentGroupMeetupSessionId: number;
  private currentGroupMeetupParticipantId: number;
  private currentRestaurantContactId: number;
  private currentAiVoiceCallLogId: number;
  private currentCallScriptId: number;
  private currentCallRecordingId: number;
  private currentUserActivityLogId: number;
  private currentHostPerformanceMetricId: number;
  private currentRestaurantAnnouncementId: number;
  private currentAnnouncementRecipientId: number;
  private currentDinnerCheckId: number;
  private currentDinnerCheckAverageId: number;
  private currentUserDinnerCheckId: number;

  constructor() {
    this.users = new Map();
    this.userPreferences = new Map();
    this.restaurants = new Map();
    this.meetups = new Map();
    this.meetupParticipants = new Map();
    this.messages = new Map();
    this.matchScores = new Map();
    this.userLanguages = new Map();
    this.groupMeetupSessions = new Map();
    this.groupMeetupParticipants = new Map();
    this.restaurantContacts = new Map();
    this.aiVoiceCallLogs = new Map();
    this.callScripts = new Map();
    this.callRecordings = new Map();
    this.userActivityLogs = new Map();
    this.hostPerformanceMetrics = new Map();
    this.restaurantAnnouncements = new Map();
    this.announcementRecipients = new Map();
    this.dinnerChecks = new Map();
    this.dinnerCheckAverages = new Map();
    this.userDinnerChecks = new Map();
    
    this.currentUserId = 1;
    this.currentPreferencesId = 1;
    this.currentRestaurantId = 1;
    this.currentMeetupId = 1;
    this.currentParticipantId = 1;
    this.currentMessageId = 1;
    this.currentMatchScoreId = 1;
    this.currentUserLanguageId = 1;
    this.currentGroupMeetupSessionId = 1;
    this.currentGroupMeetupParticipantId = 1;
    this.currentRestaurantContactId = 1;
    this.currentAiVoiceCallLogId = 1;
    this.currentCallScriptId = 1;
    this.currentCallRecordingId = 1;
    this.currentUserActivityLogId = 1;
    this.currentHostPerformanceMetricId = 1;
    this.currentRestaurantAnnouncementId = 1;
    this.currentAnnouncementRecipientId = 1;
    this.currentDinnerCheckId = 1;
    this.currentDinnerCheckAverageId = 1;
    this.currentUserDinnerCheckId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // User Preferences methods
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(
      (pref) => pref.userId === userId,
    );
  }
  
  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.currentPreferencesId++;
    const updatedAt = new Date();
    const userPrefs: UserPreferences = { ...preferences, id, updatedAt };
    this.userPreferences.set(id, userPrefs);
    return userPrefs;
  }
  
  async updateUserPreferences(userId: number, preferencesData: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const preferences = Array.from(this.userPreferences.values()).find(
      (pref) => pref.userId === userId,
    );
    
    if (!preferences) return undefined;
    
    const updatedPreferences = { 
      ...preferences, 
      ...preferencesData,
      updatedAt: new Date() 
    };
    
    this.userPreferences.set(preferences.id, updatedPreferences);
    return updatedPreferences;
  }

  // Restaurant methods
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }
  
  async getAllRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values());
  }
  
  async getFeaturedRestaurants(limit: number = 4): Promise<Restaurant[]> {
    const allRestaurants = Array.from(this.restaurants.values());
    const featuredRestaurants = allRestaurants.filter(restaurant => restaurant.isFeatured);
    return featuredRestaurants.slice(0, limit);
  }
  
  async getRestaurantsByManagerId(managerId: number): Promise<Restaurant[]> {
    const allRestaurants = Array.from(this.restaurants.values());
    return allRestaurants.filter(restaurant => restaurant.managerId === managerId);
  }
  
  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const id = this.currentRestaurantId++;
    const newRestaurant: Restaurant = { ...restaurant, id };
    this.restaurants.set(id, newRestaurant);
    return newRestaurant;
  }
  
  async updateRestaurantFeaturedStatus(id: number, isFeatured: boolean): Promise<Restaurant | undefined> {
    const restaurant = this.restaurants.get(id);
    if (!restaurant) return undefined;
    
    const updatedRestaurant = { ...restaurant, isFeatured };
    this.restaurants.set(id, updatedRestaurant);
    return updatedRestaurant;
  }
  
  // Restaurant User Management methods
  async getUsersByRestaurantId(restaurantId: number): Promise<User[]> {
    // In a real database, this would use a join with a restaurant_users table
    // For our in-memory implementation, we'll maintain this relationship in the user object
    const allUsers = Array.from(this.users.values());
    return allUsers.filter(user => {
      // Check if user has the restaurantId in their authorized restaurants array
      return user.authorizedRestaurants?.includes(restaurantId);
    });
  }
  
  async addUserToRestaurant(userId: number, restaurantId: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    // Create or update the authorizedRestaurants array
    const authorizedRestaurants = user.authorizedRestaurants || [];
    if (!authorizedRestaurants.includes(restaurantId)) {
      authorizedRestaurants.push(restaurantId);
    }
    
    // Update the user
    const updatedUser = { 
      ...user, 
      authorizedRestaurants 
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async removeUserFromRestaurant(userId: number, restaurantId: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user || !user.authorizedRestaurants) return undefined;
    
    // Remove the restaurant ID from the user's authorized restaurants
    const updatedAuthorizedRestaurants = user.authorizedRestaurants.filter(
      id => id !== restaurantId
    );
    
    // Update the user
    const updatedUser = { 
      ...user, 
      authorizedRestaurants: updatedAuthorizedRestaurants 
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserAuthorizedRestaurants(userId: number, restaurantIds: number[]): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    // Update the user with the new list of authorized restaurants
    const updatedUser = { 
      ...user, 
      authorizedRestaurants: restaurantIds 
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async getRestaurantsByUserId(userId: number): Promise<Restaurant[]> {
    const user = this.users.get(userId);
    if (!user || !user.authorizedRestaurants || user.authorizedRestaurants.length === 0) {
      return [];
    }
    
    // Get all restaurants that the user is authorized for
    return Array.from(this.restaurants.values()).filter(restaurant => 
      user.authorizedRestaurants?.includes(restaurant.id)
    );
  }
  
  // Restaurant content methods
  async getRecipesByRestaurantIds(restaurantIds: number[]): Promise<any[]> {
    // This is a placeholder implementation for in-memory storage
    // In a real database implementation, this would fetch recipes from a recipes table
    // filtered by restaurant IDs
    return [
      {
        id: 1,
        name: "Artisan Pasta Dish",
        restaurant: { id: 1, name: "Bella Italia" },
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
    ].filter(recipe => restaurantIds.includes(recipe.restaurant.id));
  }
  
  async getWineListsByRestaurantIds(restaurantIds: number[]): Promise<any[]> {
    // This is a placeholder implementation for in-memory storage
    // In a real database implementation, this would fetch wines from a wines table
    // filtered by restaurant IDs
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
        restaurant: { id: 1, name: "Bella Italia" },
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
    ].filter(wine => restaurantIds.includes(wine.restaurant.id));
  }

  // Meetup methods
  async getMeetup(id: number): Promise<Meetup | undefined> {
    return this.meetups.get(id);
  }
  
  async getAllMeetups(): Promise<Meetup[]> {
    return Array.from(this.meetups.values());
  }
  
  async getUserMeetups(userId: number): Promise<Meetup[]> {
    const allMeetups = Array.from(this.meetups.values());
    const userParticipations = Array.from(this.meetupParticipants.values()).filter(
      (participant) => participant.userId === userId
    );
    
    const userMeetupIds = new Set([
      ...userParticipations.map(p => p.meetupId),
      ...allMeetups.filter(m => m.createdBy === userId).map(m => m.id)
    ]);
    
    return allMeetups.filter(meetup => userMeetupIds.has(meetup.id));
  }
  
  async getUpcomingMeetups(limit: number = 3): Promise<Meetup[]> {
    const now = new Date();
    const upcomingMeetups = Array.from(this.meetups.values())
      .filter(meetup => new Date(meetup.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return upcomingMeetups.slice(0, limit);
  }
  
  async createMeetup(meetup: InsertMeetup): Promise<Meetup> {
    const id = this.currentMeetupId++;
    const createdAt = new Date();
    const newMeetup: Meetup = { ...meetup, id, createdAt };
    this.meetups.set(id, newMeetup);
    return newMeetup;
  }
  
  async updateMeetupStatus(id: number, status: string): Promise<Meetup | undefined> {
    const meetup = this.meetups.get(id);
    if (!meetup) return undefined;
    
    const updatedMeetup = { ...meetup, status };
    this.meetups.set(id, updatedMeetup);
    return updatedMeetup;
  }

  // Meetup Participants methods
  async getMeetupParticipants(meetupId: number): Promise<MeetupParticipant[]> {
    return Array.from(this.meetupParticipants.values()).filter(
      (participant) => participant.meetupId === meetupId
    );
  }
  
  async addMeetupParticipant(participant: InsertMeetupParticipant): Promise<MeetupParticipant> {
    const id = this.currentParticipantId++;
    const joinedAt = new Date();
    const newParticipant: MeetupParticipant = { ...participant, id, joinedAt };
    this.meetupParticipants.set(id, newParticipant);
    return newParticipant;
  }
  
  async updateParticipantStatus(meetupId: number, userId: number, status: string): Promise<MeetupParticipant | undefined> {
    const participant = Array.from(this.meetupParticipants.values()).find(
      (p) => p.meetupId === meetupId && p.userId === userId
    );
    
    if (!participant) return undefined;
    
    const updatedParticipant = { ...participant, status };
    this.meetupParticipants.set(participant.id, updatedParticipant);
    return updatedParticipant;
  }

  // Message methods
  async getMeetupMessages(meetupId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.meetupId === meetupId)
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const sentAt = new Date();
    const newMessage: Message = { ...message, id, sentAt };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  // Match Score methods
  async calculateMatchScores(userId: number): Promise<MatchScore[]> {
    const userPrefs = await this.getUserPreferences(userId);
    if (!userPrefs) return [];
    
    const allUsers = Array.from(this.users.values()).filter(u => u.id !== userId);
    const results: MatchScore[] = [];
    
    for (const otherUser of allUsers) {
      const otherUserPrefs = await this.getUserPreferences(otherUser.id);
      if (!otherUserPrefs) continue;
      
      // Simple compatibility calculation (in a real app, this would be more sophisticated)
      const compatibilityScore = Math.floor(Math.random() * 40) + 60; // 60-100 range for demo
      
      const existingScore = Array.from(this.matchScores.values()).find(
        score => 
          (score.user1Id === userId && score.user2Id === otherUser.id) ||
          (score.user1Id === otherUser.id && score.user2Id === userId)
      );
      
      if (existingScore) {
        const updatedScore = { 
          ...existingScore, 
          compatibilityScore,
          calculatedAt: new Date() 
        };
        this.matchScores.set(existingScore.id, updatedScore);
        results.push(updatedScore);
      } else {
        const id = this.currentMatchScoreId++;
        const newScore: MatchScore = {
          id,
          user1Id: userId,
          user2Id: otherUser.id,
          compatibilityScore,
          calculatedAt: new Date()
        };
        this.matchScores.set(id, newScore);
        results.push(newScore);
      }
    }
    
    return results;
  }
  
  async getCompatibleMatches(userId: number, limit: number = 3): Promise<Array<User & { compatibilityScore: number }>> {
    await this.calculateMatchScores(userId);
    
    const userMatches = Array.from(this.matchScores.values())
      .filter(score => score.user1Id === userId || score.user2Id === userId)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
    const results: Array<User & { compatibilityScore: number }> = [];
    
    for (const match of userMatches) {
      const matchUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const matchUser = await this.getUser(matchUserId);
      
      if (matchUser) {
        results.push({
          ...matchUser,
          compatibilityScore: match.compatibilityScore
        });
      }
      
      if (results.length >= limit) break;
    }
    
    return results;
  }
  
  // User Language methods
  async getUserLanguages(userId: number): Promise<UserLanguage[]> {
    return Array.from(this.userLanguages.values())
      .filter(lang => lang.userId === userId);
  }
  
  async addUserLanguage(language: InsertUserLanguage): Promise<UserLanguage> {
    const id = this.currentUserLanguageId++;
    const createdAt = new Date();
    const newLanguage: UserLanguage = { ...language, id, createdAt };
    this.userLanguages.set(id, newLanguage);
    return newLanguage;
  }
  
  async removeUserLanguage(userId: number, language: string): Promise<boolean> {
    const userLanguage = Array.from(this.userLanguages.values()).find(
      l => l.userId === userId && l.language === language
    );
    
    if (userLanguage) {
      return this.userLanguages.delete(userLanguage.id);
    }
    
    return false;
  }
  
  // Group Meetup Session methods
  async createGroupMeetupSession(session: InsertGroupMeetupSession): Promise<GroupMeetupSession> {
    const id = this.currentGroupMeetupSessionId++;
    const createdAt = new Date();
    const newSession: GroupMeetupSession = { ...session, id, createdAt };
    this.groupMeetupSessions.set(id, newSession);
    return newSession;
  }
  
  async getGroupMeetupSessions(filters?: { city?: string, language?: string, dayOfWeek?: string, timeSlot?: string }): Promise<GroupMeetupSession[]> {
    let sessions = Array.from(this.groupMeetupSessions.values());
    
    if (filters) {
      if (filters.city) {
        sessions = sessions.filter(s => s.city === filters.city);
      }
      if (filters.language) {
        sessions = sessions.filter(s => s.language === filters.language);
      }
      if (filters.dayOfWeek) {
        sessions = sessions.filter(s => s.dayOfWeek === filters.dayOfWeek);
      }
      if (filters.timeSlot) {
        sessions = sessions.filter(s => s.timeSlot === filters.timeSlot);
      }
    }
    
    return sessions;
  }
  
  async getGroupMeetupSessionById(id: number): Promise<GroupMeetupSession | undefined> {
    return this.groupMeetupSessions.get(id);
  }
  
  async updateGroupMeetupSession(id: number, data: Partial<GroupMeetupSession>): Promise<GroupMeetupSession | undefined> {
    const session = this.groupMeetupSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...data };
    this.groupMeetupSessions.set(id, updatedSession);
    return updatedSession;
  }
  
  async getAvailableGroupMeetupSlots(): Promise<GroupMeetupSession[]> {
    return Array.from(this.groupMeetupSessions.values())
      .filter(session => session.status === 'open');
  }
  
  // Group Meetup Participant methods
  async addGroupMeetupParticipant(participant: InsertGroupMeetupParticipant): Promise<GroupMeetupParticipant> {
    const id = this.currentGroupMeetupParticipantId++;
    const joinedAt = new Date();
    const newParticipant: GroupMeetupParticipant = { ...participant, id, joinedAt };
    this.groupMeetupParticipants.set(id, newParticipant);
    return newParticipant;
  }
  
  async getGroupMeetupParticipants(sessionId: number): Promise<Array<GroupMeetupParticipant & { user: User }>> {
    const participants = Array.from(this.groupMeetupParticipants.values())
      .filter(p => p.sessionId === sessionId);
    
    const result: Array<GroupMeetupParticipant & { user: User }> = [];
    
    for (const participant of participants) {
      const user = await this.getUser(participant.userId);
      if (user) {
        result.push({ ...participant, user });
      }
    }
    
    return result;
  }
  
  async updateGroupMeetupParticipantStatus(sessionId: number, userId: number, status: string): Promise<GroupMeetupParticipant | undefined> {
    const participant = Array.from(this.groupMeetupParticipants.values()).find(
      p => p.sessionId === sessionId && p.userId === userId
    );
    
    if (!participant) return undefined;
    
    const updatedParticipant = { ...participant, status };
    this.groupMeetupParticipants.set(participant.id, updatedParticipant);
    return updatedParticipant;
  }
  
  // Restaurant Contact methods
  async getRestaurantContacts(restaurantId: number): Promise<RestaurantContact[]> {
    return Array.from(this.restaurantContacts.values())
      .filter(contact => contact.restaurantId === restaurantId);
  }
  
  async getRestaurantContactById(id: number): Promise<RestaurantContact | undefined> {
    return this.restaurantContacts.get(id);
  }
  
  async createRestaurantContact(contact: InsertRestaurantContact): Promise<RestaurantContact> {
    const id = this.currentRestaurantContactId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newContact: RestaurantContact = { 
      ...contact, 
      id, 
      createdAt, 
      updatedAt,
      lastContactDate: null,
      successRate: null
    };
    this.restaurantContacts.set(id, newContact);
    return newContact;
  }
  
  async updateRestaurantContact(id: number, data: Partial<RestaurantContact>): Promise<RestaurantContact | undefined> {
    const contact = this.restaurantContacts.get(id);
    if (!contact) return undefined;
    
    const updatedContact = { 
      ...contact,
      ...data,
      updatedAt: new Date()
    };
    this.restaurantContacts.set(id, updatedContact);
    return updatedContact;
  }
  
  // AI Voice Call methods
  async createAiVoiceCallLog(log: InsertAiVoiceCallLog): Promise<AiVoiceCallLog> {
    const id = this.currentAiVoiceCallLogId++;
    const startTime = new Date();
    const newLog: AiVoiceCallLog = { ...log, id, startTime, endTime: null };
    this.aiVoiceCallLogs.set(id, newLog);
    return newLog;
  }
  
  async updateAiVoiceCallLog(id: number, data: Partial<AiVoiceCallLog>): Promise<AiVoiceCallLog | undefined> {
    const log = this.aiVoiceCallLogs.get(id);
    if (!log) return undefined;
    
    const updatedLog = { ...log, ...data };
    this.aiVoiceCallLogs.set(id, updatedLog);
    return updatedLog;
  }
  
  async getAiVoiceCallLogs(sessionId: number): Promise<AiVoiceCallLog[]> {
    return Array.from(this.aiVoiceCallLogs.values())
      .filter(log => log.sessionId === sessionId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }
  
  async getLatestAiVoiceCallLog(sessionId: number): Promise<AiVoiceCallLog | undefined> {
    const logs = await this.getAiVoiceCallLogs(sessionId);
    return logs.length > 0 ? logs[logs.length - 1] : undefined;
  }

  // Call Script methods
  async getAllCallScripts(): Promise<CallScript[]> {
    return Array.from(this.callScripts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getCallScript(id: number): Promise<CallScript | undefined> {
    return this.callScripts.get(id);
  }
  
  async createCallScript(script: InsertCallScript): Promise<CallScript> {
    const id = this.currentCallScriptId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newScript: CallScript = { 
      ...script, 
      id, 
      createdAt,
      updatedAt
    };
    this.callScripts.set(id, newScript);
    return newScript;
  }
  
  async updateCallScript(id: number, data: Partial<CallScript>): Promise<CallScript | undefined> {
    const script = this.callScripts.get(id);
    if (!script) return undefined;
    
    const updatedScript = { 
      ...script, 
      ...data, 
      updatedAt: new Date() 
    };
    this.callScripts.set(id, updatedScript);
    return updatedScript;
  }
  
  // Call Recording methods
  async getAllCallRecordings(): Promise<CallRecording[]> {
    return Array.from(this.callRecordings.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getCallRecordingsWithDetails(): Promise<Array<CallRecording & { callLog: AiVoiceCallLog }>> {
    const recordings = await this.getAllCallRecordings();
    const result: Array<CallRecording & { callLog: AiVoiceCallLog }> = [];
    
    for (const recording of recordings) {
      const callLog = this.aiVoiceCallLogs.get(recording.callLogId);
      if (callLog) {
        result.push({
          ...recording,
          callLog
        });
      }
    }
    
    return result;
  }
  
  async getCallRecording(id: number): Promise<CallRecording | undefined> {
    return this.callRecordings.get(id);
  }

  // Dinner Check methods
  async createDinnerCheck(check: InsertDinnerCheck): Promise<DinnerCheck> {
    const id = this.currentDinnerCheckId++;
    const reportedAt = new Date();
    const newCheck: DinnerCheck = { 
      ...check, 
      id, 
      reportedAt,
      // Set defaults for fields
      inputDeadline: null,
      inputRequiredBy: null,
      inputProvided: false,
      isOverdue: false,
      notificationSent: false
    };
    this.dinnerChecks.set(id, newCheck);
    return newCheck;
  }

  async getAllDinnerChecks(): Promise<DinnerCheck[]> {
    return Array.from(this.dinnerChecks.values())
      .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
  }

  async getDinnerCheckById(checkId: number): Promise<DinnerCheck | undefined> {
    return this.dinnerChecks.get(checkId);
  }

  async getDinnerChecksByRestaurantIds(restaurantIds: number[]): Promise<DinnerCheck[]> {
    return Array.from(this.dinnerChecks.values())
      .filter(check => restaurantIds.includes(check.restaurantId))
      .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
  }

  async getDinnerChecksByHostId(hostId: number): Promise<DinnerCheck[]> {
    return Array.from(this.dinnerChecks.values())
      .filter(check => check.hostId === hostId)
      .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
  }

  async getRestaurantsByAdminId(adminId: number): Promise<Restaurant[]> {
    // Get restaurants where the user is the manager
    return Array.from(this.restaurants.values())
      .filter(restaurant => restaurant.managerId === adminId);
  }

  async getUserAverageCheckAmount(userId: number): Promise<number> {
    // In a real implementation, this would perform a query against user_dinner_checks
    // For our in-memory implementation, we'll return a placeholder value
    const user = this.users.get(userId);
    if (!user) return 0;
    
    // This would be calculated from actual dinner check participation
    return user.averageSpendPerDinner || 0;
  }

  async getHighRollerStatus(userId: number): Promise<boolean> {
    const avgAmount = await this.getUserAverageCheckAmount(userId);
    // Compare to constant defined in shared/constants.ts
    return avgAmount > 150; // Default threshold
  }

  async updateDinnerCheck(id: number, data: Partial<DinnerCheck>): Promise<DinnerCheck | undefined> {
    const check = this.dinnerChecks.get(id);
    if (!check) return undefined;
    
    const updatedCheck = { 
      ...check, 
      ...data
    };
    
    this.dinnerChecks.set(id, updatedCheck);
    return updatedCheck;
  }

  // Bulk User Operations methods
  async bulkAddUsersToRestaurant(userIds: number[], restaurantId: number): Promise<User[]> {
    const updatedUsers: User[] = [];
    
    for (const userId of userIds) {
      const updatedUser = await this.addUserToRestaurant(userId, restaurantId);
      if (updatedUser) {
        updatedUsers.push(updatedUser);
      }
    }
    
    return updatedUsers;
  }
  
  async bulkRemoveUsersFromRestaurant(userIds: number[], restaurantId: number): Promise<User[]> {
    const updatedUsers: User[] = [];
    
    for (const userId of userIds) {
      const updatedUser = await this.removeUserFromRestaurant(userId, restaurantId);
      if (updatedUser) {
        updatedUsers.push(updatedUser);
      }
    }
    
    return updatedUsers;
  }
  
  async bulkUpdateUserRoles(userIds: number[], role: string): Promise<User[]> {
    const updatedUsers: User[] = [];
    
    for (const userId of userIds) {
      const user = this.users.get(userId);
      if (!user) continue;
      
      const updatedUser = { ...user, role };
      this.users.set(userId, updatedUser);
      updatedUsers.push(updatedUser);
    }
    
    return updatedUsers;
  }

  // Initialize with sample data
  private initializeData() {
    // Sample Restaurants
    const restaurants: InsertRestaurant[] = [
      {
        name: "Bella Italia Restaurant",
        description: "Authentic Italian cuisine in a cozy atmosphere.",
        cuisineType: "Italian, Pasta, Pizza",
        address: "123 Main St, New York, NY",
        distance: "1.5 mi",
        imageUrl: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17",
        rating: "4.6",
        ambiance: "Elegant",
        noiseLevel: "Moderate",
        priceRange: "$$$",
        features: ["Outdoor Seating", "Wine List", "Vegetarian Options"],
        menuUrl: "/menu/bella-italia"
      },
      {
        name: "Sakura Japanese Bistro",
        description: "Modern Japanese cuisine with a focus on fresh ingredients.",
        cuisineType: "Japanese, Sushi, Asian Fusion",
        address: "789 East St, Manhattan, NY",
        distance: "0.8 mi",
        imageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9",
        rating: "4.5",
        ambiance: "Modern",
        noiseLevel: "Lively",
        priceRange: "$$",
        features: ["Sushi Bar", "Sake Selection", "Private Dining"],
        menuUrl: "/menu/sakura-bistro"
      },
      {
        name: "Page Turner Café",
        description: "Cozy café with great brunch options and book-themed ambiance.",
        cuisineType: "Café, Brunch, Vegetarian",
        address: "456 Park Ave, Brooklyn, NY",
        distance: "0.5 mi",
        imageUrl: "https://images.unsplash.com/photo-1525610553991-2bede1a236e2",
        rating: "4.7",
        ambiance: "Casual",
        noiseLevel: "Quiet",
        priceRange: "$$",
        features: ["Book Exchange", "Organic Coffee", "Vegan Options"],
        menuUrl: "/menu/page-turner"
      },
      {
        name: "Olivia's Mediterranean",
        description: "Fresh Mediterranean cuisine with vegetarian-friendly options.",
        cuisineType: "Mediterranean, Vegetarian-Friendly",
        address: "555 Ocean Dr, New York, NY",
        distance: "1.2 mi",
        imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b",
        rating: "4.8",
        ambiance: "Cozy",
        noiseLevel: "Quiet",
        priceRange: "$$",
        features: ["Outdoor Seating", "Mezze Platters", "Gluten-Free Options"],
        menuUrl: "/menu/olivias"
      }
    ];
    
    // Set the first two restaurants as featured
    restaurants.forEach((restaurant, index) => {
      const id = this.currentRestaurantId++;
      this.restaurants.set(id, { 
        ...restaurant, 
        id,
        isFeatured: index < 2 // Only the first two restaurants are featured
      });
    });
    
    // Sample Users will be created during registration
    // Sample Meetups will be created by users
    // Sample User Preferences will be created during questionnaire completion
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
