import React, { useState, useEffect } from "react";
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
  Sparkles
} from "lucide-react";
import { RestaurantWineEnrichmentDashboard } from "../components/restaurant/RestaurantWineEnrichmentDashboard";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContextProvider";
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

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { ScrollArea } from "../components/ui/scroll-area";
import { Switch } from "../components/ui/switch";
import { Checkbox } from "../components/ui/checkbox";

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

  useEffect(() => {
    fetchRestaurants();
    fetchTodaysMeetups();
    fetchUserActivities();
    fetchHostMetrics();
    fetchRestaurantHosts();
    fetchAnnouncements();
  }, []);

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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="hosts">Hosts</TabsTrigger>
          <TabsTrigger value="wine">Wine Management</TabsTrigger>
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
    </div>
  );
}