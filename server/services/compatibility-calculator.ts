import { DatabaseStorage } from "../database-storage";
import { User, UserPreferences, meetups, meetupParticipants } from "../../shared/schema";
import { eq, and, gte, sql, desc, isNotNull, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db";

const meetupParticipants2 = alias(meetupParticipants, "mp2");

const storage = new DatabaseStorage();

const RECENCY_PENALTY_DAYS = 30;
const RECENCY_PENALTY_AMOUNT = 25;

interface SocialStyle {
  preferredGroupSize?: string;
  comfortWithStrangers?: number;
  conversationStyle?: string;
  socialEnergy?: string;
  conflictResolution?: string;
  socialBoundaries?: number;
  timeWithFriends?: string;
}

interface LeisurePreferences {
  activities?: string[];
  weekendPreference?: string;
  travelFrequency?: string;
}

interface UserPreferencesData {
  socialStyle: SocialStyle;
  leisurePreferences: LeisurePreferences;
  rawSocialPrefs: any;
  rawInterests: any;
}

interface CompatibilityBreakdown {
  socialScore: number;
  lifestyleScore: number;
  interestScore: number;
  practicalScore: number;
  recencyPenalty: number;
  totalScore: number;
  bonuses: string[];
  penalties: string[];
  isComplete: boolean;
  recentDiningDate?: Date;
}

export class CompatibilityCalculator {
  private static readonly WEIGHTS = {
    social: 0.35,
    lifestyle: 0.25,
    interests: 0.30,
    practical: 0.10,
  };

  private static readonly SOCIAL_ENERGY_COMPATIBILITY: Record<string, Record<string, number>> = {
    "introvert": { "introvert": 100, "ambivert": 70, "extrovert": 40 },
    "ambivert": { "introvert": 70, "ambivert": 100, "extrovert": 70 },
    "extrovert": { "introvert": 40, "ambivert": 70, "extrovert": 100 },
  };

  private static readonly CONVERSATION_STYLE_COMPATIBILITY: Record<string, Record<string, number>> = {
    "listener": { "listener": 60, "balanced": 80, "talker": 100 },
    "balanced": { "listener": 80, "balanced": 90, "talker": 80 },
    "talker": { "listener": 100, "balanced": 80, "talker": 50 },
  };

  private static readonly WEEKEND_PREFERENCE_COMPATIBILITY: Record<string, Record<string, number>> = {
    "active": { "active": 100, "balanced": 75, "relaxed": 45 },
    "balanced": { "active": 75, "balanced": 100, "relaxed": 75 },
    "relaxed": { "active": 45, "balanced": 75, "relaxed": 100 },
  };

  private static readonly TIME_WITH_FRIENDS_COMPATIBILITY: Record<string, Record<string, number>> = {
    "daily": { "daily": 100, "weekly": 70, "monthly": 45, "occasionally": 30 },
    "weekly": { "daily": 70, "weekly": 100, "monthly": 75, "occasionally": 50 },
    "monthly": { "daily": 45, "weekly": 75, "monthly": 100, "occasionally": 80 },
    "occasionally": { "daily": 30, "weekly": 50, "monthly": 80, "occasionally": 100 },
  };

  private static readonly TRAVEL_FREQUENCY_COMPATIBILITY: Record<string, Record<string, number>> = {
    "rarely": { "rarely": 100, "occasionally": 75, "regularly": 50, "whenever possible": 35 },
    "occasionally": { "rarely": 75, "occasionally": 100, "regularly": 80, "whenever possible": 60 },
    "regularly": { "rarely": 50, "occasionally": 80, "regularly": 100, "whenever possible": 85 },
    "whenever possible": { "rarely": 35, "occasionally": 60, "regularly": 85, "whenever possible": 100 },
  };

  public async calculateDetailedCompatibility(
    user1Id: number,
    user2Id: number
  ): Promise<CompatibilityBreakdown> {
    const [prefs1, prefs2, recentDining] = await Promise.all([
      this.getUserPreferences(user1Id),
      this.getUserPreferences(user2Id),
      this.getRecentDiningHistory(user1Id, user2Id),
    ]);

    const bonuses: string[] = [];
    const penalties: string[] = [];

    if (!prefs1 || !prefs2) {
      return {
        socialScore: 50,
        lifestyleScore: 50,
        interestScore: 50,
        practicalScore: 50,
        recencyPenalty: 0,
        totalScore: 50,
        bonuses: [],
        penalties: ["Missing questionnaire data for one or both users"],
        isComplete: false,
      };
    }

    const socialScore = this.calculateSocialCompatibility(prefs1, prefs2, bonuses, penalties);
    const lifestyleScore = this.calculateLifestyleCompatibility(prefs1, prefs2, bonuses, penalties);
    const interestScore = this.calculateInterestCompatibility(prefs1, prefs2, bonuses);
    const practicalScore = this.calculatePracticalCompatibility(prefs1, prefs2, bonuses);

    const baseScore = Math.min(100, Math.round(
      socialScore * CompatibilityCalculator.WEIGHTS.social +
      lifestyleScore * CompatibilityCalculator.WEIGHTS.lifestyle +
      interestScore * CompatibilityCalculator.WEIGHTS.interests +
      practicalScore * CompatibilityCalculator.WEIGHTS.practical
    ));

    let recencyPenalty = 0;
    if (recentDining) {
      const daysSinceLastDining = Math.floor(
        (Date.now() - recentDining.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastDining < RECENCY_PENALTY_DAYS) {
        const penaltyFactor = 1 - (daysSinceLastDining / RECENCY_PENALTY_DAYS);
        recencyPenalty = Math.round(RECENCY_PENALTY_AMOUNT * penaltyFactor);
        penalties.push(`Recently dined together (${daysSinceLastDining} days ago)`);
      }
    }

    const totalScore = Math.max(0, baseScore - recencyPenalty);

    return {
      socialScore: Math.round(socialScore),
      lifestyleScore: Math.round(lifestyleScore),
      interestScore: Math.round(interestScore),
      practicalScore: Math.round(practicalScore),
      recencyPenalty,
      totalScore,
      bonuses,
      penalties,
      isComplete: true,
      recentDiningDate: recentDining || undefined,
    };
  }

  public async calculateCompatibilityScore(user1Id: number, user2Id: number): Promise<number> {
    const breakdown = await this.calculateDetailedCompatibility(user1Id, user2Id);
    return breakdown.totalScore;
  }

  private async getUserPreferences(userId: number): Promise<UserPreferencesData | null> {
    try {
      const prefs = await storage.getUserPreferences(userId);
      if (!prefs) return null;
      
      const socialPrefs = prefs.socialPreferences as any || {};
      const interests = prefs.interests as any || {};
      
      return {
        socialStyle: {
          preferredGroupSize: this.normalizeString(socialPrefs.preferredGroupSize),
          comfortWithStrangers: socialPrefs.comfortWithStrangers,
          conversationStyle: this.normalizeString(socialPrefs.conversationStyle),
          socialEnergy: this.normalizeString(socialPrefs.socialEnergy),
          conflictResolution: this.normalizeString(socialPrefs.conflictResolution),
          socialBoundaries: socialPrefs.socialBoundaries,
          timeWithFriends: this.normalizeString(socialPrefs.timeWithFriends),
        },
        leisurePreferences: {
          activities: interests.activities || [],
          weekendPreference: this.normalizeString(interests.weekendPreference),
          travelFrequency: this.normalizeString(interests.travelFrequency),
        },
        rawSocialPrefs: socialPrefs,
        rawInterests: interests,
      };
    } catch (error) {
      console.error(`Failed to get preferences for user ${userId}:`, error);
      return null;
    }
  }

  private normalizeString(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    return value.toLowerCase().trim();
  }

  private calculateSocialCompatibility(
    prefs1: UserPreferencesData,
    prefs2: UserPreferencesData,
    bonuses: string[],
    penalties: string[]
  ): number {
    let totalScore = 0;
    let factorCount = 0;
    const social1 = prefs1.socialStyle;
    const social2 = prefs2.socialStyle;

    // Social Energy compatibility (introvert/ambivert/extrovert)
    if (social1.socialEnergy && social2.socialEnergy) {
      factorCount++;
      const score = CompatibilityCalculator.SOCIAL_ENERGY_COMPATIBILITY[social1.socialEnergy]?.[social2.socialEnergy] ?? 50;
      totalScore += score;
      
      if (score >= 100) {
        bonuses.push(`Both ${social1.socialEnergy}s - great energy match`);
      } else if (score <= 45) {
        penalties.push("Different social energy levels");
      }
    }

    // Conversation style compatibility (listener/balanced/talker)
    if (social1.conversationStyle && social2.conversationStyle) {
      factorCount++;
      const score = CompatibilityCalculator.CONVERSATION_STYLE_COMPATIBILITY[social1.conversationStyle]?.[social2.conversationStyle] ?? 50;
      totalScore += score;
      
      if (score >= 100) {
        bonuses.push("Perfect conversation dynamic");
      } else if (score >= 80) {
        bonuses.push("Good conversation balance");
      }
    }

    // Comfort with strangers (1-5 scale)
    if (social1.comfortWithStrangers !== undefined && social2.comfortWithStrangers !== undefined) {
      factorCount++;
      const diff = Math.abs(social1.comfortWithStrangers - social2.comfortWithStrangers);
      const score = diff === 0 ? 100 : diff === 1 ? 85 : diff === 2 ? 65 : diff === 3 ? 45 : 30;
      totalScore += score;
      
      if (diff === 0 && social1.comfortWithStrangers >= 4) {
        bonuses.push("Both comfortable meeting new people");
      }
    }

    // Preferred group size (small/medium/large)
    if (social1.preferredGroupSize && social2.preferredGroupSize) {
      factorCount++;
      if (social1.preferredGroupSize === social2.preferredGroupSize) {
        totalScore += 100;
        bonuses.push(`Both prefer ${social1.preferredGroupSize} groups`);
      } else {
        const sizes = ["small", "medium", "large"];
        const idx1 = sizes.indexOf(social1.preferredGroupSize);
        const idx2 = sizes.indexOf(social2.preferredGroupSize);
        if (idx1 !== -1 && idx2 !== -1) {
          const diff = Math.abs(idx1 - idx2);
          totalScore += diff === 1 ? 70 : 40;
        } else {
          totalScore += 50;
        }
      }
    }

    // Social boundaries (1-5 scale)
    if (social1.socialBoundaries !== undefined && social2.socialBoundaries !== undefined) {
      factorCount++;
      const diff = Math.abs(social1.socialBoundaries - social2.socialBoundaries);
      totalScore += diff === 0 ? 100 : diff === 1 ? 80 : diff === 2 ? 60 : 40;
    }

    return factorCount > 0 ? totalScore / factorCount : 50;
  }

  private calculateLifestyleCompatibility(
    prefs1: UserPreferencesData,
    prefs2: UserPreferencesData,
    bonuses: string[],
    penalties: string[]
  ): number {
    let totalScore = 0;
    let factorCount = 0;
    const social1 = prefs1.socialStyle;
    const social2 = prefs2.socialStyle;
    const leisure1 = prefs1.leisurePreferences;
    const leisure2 = prefs2.leisurePreferences;

    // Time with friends frequency
    if (social1.timeWithFriends && social2.timeWithFriends) {
      factorCount++;
      const score = CompatibilityCalculator.TIME_WITH_FRIENDS_COMPATIBILITY[social1.timeWithFriends]?.[social2.timeWithFriends] ?? 50;
      totalScore += score;
      
      if (score >= 100) {
        bonuses.push("Same social frequency preferences");
      } else if (score <= 45) {
        penalties.push("Different socializing frequencies");
      }
    }

    // Weekend preference
    if (leisure1.weekendPreference && leisure2.weekendPreference) {
      factorCount++;
      const score = CompatibilityCalculator.WEEKEND_PREFERENCE_COMPATIBILITY[leisure1.weekendPreference]?.[leisure2.weekendPreference] ?? 50;
      totalScore += score;
      
      if (score >= 100) {
        bonuses.push(`Both prefer ${leisure1.weekendPreference} weekends`);
      } else if (score <= 50) {
        penalties.push("Different weekend activity levels");
      }
    }

    // Travel frequency
    if (leisure1.travelFrequency && leisure2.travelFrequency) {
      factorCount++;
      const score = CompatibilityCalculator.TRAVEL_FREQUENCY_COMPATIBILITY[leisure1.travelFrequency]?.[leisure2.travelFrequency] ?? 50;
      totalScore += score;
      
      if (score >= 100) {
        bonuses.push("Similar travel enthusiasm");
      }
    }

    return factorCount > 0 ? totalScore / factorCount : 50;
  }

  private calculateInterestCompatibility(
    prefs1: UserPreferencesData,
    prefs2: UserPreferencesData,
    bonuses: string[]
  ): number {
    const activities1 = prefs1.leisurePreferences.activities || [];
    const activities2 = prefs2.leisurePreferences.activities || [];

    if (activities1.length === 0 && activities2.length === 0) {
      return 50; // No data to compare
    }

    if (activities1.length === 0 || activities2.length === 0) {
      return 40; // One user has no activities listed
    }

    const overlap = this.calculateArrayOverlap(activities1, activities2);
    const sharedCount = this.countSharedItems(activities1, activities2);

    // Base score from overlap ratio
    let score = overlap * 80 + 20; // Scale from 20-100 based on overlap

    // Bonus for having multiple shared activities
    if (sharedCount >= 3) {
      score = Math.min(100, score + 15);
      bonuses.push(`${sharedCount} shared interests - great match!`);
    } else if (sharedCount >= 2) {
      score = Math.min(100, score + 8);
      bonuses.push("Multiple shared interests");
    } else if (sharedCount === 1) {
      bonuses.push("Some shared interests");
    }

    return Math.min(100, Math.round(score));
  }

  private calculatePracticalCompatibility(
    prefs1: UserPreferencesData,
    prefs2: UserPreferencesData,
    bonuses: string[]
  ): number {
    // For now, focus on group size preference alignment (important for dining meetups)
    const social1 = prefs1.socialStyle;
    const social2 = prefs2.socialStyle;

    let score = 70; // Base score

    if (social1.preferredGroupSize && social2.preferredGroupSize) {
      if (social1.preferredGroupSize === social2.preferredGroupSize) {
        score += 30;
      } else {
        score += 10;
      }
    }

    return Math.min(100, score);
  }

  private calculateArrayOverlap(arr1: string[], arr2: string[]): number {
    if (!arr1?.length || !arr2?.length) return 0;
    
    const set1 = new Set(arr1.map(s => s?.toLowerCase?.() || String(s)));
    const set2 = new Set(arr2.map(s => s?.toLowerCase?.() || String(s)));
    
    let intersection = 0;
    set1.forEach(item => {
      if (set2.has(item)) intersection++;
    });
    
    const union = new Set([...set1, ...set2]).size;
    return union > 0 ? intersection / union : 0;
  }

  private countSharedItems(arr1: string[], arr2: string[]): number {
    if (!arr1?.length || !arr2?.length) return 0;
    
    const set1 = new Set(arr1.map(s => s?.toLowerCase?.() || String(s)));
    const set2 = new Set(arr2.map(s => s?.toLowerCase?.() || String(s)));
    
    let count = 0;
    set1.forEach(item => {
      if (set2.has(item)) count++;
    });
    
    return count;
  }

  private async getRecentDiningHistory(user1Id: number, user2Id: number): Promise<Date | null> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - RECENCY_PENALTY_DAYS);

      const result = await db
        .select({
          meetupDate: meetups.date,
        })
        .from(meetupParticipants)
        .innerJoin(meetups, eq(meetups.id, meetupParticipants.meetupId))
        .innerJoin(meetupParticipants2, eq(meetupParticipants2.meetupId, meetupParticipants.meetupId))
        .where(
          and(
            eq(meetupParticipants.userId, user1Id),
            eq(meetupParticipants2.userId, user2Id),
            isNotNull(meetups.date),
            gte(meetups.date, thirtyDaysAgo),
            eq(meetups.status, "completed")
          )
        )
        .orderBy(desc(meetups.date))
        .limit(1);

      return result.length > 0 ? result[0].meetupDate : null;
    } catch (error) {
      console.error(`Failed to get recent dining history for users ${user1Id} and ${user2Id}:`, error);
      return null;
    }
  }
}

export const compatibilityCalculator = new CompatibilityCalculator();
