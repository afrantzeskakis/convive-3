-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"dining_preferences" jsonb NOT NULL,
	"social_preferences" jsonb NOT NULL,
	"dietary_restrictions" jsonb,
	"atmosphere_preferences" jsonb NOT NULL,
	"interests" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetup_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"meetup_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user1_id" integer NOT NULL,
	"user2_id" integer NOT NULL,
	"compatibility_score" integer NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetups" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"restaurant_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"max_participants" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"cuisine_type" text NOT NULL,
	"address" text NOT NULL,
	"distance" text,
	"image_url" text,
	"rating" text,
	"ambiance" text,
	"noise_level" text,
	"price_range" text,
	"features" jsonb,
	"menu_url" text,
	"is_featured" boolean DEFAULT false,
	"manager_id" integer,
	"awards" jsonb
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"meetup_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"content" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"age" integer,
	"occupation" text,
	"bio" text,
	"profile_picture" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"city" text,
	"gender" text,
	"looking_for" text,
	"onboarding_complete" boolean DEFAULT false,
	"role" text DEFAULT 'user' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"is_premium_user" boolean DEFAULT false,
	"average_spend_per_dinner" numeric(10, 2) DEFAULT 'NULL',
	"lifetime_dining_value" numeric(10, 2) DEFAULT 'NULL',
	"dinner_count" integer DEFAULT 0,
	"high_check_dinner_count" integer DEFAULT 0,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp(6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dinner_check_averages" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"meetup_id" integer NOT NULL,
	"reported_by" integer NOT NULL,
	"check_average_per_person" numeric(10, 2) NOT NULL,
	"total_bill_amount" numeric(10, 2) NOT NULL,
	"participant_count" integer NOT NULL,
	"is_high_check_average" boolean DEFAULT false,
	"notes" text,
	"reported_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"dinners_per_month" integer NOT NULL,
	"stripe_price_id" varchar(100),
	"is_premium" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"tier" text DEFAULT 'standard' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_ticket_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ticket_id" integer,
	"subscription_id" integer,
	"ticket_type" varchar(50) NOT NULL,
	"purchase_amount" numeric(10, 2) NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"stripe_subscription_id" varchar(100),
	"start_date" timestamp with time zone DEFAULT now(),
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"tier" text DEFAULT 'standard' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dinner_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ticket_type" varchar(50) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"is_premium" boolean DEFAULT false,
	"stripe_payment_intent_id" varchar(100),
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"used_at" timestamp with time zone,
	"tier" text DEFAULT 'standard' NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "call_scripts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"script_content" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"script_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"last_modified_by" integer
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetup_participants" ADD CONSTRAINT "meetup_participants_meetup_id_meetups_id_fk" FOREIGN KEY ("meetup_id") REFERENCES "public"."meetups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetup_participants" ADD CONSTRAINT "meetup_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_user1_id_users_id_fk" FOREIGN KEY ("user1_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_user2_id_users_id_fk" FOREIGN KEY ("user2_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetups" ADD CONSTRAINT "meetups_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetups" ADD CONSTRAINT "meetups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_meetup_id_meetups_id_fk" FOREIGN KEY ("meetup_id") REFERENCES "public"."meetups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dinner_check_averages" ADD CONSTRAINT "dinner_check_averages_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dinner_check_averages" ADD CONSTRAINT "dinner_check_averages_meetup_id_fkey" FOREIGN KEY ("meetup_id") REFERENCES "public"."meetups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dinner_check_averages" ADD CONSTRAINT "dinner_check_averages_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ticket_history" ADD CONSTRAINT "user_ticket_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ticket_history" ADD CONSTRAINT "user_ticket_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."dinner_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ticket_history" ADD CONSTRAINT "user_ticket_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dinner_tickets" ADD CONSTRAINT "dinner_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_scripts" ADD CONSTRAINT "call_scripts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_scripts" ADD CONSTRAINT "call_scripts_last_modified_by_fkey" FOREIGN KEY ("last_modified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "session" USING btree ("expire" timestamp_ops);
*/