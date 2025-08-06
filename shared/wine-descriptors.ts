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
  // A
  'acacia': {
    term: 'acacia',
    category: 'aroma',
    definition: 'Delicate floral aroma of acacia blossoms, sweet and lightly fragrant with honeyed flower scents.',
    examples: ['White Rhône blends', 'Viognier'],
    relatedTerms: ['floral', 'honeysuckle']
  },
  'acidic': {
    term: 'acidic',
    category: 'structure',
    definition: 'Sour or tart taste from higher acidity, making mouth water like lemon or green apple.',
    examples: ['Cool-climate wines', 'Young Riesling'],
    relatedTerms: ['tart', 'crisp', 'bright']
  },
  'aftertaste': {
    term: 'aftertaste',
    category: 'structure',
    definition: 'Flavor impressions remaining after swallowing, also called the finish.',
    examples: ['Quality wines', 'Aged wines'],
    relatedTerms: ['finish', 'length']
  },
  'alcoholic': {
    term: 'alcoholic',
    category: 'structure',
    definition: 'Wine whose alcohol is out of balance, causing noticeable burn or warmth.',
    examples: ['Hot climate wines', 'Late harvest'],
    relatedTerms: ['hot', 'warming']
  },
  'angular': {
    term: 'angular',
    category: 'texture',
    definition: 'Wine with hard, sharp edges from prominent acidity or tannin, lacking softness.',
    examples: ['Young wines', 'Austere styles'],
    relatedTerms: ['sharp', 'edgy']
  },
  'anise': {
    term: 'anise',
    category: 'aroma',
    definition: 'Spice note of licorice or fennel seed, sweet-herbal character.',
    examples: ['Some Rhône wines', 'Certain Rieslings'],
    relatedTerms: ['licorice', 'fennel']
  },
  'aromatic': {
    term: 'aromatic',
    category: 'character',
    definition: 'Wine with pronounced and intense aromas, very fragrant and expressive.',
    examples: ['Gewürztraminer', 'Riesling', 'Torrontés'],
    relatedTerms: ['fragrant', 'perfumed']
  },
  'ashy': {
    term: 'ashy',
    category: 'aroma',
    definition: 'Smell of ash or soot, like from a fireplace, dry or smoky character.',
    examples: ['Volcanic wines', 'Some aged reds'],
    relatedTerms: ['smoky', 'charred']
  },
  'astringent': {
    term: 'astringent',
    category: 'texture',
    definition: 'Drying, puckering sensation from high tannins, like strong black tea.',
    examples: ['Young tannic reds', 'Nebbiolo'],
    relatedTerms: ['drying', 'tannic']
  },
  'austere': {
    term: 'austere',
    category: 'character',
    definition: 'Hard wine lacking obvious fruit sweetness, often high acid or tannin.',
    examples: ['Young Chablis', 'Traditional Barolo'],
    relatedTerms: ['severe', 'strict']
  },
  'autolytic': {
    term: 'autolytic',
    category: 'aroma',
    definition: 'Aromas from yeast breakdown like bread dough, brioche, or biscuit.',
    examples: ['Champagne', 'Aged sparkling wines'],
    relatedTerms: ['yeasty', 'brioche', 'biscuit']
  },

  // B
  'backward': {
    term: 'backward',
    category: 'character',
    definition: 'Wine that is closed or not showing much character, often due to youth.',
    examples: ['Young fine wines', 'Tannic reds'],
    relatedTerms: ['closed', 'reticent']
  },
  'bacon fat': {
    term: 'bacon fat',
    category: 'aroma',
    definition: 'Rich, savory aroma of smoked bacon or cured meats.',
    examples: ['Northern Rhône Syrah', 'Some aged reds'],
    relatedTerms: ['meaty', 'smoky']
  },
  'baked': {
    term: 'baked',
    category: 'taste',
    definition: 'Flavors of stewed or overripe fruit, as if baked by heat.',
    examples: ['Hot vintage wines', 'Overripe grapes'],
    relatedTerms: ['stewed', 'cooked']
  },
  'balanced': {
    term: 'balanced',
    category: 'structure',
    definition: 'Wine where all components are in harmony - fruit, acid, tannin, alcohol.',
    examples: ['Well-made wines', 'Mature wines'],
    relatedTerms: ['harmonious', 'integrated']
  },
  'balsamic': {
    term: 'balsamic',
    category: 'aroma',
    definition: 'Sweet-sour, woody scent like balsamic vinegar or aromatic resins.',
    examples: ['Aged Italian reds', 'Barolo'],
    relatedTerms: ['resinous', 'aged']
  },
  'banana': {
    term: 'banana',
    category: 'taste',
    definition: 'Fruity aroma of bananas, often from fermentation esters.',
    examples: ['Beaujolais Nouveau', 'Some young wines'],
    relatedTerms: ['tropical', 'estery']
  },
  'barnyard': {
    term: 'barnyard',
    category: 'aroma',
    definition: 'Earthy, farm-like smell of hay, dirt, and animal musk.',
    examples: ['Some Burgundies', 'Brett-influenced wines'],
    relatedTerms: ['funky', 'brett']
  },
  'basil': {
    term: 'basil',
    category: 'aroma',
    definition: 'Herbal note of fresh basil leaves, green and slightly peppery.',
    examples: ['Some Italian reds', 'Certain Cabernet Francs'],
    relatedTerms: ['herbal', 'green']
  },
  'bay leaf': {
    term: 'bay leaf',
    category: 'aroma',
    definition: 'Herbal aroma of dried bay laurel with menthol and spice notes.',
    examples: ['Aged reds', 'Some Rhône wines'],
    relatedTerms: ['herbal', 'dried herbs']
  },
  'beeswax': {
    term: 'beeswax',
    category: 'aroma',
    definition: 'Waxy, honeycomb-like aroma with honey, wax, and floral pollen.',
    examples: ['Aged Chenin Blanc', 'Noble rot wines'],
    relatedTerms: ['honey', 'waxy']
  },
  'beetroot': {
    term: 'beetroot',
    category: 'aroma',
    definition: 'Earthy-sweet aroma of fresh red beets with soil notes.',
    examples: ['Some Pinot Noirs', 'Earthy reds'],
    relatedTerms: ['earthy', 'vegetal']
  },
  'big': {
    term: 'big',
    category: 'structure',
    definition: 'Bold, intense wine with high body/alcohol making strong impression.',
    examples: ['Napa Cabernet', 'Barossa Shiraz'],
    relatedTerms: ['bold', 'powerful']
  },
  'biscuit': {
    term: 'biscuit',
    category: 'aroma',
    definition: 'Bready aroma of plain biscuits or crackers from lees aging.',
    examples: ['Champagne', 'Traditional method sparkling'],
    relatedTerms: ['brioche', 'toasty']
  },
  'bitter': {
    term: 'bitter',
    category: 'taste',
    definition: 'Basic taste like unsweetened cocoa or coffee, from tannins or unripe elements.',
    examples: ['Tannic reds', 'Some Italian varieties'],
    relatedTerms: ['astringent', 'tannic']
  },
  'brioche': {
    term: 'brioche',
    category: 'aroma',
    definition: 'Rich bakery aroma of buttery brioche bread, slightly sweet and bready.',
    examples: ['Vintage Champagne', 'Aged sparkling wines'],
    relatedTerms: ['biscuit', 'toasty', 'yeasty']
  },
  'buttery': {
    term: 'buttery',
    category: 'texture',
    definition: 'Aroma or flavor of butter or cream, smooth and rich mouthfeel.',
    examples: ['Oaked Chardonnay', 'Malolactic wines'],
    relatedTerms: ['creamy', 'butter', 'butterscotch']
  },
  'boysenberry': {
    term: 'boysenberry',
    category: 'taste',
    definition: 'Mix of blackberry, raspberry, and loganberry - sweet dark and bright red notes.',
    examples: ['Zinfandel', 'Fruit-forward reds'],
    relatedTerms: ['blackberry', 'raspberry']
  },
  'boxwood': {
    term: 'boxwood',
    category: 'aroma',
    definition: 'Pungent green aroma of crushed boxwood leaves, catty and resinous.',
    examples: ['Sauvignon Blanc', 'Loire whites'],
    relatedTerms: ['green', 'herbal', 'catty']
  },
  
  // C
  'caramel': {
    term: 'caramel',
    category: 'taste',
    definition: 'Sweet, burnt sugar aroma from oak aging or oxidation.',
    examples: ['Aged Tawny Port', 'Oaked wines'],
    relatedTerms: ['butterscotch', 'toffee']
  },
  'chocolate': {
    term: 'chocolate',
    category: 'taste',
    definition: 'Rich cocoa or dark chocolate notes, often from oak or ripe fruit.',
    examples: ['Napa Cabernet', 'Malbec'],
    relatedTerms: ['cocoa', 'dark chocolate', 'mocha']
  },
  'cigar box': {
    term: 'cigar box',
    category: 'aroma',
    definition: 'Cedar wood and tobacco leaf aroma like a humidor.',
    examples: ['Aged Bordeaux', 'Rioja Gran Reserva'],
    relatedTerms: ['cedar', 'tobacco', 'humidor']
  },
  'citrus': {
    term: 'citrus',
    category: 'taste',
    definition: 'General citrus fruit character - lemon, lime, orange, grapefruit.',
    examples: ['Albariño', 'Verdicchio'],
    relatedTerms: ['lemon', 'lime', 'grapefruit']
  },
  'clove': {
    term: 'clove',
    category: 'taste',
    definition: 'Warm, sweet, aromatic spice note often from oak aging.',
    examples: ['Rioja', 'Aged Rhône wines'],
    relatedTerms: ['baking spice', 'cinnamon', 'nutmeg']
  },
  'coffee': {
    term: 'coffee',
    category: 'taste',
    definition: 'Roasted coffee bean aroma, espresso or mocha notes.',
    examples: ['Aged reds', 'Some Pinotage'],
    relatedTerms: ['espresso', 'mocha', 'roasted']
  },
  'complex': {
    term: 'complex',
    category: 'character',
    definition: 'Wine with multiple layers of aromas and flavors that evolve.',
    examples: ['Fine wines', 'Aged wines'],
    relatedTerms: ['layered', 'multifaceted']
  },
  'cooked': {
    term: 'cooked',
    category: 'taste',
    definition: 'Stewed or baked fruit character from heat or overripeness.',
    examples: ['Hot climate wines', 'Port'],
    relatedTerms: ['baked', 'stewed', 'jammy']
  },
  'creamy': {
    term: 'creamy',
    category: 'texture',
    definition: 'Smooth, velvety texture like cream, often from lees or malolactic.',
    examples: ['Champagne', 'Burgundy'],
    relatedTerms: ['silky', 'smooth', 'buttery']
  },
  'crisp': {
    term: 'crisp',
    category: 'structure',
    definition: 'Fresh and lively with bright acidity, refreshing character.',
    examples: ['Chablis', 'Albariño'],
    relatedTerms: ['fresh', 'bright', 'zesty']
  },
  
  // D-E
  'dark chocolate': {
    term: 'dark chocolate',
    category: 'taste',
    definition: 'Bitter-sweet cocoa notes, rich and intense chocolate character.',
    examples: ['Aged Cabernet', 'Barossa Shiraz'],
    relatedTerms: ['chocolate', 'cocoa', 'cacao']
  },
  'delicate': {
    term: 'delicate',
    category: 'character',
    definition: 'Light, subtle, and refined with gentle flavors requiring attention.',
    examples: ['Mosel Riesling', 'Burgundy'],
    relatedTerms: ['subtle', 'elegant', 'refined']
  },
  'dense': {
    term: 'dense',
    category: 'texture',
    definition: 'Concentrated and thick, packed with flavor and extract.',
    examples: ['Young Bordeaux', 'Amarone'],
    relatedTerms: ['concentrated', 'thick', 'extracted']
  },
  'earthy': {
    term: 'earthy',
    category: 'aroma',
    definition: 'Aromas of soil, mushroom, forest floor, or minerals.',
    examples: ['Burgundy', 'Old World wines'],
    relatedTerms: ['soil', 'terroir', 'mushroom']
  },
  'elegant': {
    term: 'elegant',
    category: 'character',
    definition: 'Refined and graceful, showing finesse rather than power.',
    examples: ['Fine Burgundy', 'Aged Bordeaux'],
    relatedTerms: ['refined', 'graceful', 'sophisticated']
  },
  'espresso': {
    term: 'espresso',
    category: 'taste',
    definition: 'Strong roasted coffee aroma, concentrated and bitter-sweet.',
    examples: ['Aged reds', 'Some Australian Shiraz'],
    relatedTerms: ['coffee', 'mocha', 'roasted']
  },
  
  // F
  'fennel': {
    term: 'fennel',
    category: 'aroma',
    definition: 'Anise-like herb with sweet licorice notes.',
    examples: ['Some Mediterranean wines', 'Vermentino'],
    relatedTerms: ['anise', 'licorice', 'herbal']
  },
  'ferrous': {
    term: 'ferrous',
    category: 'aroma',
    definition: 'Iron-like, metallic note suggesting blood or rust.',
    examples: ['Some Sangiovese', 'Aged reds'],
    relatedTerms: ['metallic', 'iron', 'blood']
  },
  'figs': {
    term: 'figs',
    category: 'taste',
    definition: 'Sweet, jammy dried fruit character.',
    examples: ['Aged Port', 'Amarone'],
    relatedTerms: ['dried fruit', 'dates', 'raisins']
  },
  'finish': {
    term: 'finish',
    category: 'structure',
    definition: 'The lasting impression after swallowing, also called aftertaste.',
    examples: ['Quality indicator in all wines'],
    relatedTerms: ['aftertaste', 'length', 'persistence']
  },
  'flabby': {
    term: 'flabby',
    category: 'structure',
    definition: 'Lacking acidity, soft and shapeless on the palate.',
    examples: ['Overripe wines', 'Low-acid varieties'],
    relatedTerms: ['flat', 'soft', 'low acid']
  },
  'floral': {
    term: 'floral',
    category: 'aroma',
    definition: 'General flower aromas - rose, violet, lavender, etc.',
    examples: ['Gewürztraminer', 'Viognier'],
    relatedTerms: ['flowers', 'perfumed', 'blossoms']
  },
  'fresh': {
    term: 'fresh',
    category: 'character',
    definition: 'Lively and vibrant, showing youth and vitality.',
    examples: ['Young whites', 'Crisp wines'],
    relatedTerms: ['vibrant', 'lively', 'youthful']
  },
  'fruity': {
    term: 'fruity',
    category: 'taste',
    definition: 'Dominated by fruit flavors rather than oak or earth.',
    examples: ['New World wines', 'Young wines'],
    relatedTerms: ['fruit-forward', 'jammy']
  },
  'full-bodied': {
    term: 'full-bodied',
    category: 'structure',
    definition: 'Rich and weighty on the palate, high in alcohol and extract.',
    examples: ['Napa Cabernet', 'Barossa Shiraz'],
    relatedTerms: ['heavy', 'rich', 'powerful']
  },
  'funky': {
    term: 'funky',
    category: 'aroma',
    definition: 'Unusual earthy or wild aromas, often from brett or natural winemaking.',
    examples: ['Natural wines', 'Some old world styles'],
    relatedTerms: ['brett', 'wild', 'barnyard']
  },
  
  // G-H
  'gamey': {
    term: 'gamey',
    category: 'aroma',
    definition: 'Wild meat aromas like venison or hung game.',
    examples: ['Aged Rhône wines', 'Mature Pinot Noir'],
    relatedTerms: ['meaty', 'wild', 'savory']
  },
  'garrigue': {
    term: 'garrigue',
    category: 'aroma',
    definition: 'Mediterranean scrubland herbs - thyme, rosemary, lavender.',
    examples: ['Southern Rhône', 'Provence wines'],
    relatedTerms: ['herbs', 'Mediterranean', 'wild herbs']
  },
  'grassy': {
    term: 'grassy',
    category: 'aroma',
    definition: 'Fresh cut grass aroma, green and vegetal.',
    examples: ['Sauvignon Blanc', 'Cool-climate whites'],
    relatedTerms: ['green', 'vegetal', 'herbal']
  },
  'gravelly': {
    term: 'gravelly',
    category: 'texture',
    definition: 'Mineral texture suggesting crushed stones or gravel.',
    examples: ['Graves wines', 'Mineral-driven wines'],
    relatedTerms: ['mineral', 'stony', 'rocky']
  },
  'green': {
    term: 'green',
    category: 'character',
    definition: 'Unripe, vegetal, or herbal characteristics.',
    examples: ['Underripe grapes', 'Cool-climate wines'],
    relatedTerms: ['vegetal', 'herbal', 'unripe']
  },
  'herbaceous': {
    term: 'herbaceous',
    category: 'aroma',
    definition: 'Green herb aromas like grass, leaves, or stems.',
    examples: ['Cabernet Franc', 'Sauvignon Blanc'],
    relatedTerms: ['herbal', 'green', 'leafy']
  },
  'hot': {
    term: 'hot',
    category: 'structure',
    definition: 'Excessive alcohol creating burning sensation.',
    examples: ['High-alcohol wines', 'Unbalanced wines'],
    relatedTerms: ['alcoholic', 'burning', 'warming']
  },
  'jammy': {
    term: 'jammy',
    category: 'taste',
    definition: 'Sweet, cooked fruit character like fruit preserves.',
    examples: ['Warm-climate reds', 'Zinfandel'],
    relatedTerms: ['cooked fruit', 'sweet', 'concentrated']
  },
  'juicy': {
    term: 'juicy',
    category: 'texture',
    definition: 'Mouth-watering, fresh fruit character with good acidity.',
    examples: ['Beaujolais', 'Fresh reds'],
    relatedTerms: ['succulent', 'fresh', 'mouth-watering']
  },
  
  // L-M
  'lean': {
    term: 'lean',
    category: 'structure',
    definition: 'Lacking richness or body, austere and angular.',
    examples: ['Cool-climate wines', 'High-acid wines'],
    relatedTerms: ['austere', 'angular', 'thin']
  },
  'leafy': {
    term: 'leafy',
    category: 'aroma',
    definition: 'Green leaf aromas, often from stems or underripe grapes.',
    examples: ['Cool-climate Cabernet', 'Some Pinot Noir'],
    relatedTerms: ['green', 'herbaceous', 'vegetal']
  },
  'licorice': {
    term: 'licorice',
    category: 'taste',
    definition: 'Sweet anise or fennel flavor, black licorice candy.',
    examples: ['Some Syrah', 'Pastis-influenced wines'],
    relatedTerms: ['anise', 'fennel', 'star anise']
  },
  'light-bodied': {
    term: 'light-bodied',
    category: 'structure',
    definition: 'Delicate weight on palate, low alcohol and extract.',
    examples: ['Pinot Grigio', 'Beaujolais'],
    relatedTerms: ['delicate', 'light', 'thin']
  },
  'long': {
    term: 'long',
    category: 'structure',
    definition: 'Extended finish that lingers on the palate.',
    examples: ['Quality wines', 'Aged wines'],
    relatedTerms: ['finish', 'persistent', 'lingering']
  },
  'meaty': {
    term: 'meaty',
    category: 'aroma',
    definition: 'Savory meat aromas like beef, bacon, or charcuterie.',
    examples: ['Syrah', 'Aged reds'],
    relatedTerms: ['savory', 'umami', 'bacon']
  },
  'medium-bodied': {
    term: 'medium-bodied',
    category: 'structure',
    definition: 'Moderate weight on palate, between light and full.',
    examples: ['Merlot', 'Côtes du Rhône'],
    relatedTerms: ['moderate', 'balanced']
  },
  'mellow': {
    term: 'mellow',
    category: 'character',
    definition: 'Soft, smooth, and mature without harsh edges.',
    examples: ['Aged wines', 'Mature tannins'],
    relatedTerms: ['soft', 'smooth', 'mature']
  },
  'mineral': {
    term: 'mineral',
    category: 'aroma',
    definition: 'Stone, chalk, or metal notes suggesting terroir.',
    examples: ['Chablis', 'Loire wines'],
    relatedTerms: ['stony', 'flinty', 'chalky']
  },
  'mocha': {
    term: 'mocha',
    category: 'taste',
    definition: 'Coffee and chocolate combination, rich and sweet.',
    examples: ['Oak-aged reds', 'Some Malbec'],
    relatedTerms: ['coffee', 'chocolate', 'espresso']
  },
  'mushroom': {
    term: 'mushroom',
    category: 'aroma',
    definition: 'Earthy fungal aroma, forest floor or truffle notes.',
    examples: ['Aged Burgundy', 'Mature wines'],
    relatedTerms: ['earthy', 'truffle', 'umami']
  },
  
  // N-O
  'nervy': {
    term: 'nervy',
    category: 'structure',
    definition: 'Racy acidity giving energy and tension.',
    examples: ['Riesling', 'Loire wines'],
    relatedTerms: ['racy', 'tense', 'electric']
  },
  'nutty': {
    term: 'nutty',
    category: 'taste',
    definition: 'General nut aromas - almond, hazelnut, walnut.',
    examples: ['Aged whites', 'Sherry'],
    relatedTerms: ['almond', 'hazelnut', 'walnut']
  },
  'oaky': {
    term: 'oaky',
    category: 'aroma',
    definition: 'Pronounced oak influence - vanilla, toast, smoke.',
    examples: ['California Chardonnay', 'Rioja'],
    relatedTerms: ['oak', 'vanilla', 'toasty']
  },
  'oily': {
    term: 'oily',
    category: 'texture',
    definition: 'Viscous, slick texture coating the palate.',
    examples: ['Viognier', 'Some Rieslings'],
    relatedTerms: ['viscous', 'unctuous', 'rich']
  },
  'oxidized': {
    term: 'oxidized',
    category: 'character',
    definition: 'Exposed to oxygen, nutty or sherry-like character.',
    examples: ['Sherry', 'Some natural wines'],
    relatedTerms: ['oxidative', 'nutty', 'aged']
  },
  
  // P-R
  'peppery': {
    term: 'peppery',
    category: 'taste',
    definition: 'Black or white pepper spice notes.',
    examples: ['Syrah', 'Grüner Veltliner'],
    relatedTerms: ['black pepper', 'white pepper', 'spicy']
  },
  'plush': {
    term: 'plush',
    category: 'texture',
    definition: 'Soft, luxurious, velvety mouthfeel.',
    examples: ['Napa Valley wines', 'Pomerol'],
    relatedTerms: ['velvety', 'lush', 'soft']
  },
  'powerful': {
    term: 'powerful',
    category: 'character',
    definition: 'Intense, concentrated, and forceful.',
    examples: ['Barossa Shiraz', 'Napa Cabernet'],
    relatedTerms: ['intense', 'concentrated', 'big']
  },
  'rich': {
    term: 'rich',
    category: 'character',
    definition: 'Full of flavor, texture, and complexity.',
    examples: ['Aged wines', 'Premium wines'],
    relatedTerms: ['lush', 'opulent', 'concentrated']
  },
  'robust': {
    term: 'robust',
    category: 'character',
    definition: 'Strong, powerful, and full-bodied.',
    examples: ['Big reds', 'Tannic wines'],
    relatedTerms: ['powerful', 'strong', 'sturdy']
  },
  'rustic': {
    term: 'rustic',
    category: 'character',
    definition: 'Rough, countrified character, not polished.',
    examples: ['Traditional wines', 'Natural wines'],
    relatedTerms: ['earthy', 'rough', 'traditional']
  },
  
  // S
  'savory': {
    term: 'savory',
    category: 'taste',
    definition: 'Umami, meaty, or herbal rather than fruity.',
    examples: ['Aged wines', 'Northern Rhône'],
    relatedTerms: ['umami', 'meaty', 'herbal']
  },
  'silky': {
    term: 'silky',
    category: 'texture',
    definition: 'Extremely smooth, fine tannins like silk fabric.',
    examples: ['Aged Burgundy', 'Fine Pinot Noir'],
    relatedTerms: ['smooth', 'velvety', 'satin']
  },
  'smoky': {
    term: 'smoky',
    category: 'aroma',
    definition: 'Smoke, char, or toasted aromas.',
    examples: ['Northern Rhône', 'Toasted oak wines'],
    relatedTerms: ['charred', 'toasted', 'ashy']
  },
  'smooth': {
    term: 'smooth',
    category: 'texture',
    definition: 'No rough edges, well-integrated tannins.',
    examples: ['Aged wines', 'Merlot'],
    relatedTerms: ['soft', 'silky', 'polished']
  },
  'soft': {
    term: 'soft',
    category: 'texture',
    definition: 'Low tannins or acid, gentle on palate.',
    examples: ['Merlot', 'Aged wines'],
    relatedTerms: ['smooth', 'mellow', 'gentle']
  },
  'sour': {
    term: 'sour',
    category: 'taste',
    definition: 'Sharp acidity, tart or acidic taste.',
    examples: ['High-acid wines', 'Some natural wines'],
    relatedTerms: ['tart', 'acidic', 'sharp']
  },
  'steely': {
    term: 'steely',
    category: 'character',
    definition: 'Firm, mineral, austere with sharp acidity.',
    examples: ['Chablis', 'Mosel Riesling'],
    relatedTerms: ['mineral', 'austere', 'firm']
  },
  'structured': {
    term: 'structured',
    category: 'character',
    definition: 'Well-defined tannins and acid providing framework.',
    examples: ['Bordeaux', 'Age-worthy wines'],
    relatedTerms: ['tannic', 'firm', 'architectural']
  },
  
  // T-Z
  'tannic': {
    term: 'tannic',
    category: 'texture',
    definition: 'High in tannins, causing drying sensation.',
    examples: ['Young Cabernet', 'Nebbiolo'],
    relatedTerms: ['astringent', 'grippy', 'drying']
  },
  'tart': {
    term: 'tart',
    category: 'taste',
    definition: 'Sharp, acidic taste making mouth pucker.',
    examples: ['Cool-climate wines', 'Young wines'],
    relatedTerms: ['sour', 'acidic', 'sharp']
  },
  'tight': {
    term: 'tight',
    category: 'character',
    definition: 'Closed, not showing full potential yet.',
    examples: ['Young fine wines', 'Recently opened bottles'],
    relatedTerms: ['closed', 'reticent', 'backward']
  },
  'unctuous': {
    term: 'unctuous',
    category: 'texture',
    definition: 'Rich, oily, coating texture.',
    examples: ['Sauternes', 'Late harvest wines'],
    relatedTerms: ['oily', 'viscous', 'coating']
  },
  'vegetal': {
    term: 'vegetal',
    category: 'aroma',
    definition: 'Green vegetable aromas, sometimes undesirable.',
    examples: ['Underripe grapes', 'Some Cabernet'],
    relatedTerms: ['green', 'herbaceous', 'leafy']
  },
  'viscous': {
    term: 'viscous',
    category: 'texture',
    definition: 'Thick, syrupy consistency.',
    examples: ['Dessert wines', 'High-alcohol wines'],
    relatedTerms: ['thick', 'syrupy', 'oily']
  },
  'woody': {
    term: 'woody',
    category: 'aroma',
    definition: 'Excessive oak or wood flavors.',
    examples: ['Over-oaked wines', 'New oak barrels'],
    relatedTerms: ['oaky', 'cedar', 'oak']
  },
  'yeasty': {
    term: 'yeasty',
    category: 'aroma',
    definition: 'Bread dough or brewery aromas from lees.',
    examples: ['Champagne', 'Sur lie wines'],
    relatedTerms: ['bready', 'autolytic', 'brioche']
  },
  'young': {
    term: 'young',
    category: 'character',
    definition: 'Recently made, not yet mature or developed.',
    examples: ['Current vintage wines', 'Fresh wines'],
    relatedTerms: ['youthful', 'fresh', 'primary']
  },
  'zesty': {
    term: 'zesty',
    category: 'character',
    definition: 'Bright, lively with citrus freshness.',
    examples: ['Albariño', 'Vermentino'],
    relatedTerms: ['citrusy', 'bright', 'fresh']
  },
  
  // Texture & Structure
  'lush': {
    term: 'lush',
    category: 'texture',
    definition: 'Sumptuously rich and soft on the palate, often low in acidity but full of ripe fruit.',
    examples: ['Napa Valley Chardonnay', 'Amarone'],
    relatedTerms: ['voluptuous', 'opulent']
  },
  'voluptuous': {
    term: 'voluptuous',
    category: 'texture',
    definition: 'Luxuriously full-bodied and caressing in mouthfeel; indulgent in flavor.',
    examples: ['Barossa Shiraz', 'Châteauneuf-du-Pape'],
    relatedTerms: ['lush', 'seductive']
  },
  'seductive': {
    term: 'seductive',
    category: 'texture',
    definition: 'Alluring wine with soft, inviting texture and engaging aromatics.',
    examples: ['Burgundy Pinot Noir', 'Champagne'],
    relatedTerms: ['voluptuous', 'silky']
  },
  'linear': {
    term: 'linear',
    category: 'texture',
    definition: 'Focused, direct wine that evolves in a clean progression.',
    examples: ['German Riesling', 'Chablis'],
    relatedTerms: ['precise', 'focused']
  },
  'layered': {
    term: 'layered',
    category: 'texture',
    definition: 'Wine showing multiple distinct elements that unfold over time.',
    examples: ['Grand Cru Burgundy', 'Aged Bordeaux'],
    relatedTerms: ['complex', 'multifaceted']
  },
  'textbook': {
    term: 'textbook',
    category: 'character',
    definition: 'Perfect example of its varietal or regional type.',
    examples: ['Sancerre', 'Mosel Riesling'],
    relatedTerms: ['classic', 'typical']
  },
  'opulent': {
    term: 'opulent',
    category: 'texture',
    definition: 'Rich and lavish, displaying extravagant depth with silky mouthfeel.',
    examples: ['Napa Cabernet', 'Pomerol'],
    relatedTerms: ['lush', 'voluptuous']
  },

  // Acidity & Freshness
  'vibrant': {
    term: 'vibrant',
    category: 'structure',
    definition: 'Full of energy, with lively acidity giving freshness and vitality.',
    examples: ['Loire Valley wines', 'Vinho Verde'],
    relatedTerms: ['racy', 'zesty']
  },
  'racy': {
    term: 'racy',
    category: 'structure',
    definition: 'Marked by high, mouthwatering acidity with energy and lift.',
    examples: ['Mosel Riesling', 'Sancerre'],
    relatedTerms: ['vibrant', 'zippy']
  },
  'zesty': {
    term: 'zesty',
    category: 'structure',
    definition: 'Bright citrus-like acidity, refreshing and clean.',
    examples: ['Albariño', 'Verdicchio'],
    relatedTerms: ['racy', 'crisp']
  },
  'piercing': {
    term: 'piercing',
    category: 'structure',
    definition: 'Intensely sharp acidity that cuts distinctly through the palate.',
    examples: ['Young Riesling', 'Txakoli'],
    relatedTerms: ['sharp', 'angular']
  },

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
  
  // Tropical Fruits
  'pineapple': {
    term: 'pineapple',
    category: 'taste',
    definition: 'Tropical sweetness in ripe Chardonnay and Chenin Blanc.',
    examples: ['California Chardonnay', 'South African Chenin'],
    relatedTerms: ['tropical fruit', 'mango']
  },
  'mango': {
    term: 'mango',
    category: 'taste',
    definition: 'Exotic, sweet tropical fruit in aromatic varieties.',
    examples: ['Viognier', 'Albariño'],
    relatedTerms: ['tropical fruit', 'peach']
  },
  'passion fruit': {
    term: 'passion fruit',
    category: 'taste',
    definition: 'Intense tropical aroma in New World Sauvignon Blanc.',
    examples: ['Marlborough Sauvignon Blanc'],
    relatedTerms: ['tropical fruit', 'guava']
  },
  'lychee': {
    term: 'lychee',
    category: 'taste',
    definition: 'Distinctive sweet-floral fruit in Gewürztraminer.',
    examples: ['Alsace Gewürztraminer'],
    relatedTerms: ['rose', 'exotic fruit']
  },
  'guava': {
    term: 'guava',
    category: 'taste',
    definition: 'Tropical fruit with musky sweetness, found in aromatic whites.',
    examples: ['New Zealand Sauvignon Blanc', 'Torrontés'],
    relatedTerms: ['passion fruit', 'tropical']
  },
  'melon': {
    term: 'melon',
    category: 'taste',
    definition: 'Soft, sweet fruit character in light whites.',
    examples: ['Pinot Grigio', 'Muscadet'],
    relatedTerms: ['cantaloupe', 'honeydew']
  },
  
  // Dried & Cooked Fruits
  'raisin': {
    term: 'raisin',
    category: 'taste',
    definition: 'Dried grape sweetness in late-harvest and aged wines.',
    examples: ['Amarone', 'Pedro Ximénez Sherry'],
    relatedTerms: ['dried fruit', 'sultana']
  },
  'prune': {
    term: 'prune',
    category: 'taste',
    definition: 'Dried plum notes indicating very ripe or aged character.',
    examples: ['Aged Zinfandel', 'Vintage Port'],
    relatedTerms: ['plum', 'dried fruit']
  },
  'brambly': {
    term: 'brambly',
    category: 'taste',
    definition: 'Wild blackberries or raspberries, often slightly earthy.',
    examples: ['Côtes du Rhône', 'Old vine Zinfandel'],
    relatedTerms: ['blackberry', 'wild berries']
  },
  'stewed': {
    term: 'stewed',
    category: 'taste',
    definition: 'Cooked or preserved fruit, suggesting warmth or overripeness.',
    examples: ['Hot vintage wines', 'Late harvest reds'],
    relatedTerms: ['cooked', 'jammy']
  },
  'fleshy': {
    term: 'fleshy',
    category: 'texture',
    definition: 'Ripe and succulent fruit character, juicy and rich.',
    examples: ['Grenache', 'Ripe Chardonnay'],
    relatedTerms: ['juicy', 'succulent']
  },
  'macerated': {
    term: 'macerated',
    category: 'taste',
    definition: 'Fruit softened and intensified by soaking, richer or sweeter.',
    examples: ['Orange wines', 'Amarone'],
    relatedTerms: ['steeped', 'extracted']
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
  
  // Tannins & Finish
  'supple': {
    term: 'supple',
    category: 'texture',
    definition: 'Smooth, flexible tannins that gently structure without astringency.',
    examples: ['Aged Bordeaux', 'Valpolicella'],
    relatedTerms: ['silky', 'velvety']
  },
  'grippy': {
    term: 'grippy',
    category: 'texture',
    definition: 'Noticeably firm tannins that cling to the palate with drying sensation.',
    examples: ['Young Barolo', 'Tannat'],
    relatedTerms: ['chewy', 'austere']
  },
  'velvety': {
    term: 'velvety',
    category: 'texture',
    definition: 'Extremely smooth tannins with plush, soft mouthfeel.',
    examples: ['Aged Pomerol', 'Top Rioja'],
    relatedTerms: ['silky', 'supple']
  },
  'dusty': {
    term: 'dusty',
    category: 'texture',
    definition: 'Fine-grained, dry tannins with powdered texture, subtle but lingering.',
    examples: ['Rutherford Cabernet', 'Brunello'],
    relatedTerms: ['chalky', 'powdery']
  },
  'chewy': {
    term: 'chewy',
    category: 'texture',
    definition: 'Rich, dense tannins creating substantial texture sensation.',
    examples: ['Young Napa Cabernet', 'Cahors'],
    relatedTerms: ['grippy', 'muscular']
  },

  // Complexity & Development
  'multifaceted': {
    term: 'multifaceted',
    category: 'character',
    definition: 'Numerous distinct aromas and flavors indicating high complexity.',
    examples: ['Grand Cru Burgundy', 'Vintage Champagne'],
    relatedTerms: ['layered', 'complex']
  },
  'brooding': {
    term: 'brooding',
    category: 'character',
    definition: 'Deep and closed initially, revealing complexity with time.',
    examples: ['Young Barolo', 'Northern Rhône Syrah'],
    relatedTerms: ['reticent', 'backward']
  },
  'nuanced': {
    term: 'nuanced',
    category: 'character',
    definition: 'Subtle complexities requiring careful attention to appreciate.',
    examples: ['Aged Burgundy', 'Fine German Riesling'],
    relatedTerms: ['delicate', 'subtle']
  },
  'evolving': {
    term: 'evolving',
    category: 'character',
    definition: 'Continuously changing and unfolding new characteristics.',
    examples: ['Decanted Bordeaux', 'Aged Barolo'],
    relatedTerms: ['developing', 'opening']
  },

  // Earth & Mineral
  'flinty': {
    term: 'flinty',
    category: 'aroma',
    definition: 'Stony mineral aroma reminiscent of struck flint or wet stones.',
    examples: ['Pouilly-Fumé', 'Sancerre'],
    relatedTerms: ['mineral', 'wet stone']
  },
  'graphite': {
    term: 'graphite',
    category: 'aroma',
    definition: 'Mineral aroma like pencil lead in structured, mineral-driven wines.',
    examples: ['Pauillac', 'Priorat'],
    relatedTerms: ['pencil lead', 'mineral']
  },
  'loamy': {
    term: 'loamy',
    category: 'aroma',
    definition: 'Earthy aroma reminiscent of fertile, rich soil.',
    examples: ['Burgundy', 'Piedmont wines'],
    relatedTerms: ['earthy', 'soil']
  },
  'chalky': {
    term: 'chalky',
    category: 'texture',
    definition: 'Mineral note suggesting crushed chalk with dry texture.',
    examples: ['Champagne', 'White Burgundy'],
    relatedTerms: ['mineral', 'limestone']
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
  'lavender': {
    term: 'lavender',
    category: 'aroma',
    definition: 'Aromatic purple flower scent in Rhône blends.',
    examples: ['Châteauneuf-du-Pape', 'Côtes de Provence'],
    relatedTerms: ['floral', 'herbal']
  },
  'honeysuckle': {
    term: 'honeysuckle',
    category: 'aroma',
    definition: 'Sweet floral aroma in aromatic whites.',
    examples: ['Riesling', 'Chenin Blanc'],
    relatedTerms: ['floral', 'jasmine']
  },
  'orange blossom': {
    term: 'orange blossom',
    category: 'aroma',
    definition: 'Citrus flower aroma in Mediterranean whites.',
    examples: ['Albariño', 'Fiano'],
    relatedTerms: ['floral', 'citrus']
  },
  'jasmine': {
    term: 'jasmine',
    category: 'aroma',
    definition: 'Intense white flower aroma in aromatic varieties.',
    examples: ['Torrontés', 'Viognier'],
    relatedTerms: ['floral', 'honeysuckle']
  },
  'elderflower': {
    term: 'elderflower',
    category: 'aroma',
    definition: 'Delicate, muscat-like floral in aromatic whites.',
    examples: ['Sauvignon Blanc', 'Grüner Veltliner'],
    relatedTerms: ['floral', 'muscat']
  },
  'lifted': {
    term: 'lifted',
    category: 'aroma',
    definition: 'Bright, pronounced aromatic intensity, often floral or fruity.',
    examples: ['Cool-climate wines', 'Young aromatics'],
    relatedTerms: ['aromatic', 'perfumed']
  },
  'perfumed': {
    term: 'perfumed',
    category: 'aroma',
    definition: 'Intense and attractive aromas, often floral or exotic.',
    examples: ['Barolo', 'Northern Rhône Syrah'],
    relatedTerms: ['aromatic', 'fragrant']
  },
  'exotic': {
    term: 'exotic',
    category: 'aroma',
    definition: 'Intriguing and unusual aromas, often tropical or floral.',
    examples: ['Gewürztraminer', 'Torrontés'],
    relatedTerms: ['unusual', 'distinctive']
  },
  
  // Herbs & Vegetables
  'sage': {
    term: 'sage',
    category: 'aroma',
    definition: 'Earthy herb character in rustic reds.',
    examples: ['Sangiovese', 'Tempranillo'],
    relatedTerms: ['herbs', 'savory']
  },
  'mint': {
    term: 'mint',
    category: 'aroma',
    definition: 'Fresh, cooling herb often in Australian Cabernet.',
    examples: ['Coonawarra Cabernet', 'Washington State wines'],
    relatedTerms: ['eucalyptus', 'menthol']
  },
  'green bell pepper': {
    term: 'green bell pepper',
    category: 'aroma',
    definition: 'Vegetal note in underripe Cabernet.',
    examples: ['Cool-climate Cabernet', 'Loire Cabernet Franc'],
    relatedTerms: ['pyrazine', 'vegetal']
  },
  'asparagus': {
    term: 'asparagus',
    category: 'aroma',
    definition: 'Green vegetable note in Sauvignon Blanc.',
    examples: ['Loire Sauvignon', 'Cool-climate examples'],
    relatedTerms: ['vegetal', 'green']
  },
  'grass': {
    term: 'grass',
    category: 'aroma',
    definition: 'Fresh-cut grass in crisp whites.',
    examples: ['Sauvignon Blanc', 'Grüner Veltliner'],
    relatedTerms: ['green', 'herbal']
  },
  'hay': {
    term: 'hay',
    category: 'aroma',
    definition: 'Dried grass aroma in aged whites.',
    examples: ['Aged Chenin Blanc', 'Oxidative whites'],
    relatedTerms: ['dried herbs', 'straw']
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
  'white pepper': {
    term: 'white pepper',
    category: 'taste',
    definition: 'Milder pepper spice in aromatic whites.',
    examples: ['Grüner Veltliner', 'Gewürztraminer'],
    relatedTerms: ['black pepper', 'spice']
  },
  'clove': {
    term: 'clove',
    category: 'taste',
    definition: 'Warm, sweet, aromatic spice note from oak aging.',
    examples: ['Rioja', 'Aged Rhône wines'],
    relatedTerms: ['baking spice', 'cinnamon']
  },
  'nutmeg': {
    term: 'nutmeg',
    category: 'taste',
    definition: 'Sweet, warm spice often from oak influence.',
    examples: ['Aged Chardonnay', 'Vintage Port'],
    relatedTerms: ['baking spice', 'cinnamon']
  },
  'allspice': {
    term: 'allspice',
    category: 'taste',
    definition: 'Spice combining cinnamon, nutmeg, and cloves.',
    examples: ['Oak-aged wines', 'Rhône blends'],
    relatedTerms: ['baking spice', 'complex spice']
  },
  'cedar': {
    term: 'cedar',
    category: 'aroma',
    definition: 'Wood aroma like pencil shavings or cedar boxes.',
    examples: ['Aged Bordeaux', 'Rioja Reserva'],
    relatedTerms: ['oak', 'cigar box']
  },
  'toasty': {
    term: 'toasty',
    category: 'aroma',
    definition: 'Toasted oak aromas like freshly baked bread.',
    examples: ['Champagne', 'Oaked Chardonnay'],
    relatedTerms: ['oak', 'brioche']
  },
  'vanillin': {
    term: 'vanillin',
    category: 'taste',
    definition: 'Sweet spice from oak aging, distinct vanilla aroma.',
    examples: ['American oak aged wines', 'Rioja'],
    relatedTerms: ['vanilla', 'oak']
  },
  'spicy': {
    term: 'spicy',
    category: 'taste',
    definition: 'General spice notes adding complexity and depth.',
    examples: ['Syrah', 'Gewürztraminer'],
    relatedTerms: ['pepper', 'cinnamon', 'clove']
  },
  
  // Sweetness & Balance
  'off-dry': {
    term: 'off-dry',
    category: 'taste',
    definition: 'Slightly sweet, not completely dry but subtly sweet.',
    examples: ['Kabinett Riesling', 'Vouvray'],
    relatedTerms: ['demi-sec', 'halbtrocken']
  },
  'rounded': {
    term: 'rounded',
    category: 'texture',
    definition: 'Harmonious balance with no harsh edges.',
    examples: ['Well-aged wines', 'Quality Chardonnay'],
    relatedTerms: ['balanced', 'integrated']
  },
  'polished': {
    term: 'polished',
    category: 'texture',
    definition: 'Smooth, well-integrated components creating refinement.',
    examples: ['Grand Cru wines', 'Top estates'],
    relatedTerms: ['refined', 'elegant']
  },
  
  // Alcohol & Body
  'warming': {
    term: 'warming',
    category: 'texture',
    definition: 'Noticeable alcohol warmth creating richness or heat.',
    examples: ['High-alcohol reds', 'Amarone'],
    relatedTerms: ['hot', 'alcoholic']
  },
  'heady': {
    term: 'heady',
    category: 'texture',
    definition: 'Potent alcoholic impression, robust and powerful.',
    examples: ['Barossa Shiraz', 'Zinfandel'],
    relatedTerms: ['warming', 'powerful']
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