import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat, Search, Clock, Users, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Recipe {
  id: number;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string;
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  difficulty?: string;
  category?: string;
  cuisineType?: string;
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

  const categories = ['all', ...new Set(recipes.map((r: Recipe) => r.category).filter(Boolean))];

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
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Added {formatDistanceToNow(new Date(recipe.createdAt), { addSuffix: true })}
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
    </div>
  );
}