import { pgTable, serial, text, varchar, integer, boolean, timestamp, uuid, foreignKey, unique, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { restaurants } from "./schema";

/**
 * Global wines table
 * This table stores all wines across all restaurants in a single global database
 */
export const wines = pgTable("wines", {
  id: serial("id").primaryKey(),
  producer: varchar("producer", { length: 255 }),
  wine_name: varchar("wine_name", { length: 255 }).notNull(),
  vintage: varchar("vintage", { length: 10 }),
  varietal: varchar("varietal", { length: 255 }),
  region: varchar("region", { length: 255 }),
  country: varchar("country", { length: 255 }),
  appellation: varchar("appellation", { length: 255 }),
  wine_type: varchar("wine_type", { length: 50 }), // red, white, sparkling, etc.
  wine_style: varchar("wine_style", { length: 100 }), // bold, crisp, etc.
  bottle_size: varchar("bottle_size", { length: 50 }),
  alcohol_content: varchar("alcohol_content", { length: 10 }),
  verified: boolean("verified").default(false),
  verified_source: varchar("verified_source", { length: 100 }),
  tasting_notes: text("tasting_notes"),
  wine_rating: decimal("wine_rating", { precision: 3, scale: 2 }),
  
  // Wine characteristics for recommendation matching (1-5 scale)
  acidity: decimal("acidity", { precision: 3, scale: 2 }), // 1.0-5.0 scale
  tannins: decimal("tannins", { precision: 3, scale: 2 }), // 1.0-5.0 scale
  intensity: decimal("intensity", { precision: 3, scale: 2 }), // 1.0-5.0 scale
  sweetness: decimal("sweetness", { precision: 3, scale: 2 }), // 1.0-5.0 scale
  
  // Additional wine characteristics for recommendations
  body_description: varchar("body_description", { length: 50 }), // light, medium, full
  flavor_notes: text("flavor_notes"), // comma-separated flavor descriptors
  finish_length: varchar("finish_length", { length: 20 }), // short, medium, long
  oak_influence: varchar("oak_influence", { length: 20 }), // none, light, medium, heavy
  
  // Extended wine characteristics for comprehensive profiles
  aroma_notes: text("aroma_notes"), // detailed aromatic characteristics
  what_makes_special: text("what_makes_special"), // what makes this wine special - prestige analysis
  tannin_level: varchar("tannin_level", { length: 30 }), // silky, firm, assertive, etc.
  texture: varchar("texture", { length: 50 }), // creamy, mineral, velvety, etc.
  balance: varchar("balance", { length: 30 }), // well-balanced, fruit-forward, etc.
  food_pairing: text("food_pairing"), // recommended food pairings
  serving_temp: varchar("serving_temp", { length: 30 }), // optimal serving temperature
  aging_potential: varchar("aging_potential", { length: 30 }), // drink now, age 5-10 years, etc.
  blend_description: text("blend_description"), // grape blend percentages and notes
  country_enhanced: varchar("country_enhanced", { length: 100 }), // enhanced country information
  producer_enhanced: varchar("producer_enhanced", { length: 255 }), // enhanced producer information
  
  // Sync tracking fields for monthly research updates
  last_research_sync: timestamp("last_research_sync"),
  research_verified: boolean("research_verified").default(false),
  description_enhanced: text("description_enhanced"), // AI-enhanced description
  region_enhanced: varchar("region_enhanced", { length: 255 }), // Enhanced region info
  
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  // Search fields for better matching - these are generated from the other fields
  search_text: text("search_text"),
  
  // Restaurant attribution for global database integration
  uploaded_by_restaurant_id: integer("uploaded_by_restaurant_id").references(() => restaurants.id),
  restaurant_source_count: integer("restaurant_source_count").default(0),
});

/**
 * Restaurant-specific wine table for isolated wine management
 * This table stores wines uploaded by restaurants with complete enrichment data
 */
export const restaurantWinesIsolated = pgTable("restaurant_wines_isolated", {
  id: serial("id").primaryKey(),
  restaurant_id: integer("restaurant_id").notNull().references(() => restaurants.id),
  
  // Basic wine information
  wine_name: varchar("wine_name", { length: 255 }).notNull(),
  producer: varchar("producer", { length: 255 }),
  vintage: varchar("vintage", { length: 10 }),
  region: varchar("region", { length: 255 }),
  country: varchar("country", { length: 255 }),
  varietals: varchar("varietals", { length: 255 }),
  wine_type: varchar("wine_type", { length: 50 }),
  
  // Enrichment status fields
  verified: boolean("verified").default(false),
  verified_source: varchar("verified_source", { length: 100 }),
  enrichment_status: varchar("enrichment_status", { length: 50 }).default("pending"), // pending, processing, completed, failed
  enrichment_started_at: timestamp("enrichment_started_at"),
  enrichment_completed_at: timestamp("enrichment_completed_at"),
  
  // Complete 5-stage enhancement fields
  wine_rating: decimal("wine_rating", { precision: 3, scale: 2 }),
  general_guest_experience: text("general_guest_experience"),
  flavor_notes: text("flavor_notes"),
  aroma_notes: text("aroma_notes"),
  what_makes_special: text("what_makes_special"),
  body_description: text("body_description"),
  food_pairing: text("food_pairing"),
  serving_temp: varchar("serving_temp", { length: 100 }),
  aging_potential: text("aging_potential"),
  
  // Restaurant-specific fields
  menu_price: decimal("menu_price", { precision: 10, scale: 2 }),
  cost_price: decimal("cost_price", { precision: 10, scale: 2 }),
  inventory_count: integer("inventory_count").default(0),
  wine_list_category: varchar("wine_list_category", { length: 100 }),
  
  // Metadata
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  
  // Unique constraint to prevent duplicate wines per restaurant
}, (table) => {
  return {
    restaurant_wine_unique: unique().on(table.restaurant_id, table.wine_name, table.producer, table.vintage),
  };
});

/**
 * Wine restaurant mappings for global database integration
 * Tracks which restaurant uploaded which wines to the global database
 */
export const wineRestaurantMappings = pgTable("wine_restaurant_mappings", {
  id: serial("id").primaryKey(),
  global_wine_id: integer("global_wine_id").notNull().references(() => wines.id),
  restaurant_wine_id: integer("restaurant_wine_id").notNull().references(() => restaurantWinesIsolated.id),
  restaurant_id: integer("restaurant_id").notNull().references(() => restaurants.id),
  uploaded_at: timestamp("uploaded_at").defaultNow(),
  sync_status: varchar("sync_status", { length: 50 }).default("pending"), // pending, synced, failed
});

/**
 * Restaurant wine associations
 * This table links wines from the global database to specific restaurants
 */
export const restaurantWines = pgTable("restaurant_wines", {
  id: serial("id").primaryKey(),
  restaurant_id: integer("restaurant_id").notNull().references(() => restaurants.id),
  global_wine_id: integer("global_wine_id").notNull().references(() => wines.id),
  price: varchar("price", { length: 50 }),
  by_the_glass: boolean("by_the_glass").default(false),
  custom_description: text("custom_description"),
  featured: boolean("featured").default(false),
  active: boolean("active").default(true),
  inventory_count: integer("inventory_count").default(0),
  added_by: integer("added_by"), // User who added this wine
  added_at: timestamp("added_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  // Make restaurant_id and global_wine_id combination unique
}, (table) => {
  return {
    restaurant_wine_unique: unique().on(table.restaurant_id, table.global_wine_id),
  };
});

/**
 * Wine list upload history
 * Tracks wine list uploads for audit purposes
 */
export const wineListUploads = pgTable("wine_list_uploads", {
  id: serial("id").primaryKey(),
  restaurant_id: integer("restaurant_id").notNull().references(() => restaurants.id),
  uploaded_by: integer("uploaded_by").notNull(), // User ID
  original_filename: text("original_filename"),
  file_size: integer("file_size"),
  upload_status: varchar("upload_status", { length: 50 }).default("processing"), // processing, completed, failed
  total_wines_in_file: integer("total_wines_in_file").default(0),
  wines_matched: integer("wines_matched").default(0),
  wines_unmatched: integer("wines_unmatched").default(0),
  wines_added: integer("wines_added").default(0),
  upload_log: text("upload_log"), // Detailed matching results as JSON string
  processing_time: integer("processing_time"), // in seconds
  created_at: timestamp("created_at").defaultNow(),
  completed_at: timestamp("completed_at"),
  error_message: text("error_message"),
});

// Define relations between tables
export const winesRelations = relations(wines, ({ many }) => ({
  restaurantWines: many(restaurantWines),
}));

export const restaurantWinesRelations = relations(restaurantWines, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantWines.restaurant_id],
    references: [restaurants.id],
  }),
  wine: one(wines, {
    fields: [restaurantWines.global_wine_id],
    references: [wines.id],
  }),
}));

export const wineListUploadsRelations = relations(wineListUploads, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [wineListUploads.restaurant_id],
    references: [restaurants.id],
  }),
}));

export const restaurantWinesIsolatedRelations = relations(restaurantWinesIsolated, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantWinesIsolated.restaurant_id],
    references: [restaurants.id],
  }),
  mappings: many(wineRestaurantMappings),
}));

export const wineRestaurantMappingsRelations = relations(wineRestaurantMappings, ({ one }) => ({
  globalWine: one(wines, {
    fields: [wineRestaurantMappings.global_wine_id],
    references: [wines.id],
  }),
  restaurantWine: one(restaurantWinesIsolated, {
    fields: [wineRestaurantMappings.restaurant_wine_id],
    references: [restaurantWinesIsolated.id],
  }),
  restaurant: one(restaurants, {
    fields: [wineRestaurantMappings.restaurant_id],
    references: [restaurants.id],
  }),
}));

// Create Zod schemas for insert operations
export const insertWineSchema = createInsertSchema(wines)
  .omit({ 
    id: true, 
    created_at: true, 
    updated_at: true, 
    search_text: true,
    acidity: true,
    tannins: true,
    intensity: true,
    sweetness: true
  });

export const insertRestaurantWineSchema = createInsertSchema(restaurantWines)
  .omit({ id: true, added_at: true, updated_at: true });

export const insertWineListUploadSchema = createInsertSchema(wineListUploads)
  .omit({ 
    id: true, 
    created_at: true, 
    completed_at: true,
    wines_matched: true,
    wines_unmatched: true, 
    wines_added: true,
    processing_time: true,
    upload_log: true 
  });

export const insertRestaurantWineIsolatedSchema = createInsertSchema(restaurantWinesIsolated)
  .omit({ 
    id: true, 
    created_at: true, 
    updated_at: true,
    enrichment_started_at: true,
    enrichment_completed_at: true
  });

export const insertWineRestaurantMappingSchema = createInsertSchema(wineRestaurantMappings)
  .omit({ 
    id: true, 
    uploaded_at: true 
  });

// Define TypeScript types for the schemas
export type Wine = typeof wines.$inferSelect;
export type InsertWine = z.infer<typeof insertWineSchema>;

export type RestaurantWine = typeof restaurantWines.$inferSelect;
export type InsertRestaurantWine = z.infer<typeof insertRestaurantWineSchema>;

export type WineListUpload = typeof wineListUploads.$inferSelect;
export type InsertWineListUpload = z.infer<typeof insertWineListUploadSchema>;

export type RestaurantWineIsolated = typeof restaurantWinesIsolated.$inferSelect;
export type InsertRestaurantWineIsolated = z.infer<typeof insertRestaurantWineIsolatedSchema>;

export type WineRestaurantMapping = typeof wineRestaurantMappings.$inferSelect;
export type InsertWineRestaurantMapping = z.infer<typeof insertWineRestaurantMappingSchema>;