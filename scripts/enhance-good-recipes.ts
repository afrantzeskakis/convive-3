#!/usr/bin/env tsx
// Script to enhance recipes with good data that don't have highlighting

import { neon } from '@neondatabase/serverless';
import { CulinaryKnowledgeService } from '../server/services/culinary-knowledge-service';

const sql = neon(process.env.DATABASE_URL!);
const culinaryService = new CulinaryKnowledgeService();

async function enhanceGoodRecipes() {
  console.log('Finding recipes with good data but no highlighting...');
  
  // Get all recipes that have good data but no highlighting
  const recipesToEnhance = await sql`
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
    AND r.id IN (1, 2, 5, 7, 8, 9, 10, 11)  -- Good recipes without corruption
    ORDER BY r.id
  `;
  
  console.log(`Found ${recipesToEnhance.length} recipes to enhance`);
  
  for (const recipe of recipesToEnhance) {
    console.log(`\nEnhancing: ${recipe.name}`);
    
    try {
      // Extract culinary terms from the recipe text
      const terms = await culinaryService.extractCulinaryTerms(recipe.recipe_text);
      console.log(`Found ${terms.length} culinary terms`);
      
      if (terms.length > 0) {
        // Generate highlighted HTML
        const highlightedText = await culinaryService.generateHighlightedText(recipe.recipe_text, terms);
        
        // Generate carousel content for each term
        const culinaryKnowledge = [];
        for (const term of terms) {
          const carouselContent = await culinaryService.generateCarouselContent(term.term, term.category);
          culinaryKnowledge.push({
            term: term.term,
            category: term.category,
            carouselContent
          });
        }
        
        // Update the database
        await sql`
          UPDATE recipe_analyses
          SET 
            highlighted_text = ${highlightedText},
            highlighted_terms = ${JSON.stringify(terms)},
            culinary_knowledge = ${JSON.stringify(culinaryKnowledge)},
            updated_at = NOW()
          WHERE id = ${recipe.analysis_id}
        `;
        
        console.log(`✓ Enhanced with ${terms.length} highlighted terms`);
      } else {
        console.log('✗ No terms found to highlight');
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`Error enhancing recipe ${recipe.id}:`, error);
    }
  }
  
  console.log('\n✓ Enhancement complete!');
}

enhanceGoodRecipes().catch(console.error);