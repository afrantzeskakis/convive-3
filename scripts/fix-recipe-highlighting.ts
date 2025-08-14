#!/usr/bin/env tsx
// Direct fix to add highlighting to properly formatted recipes

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Common culinary terms to highlight in recipes
const CULINARY_TERMS = {
  basic: ['chicken', 'salt', 'pepper', 'olive oil', 'garlic', 'onions', 'butter', 'flour', 'stock', 'tomato', 'bacon', 'mushrooms', 'rice', 'pasta', 'beef', 'pork'],
  intermediate: ['sear', 'saute', 'simmer', 'reduce', 'caramelize', 'deglaze', 'braise', 'roast', 'blanch', 'marinate', 'julienne', 'dice', 'mince', 'chiffonade'],
  advanced: ['sous vide', 'confit', 'emulsify', 'temper', 'clarify', 'render', 'cure', 'brine', 'fold', 'proof', 'bloom', 'fond', 'roux', 'mirepoix'],
  cultural: ['risotto', 'biryani', 'mole', 'coq au vin', 'burgundy', 'arborio', 'basmati', 'porcini', 'thyme', 'bay leaves', 'saffron', 'curry', 'masala', 'poblano']
};

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightTermsInText(text: string) {
  let highlightedText = text;
  const highlightedTerms = [];
  const culinaryKnowledge = [];
  
  for (const [category, terms] of Object.entries(CULINARY_TERMS)) {
    for (const term of terms) {
      const regex = new RegExp(`\\b(${escapeRegex(term)})s?\\b`, 'gi');
      if (regex.test(text)) {
        highlightedTerms.push({ term, category });
        
        // Add highlighting HTML
        highlightedText = highlightedText.replace(regex, (match) => {
          return `<span class="culinary-term term-${category}" data-term="${term}" data-category="${category}">${match}</span>`;
        });
        
        // Add carousel content
        culinaryKnowledge.push({
          term,
          category,
          carouselContent: [
            {
              type: 'technique',
              title: `About ${term}`,
              content: `${term} is an important culinary element in this recipe.`,
              additionalInfo: 'Click to learn more about this term.'
            }
          ]
        });
      }
    }
  }
  
  return { highlightedText, highlightedTerms, culinaryKnowledge };
}

async function fixRecipeHighlighting() {
  console.log('Fixing recipe highlighting for good recipes...');
  
  // Get recipes with good data but no highlighting
  const recipes = await sql`
    SELECT 
      r.id,
      r.name,
      r.recipe_text,
      ra.id as analysis_id
    FROM recipes r
    JOIN recipe_analyses ra ON r.id = ra.recipe_id
    WHERE r.restaurant_id = 7
    AND ra.highlighted_text IS NULL
    AND r.recipe_text IS NOT NULL
    AND r.id IN (1, 2, 5, 7, 8, 9, 10, 11)
    ORDER BY r.id
  `;
  
  console.log(`Found ${recipes.length} recipes to fix`);
  
  for (const recipe of recipes) {
    console.log(`\nProcessing: ${recipe.name}`);
    
    const { highlightedText, highlightedTerms, culinaryKnowledge } = highlightTermsInText(recipe.recipe_text);
    
    if (highlightedTerms.length > 0) {
      await sql`
        UPDATE recipe_analyses
        SET 
          highlighted_text = ${highlightedText},
          highlighted_terms = ${JSON.stringify(highlightedTerms)},
          culinary_knowledge = ${JSON.stringify(culinaryKnowledge)},
          updated_at = NOW()
        WHERE id = ${recipe.analysis_id}
      `;
      
      console.log(`✓ Added ${highlightedTerms.length} highlighted terms`);
    }
  }
  
  console.log('\n✓ Highlighting fixed!');
}

fixRecipeHighlighting().catch(console.error);