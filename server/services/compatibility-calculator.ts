import { DatabaseStorage } from "../database-storage";
import { User, UserPreferences, meetups, meetupParticipants } from "../../shared/schema";
import { eq, and, gte, sql, desc, isNotNull, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db";

const meetupParticipants2 = alias(meetupParticipants, "mp2");

const storage = new DatabaseStorage();

const RECENCY_PENALTY_DAYS = 30;
const RECENCY_PENALTY_AMOUNT = 25;

interface DiningPreferences {
  cuisines: string[];
  noiseLevel: string;
  priceRange: string;
  ambiance: string[];
  groupSize: string;
  dietaryRestrictions?: string[];
  drinkPreference: string;
}

interface SocialPreferences {
  conversationTopics: string[];
  conversationStyle: string;
  meetupFrequency: string;
  meetupGoal: string;
  personalityTraits: string[];
}

interface AtmospherePreferences {
  musicPreference: string;
  seatingPreference: string;
  lightingPreference: string;
}

interface UserPreferencesData {
  diningPreferences: DiningPreferences;
  socialPreferences: SocialPreferences;
  atmospherePreferences: AtmospherePreferences;
  dietaryRestrictions?: string[];
  interests: string[];
}

interface CompatibilityBreakdown {
  socialScore: number;
  diningScore: number;
  interestScore: number;
  practicalScore: number;
  atmosphereScore: number;
  recencyPenalty: number;
  totalScore: number;
  bonuses: string[];
  penalties: string[];
  isComplete: boolean;
  recentDiningDate?: Date;
}

export class CompatibilityCalculator {
  private static readonly WEIGHTS = {
    social: 0.30,
    dining: 0.30,
    interests: 0.20,
    practical: 0.10,
    atmosphere: 0.10,
  };

  private static readonly COMPLEMENTARY_STYLES: Record<string, string[]> = {
    "Outgoing": ["Reserved", "Thoughtful", "Relaxed"],
    "Reserved": ["Outgoing", "Thoughtful", "Relaxed"],
    "Adventurous": ["Analytical", "Spontaneous", "Energetic"],
    "Analytical": ["Creative", "Adventurous", "Thoughtful"],
    "Creative": ["Analytical", "Organized", "Adventurous"],
    "Organized": ["Spontaneous", "Creative", "Relaxed"],
    "Spontaneous": ["Organized", "Adventurous", "Energetic"],
    "Relaxed": ["Energetic", "Outgoing", "Reserved"],
    "Energetic": ["Relaxed", "Spontaneous", "Adventurous"],
    "Thoughtful": ["Outgoing", "Reserved", "Analytical"],
  };

  private static readonly CONVERSATION_STYLE_COMPATIBILITY: Record<string, string[]> = {
    "I prefer deep, meaningful conversations": ["I prefer deep, meaningful conversations", "I like a mix of both"],
    "I enjoy light, casual banter": ["I enjoy light, casual banter", "I like a mix of both"],
    "I like a mix of both": ["I prefer deep, meaningful conversations", "I enjoy light, casual banter", "I like a mix of both"],
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
        diningScore: 50,
        interestScore: 50,
        practicalScore: 50,
        atmosphereScore: 50,
        recencyPenalty: 0,
        totalScore: 50,
        bonuses: [],
        penalties: ["Missing questionnaire data for one or both users"],
        isComplete: false,
      };
    }

    const frequencyScore = this.calculateFrequencyCompatibility(prefs1, prefs2, bonuses);
    const groupSizeScore = this.calculateGroupSizeCompatibility(prefs1, prefs2, bonuses);
    
    const adjustedSocialScore = this.calculateSocialCompatibility(prefs1, prefs2, bonuses, penalties) * 0.85 + frequencyScore * 0.15;
    const adjustedDiningScore = this.calculateDiningCompatibility(prefs1, prefs2, bonuses, penalties) * 0.85 + groupSizeScore * 0.15;
    const interestScore = this.calculateInterestCompatibility(prefs1, prefs2, bonuses);
    const practicalScore = this.calculatePracticalCompatibility(prefs1, prefs2, bonuses, penalties);
    const atmosphereScore = this.calculateAtmosphereCompatibility(prefs1, prefs2, bonuses);

    const baseScore = Math.min(100, Math.round(
      adjustedSocialScore * CompatibilityCalculator.WEIGHTS.social +
      adjustedDiningScore * CompatibilityCalculator.WEIGHTS.dining +
      interestScore * CompatibilityCalculator.WEIGHTS.interests +
      practicalScore * CompatibilityCalculator.WEIGHTS.practical +
      atmosphereScore * CompatibilityCalculator.WEIGHTS.atmosphere
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
      socialScore: Math.round(adjustedSocialScore),
      diningScore: Math.round(adjustedDiningScore),
      interestScore: Math.round(interestScore),
      practicalScore: Math.round(practicalScore),
      atmosphereScore: Math.round(atmosphereScore),
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
      
      return {
        diningPreferences: prefs.diningPreferences as DiningPreferences,
        socialPreferences: prefs.socialPreferences as SocialPreferences,
        atmospherePreferences: prefs.atmospherePreferences as AtmospherePreferences,
        dietaryRestrictions: prefs.dietaryRestrictions as string[] | undefined,
        interests: prefs.interests as string[],
      };
    } catch (error) {
      console.error(`Failed to get preferences for user ${userId}:`, error);
      return null;
    }
  }

  private calculateSocialCompatibility(
    prefs1: UserPreferencesData,
    prefs2: UserPreferencesData,
    bonuses: string[],
    penalties: string[]
  ): number {
    let score = 0;
    const social1 = prefs1.socialPreferences;
    const social2 = prefs2.socialPreferences;

    const topicOverlap = this.calculateArrayOverlap(
      social1.conversationTopics,
      social2.conversationTopics
    );
    score += topicOverlap * 30;
    
    if (topicOverlap >= 0.5) {
      bonuses.push("Strong shared conversation interests");
    }

    const styleCompatible = this.areConversationStylesCompatible(
      social1.conversationStyle,
      social2.conversationStyle
    );
    score += styleCompatible ? 25 : 10;
    
    if (styleCompatible) {
      bonuses.push("Compatible conversation styles");
    }

    if (social1.meetupGoal === social2.meetupGoal) {
      score += 25;
      bonuses.push(`Both looking for: ${social1.meetupGoal}`);
    } else {
      score += 10;
    }

    const personalityScore = this.calculatePersonalityCompatibility(
      social1.personalityTraits,
      social2.personalityTraits
    );
    score += personalityScore * 20;

    return Math.min(100, score);
  }

  private calculateDiningCompatibility(
    prefs1: UserPreferencesData,
    prefs2: UserPreferencesData,
    bonuses: string[],
    penalties: string[]
  ): number {
    let score = 0;
    const dining1 = prefs1.diningPreferences;
    const dining2 = prefs2.diningPreferences;

    const cuisineOverlap = this.calculateArrayOverlap(
      dining1.cuisines,
      dining2.cuisines
    );
    score += cuisineOverlap * 35;
    
    if (cuisineOverlap >= 0.4) {
      bonuses.push("Great cuisine compatibility");
    }

    if (dining1.priceRange === dining2.priceRange) {
      score += 25;
      bonuses.push("Same price range preference");
    } else if (this.arePriceRangesClose(dining1.priceRange, dining2.priceRange)) {
      score += 15;
    } else {
      score += 5;
      penalties.push("Different budget expectations");
    }

    if (dining1.noiseLevel === dining2.noiseLevel) {
      score += 20;
    } else if (this.areNoiseLevelsCompatible(dining1.noiseLevel, dining2.noiseLevel)) {
      score += 12;
    } else {
      score += 5;
    }

    const ambianceOverlap = this.calculateArrayOverlap(
      dining1.ambiance,
      dining2.ambiance
    );
    score += ambianceOverlap * 20;

    return Math.min(100, score);
  }

  private calculateInterestCompatibility(
    prefs1: UserPreferencesData,
    prefs2: UserPreferencesData,
    bonuses: string[]
  ): number {
    const overlap = this.calculateArrayOverlap(prefs1.interests, prefs2.interests);
    
    if (overlap >= 0.5) {
      bonuses.push("Many shared interests");
    } else if (overlap >= 0.3) {
      bonuses.push("Some shared interests");
    }

    return Math.min(100, overlap * 100 + 20);
  }

  private toRestrictionsArray(restrictions: any): string[] {
    if (!restrictions) return [];
    if (Array.isArray(restrictions)) return restrictions;
    if (typeof restrictions === 'object') {
      return Object.keys(restrictions).filter(key => restrictions[key]);
    }
    return [];
  }

  private calculatePracticalCompatibility(
    prefs1: UserPreferencesData,
    prefs2: UserPreferencesData,
    bonuses: string[],
    penalties: string[]
  ): number {
    let score = 70;
    const dining1 = prefs1.diningPreferences;
    const dining2 = prefs2.diningPreferences;

    const r1Prefs = this.toRestrictionsArray(prefs1.dietaryRestrictions);
    const r1Dining = this.toRestrictionsArray(dining1.dietaryRestrictions);
    const restrictions1 = r1Prefs.length > 0 ? r1Prefs : r1Dining;
    
    const r2Prefs = this.toRestrictionsArray(prefs2.dietaryRestrictions);
    const r2Dining = this.toRestrictionsArray(dining2.dietaryRestrictions);
    const restrictions2 = r2Prefs.length > 0 ? r2Prefs : r2Dining;

    if (restrictions1.length === 0 && restrictions2.length === 0) {
      score += 15;
      bonuses.push("No dietary restrictions to coordinate");
    } else if (this.areDietaryRestrictionsConflicting(restrictions1, restrictions2)) {
      score -= 20;
      penalties.push("Conflicting dietary restrictions");
    } else {
      const restrictionOverlap = this.calculateArrayOverlap(restrictions1, restrictions2);
      if (restrictionOverlap > 0.5) {
        score += 10;
        bonuses.push("Similar dietary needs");
      }
    }

    if (dining1.drinkPreference === dining2.drinkPreference) {
      score += 15;
    } else if (this.areDrinkPreferencesCompatible(dining1.drinkPreference, dining2.drinkPreference)) {
      score += 8;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateAtmosphereCompatibility(
    prefs1: UserPreferencesData,
    prefs2: UserPreferencesData,
    bonuses: string[]
  ): number {
    let score = 0;
    const atm1 = prefs1.atmospherePreferences;
    const atm2 = prefs2.atmospherePreferences;

    if (atm1.musicPreference === atm2.musicPreference) {
      score += 35;
    } else {
      score += 15;
    }

    if (atm1.seatingPreference === atm2.seatingPreference) {
      score += 35;
    } else {
      score += 15;
    }

    if (atm1.lightingPreference === atm2.lightingPreference) {
      score += 30;
    } else {
      score += 15;
    }

    if (score >= 90) {
      bonuses.push("Perfect atmosphere match");
    }

    return Math.min(100, score);
  }

  private calculateArrayOverlap(arr1: string[], arr2: string[]): number {
    if (!arr1?.length || !arr2?.length) return 0;
    
    const set1 = new Set(arr1.map(s => s.toLowerCase()));
    const set2 = new Set(arr2.map(s => s.toLowerCase()));
    
    let intersection = 0;
    set1.forEach(item => {
      if (set2.has(item)) intersection++;
    });
    
    const union = new Set([...set1, ...set2]).size;
    return union > 0 ? intersection / union : 0;
  }

  private areConversationStylesCompatible(style1: string, style2: string): boolean {
    if (style1 === style2) return true;
    
    const compatible = CompatibilityCalculator.CONVERSATION_STYLE_COMPATIBILITY[style1];
    return compatible?.includes(style2) || false;
  }

  private calculatePersonalityCompatibility(traits1: string[], traits2: string[]): number {
    if (!traits1?.length || !traits2?.length) return 0.5;

    let compatibilityScore = 0;
    let comparisons = 0;

    for (const trait1 of traits1) {
      for (const trait2 of traits2) {
        comparisons++;
        
        if (trait1 === trait2) {
          compatibilityScore += 0.8;
        } else if (CompatibilityCalculator.COMPLEMENTARY_STYLES[trait1]?.includes(trait2)) {
          compatibilityScore += 1.0;
        } else {
          compatibilityScore += 0.3;
        }
      }
    }

    return comparisons > 0 ? compatibilityScore / comparisons : 0.5;
  }

  private arePriceRangesClose(range1: string, range2: string): boolean {
    const priceOrder = ["$", "$$", "$$$", "$$$$"];
    const idx1 = priceOrder.indexOf(range1);
    const idx2 = priceOrder.indexOf(range2);
    
    if (idx1 === -1 || idx2 === -1) return false;
    return Math.abs(idx1 - idx2) <= 1;
  }

  private areNoiseLevelsCompatible(level1: string, level2: string): boolean {
    const noiseOrder = ["Quiet", "Moderate", "Lively", "Loud"];
    const idx1 = noiseOrder.findIndex(n => level1.toLowerCase().includes(n.toLowerCase()));
    const idx2 = noiseOrder.findIndex(n => level2.toLowerCase().includes(n.toLowerCase()));
    
    if (idx1 === -1 || idx2 === -1) return true;
    return Math.abs(idx1 - idx2) <= 1;
  }

  private areDietaryRestrictionsConflicting(restrictions1: string[], restrictions2: string[]): boolean {
    const conflictPairs = [
      ["Vegan", "Keto"],
      ["Vegan", "Paleo"],
      ["Vegetarian", "Keto"],
    ];

    for (const [r1, r2] of conflictPairs) {
      if (
        (restrictions1.includes(r1) && restrictions2.includes(r2)) ||
        (restrictions1.includes(r2) && restrictions2.includes(r1))
      ) {
        return true;
      }
    }

    return false;
  }

  private areDrinkPreferencesCompatible(pref1: string, pref2: string): boolean {
    if (pref1 === pref2) return true;
    
    const alcoholFree = ["Non-alcoholic", "No preference"];
    const alcoholic = ["Wine", "Cocktails", "Beer", "Spirits"];
    
    if (pref1 === "No preference" || pref2 === "No preference") return true;
    
    const both1 = alcoholFree.includes(pref1);
    const both2 = alcoholFree.includes(pref2);
    
    if (both1 !== both2) return false;
    
    return true;
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

  private calculateFrequencyCompatibility(
    prefs1: UserPreferencesData,
    prefs2: UserPreferencesData,
    bonuses: string[]
  ): number {
    const freq1 = prefs1.socialPreferences.meetupFrequency;
    const freq2 = prefs2.socialPreferences.meetupFrequency;

    if (!freq1 || !freq2) return 50;

    const frequencyOrder = [
      "Once a month",
      "Every two weeks", 
      "Weekly",
      "Multiple times a week"
    ];

    const idx1 = frequencyOrder.findIndex(f => freq1.toLowerCase().includes(f.toLowerCase()));
    const idx2 = frequencyOrder.findIndex(f => freq2.toLowerCase().includes(f.toLowerCase()));

    if (idx1 === -1 || idx2 === -1) return 50;

    const diff = Math.abs(idx1 - idx2);
    
    if (diff === 0) {
      bonuses.push("Same meetup frequency preference");
      return 100;
    } else if (diff === 1) {
      return 75;
    } else if (diff === 2) {
      return 50;
    } else {
      return 25;
    }
  }

  private calculateGroupSizeCompatibility(
    prefs1: UserPreferencesData,
    prefs2: UserPreferencesData,
    bonuses: string[]
  ): number {
    const size1 = prefs1.diningPreferences.groupSize;
    const size2 = prefs2.diningPreferences.groupSize;

    if (!size1 || !size2) return 50;

    const sizeOrder = [
      "Small (2-4 people)",
      "Medium (4-6 people)",
      "Large (6-8 people)",
      "Very large (8+ people)"
    ];

    const idx1 = sizeOrder.findIndex(s => 
      size1.toLowerCase().includes(s.split(" ")[0].toLowerCase()) ||
      s.toLowerCase().includes(size1.toLowerCase())
    );
    const idx2 = sizeOrder.findIndex(s => 
      size2.toLowerCase().includes(s.split(" ")[0].toLowerCase()) ||
      s.toLowerCase().includes(size2.toLowerCase())
    );

    if (idx1 === -1 || idx2 === -1) return 50;

    const diff = Math.abs(idx1 - idx2);
    
    if (diff === 0) {
      bonuses.push("Same group size preference");
      return 100;
    } else if (diff === 1) {
      return 70;
    } else {
      return 40;
    }
  }
}

export const compatibilityCalculator = new CompatibilityCalculator();
