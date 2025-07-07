import { DatabaseStorage } from "../database-storage";
const storage = new DatabaseStorage();
import { User, MatchScore } from "../../shared/schema";

/**
 * Optimized Group Formation Service
 * 
 * This service creates optimal dining groups with the following priorities:
 * 1. Target group size of 6 regular users per table (plus 1 host)
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

    // 1. Calculate compatibility matrix for all users
    const usersWithCompatibility = await this.buildCompatibilityMatrix(userIds);
    
    // 2. Determine optimal number of groups based on user count
    const numGroups = Math.ceil(userIds.length / 6);
    
    // 3. Form initial balanced groups
    let groups = this.formInitialBalancedGroups(usersWithCompatibility, numGroups);
    
    // 4. Optimize groups through swapping to maximize compatibility
    groups = this.optimizeGroupCompatibility(groups, usersWithCompatibility);
    
    return groups;
  }

  /**
   * Creates a matrix of compatibility scores between all users
   */
  private async buildCompatibilityMatrix(userIds: number[]): Promise<UserWithCompatibility[]> {
    const result: UserWithCompatibility[] = [];
    
    // Get all users with their data
    const users: User[] = [];
    for (const userId of userIds) {
      const user = await storage.getUser(userId);
      if (user) {
        users.push(user);
      }
    }
    
    // Calculate all compatibility scores
    for (const user of users) {
      // Calculate compatibility with all other users
      const compatibilityScores = new Map<number, number>();
      
      for (const otherUser of users) {
        if (user.id === otherUser.id) continue;
        
        // Try to find existing match score
        const [existingScore] = await storage.db
          .select()
          .from(storage.db.schema.matchScores)
          .where(
            storage.db.or(
              storage.db.and(
                storage.db.eq(storage.db.schema.matchScores.user1Id, user.id),
                storage.db.eq(storage.db.schema.matchScores.user2Id, otherUser.id)
              ),
              storage.db.and(
                storage.db.eq(storage.db.schema.matchScores.user1Id, otherUser.id),
                storage.db.eq(storage.db.schema.matchScores.user2Id, user.id)
              )
            )
          );
        
        if (existingScore) {
          compatibilityScores.set(otherUser.id, existingScore.compatibilityScore);
        } else {
          // Calculate new score if needed (this would use the real algorithm in production)
          // For now using the placeholder from current code
          const score = Math.floor(Math.random() * 40) + 60; // 60-100 range
          compatibilityScores.set(otherUser.id, score);
          
          // Store the score for future use
          await storage.db
            .insert(storage.db.schema.matchScores)
            .values({
              user1Id: user.id,
              user2Id: otherUser.id,
              compatibilityScore: score,
              calculatedAt: new Date()
            });
        }
      }
      
      result.push({
        ...user,
        compatibilityScores
      });
    }
    
    return result;
  }

  /**
   * Forms initial balanced groups without considering compatibility
   */
  private formInitialBalancedGroups(
    users: UserWithCompatibility[], 
    numGroups: number
  ): DiningGroup[] {
    // Define the constraints
    const ABSOLUTE_MAX_GROUP_SIZE = 7;  // Absolute maximum: 7 users + 1 host (rare)
    const STANDARD_MAX_GROUP_SIZE = 6;  // Standard maximum: 6 users + 1 host
    const MIN_GROUP_SIZE = 4;           // Minimum: 4 users + 1 host
    const TARGET_GROUP_SIZE = 5.5;      // Target: 5-6 users + 1 host on average
    
    const totalUsers = users.length;
    
    // Recalculate the number of groups needed based on min and target constraints
    // Start with target size and adjust as needed
    let calculatedNumGroups = Math.ceil(totalUsers / TARGET_GROUP_SIZE);
    
    // Check if we need more groups to maintain the standard maximum size
    // Only add more groups if we would exceed STANDARD_MAX_GROUP_SIZE by more than 1
    if (totalUsers / calculatedNumGroups > STANDARD_MAX_GROUP_SIZE + 0.5) {
      calculatedNumGroups = Math.ceil(totalUsers / STANDARD_MAX_GROUP_SIZE);
    }
    
    // Check if we need fewer groups to maintain the minimum size
    if (calculatedNumGroups > 1 && totalUsers / calculatedNumGroups < MIN_GROUP_SIZE) {
      // But don't go below the minimum needed to stay under absolute max constraint
      const minNumGroups = Math.ceil(totalUsers / ABSOLUTE_MAX_GROUP_SIZE);
      calculatedNumGroups = Math.max(minNumGroups, Math.floor(totalUsers / MIN_GROUP_SIZE));
    }
    
    // Create the groups array
    const groups: DiningGroup[] = Array(calculatedNumGroups)
      .fill(null)
      .map(() => ({ users: [], averageCompatibility: 0 }));
    
    // If we have too few users to form even one valid group, handle that case
    if (totalUsers < MIN_GROUP_SIZE) {
      // Create just one group with all available users
      const singleGroup: DiningGroup = { users: [], averageCompatibility: 0 };
      users.forEach(user => singleGroup.users.push(user));
      singleGroup.averageCompatibility = this.calculateGroupCompatibility(singleGroup.users);
      return [singleGroup];
    }
    
    // Calculate base group size and remainder for even distribution
    const baseSize = Math.floor(totalUsers / calculatedNumGroups);
    let remainder = totalUsers % calculatedNumGroups;
    
    // Distribute users to groups
    let userIndex = 0;
    
    for (let i = 0; i < calculatedNumGroups; i++) {
      // Calculate target size for this group (distribute remainder one by one)
      let targetSize = baseSize;
      if (remainder > 0) {
        targetSize++;
        remainder--;
      }
      
      // Add users to this group
      for (let j = 0; j < targetSize && userIndex < users.length; j++) {
        groups[i].users.push(users[userIndex]);
        userIndex++;
      }
    }
    
    // Final check: ensure no group is below minimum size if we have multiple groups
    // We might need to redistribute or merge groups
    if (groups.length > 1) {
      // Sort groups by size (ascending)
      groups.sort((a, b) => a.users.length - b.users.length);
      
      // Check if smallest group is below minimum
      while (groups[0].users.length < MIN_GROUP_SIZE && groups.length > 1) {
        // Take the smallest group and distribute its users among other groups
        const smallestGroup = groups.shift()!;
        
        // Redistribute users from smallest group to others
        for (const user of smallestGroup.users) {
          // Find the group with fewest users
          groups.sort((a, b) => a.users.length - b.users.length);
          
          // Add user to smallest group if it won't exceed absolute max size
          if (groups[0].users.length < ABSOLUTE_MAX_GROUP_SIZE) {
            groups[0].users.push(user);
          } else {
            // If all groups are at max capacity, create a new group
            const newGroup: DiningGroup = { users: [user], averageCompatibility: 0 };
            groups.push(newGroup);
          }
        }
        
        // Re-sort groups
        groups.sort((a, b) => a.users.length - b.users.length);
      }
    }
    
    // Calculate initial compatibility scores
    groups.forEach(group => {
      group.averageCompatibility = this.calculateGroupCompatibility(group.users);
    });
    
    return groups;
  }

  /**
   * Optimizes groups through swapping users between groups
   */
  private optimizeGroupCompatibility(
    groups: DiningGroup[],
    allUsers: UserWithCompatibility[]
  ): DiningGroup[] {
    const MAX_ITERATIONS = 100;
    let improved = true;
    let iteration = 0;
    
    // Define constraints
    const ABSOLUTE_MAX_GROUP_SIZE = 7;  // Absolute maximum: 7 users + 1 host (rare)
    const STANDARD_MAX_GROUP_SIZE = 6;  // Standard maximum: 6 users + 1 host
    const MIN_GROUP_SIZE = 4;           // Minimum: 4 users + 1 host
    
    while (improved && iteration < MAX_ITERATIONS) {
      improved = false;
      iteration++;
      
      // Try swapping users between every pair of groups
      for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
          const groupA = groups[i];
          const groupB = groups[j];
          
          // Don't make groups too unbalanced (max difference of 1)
          if (Math.abs(groupA.users.length - groupB.users.length) > 1) {
            continue;
          }
          
          // Try swapping each user from group A with each user from group B
          for (let a = 0; a < groupA.users.length; a++) {
            for (let b = 0; b < groupB.users.length; b++) {
              const userA = groupA.users[a];
              const userB = groupB.users[b];
              
              // Calculate new group sizes after swap (should stay the same but being explicit)
              const newSizeA = groupA.users.length;
              const newSizeB = groupB.users.length;
              
              // Never allow any group to exceed ABSOLUTE maximum
              if (newSizeA > ABSOLUTE_MAX_GROUP_SIZE || newSizeB > ABSOLUTE_MAX_GROUP_SIZE) {
                continue;
              }
              
              // Strongly prefer keeping groups within standard maximum
              // Only proceed with a swap that creates a 7-person group if the compatibility 
              // improvement is very significant (>20% improvement)
              let requiresSignificantImprovement = false;
              if (newSizeA > STANDARD_MAX_GROUP_SIZE || newSizeB > STANDARD_MAX_GROUP_SIZE) {
                requiresSignificantImprovement = true;
              }
              
              // Never allow any group to go below MIN_GROUP_SIZE (unless there's only 1 group)
              if (groups.length > 1 && (newSizeA < MIN_GROUP_SIZE || newSizeB < MIN_GROUP_SIZE)) {
                continue;
              }
              
              // Calculate current compatibility
              const currentCompatA = this.calculateGroupCompatibility(groupA.users);
              const currentCompatB = this.calculateGroupCompatibility(groupB.users);
              const currentTotalCompat = currentCompatA + currentCompatB;
              
              // Calculate compatibility after swap
              const newGroupA = [...groupA.users];
              const newGroupB = [...groupB.users];
              newGroupA[a] = userB;
              newGroupB[b] = userA;
              
              const newCompatA = this.calculateGroupCompatibility(newGroupA);
              const newCompatB = this.calculateGroupCompatibility(newGroupB);
              const newTotalCompat = newCompatA + newCompatB;
              
              // If the swap would create a 7-person group, only allow if the
              // compatibility improvement is significant
              const compatImprovement = (newTotalCompat - currentTotalCompat) / currentTotalCompat;
              if (requiresSignificantImprovement && compatImprovement < 0.20) {
                continue; // Skip swaps that would create 7-person groups without significant improvement
              }
              
              // If swap improves compatibility, do it
              if (newTotalCompat > currentTotalCompat) {
                groupA.users = newGroupA;
                groupB.users = newGroupB;
                groupA.averageCompatibility = newCompatA;
                groupB.averageCompatibility = newCompatB;
                improved = true;
              }
            }
          }
        }
      }
    }
    
    // Final verification that all groups meet size constraints
    if (groups.length > 1) {
      let needsRedistribution = false;
      
      // Check if any group is below minimum size
      for (const group of groups) {
        if (group.users.length < MIN_GROUP_SIZE) {
          needsRedistribution = true;
          break;
        }
      }
      
      if (needsRedistribution) {
        // Sort groups by size (ascending)
        groups.sort((a, b) => a.users.length - b.users.length);
        
        // While smallest group is below minimum, redistribute its users
        while (groups[0].users.length < MIN_GROUP_SIZE && groups.length > 1) {
          const smallestGroup = groups.shift()!;
          
          // Redistribute users from smallest group to others
          for (const user of smallestGroup.users) {
            // Find the group with fewest users
            groups.sort((a, b) => a.users.length - b.users.length);
            
            // First try to add to groups that are still within standard maximum
            let added = false;
            for (const group of groups) {
              if (group.users.length < STANDARD_MAX_GROUP_SIZE) {
                group.users.push(user);
                added = true;
                break;
              }
            }
            
            // If no groups under standard maximum, try absolute maximum
            if (!added) {
              if (groups[0].users.length < ABSOLUTE_MAX_GROUP_SIZE) {
                groups[0].users.push(user);
              } else {
                // If all groups are at absolute max capacity, create a new group
                const newGroup: DiningGroup = { 
                  users: [user], 
                  averageCompatibility: 0 
                };
                groups.push(newGroup);
              }
            }
          }
        }
        
        // Recalculate compatibility scores after redistribution
        groups.forEach(group => {
          group.averageCompatibility = this.calculateGroupCompatibility(group.users);
        });
      }
    }
    
    return groups;
  }

  /**
   * Calculates the average compatibility score within a group
   */
  private calculateGroupCompatibility(users: UserWithCompatibility[]): number {
    if (users.length <= 1) return 0;
    
    let totalScore = 0;
    let pairCount = 0;
    
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const userA = users[i];
        const userB = users[j];
        
        // Get compatibility score between these users
        const score = userA.compatibilityScores.get(userB.id) || 0;
        totalScore += score;
        pairCount++;
      }
    }
    
    return pairCount > 0 ? totalScore / pairCount : 0;
  }

  /**
   * Creates meetups from optimized groups
   * @param groups The optimized dining groups
   * @param restaurantId The restaurant ID for the meetups
   * @param date The date of the meetups
   * @param startTime Start time (e.g., "19:00")
   * @param endTime End time (e.g., "21:00")
   * @returns Array of created meetup IDs
   */
  public async createMeetupsFromGroups(
    groups: DiningGroup[],
    restaurantId: number,
    date: Date,
    startTime: string,
    endTime: string
  ): Promise<number[]> {
    const meetupIds: number[] = [];
    
    // Define constraints
    const ABSOLUTE_MAX_GROUP_SIZE = 7;  // Absolute maximum: 7 users + 1 host (rare)
    const STANDARD_MAX_GROUP_SIZE = 6;  // Standard maximum: 6 users + 1 host
    const MIN_GROUP_SIZE = 4;           // Minimum: 4 users + 1 host
    
    // Temporary collection of users who need to be reassigned
    let unassignedUsers: User[] = [];
    
    for (const group of groups) {
      if (group.users.length === 0) continue;
      
      if (groups.length === 1 || group.users.length >= MIN_GROUP_SIZE) {
        // For each valid group, determine if it's a standard or extended group
        let isExtendedGroup = false;
        let title = `Dining Experience at ${date.toLocaleDateString()}`;
        let effectiveMaxSize = STANDARD_MAX_GROUP_SIZE;
        
        // If this is a 7-person group, mark it as extended
        if (group.users.length > STANDARD_MAX_GROUP_SIZE) {
          isExtendedGroup = true;
          title += " (Extended Group)";
          effectiveMaxSize = ABSOLUTE_MAX_GROUP_SIZE;
        }
        
        // Handle the case where a group exceeds even the absolute maximum
        const subgroups: User[][] = [];
        for (let i = 0; i < group.users.length; i += effectiveMaxSize) {
          subgroups.push(group.users.slice(i, i + effectiveMaxSize));
        }
        
        for (const subgroup of subgroups) {
          if (subgroup.length === 0) continue;
          
          // Create the meetup with appropriate title and max participants
          const meetup = await storage.createMeetup({
            title: title,
            date,
            restaurantId,
            startTime,
            endTime,
            maxParticipants: isExtendedGroup ? ABSOLUTE_MAX_GROUP_SIZE : STANDARD_MAX_GROUP_SIZE,
            createdBy: subgroup[0].id,
            status: 'scheduled'
          });
          
          meetupIds.push(meetup.id);
          
          // Add all users as participants
          for (const user of subgroup) {
            await storage.addMeetupParticipant({
              meetupId: meetup.id,
              userId: user.id,
              status: 'confirmed'
            });
          }
        }
      } else {
        // Groups below minimum size - collect users for reassignment
        unassignedUsers = [...unassignedUsers, ...group.users];
      }
    }
    
    // Handle any users who were in groups below minimum size
    if (unassignedUsers.length > 0) {
      // If we have enough users to form a valid group
      if (unassignedUsers.length >= MIN_GROUP_SIZE) {
        // Create subgroups of appropriate size
        const subgroups: User[][] = [];
        
        // If we have exactly or just over minimum, create a single group
        if (unassignedUsers.length <= MIN_GROUP_SIZE + 1) {
          subgroups.push(unassignedUsers);
        } else {
          // Create optimal-sized groups from remaining users
          // Default to standard max size, but allow extended groups if needed to minimize 
          // the number of small groups
          const numGroups = Math.ceil(unassignedUsers.length / STANDARD_MAX_GROUP_SIZE);
          const baseSize = Math.floor(unassignedUsers.length / numGroups);
          let remainder = unassignedUsers.length % numGroups;
          
          let startIdx = 0;
          for (let i = 0; i < numGroups; i++) {
            const groupSize = baseSize + (remainder > 0 ? 1 : 0);
            remainder--;
            
            // Only create groups that meet minimum size
            if (groupSize >= MIN_GROUP_SIZE) {
              subgroups.push(unassignedUsers.slice(startIdx, startIdx + groupSize));
            } else if (i === numGroups - 1 && startIdx < unassignedUsers.length) {
              // Last group - add remaining users to the previous group if possible
              // Allow extended groups if needed to accommodate everyone
              if (subgroups.length > 0 && 
                  subgroups[subgroups.length - 1].length + (unassignedUsers.length - startIdx) <= ABSOLUTE_MAX_GROUP_SIZE) {
                subgroups[subgroups.length - 1] = [
                  ...subgroups[subgroups.length - 1],
                  ...unassignedUsers.slice(startIdx)
                ];
              } else {
                // Create a new group even if below minimum (better than not assigning)
                subgroups.push(unassignedUsers.slice(startIdx));
              }
            }
            
            startIdx += groupSize;
          }
        }
        
        // Create meetups for these reassigned groups
        for (const subgroup of subgroups) {
          if (subgroup.length === 0) continue;
          
          // Determine if this is an extended group
          const isExtendedGroup = subgroup.length > STANDARD_MAX_GROUP_SIZE;
          let title = `Dining Experience at ${date.toLocaleDateString()}`;
          if (isExtendedGroup) {
            title += " (Extended Group)";
          } else if (subgroup.length < MIN_GROUP_SIZE) {
            title += " (Small Group)";
          }
          
          const meetup = await storage.createMeetup({
            title: title,
            date,
            restaurantId,
            startTime,
            endTime,
            maxParticipants: isExtendedGroup ? ABSOLUTE_MAX_GROUP_SIZE : STANDARD_MAX_GROUP_SIZE,
            createdBy: subgroup[0].id,
            status: 'scheduled'
          });
          
          meetupIds.push(meetup.id);
          
          for (const user of subgroup) {
            await storage.addMeetupParticipant({
              meetupId: meetup.id,
              userId: user.id,
              status: 'confirmed'
            });
          }
        }
      } else {
        // Too few users to form even one valid group
        // Create a single group anyway - better than leaving them out
        const meetup = await storage.createMeetup({
          title: `Dining Experience at ${date.toLocaleDateString()} (Small Group)`,
          date,
          restaurantId,
          startTime,
          endTime,
          maxParticipants: STANDARD_MAX_GROUP_SIZE,
          createdBy: unassignedUsers[0].id,
          status: 'scheduled'
        });
        
        meetupIds.push(meetup.id);
        
        for (const user of unassignedUsers) {
          await storage.addMeetupParticipant({
            meetupId: meetup.id,
            userId: user.id,
            status: 'confirmed'
          });
        }
      }
    }
    
    return meetupIds;
  }
}

// Export singleton instance
export const groupFormationService = new GroupFormationService();