import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ChevronLeft, ChevronRight, X, Book, Globe, Utensils, Wine, Users, MessageCircle, ShoppingCart, ChefHat, Network, Combine, Calendar, GraduationCap, Leaf } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface CarouselSlide {
  type: 'technique' | 'culture' | 'tips' | 'wine' | 'variations' | 'dietary' | 'communication' | 'sourcing' | 'kitchen' | 'relationships' | 'combinations' | 'seasonal';
  title: string;
  content: string;
  additionalInfo?: string;
  relatedTerms?: string[];
  seasonalRelevance?: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round';
  staffLevel?: 'server' | 'sommelier' | 'chef' | 'manager' | 'all';
}

interface TermRelationship {
  relatedTerm: string;
  relationship: 'complement' | 'substitute' | 'prerequisite' | 'component' | 'technique' | 'pairing';
  strength: number;
  explanation: string;
}

interface TermCombination {
  terms: string[];
  combinationType: 'technique_ingredient' | 'flavor_profile' | 'cooking_method' | 'wine_pairing' | 'cultural_fusion';
  resultDescription: string;
  contextualUse: string;
}

interface SeasonalContext {
  currentSeason: 'spring' | 'summer' | 'fall' | 'winter';
  relevanceScore: number;
  seasonalVariations: {
    season: string;
    adaptation: string;
    ingredients: string[];
  }[];
}

interface CulinaryTermCarouselProps {
  term: string;
  isOpen: boolean;
  onClose: () => void;
  carouselData: CarouselSlide[];
  showQuickTip?: boolean;
  relationships?: TermRelationship[];
  combinations?: TermCombination[];
  seasonalContext?: SeasonalContext;
  staffMode?: boolean;
  staffRole?: 'server' | 'sommelier' | 'chef' | 'manager';
  restaurantId?: number;
}

export function CulinaryTermCarousel({ 
  term, 
  isOpen, 
  onClose, 
  carouselData, 
  showQuickTip = false,
  relationships = [],
  combinations = [],
  seasonalContext,
  staffMode = false,
  staffRole,
  restaurantId
}: CulinaryTermCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [showFullCarousel, setShowFullCarousel] = useState(!showQuickTip);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const tapTimeout = useRef<NodeJS.Timeout>();

  // Reset to first slide when new term opens
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
      setShowFullCarousel(!showQuickTip);
      setTapCount(0);
    }
  }, [isOpen, term, showQuickTip]);

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

  // Single/double tap handler for quick tip vs full carousel
  const handleTap = () => {
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
      tapTimeout.current = undefined;
      
      // Double tap - show full carousel
      setShowFullCarousel(true);
      setTapCount(0);
    } else {
      // Single tap - increment count
      setTapCount(prev => prev + 1);
      tapTimeout.current = setTimeout(() => {
        if (tapCount === 0) {
          // Single tap - show quick tip if not already in full mode
          if (!showFullCarousel) {
            setShowFullCarousel(true);
          }
        }
        setTapCount(0);
        tapTimeout.current = undefined;
      }, 300);
    }
  };

  const getSlideIcon = (type: string) => {
    switch (type) {
      case 'technique':
        return <Utensils className="w-5 h-5" />;
      case 'culture':
        return <Globe className="w-5 h-5" />;
      case 'tips':
        return <Book className="w-5 h-5" />;
      case 'wine':
        return <Wine className="w-5 h-5" />;
      case 'variations':
        return <ChefHat className="w-5 h-5" />;
      case 'dietary':
        return <Users className="w-5 h-5" />;
      case 'communication':
        return <MessageCircle className="w-5 h-5" />;
      case 'sourcing':
        return <ShoppingCart className="w-5 h-5" />;
      case 'kitchen':
        return <Utensils className="w-5 h-5" />;
      case 'relationships':
        return <Network className="w-5 h-5" />;
      case 'combinations':
        return <Combine className="w-5 h-5" />;
      case 'seasonal':
        return <Calendar className="w-5 h-5" />;
      default:
        return <Book className="w-5 h-5" />;
    }
  };

  const getSeasonIcon = (season: string) => {
    switch (season) {
      case 'spring':
        return <Leaf className="w-4 h-4 text-green-500" />;
      case 'summer':
        return <Calendar className="w-4 h-4 text-yellow-500" />;
      case 'fall':
        return <Leaf className="w-4 h-4 text-orange-500" />;
      case 'winter':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStaffIcon = (role: string) => {
    switch (role) {
      case 'chef':
        return <ChefHat className="w-4 h-4 text-red-500" />;
      case 'sommelier':
        return <Wine className="w-4 h-4 text-purple-500" />;
      case 'server':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'manager':
        return <GraduationCap className="w-4 h-4 text-green-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!carouselData || carouselData.length === 0) {
    return null;
  }

  // Quick tip mode - show first slide only
  if (!showFullCarousel && carouselData.length > 0) {
    const quickSlide = carouselData[0];
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-medium capitalize flex items-center gap-2">
              {getSlideIcon(quickSlide.type)}
              {term}
            </DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <p className="text-sm text-gray-700 mb-4">
              {quickSlide.content.substring(0, 150)}...
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => setShowFullCarousel(true)}
                className="flex-1"
              >
                Learn More
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold capitalize flex items-center gap-2">
            {getSlideIcon(carouselData[currentSlide]?.type)}
            {term}
          </DialogTitle>
        </DialogHeader>

        <div 
          className="relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleTap}
        >
          {/* Main slide content with smooth transitions */}
          <Card className="border-0 shadow-none">
            <CardContent className="p-4">
              <div 
                className={`min-h-[220px] max-h-[320px] overflow-y-auto transition-all duration-300 ease-in-out ${
                  isAnimating ? 'opacity-50 transform scale-95' : 'opacity-100 transform scale-100'
                }`}
              >
                <h3 className="font-medium text-base mb-3 capitalize">
                  {carouselData[currentSlide]?.title || 'Information'}
                </h3>
                <p className="text-sm leading-relaxed text-gray-700">
                  {carouselData[currentSlide]?.content || 'Loading...'}
                </p>
                {carouselData[currentSlide]?.additionalInfo && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {carouselData[currentSlide].additionalInfo}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation controls - mobile optimized with touch feedback */}
          {carouselData.length > 1 && (
            <>
              {/* Arrow navigation with improved touch targets */}
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevSlide}
                  disabled={currentSlide === 0 || isAnimating}
                  className="p-3 min-w-[44px] min-h-[44px] transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-500 mb-1">
                    {currentSlide + 1} of {carouselData.length}
                  </span>
                  <div className="text-xs text-gray-400 capitalize">
                    {carouselData[currentSlide]?.type}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextSlide}
                  disabled={currentSlide === carouselData.length - 1 || isAnimating}
                  className="p-3 min-w-[44px] min-h-[44px] transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Enhanced dot indicators with slide type icons */}
              <div className="flex justify-center gap-3 mt-4 overflow-x-auto pb-2">
                {carouselData.map((slide, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    disabled={isAnimating}
                    className={`flex flex-col items-center min-w-[40px] transition-all duration-200 ${
                      index === currentSlide 
                        ? 'text-blue-600 scale-110' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    aria-label={`Go to ${slide.title}`}
                  >
                    <div className={`p-1 rounded-full transition-colors ${
                      index === currentSlide ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {getSlideIcon(slide.type)}
                    </div>
                    <div className={`w-2 h-2 rounded-full mt-1 transition-colors ${
                      index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Action buttons with improved accessibility */}
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs min-h-[40px]"
              onClick={() => setShowFullCarousel(false)}
            >
              Quick View
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs min-h-[40px]"
              onClick={onClose}
            >
              Close
            </Button>
          </div>

          {/* Swipe instruction for first-time users */}
          {carouselData.length > 1 && currentSlide === 0 && (
            <div className="text-center mt-2">
              <p className="text-xs text-gray-400">
                Swipe or tap arrows to navigate
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}