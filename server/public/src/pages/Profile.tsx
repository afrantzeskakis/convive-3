import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    age: "",
    occupation: "",
    bio: ""
  });

  // Fetch user preferences
  const { data: userPreferences, isLoading: preferencesLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/preferences`],
    enabled: !!user?.id,
  });

  // Fetch user meetups
  const { data: userMeetups, isLoading: meetupsLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/meetups`],
    enabled: !!user?.id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/users/${user?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated."
      });
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Error updating profile",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive"
      });
    }
  });

  // Initialize form data when user data is available
  useState(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || "",
        email: user.email || "",
        age: user.age?.toString() || "",
        occupation: user.occupation || "",
        bio: user.bio || ""
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutateAsync({
      ...profileData,
      age: profileData.age ? parseInt(profileData.age) : undefined
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="text-2xl font-bold mb-4">Please login to view your profile</h2>
            <Button onClick={() => navigate("/login")}>Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-poppins">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage 
                    src={typeof user?.profilePicture === 'string' ? user.profilePicture : undefined} 
                    alt={user?.fullName || 'User'} 
                  />
                  <AvatarFallback className="text-3xl">{user?.fullName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{user?.fullName}</h2>
                <p className="text-gray-600">{user?.occupation}</p>
              </div>

              <div className="mt-6">
                <div className="py-3 border-b border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                </div>
                <div className="py-3 border-b border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Age</span>
                    <span className="font-medium">{user?.age || "Not specified"}</span>
                  </div>
                </div>
                <div className="py-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Member since</span>
                    <span className="font-medium">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  {!editing ? (
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => setEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex space-x-3">
                      <Button 
                        className="flex-1"
                        variant="outline"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={handleSubmit}
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="about">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="meetups">Meetups</TabsTrigger>
              <TabsTrigger value="matches">Matches</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About Me</CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input 
                            id="fullName"
                            name="fullName"
                            value={profileData.fullName}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email"
                            name="email"
                            type="email"
                            value={profileData.email}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="age">Age</Label>
                          <Input 
                            id="age"
                            name="age"
                            type="number"
                            value={profileData.age}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="occupation">Occupation</Label>
                          <Input 
                            id="occupation"
                            name="occupation"
                            value={profileData.occupation}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea 
                          id="bio"
                          name="bio"
                          value={profileData.bio}
                          onChange={handleInputChange}
                          rows={5}
                        />
                      </div>
                    </form>
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Bio</h3>
                      <p className="text-gray-600 mb-6">{user?.bio || "No bio available. Tell us about yourself!"}</p>

                      <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500 text-sm">Full Name</p>
                          <p>{user?.fullName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Email</p>
                          <p>{user?.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Age</p>
                          <p>{user?.age || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Occupation</p>
                          <p>{user?.occupation || "Not specified"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Dining & Social Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  {preferencesLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-32" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                      <Skeleton className="h-4 w-32 mt-6" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    </div>
                  ) : userPreferences ? (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Dining Preferences</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Cuisine Preferences</h4>
                            <div className="flex flex-wrap gap-2">
                              {userPreferences.diningPreferences.cuisines?.map((cuisine: string, index: number) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary bg-opacity-10 text-primary">
                                  {cuisine}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Dining Experience</h4>
                            <ul className="space-y-2">
                              <li className="flex items-center">
                                <i className="fas fa-volume-up text-gray-400 mr-2"></i>
                                <span className="text-gray-700">Noise Preference: {userPreferences.diningPreferences.noiseLevel}</span>
                              </li>
                              <li className="flex items-center">
                                <i className="fas fa-users text-gray-400 mr-2"></i>
                                <span className="text-gray-700">Group Size: {userPreferences.diningPreferences.groupSize}</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Social Preferences</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Interests</h4>
                            <div className="flex flex-wrap gap-2">
                              {userPreferences.interests?.activities && Array.isArray(userPreferences.interests.activities) && 
                                userPreferences.interests.activities.map((interest: string, index: number) => (
                                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary bg-opacity-10 text-primary">
                                    {interest}
                                  </span>
                                ))
                              }
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Social Style</h4>
                            <ul className="space-y-2">
                              <li className="flex items-center">
                                <i className="fas fa-comment text-gray-400 mr-2"></i>
                                <span className="text-gray-700">Conversation Style: {userPreferences.socialPreferences.conversationStyle}</span>
                              </li>
                              <li className="flex items-center">
                                <i className="fas fa-handshake text-gray-400 mr-2"></i>
                                <span className="text-gray-700">Meetup Goal: {userPreferences.socialPreferences.meetupGoal}</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <Button asChild className="bg-primary hover:bg-primary/90">
                          <Link href="/questionnaire">Update Preferences</Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No preferences set</h3>
                      <p className="text-gray-600 mb-4">Complete the questionnaire to set your dining and social preferences.</p>
                      <Button asChild className="bg-primary hover:bg-primary/90">
                        <Link href="/questionnaire">Complete Questionnaire</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="meetups">
              <Card>
                <CardHeader>
                  <CardTitle>My Meetups</CardTitle>
                </CardHeader>
                <CardContent>
                  {meetupsLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="border rounded-lg p-4">
                          <div className="flex justify-between">
                            <div>
                              <Skeleton className="h-5 w-32 mb-1" />
                              <Skeleton className="h-4 w-48 mb-3" />
                            </div>
                            <Skeleton className="h-10 w-10 rounded-md" />
                          </div>
                          <div className="mt-2">
                            <Skeleton className="h-4 w-40 mb-1" />
                            <Skeleton className="h-4 w-32 mb-3" />
                          </div>
                          <div className="flex justify-between mt-3">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : userMeetups?.length ? (
                    <div className="space-y-4">
                      {userMeetups.map((meetup: any) => (
                        <div key={meetup.id} className="border rounded-lg p-4">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{meetup.title}</h3>
                              <p className="text-gray-600">{meetup.restaurant.name}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-2">
                              <span className="text-sm font-semibold">
                                {new Date(meetup.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                              </span>
                              <span className="text-xl font-bold">
                                {new Date(meetup.date).getDate()}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center">
                              <i className="fas fa-clock text-gray-400 mr-2"></i>
                              <span className="text-gray-600">{meetup.startTime} - {meetup.endTime}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary bg-opacity-10 text-primary mt-1">
                                {meetup.status.charAt(0).toUpperCase() + meetup.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between mt-3">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/meetup/${meetup.id}`}>View Details</Link>
                            </Button>
                            <Button asChild size="sm" className="bg-[#00A699] hover:bg-[#00A699]/90">
                              <Link href={`/meetup/${meetup.id}/chat`}>Chat</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No meetups yet</h3>
                      <p className="text-gray-600 mb-4">Explore restaurants and create your first meetup!</p>
                      <Button asChild className="bg-primary hover:bg-primary/90">
                        <Link href="/">Find Restaurants</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="matches">
              <Card>
                <CardHeader>
                  <CardTitle>My Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Find your compatible dining companions</h3>
                    <p className="text-gray-600 mb-4">See who you match with based on your dining and social preferences.</p>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link href="/matches">View Matches</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
