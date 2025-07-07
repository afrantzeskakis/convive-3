import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CulinaryTermCarousel } from './CulinaryTermCarousel';

interface SmartRecipeDisplayProps {
  recipeText: string;
  culinaryTerms: Array<{
    term: string;
    carouselContent?: any[];
    type?: string;
  }>;
}

export function SmartRecipeDisplay({ recipeText, culinaryTerms }: SmartRecipeDisplayProps) {
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselData, setCarouselData] = useState<any[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const recipeRef = useRef<HTMLDivElement>(null);

  // Create a map of terms for quick lookup
  const termMap = useMemo(() => {
    const map = new Map<string, any>();
    culinaryTerms.forEach(term => {
      if (term.term) {
        map.set(term.term.toLowerCase(), term);
      }
    });
    return map;
  }, [culinaryTerms]);

  // Monitor text selection - check for both individual words and phrases
  useEffect(() => {
    const checkForTermSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      // Check if selection is within the recipe container
      const range = selection.getRangeAt(0);
      if (!recipeRef.current?.contains(range.commonAncestorContainer)) {
        return;
      }
      
      const selectedText = selection.toString().trim();
      
      // Ignore empty or very large selections
      if (!selectedText || selectedText.length > 100) {
        return;
      }
      
      const selectedLower = selectedText.toLowerCase();
      let matchedTerm = null;
      let bestMatchLength = 0;
      
      // Check all terms for matches, prioritizing longer matches
      for (const [termKey, termData] of termMap.entries()) {
        // Check if the term appears in the selected text
        if (selectedLower.includes(termKey)) {
          // Prioritize exact matches
          if (selectedLower === termKey && termKey.length > bestMatchLength) {
            matchedTerm = termData;
            bestMatchLength = termKey.length;
          }
          // Also check if the term is at the start or end of selection
          else if ((selectedLower.startsWith(termKey) || selectedLower.endsWith(termKey)) && 
                   termKey.length > bestMatchLength) {
            matchedTerm = termData;
            bestMatchLength = termKey.length;
          }
        }
      }
      
      // If no compound match found, try individual words
      if (!matchedTerm) {
        const words = selectedLower.split(/\s+/);
        for (const word of words) {
          const cleanWord = word.replace(/[.,!?;:'"]/g, ''); // Remove punctuation
          if (termMap.has(cleanWord)) {
            matchedTerm = termMap.get(cleanWord);
            break;
          }
        }
      }

      if (matchedTerm && matchedTerm.carouselContent) {
        // Clear selection to prevent highlighting
        selection.removeAllRanges();
        
        // Show carousel
        setSelectedTerm(matchedTerm.term);
        setCarouselData(matchedTerm.carouselContent);
        setCarouselOpen(true);
      }
    };

    // Only check for terms when user releases (touchend/mouseup)
    const handleSelectionEnd = (e: Event) => {
      // Small delay to ensure selection is complete
      setTimeout(() => {
        checkForTermSelection();
      }, 100);
    };

    // Add event listeners
    document.addEventListener('touchend', handleSelectionEnd);
    document.addEventListener('mouseup', handleSelectionEnd);

    return () => {
      document.removeEventListener('touchend', handleSelectionEnd);
      document.removeEventListener('mouseup', handleSelectionEnd);
    };
  }, [termMap]);





  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <Badge variant="outline" className="mb-2">Interactive Recipe</Badge>
            <p className="text-sm text-muted-foreground mb-2">
              Select any text to learn about culinary terms.
            </p>
            <p className="text-xs text-muted-foreground">
              {culinaryTerms.length} culinary terms available - select individual words or phrases
            </p>
            {/* Temporary debug display */}
            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer">
                Show available terms
              </summary>
              <div className="mt-1 flex flex-wrap gap-1">
                {culinaryTerms.slice(0, 20).map((term, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {term.term}
                  </Badge>
                ))}
                {culinaryTerms.length > 20 && (
                  <Badge variant="outline" className="text-xs">
                    +{culinaryTerms.length - 20} more
                  </Badge>
                )}
              </div>
            </details>
          </div>
          
          <div 
            ref={recipeRef}
            className="prose prose-sm max-w-none whitespace-pre-wrap select-text bg-gray-50 dark:bg-gray-900 p-4 rounded-lg"
            style={{ userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text' }}
          >
            {recipeText}
          </div>
          


        </CardContent>
      </Card>

      <CulinaryTermCarousel
        term={selectedTerm}
        carouselData={carouselData}
        isOpen={carouselOpen}
        onClose={() => setCarouselOpen(false)}
      />
    </>
  );
}