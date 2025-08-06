const fs = require('fs');

const content = fs.readFileSync('attached_assets/Pasted-A-F-Acacia-A-delicate-floral-aroma-reminiscent-of-acacia-blossoms-which-are-sweet-and-lightly-fra-1754463020814_1754463020814.txt', 'utf8');

// Extract all notes with their descriptions
const lines = content.split('\n');
let notes = {};
let currentNote = '';
let currentDesc = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.match(/^[A-Z].*:/)) {
    if (currentNote) {
      // Keep parenthetical distinctions as underscores to preserve variations
      const key = currentNote.toLowerCase().replace(/\s+\(/g, '_').replace(/\)/g, '').replace(/\s+/g, '_');
      notes[key] = currentDesc.trim();
    }
    const parts = line.split(':');
    currentNote = parts[0].trim();
    currentDesc = parts.slice(1).join(':').trim();
  } else if (line.trim() && currentNote) {
    currentDesc += ' ' + line.trim();
  } else if (!line.trim() && currentNote) {
    // Keep parenthetical distinctions as underscores to preserve variations
    const key = currentNote.toLowerCase().replace(/\s+\(/g, '_').replace(/\)/g, '').replace(/\s+/g, '_');
    notes[key] = currentDesc.trim();
    currentNote = '';
    currentDesc = '';
  }
}
if (currentNote) {
  // Keep parenthetical distinctions as underscores to preserve variations
  const key = currentNote.toLowerCase().replace(/\s+\(/g, '_').replace(/\)/g, '').replace(/\s+/g, '_');
  notes[key] = currentDesc.trim();
}

// Generate TypeScript file content
let output = `// Comprehensive Wine Tasting Notes Guide
// This document serves as a reference for identifying tasting notes in wine descriptions
// The system will parse wine descriptions looking for these specific terms
// If a note appears in one wine but not others in a comparison, it's a differentiating characteristic

export const WineTastingNotesGuide: { [key: string]: string } = {
`;

for (const [note, desc] of Object.entries(notes)) {
  // Escape quotes in description
  const escapedDesc = desc.replace(/"/g, '\\"');
  output += `  "${note}": "${escapedDesc}",\n`;
}

output += `};

// Helper function to identify notes in wine descriptions
export function identifyTastingNotes(description: string): string[] {
  if (!description) return [];
  
  const lowercaseDesc = description.toLowerCase();
  const foundNotes: string[] = [];
  
  // Check each note in the guide
  for (const note in WineTastingNotesGuide) {
    // Create variations of the note to check
    const variations = [note];
    
    // Add singular/plural variations
    if (note.endsWith('ies')) {
      variations.push(note.slice(0, -3) + 'y');
    } else if (note.endsWith('s')) {
      variations.push(note.slice(0, -1));
    } else {
      variations.push(note + 's');
    }
    
    // Check if any variation appears in the description
    for (const variation of variations) {
      const regex = new RegExp(\`\\\\b\${variation}\\\\b\`, 'i');
      if (regex.test(lowercaseDesc)) {
        foundNotes.push(note);
        break;
      }
    }
  }
  
  return [...new Set(foundNotes)]; // Remove duplicates
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

// Function to format notes for display
export function formatNoteForDisplay(note: string): string {
  // Special formatting for certain notes
  const specialFormats: { [key: string]: string } = {
    'saline': 'Hint of salinity',
    'salinity': 'Hint of salinity',
    'salt': 'Hint of salinity',
    'brine': 'Briny character',
    'oak': 'Oak influence',
    'vanilla': 'Vanilla notes',
    'citrus': 'Citrus notes',
    'berry': 'Berry character',
    'floral': 'Floral notes',
    'herbal': 'Herbal character',
    'mineral': 'Mineral notes',
    'spicy': 'Spicy character',
    'earthy': 'Earthy notes',
    'fruity': 'Fruit-forward'
  };
  
  if (specialFormats[note]) {
    return specialFormats[note];
  }
  
  // Capitalize first letter
  return note.charAt(0).toUpperCase() + note.slice(1) + ' notes';
}
`;

// Save the TypeScript file
fs.writeFileSync('server/data/wine-tasting-notes-guide.ts', output);

console.log('Generated wine-tasting-notes-guide.ts with', Object.keys(notes).length, 'notes');