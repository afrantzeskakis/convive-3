const fs = require('fs');

// Read the complete descriptor file
const descriptorsText = fs.readFileSync('all_descriptors.txt', 'utf8');
const lines = descriptorsText.split('\n').filter(line => line.trim());

function categorizeDescriptor(term, definition) {
  const termLower = term.toLowerCase();
  const defLower = definition.toLowerCase();
  
  // Aroma-focused terms
  if (defLower.includes('aroma') || defLower.includes('smell') || defLower.includes('scent') || 
      defLower.includes('nose') || defLower.includes('fragrant') || defLower.includes('bouquet') ||
      termLower.includes('floral') || termLower.includes('fruity') || termLower.includes('spice')) {
    return 'aroma';
  }
  
  // Texture/mouthfeel terms
  if (defLower.includes('texture') || defLower.includes('mouthfeel') || defLower.includes('feel') ||
      defLower.includes('smooth') || defLower.includes('rough') || defLower.includes('coating') ||
      defLower.includes('weight') || defLower.includes('body') || termLower.includes('creamy') ||
      termLower.includes('silky') || termLower.includes('velvety')) {
    return 'texture';
  }
  
  // Structure terms (tannins, acid, etc.)
  if (defLower.includes('tannin') || defLower.includes('acid') || defLower.includes('structure') ||
      defLower.includes('astringent') || defLower.includes('dry') || defLower.includes('backbone') ||
      termLower.includes('angular') || termLower.includes('austere')) {
    return 'structure';
  }
  
  // Taste terms
  if (defLower.includes('taste') || defLower.includes('flavor') || defLower.includes('palate') ||
      defLower.includes('sweet') || defLower.includes('sour') || defLower.includes('bitter') ||
      defLower.includes('salty') || termLower.includes('acidic')) {
    return 'taste';
  }
  
  // Everything else is character
  return 'character';
}

function sanitizeForJS(text) {
  return text.replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

function createTermKey(term) {
  return term.toLowerCase()
    .replace(/\s*\([^)]*\)/g, '') // Remove parentheses
    .replace(/\s+/g, ' ')         // Normalize spaces
    .trim();
}

const processedDescriptors = [];

lines.forEach(line => {
  const colonIndex = line.indexOf(':');
  if (colonIndex > 0) {
    const term = line.substring(0, colonIndex).trim();
    const definition = line.substring(colonIndex + 1).trim();
    
    const termKey = createTermKey(term);
    const category = categorizeDescriptor(term, definition);
    
    processedDescriptors.push({
      key: termKey,
      term: term,
      category: category,
      definition: definition
    });
  }
});

// Generate TypeScript content
let tsContent = `export interface WineDescriptor {
  term: string;
  category: 'aroma' | 'taste' | 'texture' | 'structure' | 'character';
  definition: string;
  examples?: string[];
  relatedTerms?: string[];
}

export const wineDescriptors: Record<string, WineDescriptor> = {
`;

processedDescriptors.forEach(desc => {
  tsContent += `  '${desc.key}': {
    term: '${sanitizeForJS(desc.term)}',
    category: '${desc.category}',
    definition: '${sanitizeForJS(desc.definition)}',
    examples: [],
    relatedTerms: []
  },
`;
});

tsContent += `};

// Helper function to find a descriptor by term
export function findDescriptor(term: string): WineDescriptor | undefined {
  const normalizedTerm = term.toLowerCase().trim();
  return wineDescriptors[normalizedTerm];
}

// Helper function to get all descriptor terms
export function getAllDescriptorTerms(): string[] {
  return Object.keys(wineDescriptors);
}

// Helper function to get descriptors by category
export function getDescriptorsByCategory(category: WineDescriptor['category']): WineDescriptor[] {
  return Object.values(wineDescriptors).filter(descriptor => descriptor.category === category);
}`;

// Write the complete file
fs.writeFileSync('shared/wine-descriptors-complete.ts', tsContent);
console.log(`Processed ${processedDescriptors.length} descriptors`);
console.log('Complete wine descriptor file created!');
