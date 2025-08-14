import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChefHat, Search, Clock, Users, Star, Eye, Utensils, List, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CulinaryTermCarousel } from '../CulinaryTermCarousel';

interface Recipe {
  id: number;
  name: string;
  description: string;
  ingredients?: string[];
  instructions?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  difficulty?: string;
  category?: string;
  cuisineType?: string;
  dishType?: string;
  cuisine?: string;
  recipeText?: string;
  techniques?: Array<{
    name: string;
    description: string;
  }>;
  allergenSummary?: Record<string, string[]>;
  dietaryRestrictionSummary?: Record<string, string[]>;
  // Analysis fields
  highlightedText?: string;
  highlightedTerms?: Array<{
    term: string;
    category: string;
  }>;
  culinaryKnowledge?: Array<{
    term: string;
    category: string;
    carouselContent?: any[];
  }>;
  culinaryTerms?: Array<{
    term: string;
    category: string;
    carouselContent?: any[];
  }>;
  createdAt: string;
  updatedAt: string;
  restaurantId: number;
}

interface RestaurantRecipeSectionProps {
  restaurantId: number;
  isUserView?: boolean;
}

export function RestaurantRecipeSection({ restaurantId, isUserView = false }: RestaurantRecipeSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);
  
  // Carousel state for culinary terms
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselData, setCarouselData] = useState<any[]>([]);

  // Fetch restaurant recipes
  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['restaurant-recipes', restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${restaurantId}/recipes`);
      if (!response.ok) throw new Error('Failed to fetch recipes');
      return response.json();
    }
  });

  // Filter recipes based on search and category
  const filteredRecipes = recipes.filter((recipe: Recipe) => {
    const matchesSearch = !searchQuery || 
      recipe.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.cuisineType?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      recipe.category?.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewRecipeDetails = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeDetails(true);
  };

  // Handle culinary term clicks
  const handleTermClick = (term: string, recipe: Recipe) => {
    const culinaryData = recipe.culinaryKnowledge || recipe.culinaryTerms || [];
    const termData = culinaryData.find(
      (knowledge) => knowledge.term?.toLowerCase() === term.toLowerCase()
    );
    
    if (termData && termData.carouselContent) {
      setSelectedTerm(term);
      setCarouselData(termData.carouselContent);
      setCarouselOpen(true);
    }
  };

  // Make term click handler globally available for inline HTML clicks
  if (typeof window !== 'undefined' && selectedRecipe) {
    (window as any).handleCulinaryTermClick = (term: string) => {
      handleTermClick(term, selectedRecipe);
    };
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

  const categories = ['all', ...new Set(recipes.map((r: Recipe) => r.category).filter(Boolean).map(c => String(c)))];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <ChefHat className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p>Loading recipes...</p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <ChefHat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Recipes Yet</h3>
          <p className="text-muted-foreground">
            {isUserView 
              ? "This restaurant hasn't uploaded any recipes yet."
              : "Start by uploading recipes through the Restaurant Admin dashboard."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Recipe Collection</h2>
        <p className="text-muted-foreground">Explore our restaurant's signature recipes</p>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {categories.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === 'all' ? 'All Categories' : category}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recipe Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRecipes.map((recipe: Recipe) => (
          <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl">{recipe.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {recipe.description}
                  </CardDescription>
                </div>
                {recipe.difficulty && (
                  <Badge className={getDifficultyColor(recipe.difficulty)}>
                    {recipe.difficulty}
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {recipe.cuisineType && (
                  <Badge variant="outline">
                    {recipe.cuisineType}
                  </Badge>
                )}
                {recipe.category && (
                  <Badge variant="outline">
                    {recipe.category}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Recipe Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {recipe.prepTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Prep: {recipe.prepTime}</span>
                    </div>
                  )}
                  {recipe.cookTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Cook: {recipe.cookTime}</span>
                    </div>
                  )}
                  {recipe.servings && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Serves {recipe.servings}</span>
                    </div>
                  )}
                </div>

                {/* Ingredients Preview */}
                {recipe.ingredients && recipe.ingredients.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Key Ingredients:</h4>
                    <p className="text-sm text-muted-foreground">
                      {recipe.ingredients.slice(0, 5).join(', ')}
                      {recipe.ingredients.length > 5 && `, +${recipe.ingredients.length - 5} more`}
                    </p>
                  </div>
                )}

                {/* Instructions Preview */}
                {recipe.instructions && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Instructions Preview:</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {recipe.instructions}
                    </p>
                  </div>
                )}

                {/* Last Updated */}
                <div className="text-xs text-muted-foreground pt-2 border-t flex justify-between items-center">
                  <span>Added {formatDistanceToNow(new Date(recipe.createdAt), { addSuffix: true })}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewRecipeDetails(recipe)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View Full Recipe
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecipes.length === 0 && recipes.length > 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No recipes found matching your search criteria.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recipe Details Dialog */}
      <Dialog open={showRecipeDetails} onOpenChange={setShowRecipeDetails}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              {selectedRecipe?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedRecipe?.category} • {selectedRecipe?.cuisineType}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {selectedRecipe && (
              <div className="space-y-6">
                {/* Recipe Overview */}
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedRecipe.description}
                  </p>
                </div>

                {/* Recipe Details */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {selectedRecipe.difficulty && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Difficulty:</span>{' '}
                        <Badge className={getDifficultyColor(selectedRecipe.difficulty)}>
                          {selectedRecipe.difficulty}
                        </Badge>
                      </span>
                    </div>
                  )}
                  
                  {selectedRecipe.prepTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Prep:</span> {selectedRecipe.prepTime}
                      </span>
                    </div>
                  )}
                  
                  {selectedRecipe.cookTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Cook:</span> {selectedRecipe.cookTime}
                      </span>
                    </div>
                  )}
                  
                  {selectedRecipe.servings && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Serves:</span> {selectedRecipe.servings}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ingredients */}
                {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <List className="h-4 w-4" />
                      Ingredients
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {selectedRecipe.ingredients.map((ingredient, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span className="text-sm">
                            {typeof ingredient === 'string' 
                              ? ingredient 
                              : ingredient.name || ingredient}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {selectedRecipe.instructions && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Utensils className="h-4 w-4" />
                      Instructions
                    </h4>
                    <div className="space-y-3">
                      {selectedRecipe.instructions.split('\n').filter(step => step.trim()).map((step, index) => (
                        <div key={index} className="flex gap-3">
                          <span className="font-medium text-primary min-w-[24px]">
                            {index + 1}.
                          </span>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.trim()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Techniques */}
                {selectedRecipe.techniques && selectedRecipe.techniques.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Cooking Techniques
                    </h4>
                    <div className="space-y-2">
                      {selectedRecipe.techniques.map((technique, index) => (
                        <div key={index} className="border-l-2 border-primary pl-3">
                          <p className="text-sm font-medium">{technique.name}</p>
                          <p className="text-xs text-muted-foreground">{technique.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dietary Information */}
                {(selectedRecipe.allergenSummary || selectedRecipe.dietaryRestrictionSummary) && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {selectedRecipe.allergenSummary && Object.keys(selectedRecipe.allergenSummary).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Allergen Information</h4>
                        <div className="space-y-1">
                          {Object.entries(selectedRecipe.allergenSummary).map(([allergen, ingredients]) => (
                            <div key={allergen} className="text-xs">
                              <span className="font-medium text-warning">{allergen}:</span>
                              <span className="text-muted-foreground ml-1">
                                {Array.isArray(ingredients) 
                                  ? ingredients.map(ing => 
                                      typeof ing === 'string' ? ing : ing.name || ing
                                    ).join(', ')
                                  : ingredients}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedRecipe.dietaryRestrictionSummary && Object.keys(selectedRecipe.dietaryRestrictionSummary).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Dietary Restrictions</h4>
                        <div className="space-y-1">
                          {Object.entries(selectedRecipe.dietaryRestrictionSummary).map(([restriction, ingredients]) => (
                            <div key={restriction} className="text-xs">
                              <span className="font-medium">{restriction}:</span>
                              <span className="text-muted-foreground ml-1">
                                {Array.isArray(ingredients) 
                                  ? ingredients.map(ing => 
                                      typeof ing === 'string' ? ing : ing.name || ing
                                    ).join(', ')
                                  : ingredients}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Highlighted Recipe Text with Culinary Terms */}
                {selectedRecipe.highlightedText ? (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <ChefHat className="h-4 w-4" />
                      Complete Recipe (Click highlighted terms to learn)
                    </h4>
                    <div 
                      className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: selectedRecipe.highlightedText }}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.classList.contains('culinary-term')) {
                          const term = target.getAttribute('data-term');
                          if (term) {
                            handleTermClick(term, selectedRecipe);
                          }
                        }
                      }}
                      style={{
                        '--culinary-term-basic': 'underline decoration-green-500 decoration-2 cursor-pointer hover:bg-green-100 hover:rounded px-1',
                        '--culinary-term-intermediate': 'underline decoration-blue-500 decoration-2 cursor-pointer hover:bg-blue-100 hover:rounded px-1',
                        '--culinary-term-advanced': 'underline decoration-purple-500 decoration-2 cursor-pointer hover:bg-purple-100 hover:rounded px-1',
                        '--culinary-term-cultural': 'underline decoration-orange-500 decoration-2 cursor-pointer hover:bg-orange-100 hover:rounded px-1'
                      } as any}
                    />
                  </div>
                ) : selectedRecipe.recipeText && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <ChefHat className="h-4 w-4" />
                      Complete Recipe
                    </h4>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedRecipe.recipeText}
                      </p>
                    </div>
                  </div>
                )}

                {/* Educational Terms Legend */}
                {selectedRecipe.highlightedTerms && selectedRecipe.highlightedTerms.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Educational Terms Found ({selectedRecipe.highlightedTerms.length})
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-0.5 bg-green-500"></div>
                        <span>Basic - Foundational skills</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-0.5 bg-blue-500"></div>
                        <span>Intermediate - Professional techniques</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-0.5 bg-purple-500"></div>
                        <span>Advanced - Expert methods</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-0.5 bg-orange-500"></div>
                        <span>Cultural - Traditional practices</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {selectedRecipe.highlightedTerms.map((termData, index) => (
                        <Badge
                          key={`${termData.term}-${index}`}
                          variant="secondary"
                          className={`cursor-pointer hover:opacity-80 ${getCategoryColor(termData.category)}`}
                          onClick={() => handleTermClick(termData.term, selectedRecipe)}
                        >
                          {termData.term}
                        </Badge>
                      ))}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Click any underlined term in the recipe text to open its educational carousel
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t text-xs text-muted-foreground">
                  <p>Added {formatDistanceToNow(new Date(selectedRecipe.createdAt), { addSuffix: true })}</p>
                  {selectedRecipe.updatedAt !== selectedRecipe.createdAt && (
                    <p>Last updated {formatDistanceToNow(new Date(selectedRecipe.updatedAt), { addSuffix: true })}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Culinary Term Carousel */}
      <CulinaryTermCarousel
        term={selectedTerm}
        isOpen={carouselOpen}
        onClose={() => setCarouselOpen(false)}
        carouselData={carouselData}
      />
    </div>
  );
}