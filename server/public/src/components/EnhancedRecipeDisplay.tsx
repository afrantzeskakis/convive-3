import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CulinaryTermCarousel } from './CulinaryTermCarousel';
import { ChefHat, Clock, Users, BookOpen } from 'lucide-react';

interface EnhancedRecipeDisplayProps {
  analysis: {
    originalText: string;
    highlightedText: string;
    highlightedTerms: any[];
    ingredients: any[];
    instructions: string[];
    culinaryKnowledge?: any[];
    culinaryTerms?: any[];
    nutritionalInfo?: any;
    allergens?: string[];
    dietaryCompatibility?: any;
  };
}

export function EnhancedRecipeDisplay({ analysis }: EnhancedRecipeDisplayProps) {
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselData, setCarouselData] = useState<any[]>([]);

  // Add missing tooltip functions to window object for inline HTML
  if (typeof window !== 'undefined') {
    (window as any).showQuickTooltip = () => {}; // Simple stub
    (window as any).hideQuickTooltip = () => {}; // Simple stub
    (window as any).handleCulinaryTermClick = (term: string) => {
      handleTermClick(term);
    };
  }

  // Handle culinary term clicks
  const handleTermClick = (term: string) => {
    // Check both culinaryKnowledge and culinaryTerms for backwards compatibility
    const culinaryData = analysis.culinaryKnowledge || analysis.culinaryTerms || [];
    const termData = culinaryData.find(
      (knowledge: any) => knowledge.term?.toLowerCase() === term.toLowerCase()
    );
    
    if (termData && termData.carouselContent) {
      setSelectedTerm(term);
      setCarouselData(termData.carouselContent);
      setCarouselOpen(true);
    }
  };

  // Make term click handler globally available
  if (typeof window !== 'undefined') {
    (window as any).handleCulinaryTermClick = handleTermClick;
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'cultural': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Recipe Content with Highlighted Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Recipe Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-sm max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{ __html: analysis.highlightedText }}
            style={{
              '--culinary-term-basic': 'underline decoration-green-500 decoration-2 cursor-pointer hover:bg-green-50',
              '--culinary-term-intermediate': 'underline decoration-blue-500 decoration-2 cursor-pointer hover:bg-blue-50',
              '--culinary-term-advanced': 'underline decoration-purple-500 decoration-2 cursor-pointer hover:bg-purple-50',
              '--culinary-term-cultural': 'underline decoration-orange-500 decoration-2 cursor-pointer hover:bg-orange-50'
            } as any}
          />
        </CardContent>
      </Card>



      {/* Culinary Terms Legend */}
      {analysis.highlightedTerms && analysis.highlightedTerms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="w-4 h-4" />
              Interactive Culinary Terms ({analysis.highlightedTerms.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-0.5 bg-green-500"></div>
                <span>Basic</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span>Intermediate</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-0.5 bg-purple-500"></div>
                <span>Advanced</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-0.5 bg-orange-500"></div>
                <span>Cultural</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {analysis.highlightedTerms.map((termData, index) => (
                <Badge
                  key={`${termData.term}-${index}`}
                  variant="secondary"
                  className={`cursor-pointer hover:opacity-80 ${getCategoryColor(termData.category)}`}
                  onClick={() => handleTermClick(termData.term)}
                >
                  {termData.term}
                </Badge>
              ))}
            </div>
            
            <p className="text-xs text-gray-600 mt-3">
              Tap any highlighted term in the recipe or click badges above to learn more
            </p>
          </CardContent>
        </Card>
      )}

      {/* Ingredients Section */}
      {analysis.ingredients && analysis.ingredients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {analysis.ingredients.map((ingredient, index) => (
                <li key={index} className="text-sm">
                  {typeof ingredient === 'string' ? ingredient : ingredient.name || ingredient.ingredient}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Instructions Section */}
      {analysis.instructions && analysis.instructions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {analysis.instructions.map((instruction, index) => (
                <li key={index} className="text-sm flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Dietary Information */}
      {((analysis.allergens && analysis.allergens.length > 0) || analysis.nutritionalInfo) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dietary Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.allergens && analysis.allergens.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Allergens</h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.allergens.map((allergen, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {analysis.dietaryCompatibility && (
              <div>
                <h4 className="font-medium text-sm mb-2">Dietary Compatibility</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(analysis.dietaryCompatibility).map(([diet, compatible]) => (
                    <div key={diet} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${compatible ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="capitalize">{diet.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Culinary Term Carousel Modal */}
      <CulinaryTermCarousel
        term={selectedTerm}
        isOpen={carouselOpen}
        onClose={() => setCarouselOpen(false)}
        carouselData={carouselData}
      />

      {/* Custom CSS for highlighted terms */}
      <style>{`
        .culinary-term {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .term-basic {
          text-decoration: underline;
          text-decoration-color: #22c55e;
          text-decoration-thickness: 2px;
        }
        
        .term-basic:hover {
          background-color: #dcfce7;
        }
        
        .term-intermediate {
          text-decoration: underline;
          text-decoration-color: #3b82f6;
          text-decoration-thickness: 2px;
        }
        
        .term-intermediate:hover {
          background-color: #dbeafe;
        }
        
        .term-advanced {
          text-decoration: underline;
          text-decoration-color: #a855f7;
          text-decoration-thickness: 2px;
        }
        
        .term-advanced:hover {
          background-color: #f3e8ff;
        }
        
        .term-cultural {
          text-decoration: underline;
          text-decoration-color: #f97316;
          text-decoration-thickness: 2px;
        }
        
        .term-cultural:hover {
          background-color: #fed7aa;
        }
      `}</style>
    </div>
  );
}