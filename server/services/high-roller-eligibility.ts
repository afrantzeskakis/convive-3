import { db } from "../db";
import { users, userSubscriptions, dinnerTickets } from "@shared/schema";
import { and, eq, gte, isNotNull } from "drizzle-orm";

// Constants
const HIGH_SPEND_THRESHOLD = 175; // $175 average spend threshold for high roller status

/**
 * Checks if a user is eligible for high roller dinners based on:
 * 1. Having a high roller ticket
 * 2. Having a high roller subscription
 * 3. Having an average spend per dinner of at least $175
 */
export async function isUserEligibleForHighRollerDinners(userId: number): Promise<{
  eligible: boolean;
  reason: string;
}> {
  try {
    // Get user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      return { eligible: false, reason: "User not found" };
    }
    
    // Check if the user has a valid high roller dinner ticket (not expired)
    let validTickets: any[] = [];
    try {
      validTickets = await db
        .select()
        .from(dinnerTickets)
        .where(
          and(
            eq(dinnerTickets.userId, userId),
            eq(dinnerTickets.tier, "high_roller"),
            eq(dinnerTickets.status, "completed")
          )
        );
    } catch (error) {
      console.error("Error fetching dinner tickets:", error);
      validTickets = [];
    }
    
    // Filter tickets that are not expired
    const unexpiredTickets = validTickets.filter(ticket => {
      // If no expiration date, consider valid
      if (!ticket.expiresAt) return true;
      
      // Check if not expired
      return new Date(ticket.expiresAt) > new Date();
    });
    
    if (unexpiredTickets.length > 0) {
      return { 
        eligible: true, 
        reason: "Has high roller dinner ticket" 
      };
    }
    
    // Check if the user has an active high roller subscription
    let highRollerSubscription;
    try {
      const subscriptions = await db
        .select()
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.status, "active"),
            eq(userSubscriptions.tier, "high_roller")
          )
        );
      highRollerSubscription = subscriptions[0];
    } catch (error) {
      console.error("Error fetching user subscriptions:", error);
      highRollerSubscription = undefined;
    }
    
    if (highRollerSubscription) {
      return { 
        eligible: true, 
        reason: "Has high roller subscription" 
      };
    }
    
    // Check if the user has a high average spend per dinner
    if (user.averageSpendPerDinner) {
      // Convert to number for comparison (could be string, number, or Decimal)
      let avgSpend: number;
      
      if (typeof user.averageSpendPerDinner === 'string') {
        avgSpend = parseFloat(user.averageSpendPerDinner);
      } else {
        // If it's already a number, use it directly
        avgSpend = Number(user.averageSpendPerDinner);
      }
      
      if (avgSpend >= HIGH_SPEND_THRESHOLD) {
        return { 
          eligible: true, 
          reason: `High average spend ($${avgSpend.toFixed(2)} per dinner)` 
        };
      }
    }
    
    // User doesn't meet any eligibility criteria
    return { 
      eligible: false, 
      reason: "Doesn't meet any high roller eligibility criteria" 
    };
  } catch (error) {
    console.error("Error checking high roller eligibility:", error);
    return { eligible: false, reason: "Error checking eligibility" };
  }
}

/**
 * Gets all users eligible for high roller dinners
 */
export async function getHighRollerEligibleUsers(): Promise<{
  id: number;
  username: string;
  fullName: string;
  email: string;
  eligibilityReason: string;
}[]> {
  try {
    // Get all users
    const allUsers = await db.select().from(users);
    
    // Filter eligible users
    const eligibleUsers = [];
    
    for (const user of allUsers) {
      const eligibility = await isUserEligibleForHighRollerDinners(user.id);
      
      if (eligibility.eligible) {
        eligibleUsers.push({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          eligibilityReason: eligibility.reason
        });
      }
    }
    
    return eligibleUsers;
  } catch (error) {
    console.error("Error getting high roller eligible users:", error);
    return [];
  }
}