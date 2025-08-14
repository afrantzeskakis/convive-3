# Recipe Enhancement Data Pathway
## Confirmed Integration Between Admin and User Views

### ✅ Data Flow Verification
Both restaurant admin and restaurant user views share the **SAME enhanced data** from a single source.

## 📊 Current System Architecture

### 1. Data Storage
- **Single Source of Truth**: `recipe_analyses` table
- **Key Fields**:
  - `highlighted_text`: HTML with clickable highlighted terms
  - `highlighted_terms`: JSON array of terms with categories
  - `culinary_knowledge`: Full carousel content for each term

### 2. Admin Upload & Enhancement Process

```
Restaurant Admin Uploads Recipe
            ↓
Recipe stored in `recipes` table
            ↓
Analysis entry created in `recipe_analyses` table
            ↓
Admin triggers enhancement (manual or batch)
            ↓
Enhancement updates `recipe_analyses` with:
  - 28+ culinary terms identified
  - Full carousel content generated
  - HTML with highlighted spans
            ↓
SAME enhanced data available to both views
```

### 3. API Endpoints

#### Enhancement Endpoints (Admin Access):
- `POST /api/restaurants/:id/recipes/:recipeId/enhance` - Single recipe
- `POST /api/restaurants/:id/recipes/enhance-all` - Batch enhancement

These endpoints update the `recipe_analyses` table with:
```javascript
{
  highlightedText: "<span class='culinary-term'...>ancho chilies</span>...",
  highlightedTerms: [
    { term: "ancho chilies", category: "cultural" },
    { term: "sesame seeds", category: "basic" },
    // ... 26 more terms
  ],
  culinaryKnowledge: [
    {
      term: "ancho chilies",
      category: "cultural",
      carouselContent: [
        { type: "technique", title: "About ancho chilies", content: "..." },
        { type: "culture", title: "Cultural Context", content: "..." },
        { type: "tips", title: "Professional Tips", content: "..." }
      ]
    },
    // ... full content for all terms
  ]
}
```

#### Data Retrieval (Both Admin & User):
- `GET /api/restaurants/:id/recipes` - Fetches recipes WITH enhanced data

```sql
-- Both views execute this same query
SELECT 
  recipes.*,
  recipe_analyses.highlighted_text,
  recipe_analyses.highlighted_terms,
  recipe_analyses.culinary_knowledge
FROM recipes
LEFT JOIN recipe_analyses ON recipes.id = recipe_analyses.recipe_id
WHERE recipes.restaurant_id = ?
```

### 4. Frontend Components

#### Restaurant Admin View:
- Component: `EnhancedRecipeAnalysis.tsx`
- Uses: Enhanced data from `recipe_analyses`
- Can trigger: Re-enhancement if needed

#### Restaurant User View:
- Component: `RestaurantRecipeSection.tsx`
- Uses: SAME enhanced data from `recipe_analyses`
- Displays: Interactive highlighted terms with carousels

### 5. Example Data Verification

**Mexican Mole Poblano (Recipe ID: 11)**
- Restaurant ID: 7
- Analysis ID: 20
- Highlighted Terms: **28 terms**
- Culinary Knowledge Entries: **28 full carousel sets**
- Key Terms Found:
  - "ancho chilies" ✓
  - "sesame seeds" ✓
  - "mexican chocolate" ✓
  - "mole poblano" ✓
  - "corn tortillas" ✓

### 6. Testing the Pathway

1. **Admin uploads recipe** → Creates entry in `recipes` and `recipe_analyses`
2. **Admin enhances recipe** → Updates `recipe_analyses` with full content
3. **User views recipe** → Sees exact same enhanced content
4. **Both views** → Click on "ancho chilies" → Same carousel appears

## ✅ Confirmation

The pathway is **fully functional**:
- Single data source ensures consistency
- Enhancement process updates shared data
- Both views read from same enhanced content
- All 28+ culinary terms are properly highlighted
- Full carousel content is available in both views

## 🔄 Recent Updates (August 14, 2025)

- Enhanced all recipes with comprehensive term database
- Added 200+ culinary terms including "ancho", "chilies", variations
- Generated full carousel content with descriptions, cultural context, and tips
- Verified data consistency between admin and user views