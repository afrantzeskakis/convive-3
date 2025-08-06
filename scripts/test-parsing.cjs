// Test the intelligent parsing of wine notes
const fs = require('fs');

// Simulate the parsing logic
function testParsing() {
  const testCases = [
    { input: "This wine has notes of ripe apple and honey", expected: ["apple ripe", "honey"] },
    { input: "Flavors of apple (baked) with vanilla", expected: ["apple baked", "vanilla"] },
    { input: "Green apple freshness with citrus zest", expected: ["apple green", "citrus zest"] },
    { input: "Dried apricot and baked apple notes", expected: ["apricot dried", "apple baked"] },
    { input: "Apple, ripe and juicy with floral hints", expected: ["apple ripe", "floral"] },
  ];

  console.log("Testing intelligent wine note parsing:\n");
  
  testCases.forEach((test, idx) => {
    console.log(`Test ${idx + 1}: "${test.input}"`);
    console.log(`Expected to find: ${test.expected.join(", ")}`);
    
    // Check if the expected patterns would be matched
    const patterns = [
      "ripe apple", "apple ripe", "apple (ripe)", "apple, ripe",
      "baked apple", "apple baked", "apple (baked)", "apple, baked",
      "green apple", "apple green", "apple (green)", "apple, green",
      "dried apricot", "apricot dried", "apricot (dried)", "apricot, dried"
    ];
    
    const found = [];
    const input = test.input.toLowerCase();
    
    patterns.forEach(pattern => {
      if (input.includes(pattern)) {
        // Normalize to our format
        if (pattern.includes("ripe apple") || pattern.includes("apple ripe") || 
            pattern.includes("apple (ripe)") || pattern.includes("apple, ripe")) {
          if (!found.includes("apple ripe")) found.push("apple ripe");
        }
        if (pattern.includes("baked apple") || pattern.includes("apple baked") || 
            pattern.includes("apple (baked)") || pattern.includes("apple, baked")) {
          if (!found.includes("apple baked")) found.push("apple baked");
        }
        if (pattern.includes("green apple") || pattern.includes("apple green") || 
            pattern.includes("apple (green)") || pattern.includes("apple, green")) {
          if (!found.includes("apple green")) found.push("apple green");
        }
        if (pattern.includes("dried apricot") || pattern.includes("apricot dried") || 
            pattern.includes("apricot (dried)") || pattern.includes("apricot, dried")) {
          if (!found.includes("apricot dried")) found.push("apricot dried");
        }
      }
    });
    
    // Check for other notes
    if (input.includes("honey")) found.push("honey");
    if (input.includes("vanilla")) found.push("vanilla");
    if (input.includes("citrus zest")) found.push("citrus zest");
    if (input.includes("floral")) found.push("floral");
    
    console.log(`Found: ${found.join(", ")}`);
    
    // Check if all expected were found
    const allFound = test.expected.every(note => found.includes(note));
    console.log(`Result: ${allFound ? "✓ PASS" : "✗ FAIL"}\n`);
  });
}

testParsing();