import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContextProvider";
import { Restaurant, Meetup, User, UserPreferences } from "@shared/schema";
import { 
  Loader2, 
  Calendar, 
  Clock, 
  Users, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Upload, 
  FileText, 
  Search, 
  Info,
  ChefHat,
  BookOpen,
  Wine,
  GlassWater
} from "lucide-react";

// Type for the combined participant data including their preferences
interface ParticipantWithPreferences {
  user: User;
  preferences?: UserPreferences;
  outgoingScore?: number;
  punctualityScore?: number;
}

// Type for meetups with their participant data
interface MeetupWithParticipants extends Meetup {
  restaurant: Restaurant;
  participants: ParticipantWithPreferences[];
}

export default function RestaurantAdmin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("restaurants");
  const [expandedMeetups, setExpandedMeetups] = useState<number[]>([]);

  // If not logged in or doesn't have required permissions, redirect to login
  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "restaurant_admin" && user.role !== "super_admin"))) {
      toast({
        title: "Access Denied",
        description: "You must be logged in as a restaurant administrator or super admin.",
        variant: "destructive",
      });
      setLocation("/auth");
    }
  }, [user, authLoading, setLocation, toast]);

  // Get restaurants managed by this admin
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  
  // Get today's meetups for the admin's restaurants
  const [todaysMeetups, setTodaysMeetups] = useState<MeetupWithParticipants[]>([]);
  const [meetupsLoading, setMeetupsLoading] = useState(true);
  
  // Recipe analyzer states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recipeFile, setRecipeFile] = useState<File | null>(null);
  const [recipeNotes, setRecipeNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [recipeAnalysis, setRecipeAnalysis] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<{type: string, name: string} | null>(null);
  
  // Restaurant user management states
  const [newUser, setNewUser] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    restaurantIds: [] as number[]
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isRemovingUser, setIsRemovingUser] = useState<number | null>(null);
  const [restaurantUsers, setRestaurantUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [itemDetails, setItemDetails] = useState<string>('');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [aiStatus, setAiStatus] = useState<boolean | null>(null);
  const [isCheckingAi, setIsCheckingAi] = useState(true);
  
  // Wine analyzer states
  const wineFileInputRef = useRef<HTMLInputElement>(null);
  const [wineListFile, setWineListFile] = useState<File | null>(null);
  const [wineNotes, setWineNotes] = useState('');
  const [isUploadingWineList, setIsUploadingWineList] = useState(false);
  const [wineAnalysis, setWineAnalysis] = useState<any>(null);
  const [selectedWine, setSelectedWine] = useState<any>(null);
  const [wineDetails, setWineDetails] = useState<string>('');
  const [isLoadingWineDetails, setIsLoadingWineDetails] = useState(false);
  const [customerPreferences, setCustomerPreferences] = useState<string>('');
  const [wineRecommendations, setWineRecommendations] = useState<any[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [wineAiStatus, setWineAiStatus] = useState<boolean | null>(null);
  const [isCheckingWineAi, setIsCheckingWineAi] = useState(true);
  
  // Check AI status when tabs are selected
  useEffect(() => {
    if (activeTab === "recipes" && isCheckingAi) {
      checkAiStatus();
    }
    if (activeTab === "wines" && isCheckingWineAi) {
      checkWineAiStatus();
    }
  }, [activeTab, isCheckingAi, isCheckingWineAi]);
  
  // Function to check if recipe AI analysis is available (API key is set)
  const checkAiStatus = async () => {
    try {
      const response = await fetch('/api/recipe-analyzer/ai-status');
      
      if (!response.ok) {
        throw new Error('Failed to check AI status');
      }
      
      const data = await response.json();
      setAiStatus(data.enabled);
    } catch (error) {
      console.error('Error checking AI status:', error);
      setAiStatus(false);
    } finally {
      setIsCheckingAi(false);
    }
  };
  
  // Function to check if wine AI analysis is available (API key is set)
  const checkWineAiStatus = async () => {
    try {
      const response = await fetch('/api/wine-analyzer/ai-status');
      
      if (!response.ok) {
        throw new Error('Failed to check wine AI status');
      }
      
      const data = await response.json();
      setWineAiStatus(data.enabled);
    } catch (error) {
      console.error('Error checking wine AI status:', error);
      setWineAiStatus(false);
    } finally {
      setIsCheckingWineAi(false);
    }
  };
  
  // Handle recipe file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setRecipeFile(files[0]);
    }
  };
  
  // Handle wine list file selection
  const handleWineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setWineListFile(files[0]);
    }
  };
  
  // Handle wine list upload and analysis
  const handleWineListUpload = async () => {
    if (!wineListFile) return;
    
    setIsUploadingWineList(true);
    setWineAnalysis(null);
    setSelectedWine(null);
    setWineDetails('');
    
    try {
      const formData = new FormData();
      formData.append('wineListFile', wineListFile);
      
      if (wineNotes) {
        formData.append('notes', wineNotes);
      }
      
      const response = await fetch('/api/wine-analyzer/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload and analyze wine list');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setWineAnalysis(data.analysis);
        toast({
          title: 'Wine List Analyzed',
          description: `Successfully analyzed ${data.analysis.wines?.length || 0} wines from your list.`,
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing wine list:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze wine list',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingWineList(false);
    }
  };
  
  // Get detailed information about a wine
  const getWineDetails = async (wine: any) => {
    setSelectedWine(wine);
    setIsLoadingWineDetails(true);
    setWineDetails('');
    
    try {
      const response = await fetch('/api/wine-analyzer/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wine }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get wine details');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setWineDetails(data.info);
      } else {
        throw new Error(data.error || 'Failed to get wine details');
      }
    } catch (error) {
      console.error('Error getting wine details:', error);
      
      // If AI is not enabled, provide a message about it
      if (!wineAiStatus) {
        setWineDetails(
          "Detailed information requires AI analysis. AI will be enabled soon to provide in-depth explanations of wines."
        );
      } else {
        setWineDetails(
          "Sorry, we couldn't retrieve detailed wine information. Please try again later."
        );
      }
    } finally {
      setIsLoadingWineDetails(false);
    }
  };
  
  // Get wine recommendations based on customer preferences
  const getWineRecommendations = async () => {
    if (!wineAnalysis || !customerPreferences) return;
    
    setIsLoadingRecommendations(true);
    setWineRecommendations([]);
    
    try {
      const response = await fetch('/api/wine-analyzer/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: customerPreferences,
          wineList: wineAnalysis.wines || []
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get wine recommendations');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Add explanations to each wine recommendation
        const recommendationsWithExplanations = data.recommendations.map((wine: any, index: number) => {
          return {
            ...wine,
            explanation: data.explanations && data.explanations[index] ? data.explanations[index] : "This wine matches the guest's preferences."
          };
        });
        
        setWineRecommendations(recommendationsWithExplanations);
      } else {
        throw new Error(data.error || 'Failed to get recommendations');
      }
    } catch (error) {
      console.error('Error getting wine recommendations:', error);
      toast({
        title: 'Recommendation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate wine recommendations',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };
  
  // Handle recipe upload and analysis
  const handleRecipeUpload = async () => {
    if (!recipeFile) return;
    
    setIsUploading(true);
    setRecipeAnalysis(null);
    setSelectedItem(null);
    setItemDetails('');
    
    try {
      const formData = new FormData();
      formData.append('recipeFile', recipeFile);
      
      if (recipeNotes) {
        formData.append('notes', recipeNotes);
      }
      
      const response = await fetch('/api/recipe-analyzer/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload and analyze recipe');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRecipeAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing recipe:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze recipe',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Get detailed information about an ingredient or technique
  const getItemDetails = async (type: string, name: string) => {
    setSelectedItem({ type, name });
    setIsLoadingDetails(true);
    setItemDetails('');
    
    try {
      const response = await fetch(`/api/recipe-analyzer/details?type=${type}&name=${encodeURIComponent(name)}`);
      
      if (!response.ok) {
        throw new Error('Failed to get item details');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setItemDetails(data.info);
      } else {
        throw new Error(data.error || 'Failed to get details');
      }
    } catch (error) {
      console.error('Error getting item details:', error);
      
      // If AI is not enabled, provide a message about it
      if (!aiStatus) {
        setItemDetails(
          "Detailed information requires AI analysis. AI will be enabled soon to provide in-depth explanations of ingredients and techniques."
        );
      } else {
        setItemDetails(
          "Sorry, we couldn't retrieve detailed information. Please try again later."
        );
      }
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Function to toggle the expanded state of a meetup
  const toggleMeetupExpand = (meetupId: number) => {
    setExpandedMeetups(prev => 
      prev.includes(meetupId) 
        ? prev.filter(id => id !== meetupId) 
        : [...prev, meetupId]
    );
  };
  
  // Fetch restaurants
  useEffect(() => {
    async function fetchRestaurants() {
      try {
        setRestaurantsLoading(true);
        const response = await fetch('/api/restaurants/managed-by-me', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch restaurants');
        }
        
        const data = await response.json();
        setRestaurants(data);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your restaurants',
          variant: 'destructive'
        });
      } finally {
        setRestaurantsLoading(false);
      }
    }
    
    if (user && (user.role === "restaurant_admin" || user.role === "super_admin")) {
      fetchRestaurants();
    }
  }, [user, toast]);

  // Fetch today's meetups and participant data with social preferences 
  useEffect(() => {
    async function fetchTodaysMeetups() {
      if (!restaurants || restaurants.length === 0) return;
      
      try {
        setMeetupsLoading(true);
        
        // First, fetch today's meetups for all restaurants managed by this admin
        const restaurantIds = restaurants.map(r => r.id);
        const response = await fetch(`/api/restaurants/meetups/today?restaurantIds=${restaurantIds.join(',')}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch today\'s meetups');
        }
        
        const meetupsData = await response.json();
        
        // For each meetup, fetch its participants and their social preferences
        const meetupsWithParticipants: MeetupWithParticipants[] = await Promise.all(
          meetupsData.map(async (meetup: Meetup) => {
            // Find the restaurant for this meetup
            const restaurant = restaurants.find(r => r.id === meetup.restaurantId)!;
            
            // Fetch participants
            const participantsResponse = await fetch(`/api/meetups/${meetup.id}/participants/with-preferences`, {
              credentials: 'include'
            });
            
            if (!participantsResponse.ok) {
              throw new Error(`Failed to fetch participants for meetup ${meetup.id}`);
            }
            
            const participants = await participantsResponse.json();
            
            return {
              ...meetup,
              restaurant,
              participants
            };
          })
        );
        
        setTodaysMeetups(meetupsWithParticipants);
      } catch (error) {
        console.error('Error fetching meetups data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load today\'s meetups',
          variant: 'destructive'
        });
      } finally {
        setMeetupsLoading(false);
      }
    }
    
    if (restaurants && restaurants.length > 0) {
      fetchTodaysMeetups();
    }
  }, [restaurants, toast]);

  // Logout handler
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      window.location.href = "/auth";
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem logging out.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render the social outgoingness level
  const renderSocialOutgoingness = (participant: ParticipantWithPreferences) => {
    // Extract the social outgoingness score from preferences
    // Access the socialPreferences object safely with a fallback value
    const socialPrefs = participant.preferences?.socialPreferences as Record<string, any> || {};
    const score = socialPrefs.outgoingness || participant.outgoingScore || 3;
    const outgoingLevel = typeof score === 'number' ? score : 3;
    
    let levelText = "Moderate";
    let color = "bg-blue-500";
    
    if (outgoingLevel <= 1) {
      levelText = "Very Reserved";
      color = "bg-purple-500";
    } else if (outgoingLevel === 2) {
      levelText = "Reserved";
      color = "bg-indigo-500";
    } else if (outgoingLevel === 3) {
      levelText = "Moderate";
      color = "bg-blue-500";
    } else if (outgoingLevel === 4) {
      levelText = "Outgoing";
      color = "bg-emerald-500";
    } else if (outgoingLevel >= 5) {
      levelText = "Very Outgoing";
      color = "bg-green-500";
    }
    
    return (
      <div className="mt-2">
        <p className="text-sm font-medium mb-1">Social Outgoingness: {levelText}</p>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color}`} 
            style={{ width: `${outgoingLevel * 20}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Render the punctuality level
  const renderPunctuality = (participant: ParticipantWithPreferences) => {
    // Extract the punctuality score from preferences or the punctualityScore field
    const socialPrefs = participant.preferences?.socialPreferences as Record<string, any> || {};
    const score = socialPrefs.punctuality || participant.punctualityScore || 3;
    const punctualityLevel = typeof score === 'number' ? score : 3;
    
    let levelText = "Sometimes On Time";
    let color = "bg-blue-500";
    
    if (punctualityLevel <= 1) {
      levelText = "Always Late";
      color = "bg-red-500";
    } else if (punctualityLevel === 2) {
      levelText = "Often Late";
      color = "bg-orange-500";
    } else if (punctualityLevel === 3) {
      levelText = "Sometimes On Time";
      color = "bg-yellow-500";
    } else if (punctualityLevel === 4) {
      levelText = "Usually On Time";
      color = "bg-emerald-500";
    } else if (punctualityLevel >= 5) {
      levelText = "Always On Time";
      color = "bg-green-500";
    }
    
    return (
      <div className="mt-3">
        <p className="text-sm font-medium mb-1">Punctuality: {levelText}</p>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color}`} 
            style={{ width: `${punctualityLevel * 20}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Restaurant Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm py-1 px-3">
            {user.fullName}
          </Badge>
          {user.role === "super_admin" && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => window.location.href = "/super-admin-dashboard"}
            >
              Return to Super Admin
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        {/* First row of tabs */}
        <TabsList className="w-full md:w-auto mb-2">
          <TabsTrigger value="restaurants">Your Restaurants</TabsTrigger>
          <TabsTrigger value="today">Today's Meetups</TabsTrigger>
        </TabsList>
        
        {/* Second row of tabs */}
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="recipes">Recipe Analysis</TabsTrigger>
          <TabsTrigger value="wines">Wine Pairing</TabsTrigger>
          <TabsTrigger value="users" onClick={() => window.location.href = '/manage-restaurant-users'}>
            Manage Users
          </TabsTrigger>
        </TabsList>
        
        {/* Restaurants Tab */}
        <TabsContent value="restaurants">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-4">Your Restaurants</h2>
            <p className="text-muted-foreground mb-6">
              Manage the restaurants you administer and view their upcoming meetups.
            </p>
          </div>
          
          {restaurantsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : restaurants && restaurants.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant: Restaurant) => (
                <Card key={restaurant.id} className="overflow-hidden">
                  {restaurant.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={restaurant.imageUrl} 
                        alt={restaurant.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{restaurant.name}</CardTitle>
                    <CardDescription>
                      {restaurant.cuisineType} Cuisine
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2">{restaurant.description}</p>
                    <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                    
                    <div className="flex items-center mt-4 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="mr-2">
                        {restaurant.priceRange || '$$$'}
                      </Badge>
                      {restaurant.rating && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                          <span>{restaurant.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <Button size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No restaurants found. Please contact an administrator to assign restaurants to your account.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Today's Meetups Tab - Shows social outgoingness */}
        <TabsContent value="today">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-4">Today's Meetups</h2>
            <p className="text-muted-foreground mb-6">
              View all meetups happening today at your restaurants and get insights about attendees' social preferences.
            </p>
          </div>
          
          {meetupsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : todaysMeetups && todaysMeetups.length > 0 ? (
            <div className="space-y-6">
              {todaysMeetups.map((meetup) => (
                <Card key={meetup.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{meetup.title}</CardTitle>
                        <CardDescription>
                          at {meetup.restaurant.name}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={meetup.status === 'confirmed' ? 'default' : 
                                meetup.status === 'pending' ? 'secondary' : 
                                'destructive'}
                        className="ml-2"
                      >
                        {meetup.status.charAt(0).toUpperCase() + meetup.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(meetup.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {meetup.startTime} - {meetup.endTime}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {meetup.participants.length} of {meetup.maxParticipants} participants
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center justify-between w-full"
                        onClick={() => toggleMeetupExpand(meetup.id)}
                      >
                        <span>
                          View Social Preferences of Participants
                        </span>
                        {expandedMeetups.includes(meetup.id) ? 
                          <ChevronUp className="h-4 w-4 ml-2" /> : 
                          <ChevronDown className="h-4 w-4 ml-2" />
                        }
                      </Button>
                      
                      {expandedMeetups.includes(meetup.id) && (
                        <div className="mt-4 space-y-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Social preferences will help your staff prepare for the group dynamic:
                          </p>
                          
                          {meetup.participants.length > 0 ? (
                            <div className="space-y-4">
                              {meetup.participants.map((participant) => (
                                <Card key={participant.user.id} className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-medium">{participant.user.fullName}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {participant.user.age ? `${participant.user.age} years` : ''} 
                                        {participant.user.occupation ? ` • ${participant.user.occupation}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {renderSocialOutgoingness(participant)}
                                  {renderPunctuality(participant)}
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No participants have joined this meetup yet.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No meetups scheduled for today at your restaurants.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        {/* Recipe Analysis Tab */}
        <TabsContent value="recipes">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-4">Recipe Analysis Tool</h2>
            <p className="text-muted-foreground mb-6">
              Upload recipes to analyze ingredients and techniques. Get detailed explanations to help train your kitchen staff.
            </p>
          </div>
          
          {/* AI Status Check */}
          {isCheckingAi ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column: Upload & Analysis */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ChefHat className="mr-2 h-5 w-5" />
                      Recipe Upload
                    </CardTitle>
                    <CardDescription>
                      Upload a recipe file to analyze its ingredients and techniques
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* AI Status Alert */}
                    {aiStatus === false && (
                      <Alert className="mb-4 bg-amber-50">
                        <Info className="h-4 w-4" />
                        <AlertTitle>AI Analysis Not Yet Available</AlertTitle>
                        <AlertDescription>
                          Advanced AI analysis will be available soon. Basic analysis is still available.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* File Upload Form */}
                    <form 
                      className="space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRecipeUpload();
                      }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="recipeFile">Recipe File (PDF, TXT, DOC)</Label>
                        <div 
                          className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input 
                            ref={fileInputRef}
                            type="file"
                            id="recipeFile"
                            className="hidden"
                            accept=".pdf,.txt,.doc,.docx"
                            onChange={handleFileChange}
                          />
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-10 w-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {recipeFile ? recipeFile.name : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Supported formats: PDF, TXT, DOC, DOCX (Max 10MB)
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add any notes or context for the recipe..."
                          value={recipeNotes}
                          onChange={(e) => setRecipeNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={!recipeFile || isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing Recipe...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-4 w-4" />
                            Analyze Recipe
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                {/* Analysis Results */}
                {recipeAnalysis && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BookOpen className="mr-2 h-5 w-5" />
                        Analysis Results
                      </CardTitle>
                      <CardDescription>
                        Click on any ingredient or technique to get detailed information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Ingredients */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
                        <div className="flex flex-wrap gap-2">
                          {recipeAnalysis.ingredients && recipeAnalysis.ingredients.length > 0 ? (
                            recipeAnalysis.ingredients.map((item: any, index: number) => (
                              <Badge 
                                key={index} 
                                variant="outline"
                                className="cursor-pointer px-3 py-1 text-sm hover:bg-primary/10"
                                onClick={() => getItemDetails('ingredient', item.name)}
                              >
                                {item.name}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-muted-foreground">No ingredients identified</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Techniques */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Techniques</h3>
                        <div className="flex flex-wrap gap-2">
                          {recipeAnalysis.techniques && recipeAnalysis.techniques.length > 0 ? (
                            recipeAnalysis.techniques.map((item: any, index: number) => (
                              <Badge 
                                key={index} 
                                variant="secondary"
                                className="cursor-pointer px-3 py-1 text-sm hover:bg-secondary/80"
                                onClick={() => getItemDetails('technique', item.name)}
                              >
                                {item.name}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-muted-foreground">No techniques identified</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Right Column: Recipe Text & Details */}
              <div className="space-y-6">
                {/* Recipe Text */}
                {recipeAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recipe Text</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 p-4 rounded-md text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                        {recipeAnalysis.fullText}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Item Details */}
                {selectedItem && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="capitalize">{selectedItem.type}: {selectedItem.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingDetails ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          {itemDetails}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {/* No Recipe Uploaded State */}
                {!recipeAnalysis && !selectedItem && (
                  <Card>
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Recipe Analyzed Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Upload a recipe file to see ingredients, techniques, and detailed explanations.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Wine Pairing Guide Tab */}
        <TabsContent value="wines">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-4">Wine Pairing Guide</h2>
            <p className="text-muted-foreground mb-6">
              Upload your wine list to analyze and get pairing recommendations based on customer preferences.
            </p>
          </div>
        </TabsContent>
        
        {/* Restaurant Users Tab */}
        <TabsContent value="users">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-4">Manage Restaurant Users</h2>
            <p className="text-muted-foreground mb-6">
              Create and manage users who can access your restaurant's data. These users will be able to view recipe analysis and wine pairings.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column: Create New User */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Create Restaurant User
                  </CardTitle>
                  <CardDescription>
                    Add a new user with access to your restaurant data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form 
                    className="space-y-4" 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateUser();
                    }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        placeholder="johndoe"
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        placeholder="John Doe"
                        value={newUser.fullName}
                        onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="john.doe@example.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password"
                        placeholder="••••••••••••"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Select Restaurants</Label>
                      <div className="border rounded-md p-4 space-y-2">
                        {restaurants?.map((restaurant) => (
                          <div key={restaurant.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`restaurant-${restaurant.id}`}
                              checked={newUser.restaurantIds.includes(restaurant.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewUser({
                                    ...newUser,
                                    restaurantIds: [...newUser.restaurantIds, restaurant.id]
                                  });
                                } else {
                                  setNewUser({
                                    ...newUser,
                                    restaurantIds: newUser.restaurantIds.filter(id => id !== restaurant.id)
                                  });
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <label 
                              htmlFor={`restaurant-${restaurant.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {restaurant.name}
                            </label>
                          </div>
                        ))}
                        
                        {restaurants?.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No restaurants found. Please add restaurants first.
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isCreatingUser || !newUser.username || !newUser.fullName || !newUser.email || !newUser.password || newUser.restaurantIds.length === 0}
                    >
                      {isCreatingUser ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating User...
                        </>
                      ) : "Create User"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column: Existing Users */}
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Existing Restaurant Users
                  </CardTitle>
                  <CardDescription>
                    Users with access to your restaurant data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : restaurantUsers && restaurantUsers.length > 0 ? (
                    <div className="space-y-4">
                      {restaurantUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-md">
                          <div>
                            <h4 className="font-medium">{user.fullName}</h4>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">Username: {user.username}</p>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRemoveUser(user.id)}
                            disabled={isRemovingUser}
                          >
                            {isRemovingUser === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : "Remove"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No restaurant users found. Create your first restaurant user.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
          
          {/* Wine AI Status Check */}
          {isCheckingWineAi ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column: Upload & Analysis */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Wine className="mr-2 h-5 w-5" />
                      Wine List Upload
                    </CardTitle>
                    <CardDescription>
                      Upload your restaurant's wine list for analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* AI Status Alert */}
                    {wineAiStatus === false && (
                      <Alert className="mb-4 bg-amber-50">
                        <Info className="h-4 w-4" />
                        <AlertTitle>AI Analysis Not Yet Available</AlertTitle>
                        <AlertDescription>
                          Advanced AI wine analysis will be available soon. Basic analysis is still available.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* File Upload Form */}
                    <form 
                      className="space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleWineListUpload();
                      }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="wineListFile">Wine List File (PDF, TXT, DOC)</Label>
                        <div 
                          className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => wineFileInputRef.current?.click()}
                        >
                          <input 
                            ref={wineFileInputRef}
                            type="file"
                            id="wineListFile"
                            className="hidden"
                            accept=".pdf,.txt,.doc,.docx"
                            onChange={handleWineFileChange}
                          />
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              {wineListFile ? wineListFile.name : 'Click to select a file'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF, TXT or DOC up to 10MB
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="wineNotes">Additional Notes (Optional)</Label>
                        <Textarea 
                          id="wineNotes"
                          value={wineNotes}
                          onChange={(e) => setWineNotes(e.target.value)}
                          placeholder="Add any additional context about your wine list..."
                          className="min-h-[100px]"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={!wineListFile || isUploadingWineList}
                      >
                        {isUploadingWineList ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-4 w-4" />
                            Analyze Wine List
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                {/* Wine List Analysis Results */}
                {wineAnalysis && wineAnalysis.wines && wineAnalysis.wines.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Wine className="mr-2 h-5 w-5" />
                        Wine List Analysis
                      </CardTitle>
                      <CardDescription>
                        {wineAnalysis.wines.length} wines analyzed from your list
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[400px] overflow-y-auto">
                      <div className="space-y-3">
                        {wineAnalysis.wines.map((wine: any, idx: number) => (
                          <Button
                            key={`wine-${idx}`}
                            variant="outline"
                            className="justify-start text-left font-normal h-auto py-3 px-3 w-full"
                            onClick={() => getWineDetails(wine)}
                          >
                            <div className="flex flex-col items-start">
                              <div className="font-medium">{wine.name} {wine.year || ''}</div>
                              <div className="text-sm text-muted-foreground">
                                {wine.type} • {wine.region || wine.country || 'Unknown origin'}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Right Column: Wine Recommendations */}
              <div>
                {selectedWine ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {selectedWine.name} {selectedWine.year && `(${selectedWine.year})`}
                        <Badge className="ml-2 capitalize">
                          {selectedWine.type}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {selectedWine.region} {selectedWine.country && `, ${selectedWine.country}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingWineDetails ? (
                        <div className="flex justify-center p-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {wineDetails ? (
                            <div className="prose prose-sm max-w-none">
                              <p>{wineDetails}</p>
                            </div>
                          ) : (
                            <>
                              {selectedWine.tasting_notes && selectedWine.tasting_notes.length > 0 && (
                                <div>
                                  <h3 className="text-lg font-medium mb-2">Tasting Notes</h3>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {selectedWine.tasting_notes.map((note: string, idx: number) => (
                                      <li key={idx}>{note}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {selectedWine.pairing_suggestions && selectedWine.pairing_suggestions.length > 0 && (
                                <div>
                                  <h3 className="text-lg font-medium mb-2">Pairing Suggestions</h3>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {selectedWine.pairing_suggestions.map((pairing: string, idx: number) => (
                                      <li key={idx}>{pairing}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {selectedWine.description && (
                                <div>
                                  <h3 className="text-lg font-medium mb-2">Description</h3>
                                  <p>{selectedWine.description}</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Wine Details</CardTitle>
                      <CardDescription>
                        Select a wine from your list to see detailed information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center p-6">
                        <GlassWater className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                        <p className="mt-4 text-muted-foreground">
                          Select a wine from your analyzed list to see detailed information and pairing suggestions.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Conversational Wine Recommendation Interface */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Wine className="mr-2 h-5 w-5" />
                      Wine Sommelier Assistant
                    </CardTitle>
                    <CardDescription>
                      Tell us what your guest is looking for and get personalized wine recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {wineAnalysis && wineAnalysis.wines && wineAnalysis.wines.length > 0 ? (
                      <div className="space-y-4">
                        {/* Chat-like interface container */}
                        <div className="border rounded-md p-4 bg-gray-50 mb-4 min-h-[200px]">
                          <div className="flex flex-col space-y-3">
                            {/* Default prompt */}
                            <div className="flex items-start">
                              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-2 flex-shrink-0">
                                <Wine className="h-4 w-4" />
                              </div>
                              <div className="bg-white p-3 rounded-lg shadow-sm max-w-[85%]">
                                <p className="text-sm">
                                  What is your guest looking for today? Describe their preferences, the meal they're having, or any specific requirements.
                                </p>
                              </div>
                            </div>
                            
                            {/* Customer request - only show if preferences are entered */}
                            {customerPreferences && (
                              <div className="flex items-start justify-end">
                                <div className="bg-primary p-3 rounded-lg shadow-sm text-primary-foreground max-w-[85%]">
                                  <p className="text-sm">{customerPreferences}</p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 flex-shrink-0">
                                  <Users className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                            
                            {/* Wine recommendations - only show if recommendations exist */}
                            {wineRecommendations.length > 0 && (
                              <div className="flex items-start">
                                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-2 flex-shrink-0">
                                  <Wine className="h-4 w-4" />
                                </div>
                                <div className="space-y-3 max-w-[85%]">
                                  <div className="bg-white p-3 rounded-lg shadow-sm">
                                    <p className="text-sm mb-2">I recommend these wines based on your guest's preferences:</p>
                                    
                                    {wineRecommendations.map((wine: any, idx: number) => {
                                      // Try to get the explanation from the API response
                                      const explanation = wine.explanation || "";
                                      
                                      return (
                                        <div key={idx} className="mb-3 pb-3 border-b last:border-b-0 last:mb-0 last:pb-0">
                                          <h4 className="font-medium flex items-center justify-between">
                                            {wine.name} {wine.year && `(${wine.year})`}
                                            {wine.price && <Badge variant="outline" className="ml-2">{wine.price}</Badge>}
                                          </h4>
                                          <p className="text-xs text-muted-foreground mb-1">
                                            {wine.type} • {wine.region || wine.country || 'Unknown origin'}
                                          </p>
                                          <p className="text-sm mt-1">
                                            {explanation}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Loading indicator */}
                            {isLoadingRecommendations && (
                              <div className="flex items-start">
                                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-2 flex-shrink-0">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                                <div className="bg-white p-3 rounded-lg shadow-sm">
                                  <p className="text-sm">Finding the perfect wines for your guest...</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Input area */}
                        <div className="space-y-2">
                          <div className="flex">
                            <Textarea 
                              id="customerPreferences"
                              value={customerPreferences}
                              onChange={(e) => setCustomerPreferences(e.target.value)}
                              placeholder="Describe what the guest is looking for (e.g., 'A full-bodied red wine to pair with steak' or 'Something refreshing under $50')"
                              className="min-h-[80px] rounded-r-none"
                            />
                            <Button 
                              className="rounded-l-none px-3"
                              onClick={getWineRecommendations}
                              disabled={!customerPreferences || isLoadingRecommendations}
                            >
                              {isLoadingRecommendations ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Search className="h-5 w-5" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {!wineAiStatus ? 
                              "Basic recommendations available. AI-powered recommendations will be available soon." : 
                              "AI-powered sommelier will provide personalized recommendations across different price points."
                            }
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-6">
                        <Wine className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                        <p className="mt-4 text-muted-foreground">
                          Please upload and analyze your wine list first to get recommendations.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
      </Tabs>
    </div>
  );
}