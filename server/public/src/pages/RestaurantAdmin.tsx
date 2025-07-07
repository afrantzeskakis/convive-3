import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Search, Plus, UserPlus, Trash, UserMinus, Eye, Building, UserCog, Users, Info } from 'lucide-react';

interface Restaurant {
  id: number;
  name: string;
  description: string;
  cuisineType: string;
  address: string;
  isFeatured: boolean;
  imageUrl?: string;
  rating?: string;
  managerId?: number;
}

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string;
}

export default function RestaurantAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('restaurants');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [openAddRestaurantDialog, setOpenAddRestaurantDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({ username: '', fullName: '', email: '', password: '', role: 'restaurant_admin' });
  const [newRestaurantData, setNewRestaurantData] = useState({ name: '', description: '', cuisineType: '', address: '' });

  // Fetch all restaurants
  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['/api/restaurants'],
    queryFn: async () => {
      const response = await fetch('/api/restaurants');
      if (!response.ok) throw new Error('Failed to fetch restaurants');
      return response.json() as Promise<Restaurant[]>;
    }
  });

  // Fetch restaurant users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users/analytics');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json() as Promise<User[]>;
    },
    enabled: user?.role === 'super_admin' || user?.role === 'admin'
  });

  // Fetch users for a specific restaurant
  const { data: restaurantUsers, isLoading: isLoadingRestaurantUsers } = useQuery({
    queryKey: ['/api/restaurants', selectedRestaurant?.id, 'users'],
    queryFn: async () => {
      if (!selectedRestaurant?.id) return [];
      const response = await fetch(`/api/restaurants/${selectedRestaurant.id}/users`);
      if (!response.ok) throw new Error('Failed to fetch restaurant users');
      return response.json() as Promise<User[]>;
    },
    enabled: !!selectedRestaurant
  });

  // Mutation to toggle restaurant featured status
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: number; isFeatured: boolean }) => {
      return apiRequest(
        'PATCH',
        `/api/restaurants/${id}/featured`,
        { isFeatured }
      );
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants/featured'] });
      toast({
        title: 'Success',
        description: 'Restaurant featured status updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update restaurant featured status',
        variant: 'destructive',
      });
    }
  });

  // Mutation to add user to restaurant
  const addUserToRestaurantMutation = useMutation({
    mutationFn: async (data: { restaurantId: number, userData: typeof newUserData }) => {
      return apiRequest(
        'POST',
        `/api/restaurants/${data.restaurantId}/users`,
        data.userData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', selectedRestaurant?.id, 'users'] });
      toast({
        title: 'Success',
        description: 'User added to restaurant successfully',
      });
      setOpenAddUserDialog(false);
      setNewUserData({ username: '', fullName: '', email: '', password: '', role: 'restaurant_admin' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add user to restaurant',
        variant: 'destructive',
      });
    }
  });

  // Mutation to remove user from restaurant
  const removeUserFromRestaurantMutation = useMutation({
    mutationFn: async (data: { restaurantId: number, userId: number }) => {
      return apiRequest(
        'DELETE',
        `/api/restaurants/${data.restaurantId}/users/${data.userId}`,
        {}
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', selectedRestaurant?.id, 'users'] });
      toast({
        title: 'Success',
        description: 'User removed from restaurant successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove user from restaurant',
        variant: 'destructive',
      });
    }
  });

  // Mutation to add new restaurant
  const addRestaurantMutation = useMutation({
    mutationFn: async (data: typeof newRestaurantData) => {
      return apiRequest(
        'POST',
        '/api/restaurants',
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
      toast({
        title: 'Success',
        description: 'Restaurant added successfully',
      });
      setOpenAddRestaurantDialog(false);
      setNewRestaurantData({ name: '', description: '', cuisineType: '', address: '' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add restaurant',
        variant: 'destructive',
      });
    }
  });

  // Handler for toggling featured status
  const handleToggleFeatured = (id: number, currentStatus: boolean) => {
    toggleFeaturedMutation.mutate({ id, isFeatured: !currentStatus });
  };

  // Handler for adding user to restaurant
  const handleAddUserToRestaurant = () => {
    if (!selectedRestaurant) return;
    addUserToRestaurantMutation.mutate({
      restaurantId: selectedRestaurant.id,
      userData: newUserData
    });
  };

  // Handler for removing user from restaurant
  const handleRemoveUserFromRestaurant = (userId: number) => {
    if (!selectedRestaurant) return;
    removeUserFromRestaurantMutation.mutate({
      restaurantId: selectedRestaurant.id,
      userId
    });
  };

  // Handler for adding new restaurant
  const handleAddRestaurant = () => {
    addRestaurantMutation.mutate(newRestaurantData);
  };

  // Filter restaurants based on search query
  const filteredRestaurants = restaurants?.filter(restaurant => 
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.cuisineType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // View restaurant as super admin
  const handleViewAsRestaurantEmployee = (restaurant: Restaurant) => {
    if (user?.role !== 'super_admin' && user?.role !== 'admin') return;

    // Store selected restaurant in session storage for the emulation feature
    sessionStorage.setItem('emulatedRestaurantId', restaurant.id.toString());
    
    // Open a new tab with the restaurant view
    window.open(`/restaurant-view?id=${restaurant.id}`, '_blank');
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-4">Restaurant Management</h1>
        <p>Please login to access this page.</p>
      </div>
    );
  }

  // Determine if user is super admin
  const isSuperAdmin = user.role === 'super_admin';
  const isAdmin = user.role === 'admin' || isSuperAdmin;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-4">Restaurant Management</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="restaurants" className="flex items-center">
            <Building className="w-4 h-4 mr-2" />
            Restaurants
          </TabsTrigger>
          {selectedRestaurant && (
            <TabsTrigger value="users" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Restaurant Staff
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="search" className="flex items-center">
              <Search className="w-4 h-4 mr-2" />
              Search Restaurants
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="restaurants">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center w-1/2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search restaurants..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {isAdmin && (
              <Button onClick={() => setOpenAddRestaurantDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Restaurant
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <Card key={restaurant.id} className="overflow-hidden">
                  {restaurant.imageUrl && (
                    <div 
                      className="h-48 bg-cover bg-center" 
                      style={{ backgroundImage: `url(${restaurant.imageUrl})` }}
                    />
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{restaurant.name}</CardTitle>
                      {restaurant.rating && (
                        <Badge variant="outline" className="ml-2">
                          {restaurant.rating} ★
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{restaurant.cuisineType}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{restaurant.description}</p>
                    <p className="text-sm text-muted-foreground mb-4">{restaurant.address}</p>
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox 
                        id={`featured-${restaurant.id}`}
                        checked={restaurant.isFeatured}
                        onCheckedChange={() => handleToggleFeatured(restaurant.id, restaurant.isFeatured)}
                      />
                      <label 
                        htmlFor={`featured-${restaurant.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Feature this restaurant
                      </label>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedRestaurant(restaurant)}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Manage Staff
                    </Button>
                    
                    {isAdmin && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleViewAsRestaurantEmployee(restaurant)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View As Staff
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users">
          {selectedRestaurant && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedRestaurant.name} - Staff Management</h2>
                  <p className="text-muted-foreground">
                    Manage staff access for this restaurant. There is no limit to how many staff members can be added.
                  </p>
                </div>
                <Button onClick={() => setOpenAddUserDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              </div>

              {isLoadingRestaurantUsers ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center p-4 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full mr-4" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : restaurantUsers?.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <Info className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No staff members found</h3>
                  <p className="text-muted-foreground">
                    Add staff members to provide them access to this restaurant's data.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {restaurantUsers?.map(user => (
                    <div key={user.id} className="flex items-center p-4 border rounded-lg">
                      <Avatar className="h-10 w-10 mr-4">
                        {user.profilePicture ? (
                          <AvatarImage src={user.profilePicture} alt={user.fullName} />
                        ) : (
                          <AvatarFallback>{user.fullName.substring(0, 2)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge className="mr-4">{user.role}</Badge>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRemoveUserFromRestaurant(user.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                        <span className="sr-only">Remove user</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="search">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Search All Restaurants</h2>
              <p className="text-muted-foreground">
                As a super admin, you can search and view all restaurants in the system,
                including the ability to view the application as a restaurant staff member.
              </p>
            </div>

            <div className="relative w-full mb-6">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, cuisine type, or address..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <Info className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No restaurants found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search query to find restaurants.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRestaurants.map(restaurant => (
                  <Card key={restaurant.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{restaurant.name}</CardTitle>
                          <CardDescription>{restaurant.cuisineType}</CardDescription>
                        </div>
                        {restaurant.rating && (
                          <Badge variant="outline">{restaurant.rating} ★</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">{restaurant.description}</p>
                      <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedRestaurant(restaurant)}
                      >
                        <UserCog className="h-4 w-4 mr-2" />
                        Manage Staff
                      </Button>
                      <Button 
                        variant="secondary"
                        onClick={() => handleViewAsRestaurantEmployee(restaurant)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View As Staff
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog for adding a new user to restaurant */}
      <Dialog open={openAddUserDialog} onOpenChange={setOpenAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Add a new staff member to {selectedRestaurant?.name}. They will have access to this restaurant's data only.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData({...newUserData, fullName: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={newUserData.role}
                onValueChange={(value) => setNewUserData({...newUserData, role: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant_admin">Restaurant Admin</SelectItem>
                  <SelectItem value="user">Regular User</SelectItem>
                  {isSuperAdmin && (
                    <SelectItem value="admin">Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAddUserDialog(false)}>Cancel</Button>
            <Button onClick={handleAddUserToRestaurant}>Add Staff Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for adding a new restaurant */}
      <Dialog open={openAddRestaurantDialog} onOpenChange={setOpenAddRestaurantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Restaurant</DialogTitle>
            <DialogDescription>
              Add a new restaurant to the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <Input 
                id="name" 
                value={newRestaurantData.name}
                onChange={(e) => setNewRestaurantData({...newRestaurantData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cuisineType">Cuisine Type</Label>
              <Input 
                id="cuisineType" 
                value={newRestaurantData.cuisineType}
                onChange={(e) => setNewRestaurantData({...newRestaurantData, cuisineType: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                value={newRestaurantData.address}
                onChange={(e) => setNewRestaurantData({...newRestaurantData, address: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea 
                id="description" 
                value={newRestaurantData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewRestaurantData({...newRestaurantData, description: e.target.value})}
                rows={4}
                className="w-full p-2 rounded-md border"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAddRestaurantDialog(false)}>Cancel</Button>
            <Button onClick={handleAddRestaurant}>Add Restaurant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}