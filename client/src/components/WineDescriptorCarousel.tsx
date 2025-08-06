import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Grape, Info, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WineDescriptor, findDescriptor } from "@shared/wine-descriptors";

interface WineDescriptorCarouselProps {
  term: string;
  onClose: () => void;
}

export function WineDescriptorCarousel({ term, onClose }: WineDescriptorCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [descriptor, setDescriptor] = useState<WineDescriptor | undefined>();

  useEffect(() => {
    const desc = findDescriptor(term);
    setDescriptor(desc);
    setCurrentSlide(0);
  }, [term]);

  // Handle keyboard navigation - must be declared before any conditional returns
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide((prev) => prev - 1);
      }
      if (e.key === 'ArrowRight' && descriptor) {
        const maxSlides = 1 + 
          (descriptor.examples && descriptor.examples.length > 0 ? 1 : 0) +
          (descriptor.relatedTerms && descriptor.relatedTerms.length > 0 ? 1 : 0);
        if (currentSlide < maxSlides - 1) {
          setCurrentSlide((prev) => prev + 1);
        }
      }
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide, descriptor, onClose]);

  if (!descriptor) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Term Not Found</span>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The term "{term}" is not in our wine descriptor database yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create slides for the carousel
  const slides = [
    // Main definition slide
    {
      title: "Definition",
      icon: <Info className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2 capitalize">{descriptor.term}</h3>
            <Badge className={getCategoryColor(descriptor.category)} variant="secondary">
              {descriptor.category}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed">{descriptor.definition}</p>
        </div>
      )
    },
    // Examples slide (if available)
    ...(descriptor.examples && descriptor.examples.length > 0 ? [{
      title: "Wine Examples",
      icon: <Grape className="h-5 w-5" />,
      content: (
        <div className="space-y-3">
          <h3 className="font-semibold">Commonly Found In:</h3>
          <ul className="space-y-2">
            {descriptor.examples.map((example, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span className="text-sm">{example}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }] : []),
    // Related terms slide (if available)
    ...(descriptor.relatedTerms && descriptor.relatedTerms.length > 0 ? [{
      title: "Related Terms",
      icon: <Sparkles className="h-5 w-5" />,
      content: (
        <div className="space-y-3">
          <h3 className="font-semibold">Similar Descriptors:</h3>
          <div className="flex flex-wrap gap-2">
            {descriptor.relatedTerms.map((related, i) => (
              <Badge key={i} variant="outline" className="capitalize">
                {related}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            These terms often appear together or describe similar characteristics
          </p>
        </div>
      )
    }] : [])
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card 
        className="max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {slides[currentSlide].icon}
              {slides[currentSlide].title}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Slide content */}
          <div className="min-h-[200px]">
            {slides[currentSlide].content}
          </div>

          {/* Navigation */}
          {slides.length > 1 && (
            <>
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                {/* Slide indicators */}
                <div className="flex gap-1">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        index === currentSlide
                          ? 'bg-primary w-6'
                          : 'bg-muted-foreground/30'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextSlide}
                  disabled={currentSlide === slides.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Touch hint for mobile */}
              <p className="text-xs text-center text-muted-foreground">
                Swipe or use arrow keys to navigate
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get category color
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'aroma': 'bg-purple-100 text-purple-800',
    'taste': 'bg-blue-100 text-blue-800',
    'texture': 'bg-green-100 text-green-800',
    'finish': 'bg-orange-100 text-orange-800',
    'structure': 'bg-red-100 text-red-800',
    'general': 'bg-gray-100 text-gray-800'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
}