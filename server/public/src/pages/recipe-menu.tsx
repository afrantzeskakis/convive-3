import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChefHat, Clock, Globe, Building2 } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useLocation } from 'wouter';

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
  };
  createdAt: string;
  restaurantId: number;
  restaurantName: string;
}

interface Restaurant {
  id: number;
  name: string;
  cuisineType: string;
}

export default function RecipeMenu() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeAnalysis[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);

  // Fetch restaurants that user has access to
  const { data: restaurants } = useQuery({
    queryKey: ['/api/restaurants'],
    queryFn: async () => {
      const response = await fetch('/api/restaurants');
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }
      return response.json();
    }
  });

  // Fetch recipe analyses filtered by selected restaurant
  const { data: recipes, isLoading, error } = useQuery({
    queryKey: ['/api/recipe-analyses', selectedRestaurant],
    queryFn: async () => {
      const url = selectedRestaurant 
        ? `/api/recipe-analyses?restaurantId=${selectedRestaurant}`
        : '/api/recipe-analyses';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      return response.json();
    }
  });

  // Don't auto-select any restaurant - let user choose
  // This ensures recipes are only displayed for the restaurant the user explicitly selects

  // Filter recipes based on search term
  useEffect(() => {
    if (!recipes) return;
    
    if (!searchTerm.trim()) {
      setFilteredRecipes(recipes);
      return;
    }

    const filtered = recipes.filter((recipe: RecipeAnalysis) => {
      const dishName = recipe.analysisData?.dishName || recipe.filename;
      const cuisineType = recipe.analysisData?.cuisineType || '';
      
      return (
        dishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cuisineType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    
    setFilteredRecipes(filtered);
  }, [recipes, searchTerm]);

  const handleRecipeClick = (recipeId: number) => {
    setLocation(`/recipe-detail/${recipeId}`);
  };

  const formatDishName = (recipe: RecipeAnalysis) => {
    // Use the filename field which contains the full recipe name from the database
    return recipe.filename || 'Unknown Recipe';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading your recipe menu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          <p>Error loading recipes. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recipe Menu</h1>
        <p className="text-muted-foreground">
          Browse your recipe collection and access detailed culinary knowledge
        </p>
      </div>

      {/* Restaurant Selection */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Select Restaurant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedRestaurant?.toString() || ""}
              onValueChange={(value) => setSelectedRestaurant(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a restaurant to view its recipes" />
              </SelectTrigger>
              <SelectContent>
                {restaurants?.map((restaurant: Restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                    {restaurant.name} ({restaurant.cuisineType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar - only show when restaurant is selected */}
      {selectedRestaurant && (
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search recipes by name, cuisine, or ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-lg py-3"
          />
        </div>
      )}

      {/* Recipe Grid - only show when restaurant is selected */}
      {selectedRestaurant ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <Card 
                key={recipe.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleRecipeClick(recipe.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    {formatDishName(recipe)}
                  </CardTitle>
                  {/* Restaurant context */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {recipe.restaurantName}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Cuisine Type */}
                    {recipe.analysisData?.cuisineType && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">
                          {recipe.analysisData.cuisineType}
                        </Badge>
                      </div>
                    )}

                    {/* Cooking Time */}
                    {recipe.analysisData?.cookingTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {recipe.analysisData.cookingTime}
                        </span>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="flex gap-2 flex-wrap">
                      {recipe.analysisData?.difficulty && (
                        <Badge variant="outline">
                          {recipe.analysisData.difficulty}
                        </Badge>
                      )}
                      {recipe.analysisData?.servings && (
                        <Badge variant="outline">
                          Serves {recipe.analysisData.servings}
                        </Badge>
                      )}
                    </div>

                    {/* Upload Date */}
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(recipe.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State for selected restaurant */}
          {filteredRecipes.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <ChefHat className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 
                  `No recipes match "${searchTerm}". Try a different search term.` : 
                  'No recipes available for this restaurant yet.'
                }
              </p>
            </div>
          )}
        </>
      ) : (
        /* Empty State when no restaurant selected */
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Select a Restaurant</h3>
          <p className="text-muted-foreground">
            Choose a restaurant from the dropdown above to view its recipe collection.
          </p>
        </div>
      )}
    </div>
  );
}