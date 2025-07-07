import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { Award } from "@/types/restaurant";
import RestaurantAwards from "../components/cards/RestaurantAwards";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Skeleton } from "../components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Calendar } from "../components/ui/calendar";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { format } from "date-fns";
import { TrophyIcon, RefreshCwIcon } from "lucide-react";

export default function RestaurantDetails() {
  const { id } = useParams();
  const restaurantId = parseInt(id);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("21:00");
  const [title, setTitle] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch restaurant details
  const { data: restaurant, isLoading, error } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}`],
    enabled: !!restaurantId,
  });

  // Fetch upcoming meetups at this restaurant
  const { data: restaurantMeetups, isLoading: meetupsLoading } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}/meetups`],
    enabled: !!restaurantId,
  });

  // Create meetup mutation
  const createMeetupMutation = useMutation({
    mutationFn: async (meetupData: any) => {
      return await apiRequest("POST", "/api/meetups", meetupData);
    },
    onSuccess: () => {
      toast({
        title: "Meetup created!",
        description: "Your dining meetup has been created successfully.",
      });
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/meetups`] });
      queryClient.invalidateQueries({ queryKey: ['/api/meetups/upcoming'] });
    },
    onError: (error) => {
      toast({
        title: "Error creating meetup",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Toggle favorite
  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: isFavorite 
        ? "Restaurant removed from your favorites." 
        : "Restaurant added to your favorites.",
    });
  };

  // Handle creating a new meetup
  const handleCreateMeetup = () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a meetup.",
        variant: "destructive",
      });
      return;
    }

    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date for the meetup.",
        variant: "destructive",
      });
      return;
    }

    const meetupData = {
      title: title || `${restaurant.cuisineType} Dinner at ${restaurant.name}`,
      restaurantId,
      date: date.toISOString(),
      startTime,
      endTime,
      maxParticipants,
      status: "pending",
      createdBy: user.id,
    };

    createMeetupMutation.mutateAsync(meetupData);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full rounded-lg" />
            <div className="mt-6">
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-6 w-full mb-4" />
              <div className="flex space-x-2 mb-4">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-40 mb-4" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-5 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Restaurant Not Found</h2>
        <p className="text-gray-600 mb-6">
          The restaurant you're looking for doesn't exist or there was an error loading its details.
        </p>
        <Button asChild>
          <Link href="/explore">Explore Restaurants</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative">
            <img 
              src={restaurant.imageUrl} 
              alt={restaurant.name} 
              className="w-full h-96 object-cover rounded-lg"
            />
            <button 
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md"
              onClick={toggleFavorite}
            >
              <i className={`${isFavorite ? 'fas text-primary' : 'far text-gray-600'} fa-heart text-xl`}></i>
            </button>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold font-poppins">{restaurant.name}</h1>
                <p className="text-gray-600 mt-1">{restaurant.cuisineType}</p>
              </div>
              <div className="flex items-center bg-gray-50 px-3 py-1 rounded-lg">
                <i className="fas fa-star text-[#FFBB00] mr-1"></i>
                <span className="font-semibold">{restaurant.rating}</span>
              </div>
            </div>
            
            <div className="flex space-x-2 mt-4">
              <Badge variant="secondary">
                <i className="fas fa-utensils mr-1"></i> {restaurant.ambiance}
              </Badge>
              <Badge variant="secondary">
                <i className={`fas fa-volume-${restaurant.noiseLevel === 'Quiet' ? 'down' : restaurant.noiseLevel === 'Moderate' ? 'up' : 'up'} mr-1`}></i> {restaurant.noiseLevel}
              </Badge>
              <Badge variant="secondary">
                {restaurant.priceRange}
              </Badge>
            </div>
            
            <div className="mt-6">
              <Tabs defaultValue="about">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="menu">Menu</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="about" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Description</h3>
                      <p className="text-gray-600">{restaurant.description}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Location</h3>
                      <div className="flex items-center">
                        <i className="fas fa-map-marker-alt text-gray-400 mr-2"></i>
                        <span className="text-gray-600">{restaurant.address}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <i className="fas fa-map-marker-alt text-gray-400 mr-2"></i>
                        <span className="text-gray-600">{restaurant.distance} from you</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {restaurant.features?.map((feature: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Restaurant Awards Section */}
                    {restaurant.awards && restaurant.awards.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2">
                          <TrophyIcon className="h-5 w-5 text-amber-500" />
                          <h3 className="text-lg font-semibold">Awards & Recognition</h3>
                        </div>
                        <div className="mt-2 border border-gray-100 rounded-md p-4 bg-slate-50/50">
                          {restaurant.awards.map((award: Award, index: number) => (
                            <div key={`${award.name}-${index}`} className={index > 0 ? 'mt-3 pt-3 border-t border-gray-100' : ''}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{award.name}</p>
                                  <p className="text-sm text-gray-600">{award.organization}</p>
                                  {award.category && (
                                    <p className="text-sm text-gray-600">Category: {award.category}</p>
                                  )}
                                </div>
                                <Badge variant="outline" className="bg-white text-slate-700">
                                  {award.year}
                                </Badge>
                              </div>
                              {award.description && (
                                <p className="text-sm italic text-gray-600 mt-1">{award.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="menu" className="mt-4">
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Full Menu Available</h3>
                    <p className="text-gray-600 mb-4">Check out the restaurant's full menu on their website.</p>
                    <Button asChild>
                      <a href={restaurant.menuUrl} target="_blank" rel="noopener noreferrer">View Menu</a>
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="reviews" className="mt-4">
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Reviews Coming Soon</h3>
                    <p className="text-gray-600">We're gathering reviews from our community.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Upcoming Meetups Section */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Upcoming Meetups at {restaurant.name}</h2>
            
            {meetupsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
              </div>
            ) : restaurantMeetups?.length > 0 ? (
              <div className="space-y-4">
                {restaurantMeetups.map((meetup: any) => (
                  <Card key={meetup.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{meetup.title}</h3>
                          <div className="flex items-center mt-1">
                            <i className="fas fa-calendar text-gray-400 mr-2"></i>
                            <span className="text-gray-600">{new Date(meetup.date).toLocaleDateString()}, {meetup.startTime} - {meetup.endTime}</span>
                          </div>
                          <div className="flex -space-x-2 overflow-hidden mt-2">
                            {meetup.participants.slice(0, 4).map((participant: any) => (
                              <Avatar key={participant.id} className="h-8 w-8 border-2 border-white">
                                <AvatarImage src={participant.profilePicture} alt={participant.fullName} />
                                <AvatarFallback>{participant.fullName?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                            ))}
                            {meetup.participants.length > 4 && (
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 border-2 border-white">
                                <span className="text-xs font-medium">+{meetup.participants.length - 4}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button asChild size="sm">
                          <Link href={`/meetup/${meetup.id}`}>Join Meetup</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming meetups</h3>
                <p className="text-gray-600 mb-4">Be the first to create a dining experience here!</p>
                {isAuthenticated ? (
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Create Meetup
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/login">Login to Create Meetup</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Host a Meetup Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Host a Meetup</CardTitle>
                <CardDescription>
                  Create a dining experience at {restaurant.name} and meet new friends.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <>
                    <p className="text-gray-600 mb-4">
                      Choose a date and time for your dining meetup. You can invite others to join you for a great culinary experience.
                    </p>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      <i className="fas fa-users mr-2"></i>
                      Create Meetup
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 mb-4">
                      Sign in to create a meetup at this restaurant and connect with like-minded food enthusiasts.
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/login">Sign In to Create Meetup</Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Admin Controls - Only visible to restaurant admins and super admins */}
            {isAuthenticated && (user?.role === "restaurant_admin" || user?.role === "super_admin") && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Restaurant Admin</CardTitle>
                  <CardDescription>
                    Manage restaurant information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <TrophyIcon className="h-4 w-4 text-amber-500" />
                      Awards & Recognition
                    </h4>
                    {/* Update Awards Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={async () => {
                        try {
                          const response = await apiRequest("POST", `/api/restaurants/${restaurantId}/refresh-awards`);
                          queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}`] });
                          toast({
                            title: "Awards refreshed",
                            description: "Restaurant awards have been updated successfully.",
                          });
                        } catch (error) {
                          toast({
                            title: "Error refreshing awards",
                            description: "There was a problem updating the restaurant awards. Please try again later.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <RefreshCwIcon className="h-4 w-4" />
                      Refresh Restaurant Awards
                    </Button>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Awards are automatically discovered using the Perplexity AI API when a restaurant is first added. Use this button to refresh or update awards data.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Meetup Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a Meetup at {restaurant.name}</DialogTitle>
            <DialogDescription>
              Set the details for your dining experience. Other users can request to join your meetup.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Meetup Title</Label>
              <Input
                id="title"
                placeholder={`${restaurant.cuisineType} Dinner at ${restaurant.name}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Date</Label>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 3))}
                className="border rounded-md p-3"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="maxParticipants">Maximum Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="2"
                max="12"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={createMeetupMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateMeetup}
              disabled={createMeetupMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createMeetupMutation.isPending ? "Creating..." : "Create Meetup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
