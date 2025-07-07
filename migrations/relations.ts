import { relations } from "drizzle-orm/relations";
import { users, userPreferences, meetups, meetupParticipants, matchScores, restaurants, messages, dinnerCheckAverages, userTicketHistory, dinnerTickets, userSubscriptions, subscriptionPlans, callScripts } from "./schema";
// Import recipe tables from shared schema
import { recipes, recipeAnalyses, recipeTrainingData } from "../shared/schema";
// Import recipe relations
import { recipesRelations, recipeAnalysesRelations, recipeTrainingDataRelations } from "./recipe-training-relations";

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
        user: one(users, {
                fields: [userPreferences.userId],
                references: [users.id]
        }),
}));

export const usersRelations = relations(users, ({many}) => ({
        userPreferences: many(userPreferences),
        meetupParticipants: many(meetupParticipants),
        matchScores_user1Id: many(matchScores, {
                relationName: "matchScores_user1Id_users_id"
        }),
        matchScores_user2Id: many(matchScores, {
                relationName: "matchScores_user2Id_users_id"
        }),
        meetups: many(meetups),
        restaurants: many(restaurants),
        messages: many(messages),
        dinnerCheckAverages: many(dinnerCheckAverages),
        userTicketHistories: many(userTicketHistory),
        userSubscriptions: many(userSubscriptions),
        dinnerTickets: many(dinnerTickets),
        callScripts_createdBy: many(callScripts, {
                relationName: "callScripts_createdBy_users_id"
        }),
        callScripts_lastModifiedBy: many(callScripts, {
                relationName: "callScripts_lastModifiedBy_users_id"
        }),
}));

export const meetupParticipantsRelations = relations(meetupParticipants, ({one}) => ({
        meetup: one(meetups, {
                fields: [meetupParticipants.meetupId],
                references: [meetups.id]
        }),
        user: one(users, {
                fields: [meetupParticipants.userId],
                references: [users.id]
        }),
}));

export const meetupsRelations = relations(meetups, ({one, many}) => ({
        meetupParticipants: many(meetupParticipants),
        restaurant: one(restaurants, {
                fields: [meetups.restaurantId],
                references: [restaurants.id]
        }),
        user: one(users, {
                fields: [meetups.createdBy],
                references: [users.id]
        }),
        messages: many(messages),
        dinnerCheckAverages: many(dinnerCheckAverages),
}));

export const matchScoresRelations = relations(matchScores, ({one}) => ({
        user_user1Id: one(users, {
                fields: [matchScores.user1Id],
                references: [users.id],
                relationName: "matchScores_user1Id_users_id"
        }),
        user_user2Id: one(users, {
                fields: [matchScores.user2Id],
                references: [users.id],
                relationName: "matchScores_user2Id_users_id"
        }),
}));

export const restaurantsRelations = relations(restaurants, ({one, many}) => ({
        meetups: many(meetups),
        user: one(users, {
                fields: [restaurants.managerId],
                references: [users.id]
        }),
        dinnerCheckAverages: many(dinnerCheckAverages),
}));

export const messagesRelations = relations(messages, ({one}) => ({
        meetup: one(meetups, {
                fields: [messages.meetupId],
                references: [meetups.id]
        }),
        user: one(users, {
                fields: [messages.senderId],
                references: [users.id]
        }),
}));

export const dinnerCheckAveragesRelations = relations(dinnerCheckAverages, ({one}) => ({
        restaurant: one(restaurants, {
                fields: [dinnerCheckAverages.restaurantId],
                references: [restaurants.id]
        }),
        meetup: one(meetups, {
                fields: [dinnerCheckAverages.meetupId],
                references: [meetups.id]
        }),
        user: one(users, {
                fields: [dinnerCheckAverages.reportedBy],
                references: [users.id]
        }),
}));

export const userTicketHistoryRelations = relations(userTicketHistory, ({one}) => ({
        user: one(users, {
                fields: [userTicketHistory.userId],
                references: [users.id]
        }),
        dinnerTicket: one(dinnerTickets, {
                fields: [userTicketHistory.ticketId],
                references: [dinnerTickets.id]
        }),
        userSubscription: one(userSubscriptions, {
                fields: [userTicketHistory.subscriptionId],
                references: [userSubscriptions.id]
        }),
}));

export const dinnerTicketsRelations = relations(dinnerTickets, ({one, many}) => ({
        userTicketHistories: many(userTicketHistory),
        user: one(users, {
                fields: [dinnerTickets.userId],
                references: [users.id]
        }),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({one, many}) => ({
        userTicketHistories: many(userTicketHistory),
        user: one(users, {
                fields: [userSubscriptions.userId],
                references: [users.id]
        }),
        subscriptionPlan: one(subscriptionPlans, {
                fields: [userSubscriptions.planId],
                references: [subscriptionPlans.id]
        }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({many}) => ({
        userSubscriptions: many(userSubscriptions),
}));

export const callScriptsRelations = relations(callScripts, ({one}) => ({
        user_createdBy: one(users, {
                fields: [callScripts.createdBy],
                references: [users.id],
                relationName: "callScripts_createdBy_users_id"
        }),
        user_lastModifiedBy: one(users, {
                fields: [callScripts.lastModifiedBy],
                references: [users.id],
                relationName: "callScripts_lastModifiedBy_users_id"
        }),
}));