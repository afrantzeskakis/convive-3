import { relations } from "drizzle-orm";
import { restaurants, users } from "./schema";
import { recipes, recipeAnalyses, recipeTrainingData } from "../shared/schema";

// Recipe relations
export const recipesRelations = relations(recipes, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [recipes.restaurantId],
    references: [restaurants.id],
  }),
  creator: one(users, {
    fields: [recipes.createdBy],
    references: [users.id],
  }),
  analyses: many(recipeAnalyses),
  trainingData: many(recipeTrainingData),
}));

// Recipe Analysis relations
export const recipeAnalysesRelations = relations(recipeAnalyses, ({ one, many }) => ({
  recipe: one(recipes, {
    fields: [recipeAnalyses.recipeId],
    references: [recipes.id],
  }),
  trainingData: many(recipeTrainingData),
}));

// Recipe Training Data relations
export const recipeTrainingDataRelations = relations(recipeTrainingData, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeTrainingData.recipeId],
    references: [recipes.id],
  }),
  analysis: one(recipeAnalyses, {
    fields: [recipeTrainingData.analysisId],
    references: [recipeAnalyses.id],
  }),
}));