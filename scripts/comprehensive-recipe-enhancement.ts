#!/usr/bin/env tsx
// Comprehensive recipe enhancement with full culinary term database

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Comprehensive culinary terms database
const CULINARY_TERMS = {
  basic: [
    // Basic ingredients
    'chicken', 'beef', 'pork', 'lamb', 'fish', 'shrimp', 'bacon', 
    'salt', 'pepper', 'olive oil', 'butter', 'flour', 'sugar', 'eggs',
    'garlic', 'onion', 'onions', 'shallot', 'shallots', 'celery', 'carrot', 'carrots',
    'tomato', 'tomatoes', 'potato', 'potatoes', 'mushroom', 'mushrooms',
    'rice', 'pasta', 'bread', 'stock', 'broth', 'cream', 'milk', 'cheese',
    'wine', 'vinegar', 'lemon', 'lime', 'orange', 'herbs', 'spices',
    // Basic cooking terms
    'cook', 'heat', 'stir', 'mix', 'add', 'pour', 'serve', 'garnish',
    'season', 'taste', 'adjust', 'combine', 'blend', 'whisk', 'fold'
  ],
  
  intermediate: [
    // Cooking techniques
    'sear', 'sauté', 'saute', 'simmer', 'boil', 'steam', 'poach', 'braise',
    'roast', 'bake', 'broil', 'grill', 'fry', 'deep-fry', 'pan-fry', 'stir-fry',
    'blanch', 'parboil', 'reduce', 'deglaze', 'caramelize', 'brown', 'golden',
    'marinate', 'brine', 'cure', 'smoke', 'char', 'blacken', 'singe',
    // Preparation techniques
    'dice', 'chop', 'mince', 'julienne', 'chiffonade', 'slice', 'shred', 'grate',
    'peel', 'core', 'seed', 'devein', 'butterfly', 'pound', 'tenderize',
    'zest', 'juice', 'strain', 'sift', 'knead', 'proof', 'rest',
    // Specific ingredients
    'pearl onions', 'cremini', 'portobello', 'shiitake', 'porcini', 'chanterelle',
    'arborio', 'basmati', 'jasmine', 'wild rice', 'quinoa', 'couscous',
    'prosciutto', 'pancetta', 'chorizo', 'andouille', 'kielbasa',
    'parmesan', 'pecorino', 'gruyere', 'manchego', 'gorgonzola', 'brie'
  ],
  
  advanced: [
    // Advanced techniques
    'sous vide', 'confit', 'emulsify', 'temper', 'clarify', 'render', 
    'flambe', 'flambé', 'bloom', 'proof', 'ferment', 'pickle', 'preserve',
    'roux', 'beurre blanc', 'beurre noisette', 'liaison', 'monte au beurre',
    'fond', 'jus', 'velouté', 'velout', 'bechamel', 'béchamel', 'hollandaise',
    'reduction', 'gastrique', 'coulis', 'compote', 'chutney', 'relish',
    'brunoise', 'batonnet', 'paysanne', 'tournée', 'tourne', 'concasse',
    'quenelle', 'chinois', 'mandoline', 'spider', 'mise en place',
    // Advanced ingredients
    'foie gras', 'truffle', 'truffles', 'caviar', 'saffron', 'vanilla bean',
    'duck fat', 'bone marrow', 'anchovies', 'capers', 'cornichons',
    'crème fraîche', 'creme fraiche', 'mascarpone', 'ricotta', 'burrata'
  ],
  
  cultural: [
    // French terms
    'coq au vin', 'burgundy', 'bordeaux', 'champagne', 'cognac', 'armagnac',
    'bouquet garni', 'mirepoix', 'sachet', 'liaison', 'duxelles', 'persillade',
    'tapenade', 'rouille', 'aioli', 'pistou', 'confit', 'cassoulet',
    'thyme', 'bay leaves', 'bay leaf', 'tarragon', 'herbes de provence',
    // Italian terms
    'risotto', 'osso buco', 'carpaccio', 'bresaola', 'gremolata', 'soffritto',
    'al dente', 'aglio e olio', 'arrabbiata', 'carbonara', 'amatriciana',
    'basil', 'oregano', 'rosemary', 'sage', 'parsley',
    // Asian terms
    'wok', 'stir fry', 'dim sum', 'dumpling', 'spring roll', 'tempura',
    'sushi', 'sashimi', 'teriyaki', 'miso', 'dashi', 'umami', 'ponzu',
    'biryani', 'tandoori', 'tikka', 'masala', 'korma', 'vindaloo', 'curry',
    'curry paste', 'green curry', 'red curry', 'coconut milk', 'fish sauce',
    'soy sauce', 'oyster sauce', 'hoisin', 'sriracha', 'sambal', 'gochujang',
    'lemongrass', 'galangal', 'kaffir lime', 'thai basil', 'cilantro', 'coriander',
    // Mexican/Latin terms
    'mole', 'poblano', 'chipotle', 'ancho', 'guajillo', 'pasilla', 'habanero',
    'salsa', 'pico de gallo', 'guacamole', 'chimichurri', 'sofrito', 'adobo',
    'carnitas', 'barbacoa', 'al pastor', 'ceviche', 'escabeche',
    'cumin', 'paprika', 'chili powder', 'cayenne', 'jalapeño', 'jalapeno'
  ]
};

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightTermsInText(text: string) {
  let highlightedText = text;
  const highlightedTerms = [];
  const culinaryKnowledge = [];
  const processedTerms = new Set();
  
  // Sort terms by length (longer first) to match more specific terms first
  const allTerms = [];
  for (const [category, terms] of Object.entries(CULINARY_TERMS)) {
    for (const term of terms) {
      allTerms.push({ term: term.toLowerCase(), category, original: term });
    }
  }
  allTerms.sort((a, b) => b.term.length - a.term.length);
  
  for (const { term, category, original } of allTerms) {
    // Create regex that matches the term (case-insensitive)
    const regex = new RegExp(`\\b(${escapeRegex(term)})(?:s|es|ed|ing)?\\b`, 'gi');
    const matches = text.match(regex);
    
    if (matches && !processedTerms.has(term)) {
      processedTerms.add(term);
      highlightedTerms.push({ term: original, category });
      
      // Replace all occurrences with highlighted version
      highlightedText = highlightedText.replace(regex, (match) => {
        return `<span class="culinary-term term-${category}" data-term="${original}" data-category="${category}">${match}</span>`;
      });
      
      // Add basic carousel content
      culinaryKnowledge.push({
        term: original,
        category,
        carouselContent: [
          {
            type: 'technique',
            title: `About ${original}`,
            content: getTermDescription(original, category),
            additionalInfo: 'This culinary term is important for understanding this recipe.'
          }
        ]
      });
    }
  }
  
  return { highlightedText, highlightedTerms, culinaryKnowledge };
}

function getTermDescription(term: string, category: string) {
  // Basic descriptions for common terms
  const descriptions = {
    'sear': 'To cook the surface of food at high temperature until a brown crust forms.',
    'deglaze': 'To add liquid to a hot pan to dissolve the caramelized bits of food stuck to the bottom.',
    'reduce': 'To thicken and intensify the flavor of a liquid by simmering or boiling.',
    'braise': 'To cook slowly in a small amount of liquid in a covered pot.',
    'sauté': 'To cook quickly in a small amount of fat over relatively high heat.',
    'simmer': 'To cook in liquid just below the boiling point, with small bubbles.',
    'caramelize': 'To heat sugar or foods containing sugar until they turn brown and develop a sweet, nutty flavor.',
    'burgundy': 'A wine region in France known for Pinot Noir and Chardonnay wines.',
    'risotto': 'An Italian rice dish cooked with broth to a creamy consistency.',
    'mole': 'A rich Mexican sauce typically containing chocolate and various chilies.',
    'biryani': 'A mixed rice dish from the Indian subcontinent with spices, rice, and meat.',
    'pearl onions': 'Small, sweet onions about the size of a marble, often used whole.',
    'cremini': 'Baby portobello mushrooms with a firm texture and earthy flavor.',
    'arborio': 'A short-grain Italian rice variety ideal for making risotto.',
    'basmati': 'A long-grain aromatic rice variety from the Indian subcontinent.',
    'thyme': 'An aromatic herb with small leaves and a subtle, earthy flavor.',
    'bay leaves': 'Aromatic leaves used to add depth to soups, stews, and braises.'
  };
  
  return descriptions[term.toLowerCase()] || 
    `${term} is ${category === 'basic' ? 'a fundamental' : 
     category === 'intermediate' ? 'an important' : 
     category === 'advanced' ? 'an advanced' : 
     'a cultural'} culinary element used in this recipe.`;
}

async function enhanceAllRecipes() {
  console.log('Comprehensive recipe enhancement starting...');
  
  // Get ALL recipes to re-enhance with the full term database
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
    AND r.id NOT IN (4, 6)  -- Skip corrupted recipes
    ORDER BY r.id
  `;
  
  console.log(`Found ${recipes.length} recipes to enhance comprehensively`);
  
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
      
      console.log(`✓ Enhanced with ${highlightedTerms.length} highlighted terms`);
      console.log(`  Categories: Basic: ${highlightedTerms.filter(t => t.category === 'basic').length}, ` +
                  `Intermediate: ${highlightedTerms.filter(t => t.category === 'intermediate').length}, ` +
                  `Advanced: ${highlightedTerms.filter(t => t.category === 'advanced').length}, ` +
                  `Cultural: ${highlightedTerms.filter(t => t.category === 'cultural').length}`);
    }
  }
  
  console.log('\n✓ Comprehensive enhancement complete!');
}

enhanceAllRecipes().catch(console.error);