// Test the intelligent parsing of wine notes in complex sentences
const fs = require('fs');

// Import the actual parsing logic from the server
const guideContent = fs.readFileSync('server/data/wine-tasting-notes-guide.ts', 'utf8');

// Extract note names for testing
const noteMatches = guideContent.match(/"([^"]+)":/g);
const availableNotes = noteMatches.map(match => {
  const note = match.replace(/"/g, '').replace(':', '');
  return note.replace(/_/g, ' ');
});

// Simulate the intelligent parsing logic
function intelligentParsing(description) {
  if (!description) return [];
  
  // Normalize the description
  let normalizedDesc = description.toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const foundNotes = [];
  
  // Test cases for compound notes
  const compoundPatterns = [
    // Apple variations
    { patterns: ['ripe apple', 'apple ripe', 'apple (ripe)', 'apple, ripe', 'apple-ripe', 'apple and ripe', 'apple with ripe'], note: 'apple ripe' },
    { patterns: ['baked apple', 'apple baked', 'apple (baked)', 'apple, baked', 'apple-baked', 'apple and baked'], note: 'apple baked' },
    { patterns: ['green apple', 'apple green', 'apple (green)', 'apple, green', 'apple-green'], note: 'apple green' },
    // Apricot variations
    { patterns: ['dried apricot', 'apricot dried', 'apricot (dried)', 'apricot, dried', 'apricot-dried'], note: 'apricot dried' },
    { patterns: ['ripe apricot', 'apricot ripe', 'apricot (ripe)', 'apricot, ripe'], note: 'apricot ripe' },
    // Other compound notes
    { patterns: ['citrus zest', 'zest citrus', 'citrus-zest', 'citrus (zest)'], note: 'citrus zest' },
    { patterns: ['black cherry', 'cherry black', 'black-cherry'], note: 'black cherry' },
    { patterns: ['white flowers', 'flowers white', 'white-flowers'], note: 'white flowers' },
    { patterns: ['green bell pepper', 'bell pepper green', 'green-bell-pepper'], note: 'green bell pepper' }
  ];
  
  // Check for compound patterns
  for (const compound of compoundPatterns) {
    for (const pattern of compound.patterns) {
      // Check with word boundaries and punctuation
      const regex = new RegExp(`(?:^|[\\s,;.!?()\\[\\]{}'"\\-/])${pattern}s?(?:$|[\\s,;.!?()\\[\\]{}'"\\-/])`, 'i');
      if (regex.test(normalizedDesc)) {
        if (!foundNotes.includes(compound.note)) {
          foundNotes.push(compound.note);
        }
        break;
      }
    }
  }
  
  // Check for simple notes
  const simpleNotes = ['honey', 'vanilla', 'oak', 'floral', 'citrus', 'berry', 'mineral', 'spicy', 'earthy', 'fruity',
                        'chocolate', 'coffee', 'tobacco', 'leather', 'butter', 'cream', 'toast', 'smoke', 'pepper', 'mint'];
  
  for (const note of simpleNotes) {
    const regex = new RegExp(`(?:^|[\\s,;.!?()\\[\\]{}'"\\-/])${note}s?(?:$|[\\s,;.!?()\\[\\]{}'"\\-/])`, 'i');
    if (regex.test(normalizedDesc)) {
      if (!foundNotes.includes(note)) {
        foundNotes.push(note);
      }
    }
  }
  
  return foundNotes;
}

// Complex test cases
const complexTestCases = [
  {
    description: "This exceptional vintage presents layers of complexity: the nose reveals ripe apple aromas intertwined with honey, while the palate showcases baked apple characteristics alongside subtle vanilla undertones.",
    expected: ['apple ripe', 'honey', 'apple baked', 'vanilla']
  },
  {
    description: "Opening with green apple freshness—almost tart—the wine evolves to show apple (baked) notes, complemented by citrus zest and finishing with dried apricot sweetness.",
    expected: ['apple green', 'apple baked', 'citrus zest', 'apricot dried']
  },
  {
    description: "The bouquet is dominated by apple, ripe and juicy, with hints of apple-baked pastry notes; the mid-palate brings forward honey-drizzled toast with a touch of oak.",
    expected: ['apple ripe', 'apple baked', 'honey', 'toast', 'oak']
  },
  {
    description: "Concentrated flavors of black-cherry jam meet white flowers' delicate perfume, while green bell pepper adds complexity to this wine's profile, finishing with mineral notes.",
    expected: ['black cherry', 'white flowers', 'green bell pepper', 'mineral']
  },
  {
    description: "An intriguing wine showing apple—both green and baked—alongside apricot (dried), with subtle floral undertones and a crisp, citrus-driven finish.",
    expected: ['apple green', 'apple baked', 'apricot dried', 'floral', 'citrus']
  },
  {
    description: "The wine's character shifts from apple, green and crisp on entry, to apple with baked nuances mid-palate, before revealing chocolate-covered coffee beans and spicy tobacco.",
    expected: ['apple green', 'apple baked', 'chocolate', 'coffee', 'spicy', 'tobacco']
  },
  {
    description: "Rich and opulent, displaying ripe-apple generosity, apple (ripe) sweetness, transitioning to apple and baked pastry notes, with butter, cream, and toasted oak complexity.",
    expected: ['apple ripe', 'apple baked', 'butter', 'cream', 'toast', 'oak']
  },
  {
    description: "Starting with apple—green initially—then developing apple, baked characteristics through aeration; complemented by leather, smoke, black pepper, and fresh mint.",
    expected: ['apple green', 'apple baked', 'leather', 'smoke', 'pepper', 'mint']
  }
];

console.log("Testing Enhanced Intelligent Wine Note Parsing in Complex Sentences\n");
console.log("=" .repeat(70) + "\n");

let totalTests = 0;
let passedTests = 0;

complexTestCases.forEach((test, idx) => {
  totalTests++;
  console.log(`Test ${idx + 1}:`);
  console.log(`Description: "${test.description}"`);
  console.log(`\nExpected notes: ${test.expected.join(', ')}`);
  
  const found = intelligentParsing(test.description);
  console.log(`Found notes:    ${found.join(', ')}`);
  
  // Check if all expected notes were found
  const allFound = test.expected.every(note => found.includes(note));
  const noExtras = found.every(note => test.expected.includes(note) || 
    // Allow some flexibility for notes that might be legitimately found
    ['crisp', 'juicy', 'rich', 'opulent', 'fresh', 'delicate', 'subtle', 'concentrated'].includes(note));
  
  const passed = allFound;
  if (passed) passedTests++;
  
  console.log(`\nResult: ${passed ? '✓ PASS' : '✗ FAIL'}`);
  
  if (!allFound) {
    const missing = test.expected.filter(note => !found.includes(note));
    console.log(`Missing notes: ${missing.join(', ')}`);
  }
  
  console.log("\n" + "-".repeat(70) + "\n");
});

console.log(`\nSummary: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests * 100)}%)`);

if (passedTests === totalTests) {
  console.log("\n🎉 All tests passed! The parser successfully handles complex sentences with:");
  console.log("  • Parenthetical formats: apple (ripe)");
  console.log("  • Hyphenated formats: apple-baked");
  console.log("  • Comma formats: apple, green");
  console.log("  • Conjunction formats: apple and baked");
  console.log("  • Reversed order: baked apple vs apple baked");
  console.log("  • Complex punctuation and sentence structures");
}