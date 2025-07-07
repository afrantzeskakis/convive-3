# Group Formation Algorithm Specification

## Overview
The Convive (Come·Vibe) group formation algorithm optimizes dining groups by balancing table sizes and maximizing social compatibility. This document outlines the core principles, constraints, and implementation of the algorithm.

## Group Size Constraints
- **Target Size**: 5-6 regular users + 1 host per table
- **Minimum Size**: 4 regular users + 1 host per table
- **Maximum Size**: 7 regular users + 1 host per table (only when necessary)

## Optimization Priorities
1. **Balance**: Group sizes should be as evenly distributed as possible, with no more than 1 person difference between the smallest and largest groups when multiple groups are formed
2. **Compatibility**: Within balanced groups, members should be matched based on compatibility scores 
3. **Efficient Resources**: The algorithm aims to minimize the number of groups while respecting size constraints

## Algorithm Phases

### Phase 1: Initial Distribution
1. Calculate the ideal number of groups based on target size (5-6 users)
2. Adjust the number of groups if needed to meet minimum/maximum constraints
3. Distribute users evenly across groups (within 1 person difference)
4. Ensure no group is below the minimum size (4 users) or above the maximum (7 users)

### Phase 2: Compatibility Optimization
1. Calculate compatibility scores between all users
2. Attempt to swap users between groups to improve overall compatibility
3. Only approve swaps that maintain group size balance (±1 person)
4. Apply stricter rules for oversized groups (7 users):
   - Only approve creating a 7-person group when compatibility improvement is significant (>20%)
   - Never allow more than one 7-person group unless absolutely necessary

## Implementation Details

### Group Size Calculation Logic
```javascript
// Start with target size and adjust as needed
let numGroups = Math.ceil(totalUsers / 5.5);
    
// Add more groups if standard maximum would be exceeded by too much
if (totalUsers / numGroups > 6.5) {
  numGroups = Math.ceil(totalUsers / 6);
}
    
// Reduce groups if they would be too small
if (numGroups > 1 && totalUsers / numGroups < 4) {
  numGroups = Math.floor(totalUsers / 4);
}
```

### Example Results

| User Count | Groups Formed (+ 1 host per group) | Notes |
|------------|-----------------------------------|-------|
| 4          | [4]                               | Minimum size |
| 5-6        | [5-6]                             | Ideal size |
| 7          | [7]                               | Maximum size |
| 8-10       | [4,4] → [4,5] → [5,5]             | Balanced small groups |
| 11         | [5,6]                             | Balanced standard groups |
| 12-14      | [4,4,4] → [4,4,5] → [4,5,5]       | Small but balanced |
| 15-16      | [5,5,5] → [5,5,6]                 | Ideal distribution |
| 20-22      | [5,5,5,5] → [5,5,5,6] → [5,5,6,6] | Perfect balance |
| 64         | Twelve groups (5's and 6's)       | Scales efficiently |

## Practical Considerations

### Host Assignment
- Each group always has exactly 1 host in addition to the regular users
- Hosts are not part of the group formation algorithm
- Hosts are assigned after groups are formed based on restaurant availability

### Limiting Oversized Groups
The algorithm strongly discourages 7-person groups by:
1. Only forming them when necessary to maintain minimum group size elsewhere
2. Requiring significantly higher compatibility scores to justify oversized groups
3. Always attempting to redistribute users from 7-person groups during optimization

### Edge Cases
- For fewer than 4 users, a single small group is created
- For very large user pools, the algorithm maintains balance while scaling efficiently

## Testing
The algorithm has been validated against multiple test cases covering various user counts from 4 to 64, demonstrating optimal group formation in all scenarios.