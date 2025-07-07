import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import { useToast } from '../hooks/use-toast';
import { AllergenChecker } from '../components/AllergenChecker';
import { RestaurantWineSection } from '../components/restaurant/RestaurantWineSection';
import { Utensils, Wine, FileText, Server, ChefHat, FileSearch, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Define types
interface Restaurant {
  id: number;
  name: string;
  description: string;
  cuisineType: string;
  address: string;
  imageUrl?: string;
  rating?: string;
  managerId?: number;
}

// Component for emulating a restaurant staff view 
export default function RestaurantView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [recipeText, setRecipeText] = useState('');
  const [wineText, setWineText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Extract restaurant ID from URL query parameter or session storage
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantIdFromUrl = urlParams.get('id');
  const restaurantIdFromSession = sessionStorage.getItem('emulatedRestaurantId');
  const restaurantId = restaurantIdFromUrl || restaurantIdFromSession;

  // Redirect if no restaurant ID found and user is not super admin
  useEffect(() => {
    if (!restaurantId && (user?.role !== 'super_admin' && user?.role !== 'admin')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
        variant: 'destructive',
      });
      setLocation('/');
    }
  }, [restaurantId, user, setLocation, toast]);

  // Fetch restaurant data
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['/api/restaurants', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      const response = await fetch(`/api/restaurants/${restaurantId}`);
      if (!response.ok) throw new Error('Failed to fetch restaurant');
      return response.json() as Promise<Restaurant>;
    },
    enabled: !!restaurantId
  });

  // Recipe analysis functionality
  const analyzeRecipe = async () => {
    if (!recipeText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a recipe to analyze',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/recipe-analyzer/analyze?restaurantId=${restaurantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipe: recipeText }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze recipe');
      }

      const data = await response.json();
      
      toast({
        title: 'Recipe Analysis Complete',
        description: 'The recipe has been successfully analyzed',
      });
      
      // Display the analysis in a more structured format
      console.log('Recipe Analysis:', data);
      
    } catch (error: any) {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'An error occurred while analyzing the recipe',
        variant: 'destructive',
      });
    }
  };

  // Wine pairing functionality
  const analyzeWinePairing = async () => {
    if (!wineText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter food items for wine pairing',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/wine-analyzer/pairing?restaurantId=${restaurantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ food: wineText }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze wine pairing');
      }

      const data = await response.json();
      
      toast({
        title: 'Wine Pairing Complete',
        description: 'The wine pairing recommendations are ready',
      });
      
      // Display the analysis in a more structured format
      console.log('Wine Pairing:', data);
      
    } catch (error: any) {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'An error occurred while analyzing wine pairing',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-12 w-3/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[300px] rounded-lg" />
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Restaurant Not Found</h1>
        <p>The requested restaurant could not be found or you do not have permission to view it.</p>
        <Button className="mt-4" onClick={() => setLocation('/')}>
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {user?.role === 'super_admin' || user?.role === 'admin' ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center">
          <Server className="h-5 w-5 text-amber-500 mr-2" />
          <div>
            <p className="font-semibold text-amber-700">
              Super Admin View: You are viewing this restaurant as if you were a staff member.
            </p>
            <p className="text-sm text-amber-600">
              Any actions you take will affect the actual restaurant data.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={() => setLocation('/restaurant-admin')}
          >
            Return to Admin
          </Button>
        </div>
      ) : null}

      <div className="mb-6">
        <h1 className="text-3xl font-bold">{restaurant.name}</h1>
        <div className="flex items-center mt-2">
          <Badge className="mr-2">{restaurant.cuisineType}</Badge>
          {restaurant.rating && (
            <Badge variant="outline">{restaurant.rating} ★</Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center justify-center">
            <FileText className="h-4 w-4 mr-2" />
            Restaurant Info
          </TabsTrigger>
          <TabsTrigger value="recipes" className="flex items-center justify-center">
            <Utensils className="h-4 w-4 mr-2" />
            Recipe Analysis
          </TabsTrigger>
          <TabsTrigger value="wine" className="flex items-center justify-center">
            <Wine className="h-4 w-4 mr-2" />
            Wine Pairing
          </TabsTrigger>
          <TabsTrigger value="allergies" className="flex items-center justify-center">
            <FileSearch className="h-4 w-4 mr-2" />
            Allergen Checker
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Details</CardTitle>
              <CardDescription>
                View and manage information about {restaurant.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {restaurant.imageUrl && (
                <div className="mb-6">
                  <img 
                    src={restaurant.imageUrl} 
                    alt={restaurant.name} 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Restaurant Name</Label>
                <Input value={restaurant.name} readOnly />
              </div>
              
              <div className="space-y-2">
                <Label>Cuisine Type</Label>
                <Input value={restaurant.cuisineType} readOnly />
              </div>
              
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={restaurant.address} readOnly />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea 
                  value={restaurant.description} 
                  readOnly 
                  rows={4}
                  className="w-full p-2 rounded-md border bg-gray-50 text-muted-foreground"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipes">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Analysis Tool</CardTitle>
              <CardDescription>
                Analyze recipes to get ingredient breakdowns, cooking techniques, and talking points for hosts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipe">Enter Recipe Text</Label>
                <textarea 
                  id="recipe"
                  placeholder="Paste your recipe here..."
                  value={recipeText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRecipeText(e.target.value)}
                  rows={10}
                  className="w-full p-2 rounded-md border"
                />
              </div>
              
              <Button onClick={analyzeRecipe} className="w-full">
                <ChefHat className="h-4 w-4 mr-2" />
                Analyze Recipe
              </Button>
              
              <div className="mt-6 p-4 border rounded-lg bg-slate-50">
                <h3 className="font-medium mb-2">Recipe Analysis Results</h3>
                <p className="text-slate-500 text-sm italic">
                  Recipe analysis results will appear here after submission. 
                  The analysis includes ingredient breakdown, cooking techniques, 
                  flavor profiles, cultural origins, and host talking points.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wine">
          <RestaurantWineSection restaurantId={restaurant.id} isUserView={true} />
        </TabsContent>

        <TabsContent value="allergies">
          <Card>
            <CardHeader>
              <CardTitle>Allergen & Dietary Restriction Checker</CardTitle>
              <CardDescription>
                Check recipes and ingredients for potential allergens and dietary restrictions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AllergenChecker restaurantId={Number(restaurantId)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}