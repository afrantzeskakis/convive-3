import { pgTable, foreignKey, serial, integer, jsonb, timestamp, text, boolean, unique, numeric, index, varchar, json } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const userPreferences = pgTable("user_preferences", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	diningPreferences: jsonb("dining_preferences").notNull(),
	socialPreferences: jsonb("social_preferences").notNull(),
	dietaryRestrictions: jsonb("dietary_restrictions"),
	atmospherePreferences: jsonb("atmosphere_preferences").notNull(),
	interests: jsonb().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_preferences_user_id_users_id_fk"
		}),
]);

export const meetupParticipants = pgTable("meetup_participants", {
	id: serial().primaryKey().notNull(),
	meetupId: integer("meetup_id").notNull(),
	userId: integer("user_id").notNull(),
	status: text().default('pending').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.meetupId],
			foreignColumns: [meetups.id],
			name: "meetup_participants_meetup_id_meetups_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "meetup_participants_user_id_users_id_fk"
		}),
]);

export const matchScores = pgTable("match_scores", {
	id: serial().primaryKey().notNull(),
	user1Id: integer("user1_id").notNull(),
	user2Id: integer("user2_id").notNull(),
	compatibilityScore: integer("compatibility_score").notNull(),
	calculatedAt: timestamp("calculated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.user1Id],
			foreignColumns: [users.id],
			name: "match_scores_user1_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.user2Id],
			foreignColumns: [users.id],
			name: "match_scores_user2_id_users_id_fk"
		}),
]);

export const meetups = pgTable("meetups", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	restaurantId: integer("restaurant_id").notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	startTime: text("start_time").notNull(),
	endTime: text("end_time").notNull(),
	maxParticipants: integer("max_participants").notNull(),
	status: text().default('pending').notNull(),
	createdBy: integer("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurants.id],
			name: "meetups_restaurant_id_restaurants_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "meetups_created_by_users_id_fk"
		}),
]);

export const restaurants = pgTable("restaurants", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	cuisineType: text("cuisine_type").notNull(),
	address: text().notNull(),
	distance: text(),
	imageUrl: text("image_url"),
	rating: text(),
	ambiance: text(),
	noiseLevel: text("noise_level"),
	priceRange: text("price_range"),
	features: jsonb(),
	menuUrl: text("menu_url"),
	isFeatured: boolean("is_featured").default(false),
	managerId: integer("manager_id"),
	awards: jsonb(),
}, (table) => [
	foreignKey({
			columns: [table.managerId],
			foreignColumns: [users.id],
			name: "restaurants_manager_id_fkey"
		}),
]);

export const messages = pgTable("messages", {
	id: serial().primaryKey().notNull(),
	meetupId: integer("meetup_id").notNull(),
	senderId: integer("sender_id").notNull(),
	content: text().notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.meetupId],
			foreignColumns: [meetups.id],
			name: "messages_meetup_id_meetups_id_fk"
		}),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	fullName: text("full_name").notNull(),
	email: text().notNull(),
	age: integer(),
	occupation: text(),
	bio: text(),
	profilePicture: text("profile_picture"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	city: text(),
	gender: text(),
	lookingFor: text("looking_for"),
	onboardingComplete: boolean("onboarding_complete").default(false),
	role: text().default('user').notNull(),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	isPremiumUser: boolean("is_premium_user").default(false),
	averageSpendPerDinner: numeric("average_spend_per_dinner", { precision: 10, scale:  2 }).default('NULL'),
	lifetimeDiningValue: numeric("lifetime_dining_value", { precision: 10, scale:  2 }).default('NULL'),
	dinnerCount: integer("dinner_count").default(0),
	highCheckDinnerCount: integer("high_check_dinner_count").default(0),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const session = pgTable("session", {
	sid: varchar().primaryKey().notNull(),
	sess: json().notNull(),
	expire: timestamp({ precision: 6, mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const dinnerCheckAverages = pgTable("dinner_check_averages", {
	id: serial().primaryKey().notNull(),
	restaurantId: integer("restaurant_id").notNull(),
	meetupId: integer("meetup_id").notNull(),
	reportedBy: integer("reported_by").notNull(),
	checkAveragePerPerson: numeric("check_average_per_person", { precision: 10, scale:  2 }).notNull(),
	totalBillAmount: numeric("total_bill_amount", { precision: 10, scale:  2 }).notNull(),
	participantCount: integer("participant_count").notNull(),
	isHighCheckAverage: boolean("is_high_check_average").default(false),
	notes: text(),
	reportedAt: timestamp("reported_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurants.id],
			name: "dinner_check_averages_restaurant_id_fkey"
		}),
	foreignKey({
			columns: [table.meetupId],
			foreignColumns: [meetups.id],
			name: "dinner_check_averages_meetup_id_fkey"
		}),
	foreignKey({
			columns: [table.reportedBy],
			foreignColumns: [users.id],
			name: "dinner_check_averages_reported_by_fkey"
		}),
]);

export const subscriptionPlans = pgTable("subscription_plans", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	dinnersPerMonth: integer("dinners_per_month").notNull(),
	stripePriceId: varchar("stripe_price_id", { length: 100 }),
	isPremium: boolean("is_premium").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	tier: text().default('standard').notNull(),
});

export const userTicketHistory = pgTable("user_ticket_history", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	ticketId: integer("ticket_id"),
	subscriptionId: integer("subscription_id"),
	ticketType: varchar("ticket_type", { length: 50 }).notNull(),
	purchaseAmount: numeric("purchase_amount", { precision: 10, scale:  2 }).notNull(),
	purchasedAt: timestamp("purchased_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_ticket_history_user_id_fkey"
		}),
	foreignKey({
			columns: [table.ticketId],
			foreignColumns: [dinnerTickets.id],
			name: "user_ticket_history_ticket_id_fkey"
		}),
	foreignKey({
			columns: [table.subscriptionId],
			foreignColumns: [userSubscriptions.id],
			name: "user_ticket_history_subscription_id_fkey"
		}),
]);

export const userSubscriptions = pgTable("user_subscriptions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	planId: integer("plan_id").notNull(),
	status: varchar({ length: 50 }).default('active').notNull(),
	stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }).defaultNow(),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	tier: text().default('standard').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_subscriptions_user_id_fkey"
		}),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [subscriptionPlans.id],
			name: "user_subscriptions_plan_id_fkey"
		}),
]);

export const dinnerTickets = pgTable("dinner_tickets", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	ticketType: varchar("ticket_type", { length: 50 }).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	isPremium: boolean("is_premium").default(false),
	stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 100 }),
	status: varchar({ length: 50 }).default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	usedAt: timestamp("used_at", { withTimezone: true, mode: 'string' }),
	tier: text().default('standard').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "dinner_tickets_user_id_fkey"
		}),
]);

export const callScripts = pgTable("call_scripts", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	scriptContent: text("script_content").notNull(),
	isActive: boolean("is_active").default(true),
	scriptType: text("script_type").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: integer("created_by"),
	lastModifiedBy: integer("last_modified_by"),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "call_scripts_created_by_fkey"
		}),
	foreignKey({
			columns: [table.lastModifiedBy],
			foreignColumns: [users.id],
			name: "call_scripts_last_modified_by_fkey"
		}),
]);
