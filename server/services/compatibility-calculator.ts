import { DatabaseStorage } from "../database-storage";
import { UserPreferences } from "../../shared/schema";

const storage = new DatabaseStorage();

interface DiningPreferences {
  cuisines?: string[];
  noiseLevel?: string;
  priceRange?: string;
  ambiance?: string[];
  groupSize?: string;
  dietaryRestrictions?: string[];
  drinkPreference?: string;
}

interface SocialPreferences {
  conversationTopics?: string[];
  conversationStyle?: string;
  meetupFrequency?: string;
  meetupGoal?: string;
  personalityTraits?: string[];
}

interface AtmospherePreferences {
  musicPreference?: string;
  seatingPreference?: string;
  lightingPreference?: string;
}

interface Interests {
  [key: string]: any;
}

interface CompatibilityBreakdown {
  socialScore: number;
  diningScore: number;
  interestsScore: number;
  practicalScore: number;
  atmosphereScore: number;
  totalScore: number;
  bonuses: string[];
  penalties: string[];
  isComplete: boolean;
  missingDataReason?: string;
}

export class CompatibilityCalculator {
  private static readonly WEIGHTS = {
    social: 0.35,
    dining: 0.25,
    interests: 0.20,
    practical: 0.15,
    atmosphere: 0.05
  };

  public async calculateCompatibility(
    user1Id: number, 
    user2Id: number
  ): Promise<number> {
    const breakdown = await this.calculateDetailedCompatibility(user1Id, user2Id);
    return breakdown.totalScore;
  }

  public async calculateDetailedCompatibility(
    user1Id: number, 
    user2Id: number
  ): Promise<CompatibilityBreakdown> {
    const prefs1 = await storage.getUserPreferences(user1Id);
    const prefs2 = await storage.getUserPreferences(user2Id);

    if (!prefs1 || !prefs2) {
      const hasPrefs1 = !!prefs1;
      const hasPrefs2 = !!prefs2;
      
      let missingDataReason: string;
      if (!hasPrefs1 && !hasPrefs2) {
        missingDataReason = "Both users have not completed the questionnaire";
      } else {
        missingDataReason = hasPrefs1 
          ? "User 2 has not completed the questionnaire" 
          : "User 1 has not completed the questionnaire";
      }
      
      return {
        socialScore: 50,
        diningScore: 50,
        interestsScore: 50,
        practicalScore: 50,
        atmosphereScore: 50,
        totalScore: 50,
        bonuses: [],
        penalties: [missingDataReason],
        isComplete: false,
        missingDataReason
      };
    }

    const bonuses: string[] = [];
    const penalties: string[] = [];

    const socialScore = this.calculateSocialCompatibility(
      prefs1.socialPreferences as SocialPreferences,
      prefs2.socialPreferences as SocialPreferences,
      bonuses,
      penalties
    );

    const diningScore = this.calculateDiningCompatibility(
      prefs1.diningPreferences as DiningPreferences,
      prefs2.diningPreferences as DiningPreferences,
      bonuses,
      penalties
    );

    const interestsScore = this.calculateInterestsCompatibility(
      prefs1.interests as Interests,
      prefs2.interests as Interests,
      bonuses
    );

    const practicalScore = this.calculatePracticalCompatibility(
      prefs1.diningPreferences as DiningPreferences,
      prefs2.diningPreferences as DiningPreferences,
      prefs1.socialPreferences as SocialPreferences,
      prefs2.socialPreferences as SocialPreferences,
      bonuses,
      penalties
    );

    const atmosphereScore = this.calculateAtmosphereCompatibility(
      prefs1.atmospherePreferences as AtmospherePreferences,
      prefs2.atmospherePreferences as AtmospherePreferences
    );

    let totalScore = 
      socialScore * CompatibilityCalculator.WEIGHTS.social +
      diningScore * CompatibilityCalculator.WEIGHTS.dining +
      interestsScore * CompatibilityCalculator.WEIGHTS.interests +
      practicalScore * CompatibilityCalculator.WEIGHTS.practical +
      atmosphereScore * CompatibilityCalculator.WEIGHTS.atmosphere;

    totalScore = Math.round(Math.max(0, Math.min(100, totalScore)));

    return {
      socialScore: Math.round(socialScore),
      diningScore: Math.round(diningScore),
      interestsScore: Math.round(interestsScore),
      practicalScore: Math.round(practicalScore),
      atmosphereScore: Math.round(atmosphereScore),
      totalScore,
      bonuses,
      penalties,
      isComplete: true
    };
  }

  private calculateSocialCompatibility(
    prefs1: SocialPreferences | null,
    prefs2: SocialPreferences | null,
    bonuses: string[],
    penalties: string[]
  ): number {
    if (!prefs1 || !prefs2) return 70;

    let score = 50;

    const topics1 = prefs1.conversationTopics || [];
    const topics2 = prefs2.conversationTopics || [];
    const topicOverlap = this.calculateArrayOverlap(topics1, topics2);
    score += topicOverlap * 20;

    if (topicOverlap >= 0.5) {
      bonuses.push("Strong shared conversation interests");
    }

    const style1 = prefs1.conversationStyle;
    const style2 = prefs2.conversationStyle;
    
    if (style1 && style2) {
      if (style1 === style2) {
        score += 10;
      } else if (this.areComplementaryStyles(style1, style2)) {
        score += 15;
        bonuses.push("Complementary conversation styles");
      } else {
        score += 5;
      }
    }

    const traits1 = prefs1.personalityTraits || [];
    const traits2 = prefs2.personalityTraits || [];
    const traitOverlap = this.calculateArrayOverlap(traits1, traits2);
    score += traitOverlap * 15;

    const goal1 = prefs1.meetupGoal;
    const goal2 = prefs2.meetupGoal;
    
    if (goal1 && goal2) {
      if (goal1 === goal2) {
        score += 10;
        bonuses.push("Same meetup goals");
      } else if (this.areCompatibleGoals(goal1, goal2)) {
        score += 5;
      } else {
        score -= 5;
        penalties.push("Different meetup expectations");
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateDiningCompatibility(
    prefs1: DiningPreferences | null,
    prefs2: DiningPreferences | null,
    bonuses: string[],
    penalties: string[]
  ): number {
    if (!prefs1 || !prefs2) return 70;

    let score = 50;

    const cuisines1 = prefs1.cuisines || [];
    const cuisines2 = prefs2.cuisines || [];
    const cuisineOverlap = this.calculateArrayOverlap(cuisines1, cuisines2);
    score += cuisineOverlap * 25;

    if (cuisineOverlap >= 0.4) {
      bonuses.push("Compatible cuisine preferences");
    }

    const price1 = prefs1.priceRange;
    const price2 = prefs2.priceRange;
    
    if (price1 && price2) {
      const priceDiff = this.getPriceRangeDifference(price1, price2);
      if (priceDiff === 0) {
        score += 15;
      } else if (priceDiff === 1) {
        score += 10;
      } else {
        score -= 5;
        penalties.push("Different budget expectations");
      }
    }

    const noise1 = prefs1.noiseLevel;
    const noise2 = prefs2.noiseLevel;
    
    if (noise1 && noise2) {
      if (noise1 === noise2) {
        score += 5;
      } else if (this.areAdjacentNoisePreferences(noise1, noise2)) {
        score += 3;
      }
    }

    const ambiance1 = prefs1.ambiance || [];
    const ambiance2 = prefs2.ambiance || [];
    const ambianceOverlap = this.calculateArrayOverlap(ambiance1, ambiance2);
    score += ambianceOverlap * 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateInterestsCompatibility(
    interests1: Interests | null,
    interests2: Interests | null,
    bonuses: string[]
  ): number {
    if (!interests1 || !interests2) return 70;

    const array1 = this.extractInterestsArray(interests1);
    const array2 = this.extractInterestsArray(interests2);

    if (array1.length === 0 || array2.length === 0) {
      return 70;
    }

    const overlap = this.calculateArrayOverlap(array1, array2);
    let score = 50 + (overlap * 50);

    if (overlap >= 0.5) {
      bonuses.push("Many shared interests");
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculatePracticalCompatibility(
    diningPrefs1: DiningPreferences | null,
    diningPrefs2: DiningPreferences | null,
    socialPrefs1: SocialPreferences | null,
    socialPrefs2: SocialPreferences | null,
    bonuses: string[],
    penalties: string[]
  ): number {
    let score = 70;

    if (diningPrefs1 && diningPrefs2) {
      const dietary1 = diningPrefs1.dietaryRestrictions || [];
      const dietary2 = diningPrefs2.dietaryRestrictions || [];

      if (this.haveConflictingDietary(dietary1, dietary2)) {
        score -= 20;
        penalties.push("Potentially conflicting dietary needs");
      }

      if (dietary1.length > 0 && dietary2.length > 0) {
        const dietaryOverlap = this.calculateArrayOverlap(dietary1, dietary2);
        if (dietaryOverlap > 0.5) {
          score += 10;
          bonuses.push("Similar dietary preferences");
        }
      }

      const drink1 = diningPrefs1.drinkPreference;
      const drink2 = diningPrefs2.drinkPreference;
      
      if (drink1 && drink2) {
        if (drink1 === drink2) {
          score += 10;
        } else if (this.areCompatibleDrinkPrefs(drink1, drink2)) {
          score += 5;
        }
      }

      const groupSize1 = diningPrefs1.groupSize;
      const groupSize2 = diningPrefs2.groupSize;
      
      if (groupSize1 && groupSize2) {
        if (groupSize1 === groupSize2) {
          score += 10;
        } else if (this.areAdjacentGroupSizes(groupSize1, groupSize2)) {
          score += 5;
        }
      }
    }

    if (socialPrefs1 && socialPrefs2) {
      const freq1 = socialPrefs1.meetupFrequency;
      const freq2 = socialPrefs2.meetupFrequency;
      
      if (freq1 && freq2 && freq1 === freq2) {
        score += 5;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateAtmosphereCompatibility(
    prefs1: AtmospherePreferences | null,
    prefs2: AtmospherePreferences | null
  ): number {
    if (!prefs1 || !prefs2) return 70;

    let score = 50;
    let matchCount = 0;

    if (prefs1.musicPreference && prefs2.musicPreference) {
      if (prefs1.musicPreference === prefs2.musicPreference) {
        score += 20;
        matchCount++;
      } else if (prefs1.musicPreference === "Any" || prefs2.musicPreference === "Any") {
        score += 15;
      }
    }

    if (prefs1.seatingPreference && prefs2.seatingPreference) {
      if (prefs1.seatingPreference === prefs2.seatingPreference) {
        score += 15;
        matchCount++;
      }
    }

    if (prefs1.lightingPreference && prefs2.lightingPreference) {
      if (prefs1.lightingPreference === prefs2.lightingPreference) {
        score += 15;
        matchCount++;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateArrayOverlap(arr1: string[], arr2: string[]): number {
    if (arr1.length === 0 || arr2.length === 0) return 0;
    
    const set1 = new Set(arr1.map(s => s.toLowerCase()));
    const set2 = new Set(arr2.map(s => s.toLowerCase()));
    
    let overlapCount = 0;
    for (const item of set1) {
      if (set2.has(item)) {
        overlapCount++;
      }
    }
    
    const smaller = Math.min(set1.size, set2.size);
    return smaller > 0 ? overlapCount / smaller : 0;
  }

  private areComplementaryStyles(style1: string, style2: string): boolean {
    const complementary: Record<string, string[]> = {
      "Listener": ["Talker", "Balanced"],
      "Talker": ["Listener", "Balanced"],
      "Balanced": ["Listener", "Talker", "Balanced"]
    };
    
    return complementary[style1]?.includes(style2) || false;
  }

  private areCompatibleGoals(goal1: string, goal2: string): boolean {
    const compatible: Record<string, string[]> = {
      "Networking": ["Professional", "Casual", "New Friends"],
      "New Friends": ["Casual", "Networking", "Social"],
      "Casual": ["New Friends", "Social", "Networking"],
      "Professional": ["Networking"],
      "Social": ["Casual", "New Friends"],
      "Romance": ["Romance"]
    };
    
    return compatible[goal1]?.includes(goal2) || compatible[goal2]?.includes(goal1) || false;
  }

  private getPriceRangeDifference(price1: string, price2: string): number {
    const priceMap: Record<string, number> = {
      "$": 1,
      "$$": 2,
      "$$$": 3,
      "$$$$": 4
    };
    
    const val1 = priceMap[price1] || 2;
    const val2 = priceMap[price2] || 2;
    
    return Math.abs(val1 - val2);
  }

  private areAdjacentNoisePreferences(noise1: string, noise2: string): boolean {
    const noiseOrder = ["Quiet", "Moderate", "Lively", "Loud"];
    const idx1 = noiseOrder.indexOf(noise1);
    const idx2 = noiseOrder.indexOf(noise2);
    
    if (idx1 === -1 || idx2 === -1) return true;
    return Math.abs(idx1 - idx2) <= 1;
  }

  private haveConflictingDietary(dietary1: string[], dietary2: string[]): boolean {
    const conflicts: [string, string][] = [
      ["Vegan", "Meat-lover"],
      ["Vegetarian", "Meat-lover"],
      ["Kosher", "Pork"],
      ["Halal", "Pork"]
    ];
    
    for (const [d1, d2] of conflicts) {
      if (
        (dietary1.includes(d1) && dietary2.includes(d2)) ||
        (dietary1.includes(d2) && dietary2.includes(d1))
      ) {
        return true;
      }
    }
    
    return false;
  }

  private areCompatibleDrinkPrefs(drink1: string, drink2: string): boolean {
    if (drink1 === "Non-alcoholic" && drink2 === "Non-alcoholic") return true;
    if (drink1 === "Non-alcoholic" || drink2 === "Non-alcoholic") return false;
    return true;
  }

  private areAdjacentGroupSizes(size1: string, size2: string): boolean {
    const sizeOrder = ["Intimate", "Small", "Medium", "Large"];
    const idx1 = sizeOrder.indexOf(size1);
    const idx2 = sizeOrder.indexOf(size2);
    
    if (idx1 === -1 || idx2 === -1) return true;
    return Math.abs(idx1 - idx2) <= 1;
  }

  private extractInterestsArray(interests: Interests): string[] {
    if (Array.isArray(interests)) {
      return interests.filter(i => typeof i === 'string');
    }
    
    if (typeof interests === 'object' && interests !== null) {
      const values: string[] = [];
      for (const key of Object.keys(interests)) {
        const value = interests[key];
        if (typeof value === 'string') {
          values.push(value);
        } else if (Array.isArray(value)) {
          values.push(...value.filter(v => typeof v === 'string'));
        }
      }
      return values;
    }
    
    return [];
  }
}

export const compatibilityCalculator = new CompatibilityCalculator();
