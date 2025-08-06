// Comprehensive Wine Tasting Notes Guide
// This document serves as a reference for identifying tasting notes in wine descriptions
// The system will parse wine descriptions looking for these specific terms
// If a note appears in one wine but not others in a comparison, it's a differentiating characteristic

// UNIFIED SYSTEM: This file now uses the comprehensive wine descriptor system from shared/wine-descriptors.ts
import { wineDescriptors } from '../../shared/wine-descriptors';

// Create a guide from the unified descriptor system
export const WineTastingNotesGuide: { [key: string]: string } = Object.fromEntries(
  Object.values(wineDescriptors).map(descriptor => [
    descriptor.term,
    descriptor.definition
  ])
);

// Function to identify tasting notes in wine descriptions
// Now uses the unified wine descriptor system for consistency
export function identifyTastingNotes(description: string): string[] {
  if (!description) return [];
  
  const normalizedDesc = description.toLowerCase().trim();
  const foundNotes: string[] = [];
  
  // Use the unified descriptor terms
  const allTerms = Object.keys(wineDescriptors);
  
  for (const term of allTerms) {
    if (normalizedDesc.includes(term)) {
      foundNotes.push(term);
    }
  }
  
  return foundNotes;
}

// Function to get wine descriptor definition
export function getWineDescriptorDefinition(term: string): string | undefined {
  return WineTastingNotesGuide[term.toLowerCase()];
}

// Function to format tasting notes for display
export function formatTastingNotes(notes: string[]): string {
  if (!notes || notes.length === 0) return '';
  
  return notes.map(note => {
    const definition = getWineDescriptorDefinition(note);
    return definition ? `${note}: ${definition}` : note;
  }).join('\n');
}

// Function to categorize tasting notes
export function categorizeTastingNotes(notes: string[]): { [category: string]: string[] } {
  const categorized: { [category: string]: string[] } = {
    aroma: [],
    taste: [],
    texture: [],
    structure: [],
    character: []
  };
  
  for (const note of notes) {
    const descriptor = wineDescriptors[note.toLowerCase()];
    if (descriptor) {
      categorized[descriptor.category].push(note);
    }
  }
  
  return categorized;
}