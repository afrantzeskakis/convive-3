import { DatabaseStorage } from "../database-storage";
import { User, MatchScore } from "../../shared/schema";
import { compatibilityCalculator } from "./compatibility-calculator";

const storage = new DatabaseStorage();

interface UserWithCompatibility extends User {
  compatibilityScores: Map<number, number>;
}

interface DiningGroup {
  users: UserWithCompatibility[];
  averageCompatibility: number;
}

export class GroupFormationService {
  public async formOptimalGroups(userIds: number[]): Promise<DiningGroup[]> {
    if (userIds.length === 0) {
      return [];
    }

    const usersWithCompatibility = await this.buildCompatibilityMatrix(userIds);
    
    const numGroups = Math.ceil(userIds.length / 6);
    
    let groups = this.formInitialBalancedGroups(usersWithCompatibility, numGroups);
    
    groups = this.optimizeGroupCompatibility(groups, usersWithCompatibility);
    
    return groups;
  }

  private async buildCompatibilityMatrix(userIds: number[]): Promise<UserWithCompatibility[]> {
    const result: UserWithCompatibility[] = [];
    let incompleteMatchCount = 0;
    let completeMatchCount = 0;
    
    const users: User[] = [];
    for (const userId of userIds) {
      const user = await storage.getUser(userId);
      if (user) {
        users.push(user);
      }
    }
    
    for (const user of users) {
      const compatibilityScores = new Map<number, number>();
      
      for (const otherUser of users) {
        if (user.id === otherUser.id) continue;
        
        const breakdown = await compatibilityCalculator.calculateDetailedCompatibility(user.id, otherUser.id);
        compatibilityScores.set(otherUser.id, breakdown.totalScore);
        
        if (breakdown.isComplete) {
          completeMatchCount++;
        } else {
          incompleteMatchCount++;
          console.log(`[GroupFormation] Incomplete match data: User ${user.id} <-> User ${otherUser.id}: ${breakdown.missingDataReason}`);
        }
      }
      
      result.push({
        ...user,
        compatibilityScores
      });
    }
    
    const totalPairs = completeMatchCount + incompleteMatchCount;
    if (totalPairs > 0) {
      const completionRate = Math.round((completeMatchCount / totalPairs) * 100);
      console.log(`[GroupFormation] Compatibility matrix built: ${completeMatchCount}/${totalPairs} pairs have complete data (${completionRate}%)`);
      
      if (incompleteMatchCount > 0) {
        console.log(`[GroupFormation] Warning: ${incompleteMatchCount} pairs using fallback scores due to missing questionnaire data`);
      }
    }
    
    return result;
  }

  private formInitialBalancedGroups(
    users: UserWithCompatibility[], 
    numGroups: number
  ): DiningGroup[] {
    const ABSOLUTE_MAX_GROUP_SIZE = 7;
    const STANDARD_MAX_GROUP_SIZE = 6;
    const MIN_GROUP_SIZE = 4;
    const TARGET_GROUP_SIZE = 5.5;
    
    const totalUsers = users.length;
    
    let calculatedNumGroups = Math.ceil(totalUsers / TARGET_GROUP_SIZE);
    
    if (totalUsers / calculatedNumGroups > STANDARD_MAX_GROUP_SIZE + 0.5) {
      calculatedNumGroups = Math.ceil(totalUsers / STANDARD_MAX_GROUP_SIZE);
    }
    
    if (calculatedNumGroups > 1 && totalUsers / calculatedNumGroups < MIN_GROUP_SIZE) {
      const minNumGroups = Math.ceil(totalUsers / ABSOLUTE_MAX_GROUP_SIZE);
      calculatedNumGroups = Math.max(minNumGroups, Math.floor(totalUsers / MIN_GROUP_SIZE));
    }
    
    const groups: DiningGroup[] = Array(calculatedNumGroups)
      .fill(null)
      .map(() => ({ users: [], averageCompatibility: 0 }));
    
    if (totalUsers < MIN_GROUP_SIZE) {
      const singleGroup: DiningGroup = { users: [], averageCompatibility: 0 };
      users.forEach(user => singleGroup.users.push(user));
      singleGroup.averageCompatibility = this.calculateGroupCompatibility(singleGroup.users);
      return [singleGroup];
    }
    
    const baseSize = Math.floor(totalUsers / calculatedNumGroups);
    let remainder = totalUsers % calculatedNumGroups;
    
    let userIndex = 0;
    
    for (let i = 0; i < calculatedNumGroups; i++) {
      let targetSize = baseSize;
      if (remainder > 0) {
        targetSize++;
        remainder--;
      }
      
      for (let j = 0; j < targetSize && userIndex < users.length; j++) {
        groups[i].users.push(users[userIndex]);
        userIndex++;
      }
    }
    
    if (groups.length > 1) {
      groups.sort((a, b) => a.users.length - b.users.length);
      
      while (groups[0].users.length < MIN_GROUP_SIZE && groups.length > 1) {
        const smallestGroup = groups.shift()!;
        
        for (const user of smallestGroup.users) {
          groups.sort((a, b) => a.users.length - b.users.length);
          
          if (groups[0].users.length < ABSOLUTE_MAX_GROUP_SIZE) {
            groups[0].users.push(user);
          } else {
            const newGroup: DiningGroup = { users: [user], averageCompatibility: 0 };
            groups.push(newGroup);
          }
        }
        
        groups.sort((a, b) => a.users.length - b.users.length);
      }
    }
    
    groups.forEach(group => {
      group.averageCompatibility = this.calculateGroupCompatibility(group.users);
    });
    
    return groups;
  }

  private optimizeGroupCompatibility(
    groups: DiningGroup[],
    allUsers: UserWithCompatibility[]
  ): DiningGroup[] {
    const MAX_ITERATIONS = 100;
    let improved = true;
    let iteration = 0;
    
    const ABSOLUTE_MAX_GROUP_SIZE = 7;
    const STANDARD_MAX_GROUP_SIZE = 6;
    const MIN_GROUP_SIZE = 4;
    
    while (improved && iteration < MAX_ITERATIONS) {
      improved = false;
      iteration++;
      
      for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
          const groupA = groups[i];
          const groupB = groups[j];
          
          if (Math.abs(groupA.users.length - groupB.users.length) > 1) {
            continue;
          }
          
          for (let a = 0; a < groupA.users.length; a++) {
            for (let b = 0; b < groupB.users.length; b++) {
              const userA = groupA.users[a];
              const userB = groupB.users[b];
              
              const newSizeA = groupA.users.length;
              const newSizeB = groupB.users.length;
              
              if (newSizeA > ABSOLUTE_MAX_GROUP_SIZE || newSizeB > ABSOLUTE_MAX_GROUP_SIZE) {
                continue;
              }
              
              let requiresSignificantImprovement = false;
              if (newSizeA > STANDARD_MAX_GROUP_SIZE || newSizeB > STANDARD_MAX_GROUP_SIZE) {
                requiresSignificantImprovement = true;
              }
              
              if (groups.length > 1 && (newSizeA < MIN_GROUP_SIZE || newSizeB < MIN_GROUP_SIZE)) {
                continue;
              }
              
              const currentCompatA = this.calculateGroupCompatibility(groupA.users);
              const currentCompatB = this.calculateGroupCompatibility(groupB.users);
              const currentTotalCompat = currentCompatA + currentCompatB;
              
              const newGroupA = [...groupA.users];
              const newGroupB = [...groupB.users];
              newGroupA[a] = userB;
              newGroupB[b] = userA;
              
              const newCompatA = this.calculateGroupCompatibility(newGroupA);
              const newCompatB = this.calculateGroupCompatibility(newGroupB);
              const newTotalCompat = newCompatA + newCompatB;
              
              const compatImprovement = (newTotalCompat - currentTotalCompat) / currentTotalCompat;
              if (requiresSignificantImprovement && compatImprovement < 0.20) {
                continue;
              }
              
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
    
    if (groups.length > 1) {
      let needsRedistribution = false;
      
      for (const group of groups) {
        if (group.users.length < MIN_GROUP_SIZE) {
          needsRedistribution = true;
          break;
        }
      }
      
      if (needsRedistribution) {
        groups.sort((a, b) => a.users.length - b.users.length);
        
        while (groups[0].users.length < MIN_GROUP_SIZE && groups.length > 1) {
          const smallestGroup = groups.shift()!;
          
          for (const user of smallestGroup.users) {
            groups.sort((a, b) => a.users.length - b.users.length);
            
            let added = false;
            for (const group of groups) {
              if (group.users.length < STANDARD_MAX_GROUP_SIZE) {
                group.users.push(user);
                added = true;
                break;
              }
            }
            
            if (!added) {
              if (groups[0].users.length < ABSOLUTE_MAX_GROUP_SIZE) {
                groups[0].users.push(user);
              } else {
                const newGroup: DiningGroup = { 
                  users: [user], 
                  averageCompatibility: 0 
                };
                groups.push(newGroup);
              }
            }
          }
        }
        
        groups.forEach(group => {
          group.averageCompatibility = this.calculateGroupCompatibility(group.users);
        });
      }
    }
    
    return groups;
  }

  private calculateGroupCompatibility(users: UserWithCompatibility[]): number {
    if (users.length <= 1) return 0;
    
    let totalScore = 0;
    let pairCount = 0;
    
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const userA = users[i];
        const userB = users[j];
        
        const score = userA.compatibilityScores.get(userB.id) || 0;
        totalScore += score;
        pairCount++;
      }
    }
    
    return pairCount > 0 ? totalScore / pairCount : 0;
  }

  public async createMeetupsFromGroups(
    groups: DiningGroup[],
    restaurantId: number,
    date: Date,
    startTime: string,
    endTime: string
  ): Promise<number[]> {
    const meetupIds: number[] = [];
    
    const ABSOLUTE_MAX_GROUP_SIZE = 7;
    const STANDARD_MAX_GROUP_SIZE = 6;
    const MIN_GROUP_SIZE = 4;
    
    let unassignedUsers: User[] = [];
    
    for (const group of groups) {
      if (group.users.length === 0) continue;
      
      if (groups.length === 1 || group.users.length >= MIN_GROUP_SIZE) {
        let isExtendedGroup = false;
        let title = `Dining Experience at ${date.toLocaleDateString()}`;
        let effectiveMaxSize = STANDARD_MAX_GROUP_SIZE;
        
        if (group.users.length > STANDARD_MAX_GROUP_SIZE) {
          isExtendedGroup = true;
          title += " (Extended Group)";
          effectiveMaxSize = ABSOLUTE_MAX_GROUP_SIZE;
        }
        
        const subgroups: User[][] = [];
        for (let i = 0; i < group.users.length; i += effectiveMaxSize) {
          subgroups.push(group.users.slice(i, i + effectiveMaxSize));
        }
        
        for (const subgroup of subgroups) {
          if (subgroup.length === 0) continue;
          
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
        unassignedUsers = [...unassignedUsers, ...group.users];
      }
    }
    
    if (unassignedUsers.length > 0) {
      if (unassignedUsers.length >= MIN_GROUP_SIZE) {
        const subgroups: User[][] = [];
        
        if (unassignedUsers.length <= MIN_GROUP_SIZE + 1) {
          subgroups.push(unassignedUsers);
        } else {
          const numGroups = Math.ceil(unassignedUsers.length / STANDARD_MAX_GROUP_SIZE);
          const baseSize = Math.floor(unassignedUsers.length / numGroups);
          let remainder = unassignedUsers.length % numGroups;
          
          let startIdx = 0;
          for (let i = 0; i < numGroups; i++) {
            const groupSize = baseSize + (remainder > 0 ? 1 : 0);
            remainder--;
            
            if (groupSize >= MIN_GROUP_SIZE) {
              subgroups.push(unassignedUsers.slice(startIdx, startIdx + groupSize));
            } else if (i === numGroups - 1 && startIdx < unassignedUsers.length) {
              if (subgroups.length > 0 && 
                  subgroups[subgroups.length - 1].length + (unassignedUsers.length - startIdx) <= ABSOLUTE_MAX_GROUP_SIZE) {
                subgroups[subgroups.length - 1] = [
                  ...subgroups[subgroups.length - 1],
                  ...unassignedUsers.slice(startIdx)
                ];
              } else {
                subgroups.push(unassignedUsers.slice(startIdx));
              }
            }
            
            startIdx += groupSize;
          }
        }
        
        for (const subgroup of subgroups) {
          if (subgroup.length === 0) continue;
          
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

export const groupFormationService = new GroupFormationService();
