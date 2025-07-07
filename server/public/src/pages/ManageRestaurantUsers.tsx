import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContextProvider";
import { Users, Loader2 } from "lucide-react";
import { Restaurant, User } from "@shared/schema";

export default function ManageRestaurantUsers() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Restaurant User Management State
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
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);

  // Load restaurants managed by this admin
  useEffect(() => {
    async function fetchRestaurants() {
      try {
        setIsLoadingRestaurants(true);
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
          description: 'Failed to fetch managed restaurants',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingRestaurants(false);
      }
    }
    
    fetchRestaurants();
  }, [toast]);

  // Handle restaurant user creation
  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.fullName || !newUser.email || newUser.restaurantIds.length === 0) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields and select at least one restaurant.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingUser(true);
    
    try {
      const response = await fetch("/api/restaurant-admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newUser),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }
      
      const userData = await response.json();
      
      toast({
        title: "User Created",
        description: `Successfully created user ${userData.fullName} with restaurant access.`,
      });
      
      // Reset form and fetch updated user list
      setNewUser({
        username: "",
        fullName: "",
        email: "",
        password: "",
        restaurantIds: [],
      });
      
      // Fetch updated user list
      fetchRestaurantUsers();
      
    } catch (error) {
      console.error("Error creating restaurant user:", error);
      toast({
        title: "Error Creating User",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };
  
  // Handle removing restaurant user
  const handleRemoveUser = async (userId: number) => {
    if (!userId) return;
    
    setIsRemovingUser(userId);
    
    try {
      const response = await fetch(`/api/restaurant-users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove user");
      }
      
      toast({
        title: "User Removed",
        description: "Successfully removed user from restaurant access.",
      });
      
      // Fetch updated user list
      fetchRestaurantUsers();
      
    } catch (error) {
      console.error("Error removing restaurant user:", error);
      toast({
        title: "Error Removing User",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRemovingUser(null);
    }
  };
  
  // Fetch restaurant users
  const fetchRestaurantUsers = async () => {
    setIsLoadingUsers(true);
    
    try {
      const response = await fetch("/api/restaurant-users", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch restaurant users");
      }
      
      const data = await response.json();
      setRestaurantUsers(data);
    } catch (error) {
      console.error("Error fetching restaurant users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch restaurant users",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  // Load restaurant users on component mount
  useEffect(() => {
    fetchRestaurantUsers();
  }, []);

  // If restaurants are still loading, show a loading state
  if (isLoadingRestaurants) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Manage Restaurant Users</h1>
        <p className="text-muted-foreground">
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
                        disabled={isRemovingUser === user.id}
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
    </div>
  );
}