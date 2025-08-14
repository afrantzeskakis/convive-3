import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { WineConcierge } from "@/components/WineConcierge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wine, ArrowLeft, Search, Building2, MapPin, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Restaurant {
  id: number;
  name: string;
  description?: string;
  cuisineType?: string;
  location?: string;
  address?: string;
  isFeatured?: boolean;
}

export default function WineConciergePage() {
  const { user } = useAuth();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRestaurantSearch, setShowRestaurantSearch] = useState(true);

  // Fetch all restaurants
  const { data: restaurants, isLoading: isLoadingRestaurants } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants'],
    queryFn: async () => {
      const response = await fetch('/api/restaurants');
      if (!response.ok) throw new Error('Failed to fetch restaurants');
      return response.json();
    },
    enabled: user !== null
  });

  // Get default restaurant ID based on user role
  const getDefaultRestaurantId = () => {
    if (user?.role === 'super_admin') {
      // Super admin can access all restaurants, no default
      return null;
    } else if (user?.role === 'restaurant_admin' && user?.authorizedRestaurants && user.authorizedRestaurants.length > 0) {
      return user.authorizedRestaurants[0];
    } else if (user?.authorizedRestaurants && user.authorizedRestaurants.length > 0) {
      return user.authorizedRestaurants[0];
    }
    return null;
  };

  // Set default restaurant on load if user has one
  useEffect(() => {
    const defaultId = getDefaultRestaurantId();
    if (defaultId && restaurants && restaurants.length > 0) {
      const defaultRestaurant = restaurants.find(r => r.id === defaultId);
      if (defaultRestaurant) {
        setSelectedRestaurantId(defaultId);
        // For non-super admins with a default restaurant, hide the search
        if (user?.role !== 'super_admin') {
          setShowRestaurantSearch(false);
        }
      }
    }
  }, [user, restaurants]);

  // Filter restaurants based on search query and user access
  const filteredRestaurants = restaurants?.filter((restaurant) => {
    // First, check if user has access to this restaurant
    const hasAccess = user?.role === 'super_admin' || 
                     user?.role === 'admin' ||
                     (user?.authorizedRestaurants && user.authorizedRestaurants.includes(restaurant.id));
    
    if (!hasAccess) return false;

    // Then apply search filter
    if (searchQuery.trim() === "") return true;
    
    const query = searchQuery.toLowerCase();
    return restaurant.name.toLowerCase().includes(query) ||
           restaurant.cuisineType?.toLowerCase().includes(query) ||
           restaurant.location?.toLowerCase().includes(query) ||
           restaurant.address?.toLowerCase().includes(query);
  }) || [];

  const selectedRestaurant = restaurants?.find(r => r.id === selectedRestaurantId);

  // Check if user has access to any restaurants
  const hasRestaurantAccess = user?.role === 'super_admin' || 
                             user?.role === 'admin' ||
                             (user?.authorizedRestaurants && user.authorizedRestaurants.length > 0);

  if (!hasRestaurantAccess) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have access to any restaurant's wine concierge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wine className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <h1 className="text-lg sm:text-2xl font-bold">Wine Concierge</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {selectedRestaurant && !showRestaurantSearch && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRestaurantSearch(true)}
                  className="hidden sm:flex"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Change Restaurant
                </Button>
              )}
              {selectedRestaurant && !showRestaurantSearch && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRestaurantSearch(true)}
                  className="sm:hidden"
                >
                  <Building2 className="h-4 w-4" />
                </Button>
              )}
              <Link href="/">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="sm" className="sm:hidden">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Restaurant Selection Section */}
        {showRestaurantSearch && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Select Restaurant
              </CardTitle>
              <CardDescription>
                Choose a restaurant to access its wine concierge service
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search restaurants by name, cuisine, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Restaurant List */}
              {isLoadingRestaurants ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredRestaurants.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {filteredRestaurants.map((restaurant) => (
                      <Card 
                        key={restaurant.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedRestaurantId === restaurant.id 
                            ? 'ring-2 ring-primary ring-offset-2' 
                            : ''
                        }`}
                        onClick={() => {
                          setSelectedRestaurantId(restaurant.id);
                          setShowRestaurantSearch(false);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                                {restaurant.isFeatured && (
                                  <Badge variant="secondary">Featured</Badge>
                                )}
                              </div>
                              {restaurant.cuisineType && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                                  <ChefHat className="h-3 w-3" />
                                  {restaurant.cuisineType}
                                </div>
                              )}
                              {(restaurant.location || restaurant.address) && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {restaurant.location || restaurant.address}
                                </div>
                              )}
                              {restaurant.description && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {restaurant.description}
                                </p>
                              )}
                            </div>
                            {selectedRestaurantId === restaurant.id && (
                              <Badge className="ml-2">Selected</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <Alert>
                  <AlertDescription>
                    {searchQuery 
                      ? "No restaurants found matching your search."
                      : "No restaurants available. Please contact an administrator."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Selected Restaurant Info */}
        {selectedRestaurant && !showRestaurantSearch && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{selectedRestaurant.name}</h3>
                    {selectedRestaurant.cuisineType && (
                      <p className="text-sm text-muted-foreground">{selectedRestaurant.cuisineType}</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wine Concierge Component */}
        {selectedRestaurantId && !showRestaurantSearch && (
          <WineConcierge restaurantId={selectedRestaurantId} />
        )}

        {/* Prompt to select restaurant */}
        {!selectedRestaurantId && !showRestaurantSearch && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Wine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Restaurant Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Please select a restaurant to access the wine concierge service.
                </p>
                <Button onClick={() => setShowRestaurantSearch(true)}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Select Restaurant
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}