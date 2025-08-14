#!/usr/bin/env tsx
// Use the existing CulinaryKnowledgeService to properly enhance recipes

import { neon } from '@neondatabase/serverless';
import { db } from '../server/db';
import { recipes, recipeAnalyses } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);

// Import and use the service with proper module handling
async function enhanceWithCulinaryService() {
  const { CulinaryKnowledgeService } = await import('../server/services/culinary-knowledge-service');
  const service = new CulinaryKnowledgeService();
  
  console.log('Using CulinaryKnowledgeService to enhance recipes...');
  
  // Get all recipes from restaurant 7
  const recipesToEnhance = await sql`
    SELECT 
      r.id,
      r.name,
      r.recipe_text,
      ra.id as analysis_id
    FROM recipes r
    JOIN recipe_analyses ra ON r.id = ra.recipe_id
    WHERE r.restaurant_id = 7
    AND r.recipe_text IS NOT NULL
    AND r.id NOT IN (4, 6)  -- Skip corrupted recipes
    ORDER BY r.id
  `;
  
  console.log(`Found ${recipesToEnhance.length} recipes to enhance with culinary service`);
  
  for (const recipe of recipesToEnhance) {
    console.log(`\nProcessing: ${recipe.name}`);
    
    try {
      // Extract culinary terms using the service
      const terms = await service.extractCulinaryTerms(recipe.recipe_text);
      console.log(`Extracted ${terms.length} culinary terms`);
      
      if (terms.length > 0) {
        // Generate highlighted text
        const highlightedText = await service.generateHighlightedText(recipe.recipe_text, terms);
        
        // Batch process terms to get carousel content
        const termsMap = await service.batchProcessTerms(
          terms.map(t => t.term),
          7 // restaurant ID
        );
        
        // Build culinary knowledge array with proper carousel content
        const culinaryKnowledge = [];
        for (const term of terms) {
          const carouselContent = termsMap.get(term.term) || [];
          culinaryKnowledge.push({
            term: term.term,
            category: term.category,
            carouselContent
          });
        }
        
        console.log(`Generated carousel content for ${culinaryKnowledge.length} terms`);
        
        // Update the database with comprehensive knowledge
        await sql`
          UPDATE recipe_analyses
          SET 
            highlighted_text = ${highlightedText},
            highlighted_terms = ${JSON.stringify(terms)},
            culinary_knowledge = ${JSON.stringify(culinaryKnowledge)},
            updated_at = NOW()
          WHERE id = ${recipe.analysis_id}
        `;
        
        console.log(`✓ Enhanced with comprehensive culinary knowledge`);
        
        // Log some example terms that were found
        const sampleTerms = terms.slice(0, 5).map(t => t.term);
        console.log(`  Sample terms: ${sampleTerms.join(', ')}`);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`Error enhancing recipe ${recipe.id}:`, error);
    }
  }
  
  console.log('\n✓ Comprehensive enhancement complete!');
}

enhanceWithCulinaryService().catch(console.error);