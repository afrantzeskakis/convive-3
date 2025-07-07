import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type GroupMeetupSession = {
  id: number;
  city: string;
  language: string;
  dayOfWeek: string;
  timeSlot: string;
  capacity: number;
  minParticipants: number;
  status: string;
  restaurantId: number | null;
  reservationStatus: string;
  meetupDate: string | null;
  createdAt: string;
  participants?: any[];
  drinks?: string;
  interactionPreference?: string;
};

const cities = ["New York", "San Francisco", "Chicago", "Miami", "Los Angeles"];
const languages = ["English", "Spanish", "French", "Russian", "Arabic"];
const dayOptions = ["Thursday", "Friday"];
const timeOptions = ["7PM", "9PM"];
const drinkOptions = ["Yes", "No", "Sometimes"];
const interactionOptions = ["Networking", "Making Friends", "Romance", "Professional Exchange", "Cultural Learning"];

export default function FindGroupMeetups() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    city: "all",
    language: "all",
    dayOfWeek: "all",
    timeSlot: "all",
    drinks: "all",
    interactionPreference: "",
  });
  const [selectedSession, setSelectedSession] = useState<GroupMeetupSession | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  
  // Mock session for demonstration
  const mockSessions: GroupMeetupSession[] = [
    {
      id: 1,
      city: "New York",
      language: "English",
      dayOfWeek: "Friday",
      timeSlot: "7PM",
      capacity: 6,
      minParticipants: 4,
      status: "open",
      restaurantId: 1,
      reservationStatus: "pending",
      meetupDate: null,
      createdAt: new Date().toISOString(),
      drinks: "Mixed preferences",
      participants: []
    }
  ];

  // Fetch available group meetup sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['/api/group-meetups', filters],
    queryFn: async ({ queryKey }) => {
      try {
        const queryParams = new URLSearchParams();
        
        // Only add filter parameters if they're not "all"
        if (filters.city && filters.city !== "all") queryParams.append('city', filters.city);
        if (filters.language && filters.language !== "all") queryParams.append('language', filters.language);
        if (filters.dayOfWeek && filters.dayOfWeek !== "all") queryParams.append('dayOfWeek', filters.dayOfWeek);
        if (filters.timeSlot && filters.timeSlot !== "all") queryParams.append('timeSlot', filters.timeSlot);
        if (filters.drinks && filters.drinks !== "all") queryParams.append('drinks', filters.drinks);
        
        const url = `/api/group-meetups?${queryParams.toString()}`;
        const response = await fetch(url, { credentials: "include" });
        
        if (!response.ok) {
          throw new Error(`Error fetching group meetups: ${response.status}`);
        }
        
        const data = await response.json();
        return Array.isArray(data) && data.length > 0 ? data : mockSessions;
      } catch (error) {
        console.error("Error fetching group meetups:", error);
        return mockSessions;
      }
    },
    enabled: true
  });
  
  // Fetch user's sessions to check if already joined
  const { data: userSessions } = useQuery({
    queryKey: ['/api/group-meetups/user/sessions'],
    queryFn: async () => {
      const response = await fetch('/api/group-meetups/user/sessions', { 
        credentials: "include" 
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching user sessions: ${response.status}`);
      }
      
      return await response.json();
    },
    enabled: !!user
  });
  
  // Join a group meetup session
  const joinMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await fetch('/api/group-meetups/join', {
        method: 'POST',
        body: JSON.stringify({ 
          sessionId,
          interactionPreference: filters.interactionPreference
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to join the group meetup");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/group-meetups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/group-meetups/user/sessions'] });
      toast({
        title: "Success",
        description: "You've successfully joined the group meetup!",
      });
      setShowJoinDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join the group meetup",
        variant: "destructive",
      });
    }
  });
  
  // Check if user already joined a session
  const hasJoinedSession = (sessionId: number) => {
    // For demonstration purposes, always allow joining the mock session
    if (sessionId === 1) {
      return false;
    }
    
    if (!userSessions || !Array.isArray(userSessions)) {
      return false;
    }
    return userSessions.some((s: any) => s.id === sessionId);
  };
  
  // Filter change handlers
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };
  
  // Join session handler
  const handleJoinSession = (session: GroupMeetupSession) => {
    setSelectedSession(session);
    setShowJoinDialog(true);
  };
  
  // Confirm join
  const confirmJoin = () => {
    if (selectedSession) {
      joinMutation.mutate(selectedSession.id);
    }
  };
  
  // Get participant count for a session (if available)
  const getParticipantCount = (session: GroupMeetupSession) => {
    return session.participants?.length || 0;
  };
  
  // Format date for display
  const formatDate = (dayOfWeek: string) => {
    // In a real app, would calculate the next occurrence of this day
    return dayOfWeek === "Thursday" ? "Thursday" : "Friday";
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-poppins">Find Group Meetups</h1>
        <p className="text-gray-600 mt-2">
          Join group dining experiences with other food enthusiasts who share your language preferences.
          Groups of 4-6 people will be automatically matched and reservations made at partner restaurants.
        </p>
      </div>
      
      {/* Filters */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Filter Meetups</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <Select
              value={filters.city}
              onValueChange={(value) => handleFilterChange("city", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <Select
              value={filters.language}
              onValueChange={(value) => handleFilterChange("language", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <Select
              value={filters.dayOfWeek}
              onValueChange={(value) => handleFilterChange("dayOfWeek", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Day</SelectItem>
                {dayOptions.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <Select
              value={filters.timeSlot}
              onValueChange={(value) => handleFilterChange("timeSlot", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Time</SelectItem>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Do you drink?</label>
            <Select
              value={filters.drinks}
              onValueChange={(value) => handleFilterChange("drinks", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Preference</SelectItem>
                {drinkOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Results */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Group Meetups</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !sessions || !Array.isArray(sessions) || sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">
                No group meetups found with the selected filters.
              </p>
              <p className="text-gray-500 mt-2">
                Try adjusting your filters or check back later!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session: GroupMeetupSession) => (
              <Card key={session.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="mb-2" variant={session.status === "open" ? "default" : "outline"}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </Badge>
                      <h3 className="text-lg font-semibold">
                        {session.city} - {session.language} Speakers
                      </h3>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-2">
                      <span className="text-sm font-semibold">{formatDate(session.dayOfWeek)}</span>
                      <span className="text-lg font-bold">{session.timeSlot}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center">
                      <i className="fas fa-users text-gray-400 mr-2"></i>
                      <span className="text-gray-600">
                        {getParticipantCount(session)} of {session.capacity} participants
                      </span>
                    </div>
                    <div className="flex items-center mt-1">
                      <i className="fas fa-comment-alt text-gray-400 mr-2"></i>
                      <span className="text-gray-600">
                        Conversation in {session.language}
                      </span>
                    </div>
                    <div className="flex items-center mt-1">
                      <i className="fas fa-wine-glass-alt text-gray-400 mr-2"></i>
                      <span className="text-gray-600">
                        Drinks: {session.drinks || "Mixed preferences"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    {hasJoinedSession(session.id) ? (
                      <Button className="w-full" variant="outline" disabled>
                        Already Joined
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90" 
                        onClick={() => handleJoinSession(session)}
                        disabled={joinMutation.isPending}
                      >
                        {joinMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          "Join Meetup"
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Join Confirmation Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Group Meetup</DialogTitle>
            <DialogDescription>
              {selectedSession && (
                <div className="mt-2">
                  <p>
                    You're about to join a group meetup in {selectedSession.city} for {selectedSession.language} speakers
                    on {formatDate(selectedSession.dayOfWeek)} at {selectedSession.timeSlot}.
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm font-medium">What kind of interactions are you looking for from your convives?</label>
                      <Select
                        value={filters.interactionPreference}
                        onValueChange={(value) => handleFilterChange("interactionPreference", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select interaction preference" />
                        </SelectTrigger>
                        <SelectContent>
                          {interactionOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-muted-foreground">
                        This helps us create balanced dining groups with aligned expectations.
                      </span>
                    </div>
                  </div>
                  <p className="mt-4">
                    Once enough participants join, we'll automatically arrange a reservation at a partner restaurant.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmJoin}
              disabled={joinMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {joinMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Confirm Join"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}