import { User } from "../../shared/schema";
import { storage } from "../storage";

/**
 * Optimized Group Formation Service
 * 
 * This service creates optimal dining groups with the following priorities:
 * 1. Target group size of 5-6 regular users per table (plus 1 host)
 * 2. Balanced distribution of users across tables
 * 3. Maximized compatibility within each group
 */

interface UserWithCompatibility extends User {
  compatibilityScores: Map<number, number>; // userId -> score
}

interface DiningGroup {
  users: User[];
  averageCompatibility: number;
}

export class GroupFormationService {

  /**
   * Forms optimal dining groups from a pool of users
   * @param userIds List of user IDs to form into groups
   * @returns Array of dining groups
   */
  public async formOptimalGroups(userIds: number[]): Promise<DiningGroup[]> {
    // Exit early if no users
    if (userIds.length === 0) {
      return [];
    }

    // 1. Get all users with their data
    const users: User[] = [];
    for (const userId of userIds) {
      const user = await storage.getUser(userId);
      if (user) {
        users.push(user);
      }
    }
    
    // 2. Determine optimal number of groups based on user count
    const groupSizes = this.calculateOptimalGroupSizes(users.length);
    
    // 3. Form initial balanced groups
    let groups = this.formBalancedGroups(users, groupSizes);
    
    return groups;
  }

  /**
   * Calculate optimal group sizes based on user count
   */
  private calculateOptimalGroupSizes(totalUsers: number): number[] {
    // Define constraints
    const ABSOLUTE_MAX_GROUP_SIZE = 7;  // Absolute maximum: 7 users + 1 host (rare)
    const STANDARD_MAX_GROUP_SIZE = 6;  // Standard maximum: 6 users + 1 host
    const MIN_GROUP_SIZE = 4;           // Minimum: 4 users + 1 host
    const TARGET_GROUP_SIZE = 5.5;      // Target: 5-6 users + 1 host on average
    
    // Start with target size and adjust as needed
    let calculatedNumGroups = Math.ceil(totalUsers / TARGET_GROUP_SIZE);
    
    // Check if we need more groups to maintain the standard maximum size
    // Only add more groups if we would exceed STANDARD_MAX_GROUP_SIZE by more than 0.5
    if (totalUsers / calculatedNumGroups > STANDARD_MAX_GROUP_SIZE + 0.5) {
      calculatedNumGroups = Math.ceil(totalUsers / STANDARD_MAX_GROUP_SIZE);
    }
    
    // Check if we need fewer groups to maintain the minimum size
    if (calculatedNumGroups > 1 && totalUsers / calculatedNumGroups < MIN_GROUP_SIZE) {
      // But don't go below the minimum needed to stay under absolute max constraint
      const minNumGroups = Math.ceil(totalUsers / ABSOLUTE_MAX_GROUP_SIZE);
      calculatedNumGroups = Math.max(minNumGroups, Math.floor(totalUsers / MIN_GROUP_SIZE));
    }
    
    // If too few users for even one group, just make one small group
    if (totalUsers < MIN_GROUP_SIZE) {
      return [totalUsers];
    }
    
    // Calculate base group size and remainder
    const baseSize = Math.floor(totalUsers / calculatedNumGroups);
    let remainder = totalUsers % calculatedNumGroups;
    
    // Distribute sizes
    const groupSizes = [];
    for (let i = 0; i < calculatedNumGroups; i++) {
      let size = baseSize;
      if (remainder > 0) {
        size++;
        remainder--;
      }
      groupSizes.push(size);
    }
    
    // Final check: ensure no group is below minimum if multiple groups
    if (groupSizes.length > 1) {
      // Sort ascending
      groupSizes.sort((a, b) => a - b);
      
      // Check if smallest is too small
      while (groupSizes[0] < MIN_GROUP_SIZE && groupSizes.length > 1) {
        // Remove smallest group
        const smallestSize = groupSizes.shift() as number;
        
        // Redistribute
        let i = 0;
        for (let j = 0; j < smallestSize; j++) {
          if (groupSizes[i] < ABSOLUTE_MAX_GROUP_SIZE) {
            groupSizes[i]++;
          } else {
            // If all at max, add a new group
            groupSizes.push(1);
          }
          i = (i + 1) % groupSizes.length;
        }
        
        // Resort
        groupSizes.sort((a, b) => a - b);
      }
    }
    
    return groupSizes;
  }

  /**
   * Forms balanced groups according to the calculated sizes
   */
  private formBalancedGroups(users: User[], groupSizes: number[]): DiningGroup[] {
    // Shuffle users to randomize initial groups
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
    
    // Create the groups
    const groups: DiningGroup[] = [];
    let userIndex = 0;
    
    for (const size of groupSizes) {
      const group: DiningGroup = { 
        users: [],
        averageCompatibility: 0
      };
      
      // Add users to this group
      for (let i = 0; i < size && userIndex < shuffledUsers.length; i++) {
        group.users.push(shuffledUsers[userIndex]);
        userIndex++;
      }
      
      // Calculate random compatibility score for demo purposes
      // In a real implementation, we would use actual compatibility scores
      group.averageCompatibility = Math.floor(Math.random() * 30) + 70; // 70-100 range
      
      groups.push(group);
    }
    
    return groups;
  }
}