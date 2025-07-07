import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContextProvider";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Building, Utensils, Wine, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// Restaurant type definition
interface Restaurant {
  id: number;
  name: string;
  description: string;
  cuisineType: string;
  address: string;
  distance?: string;
  imageUrl?: string;
  rating?: string;
  ambiance?: string;
  noiseLevel?: string;
  priceRange?: string;
  openingHours?: string;
  isFeatured: boolean;
  managerId?: number;
}

interface Recipe {
  id: number;
  name: string;
  restaurant: {
    id: number;
    name: string;
  };
  cuisine: string;
  description: string;
  analysis: {
    ingredients: Array<{ name: string; amount: string }>;
    techniques: string[];
    flavorProfile: Array<{ type: string; intensity: number }>;
    talkingPoints: string[];
    dietaryNotes: string;
  };
}

interface Wine {
  id: number;
  name: string;
  vineyard: string;
  year: number;
  type: string;
  varietal: string;
  region: string;
  country: string;
  alcoholContent: string;
  restaurant: {
    id: number;
    name: string;
  };
  tastingNotes: string;
  flavorProfile: Array<{ type: string; intensity: number }>;
  foodPairings: string[];
  talkingPoints: string[];
  servingSuggestions: string;
}

export default function RestaurantUserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('restaurants');

  // Fetch user's authorized restaurants
  const { data: userRestaurants, isLoading: loadingRestaurants } = useQuery({
    queryKey: ['/api/users/current/restaurants'],
    queryFn: async () => {
      const response = await fetch('/api/users/current/restaurants');
      if (!response.ok) throw new Error('Failed to fetch restaurants');
      return response.json() as Promise<Restaurant[]>;
    }
  });

  // Fetch recipes for the user's authorized restaurants
  const { data: recipes, isLoading: loadingRecipes } = useQuery({
    queryKey: ['/api/recipes/by-restaurant-user'],
    queryFn: async () => {
      const response = await fetch('/api/recipes/by-restaurant-user');
      if (!response.ok) throw new Error('Failed to fetch recipes');
      return response.json() as Promise<Recipe[]>;
    }
  });

  // Fetch wine lists for the user's authorized restaurants
  const { data: wines, isLoading: loadingWines } = useQuery({
    queryKey: ['/api/wine-lists/by-restaurant-user'],
    queryFn: async () => {
      const response = await fetch('/api/wine-lists/by-restaurant-user');
      if (!response.ok) throw new Error('Failed to fetch wine lists');
      return response.json() as Promise<Wine[]>;
    }
  });

  const filteredRestaurants = userRestaurants?.filter(restaurant => 
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.cuisineType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecipes = recipes?.filter(recipe => 
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWines = wines?.filter(wine => 
    wine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wine.varietal.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wine.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-4">Restaurant Staff Dashboard</h1>
        <p>Please login to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-4">Restaurant Staff Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="restaurants" className="flex items-center">
            <Building className="w-4 h-4 mr-2" />
            Restaurants
          </TabsTrigger>
          <TabsTrigger value="today-meetups" className="flex items-center">
            <Utensils className="w-4 h-4 mr-2" />
            Today's Meetups
          </TabsTrigger>
        </TabsList>
        
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recipe-analysis" className="flex items-center">
            <Utensils className="w-4 h-4 mr-2" />
            Recipe Analysis
          </TabsTrigger>
          <TabsTrigger value="wine-pairing" className="flex items-center">
            <Wine className="w-4 h-4 mr-2" />
            Wine Pairing
          </TabsTrigger>
        </TabsList>
        
        {/* Restaurants Tab */}
        <TabsContent value="restaurants">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center w-1/2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search restaurants..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {loadingRestaurants ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="w-full">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants && filteredRestaurants.length > 0 ? (
                filteredRestaurants.map((restaurant: Restaurant) => (
                  <Card key={restaurant.id} className="w-full">
                    <CardHeader>
                      <CardTitle className="text-xl flex justify-between items-start">
                        {restaurant.name}
                        {restaurant.isFeatured && (
                          <Badge className="ml-2 bg-primary/10 text-primary">Featured</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{restaurant.cuisineType}</CardDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {restaurant.priceRange && (
                          <Badge variant="outline">{restaurant.priceRange}</Badge>
                        )}
                        {restaurant.rating && (
                          <Badge variant="outline">{restaurant.rating} ★</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">{restaurant.description}</p>
                      <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-4">
                      <Button 
                        variant="secondary"
                        onClick={() => window.open(`/restaurant-view?id=${restaurant.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Restaurant
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center p-12">
                  <p className="text-muted-foreground">
                    {userRestaurants?.length === 0 
                      ? "You haven't been assigned to any restaurants yet." 
                      : "No restaurants match your search query."}
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Today's Meetups Tab */}
        <TabsContent value="today-meetups">
          <Card>
            <CardHeader>
              <CardTitle>Today's Scheduled Meetups</CardTitle>
              <CardDescription>
                View and manage the dining groups scheduled for today at your assigned restaurants.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                This feature is coming soon. You will be able to see the scheduled
                dining groups at your assigned restaurants.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Recipe Analysis Tab */}
        <TabsContent value="recipe-analysis">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center w-1/2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {loadingRecipes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Card key={i} className="w-full">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredRecipes && filteredRecipes.length > 0 ? (
                filteredRecipes.map((recipe) => (
                  <Card key={recipe.id} className="w-full">
                    <CardHeader>
                      <CardTitle className="text-xl">{recipe.name}</CardTitle>
                      <CardDescription>
                        {recipe.restaurant.name} • {recipe.cuisine}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-sm">{recipe.description}</p>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-2">Key Ingredients:</h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {recipe.analysis.ingredients.slice(0, 5).map((ingredient, idx) => (
                            <Badge key={idx} variant="outline">
                              {ingredient.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-2">Talking Points:</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {recipe.analysis.talkingPoints.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Dietary Notes:</h4>
                        <p className="text-sm text-muted-foreground">{recipe.analysis.dietaryNotes}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center p-12">
                  <p className="text-muted-foreground">
                    {recipes?.length === 0 
                      ? "No recipes available for your assigned restaurants." 
                      : "No recipes match your search query."}
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Wine Pairing Tab */}
        <TabsContent value="wine-pairing">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center w-1/2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search wines..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {loadingWines ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Card key={i} className="w-full">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredWines && filteredWines.length > 0 ? (
                filteredWines.map((wine) => (
                  <Card key={wine.id} className="w-full">
                    <CardHeader>
                      <CardTitle className="text-xl">{wine.name}</CardTitle>
                      <CardDescription>
                        {wine.restaurant.name} • {wine.year} {wine.type}
                      </CardDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">{wine.varietal}</Badge>
                        <Badge variant="outline">{wine.region}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-sm italic">{wine.tastingNotes}</p>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-2">Food Pairings:</h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {wine.foodPairings.map((pairing, idx) => (
                            <Badge key={idx} variant="outline">
                              {pairing}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-2">Talking Points:</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {wine.talkingPoints.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Serving Suggestions:</h4>
                        <p className="text-sm text-muted-foreground">{wine.servingSuggestions}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center p-12">
                  <p className="text-muted-foreground">
                    {wines?.length === 0 
                      ? "No wine lists available for your assigned restaurants." 
                      : "No wines match your search query."}
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}