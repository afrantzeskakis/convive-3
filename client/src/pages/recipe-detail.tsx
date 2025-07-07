import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { ArrowLeft, BookOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocation } from 'wouter';

interface CarouselSlide {
  type: string;
  title: string;
  content: string;
  additionalInfo: string;
}

interface CulinaryTerm {
  term: string;
  slides: CarouselSlide[];
}

interface RecipeAnalysis {
  id: number;
  filename: string;
  extractedText: string;
  analysisData: {
    dishName?: string;
    cuisineType?: string;
    cookingTime?: string;
    difficulty?: string;
    servings?: string;
    ingredients?: string[];
    instructions?: string[];
  };
  createdAt: string;
  restaurantId: number;
}

export default function RecipeDetail() {
  const [, params] = useRoute('/recipe-detail/:id');
  const [, setLocation] = useLocation();
  const recipeId = params?.id;
  
  const [selectedText, setSelectedText] = useState('');
  const [termDefinition, setTermDefinition] = useState<CulinaryTerm | null>(null);
  const [showCarousel, setShowCarousel] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const recipeTextRef = useRef<HTMLDivElement>(null);

  // Fetch recipe details
  const { data: recipe, isLoading: recipeLoading } = useQuery({
    queryKey: ['/api/recipe-analyses', recipeId],
    queryFn: async () => {
      const response = await fetch(`/api/recipe-analyses/${recipeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipe');
      }
      const data = await response.json();
      console.log('Recipe data received:', data);
      console.log('extractedText field:', data.extractedText);
      return data;
    },
    enabled: !!recipeId
  });

  // Fetch cached culinary terms for the restaurant
  const { data: cachedTerms } = useQuery({
    queryKey: ['/api/culinary-knowledge/cached-terms', recipe?.restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/culinary-knowledge/cached-terms/${recipe?.restaurantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cached terms');
      }
      return response.json();
    },
    enabled: !!recipe?.restaurantId
  });

  // Handle text selection
  useEffect(() => {
    const handleTextSelection = () => {
      // Small delay to ensure selection is complete
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const selectedText = selection.toString().trim();
        console.log('Text selected:', selectedText);
        if (!selectedText || selectedText.length < 2) return;

        // Check if selection is within the recipe text
        const range = selection.getRangeAt(0);
        const recipeTextElement = recipeTextRef.current;
        if (!recipeTextElement || !recipeTextElement.contains(range.commonAncestorContainer)) {
          console.log('Selection not within recipe text');
          return;
        }

        console.log('Setting selected text and finding definition');
        setSelectedText(selectedText);
        findTermDefinition(selectedText);
      }, 100);
    };

    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
    };
  }, [cachedTerms]);

  // Smart term matching logic
  const findTermDefinition = (highlightedText: string) => {
    console.log('Finding definition for:', highlightedText);
    console.log('Available cached terms:', cachedTerms?.terms?.length || 0);
    
    if (!cachedTerms?.terms) {
      console.log('No cached terms available');
      return;
    }

    const normalizedHighlight = highlightedText.toLowerCase().trim();
    console.log('Normalized highlight:', normalizedHighlight);
    
    // Phase 1: Look for exact match
    const exactMatch = cachedTerms.terms.find((term: any) => 
      term.term.toLowerCase() === normalizedHighlight
    );
    
    if (exactMatch) {
      console.log('Found exact match:', exactMatch.term);
      setTermDefinition({
        term: exactMatch.term,
        slides: exactMatch.carousel_data?.slides || []
      });
      setCurrentSlide(0);
      setShowCarousel(true);
      return;
    }

    // Phase 2: Handle plural/singular variations
    const singularHighlight = normalizedHighlight.endsWith('s') ? normalizedHighlight.slice(0, -1) : normalizedHighlight + 's';
    const pluralMatch = cachedTerms.terms.find((term: any) => 
      term.term.toLowerCase() === singularHighlight
    );
    
    if (pluralMatch) {
      console.log('Found plural/singular match:', pluralMatch.term);
      setTermDefinition({
        term: pluralMatch.term,
        slides: pluralMatch.carousel_data?.slides || []
      });
      setCurrentSlide(0);
      setShowCarousel(true);
      return;
    }

    // Phase 3: Look for phrase matches where selection contains a complete term
    const phraseMatches = cachedTerms.terms.filter((term: any) => {
      const termWords = term.term.toLowerCase().split(' ');
      const highlightWords = normalizedHighlight.split(' ');
      
      // Check if all words of the term exist in the highlighted text
      return termWords.every(word => highlightWords.includes(word)) ||
             highlightWords.every(word => termWords.includes(word));
    });

    if (phraseMatches.length > 0) {
      // Select the best phrase match (longest term that matches)
      const bestMatch = phraseMatches.reduce((longest: any, current: any) => 
        current.term.length > longest.term.length ? current : longest
      );

      console.log('Found phrase match:', bestMatch.term);
      setTermDefinition({
        term: bestMatch.term,
        slides: bestMatch.carousel_data?.slides || []
      });
      setCurrentSlide(0);
      setShowCarousel(true);
      return;
    }

    // Phase 4: Look for containing phrases (fallback)
    const containingMatches = cachedTerms.terms.filter((term: any) => 
      term.term.toLowerCase().includes(normalizedHighlight) &&
      term.term.toLowerCase() !== normalizedHighlight
    );

    if (containingMatches.length > 0) {
      const bestMatch = containingMatches.reduce((longest: any, current: any) => 
        current.term.length > longest.term.length ? current : longest
      );

      console.log('Using containing match:', bestMatch.term);
      setTermDefinition({
        term: bestMatch.term,
        slides: bestMatch.carousel_data?.slides || []
      });
      setCurrentSlide(0);
      setShowCarousel(true);
    } else {
      console.log('No matching terms found');
    }
  };

  const formatDishName = (recipe: RecipeAnalysis) => {
    return recipe.analysisData?.dishName || recipe.filename.replace(/\.[^/.]+$/, '');
  };

  const closeCarousel = () => {
    setShowCarousel(false);
    setTermDefinition(null);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  const nextSlide = () => {
    if (termDefinition && currentSlide < termDefinition.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  if (recipeLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading recipe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          <p>Recipe not found.</p>
          <Button onClick={() => setLocation('/recipe-menu')} className="mt-4">
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/recipe-menu')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Menu
        </Button>
        
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold">{formatDishName(recipe)}</h1>
          {recipe.analysisData?.cuisineType && (
            <Badge variant="secondary" className="text-sm">
              {recipe.analysisData.cuisineType}
            </Badge>
          )}
        </div>

        {/* Recipe Metadata */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          {recipe.analysisData?.cookingTime && (
            <span>⏱️ {recipe.analysisData.cookingTime}</span>
          )}
          {recipe.analysisData?.servings && (
            <span>👥 Serves {recipe.analysisData.servings}</span>
          )}
          {recipe.analysisData?.difficulty && (
            <span>📊 {recipe.analysisData.difficulty}</span>
          )}
        </div>
      </div>

      {/* Recipe Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Recipe Instructions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Highlight any term to see detailed culinary information
          </p>
        </CardHeader>
        <CardContent>
          <div 
            ref={recipeTextRef}
            className="font-mono text-sm whitespace-pre-wrap p-4 bg-gray-50 rounded border select-text"
            style={{ userSelect: 'text' }}
          >
            {recipe?.extractedText || 'No recipe content available'}
          </div>
        </CardContent>
      </Card>

      {/* Culinary Knowledge Carousel */}
      <Dialog open={showCarousel} onOpenChange={closeCarousel}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {termDefinition?.term} 
                {selectedText !== termDefinition?.term && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (from "{selectedText}")
                  </span>
                )}
              </span>
              <Button variant="ghost" size="sm" onClick={closeCarousel}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {termDefinition && termDefinition.slides.length > 0 && (
            <div className="space-y-4">
              {/* Slide Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {termDefinition.slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentSlide ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentSlide + 1} of {termDefinition.slides.length}
                </div>
              </div>

              {/* Current Slide */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">
                    {termDefinition.slides[currentSlide]?.title}
                  </h3>
                  <Badge variant="outline">
                    {termDefinition.slides[currentSlide]?.type}
                  </Badge>
                </div>

                <div className="prose max-w-none">
                  <p className="text-foreground leading-relaxed">
                    {termDefinition.slides[currentSlide]?.content}
                  </p>
                  
                  {termDefinition.slides[currentSlide]?.additionalInfo && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        💡 {termDefinition.slides[currentSlide].additionalInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  onClick={nextSlide}
                  disabled={currentSlide === termDefinition.slides.length - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}