import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Skeleton } from "../components/ui/skeleton";
import MeetupCard from "../components/cards/MeetupCard";
import RestaurantCard from "../components/cards/RestaurantCard";

export default function Explore() {
  const [activeTab, setActiveTab] = useState("restaurants");
  const [searchQuery, setSearchQuery] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [ambianceFilter, setAmbianceFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  
  // Fetch all restaurants
  const { data: restaurants, isLoading: restaurantsLoading } = useQuery({
    queryKey: ['/api/restaurants'],
  });
  
  // Fetch all meetups
  const { data: meetups, isLoading: meetupsLoading } = useQuery({
    queryKey: ['/api/meetups'],
  });
  
  // Filter restaurants based on search and filters
  const filteredRestaurants = restaurants?.filter((restaurant: any) => {
    const matchesSearch = searchQuery === "" || 
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisineType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCuisine = cuisineFilter === "" || 
      restaurant.cuisineType.toLowerCase().includes(cuisineFilter.toLowerCase());
    
    const matchesAmbiance = ambianceFilter === "" || 
      restaurant.ambiance === ambianceFilter;
    
    const matchesPrice = priceFilter === "" || 
      restaurant.priceRange === priceFilter;
    
    return matchesSearch && matchesCuisine && matchesAmbiance && matchesPrice;
  });
  
  // Filter meetups based on search
  const filteredMeetups = meetups?.filter((meetup: any) => {
    return searchQuery === "" || 
      meetup.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meetup.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Get unique cuisine types for filter
  const cuisineTypes = restaurants
    ? [...new Set(restaurants.map((r: any) => r.cuisineType.split(', ')[0]))]
    : [];
  
  // Get unique ambiance types for filter
  const ambianceTypes = restaurants
    ? [...new Set(restaurants.map((r: any) => r.ambiance))]
    : [];
  
  const handleResetFilters = () => {
    setSearchQuery("");
    setCuisineFilter("");
    setAmbianceFilter("");
    setPriceFilter("");
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-poppins">Explore</h1>
        <p className="text-gray-600 mt-2">
          Discover restaurants and dining meetups to connect with like-minded food enthusiasts.
        </p>
      </div>
      
      <div className="mb-8">
        <Tabs 
          defaultValue="restaurants" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="meetups">Meetups</TabsTrigger>
          </TabsList>
          
          <div className="mt-6 mb-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder={activeTab === "restaurants" ? "Search restaurants or cuisines..." : "Search meetups..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {activeTab === "restaurants" && (
                <>
                  <div className="w-full md:w-48">
                    <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Cuisine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Cuisines</SelectItem>
                        {cuisineTypes.map((cuisine: string) => (
                          <SelectItem key={cuisine} value={cuisine}>
                            {cuisine}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-full md:w-48">
                    <Select value={ambianceFilter} onValueChange={setAmbianceFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ambiance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Ambiance</SelectItem>
                        {ambianceTypes.map((ambiance: string) => (
                          <SelectItem key={ambiance} value={ambiance}>
                            {ambiance}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-full md:w-48">
                    <Select value={priceFilter} onValueChange={setPriceFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Price Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Prices</SelectItem>
                        <SelectItem value="$">$ (Budget-friendly)</SelectItem>
                        <SelectItem value="$$">$$ (Moderate)</SelectItem>
                        <SelectItem value="$$$">$$$ (Upscale)</SelectItem>
                        <SelectItem value="$$$$">$$$$ (Fine dining)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <Button 
                variant="outline" 
                onClick={handleResetFilters}
                className="w-full md:w-auto"
              >
                Clear Filters
              </Button>
            </div>
          </div>
          
          <TabsContent value="restaurants">
            {restaurantsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4">
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-32 mb-1" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                      <Skeleton className="h-4 w-48 mb-3" />
                      <div className="flex space-x-2 mb-4">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRestaurants?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRestaurants.map((restaurant: any) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            ) : (
              <Card className="w-full">
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-600 mb-4">No restaurants match your search criteria.</p>
                  <Button variant="outline" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="meetups">
            {meetupsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <Skeleton className="h-5 w-20 mb-1" />
                          <Skeleton className="h-6 w-40 mb-1" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-lg" />
                      </div>
                      <div className="mt-4">
                        <Skeleton className="h-4 w-36 mb-1" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <div className="mt-4">
                        <Skeleton className="h-8 w-32" />
                      </div>
                      <div className="mt-4 flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMeetups?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMeetups.map((meetup: any) => (
                  <MeetupCard key={meetup.id} meetup={meetup} />
                ))}
              </div>
            ) : (
              <Card className="w-full">
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-600 mb-4">No meetups match your search criteria.</p>
                  <Button variant="outline" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
