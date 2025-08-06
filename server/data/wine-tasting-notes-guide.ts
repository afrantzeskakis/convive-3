// Comprehensive Wine Tasting Notes Guide
// This document serves as a reference for identifying tasting notes in wine descriptions
// Format: "note": "description" - the system will look for these notes in wine descriptions
// If a note appears in one wine but not others in a comparison, it's a differentiating characteristic

export const WineTastingNotesGuide = {
  // Fruit Notes - Primary
  "cherry": "Red fruit with sweet-tart character, common in Pinot Noir and Sangiovese",
  "blackberry": "Dark, jammy fruit with rich sweetness, typical in Cabernet Sauvignon and Syrah",
  "raspberry": "Bright red berry with tartness and sweetness, found in Grenache and Pinot Noir",
  "strawberry": "Sweet red fruit with fresh character, common in rosé and light reds",
  "blueberry": "Dark blue fruit with concentrated sweetness, found in Malbec and Petit Verdot",
  "plum": "Stone fruit with deep sweetness, common in Merlot and aged wines",
  "blackcurrant": "Cassis, intense dark fruit, signature of Cabernet Sauvignon",
  "redcurrant": "Tart red berry, found in cool-climate reds",
  "cranberry": "Tart red fruit, common in Pinot Noir and Nebbiolo",
  
  // Citrus Notes
  "lemon": "Bright citrus with high acidity, common in Riesling and Albariño",
  "lime": "Zesty citrus with sharp acidity, found in Sauvignon Blanc and Verdejo",
  "grapefruit": "Bitter-sweet citrus, signature of Sauvignon Blanc and Vermentino",
  "orange": "Sweet citrus with zest character, found in orange wines and aged whites",
  "tangerine": "Sweet mandarin citrus, found in Muscat and aromatic whites",
  "yuzu": "Japanese citrus with unique aromatic quality, found in sake-influenced wines",
  
  // Tree Fruits
  "apple": "Crisp orchard fruit, from green to red varieties, common in Chardonnay",
  "pear": "Soft tree fruit with delicate sweetness, found in Pinot Grigio and Chenin Blanc",
  "peach": "Stone fruit with lush sweetness, common in Viognier and Riesling",
  "apricot": "Concentrated stone fruit, found in late harvest and botrytized wines",
  "nectarine": "Smooth stone fruit with concentrated flavor, found in white Rhône blends",
  "quince": "Aromatic yellow fruit with floral notes, found in aged whites",
  
  // Tropical Fruits
  "pineapple": "Tropical fruit with bright acidity, common in oak-aged Chardonnay",
  "mango": "Lush tropical fruit, found in Gewürztraminer and warm-climate whites",
  "passion fruit": "Intense tropical with high aromatics, signature of Sauvignon Blanc",
  "lychee": "Exotic fruit with floral character, classic in Gewürztraminer",
  "papaya": "Soft tropical fruit, found in late harvest wines",
  "guava": "Tropical fruit with musky character, found in aromatic whites",
  "coconut": "Tropical note from oak aging, common in oaked Chardonnay",
  
  // Floral Notes
  "rose": "Classic floral note, found in Gewürztraminer and Nebbiolo",
  "violet": "Delicate purple flower, signature of Syrah and Malbec",
  "lavender": "Aromatic purple flower, found in Rhône blends",
  "jasmine": "White flower with intense perfume, found in Torrontés",
  "elderflower": "Delicate white flower, common in Sauvignon Blanc and Grüner Veltliner",
  "orange blossom": "Citrus flower, found in Riesling and Muscat",
  "acacia": "White flower with honey notes, found in white Burgundy",
  "honeysuckle": "Sweet floral, common in Chenin Blanc and Sémillon",
  
  // Herbal/Vegetal Notes
  "mint": "Cool herb, found in Cabernet Franc and some Cabernet Sauvignon",
  "eucalyptus": "Cooling herb, signature of Australian Cabernet and some Napa wines",
  "thyme": "Mediterranean herb, found in Rhône wines",
  "rosemary": "Woody herb, common in Mediterranean reds",
  "sage": "Savory herb, found in Sangiovese",
  "basil": "Sweet herb, occasionally in Italian varieties",
  "oregano": "Pizza herb, found in Italian reds",
  "green bell pepper": "Pyrazine note, found in underripe or cool-climate Cabernet",
  "jalapeño": "Green spicy note, found in some Cabernet Franc",
  "asparagus": "Green vegetal, sometimes in Sauvignon Blanc",
  "grass": "Fresh cut grass, signature of Sauvignon Blanc",
  "hay": "Dried grass, found in aged whites",
  "tea": "Tannic leaf note, found in aged wines and some Pinot Noir",
  "tobacco leaf": "Fresh tobacco, common in Cabernet-based wines",
  
  // Spice Notes
  "black pepper": "Pungent spice, signature of Syrah and Grüner Veltliner",
  "white pepper": "Subtle spice, found in Grüner Veltliner",
  "cinnamon": "Sweet baking spice, from oak aging",
  "clove": "Intense sweet spice, from oak and Gewürztraminer",
  "nutmeg": "Warm baking spice, from oak aging",
  "cardamom": "Exotic spice, found in Gewürztraminer",
  "star anise": "Licorice spice, found in Mediterranean reds",
  "vanilla": "Sweet spice from oak, especially American oak",
  "ginger": "Zesty spice, found in Gewürztraminer and some Riesling",
  "saffron": "Exotic expensive spice, rare but found in aged wines",
  
  // Earth/Mineral Notes
  "wet stone": "Minerality after rain, found in Chablis and Riesling",
  "chalk": "Dry mineral, from limestone soils",
  "slate": "Wet rock minerality, signature of Mosel Riesling",
  "granite": "Crystalline mineral, found in Northern Rhône",
  "limestone": "Calcareous mineral, found in Champagne and Burgundy",
  "flint": "Struck match mineral, found in Pouilly-Fumé",
  "graphite": "Pencil lead mineral, found in Left Bank Bordeaux",
  "volcanic": "Smoky mineral from volcanic soils",
  "oyster shell": "Marine mineral, found in Muscadet and Albariño",
  "salinity": "Sea salt character, found in coastal wines",
  "brine": "Salty sea water, found in Fino Sherry and coastal wines",
  "iodine": "Marine/medicinal note, found in some coastal wines",
  
  // Oak/Wood Notes
  "oak": "Wood influence from barrel aging",
  "cedar": "Pencil box wood, classic in Bordeaux",
  "sandalwood": "Exotic wood, found in aged wines",
  "smoke": "Charred wood or terroir influence",
  "toast": "Bread crust from oak toasting",
  "caramel": "Sweet cooked sugar from oak",
  "butterscotch": "Butter and brown sugar from oak",
  "toffee": "Chewy caramel from oak",
  "chocolate": "Cocoa from oak and grape tannins",
  "coffee": "Roasted bean from heavy oak",
  "espresso": "Concentrated coffee from oak",
  "mocha": "Coffee-chocolate combination",
  
  // Dairy/Creamy Notes
  "butter": "Creamy dairy from malolactic fermentation",
  "cream": "Rich dairy texture and flavor",
  "yogurt": "Tangy dairy from malolactic",
  "cheese": "Aged dairy notes in mature wines",
  "brioche": "Buttery bread from lees aging",
  "croissant": "Buttery pastry from aging",
  
  // Nutty Notes
  "almond": "Sweet nut, found in aged whites and Sherry",
  "hazelnut": "Round nut flavor, from oak or oxidation",
  "walnut": "Bitter nut, found in oxidized wines",
  "cashew": "Creamy nut, found in some aged whites",
  "chestnut": "Sweet roasted nut, found in aged wines",
  "brazil nut": "Rich tropical nut, rare note",
  
  // Sweet/Confection Notes
  "honey": "Sweet nectar, found in late harvest wines",
  "honeycomb": "Waxy honey, found in botrytized wines",
  "marmalade": "Citrus preserve, found in aged and sweet wines",
  "jam": "Cooked fruit preserve, found in hot climate wines",
  "candy": "Pure sugar sweetness",
  "cotton candy": "Spun sugar, found in some Beaujolais",
  
  // Savory/Umami Notes
  "mushroom": "Earthy fungi, found in aged Pinot Noir and Nebbiolo",
  "truffle": "Prized fungi, found in aged Barolo and Burgundy",
  "soy": "Umami sauce, found in aged wines",
  "bacon": "Smoky meat, found in some Syrah",
  "leather": "Animal hide, found in aged reds",
  "game": "Wild meat character in aged wines",
  "iron": "Blood-like metallic note",
  "meat": "Protein richness in full-bodied reds",
  
  // Textural Descriptors (these describe mouthfeel)
  "silky": "Smooth, soft texture like silk fabric",
  "velvety": "Plush, luxurious texture",
  "creamy": "Rich, smooth dairy-like texture",
  "crisp": "Fresh, clean, sharp acidity",
  "round": "Full, smooth, no sharp edges",
  "angular": "Sharp, defined edges from acidity or tannin",
  "supple": "Soft, flexible texture",
  "chewy": "Dense tannins requiring chewing",
  "grippy": "Tannins that grip the palate",
  "dusty": "Fine, drying tannins",
  "chalky": "Mineral texture that dries the mouth",
  "oily": "Viscous, coating texture",
  "waxy": "Coating texture like wax",
  
  // Body Descriptors
  "light-bodied": "Low alcohol, delicate weight",
  "medium-bodied": "Moderate weight and alcohol",
  "full-bodied": "Heavy, rich, high alcohol",
  "elegant": "Refined, balanced, graceful",
  "powerful": "Intense, concentrated, strong",
  "delicate": "Light, fragile, subtle",
  "robust": "Strong, full, hearty",
  "opulent": "Rich, luxurious, abundant",
  
  // Finish Descriptors
  "long": "Flavors persist after swallowing",
  "short": "Flavors disappear quickly",
  "lingering": "Flavors continue for extended time",
  "persistent": "Flavors maintain intensity",
  "clean": "No off-flavors, pure finish",
  "complex": "Multiple flavors evolving",
  "simple": "Straightforward, uncomplicated"
};

// Helper function to identify notes in wine descriptions
export function identifyTastingNotes(description: string): string[] {
  const lowercaseDesc = description.toLowerCase();
  const foundNotes: string[] = [];
  
  for (const note in WineTastingNotesGuide) {
    // Check if the note appears in the description
    // Look for the note as a whole word (not part of another word)
    const regex = new RegExp(`\\b${note}\\b`, 'i');
    if (regex.test(lowercaseDesc)) {
      foundNotes.push(note);
    }
  }
  
  return foundNotes;
}

// Function to find unique notes between wines
export function findUniqueNotes(wine1Notes: string[], wine2Notes: string[], wine3Notes: string[]): {
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