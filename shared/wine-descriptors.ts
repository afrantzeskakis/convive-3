// Wine Descriptor Database - Professional wine terminology definitions
// These definitions are used for the interactive highlight-to-define feature

export interface WineDescriptor {
  term: string;
  category: 'aroma' | 'taste' | 'texture' | 'finish' | 'structure' | 'general';
  definition: string;
  examples?: string[];
  relatedTerms?: string[];
}

export const wineDescriptors: Record<string, WineDescriptor> = {
  // Tree Fruits
  'apple': {
    term: 'apple',
    category: 'taste',
    definition: 'Fresh orchard fruit ranging from tart green to sweet red varieties, common in crisp whites.',
    examples: ['Riesling', 'Pinot Grigio', 'Albariño'],
    relatedTerms: ['green apple', 'red apple', 'baked apple']
  },
  'green apple': {
    term: 'green apple',
    category: 'taste',
    definition: 'Tart, crisp fruit indicating high acidity and freshness in cool-climate whites.',
    examples: ['Grüner Veltliner', 'Chablis', 'Txakoli'],
    relatedTerms: ['apple', 'granny smith']
  },
  'pear': {
    term: 'pear',
    category: 'taste',
    definition: 'Soft, subtle orchard fruit often found in Pinot Grigio and Albariño.',
    examples: ['Alsace Pinot Gris', 'White Burgundy'],
    relatedTerms: ['asian pear', 'bosc pear']
  },
  'peach': {
    term: 'peach',
    category: 'taste',
    definition: 'Stone fruit flavor indicating ripeness, common in Viognier and aged Chardonnay.',
    examples: ['Condrieu', 'Spätlese Riesling'],
    relatedTerms: ['apricot', 'nectarine', 'stone fruit']
  },
  'apricot': {
    term: 'apricot',
    category: 'taste',
    definition: 'Delicate stone fruit, often in aromatic whites and dessert wines.',
    examples: ['Viognier', 'Tokaji', 'Aged Riesling'],
    relatedTerms: ['peach', 'dried apricot']
  },
  'quince': {
    term: 'quince',
    category: 'taste',
    definition: 'Aromatic, slightly tart fruit with floral notes, found in aged whites.',
    examples: ['Aged Chenin Blanc', 'White Rioja'],
    relatedTerms: ['pear', 'apple']
  },

  // Citrus Fruits
  'lemon': {
    term: 'lemon',
    category: 'taste',
    definition: 'Bright citrus providing freshness and acidity in crisp whites.',
    examples: ['Chablis', 'Albariño', 'Vermentino'],
    relatedTerms: ['lemon zest', 'meyer lemon', 'citrus']
  },
  'lime': {
    term: 'lime',
    category: 'taste',
    definition: 'Zesty, sharp citrus common in Sauvignon Blanc and Verdejo.',
    examples: ['Australian Riesling', 'Verdejo'],
    relatedTerms: ['citrus', 'key lime']
  },
  'grapefruit': {
    term: 'grapefruit',
    category: 'taste',
    definition: 'Tangy citrus with slight bitterness, characteristic of Sauvignon Blanc.',
    examples: ['New Zealand Sauvignon Blanc', 'Sancerre'],
    relatedTerms: ['citrus', 'pomelo']
  },
  'orange': {
    term: 'orange',
    category: 'taste',
    definition: 'Sweet citrus notes, often orange zest in aromatic whites.',
    examples: ['Moscato', 'Orange wines'],
    relatedTerms: ['orange zest', 'blood orange']
  },
  
  // Red & Black Fruits
  'cherry': {
    term: 'cherry',
    category: 'taste',
    definition: 'Fresh red fruit common in Pinot Noir and Sangiovese.',
    examples: ['Burgundy', 'Chianti'],
    relatedTerms: ['black cherry', 'sour cherry']
  },
  'black cherry': {
    term: 'black cherry',
    category: 'taste',
    definition: 'Rich, dark fruit with slight tartness in mature reds.',
    examples: ['Burgundy Pinot Noir', 'Chianti Classico'],
    relatedTerms: ['cherry', 'morello cherry']
  },
  'blackberry': {
    term: 'blackberry',
    category: 'taste',
    definition: 'Dark, jammy fruit typical of ripe Cabernet and Syrah.',
    examples: ['Napa Valley Cabernet', 'Australian Shiraz'],
    relatedTerms: ['black currant', 'bramble']
  },
  'raspberry': {
    term: 'raspberry',
    category: 'taste',
    definition: 'Bright red berry with sweet-tart character in Grenache.',
    examples: ['Côtes du Rhône', 'Garnacha'],
    relatedTerms: ['red berry', 'strawberry']
  },
  'strawberry': {
    term: 'strawberry',
    category: 'taste',
    definition: 'Sweet red berry often found in rosé and light reds.',
    examples: ['Provence Rosé', 'Beaujolais'],
    relatedTerms: ['raspberry', 'red fruit']
  },
  'cassis': {
    term: 'cassis',
    category: 'taste',
    definition: 'Black currant flavor, a hallmark of Cabernet Sauvignon. Indicates concentration and quality, especially in Bordeaux wines.',
    examples: ['Left Bank Bordeaux', 'Margaret River Cabernet'],
    relatedTerms: ['black currant', 'blackberry']
  },
  'plum': {
    term: 'plum',
    category: 'taste',
    definition: 'Soft, sweet dark fruit flavor found in medium-bodied reds like Merlot. Can range from fresh to dried/pruney in older wines.',
    examples: ['Right Bank Bordeaux', 'Chilean Carmenère'],
    relatedTerms: ['prune', 'dried plum']
  },
  'blueberry': {
    term: 'blueberry',
    category: 'taste',
    definition: 'Sweet dark berry common in warm-climate Syrah.',
    examples: ['Barossa Shiraz', 'Paso Robles Syrah'],
    relatedTerms: ['blackberry', 'dark fruit']
  },
  'cranberry': {
    term: 'cranberry',
    category: 'taste',
    definition: 'Tart red fruit indicating bright acidity in light reds.',
    examples: ['Pinot Noir', 'Gamay'],
    relatedTerms: ['cherry', 'red fruit']
  },
  'fig': {
    term: 'fig',
    category: 'taste',
    definition: 'Sweet, jammy character in aged reds and fortified wines.',
    examples: ['Amarone', 'Vintage Port'],
    relatedTerms: ['dried fruit', 'prune']
  },
  
  // Fruit Descriptors - White/Citrus
  'lemon': {
    term: 'lemon',
    category: 'taste',
    definition: 'Bright citrus note providing freshness and acidity. Common in crisp white wines, especially those from cool climates.',
    examples: ['Chablis', 'Albariño', 'Vermentino'],
    relatedTerms: ['lemon zest', 'meyer lemon', 'citrus']
  },
  'grapefruit': {
    term: 'grapefruit',
    category: 'taste',
    definition: 'Tangy citrus flavor with slight bitterness. Characteristic of Sauvignon Blanc and some Rieslings.',
    examples: ['New Zealand Sauvignon Blanc', 'Sancerre'],
    relatedTerms: ['citrus', 'pomelo', 'white grapefruit']
  },
  'green apple': {
    term: 'green apple',
    category: 'taste',
    definition: 'Tart, crisp fruit flavor indicating high acidity and freshness. Common in cool-climate whites and young wines.',
    examples: ['Grüner Veltliner', 'Chablis', 'Txakoli'],
    relatedTerms: ['apple', 'granny smith']
  },
  'apple': {
    term: 'apple',
    category: 'taste',
    definition: 'Fresh orchard fruit flavor ranging from tart green to sweet red varieties. Common in many white wines.',
    examples: ['Riesling', 'Pinot Grigio', 'Albariño'],
    relatedTerms: ['green apple', 'red apple', 'baked apple']
  },
  'pear': {
    term: 'pear',
    category: 'taste',
    definition: 'Soft, subtle orchard fruit flavor. Often found in Pinot Grigio, Albariño, and some Chardonnays.',
    examples: ['Alsace Pinot Gris', 'White Burgundy'],
    relatedTerms: ['asian pear', 'bosc pear']
  },
  'peach': {
    term: 'peach',
    category: 'taste',
    definition: 'Stone fruit flavor indicating ripeness. Common in Viognier, Riesling, and aged Chardonnay.',
    examples: ['Condrieu', 'Spätlese Riesling'],
    relatedTerms: ['apricot', 'nectarine', 'stone fruit']
  },
  'apricot': {
    term: 'apricot',
    category: 'taste',
    definition: 'Delicate stone fruit flavor, often found in aromatic whites and dessert wines. Can indicate bottle age.',
    examples: ['Viognier', 'Tokaji', 'Aged Riesling'],
    relatedTerms: ['peach', 'dried apricot']
  },
  
  // Nuts
  'hazelnut': {
    term: 'hazelnut',
    category: 'taste',
    definition: 'Toasted, sweet nut character often from oak aging or oxidative development.',
    examples: ['Aged White Burgundy', 'Fino Sherry'],
    relatedTerms: ['almond', 'walnut', 'nutty']
  },
  'almond': {
    term: 'almond',
    category: 'taste',
    definition: 'Delicate nut flavor, can be sweet or bitter, common in aged whites.',
    examples: ['Aged Chablis', 'White Rioja'],
    relatedTerms: ['marzipan', 'hazelnut']
  },
  'walnut': {
    term: 'walnut',
    category: 'taste',
    definition: 'Rich, slightly bitter nut character in aged wines.',
    examples: ['Aged Barolo', 'Oloroso Sherry'],
    relatedTerms: ['hazelnut', 'nutty']
  },
  'chestnut': {
    term: 'chestnut',
    category: 'taste',
    definition: 'Sweet, earthy nut flavor in mature wines.',
    examples: ['Aged Rhône wines', 'Mature Rioja'],
    relatedTerms: ['hazelnut', 'roasted nuts']
  },
  
  // Floral & Herbal
  'violet': {
    term: 'violet',
    category: 'aroma',
    definition: 'Delicate floral aroma typical of Nebbiolo, Syrah, and Petit Verdot. Indicates elegance and complexity.',
    examples: ['Barolo', 'Côte-Rôtie', 'Margaux'],
    relatedTerms: ['floral', 'lavender', 'iris']
  },
  'rose': {
    term: 'rose',
    category: 'aroma',
    definition: 'Classic floral note found in aromatic varieties like Gewürztraminer and Nebbiolo. Adds perfumed complexity.',
    examples: ['Gewürztraminer', 'Barbaresco'],
    relatedTerms: ['rose petal', 'floral']
  },
  'eucalyptus': {
    term: 'eucalyptus',
    category: 'aroma',
    definition: 'Minty, medicinal aroma characteristic of Australian Cabernet and some California reds. Adds freshness and lift.',
    examples: ['Coonawarra Cabernet', 'Napa Valley Cabernet'],
    relatedTerms: ['mint', 'menthol']
  },
  'thyme': {
    term: 'thyme',
    category: 'aroma',
    definition: 'Savory herb note common in Mediterranean wines, especially Rhône blends. Indicates garrigue influence.',
    examples: ['Châteauneuf-du-Pape', 'Priorat'],
    relatedTerms: ['herbs', 'garrigue', 'rosemary']
  },
  
  // Sweet & Spice
  'honey': {
    term: 'honey',
    category: 'taste',
    definition: 'Sweet, viscous character found in late-harvest wines and aged whites. Can indicate noble rot or bottle age.',
    examples: ['Sauternes', 'Aged Riesling', 'Tokaji'],
    relatedTerms: ['honeycomb', 'beeswax']
  },
  'vanilla': {
    term: 'vanilla',
    category: 'taste',
    definition: 'Sweet spice from oak aging, especially American oak. Adds richness and perceived sweetness.',
    examples: ['Rioja', 'California Chardonnay'],
    relatedTerms: ['oak', 'cream', 'custard']
  },
  'cinnamon': {
    term: 'cinnamon',
    category: 'taste',
    definition: 'Warm baking spice from oak aging or grape variety. Common in Grenache and oak-aged wines.',
    examples: ['Châteauneuf-du-Pape', 'Amarone'],
    relatedTerms: ['baking spice', 'clove', 'nutmeg']
  },
  'black pepper': {
    term: 'black pepper',
    category: 'taste',
    definition: 'Spicy, pungent note characteristic of Syrah/Shiraz and cool-climate Grüner Veltliner. Adds complexity and bite.',
    examples: ['Northern Rhône Syrah', 'Grüner Veltliner'],
    relatedTerms: ['white pepper', 'peppercorn', 'spice']
  },
  
  // Earth & Mineral
  'leather': {
    term: 'leather',
    category: 'aroma',
    definition: 'Savory, aged character developing in mature red wines. Sign of tertiary development and complexity.',
    examples: ['Aged Barolo', 'Mature Rioja'],
    relatedTerms: ['saddle leather', 'suede']
  },
  'tobacco': {
    term: 'tobacco',
    category: 'aroma',
    definition: 'Dried leaf aroma in aged reds, especially Cabernet-based wines. Indicates maturity and cedar box aging.',
    examples: ['Aged Bordeaux', 'Super Tuscans'],
    relatedTerms: ['cigar box', 'pipe tobacco']
  },
  'wet stone': {
    term: 'wet stone',
    category: 'aroma',
    definition: 'Mineral aroma evoking rain on rocks. Common in wines from slate or limestone soils.',
    examples: ['Mosel Riesling', 'Chablis'],
    relatedTerms: ['minerality', 'slate', 'chalk']
  },
  'graphite': {
    term: 'graphite',
    category: 'aroma',
    definition: 'Pencil lead mineral note, especially in Pauillac Cabernet Sauvignon. Indicates terroir expression and quality.',
    examples: ['Pauillac', 'Washington Cabernet'],
    relatedTerms: ['pencil lead', 'mineral']
  },
  
  // Texture & Structure
  'silky': {
    term: 'silky',
    category: 'texture',
    definition: 'Smooth, luxurious mouthfeel with fine, polished tannins. Indicates quality and careful winemaking.',
    examples: ['Grand Cru Burgundy', 'Aged Barolo'],
    relatedTerms: ['velvety', 'smooth', 'polished']
  },
  'grippy': {
    term: 'grippy',
    category: 'texture',
    definition: 'Firm tannins that create a drying, gripping sensation. Common in young, structured wines needing age.',
    examples: ['Young Nebbiolo', 'Tannat'],
    relatedTerms: ['tannic', 'astringent', 'firm']
  },
  'creamy': {
    term: 'creamy',
    category: 'texture',
    definition: 'Rich, smooth texture from malolactic fermentation or lees contact. Adds weight and mouthfeel.',
    examples: ['Burgundian Chardonnay', 'Champagne'],
    relatedTerms: ['buttery', 'rich', 'lees']
  },
  'crisp': {
    term: 'crisp',
    category: 'texture',
    definition: 'Fresh, clean finish with bright acidity. Creates a refreshing, mouth-watering sensation.',
    examples: ['Sancerre', 'Albariño'],
    relatedTerms: ['fresh', 'zesty', 'bright']
  },
  
  // Oak & Aging
  'toasty': {
    term: 'toasty',
    category: 'aroma',
    definition: 'Roasted, bread-like aroma from oak barrel toasting or extended lees aging. Adds complexity and richness.',
    examples: ['Vintage Champagne', 'Barrel-fermented Chardonnay'],
    relatedTerms: ['brioche', 'biscuit', 'oak']
  },
  'cedar': {
    term: 'cedar',
    category: 'aroma',
    definition: 'Wood aroma from oak aging, especially in Bordeaux. Classic sign of quality Cabernet Sauvignon.',
    examples: ['Médoc wines', 'Napa Cabernet'],
    relatedTerms: ['cigar box', 'wood', 'oak']
  },
  'smoky': {
    term: 'smoky',
    category: 'aroma',
    definition: 'Charred, campfire aroma from heavily toasted oak or certain terroirs. Can also come from volatile compounds.',
    examples: ['Pouilly-Fumé', 'Mezcal-aged wines'],
    relatedTerms: ['charred', 'bacon', 'campfire']
  },
  
  // Unique/Complex
  'brioche': {
    term: 'brioche',
    category: 'aroma',
    definition: 'Yeasty, buttery bread aroma from extended lees aging. Hallmark of quality Champagne and aged whites.',
    examples: ['Vintage Champagne', 'Aged White Burgundy'],
    relatedTerms: ['bread', 'yeast', 'biscuit']
  },
  'truffle': {
    term: 'truffle',
    category: 'aroma',
    definition: 'Earthy, funky, umami-rich aroma in aged wines, especially Nebbiolo and mature Pinot Noir.',
    examples: ['Aged Barolo', 'Grand Cru Burgundy'],
    relatedTerms: ['mushroom', 'forest floor', 'umami']
  },
  'petrol': {
    term: 'petrol',
    category: 'aroma',
    definition: 'Distinctive kerosene-like aroma in aged Riesling. Considered a positive sign of maturity and complexity.',
    examples: ['Aged German Riesling', 'Clare Valley Riesling'],
    relatedTerms: ['kerosene', 'diesel', 'mineral']
  },
  'barnyard': {
    term: 'barnyard',
    category: 'aroma',
    definition: 'Funky, earthy aroma from Brettanomyces yeast. Controversial - loved in small amounts, fault if excessive.',
    examples: ['Some Rhône wines', 'Traditional Bandol'],
    relatedTerms: ['brett', 'farmyard', 'funky']
  }
};

// Helper function to find descriptor by term (case-insensitive)
export function findDescriptor(term: string): WineDescriptor | undefined {
  const normalizedTerm = term.toLowerCase().trim();
  return wineDescriptors[normalizedTerm];
}

// Get all descriptor terms for highlighting
export function getAllDescriptorTerms(): string[] {
  return Object.keys(wineDescriptors);
}

// Get descriptors by category
export function getDescriptorsByCategory(category: WineDescriptor['category']): WineDescriptor[] {
  return Object.values(wineDescriptors).filter(d => d.category === category);
}