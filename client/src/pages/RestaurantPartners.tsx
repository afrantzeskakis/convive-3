import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Award, MapPin, GraduationCap, Filter, Star, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Award as AwardType, checkAwardsServiceAvailability } from "../api/restaurant-awards";

// Restaurant type definition with awards
type Restaurant = {
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
  features?: any;
  awards?: AwardType[];
  menuUrl?: string;
  isFeatured?: boolean;
  managerId?: number;
};

export default function RestaurantPartners() {
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [awardsServiceAvailable, setAwardsServiceAvailable] = useState<boolean | null>(null);
  
  // Check for Perplexity API availability
  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        const result = await checkAwardsServiceAvailability();
        setAwardsServiceAvailable(result.available);
      } catch (error) {
        console.error('Failed to check awards service:', error);
        setAwardsServiceAvailable(false);
      }
    };
    
    checkApiAvailability();
  }, []);
  
  // Fetch all restaurants
  const { 
    data: restaurants, 
    isLoading, 
    error,
    refetch
  } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants'],
  });
  
  // Filter restaurants by cuisine type if a filter is selected
  const filteredRestaurants = selectedCuisine
    ? restaurants?.filter(restaurant => restaurant.cuisineType === selectedCuisine)
    : restaurants;
    
  // Extract unique cuisine types from all restaurants
  const cuisineTypes = restaurants
    ? Array.from(new Set(restaurants.map(restaurant => restaurant.cuisineType)))
    : [];

  return (
    <>
      {/* Using a simple title instead of Helmet to avoid the helmetInstances error */}
      <div className="hidden">
        <title>Partner Restaurants | Convive</title>
      </div>
      
      {awardsServiceAvailable === false && (
        <div className="bg-amber-50 border-b border-amber-100">
          <div className="container mx-auto px-4 py-3 max-w-7xl flex items-center justify-center">
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <Info className="h-4 w-4" />
              <span>
                Restaurant awards discovery is ready and will be activated once the awards service is configured.
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h1 className="text-4xl font-bold font-serif mb-6 text-slate-800">Our Restaurant Partners</h1>
          <div className="h-0.5 w-20 bg-slate-300 mx-auto mb-6"></div>
          <p className="text-lg text-slate-600">
            We partner exclusively with high-end restaurants to create unique dining experiences. 
            Each venue provides a dedicated host who ensures conversation flows and educates diners 
            about the cuisine, creating an unforgettable social and culinary journey.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden border border-slate-200">
                <div className="h-48 bg-slate-100">
                  <Skeleton className="h-full w-full" />
                </div>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-6" />
                  <div className="flex justify-between">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-10 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Alert className="mb-6 bg-red-50 border-red-200 text-center py-8">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-3" />
            <AlertTitle className="text-red-800 text-lg">Failed to load restaurants</AlertTitle>
            <AlertDescription className="text-red-700 max-w-xl mx-auto mt-2">
              We couldn't load our partner restaurants. Please try again later.
            </AlertDescription>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              className="mt-4 border-red-300 text-red-700 hover:bg-red-50"
            >
              Try Again
            </Button>
          </Alert>
        ) : restaurants && restaurants.length > 0 ? (
          <>
            {/* Cuisine filters */}
            <div className="mb-8 flex flex-wrap items-center gap-2 justify-center">
              <div className="flex items-center mr-2 text-slate-600">
                <Filter className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Filter by cuisine:</span>
              </div>
              
              <Button
                variant={selectedCuisine === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCuisine(null)}
                className="rounded-full text-sm"
              >
                All
              </Button>
              
              {cuisineTypes.map((cuisine) => (
                <Button
                  key={cuisine}
                  variant={selectedCuisine === cuisine ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCuisine(cuisine)}
                  className="rounded-full text-sm"
                >
                  {cuisine}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredRestaurants?.map((restaurant) => (
                <RestaurantPartnerCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-sm border border-slate-100 shadow-sm">
            <Award className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-800 mb-2">No Partner Restaurants Found</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              We're in the process of finalizing partnerships with exclusive restaurants in your area. 
              Check back soon to discover our curated selection of dining venues.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function RestaurantPartnerCard({ restaurant }: { restaurant: Restaurant }) {
  const [awardsServiceAvailable, setAwardsServiceAvailable] = useState<boolean | null>(null);
  
  // Check for Perplexity API availability
  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        const result = await checkAwardsServiceAvailability();
        setAwardsServiceAvailable(result.available);
      } catch (error) {
        console.error('Failed to check awards service:', error);
        setAwardsServiceAvailable(false);
      }
    };
    
    checkApiAvailability();
  }, []);
  return (
    <Card className="overflow-hidden border border-slate-200 hover:shadow-md transition-shadow">
      {restaurant.imageUrl ? (
        <div 
          className="h-48 bg-cover bg-center" 
          style={{ backgroundImage: `url(${restaurant.imageUrl})` }}
        />
      ) : (
        <div className="h-48 bg-gradient-to-r from-slate-100 to-slate-200 flex justify-center items-center">
          <span className="text-slate-400 font-serif text-2xl">Convive × {restaurant.name}</span>
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{restaurant.name}</h3>
            <div className="flex items-center text-slate-500 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{restaurant.address}</span>
            </div>
          </div>
          
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
            {restaurant.cuisineType}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {restaurant.priceRange && (
            <Badge variant="outline" className="text-slate-600 border-slate-200">
              {restaurant.priceRange}
            </Badge>
          )}
          
          {restaurant.ambiance && (
            <Badge variant="outline" className="text-slate-600 border-slate-200">
              {restaurant.ambiance} Ambiance
            </Badge>
          )}
          
          {restaurant.noiseLevel && (
            <Badge variant="outline" className="text-slate-600 border-slate-200">
              {restaurant.noiseLevel} Noise
            </Badge>
          )}
        </div>
        
        <p className="text-slate-600 mb-6">{restaurant.description}</p>
        
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="about" className="text-sm">About</TabsTrigger>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="awards" className="text-sm flex items-center gap-1">
                    Awards & Recognition
                    {!restaurant.awards && (
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {!restaurant.awards ? (
                    "Restaurant awards information will be automatically fetched from culinary databases when this feature is activated."
                  ) : (
                    "View awards and recognitions received by this restaurant."
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsList>
          
          <TabsContent value="about" className="mt-0">
            <div className="flex items-start gap-2 mb-2">
              <GraduationCap className="h-5 w-5 text-slate-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-slate-700">Dedicated Host</h4>
                <p className="text-sm text-slate-600">
                  A restaurant host will guide your experience, share culinary insights, and 
                  facilitate engaging conversation.
                </p>
              </div>
            </div>
            
            {restaurant.features && typeof restaurant.features === 'object' && (
              <div className="flex items-start gap-2">
                <Star className="h-5 w-5 text-slate-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-slate-700">Special Features</h4>
                  <ul className="text-sm text-slate-600 list-disc pl-5 mt-1">
                    {Object.entries(restaurant.features).map(([key, value], index) => (
                      value ? <li key={index}>{key.replace(/([A-Z])/g, ' $1').trim()}</li> : null
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="awards" className="mt-0">
            {awardsServiceAvailable === false && (
              <div className="py-6 text-center flex flex-col items-center">
                <div className="bg-slate-50 p-3 rounded-full mb-3">
                  <Award className="h-6 w-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-medium text-slate-700 mb-1">Awards Service Not Configured</h4>
                <p className="text-slate-500 text-sm max-w-md">
                  Restaurant awards will be automatically retrieved when the awards service is activated.
                  The system will search for culinary awards and recognitions this restaurant has received.
                </p>
              </div>
            )}
            
            {awardsServiceAvailable === true && restaurant.awards && restaurant.awards.length > 0 ? (
              <div className="space-y-3">
                {restaurant.awards.map((award, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Award className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-slate-700">
                        {award.name}
                        {award.category && <span className="font-normal"> - {award.category}</span>}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {award.organization}, {award.year}
                      </p>
                      {award.description && (
                        <p className="text-sm text-slate-600 mt-1">{award.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : awardsServiceAvailable === true ? (
              <div className="py-4 text-center">
                <p className="text-slate-500 text-sm">
                  No awards information available for this restaurant yet.
                </p>
              </div>
            ) : null}
            
            {awardsServiceAvailable === null && (
              <div className="py-6 text-center flex flex-col items-center">
                <div className="animate-pulse flex space-x-4 mb-3">
                  <div className="rounded-full bg-slate-100 h-10 w-10"></div>
                </div>
                <div className="h-2 w-24 bg-slate-100 rounded mb-2 animate-pulse"></div>
                <div className="h-2 w-40 bg-slate-100 rounded animate-pulse"></div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}