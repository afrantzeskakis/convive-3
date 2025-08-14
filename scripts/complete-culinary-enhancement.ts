#!/usr/bin/env tsx
// Complete culinary enhancement with ALL terms including ancho, chilies, etc.

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Comprehensive culinary terms - including specific ingredients from the recipes
const CULINARY_TERMS = {
  basic: [
    // Basic ingredients
    'chicken', 'chicken breasts', 'chicken thighs', 'chicken stock', 'beef', 'pork', 'lamb', 'fish', 
    'salt', 'pepper', 'olive oil', 'oil', 'butter', 'flour', 'sugar', 'eggs',
    'garlic', 'onion', 'onions', 'celery', 'carrot', 'carrots', 'tomato', 'tomatoes',
    'mushroom', 'mushrooms', 'rice', 'pasta', 'bread', 'stock', 'broth', 'cream', 'milk', 'cheese',
    'wine', 'vinegar', 'lemon', 'herbs', 'spices', 'water',
    // Basic additions for Mexican recipe
    'sesame', 'sesame seeds', 'peanuts', 'raisins', 'chocolate', 'corn', 'tortillas', 'corn tortillas'
  ],
  
  intermediate: [
    // Cooking techniques
    'sear', 'sauté', 'saute', 'simmer', 'boil', 'steam', 'poach', 'braise', 'brown',
    'roast', 'roasted', 'bake', 'broil', 'grill', 'fry', 'toast', 'toasted',
    'blanch', 'reduce', 'deglaze', 'caramelize', 'golden', 'cook', 'blend',
    'marinate', 'season', 'dice', 'chop', 'chopped', 'mince', 'minced', 'slice',
    // Specific ingredients
    'pearl onions', 'cremini', 'cremini mushrooms', 'portobello', 'porcini', 
    'arborio', 'arborio rice', 'basmati', 'basmati rice', 'wild rice',
    'bacon', 'smoked bacon', 'pancetta', 'prosciutto',
    'parmesan', 'pecorino', 'gruyere', 'manchego',
    // Additional for recipes
    'cinnamon', 'cumin', 'paprika', 'turmeric', 'saffron', 'vanilla'
  ],
  
  advanced: [
    // Advanced techniques
    'sous vide', 'confit', 'emulsify', 'temper', 'clarify', 'render', 
    'flambe', 'flambé', 'bloom', 'proof', 'ferment',
    'roux', 'beurre blanc', 'reduction', 'coulis', 
    'brunoise', 'julienne', 'chiffonade', 'concasse',
    'mise en place', 'al dente',
    // Advanced ingredients
    'foie gras', 'truffle', 'truffles', 'caviar', 
    'duck fat', 'bone marrow', 'anchovies', 'capers',
    'crème fraîche', 'creme fraiche', 'mascarpone'
  ],
  
  cultural: [
    // French terms
    'coq au vin', 'burgundy', 'burgundy red wine', 'bordeaux', 'champagne', 'cognac',
    'bouquet garni', 'mirepoix', 'persillade', 'confit',
    'thyme', 'thyme sprigs', 'bay leaves', 'bay leaf', 'tarragon', 'herbes de provence',
    // Italian terms
    'risotto', 'risotto ai funghi', 'osso buco', 'carpaccio', 'al dente', 
    'basil', 'oregano', 'rosemary', 'sage', 'parsley',
    // Mexican terms - THIS IS KEY FOR YOUR ISSUE
    'mole', 'mole poblano', 'poblano', 'ancho', 'ancho chilies', 'ancho chiles', 
    'chipotle', 'guajillo', 'pasilla', 'habanero', 'jalapeño', 'jalapeno',
    'salsa', 'adobo', 'mexican chocolate', 'masa', 'tamales', 'enchiladas',
    // Thai/Asian terms
    'curry', 'green curry', 'red curry', 'curry paste', 'coconut milk', 'fish sauce',
    'lemongrass', 'galangal', 'kaffir lime', 'thai basil', 'cilantro', 'coriander',
    // Indian terms
    'biryani', 'chicken biryani', 'tandoori', 'tikka', 'masala', 'garam masala',
    'cardamom', 'cloves', 'star anise', 'fenugreek', 'asafoetida',
    // Additional chilies/peppers
    'chili', 'chilies', 'chiles', 'chilli', 'chillies', 'peppers', 'bell peppers'
  ]
};

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightAllTerms(text: string) {
  let highlightedText = text;
  const highlightedTerms = [];
  const culinaryKnowledge = [];
  const processedRanges = new Set();
  
  // Collect all terms with their positions
  const allMatches = [];
  
  for (const [category, terms] of Object.entries(CULINARY_TERMS)) {
    for (const term of terms) {
      // Match exact term or with common suffixes
      const regex = new RegExp(`\\b(${escapeRegex(term)})(?:s|es|ed|ing)?\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        allMatches.push({
          term: term,
          matchedText: match[0],
          category,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }
  }
  
  // Sort by length (longer terms first) then by position
  allMatches.sort((a, b) => {
    const lengthDiff = b.term.length - a.term.length;
    return lengthDiff !== 0 ? lengthDiff : a.start - b.start;
  });
  
  // Process matches, avoiding overlaps
  const usedMatches = [];
  for (const match of allMatches) {
    // Check if this range overlaps with any already processed
    let overlaps = false;
    for (const used of usedMatches) {
      if ((match.start >= used.start && match.start < used.end) ||
          (match.end > used.start && match.end <= used.end)) {
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      usedMatches.push(match);
      highlightedTerms.push({
        term: match.term,
        category: match.category
      });
      
      // Add culinary knowledge
      culinaryKnowledge.push({
        term: match.term,
        category: match.category,
        carouselContent: [
          {
            type: 'technique',
            title: `About ${match.term}`,
            content: getDetailedDescription(match.term, match.category),
            additionalInfo: 'Click to learn more about this culinary term.'
          },
          {
            type: 'culture',
            title: 'Cultural Context',
            content: getCulturalContext(match.term, match.category),
            additionalInfo: 'Understanding the cultural significance.'
          },
          {
            type: 'tips',
            title: 'Professional Tips',
            content: getProfessionalTips(match.term, match.category),
            additionalInfo: 'Expert advice for using this element.'
          }
        ]
      });
    }
  }
  
  // Sort matches by position for replacement
  usedMatches.sort((a, b) => b.start - a.start);
  
  // Replace text from end to start to maintain positions
  for (const match of usedMatches) {
    const before = highlightedText.substring(0, match.start);
    const after = highlightedText.substring(match.end);
    const highlighted = `<span class="culinary-term term-${match.category}" data-term="${match.term}" data-category="${match.category}">${match.matchedText}</span>`;
    highlightedText = before + highlighted + after;
  }
  
  return { highlightedText, highlightedTerms, culinaryKnowledge };
}

function getDetailedDescription(term: string, category: string) {
  const descriptions = {
    'ancho': 'Ancho chilies are dried poblano peppers with a sweet, mild heat and rich, fruity flavor reminiscent of raisins and chocolate.',
    'ancho chilies': 'Dried poblano peppers that form the backbone of many Mexican sauces, providing deep color, mild heat, and complex sweet-smoky flavors.',
    'ancho chiles': 'The dried form of poblano peppers, essential in mole and other traditional Mexican dishes for their distinctive sweet heat.',
    'chilies': 'Peppers that add heat, flavor, and color to dishes. Different varieties offer unique flavor profiles from mild to extremely hot.',
    'chiles': 'The Spanish term for peppers, ranging from mild bell peppers to fiery habaneros, each contributing distinct flavors.',
    'mole': 'A complex Mexican sauce traditionally containing 20+ ingredients including chilies, chocolate, nuts, and spices, representing the pinnacle of Mexican cuisine.',
    'mole poblano': 'The most famous mole from Puebla, Mexico, featuring a rich blend of chilies, chocolate, and spices creating a savory-sweet sauce.',
    'mexican chocolate': 'Chocolate mixed with cinnamon and sometimes other spices, traditionally used in mole and hot chocolate, adding depth without sweetness.',
    'sesame seeds': 'Nutty seeds that add texture and rich flavor, commonly toasted to enhance their taste in both Asian and Mexican cuisines.',
    'tortillas': 'Flat breads made from corn or wheat, fundamental to Mexican cuisine as both a utensil and food wrapper.',
    'corn tortillas': 'Traditional Mexican flatbreads made from masa (corn dough), providing authentic flavor and gluten-free option.'
  };
  
  const lowerTerm = term.toLowerCase();
  return descriptions[lowerTerm] || 
    `${term} is ${category === 'basic' ? 'a fundamental ingredient' : 
     category === 'intermediate' ? 'an important technique or ingredient' : 
     category === 'advanced' ? 'an advanced culinary element' : 
     'a culturally significant element'} that adds distinctive character to this dish.`;
}

function getCulturalContext(term: string, category: string) {
  const cultural = {
    'ancho': 'Central to Mexican cuisine, ancho chilies represent the transformation of fresh poblanos through drying, intensifying their flavors.',
    'mole': 'Often called the national dish of Mexico, mole represents the blending of indigenous and European ingredients after the conquest.',
    'mexican chocolate': 'Dating to Aztec and Mayan civilizations, Mexican chocolate was originally a bitter ceremonial drink before becoming a mole ingredient.'
  };
  
  return cultural[term.toLowerCase()] || 
    `${term} plays an important role in culinary traditions, contributing authentic flavors and techniques.`;
}

function getProfessionalTips(term: string, category: string) {
  const tips = {
    'ancho': 'Toast anchos lightly before rehydrating to intensify flavor. Save the soaking liquid - it\'s full of flavor for your sauce.',
    'mole': 'Balance is key - taste frequently and adjust sweet, spicy, and savory elements. Let mole rest overnight to develop deeper flavors.',
    'sesame seeds': 'Toast until golden and fragrant but watch carefully - they burn quickly. Cool completely before grinding.'
  };
  
  return tips[term.toLowerCase()] || 
    `When working with ${term}, pay attention to quality and freshness for the best results in your dish.`;
}

async function enhanceAllRecipes() {
  console.log('Starting complete culinary enhancement with all terms...');
  
  const recipes = await sql`
    SELECT 
      r.id,
      r.name,
      r.recipe_text,
      ra.id as analysis_id
    FROM recipes r
    JOIN recipe_analyses ra ON r.id = ra.recipe_id
    WHERE r.restaurant_id = 7
    AND r.recipe_text IS NOT NULL
    ORDER BY r.id
  `;
  
  console.log(`Enhancing ${recipes.length} recipes with comprehensive term database`);
  
  for (const recipe of recipes) {
    console.log(`\nProcessing: ${recipe.name}`);
    
    const { highlightedText, highlightedTerms, culinaryKnowledge } = highlightAllTerms(recipe.recipe_text);
    
    if (highlightedTerms.length > 0) {
      // Remove duplicates from terms
      const uniqueTerms = [];
      const seenTerms = new Set();
      for (const term of highlightedTerms) {
        if (!seenTerms.has(term.term)) {
          seenTerms.add(term.term);
          uniqueTerms.push(term);
        }
      }
      
      await sql`
        UPDATE recipe_analyses
        SET 
          highlighted_text = ${highlightedText},
          highlighted_terms = ${JSON.stringify(uniqueTerms)},
          culinary_knowledge = ${JSON.stringify(culinaryKnowledge.filter((k, i, arr) => 
            arr.findIndex(x => x.term === k.term) === i
          ))},
          updated_at = NOW()
        WHERE id = ${recipe.analysis_id}
      `;
      
      console.log(`✓ Enhanced with ${uniqueTerms.length} unique highlighted terms`);
      
      // Show which important terms were found
      const importantTerms = uniqueTerms.filter(t => 
        ['ancho', 'chilies', 'mole', 'sesame', 'tortillas', 'burgundy', 'risotto', 'porcini', 'curry', 'biryani'].some(
          important => t.term.toLowerCase().includes(important)
        )
      );
      if (importantTerms.length > 0) {
        console.log(`  Key terms found: ${importantTerms.map(t => t.term).join(', ')}`);
      }
    }
  }
  
  console.log('\n✓ Complete enhancement finished!');
}

enhanceAllRecipes().catch(console.error);