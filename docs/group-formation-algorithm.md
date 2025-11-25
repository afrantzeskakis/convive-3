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

## Compatibility Score Calculation

The compatibility score between two users is calculated using a weighted algorithm based on their questionnaire responses. The algorithm considers 5 dimensions:

### Dimension Weights
| Dimension | Weight | Description |
|-----------|--------|-------------|
| Social Compatibility | 35% | Conversation topics, style, personality traits, meetup goals |
| Dining Preferences | 25% | Cuisine preferences, price range, noise level, ambiance |
| Shared Interests | 20% | Personal interests and hobbies overlap |
| Practical Compatibility | 15% | Dietary restrictions, drink preferences, group size, frequency |
| Atmosphere Preferences | 5% | Music, seating, lighting preferences |

### Social Compatibility (35%)
Evaluates how well two users would interact socially:
- **Conversation Topics**: Overlap in preferred discussion subjects (Travel, Food, Art, etc.)
- **Conversation Style**: Complementary styles get a bonus (Listener + Talker = synergy)
- **Personality Traits**: Overlap in self-identified traits (Outgoing, Creative, etc.)
- **Meetup Goals**: Aligned goals (both seeking friends) = bonus; conflicting goals = penalty

### Dining Preferences (25%)
Evaluates alignment in restaurant preferences:
- **Cuisine Preferences**: Overlap in preferred cuisine types
- **Price Range**: Same range = full points; 1-tier difference = partial; 2+ tiers = penalty
- **Noise Level**: Adjacent preferences (Moderate/Lively) are acceptable
- **Ambiance**: Overlap in preferred restaurant vibes

### Shared Interests (20%)
Simple overlap calculation of personal interests and hobbies selected during onboarding.

### Practical Compatibility (15%)
Evaluates logistical alignment:
- **Dietary Restrictions**: Conflicting needs (Vegan + Meat-lover) = penalty
- **Drink Preferences**: Non-alcoholic vs alcoholic preferences
- **Group Size Preference**: Similar preferences for intimate vs large gatherings
- **Meetup Frequency**: How often users want to attend events

### Atmosphere Preferences (5%)
Low-weight matching of:
- Music preferences (Jazz, Classical, No music, etc.)
- Seating preferences (Booth, Table, etc.)
- Lighting preferences (Dim, Bright, Natural)

## Special Matching Logic

### Complementary Styles Bonus
When one user prefers listening and another prefers talking, they receive a compatibility bonus as these styles complement each other well in conversation.

### Deal-Breaker Detection
Certain preference combinations result in penalties:
- Vegan + Meat-lover dietary preferences
- Vegetarian + Meat-lover dietary preferences
- Kosher/Halal + Pork preferences

### Missing Data Handling
When a user hasn't completed the questionnaire:
- Score defaults to 50 (neutral baseline)
- The system logs which users are missing data
- Group formation continues but with reduced matching accuracy
- Metrics track incomplete match rates

## Algorithm Phases

### Phase 1: Build Compatibility Matrix
1. Fetch all users' questionnaire data from the database
2. Calculate pairwise compatibility scores using the weighted algorithm
3. Log completion rates and identify users with missing data

### Phase 2: Initial Distribution
1. Calculate the ideal number of groups based on target size (5-6 users)
2. Adjust the number of groups if needed to meet minimum/maximum constraints
3. Distribute users evenly across groups (within 1 person difference)
4. Ensure no group is below the minimum size (4 users) or above the maximum (7 users)

### Phase 3: Compatibility Optimization
1. Attempt to swap users between groups to improve overall compatibility
2. Only approve swaps that maintain group size balance (±1 person)
3. Apply stricter rules for oversized groups (7 users):
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
- For users without questionnaire data, a neutral baseline score is used

## Testing
The algorithm has been validated against multiple test cases covering various user counts from 4 to 64, demonstrating optimal group formation in all scenarios.
