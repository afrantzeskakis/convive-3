import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, varchar, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { restaurantWines, restaurantWinesIsolated } from "./wine-schema";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").unique(),
  city: text("city"),
  gender: text("gender"),
  age: integer("age"),
  occupation: text("occupation"),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  lookingFor: text("looking_for"),
  onboardingComplete: boolean("onboarding_complete").default(false),
  role: text("role").default("user").notNull(),  // Available roles: "user", "restaurant_admin", "admin", "super_admin"
  isPremiumUser: boolean("is_premium_user").default(false), // Premium user status based on dining history
  averageSpendPerDinner: decimal("average_spend_per_dinner", { precision: 10, scale: 2 }), // Avg spend across all dinners
  lifetimeDiningValue: decimal("lifetime_dining_value", { precision: 10, scale: 2 }), // Total dining value
  dinnerCount: integer("dinner_count").default(0), // Number of dinners attended
  highCheckDinnerCount: integer("high_check_dinner_count").default(0), // Number of high check dinners ($175+)
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID
  stripeSubscriptionId: text("stripe_subscription_id"), // Stripe subscription ID
  hasSeenMessageExpirationNotice: boolean("has_seen_message_expiration_notice").default(false), // Whether user has seen the message expiration notice
  authorizedRestaurants: jsonb("authorized_restaurants").$type<number[]>(), // Array of restaurant IDs the user has access to
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Wine recommendation logs for analytics
export const wineRecommendationLogs = pgTable("wine_recommendation_logs", {
  id: serial("id").primaryKey(),
  restaurant_id: integer("restaurant_id").notNull().references(() => restaurants.id),
  search_query: text("search_query").notNull(),
  recommended_wine_ids: jsonb("recommended_wine_ids").$type<number[]>(), // Array of recommended wine IDs
  guest_preferences: jsonb("guest_preferences").$type<{
    tannins?: string;
    acidity?: string;
    body?: string;
    sweetness?: string;
    color?: string;
    price_range?: string;
  }>(),
  server_user_id: integer("server_user_id"), // ID of server who made the request
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Restaurant sync status for monthly wine data updates
export const restaurantSyncStatus = pgTable("restaurant_sync_status", {
  id: serial("id").primaryKey(),
  restaurant_id: integer("restaurant_id").notNull().references(() => restaurants.id).unique(),
  last_sync_date: timestamp("last_sync_date"),
  next_sync_date: timestamp("next_sync_date").notNull(),
  sync_status: varchar("sync_status", { length: 50 }).default("pending"), // pending, in_progress, completed, failed
  wine_count_synced: integer("wine_count_synced").default(0),
  error_message: text("error_message"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Restaurant wine descriptions for manual input
export const restaurantWineDescriptions = pgTable("restaurant_wine_descriptions", {
  id: serial("id").primaryKey(),
  restaurant_wine_id: integer("restaurant_wine_id").notNull(),
  custom_description: text("custom_description").notNull(),
  admin_user_id: integer("admin_user_id").notNull().references(() => users.id),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Culinary term cache for restaurant-specific GPT-4o generated content
export const culinaryTermCache = pgTable("culinary_term_cache", {
  id: serial("id").primaryKey(),
  restaurant_id: integer("restaurant_id").notNull().references(() => restaurants.id),
  term: text("term").notNull(),
  carousel_data: jsonb("carousel_data").notNull().$type<{
    slides: Array<{
      type: string;
      title: string;
      content: string;
      additionalInfo?: string;
    }>;
  }>(),
  cache_version: integer("cache_version").notNull().default(1),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  isPremiumUser: true,
  averageSpendPerDinner: true,
  lifetimeDiningValue: true,
  dinnerCount: true,
  highCheckDinnerCount: true
}).extend({
  authorizedRestaurants: z.array(z.number()).optional()
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User Preferences model for questionnaire responses
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  diningPreferences: jsonb("dining_preferences").notNull(),
  socialPreferences: jsonb("social_preferences").notNull(),
  dietaryRestrictions: jsonb("dietary_restrictions"),
  atmospherePreferences: jsonb("atmosphere_preferences").notNull(),
  interests: jsonb("interests").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Create a custom insert schema for userPreferences that includes validation for the JSON fields
export const insertUserPreferencesSchema = createInsertSchema(userPreferences)
  .omit({
    id: true,
    updatedAt: true
  })
  .extend({
    // Ensure these are objects, but don't enforce specific structure
    diningPreferences: z.record(z.any()).default({}),
    socialPreferences: z.record(z.any()).default({}),
    atmospherePreferences: z.record(z.any()).default({}),
    interests: z.record(z.any()).default({}),
    dietaryRestrictions: z.record(z.any()).optional().default({})
  });
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Restaurant model
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  cuisineType: text("cuisine_type").notNull(),
  cuisineDescription: text("cuisine_description"), // Detailed description of restaurant's cuisine style for GPT-4o context
  address: text("address").notNull(),
  distance: text("distance"),
  imageUrl: text("image_url"),
  rating: text("rating"),
  ambiance: text("ambiance"),
  noiseLevel: text("noise_level"),
  priceRange: text("price_range"),
  features: jsonb("features"),
  awards: jsonb("awards"), // JSON array of awards the restaurant has won
  menuUrl: text("menu_url"),
  isFeatured: boolean("is_featured").default(false),
  managerId: integer("manager_id").references(() => users.id),  // Reference to user who manages this restaurant
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
});
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;

// Meetup model
export const meetups = pgTable("meetups", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  maxParticipants: integer("max_participants").notNull(),
  status: text("status").notNull().default("pending"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  hostId: integer("host_id").references(() => users.id), // Restaurant employee assigned as host
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMeetupSchema = createInsertSchema(meetups).omit({
  id: true,
  createdAt: true
});
export type InsertMeetup = z.infer<typeof insertMeetupSchema>;
export type Meetup = typeof meetups.$inferSelect;

// Meetup participants (join table)
export const meetupParticipants = pgTable("meetup_participants", {
  id: serial("id").primaryKey(),
  meetupId: integer("meetup_id").notNull().references(() => meetups.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertMeetupParticipantSchema = createInsertSchema(meetupParticipants).omit({
  id: true,
  joinedAt: true
});
export type InsertMeetupParticipant = z.infer<typeof insertMeetupParticipantSchema>;
export type MeetupParticipant = typeof meetupParticipants.$inferSelect;

// Messages model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  meetupId: integer("meetup_id").notNull().references(() => meetups.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // When the message expires (1 week from sent_at by default)
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Message Connection Extensions - for extending the 1-week message limit
export const messageConnectionExtensions = pgTable("message_connection_extensions", {
  id: serial("id").primaryKey(),
  meetupId: integer("meetup_id").notNull().references(() => meetups.id),
  requestedById: integer("requested_by_id").notNull().references(() => users.id),
  requestedUserId: integer("requested_user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, approved, declined, expired
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  expiresAt: timestamp("expires_at"), // When the extension expires (adds another week)
});

export const insertMessageConnectionExtensionSchema = createInsertSchema(messageConnectionExtensions).omit({
  id: true,
  requestedAt: true,
  approvedAt: true,
  expiresAt: true
});
export type InsertMessageConnectionExtension = z.infer<typeof insertMessageConnectionExtensionSchema>;
export type MessageConnectionExtension = typeof messageConnectionExtensions.$inferSelect;

// Match scores between users
export const matchScores = pgTable("match_scores", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull().references(() => users.id),
  user2Id: integer("user2_id").notNull().references(() => users.id),
  compatibilityScore: integer("compatibility_score").notNull(),
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
});

export const insertMatchScoreSchema = createInsertSchema(matchScores).omit({
  id: true,
  calculatedAt: true
});
export type InsertMatchScore = z.infer<typeof insertMatchScoreSchema>;
export type MatchScore = typeof matchScores.$inferSelect;

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  tier: text("tier").notNull().default("standard"), // standard or high_roller
  dinnerCount: integer("dinners_per_month").notNull(), // Number of dinners per month (2, 3, or 4)
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stripePriceId: text("stripe_price_id"), // Stripe price ID for this plan
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true
});
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// User Subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  tier: text("tier").notNull().default("standard"), // standard or high_roller
  stripeSubscriptionId: text("stripe_subscription_id"), // Stripe subscription ID
  status: text("status").notNull().default("active"), // active, canceled, expired, past_due, trial
  dinnersRemaining: integer("dinners_remaining"), // Number of dinners remaining in the current billing cycle
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  currentPeriodStart: timestamp("current_period_start"), // Start of current billing period
  currentPeriodEnd: timestamp("current_period_end"), // End of current billing period
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false), // Whether subscription will cancel at period end
  autoRenew: boolean("auto_renew").default(true), // Whether subscription auto-renews
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true
});
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;

// One-time Dinner Tickets
export const dinnerTickets = pgTable("dinner_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  ticketType: text("ticket_type").notNull(),
  tier: text("tier").notNull().default("standard"), // standard or high_roller
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isPremium: boolean("is_premium").default(false),
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Stripe payment intent ID
  status: text("status").notNull().default("active"), // active, used, expired, canceled
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at"), // When the ticket expires
});

export const insertDinnerTicketSchema = createInsertSchema(dinnerTickets).omit({
  id: true,
  createdAt: true,
  usedAt: true
});
export type InsertDinnerTicket = z.infer<typeof insertDinnerTicketSchema>;
export type DinnerTicket = typeof dinnerTickets.$inferSelect;

// Dinner Check tracking
export const dinnerChecks = pgTable("dinner_checks", {
  id: serial("id").primaryKey(),
  meetupId: integer("meetup_id").notNull().references(() => meetups.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  reportedBy: integer("reported_by").notNull().references(() => users.id), // Restaurant admin who reported it
  hostId: integer("host_id").references(() => users.id), // Restaurant employee host
  totalBillAmount: decimal("total_bill_amount", { precision: 10, scale: 2 }).notNull(),
  participantCount: integer("participant_count").notNull(), // Includes all participants (including host)
  amountPerDiner: decimal("amount_per_diner", { precision: 10, scale: 2 }).notNull(), // Calculated after excluding host
  isHighCheck: boolean("is_high_check").default(false), // Automatically set if per person amount >= $175
  notes: text("notes"),
  reportedAt: timestamp("reported_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"), // When the check was processed and averages updated
});

export const insertDinnerCheckSchema = createInsertSchema(dinnerChecks).omit({
  id: true,
  reportedAt: true,
  isHighCheck: true,
  amountPerDiner: true,
  processedAt: true
}).extend({
  totalBillAmount: z.number().positive(),
  participantCount: z.number().positive().int(),
  hostId: z.number().optional() // Allow optional host assignment
});
export type InsertDinnerCheck = z.infer<typeof insertDinnerCheckSchema>;
export type DinnerCheck = typeof dinnerChecks.$inferSelect;

// User dinner check history tracking
export const userDinnerChecks = pgTable("user_dinner_checks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  dinnerCheckId: integer("dinner_check_id").notNull().references(() => dinnerChecks.id),
  meetupId: integer("meetup_id").notNull().references(() => meetups.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  isHost: boolean("is_host").default(false), // Whether this user was the host (excluded from check amount)
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

export const insertUserDinnerCheckSchema = createInsertSchema(userDinnerChecks).omit({
  id: true,
  processedAt: true
});
export type InsertUserDinnerCheck = z.infer<typeof insertUserDinnerCheckSchema>;
export type UserDinnerCheck = typeof userDinnerChecks.$inferSelect;

// Keeping the original dinnerCheckAverages for backward compatibility
export const dinnerCheckAverages = pgTable("dinner_check_averages", {
  id: serial("id").primaryKey(),
  meetupId: integer("meetup_id").notNull().references(() => meetups.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  reportedBy: integer("reported_by").notNull().references(() => users.id), // Restaurant admin who reported it
  checkAveragePerPerson: decimal("check_average_per_person", { precision: 10, scale: 2 }).notNull(),
  totalBillAmount: decimal("total_bill_amount", { precision: 10, scale: 2 }).notNull(),
  participantCount: integer("participant_count").notNull(),
  isHighCheckAverage: boolean("is_high_check_average").default(false), // Automatically set if >= $175
  notes: text("notes"),
  reportedAt: timestamp("reported_at").defaultNow().notNull(),
  inputDeadline: timestamp("input_deadline"), // Deadline for restaurant to report check data
  inputRequiredBy: timestamp("input_required_by"), // Time by which restaurant must provide input
  inputProvided: boolean("input_provided").default(false), // Whether restaurant provided required input
  isOverdue: boolean("is_overdue").default(false), // Whether input is overdue
  notificationSent: boolean("notification_sent").default(false), // Whether notification was sent to super admin
});

export const insertDinnerCheckAverageSchema = createInsertSchema(dinnerCheckAverages).omit({
  id: true,
  reportedAt: true,
  isHighCheckAverage: true
}).extend({
  checkAveragePerPerson: z.number().positive(),
  totalBillAmount: z.number().positive(),
  participantCount: z.number().positive().int()
});
export type InsertDinnerCheckAverage = z.infer<typeof insertDinnerCheckAverageSchema>;
export type DinnerCheckAverage = typeof dinnerCheckAverages.$inferSelect;

// User Ticket Purchase History
export const userTicketHistory = pgTable("user_ticket_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  ticketId: integer("ticket_id").references(() => dinnerTickets.id),
  subscriptionId: integer("subscription_id").references(() => userSubscriptions.id),
  ticketType: text("ticket_type").notNull(), // "regular", "high_roller", "subscription_tier1", etc.
  purchaseAmount: decimal("purchase_amount", { precision: 10, scale: 2 }).notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

export const insertUserTicketHistorySchema = createInsertSchema(userTicketHistory).omit({
  id: true,
  purchasedAt: true
});
export type InsertUserTicketHistory = z.infer<typeof insertUserTicketHistorySchema>;
export type UserTicketHistory = typeof userTicketHistory.$inferSelect;

// User Languages - languages spoken by users
export const userLanguages = pgTable("user_languages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  language: text("language").notNull(), // "English", "Spanish", "Russian", "French", "Arabic"
  proficiency: text("proficiency").default("fluent"), // "fluent", "conversational", "basic"
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserLanguageSchema = createInsertSchema(userLanguages).omit({
  id: true,
  createdAt: true
});
export type InsertUserLanguage = z.infer<typeof insertUserLanguageSchema>;
export type UserLanguage = typeof userLanguages.$inferSelect;

// Group Meetup Sessions - preset meetup sessions by city/language/time
export const groupMeetupSessions = pgTable("group_meetup_sessions", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  language: text("language").notNull(),
  dayOfWeek: text("day_of_week").notNull(), // "Thursday", "Friday"
  timeSlot: text("time_slot").notNull(), // "7PM", "9PM"
  capacity: integer("capacity").default(6).notNull(),
  minParticipants: integer("min_participants").default(4).notNull(),
  status: text("status").default("open").notNull(), // "open", "confirmed", "canceled"
  reservationStatus: text("reservation_status").default("pending").notNull(), // "pending", "requested", "confirmed"
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  meetupDate: timestamp("meetup_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGroupMeetupSessionSchema = createInsertSchema(groupMeetupSessions).omit({
  id: true,
  createdAt: true
});
export type InsertGroupMeetupSession = z.infer<typeof insertGroupMeetupSessionSchema>;
export type GroupMeetupSession = typeof groupMeetupSessions.$inferSelect;

// Group Meetup Participants - users in group meetup sessions
export const groupMeetupParticipants = pgTable("group_meetup_participants", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => groupMeetupSessions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").default("confirmed").notNull(), // "confirmed", "canceled", "attended"
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertGroupMeetupParticipantSchema = createInsertSchema(groupMeetupParticipants).omit({
  id: true,
  joinedAt: true
});
export type InsertGroupMeetupParticipant = z.infer<typeof insertGroupMeetupParticipantSchema>;
export type GroupMeetupParticipant = typeof groupMeetupParticipants.$inferSelect;

// Restaurant Contact Information - for reservation calls
export const restaurantContacts = pgTable("restaurant_contacts", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  contactType: text("contact_type").notNull(), // "primary", "secondary"
  name: text("name"),
  position: text("position"),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  bestTimeToCall: text("best_time_to_call"),
  notes: text("notes"),
  lastContactDate: timestamp("last_contact_date"),
  successRate: integer("success_rate"), // Percentage of successful contacts
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRestaurantContactSchema = createInsertSchema(restaurantContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastContactDate: true,
  successRate: true
});
export type InsertRestaurantContact = z.infer<typeof insertRestaurantContactSchema>;
export type RestaurantContact = typeof restaurantContacts.$inferSelect;

// AI Voice Call Logs - track all reservation calls made by the system
export const aiVoiceCallLogs = pgTable("ai_voice_call_logs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => groupMeetupSessions.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  contactId: integer("contact_id").notNull().references(() => restaurantContacts.id),
  callStatus: text("call_status").notNull(), // "initiated", "connected", "failed", "completed"
  reservationStatus: text("reservation_status"), // "confirmed", "unavailable", "declined"
  callDuration: integer("call_duration"), // in seconds
  confirmationNumber: text("confirmation_number"),
  callTranscript: text("call_transcript"),
  responseData: jsonb("response_data"), // Any structured data from the call
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  callAttempt: integer("call_attempt").default(1).notNull(),
  errorMessage: text("error_message"),
});

export const insertAiVoiceCallLogSchema = createInsertSchema(aiVoiceCallLogs).omit({
  id: true,
  startTime: true,
  endTime: true
});
export type InsertAiVoiceCallLog = z.infer<typeof insertAiVoiceCallLogSchema>;
export type AiVoiceCallLog = typeof aiVoiceCallLogs.$inferSelect;

// Call Scripts - templates for AI-powered restaurant reservation calls
export const callScripts = pgTable("call_scripts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Descriptive name for the script
  description: text("description"),
  scriptContent: text("script_content").notNull(), // The actual script template with placeholders
  isActive: boolean("is_active").default(true),
  scriptType: text("script_type").notNull(), // "reservation", "confirmation", "cancellation", etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const insertCallScriptSchema = createInsertSchema(callScripts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertCallScript = z.infer<typeof insertCallScriptSchema>;
export type CallScript = typeof callScripts.$inferSelect;

// Call Recordings - audio recordings of conversations
export const callRecordings = pgTable("call_recordings", {
  id: serial("id").primaryKey(),
  callLogId: integer("call_log_id").notNull().references(() => aiVoiceCallLogs.id),
  recordingUrl: text("recording_url"), // URL to the stored recording file
  recordingDuration: integer("recording_duration"), // in seconds
  recordingFormat: text("recording_format").default("mp3"),
  transcriptionStatus: text("transcription_status").default("pending"), // "pending", "completed", "failed"
  transcriptionText: text("transcription_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCallRecordingSchema = createInsertSchema(callRecordings).omit({
  id: true,
  createdAt: true
});
export type InsertCallRecording = z.infer<typeof insertCallRecordingSchema>;
export type CallRecording = typeof callRecordings.$inferSelect;

// User Activity Logs - for tracking user activity on the platform
export const userActivityLogs = pgTable("user_activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  activityType: text("activity_type").notNull(), // login, logout, view_recipe, view_wine, etc.
  description: text("description"),
  metadata: jsonb("metadata"), // Additional contextual data
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserActivityLogSchema = createInsertSchema(userActivityLogs).omit({
  id: true,
  createdAt: true
});
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type UserActivityLog = typeof userActivityLogs.$inferSelect;

// Host Performance Metrics - for tracking host performance
export const hostPerformanceMetrics = pgTable("host_performance_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  meetupId: integer("meetup_id").references(() => meetups.id),
  metricsDate: timestamp("metrics_date").defaultNow().notNull(),
  customerSatisfactionScore: decimal("customer_satisfaction_score", { precision: 5, scale: 2 }),
  tablesTurned: integer("tables_turned"),
  averageSpendPerTable: decimal("average_spend_per_table", { precision: 10, scale: 2 }),
  knowledgeScore: decimal("knowledge_score", { precision: 5, scale: 2 }),
  communicationScore: decimal("communication_score", { precision: 5, scale: 2 }),
  notes: text("notes"),
  addedBy: integer("added_by").notNull().references(() => users.id), // Restaurant admin who added this metric
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertHostPerformanceMetricSchema = createInsertSchema(hostPerformanceMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertHostPerformanceMetric = z.infer<typeof insertHostPerformanceMetricSchema>;
export type HostPerformanceMetric = typeof hostPerformanceMetrics.$inferSelect;

// Restaurant Announcements - for communication between restaurant admin and users
export const restaurantAnnouncements = pgTable("restaurant_announcements", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isUrgent: boolean("is_urgent").default(false),
  isPinned: boolean("is_pinned").default(false),
  expiresAt: timestamp("expires_at"),
  authorId: integer("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRestaurantAnnouncementSchema = createInsertSchema(restaurantAnnouncements).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertRestaurantAnnouncement = z.infer<typeof insertRestaurantAnnouncementSchema>;
export type RestaurantAnnouncement = typeof restaurantAnnouncements.$inferSelect;

// Restaurant Announcement Recipients - tracking who has read announcements
export const announcementRecipients = pgTable("announcement_recipients", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").notNull().references(() => restaurantAnnouncements.id),
  userId: integer("user_id").notNull().references(() => users.id),
  wasRead: boolean("was_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnnouncementRecipientSchema = createInsertSchema(announcementRecipients).omit({
  id: true,
  createdAt: true,
  wasRead: true,
  readAt: true
});
export type InsertAnnouncementRecipient = z.infer<typeof insertAnnouncementRecipientSchema>;
export type AnnouncementRecipient = typeof announcementRecipients.$inferSelect;

// Recipe Database for Analysis and Training
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  name: text("name").notNull(),
  description: text("description"),
  dishType: text("dish_type"), // Appetizer, Main, Dessert, etc.
  cuisine: text("cuisine"), // Italian, French, Asian, etc.
  recipeText: text("recipe_text"), // Full recipe text (extracted from file/image)
  originalFilePath: text("original_file_path"), // Path to the original file
  fileType: text("file_type"), // PDF, TXT, JPG, etc.
  isImage: boolean("is_image").default(false), // Whether the original is an image
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, analyzed, training, trained
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true
});
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

// Recipe Analysis Results
export const recipeAnalyses = pgTable("recipe_analyses", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id),
  ingredients: jsonb("ingredients").$type<Array<{
    name: string;
    description: string;
    allergens?: string[];
    dietaryRestrictions?: string[];
  }>>(),
  techniques: jsonb("techniques").$type<Array<{
    name: string;
    description: string;
  }>>(),
  allergenSummary: jsonb("allergen_summary").$type<Record<string, string[]>>(), // Map of allergen to ingredients
  dietaryRestrictionSummary: jsonb("dietary_restriction_summary").$type<Record<string, string[]>>(), // Map of restriction to ingredients
  aiGenerated: boolean("ai_generated").default(true),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // AI confidence score
  feedbackRating: integer("feedback_rating"), // User rating of analysis quality (1-5)
  feedbackNotes: text("feedback_notes"), // User feedback on analysis
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRecipeAnalysisSchema = createInsertSchema(recipeAnalyses).omit({
  id: true,
  createdAt: true, 
  updatedAt: true
});
export type InsertRecipeAnalysis = z.infer<typeof insertRecipeAnalysisSchema>;
export type RecipeAnalysis = typeof recipeAnalyses.$inferSelect;

// Recipe Training Data - for tracking which recipes are used in training
export const recipeTrainingData = pgTable("recipe_training_data", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id),
  analysisId: integer("analysis_id").notNull().references(() => recipeAnalyses.id),
  trainingSetId: text("training_set_id"), // Identifier for the training set
  includeInTraining: boolean("include_in_training").default(true),
  trainingResult: jsonb("training_result"), // Results from OpenAI training
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRecipeTrainingDataSchema = createInsertSchema(recipeTrainingData).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertRecipeTrainingData = z.infer<typeof insertRecipeTrainingDataSchema>;
export type RecipeTrainingData = typeof recipeTrainingData.$inferSelect;

