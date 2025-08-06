// Wine Tasting Notes Reference Guide for parsing wine descriptions
// Used to identify unique characteristics between wines

// All 207 wine tasting notes from the comprehensive guide
export const wineTastingNotes = [
  'acacia', 'acidic', 'aftertaste', 'alcoholic', 'allspice', 'almond', 'angular', 'anise',
  'apple', 'apricot', 'aromatic', 'ashy', 'asparagus', 'astringent', 'austere', 'autolytic',
  'backward', 'bacon fat', 'baked', 'balanced', 'balsamic', 'banana', 'band-aid', 'barnyard',
  'basil', 'bay leaf', 'beeswax', 'beetroot', 'big', 'biscuit', 'bitter', 'black cherry',
  'black pepper', 'black tea', 'blackberry', 'blackcurrant', 'blueberry', 'body',
  'boiled cabbage', 'boiled egg', 'boxwood', 'boysenberry', 'brioche', 'brooding', 'bubblegum',
  'burnt rubber', 'butterscotch', 'buttery', 'cassis', 'cedar', 'chalky', 'cherry', 'chocolate',
  'cinnamon', 'citrus', 'citrus zest', 'clove', 'coconut', 'coffee', 'complex', 'cranberry',
  'cream', 'creamy', 'crisp', 'earthy', 'elegant', 'espresso', 'eucalyptus', 'fig', 'flint',
  'floral', 'fresh', 'fruity', 'gamey', 'garlic', 'garrigue', 'geranium', 'ginger', 'gooseberry',
  'grapefruit', 'grapey', 'graphite', 'grassy', 'green', 'green bell pepper', 'green tea',
  'guava', 'gunflint', 'hard', 'hawthorn', 'hay', 'hazelnut', 'heavy', 'herbaceous', 'hibiscus',
  'hollow', 'honey', 'honeysuckle', 'horse blanket', 'horse manure', 'hot', 'incense', 'iodine',
  'iris', 'jalapeño', 'jammy', 'jasmine', 'kirsch', 'lavender', 'lean', 'leather', 'lemon',
  'lemongrass', 'licorice', 'lilac', 'lime', 'linden', 'lit match', 'lively', 'lychee',
  'mango', 'maple syrup', 'marmalade', 'marzipan', 'mature', 'meaty', 'mellow', 'melon',
  'menthol', 'metallic', 'mineral', 'minerality', 'mint', 'mocha', 'molasses', 'monolithic',
  'mousse', 'mulberry', 'mushroom', 'musky', 'musty', 'nail polish', 'nectarine', 'nervy',
  'nettles', 'nutmeg', 'nutty', 'oak', 'oaky', 'oily', 'olive', 'onion', 'opulent', 'orange',
  'orange blossom', 'overripe', 'oxidized', 'papaya', 'passion fruit', 'peach', 'pear',
  'peardrop', 'pencil shavings', 'peony', 'perfumed', 'persimmon', 'petrichor', 'petrol',
  'pine', 'pineapple', 'plum', 'polished', 'pomegranate', 'potpourri', 'powerful', 'prune',
  'pungent', 'quince', 'racy', 'raisin', 'raspberry', 'red currant', 'red plum', 'rhubarb',
  'rich', 'robust', 'rose', 'rosemary', 'rotten egg', 'round', 'saffron', 'sage', 'saline',
  'salinity', 'salt', 'salty', 'brine', 'briny', 'savory', 'sharp', 'silky', 'slate', 'smoky',
  'smooth', 'soapy', 'soft', 'sour cherry', 'spice', 'spicy', 'stalky', 'stewed fruit',
  'strawberry', 'sun-dried tomato', 'supple', 'sweet', 'tannic', 'tannins', 'tar', 'tart',
  'thin', 'thyme', 'tight', 'toast', 'tobacco', 'toffee', 'tomato', 'tomato leaf', 'truffle',
  'underripe', 'vanilla', 'vegetal', 'velvety', 'vinegar', 'violet', 'volcanic', 'walnut',
  'wet dog', 'wet wool', 'white flowers', 'white pepper', 'yeasty', 'youthful', 'zesty'
];

// Function to identify tasting notes in wine descriptions
export function identifyTastingNotes(description: string): string[] {
  if (!description) return [];
  
  const lowercaseDesc = description.toLowerCase();
  const foundNotes: string[] = [];
  
  // Check each note in the guide
  for (const note of wineTastingNotes) {
    // Create variations of the note to check
    const variations = [note];
    
    // Add singular/plural variations
    if (note.endsWith('ies')) {
      variations.push(note.slice(0, -3) + 'y');
    } else if (note.endsWith('s') && note !== 'citrus' && note !== 'moss') {
      variations.push(note.slice(0, -1));
    } else if (!note.endsWith('s')) {
      variations.push(note + 's');
    }
    
    // Check if any variation appears in the description
    for (const variation of variations) {
      const regex = new RegExp(`\\b${variation}\\b`, 'i');
      if (regex.test(lowercaseDesc)) {
        foundNotes.push(note);
        break;
      }
    }
  }
  
  return [...new Set(foundNotes)]; // Remove duplicates
}

// Function to find unique notes between wines
export function findUniqueNotes(
  wine1Notes: string[], 
  wine2Notes: string[], 
  wine3Notes: string[]
): {
  wine1Unique: string[],
  wine2Unique: string[],
  wine3Unique: string[]
} {
  const wine1Set = new Set(wine1Notes);
  const wine2Set = new Set(wine2Notes);
  const wine3Set = new Set(wine3Notes);
  
  const wine1Unique = wine1Notes.filter(note => 
    !wine2Set.has(note) && !wine3Set.has(note)
  );
  
  const wine2Unique = wine2Notes.filter(note => 
    !wine1Set.has(note) && !wine3Set.has(note)
  );
  
  const wine3Unique = wine3Notes.filter(note => 
    !wine1Set.has(note) && !wine2Set.has(note)
  );
  
  return {
    wine1Unique,
    wine2Unique,
    wine3Unique
  };
}

// Function to format notes for display with proper hierarchy
export function formatNoteForDisplay(note: string): string {
  // Special formatting for certain notes - Priority 1: Unique flavors/aromas
  const specialFormats: { [key: string]: string } = {
    // Salinity variants
    'saline': 'Hint of salinity',
    'salinity': 'Hint of salinity',
    'salt': 'Hint of salinity',
    'salty': 'Hint of salinity',
    'brine': 'Briny character',
    'briny': 'Briny character',
    
    // Specific flavor notes
    'hazelnut': 'Hazelnut notes',
    'honey': 'Honey notes',
    'brioche': 'Brioche character',
    'chocolate': 'Chocolate notes',
    'coffee': 'Coffee notes',
    'tobacco': 'Tobacco notes',
    'leather': 'Leather notes',
    'mineral': 'Mineral notes',
    'minerality': 'Mineral character',
    'floral': 'Floral notes',
    'almond': 'Almond notes',
    'caramel': 'Caramel notes',
    'butter': 'Buttery notes',
    'buttery': 'Buttery character',
    'herbal': 'Herbal character',
    'herbaceous': 'Herbaceous notes',
    'earthy': 'Earthy notes',
    'spice': 'Spicy character',
    'spicy': 'Spicy notes',
    
    // Fruit notes
    'cherry': 'Cherry notes',
    'black cherry': 'Black cherry notes',
    'blackberry': 'Blackberry notes',
    'raspberry': 'Raspberry notes',
    'strawberry': 'Strawberry notes',
    'blueberry': 'Blueberry notes',
    'plum': 'Plum notes',
    'apple': 'Apple notes',
    'pear': 'Pear notes',
    'peach': 'Peach notes',
    'apricot': 'Apricot notes',
    'citrus': 'Citrus notes',
    'lemon': 'Lemon notes',
    'lime': 'Lime notes',
    'grapefruit': 'Grapefruit notes',
    'orange': 'Orange notes',
    
    // Oak/Wood notes
    'oak': 'Oak influence',
    'oaky': 'Oaky character',
    'cedar': 'Cedar notes',
    'vanilla': 'Vanilla notes',
    'toast': 'Toasted notes',
    
    // Texture descriptors
    'silky': 'Silky texture',
    'velvety': 'Velvety texture',
    'creamy': 'Creamy texture',
    'crisp': 'Crisp finish',
    'smooth': 'Smooth finish',
    
    // Body descriptors
    'tannic': 'Tannic structure',
    'tannins': 'Pronounced tannins'
  };
  
  if (specialFormats[note]) {
    return specialFormats[note];
  }
  
  // Default formatting - capitalize first letter and add "notes"
  return note.charAt(0).toUpperCase() + note.slice(1) + ' notes';
}

// Priority levels for different types of notes
export const notePriority: { [key: string]: number } = {
  // Priority 1: Unique flavors/aromas (highest)
  'saline': 1, 'salinity': 1, 'salt': 1, 'brine': 1, 'briny': 1,
  'hazelnut': 1, 'honey': 1, 'brioche': 1, 'chocolate': 1, 'coffee': 1,
  'tobacco': 1, 'leather': 1, 'mineral': 1, 'minerality': 1, 'floral': 1,
  'almond': 1, 'caramel': 1, 'butter': 1, 'buttery': 1,
  
  // Priority 2: Fruit notes
  'cherry': 2, 'black cherry': 2, 'blackberry': 2, 'raspberry': 2,
  'strawberry': 2, 'blueberry': 2, 'plum': 2, 'apple': 2, 'pear': 2,
  'peach': 2, 'apricot': 2, 'citrus': 2, 'lemon': 2, 'lime': 2,
  'grapefruit': 2, 'orange': 2,
  
  // Priority 3: Body/tannins
  'tannic': 3, 'tannins': 3, 'full-bodied': 3, 'medium-bodied': 3, 'light-bodied': 3,
  
  // Priority 4: Texture/finish
  'silky': 4, 'velvety': 4, 'creamy': 4, 'crisp': 4, 'smooth': 4,
  
  // Priority 5: Production/other (lowest)
  'oak': 5, 'oaky': 5, 'cedar': 5, 'vanilla': 5, 'toast': 5
};

// Sort notes by priority
export function sortNotesByPriority(notes: string[]): string[] {
  return notes.sort((a, b) => {
    const priorityA = notePriority[a] || 6;
    const priorityB = notePriority[b] || 6;
    return priorityA - priorityB;
  });
}