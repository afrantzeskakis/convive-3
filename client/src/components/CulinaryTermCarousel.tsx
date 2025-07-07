import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X, Book, Globe, Utensils, Wine, Users, MessageCircle, ShoppingCart, ChefHat, Network, Combine, Calendar, GraduationCap, Leaf } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CarouselSlide {
  type: 'technique' | 'culture' | 'tips' | 'wine' | 'variations' | 'dietary' | 'communication' | 'sourcing' | 'kitchen' | 'relationships' | 'combinations' | 'seasonal';
  title: string;
  content: string;
  additionalInfo?: string;
  relatedTerms?: string[];
  seasonalRelevance?: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round';
  staffLevel?: 'server' | 'sommelier' | 'chef' | 'manager' | 'all';
}

interface CulinaryTermCarouselProps {
  term: string;
  isOpen: boolean;
  onClose: () => void;
  carouselData: CarouselSlide[];
}

export function CulinaryTermCarousel({ 
  term, 
  isOpen, 
  onClose, 
  carouselData
}: CulinaryTermCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Reset to first slide when new term opens
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen, term]);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % carouselData.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + carouselData.length) % carouselData.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Touch/swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentSlide < carouselData.length - 1) {
      nextSlide();
    }
    if (isRightSwipe && currentSlide > 0) {
      prevSlide();
    }
  };

  const getSlideIcon = (type: string) => {
    switch (type) {
      case 'technique':
        return <Utensils className="w-4 h-4" />;
      case 'culture':
        return <Globe className="w-4 h-4" />;
      case 'tips':
        return <Book className="w-4 h-4" />;
      case 'wine':
        return <Wine className="w-4 h-4" />;
      case 'variations':
        return <ChefHat className="w-4 h-4" />;
      case 'dietary':
        return <Users className="w-4 h-4" />;
      case 'communication':
        return <MessageCircle className="w-4 h-4" />;
      case 'sourcing':
        return <ShoppingCart className="w-4 h-4" />;
      case 'kitchen':
        return <ChefHat className="w-4 h-4" />;
      case 'relationships':
        return <Network className="w-4 h-4" />;
      case 'combinations':
        return <Combine className="w-4 h-4" />;
      case 'seasonal':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Book className="w-4 h-4" />;
    }
  };

  if (!carouselData || carouselData.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[400px] mx-auto max-h-[90vh] overflow-hidden p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg font-semibold capitalize flex items-center gap-2">
            {getSlideIcon(carouselData[currentSlide]?.type)}
            {term}
          </DialogTitle>
        </DialogHeader>

        <div 
          className="relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Main slide content with smooth transitions */}
          <Card className="border-0 shadow-none">
            <CardContent className="p-3 sm:p-4">
              <div 
                className={`min-h-[150px] max-h-[50vh] overflow-y-auto transition-all duration-300 ease-in-out ${
                  isAnimating ? 'opacity-50 transform scale-95' : 'opacity-100 transform scale-100'
                }`}
              >
                <h3 className="font-medium text-sm sm:text-base mb-2 capitalize">
                  {carouselData[currentSlide]?.title || 'Information'}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {carouselData[currentSlide]?.content || 'Loading...'}
                </p>
                {carouselData[currentSlide]?.additionalInfo && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs sm:text-sm text-gray-600">
                    {carouselData[currentSlide].additionalInfo}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation controls - mobile optimized */}
          {carouselData.length > 1 && (
            <div className="space-y-3 mt-3">
              {/* Arrow navigation with slide counter */}
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevSlide}
                  disabled={currentSlide === 0 || isAnimating}
                  className="h-9 w-9"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex flex-col items-center px-2">
                  <span className="text-xs sm:text-sm text-gray-500">
                    {currentSlide + 1} of {carouselData.length}
                  </span>
                  <div className="text-xs text-gray-400 capitalize">
                    {carouselData[currentSlide]?.type}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextSlide}
                  disabled={currentSlide === carouselData.length - 1 || isAnimating}
                  className="h-9 w-9"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Dot indicators - mobile optimized */}
              <div className="flex justify-center gap-2 overflow-x-auto pb-2">
                {carouselData.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    disabled={isAnimating}
                    className={`transition-all duration-200 ${
                      index === currentSlide 
                        ? 'w-6 h-2 bg-primary rounded-full' 
                        : 'w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}