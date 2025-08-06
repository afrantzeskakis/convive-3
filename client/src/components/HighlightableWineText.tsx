import { useState, useEffect, useRef } from "react";
import { getAllDescriptorTerms } from "@shared/wine-descriptors";
import { WineDescriptorCarousel } from "./WineDescriptorCarousel";

interface HighlightableWineTextProps {
  text: string;
  className?: string;
  showInstructions?: boolean;
}

export function HighlightableWineText({ text, className = "", showInstructions = false }: HighlightableWineTextProps) {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [highlightedSpans, setHighlightedSpans] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const descriptorTerms = getAllDescriptorTerms();

  // Parse text and identify descriptor terms
  const parseTextWithDescriptors = (text: string) => {
    // Create a regex pattern for all descriptor terms (case-insensitive)
    const termPattern = descriptorTerms
      .sort((a, b) => b.length - a.length) // Sort by length to match longer terms first
      .map(term => escapeRegex(term))
      .join('|');
    
    if (!termPattern) return [{ text, isDescriptor: false, term: '' }];
    
    const regex = new RegExp(`\\b(${termPattern})\\b`, 'gi');
    const parts: { text: string; isDescriptor: boolean; term: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          text: text.slice(lastIndex, match.index),
          isDescriptor: false,
          term: ''
        });
      }

      // Add the matched descriptor
      parts.push({
        text: match[0],
        isDescriptor: true,
        term: match[0].toLowerCase()
      });

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        text: text.slice(lastIndex),
        isDescriptor: false,
        term: ''
      });
    }

    return parts;
  };

  // Escape special regex characters
  const escapeRegex = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Handle touch/click on descriptor
  const handleDescriptorInteraction = (term: string) => {
    setSelectedTerm(term);
    setHighlightedSpans(new Set([term]));
  };

  // Handle touch selection for mobile
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const selectedText = selection.toString().trim().toLowerCase();
      
      // Check if selected text is a descriptor
      if (selectedText && descriptorTerms.includes(selectedText)) {
        handleDescriptorInteraction(selectedText);
        selection.removeAllRanges(); // Clear selection after handling
      }
    };

    // Add touch and mouse events
    document.addEventListener('selectionchange', handleSelection);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, [descriptorTerms]);

  const parsedText = parseTextWithDescriptors(text);

  return (
    <>
      <div ref={containerRef} className={className}>
        {parsedText.map((part, index) => {
          if (part.isDescriptor) {
            return (
              <span
                key={index}
                className={`
                  wine-descriptor
                  cursor-pointer
                  border-b-2 border-dotted
                  transition-all duration-200
                  ${highlightedSpans.has(part.term) 
                    ? 'bg-purple-200 border-purple-400 text-purple-900 px-1 rounded' 
                    : 'border-purple-300 hover:bg-purple-100 hover:border-purple-400'
                  }
                `}
                onClick={() => handleDescriptorInteraction(part.term)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleDescriptorInteraction(part.term);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDescriptorInteraction(part.term);
                  }
                }}
                aria-label={`Define wine term: ${part.text}`}
              >
                {part.text}
              </span>
            );
          }
          return <span key={index}>{part.text}</span>;
        })}
      </div>

      {/* Carousel for selected term */}
      {selectedTerm && (
        <WineDescriptorCarousel
          term={selectedTerm}
          onClose={() => {
            setSelectedTerm(null);
            setHighlightedSpans(new Set());
          }}
        />
      )}

      {/* Instructions for mobile users */}
      {showInstructions && (
        <p className="text-xs text-muted-foreground mt-2 italic">
          Tap on highlighted wine terms to learn more about them
        </p>
      )}
    </>
  );
}