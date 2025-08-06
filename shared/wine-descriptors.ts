export interface WineDescriptor {
  term: string;
  category: 'aroma' | 'taste' | 'texture' | 'structure' | 'character';
  definition: string;
  examples?: string[];
  relatedTerms?: string[];
}

export const wineDescriptors: Record<string, WineDescriptor> = {
  // AROMA DESCRIPTORS
  'acacia': {
    term: 'acacia',
    category: 'aroma',
    definition: 'Delicate floral aroma of acacia blossoms, sweet and lightly fragrant with honeyed flower scents.',
    examples: ['White Rhône blends', 'Viognier'],
    relatedTerms: ['floral', 'honeysuckle']
  },
  'anise': {
    term: 'anise',
    category: 'aroma',
    definition: 'Spice note of licorice or fennel seed, sweet-herbal character.',
    examples: ['Some Rhône wines', 'Certain Rieslings'],
    relatedTerms: ['licorice', 'fennel']
  },
  'ashy': {
    term: 'ashy',
    category: 'aroma',
    definition: 'Smell of ash or soot, like from a fireplace, dry or smoky character.',
    examples: ['Volcanic wines', 'Some aged reds'],
    relatedTerms: ['smoky', 'charred']
  },
  'autolytic': {
    term: 'autolytic',
    category: 'aroma',
    definition: 'Aromas from yeast breakdown like bread dough, brioche, or biscuit.',
    examples: ['Champagne', 'Aged sparkling wines'],
    relatedTerms: ['yeasty', 'brioche', 'biscuit']
  },
  'bacon fat': {
    term: 'bacon fat',
    category: 'aroma',
    definition: 'Rich, savory aroma of smoked bacon or cured meats.',
    examples: ['Northern Rhône Syrah', 'Some aged reds'],
    relatedTerms: ['meaty', 'smoky']
  },
  'balsamic': {
    term: 'balsamic',
    category: 'aroma',
    definition: 'Sweet-sour, woody scent like balsamic vinegar or aromatic resins.',
    examples: ['Aged Italian reds', 'Barolo'],
    relatedTerms: ['resinous', 'aged']
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
  'biscuit': {
    term: 'biscuit',
    category: 'aroma',
    definition: 'Bready aroma of plain biscuits or crackers from lees aging.',
    examples: ['Champagne', 'Traditional method sparkling'],
    relatedTerms: ['brioche', 'toasty']
  },
  'boxwood': {
    term: 'boxwood',
    category: 'aroma',
    definition: 'Pungent green aroma of crushed boxwood leaves, catty and resinous.',
    examples: ['Sauvignon Blanc', 'Loire whites'],
    relatedTerms: ['green', 'herbal', 'catty']
  },
  'brioche': {
    term: 'brioche',
    category: 'aroma',
    definition: 'Rich bakery aroma of buttery brioche bread, slightly sweet and bready.',
    examples: ['Vintage Champagne', 'Aged sparkling wines'],
    relatedTerms: ['biscuit', 'toasty', 'yeasty']
  },
  'cedar': {
    term: 'cedar',
    category: 'aroma',
    definition: 'Cedar wood and tobacco leaf aroma like a humidor.',
    examples: ['Aged Bordeaux', 'Rioja Gran Reserva'],
    relatedTerms: ['tobacco', 'humidor', 'cigar box']
  },
  'cigar box': {
    term: 'cigar box',
    category: 'aroma',
    definition: 'Cedar wood and tobacco leaf aroma like a humidor.',
    examples: ['Aged Bordeaux', 'Rioja Gran Reserva'],
    relatedTerms: ['cedar', 'tobacco', 'humidor']
  },
  'earthy': {
    term: 'earthy',
    category: 'aroma',
    definition: 'Aromas of soil, mushroom, forest floor, or minerals.',
    examples: ['Burgundy', 'Old World wines'],
    relatedTerms: ['soil', 'terroir', 'mushroom']
  },
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
  'floral': {
    term: 'floral',
    category: 'aroma',
    definition: 'General flower aromas - rose, violet, lavender, etc.',
    examples: ['Gewürztraminer', 'Viognier'],
    relatedTerms: ['flowers', 'perfumed', 'blossoms']
  },
  'funky': {
    term: 'funky',
    category: 'aroma',
    definition: 'Unusual earthy or wild aromas, often from brett or natural winemaking.',
    examples: ['Natural wines', 'Some old world styles'],
    relatedTerms: ['brett', 'wild', 'barnyard']
  },
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
  'herbaceous': {
    term: 'herbaceous',
    category: 'aroma',
    definition: 'Green herb aromas like grass, leaves, or stems.',
    examples: ['Cabernet Franc', 'Sauvignon Blanc'],
    relatedTerms: ['herbal', 'green', 'leafy']
  },
  'leafy': {
    term: 'leafy',
    category: 'aroma',
    definition: 'Green leaf aromas, often from stems or underripe grapes.',
    examples: ['Cool-climate Cabernet', 'Some Pinot Noir'],
    relatedTerms: ['green', 'herbaceous', 'vegetal']
  },
  'meaty': {
    term: 'meaty',
    category: 'aroma',
    definition: 'Savory meat aromas like beef, bacon, or charcuterie.',
    examples: ['Syrah', 'Aged reds'],
    relatedTerms: ['savory', 'umami', 'bacon']
  },
  'mineral': {
    term: 'mineral',
    category: 'aroma',
    definition: 'Stone, chalk, or metal notes suggesting terroir.',
    examples: ['Chablis', 'Loire wines'],
    relatedTerms: ['stony', 'flinty', 'chalky']
  },
  'mushroom': {
    term: 'mushroom',
    category: 'aroma',
    definition: 'Earthy fungal aroma, forest floor or truffle notes.',
    examples: ['Aged Burgundy', 'Mature wines'],
    relatedTerms: ['earthy', 'truffle', 'umami']
  },
  'oaky': {
    term: 'oaky',
    category: 'aroma',
    definition: 'Pronounced oak influence - vanilla, toast, smoke.',
    examples: ['California Chardonnay', 'Rioja'],
    relatedTerms: ['oak', 'vanilla', 'toasty']
  },
  'smoky': {
    term: 'smoky',
    category: 'aroma',
    definition: 'Smoke, char, or toasted aromas.',
    examples: ['Northern Rhône', 'Toasted oak wines'],
    relatedTerms: ['charred', 'toasted', 'ashy']
  },
  'toasty': {
    term: 'toasty',
    category: 'aroma',
    definition: 'Toasted bread or oak aromas from barrel aging.',
    examples: ['Aged wines', 'Oak-influenced wines'],
    relatedTerms: ['brioche', 'biscuit', 'oak']
  },
  'vegetal': {
    term: 'vegetal',
    category: 'aroma',
    definition: 'Green vegetable aromas, sometimes undesirable.',
    examples: ['Underripe grapes', 'Some Cabernet'],
    relatedTerms: ['green', 'herbaceous', 'leafy']
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

  // TASTE DESCRIPTORS
  'almond': {
    term: 'almond',
    category: 'taste',
    definition: 'Nutty aroma or flavor of almonds, raw and slightly bitter or sweet like marzipan.',
    examples: ['Aged whites', 'Some sparkling wines'],
    relatedTerms: ['nutty', 'marzipan']
  },
  'apple': {
    term: 'apple',
    category: 'taste',
    definition: 'Fresh orchard fruit ranging from tart green to sweet red varieties.',
    examples: ['Chardonnay', 'Cool-climate whites'],
    relatedTerms: ['green apple', 'orchard fruit']
  },
  'green apple': {
    term: 'green apple',
    category: 'taste',
    definition: 'Tart, crisp fruit indicating high acidity and freshness.',
    examples: ['Chablis', 'Young Riesling'],
    relatedTerms: ['apple', 'tart', 'crisp']
  },
  'apricot': {
    term: 'apricot',
    category: 'taste',
    definition: 'Delicate stone fruit, often in aromatic whites and dessert wines.',
    examples: ['Viognier', 'Late harvest wines'],
    relatedTerms: ['stone fruit', 'peach']
  },
  'baked': {
    term: 'baked',
    category: 'taste',
    definition: 'Flavors of stewed or overripe fruit, as if baked by heat.',
    examples: ['Hot vintage wines', 'Overripe grapes'],
    relatedTerms: ['stewed', 'cooked']
  },
  'banana': {
    term: 'banana',
    category: 'taste',
    definition: 'Fruity aroma of bananas, often from fermentation esters.',
    examples: ['Beaujolais Nouveau', 'Some young wines'],
    relatedTerms: ['tropical', 'estery']
  },
  'bitter': {
    term: 'bitter',
    category: 'taste',
    definition: 'Basic taste like unsweetened cocoa or coffee, from tannins or unripe elements.',
    examples: ['Tannic reds', 'Some Italian varieties'],
    relatedTerms: ['astringent', 'tannic']
  },
  'black cherry': {
    term: 'black cherry',
    category: 'taste',
    definition: 'Rich, dark fruit with slight tartness in mature reds.',
    examples: ['Cabernet Sauvignon', 'Syrah'],
    relatedTerms: ['cherry', 'dark fruit']
  },
  'blackberry': {
    term: 'blackberry',
    category: 'taste',
    definition: 'Dark, jammy fruit typical of ripe Cabernet and Syrah.',
    examples: ['Zinfandel', 'Malbec'],
    relatedTerms: ['dark fruit', 'jammy']
  },
  'blackcurrant': {
    term: 'blackcurrant',
    category: 'taste',
    definition: 'Black currant, hallmark of quality Cabernet Sauvignon.',
    examples: ['Bordeaux', 'Napa Cabernet'],
    relatedTerms: ['cassis', 'dark fruit']
  },
  'blueberry': {
    term: 'blueberry',
    category: 'taste',
    definition: 'Sweet dark berry common in warm-climate Syrah.',
    examples: ['Malbec', 'Some Syrahs'],
    relatedTerms: ['dark fruit', 'berry']
  },
  'boysenberry': {
    term: 'boysenberry',
    category: 'taste',
    definition: 'Mix of blackberry, raspberry, and loganberry - sweet dark and bright red notes.',
    examples: ['Zinfandel', 'Fruit-forward reds'],
    relatedTerms: ['blackberry', 'raspberry']
  },
  'caramel': {
    term: 'caramel',
    category: 'taste',
    definition: 'Sweet, burnt sugar aroma from oak aging or oxidation.',
    examples: ['Aged Tawny Port', 'Oaked wines'],
    relatedTerms: ['butterscotch', 'toffee']
  },
  'cherry': {
    term: 'cherry',
    category: 'taste',
    definition: 'Fresh red fruit common in Pinot Noir and Sangiovese.',
    examples: ['Pinot Noir', 'Sangiovese'],
    relatedTerms: ['red fruit', 'bright']
  },
  'chocolate': {
    term: 'chocolate',
    category: 'taste',
    definition: 'Rich cocoa or dark chocolate notes, often from oak or ripe fruit.',
    examples: ['Napa Cabernet', 'Malbec'],
    relatedTerms: ['cocoa', 'dark chocolate', 'mocha']
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
  'cooked': {
    term: 'cooked',
    category: 'taste',
    definition: 'Stewed or baked fruit character from heat or overripeness.',
    examples: ['Hot climate wines', 'Port'],
    relatedTerms: ['baked', 'stewed', 'jammy']
  },
  'dark chocolate': {
    term: 'dark chocolate',
    category: 'taste',
    definition: 'Bitter-sweet cocoa notes, rich and intense chocolate character.',
    examples: ['Aged Cabernet', 'Barossa Shiraz'],
    relatedTerms: ['chocolate', 'cocoa', 'cacao']
  },
  'espresso': {
    term: 'espresso',
    category: 'taste',
    definition: 'Strong roasted coffee aroma, concentrated and bitter-sweet.',
    examples: ['Aged reds', 'Some Australian Shiraz'],
    relatedTerms: ['coffee', 'mocha', 'roasted']
  },
  'figs': {
    term: 'figs',
    category: 'taste',
    definition: 'Sweet, jammy dried fruit character.',
    examples: ['Aged Port', 'Amarone'],
    relatedTerms: ['dried fruit', 'dates', 'raisins']
  },
  'fruity': {
    term: 'fruity',
    category: 'taste',
    definition: 'Dominated by fruit flavors rather than oak or earth.',
    examples: ['New World wines', 'Young wines'],
    relatedTerms: ['fruit-forward', 'jammy']
  },
  'jammy': {
    term: 'jammy',
    category: 'taste',
    definition: 'Sweet, cooked fruit character like fruit preserves.',
    examples: ['Warm-climate reds', 'Zinfandel'],
    relatedTerms: ['cooked fruit', 'sweet', 'concentrated']
  },
  'licorice': {
    term: 'licorice',
    category: 'taste',
    definition: 'Sweet anise or fennel flavor, black licorice candy.',
    examples: ['Some Syrah', 'Pastis-influenced wines'],
    relatedTerms: ['anise', 'fennel', 'star anise']
  },
  'mocha': {
    term: 'mocha',
    category: 'taste',
    definition: 'Coffee and chocolate combination, rich and sweet.',
    examples: ['Oak-aged reds', 'Some Malbec'],
    relatedTerms: ['coffee', 'chocolate', 'espresso']
  },
  'nutty': {
    term: 'nutty',
    category: 'taste',
    definition: 'General nut aromas - almond, hazelnut, walnut.',
    examples: ['Aged whites', 'Sherry'],
    relatedTerms: ['almond', 'hazelnut', 'walnut']
  },
  'peppery': {
    term: 'peppery',
    category: 'taste',
    definition: 'Black or white pepper spice notes.',
    examples: ['Syrah', 'Grüner Veltliner'],
    relatedTerms: ['black pepper', 'white pepper', 'spicy']
  },
  'raspberry': {
    term: 'raspberry',
    category: 'taste',
    definition: 'Bright red berry with sweet-tart character in Grenache.',
    examples: ['Grenache', 'Some Pinot Noir'],
    relatedTerms: ['red fruit', 'berry']
  },
  'savory': {
    term: 'savory',
    category: 'taste',
    definition: 'Umami, meaty, or herbal rather than fruity.',
    examples: ['Aged wines', 'Northern Rhône'],
    relatedTerms: ['umami', 'meaty', 'herbal']
  },
  'sour': {
    term: 'sour',
    category: 'taste',
    definition: 'Sharp acidity, tart or acidic taste.',
    examples: ['High-acid wines', 'Some natural wines'],
    relatedTerms: ['tart', 'acidic', 'sharp']
  },
  'tart': {
    term: 'tart',
    category: 'taste',
    definition: 'Sharp, acidic taste making mouth pucker.',
    examples: ['Cool-climate wines', 'Young wines'],
    relatedTerms: ['sour', 'acidic', 'sharp']
  },

  // TEXTURE DESCRIPTORS
  'angular': {
    term: 'angular',
    category: 'texture',
    definition: 'Wine with hard, sharp edges from prominent acidity or tannin, lacking softness.',
    examples: ['Young wines', 'Austere styles'],
    relatedTerms: ['sharp', 'edgy']
  },
  'astringent': {
    term: 'astringent',
    category: 'texture',
    definition: 'Drying, puckering sensation from high tannins, like strong black tea.',
    examples: ['Young tannic reds', 'Nebbiolo'],
    relatedTerms: ['drying', 'tannic']
  },
  'buttery': {
    term: 'buttery',
    category: 'texture',
    definition: 'Aroma or flavor of butter or cream, smooth and rich mouthfeel.',
    examples: ['Oaked Chardonnay', 'Malolactic wines'],
    relatedTerms: ['creamy', 'butter', 'butterscotch']
  },
  'creamy': {
    term: 'creamy',
    category: 'texture',
    definition: 'Smooth, velvety texture like cream, often from lees or malolactic.',
    examples: ['Champagne', 'Burgundy'],
    relatedTerms: ['silky', 'smooth', 'buttery']
  },
  'dense': {
    term: 'dense',
    category: 'texture',
    definition: 'Concentrated and thick, packed with flavor and extract.',
    examples: ['Young Bordeaux', 'Amarone'],
    relatedTerms: ['concentrated', 'thick', 'extracted']
  },
  'grippy': {
    term: 'grippy',
    category: 'texture',
    definition: 'Noticeably firm tannins that cling to the palate, often giving a drying sensation.',
    examples: ['Young Cabernet', 'Barolo'],
    relatedTerms: ['tannic', 'astringent', 'firm']
  },
  'gravelly': {
    term: 'gravelly',
    category: 'texture',
    definition: 'Mineral texture suggesting crushed stones or gravel.',
    examples: ['Graves wines', 'Mineral-driven wines'],
    relatedTerms: ['mineral', 'stony', 'rocky']
  },
  'juicy': {
    term: 'juicy',
    category: 'texture',
    definition: 'Mouth-watering, fresh fruit character with good acidity.',
    examples: ['Beaujolais', 'Fresh reds'],
    relatedTerms: ['succulent', 'fresh', 'mouth-watering']
  },
  'lush': {
    term: 'lush',
    category: 'texture',
    definition: 'Sumptuously rich and soft on the palate, often low in acidity but full of ripe fruit.',
    examples: ['Napa Valley wines', 'Warm climate reds'],
    relatedTerms: ['voluptuous', 'opulent', 'rich']
  },
  'oily': {
    term: 'oily',
    category: 'texture',
    definition: 'Viscous, slick texture coating the palate.',
    examples: ['Viognier', 'Some Rieslings'],
    relatedTerms: ['viscous', 'unctuous', 'rich']
  },
  'plush': {
    term: 'plush',
    category: 'texture',
    definition: 'Soft, luxurious, velvety mouthfeel.',
    examples: ['Napa Valley wines', 'Pomerol'],
    relatedTerms: ['velvety', 'lush', 'soft']
  },
  'silky': {
    term: 'silky',
    category: 'texture',
    definition: 'Extremely smooth, fine tannins like silk fabric.',
    examples: ['Aged Burgundy', 'Fine Pinot Noir'],
    relatedTerms: ['smooth', 'velvety', 'satin']
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
  'supple': {
    term: 'supple',
    category: 'texture',
    definition: 'Tannins that feel smooth and flexible, gently structuring the palate without astringency.',
    examples: ['Aged reds', 'Quality Pinot Noir'],
    relatedTerms: ['smooth', 'flexible', 'soft']
  },
  'tannic': {
    term: 'tannic',
    category: 'texture',
    definition: 'High in tannins, causing drying sensation.',
    examples: ['Young Cabernet', 'Nebbiolo'],
    relatedTerms: ['astringent', 'grippy', 'drying']
  },
  'unctuous': {
    term: 'unctuous',
    category: 'texture',
    definition: 'Rich, oily, coating texture.',
    examples: ['Sauternes', 'Late harvest wines'],
    relatedTerms: ['oily', 'viscous', 'coating']
  },
  'velvety': {
    term: 'velvety',
    category: 'texture',
    definition: 'Extremely smooth tannins with a plush, soft mouthfeel.',
    examples: ['Aged Burgundy', 'Premium reds'],
    relatedTerms: ['silky', 'smooth', 'plush']
  },
  'viscous': {
    term: 'viscous',
    category: 'texture',
    definition: 'Thick, syrupy consistency.',
    examples: ['Dessert wines', 'High-alcohol wines'],
    relatedTerms: ['thick', 'syrupy', 'oily']
  },
  'voluptuous': {
    term: 'voluptuous',
    category: 'texture',
    definition: 'Luxuriously full-bodied and caressing in mouthfeel; indulgent in flavor and texture.',
    examples: ['Premium Rhône reds', 'Napa Valley wines'],
    relatedTerms: ['lush', 'opulent', 'rich']
  },

  // STRUCTURE DESCRIPTORS
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
  'balanced': {
    term: 'balanced',
    category: 'structure',
    definition: 'Wine where all components are in harmony - fruit, acid, tannin, alcohol.',
    examples: ['Well-made wines', 'Mature wines'],
    relatedTerms: ['harmonious', 'integrated']
  },
  'big': {
    term: 'big',
    category: 'structure',
    definition: 'Bold, intense wine with high body/alcohol making strong impression.',
    examples: ['Napa Cabernet', 'Barossa Shiraz'],
    relatedTerms: ['bold', 'powerful']
  },
  'body': {
    term: 'body',
    category: 'structure',
    definition: 'The sense of weight or fullness of wine in your mouth.',
    examples: ['All wines have body - light, medium, or full'],
    relatedTerms: ['weight', 'mouthfeel']
  },
  'crisp': {
    term: 'crisp',
    category: 'structure',
    definition: 'Fresh and lively with bright acidity, refreshing character.',
    examples: ['Chablis', 'Albariño'],
    relatedTerms: ['fresh', 'bright', 'zesty']
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
  'full-bodied': {
    term: 'full-bodied',
    category: 'structure',
    definition: 'Rich and weighty on the palate, high in alcohol and extract.',
    examples: ['Napa Cabernet', 'Barossa Shiraz'],
    relatedTerms: ['heavy', 'rich', 'powerful']
  },
  'hot': {
    term: 'hot',
    category: 'structure',
    definition: 'Excessive alcohol creating burning sensation.',
    examples: ['High-alcohol wines', 'Unbalanced wines'],
    relatedTerms: ['alcoholic', 'burning', 'warming']
  },
  'lean': {
    term: 'lean',
    category: 'structure',
    definition: 'Lacking richness or body, austere and angular.',
    examples: ['Cool-climate wines', 'High-acid wines'],
    relatedTerms: ['austere', 'angular', 'thin']
  },
  'light-bodied': {
    term: 'light-bodied',
    category: 'structure',
    definition: 'Delicate weight on palate, low alcohol and extract.',
    examples: ['Pinot Grigio', 'Beaujolais'],
    relatedTerms: ['delicate', 'light', 'thin']
  },
  'linear': {
    term: 'linear',
    category: 'structure',
    definition: 'A focused, direct wine that evolves in a clean, straight progression without broadness.',
    examples: ['Mosel Riesling', 'Chablis'],
    relatedTerms: ['focused', 'direct', 'precise']
  },
  'long': {
    term: 'long',
    category: 'structure',
    definition: 'Extended finish that lingers on the palate.',
    examples: ['Quality wines', 'Aged wines'],
    relatedTerms: ['finish', 'persistent', 'lingering']
  },
  'medium-bodied': {
    term: 'medium-bodied',
    category: 'structure',
    definition: 'Moderate weight on palate, between light and full.',
    examples: ['Merlot', 'Côtes du Rhône'],
    relatedTerms: ['moderate', 'balanced']
  },
  'nervy': {
    term: 'nervy',
    category: 'structure',
    definition: 'Racy acidity giving energy and tension.',
    examples: ['Riesling', 'Loire wines'],
    relatedTerms: ['racy', 'tense', 'electric']
  },
  'piercing': {
    term: 'piercing',
    category: 'structure',
    definition: 'Intensely sharp acidity that cuts distinctly through the palate.',
    examples: ['High-acid wines', 'Young whites'],
    relatedTerms: ['sharp', 'cutting', 'intense']
  },
  'racy': {
    term: 'racy',
    category: 'structure',
    definition: 'Marked by high, mouthwatering acidity, typically giving a sense of energy and lift.',
    examples: ['Riesling', 'Albariño'],
    relatedTerms: ['vibrant', 'energetic', 'lively']
  },
  'steely': {
    term: 'steely',
    category: 'structure',
    definition: 'Firm, mineral, austere with sharp acidity.',
    examples: ['Chablis', 'Mosel Riesling'],
    relatedTerms: ['mineral', 'austere', 'firm']
  },
  'structured': {
    term: 'structured',
    category: 'structure',
    definition: 'Well-defined tannins and acid providing framework.',
    examples: ['Bordeaux', 'Age-worthy wines'],
    relatedTerms: ['tannic', 'firm', 'architectural']
  },
  'vibrant': {
    term: 'vibrant',
    category: 'structure',
    definition: 'Full of energy, with lively acidity that gives freshness and vitality.',
    examples: ['Young wines', 'Cool-climate styles'],
    relatedTerms: ['lively', 'energetic', 'fresh']
  },
  'zesty': {
    term: 'zesty',
    category: 'structure',
    definition: 'Bright, lively with citrus freshness.',
    examples: ['Albariño', 'Vermentino'],
    relatedTerms: ['citrusy', 'bright', 'fresh']
  },

  // CHARACTER DESCRIPTORS
  'aromatic': {
    term: 'aromatic',
    category: 'character',
    definition: 'Wine with pronounced and intense aromas, very fragrant and expressive.',
    examples: ['Gewürztraminer', 'Riesling', 'Torrontés'],
    relatedTerms: ['fragrant', 'perfumed']
  },
  'austere': {
    term: 'austere',
    category: 'character',
    definition: 'Hard wine lacking obvious fruit sweetness, often high acid or tannin.',
    examples: ['Young Chablis', 'Traditional Barolo'],
    relatedTerms: ['severe', 'strict']
  },
  'backward': {
    term: 'backward',
    category: 'character',
    definition: 'Wine that is closed or not showing much character, often due to youth.',
    examples: ['Young fine wines', 'Tannic reds'],
    relatedTerms: ['closed', 'reticent']
  },
  'brooding': {
    term: 'brooding',
    category: 'character',
    definition: 'Deep and somewhat closed initially, revealing more complexity and layers with time.',
    examples: ['Young Bordeaux', 'Barolo'],
    relatedTerms: ['closed', 'deep', 'developing']
  },
  'complex': {
    term: 'complex',
    category: 'character',
    definition: 'Wine with multiple layers of aromas and flavors that evolve.',
    examples: ['Fine wines', 'Aged wines'],
    relatedTerms: ['layered', 'multifaceted']
  },
  'delicate': {
    term: 'delicate',
    category: 'character',
    definition: 'Light, subtle, and refined with gentle flavors requiring attention.',
    examples: ['Mosel Riesling', 'Burgundy'],
    relatedTerms: ['subtle', 'elegant', 'refined']
  },
  'elegant': {
    term: 'elegant',
    category: 'character',
    definition: 'Refined and graceful, showing finesse rather than power.',
    examples: ['Fine Burgundy', 'Aged Bordeaux'],
    relatedTerms: ['refined', 'graceful', 'sophisticated']
  },
  'evolving': {
    term: 'evolving',
    category: 'character',
    definition: 'Continuously changing and unfolding new characteristics over time.',
    examples: ['Aged wines', 'Complex wines'],
    relatedTerms: ['developing', 'changing', 'unfolding']
  },
  'fresh': {
    term: 'fresh',
    category: 'character',
    definition: 'Lively and vibrant, showing youth and vitality.',
    examples: ['Young whites', 'Crisp wines'],
    relatedTerms: ['vibrant', 'lively', 'youthful']
  },
  'green': {
    term: 'green',
    category: 'character',
    definition: 'Unripe, vegetal, or herbal characteristics.',
    examples: ['Underripe grapes', 'Cool-climate wines'],
    relatedTerms: ['vegetal', 'herbal', 'unripe']
  },
  'layered': {
    term: 'layered',
    category: 'character',
    definition: 'A wine showing multiple distinct aromatic and flavor elements that unfold over time.',
    examples: ['Complex wines', 'Aged wines'],
    relatedTerms: ['complex', 'multifaceted', 'nuanced']
  },
  'mellow': {
    term: 'mellow',
    category: 'character',
    definition: 'Soft, smooth, and mature without harsh edges.',
    examples: ['Aged wines', 'Mature tannins'],
    relatedTerms: ['soft', 'smooth', 'mature']
  },
  'multifaceted': {
    term: 'multifaceted',
    category: 'character',
    definition: 'Offering numerous distinct aromas and flavors, often indicative of high complexity.',
    examples: ['Premium wines', 'Aged Bordeaux'],
    relatedTerms: ['complex', 'layered', 'nuanced']
  },
  'nuanced': {
    term: 'nuanced',
    category: 'character',
    definition: 'Subtle complexities that require careful attention to fully appreciate.',
    examples: ['Fine wines', 'Burgundy'],
    relatedTerms: ['subtle', 'complex', 'refined']
  },
  'opulent': {
    term: 'opulent',
    category: 'character',
    definition: 'Rich and lavish, displaying an extravagant depth of fruit, often with a silky, plush mouthfeel.',
    examples: ['Napa Valley wines', 'Premium Rhône'],
    relatedTerms: ['rich', 'luxurious', 'lavish']
  },
  'oxidized': {
    term: 'oxidized',
    category: 'character',
    definition: 'Exposed to oxygen, nutty or sherry-like character.',
    examples: ['Sherry', 'Some natural wines'],
    relatedTerms: ['oxidative', 'nutty', 'aged']
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
  'seductive': {
    term: 'seductive',
    category: 'character',
    definition: 'Alluring wine with a soft, inviting texture and an engaging aromatic profile.',
    examples: ['Premium reds', 'Burgundy'],
    relatedTerms: ['alluring', 'captivating', 'charming']
  },
  'textbook': {
    term: 'textbook',
    category: 'character',
    definition: 'A perfect and clear example of its varietal or regional type.',
    examples: ['Typicity wines', 'Classic examples'],
    relatedTerms: ['typical', 'classic', 'exemplary']
  },
  'tight': {
    term: 'tight',
    category: 'character',
    definition: 'Closed, not showing full potential yet.',
    examples: ['Young fine wines', 'Recently opened bottles'],
    relatedTerms: ['closed', 'reticent', 'backward']
  },
  'young': {
    term: 'young',
    category: 'character',
    definition: 'Recently made, not yet mature or developed.',
    examples: ['Current vintage wines', 'Fresh wines'],
    relatedTerms: ['youthful', 'fresh', 'primary']
  }
};

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
}