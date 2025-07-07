import React, { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  Users as UsersIcon, 
  Calendar, 
  FileText, 
  Wine, 
  Star, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Group, 
  Utensils, 
  User as UserIcon, 
  Loader2,
  Edit,
  Trash2,
  Activity,
  BarChart3,
  MessageSquare,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Coffee,
  DollarSign,
  Bell,
  Award,
  Send,
  PlusCircle,
  Info,
  Search,
  Database,
  X,
  RefreshCcw,
  Upload,
  Sparkles,
  ChefHat,
  Package,
  AlertCircle
} from "lucide-react";
import { RestaurantWineEnrichmentDashboard } from "@/components/restaurant/RestaurantWineEnrichmentDashboard";
import { EnhancedRecipeDisplay } from "@/components/EnhancedRecipeDisplay";
import { RecipeListView } from "@/components/RecipeListView";
import { SmartRecipeDisplay } from "@/components/SmartRecipeDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContextProvider";
import { 
  Restaurant, 
  Meetup, 
  User, 
  UserPreferences, 
  UserActivityLog, 
  HostPerformanceMetric, 
  RestaurantAnnouncement, 
  AnnouncementRecipient 
} from "@shared/schema";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface ParticipantWithPreferences {
  user: User;
  preferences?: UserPreferences;
  outgoingScore?: number;
  punctualityScore?: number;
}

interface MeetupWithParticipants extends Meetup {
  restaurant: Restaurant;
  participants: ParticipantWithPreferences[];
}

export default function RestaurantAdmin() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  
  // Original dashboard state
  const [meetups, setMeetups] = useState<MeetupWithParticipants[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivityLog[]>([]);
  const [hostMetrics, setHostMetrics] = useState<HostPerformanceMetric[]>([]);
  const [restaurantHosts, setRestaurantHosts] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<RestaurantAnnouncement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Recipe analysis states
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [recipeText, setRecipeText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Debug effect to monitor uploaded files
  useEffect(() => {
    console.log('uploadedFiles changed:', uploadedFiles.length, uploadedFiles);
  }, [uploadedFiles]);
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [recipeAnalyses, setRecipeAnalyses] = useState<any[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [culinaryTerms, setCulinaryTerms] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch recent recipe analyses
  const fetchRecipeAnalyses = async () => {
    if (!selectedRestaurantId) {
      setRecipeAnalyses([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/recipe-analyses?restaurantId=${selectedRestaurantId}`);
      if (response.ok) {
        const analyses = await response.json();
        setRecipeAnalyses(analyses);
      }
    } catch (error) {
      console.error('Error fetching recipe analyses:', error);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchTodaysMeetups();
    fetchUserActivities();
    fetchHostMetrics();
    fetchRestaurantHosts();
    fetchAnnouncements();
  }, []);

  // Refetch recipe analyses when restaurant changes
  useEffect(() => {
    fetchRecipeAnalyses();
  }, [selectedRestaurantId]);

  async function fetchRestaurants() {
    try {
      const response = await fetch("/api/restaurants");
      if (response.ok) {
        const data = await response.json();
        setRestaurants(data);
        if (data.length > 0) {
          setSelectedRestaurant(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodaysMeetups() {
    try {
      const response = await fetch("/api/meetups");
      if (response.ok) {
        const meetupsData = await response.json();
        setMeetups(meetupsData);
      }
    } catch (error) {
      console.error("Error fetching meetups:", error);
    }
  }

  async function fetchUserActivities() {
    try {
      const response = await fetch("/api/admin/users/analytics");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching user activities:", error);
    }
  }

  async function fetchHostMetrics() {
    // Implementation for host metrics
  }

  async function fetchRestaurantHosts() {
    // Implementation for restaurant hosts
  }

  async function fetchAnnouncements() {
    // Implementation for announcements
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 w-full bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Restaurant Administration</h1>
        <p className="text-muted-foreground">
          Manage restaurants, track meetups, view analytics, and oversee operations.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Mobile dropdown */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {activeTab === 'overview' && 'Overview'}
                {activeTab === 'analytics' && 'Analytics'}
                {activeTab === 'reservations' && 'Reservations'}
                {activeTab === 'users' && 'Users'}
                {activeTab === 'hosts' && 'Hosts'}
                {activeTab === 'wine' && 'Wine Management'}
                {activeTab === 'recipes' && 'Recipe Analysis'}
                {activeTab === 'settings' && 'Settings'}
                <ChevronRight className="h-4 w-4 rotate-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)]">
              <DropdownMenuItem onClick={() => setActiveTab('overview')}>
                <Building2 className="mr-2 h-4 w-4" />
                Overview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('analytics')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('reservations')}>
                <Calendar className="mr-2 h-4 w-4" />
                Reservations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('users')}>
                <UsersIcon className="mr-2 h-4 w-4" />
                Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('hosts')}>
                <UserIcon className="mr-2 h-4 w-4" />
                Hosts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('wine')}>
                <Wine className="mr-2 h-4 w-4" />
                Wine Management
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('recipes')}>
                <ChefHat className="mr-2 h-4 w-4" />
                Recipe Analysis
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                <Database className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="hosts">Hosts</TabsTrigger>
          <TabsTrigger value="wine">Wine Management</TabsTrigger>
          <TabsTrigger value="recipes">Recipe Analysis</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{restaurants.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Meetups</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{meetups.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wine Collections</CardTitle>
                <Wine className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{restaurants.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.username} joined</p>
                        <p className="text-xs text-muted-foreground">Recently</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Restaurant Selection</CardTitle>
                <CardDescription>
                  Select a restaurant to manage its wine inventory and operations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select value={selectedRestaurant?.id.toString() || ""} onValueChange={(value) => {
                    const restaurant = restaurants.find(r => r.id === parseInt(value));
                    setSelectedRestaurant(restaurant || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                          {restaurant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedRestaurant && (
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium">{selectedRestaurant.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedRestaurant.cuisineType}</p>
                      <p className="text-sm text-muted-foreground">{selectedRestaurant.address}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>Overview of user engagement and activity.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={user.role === 'premium' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reservation Management</CardTitle>
              <CardDescription>Manage bookings and reservations across all restaurants.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {meetups.map((meetup) => (
                  <div key={meetup.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{meetup.title}</p>
                      <p className="text-sm text-muted-foreground">{meetup.date} at {meetup.time}</p>
                    </div>
                    <Badge>{meetup.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge>{user.role}</Badge>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hosts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Host Management</CardTitle>
              <CardDescription>Manage restaurant hosts and their performance.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Host management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wine" className="space-y-6">
          <RestaurantWineEnrichmentDashboard selectedRestaurant={selectedRestaurant || undefined} />
        </TabsContent>

        <TabsContent value="recipes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ChefHat className="mr-2 h-5 w-5" />
                Recipe Analysis Tool
              </CardTitle>
              <CardDescription>
                Analyze recipes using AI to extract ingredients, techniques, allergens, and dietary information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Restaurant Selection Alert */}
              {!selectedRestaurantId && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Restaurant Selection Required</AlertTitle>
                  <AlertDescription>
                    Please select a restaurant to view and upload recipes. Each restaurant can only see and manage their own recipes.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Recipe Input Section */}
                <div className="space-y-4">
                  {/* Restaurant Selection */}
                  <div>
                    <Label htmlFor="restaurant-select">Select Restaurant <span className="text-red-500">*</span></Label>
                    <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
                      <SelectTrigger className={!selectedRestaurantId ? 'ring-2 ring-red-500' : ''}>
                        <SelectValue placeholder="Select a restaurant to continue..." />
                      </SelectTrigger>
                      <SelectContent>
                        {restaurants.map((restaurant) => (
                          <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                            {restaurant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recipes are restaurant-specific and isolated from other establishments
                    </p>
                  </div>

                  {/* Upload Methods */}
                  <div className="space-y-3">
                    <Label>Recipe Input Method</Label>
                    <div className="flex gap-2">
                      <Button 
                        variant={inputMethod === 'file' ? 'default' : 'outline'} 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setInputMethod('file')}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload .txt File
                      </Button>
                      <Button 
                        variant={inputMethod === 'text' ? 'default' : 'outline'} 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setInputMethod('text')}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Paste Text
                      </Button>
                    </div>
                  </div>

                  {/* File Upload Area - Show only when file method selected */}
                  {inputMethod === 'file' && (
                    <div 
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                    >
                      <Upload className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        {uploadedFiles.length > 0 
                          ? `${uploadedFiles.length} file(s) selected`
                          : 'Drop .txt files here or click to browse'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports .txt files up to 10MB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt"
                        multiple
                        className="hidden"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const files = e.target.files;
                          if (files) {
                            const fileArray = Array.from(files);
                            console.log('Files selected:', fileArray.length, fileArray);
                            setUploadedFiles(fileArray);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Text Input Alternative - Show only when text method selected */}
                  {inputMethod === 'text' && (
                    <div>
                      <Label htmlFor="recipe-input">Recipe Text</Label>
                      <Textarea
                        id="recipe-input"
                        placeholder="Paste your recipe here... Include ingredients, instructions, and any special notes."
                        rows={8}
                        className="resize-none"
                        value={recipeText}
                        onChange={(e) => setRecipeText((e.target as HTMLTextAreaElement).value)}
                      />
                    </div>
                  )}
                  
                  <Button 
                    className="w-full" 
                    onClick={async () => {
                      if (!selectedRestaurantId) {
                        toast({
                          title: "Restaurant Required",
                          description: "Please select a restaurant first.",
                          variant: "destructive",
                        });
                        return;
                      }

                      setIsAnalyzing(true);
                      
                      try {
                        console.log('Starting recipe analysis...', { inputMethod, filesCount: uploadedFiles.length, textLength: recipeText.length });
                        
                        if (inputMethod === 'file' && uploadedFiles.length > 0) {
                          // Handle file uploads
                          for (const file of uploadedFiles) {
                            console.log('Uploading file:', file.name);
                            const formData = new FormData();
                            formData.append('recipeFile', file);
                            formData.append('restaurantId', selectedRestaurantId);
                            
                            console.log('Making request to /api/recipe-analyzer/upload');
                            const response = await fetch('/api/recipe-analyzer/upload', {
                              method: 'POST',
                              body: formData,
                            });
                            
                            console.log('Response status:', response.status);
                            
                            if (!response.ok) {
                              const errorText = await response.text();
                              console.error('Upload failed:', errorText);
                              throw new Error(`Failed to analyze ${file.name}: ${response.status}`);
                            }
                            
                            const result = await response.json();
                            console.log('Analysis result:', result);
                            
                            // Check if analysis was successful
                            if (result.success) {
                              console.log('Recipes processed successfully');
                              setCulinaryTerms(result.culinaryTerms || []);
                            }
                          }
                          
                          toast({
                            title: "Success",
                            description: `Successfully analyzed ${uploadedFiles.length} recipe file(s).`,
                          });
                          
                          setUploadedFiles([]);
                          await fetchRecipeAnalyses(); // Refresh the analyses list
                        } else if (inputMethod === 'text' && recipeText.trim()) {
                          // Handle text input using AI analysis endpoint
                          const response = await fetch('/api/ai/recipe-analysis', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              recipeText: recipeText.trim(),
                              restaurantId: parseInt(selectedRestaurantId),
                            }),
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to analyze recipe');
                          }
                          
                          const result = await response.json();
                          console.log('Analysis result:', result);
                          
                          // Check if analysis was successful
                          if (result.success) {
                            console.log('Recipes processed successfully');
                            setCulinaryTerms(result.culinaryTerms || []);
                          }
                          
                          toast({
                            title: "Success",
                            description: `${result.recipes?.length || 0} recipes processed successfully.`,
                          });
                          
                          setRecipeText('');
                          await fetchRecipeAnalyses(); // Refresh the analyses list
                        }
                      } catch (error) {
                        toast({
                          title: "Analysis Failed",
                          description: error instanceof Error ? error.message : "An error occurred during analysis.",
                          variant: "destructive",
                        });
                      } finally {
                        setIsAnalyzing(false);
                      }
                    }}
                    disabled={!selectedRestaurantId || (inputMethod === 'text' ? !recipeText.trim() : uploadedFiles.length === 0) || isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Recipe{uploadedFiles.length > 1 ? 's' : ''}...
                      </>
                    ) : (
                      <>
                        <ChefHat className="mr-2 h-4 w-4" />
                        Analyze Recipe{uploadedFiles.length > 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>

                {/* Analysis Results Section with Carousel */}
                <div className="space-y-4" data-analysis-results>
                  {console.log('currentAnalysis state:', currentAnalysis)}
                  {currentAnalysis ? (
                    <>
                      {/* AI Status Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Analysis Results</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={currentAnalysis.aiEnabled ? "default" : "secondary"}>
                            {currentAnalysis.aiEnabled ? "AI Analysis" : "Fallback Analysis"}
                            {currentAnalysis.confidence && ` (${Math.round(currentAnalysis.confidence * 100)}%)`}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setCurrentAnalysis(null);
                              setCulinaryTerms([]);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Enhanced Recipe Display with Carousel */}
                      <SmartRecipeDisplay 
                        recipe={{
                          id: currentAnalysis.recipeId || 0,
                          name: currentAnalysis.filename || 'Recipe',
                          extractedText: currentAnalysis.extractedText || '',
                          restaurantId: currentAnalysis.restaurantId || 0,
                          status: 'active',
                          culinaryTerms: culinaryTerms
                        }}
                        culinaryTerms={culinaryTerms}
                      />
                    </>
                  ) : (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h4 className="font-medium mb-2">Analysis Results</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Submit a recipe to see detailed analysis including:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Interactive culinary term carousel education</li>
                        <li>• Ingredient breakdown with allergen detection</li>
                        <li>• Cooking techniques and methods</li>
                        <li>• Dietary restriction violations</li>
                        <li>• AI confidence scoring</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Analyses */}
              <div className="mt-8">
                <h4 className="font-medium mb-4">
                  {selectedRestaurantId ? `Recent Recipe Analyses - ${restaurants.find(r => r.id.toString() === selectedRestaurantId)?.name}` : 'Recent Recipe Analyses'}
                </h4>
                {!selectedRestaurantId ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Select a restaurant to view its recipes. Each restaurant has its own isolated recipe collection.
                    </AlertDescription>
                  </Alert>
                ) : recipeAnalyses.length > 0 ? (
                  <div className="space-y-4">
                    {recipeAnalyses.slice(0, 5).map((analysis, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium">{analysis.filename || 'Recipe Analysis'}</h5>
                          <span className="text-xs text-muted-foreground">
                            {new Date(analysis.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {analysis.analysis ? (
                          <div className="space-y-2 text-sm">
                            {analysis.analysis.ingredients && (
                              <div>
                                <span className="font-medium">Ingredients:</span> {analysis.analysis.ingredients.length} items
                                {analysis.analysis.allergenSummary && Object.keys(analysis.analysis.allergenSummary).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {Object.keys(analysis.analysis.allergenSummary).map((allergen: string) => (
                                      <Badge key={allergen} variant="destructive" className="text-xs">
                                        {allergen}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {analysis.analysis.techniques && analysis.analysis.techniques.length > 0 && (
                              <div>
                                <span className="font-medium">Techniques:</span> {
                                  analysis.analysis.techniques.map((t: any) => 
                                    typeof t === 'string' ? t : t.name
                                  ).join(', ')
                                }
                              </div>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="mt-2"
                              onClick={() => {
                                setCurrentAnalysis(analysis.analysis);
                                setCulinaryTerms(analysis.analysis.culinaryTerms || []);
                                setAnalysisDialogOpen(true);
                              }}
                            >
                              View Full Analysis
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Analysis data unavailable</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No recipe analyses available yet.</p>
                    <p className="text-sm">Upload and analyze recipes to see them here.</p> 
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings and preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings panel coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recipe Analysis Dialog */}
      <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentAnalysis?.filename || 'Recipe Analysis'}
            </DialogTitle>
            <DialogDescription>
              Interactive recipe with culinary term education - select highlighted terms to learn more
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 space-y-4">
            {currentAnalysis && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={currentAnalysis.aiEnabled ? "default" : "secondary"}>
                    {currentAnalysis.aiEnabled ? "AI Analysis" : "Fallback Analysis"}
                    {currentAnalysis.confidence && ` (${Math.round(currentAnalysis.confidence * 100)}%)`}
                  </Badge>
                </div>
                
                {currentAnalysis.extractedText ? (
                  <SmartRecipeDisplay 
                    recipeText={currentAnalysis.extractedText}
                    culinaryTerms={culinaryTerms}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recipe text available for this analysis.
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}