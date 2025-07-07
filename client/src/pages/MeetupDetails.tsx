import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, isPast } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MeetupDetails() {
  const { id } = useParams();
  const meetupId = parseInt(id);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [notification, setNotification] = useState("");
  
  // Fetch meetup details
  const { data: meetup, isLoading, error } = useQuery({
    queryKey: [`/api/meetups/${meetupId}`],
    enabled: !!meetupId,
  });

  // Fetch reservation notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: [`/api/meetups/${meetupId}/messages`],
    enabled: !!meetupId && isAuthenticated,
  });

  // Make reservation mutation (simplified from join meetup)
  const makeReservationMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const reservationData = {
        userId: user.id,
        status: "confirmed", // Auto-confirm reservations
      };
      
      return await apiRequest("POST", `/api/meetups/${meetupId}/participants`, reservationData);
    },
    onSuccess: () => {
      toast({
        title: "Reservation confirmed!",
        description: "Your reservation has been confirmed.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/meetups/${meetupId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error making reservation",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Update reservation status mutation (simplified from update participant status)
  const updateReservationMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!user) throw new Error("User not authenticated");
      return await apiRequest("PATCH", `/api/meetups/${meetupId}/participants/${user.id}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Reservation updated",
        description: "Your reservation status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/meetups/${meetupId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error updating reservation",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Update meetup status mutation (unchanged)
  const updateMeetupStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest("PATCH", `/api/meetups/${meetupId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Meetup status updated",
        description: "The meetup status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/meetups/${meetupId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error updating meetup",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Send notification to restaurant mutation (renamed from send message)
  const sendNotificationMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("User not authenticated");
      
      const notificationData = {
        senderId: user.id,
        content,
      };
      
      return await apiRequest("POST", `/api/meetups/${meetupId}/messages`, notificationData);
    },
    onSuccess: () => {
      setNotification("");
      toast({
        title: "Notification sent",
        description: "Your notification to the restaurant has been sent.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/meetups/${meetupId}/messages`] });
    },
    onError: (error) => {
      toast({
        title: "Error sending notification",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (notification.trim()) {
      sendNotificationMutation.mutateAsync(notification);
    }
  };

  // Check if user is a participant
  const isParticipant = () => {
    if (!user || !meetup) return false;
    return meetup.participants.some((p: any) => p.id === user.id);
  };

  // Check if user is the creator
  const isCreator = () => {
    if (!user || !meetup) return false;
    return meetup.createdBy === user.id;
  };

  // Get participant status
  const getParticipantStatus = () => {
    if (!user || !meetup) return null;
    const userParticipant = meetup.participants.find((p: any) => p.id === user.id);
    return userParticipant?.status || null;
  };

  // Format date
  const formatMeetupDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "EEEE, MMMM d, yyyy");
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="mt-6">
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-6 w-full mb-4" />
              <div className="flex space-x-2 mb-4">
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

  if (error || !meetup) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Meetup Not Found</h2>
        <p className="text-gray-600 mb-6">
          The meetup you're looking for doesn't exist or there was an error loading its details.
        </p>
        <Button asChild>
          <Link href="/explore">Explore Meetups</Link>
        </Button>
      </div>
    );
  }

  const isPastMeetup = isPast(new Date(meetup.date));
  const isMeetupFull = meetup.participants.length >= meetup.maxParticipants;
  const canJoin = isAuthenticated && !isParticipant() && !isPastMeetup && !isMeetupFull && meetup.status !== "cancelled";

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative">
            <img 
              src={meetup.restaurant.imageUrl} 
              alt={meetup.restaurant.name} 
              className="w-full h-64 object-cover rounded-lg"
            />
            <div className="absolute top-4 right-4">
              <Badge 
                className={`${
                  meetup.status === "confirmed" ? "bg-green-100 text-green-800" :
                  meetup.status === "cancelled" ? "bg-red-100 text-red-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}
              >
                {meetup.status.charAt(0).toUpperCase() + meetup.status.slice(1)}
              </Badge>
            </div>
          </div>
          
          <div className="mt-6">
            <h1 className="text-3xl font-bold font-poppins">{meetup.title}</h1>
            <p className="text-gray-600 mt-1">at {meetup.restaurant.name}</p>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center">
                <i className="fas fa-calendar text-gray-400 mr-2"></i>
                <span className="text-gray-600">{formatMeetupDate(meetup.date)}</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-clock text-gray-400 mr-2"></i>
                <span className="text-gray-600">{meetup.startTime} - {meetup.endTime}</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-map-marker-alt text-gray-400 mr-2"></i>
                <span className="text-gray-600">{meetup.restaurant.address}</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-users text-gray-400 mr-2"></i>
                <span className="text-gray-600">
                  {meetup.participants.length} / {meetup.maxParticipants} participants
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Restaurant Details</TabsTrigger>
                  {isAuthenticated && isParticipant() && (
                    <TabsTrigger value="notifications">Restaurant Notifications</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="details" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{meetup.restaurant.name}</CardTitle>
                      <CardDescription>
                        {meetup.restaurant.cuisineType}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-gray-600">{meetup.restaurant.description}</p>
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Restaurant Details</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Ambiance</p>
                              <p>{meetup.restaurant.ambiance}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Noise Level</p>
                              <p>{meetup.restaurant.noiseLevel}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Price Range</p>
                              <p>{meetup.restaurant.priceRange}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Rating</p>
                              <p>{meetup.restaurant.rating} / 5</p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Features</h3>
                          <div className="flex flex-wrap gap-2">
                            {meetup.restaurant.features?.map((feature: string, index: number) => (
                              <Badge key={index} variant="outline">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/restaurant/${meetup.restaurant.id}`}>View Restaurant</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notifications" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Restaurant Notifications</CardTitle>
                      <CardDescription>
                        Send notifications to the restaurant about your reservation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {notificationsLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      ) : (
                        <ScrollArea className="h-80">
                          <div className="space-y-4 p-1">
                            {notifications?.length > 0 ? (
                              notifications.map((note: any) => (
                                <div key={note.id} className={`flex ${note.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`flex ${note.sender.id === user?.id ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 space-x-reverse:space-x-reverse`}>
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={note.sender.profilePicture} alt={note.sender.fullName} />
                                      <AvatarFallback>{note.sender.fullName?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className={`max-w-[70%] rounded-lg p-3 ${
                                      note.sender.id === user?.id 
                                        ? 'bg-primary text-white' 
                                        : 'bg-gray-100 text-gray-900'
                                    }`}>
                                      <p className="text-sm font-semibold">
                                        {note.sender.id === user?.id ? 'You' : 'Restaurant Staff'}
                                      </p>
                                      <p>{note.content}</p>
                                      <p className="text-xs mt-1 opacity-70">
                                        {format(new Date(note.sentAt), 'MMM d, h:mm a')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-10">
                                <p className="text-gray-500">No notifications yet. Send a message to the restaurant about your reservation.</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                    <CardFooter>
                      <form onSubmit={handleSendNotification} className="w-full flex space-x-2">
                        <Input
                          placeholder="Add dietary requirements, special occasions..."
                          value={notification}
                          onChange={(e) => setNotification(e.target.value)}
                          disabled={sendNotificationMutation.isPending}
                        />
                        <Button 
                          type="submit" 
                          disabled={!notification.trim() || sendNotificationMutation.isPending}
                        >
                          Send
                        </Button>
                      </form>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Meetup Status</CardTitle>
              <CardDescription>
                {isPastMeetup 
                  ? "This meetup has already taken place." 
                  : "Manage your participation in this meetup."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                <>
                  {isCreator() ? (
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        You are the organizer of this meetup.
                      </p>
                      
                      {!isPastMeetup && meetup.status !== "cancelled" && (
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant={meetup.status === "confirmed" ? "default" : "outline"}
                            onClick={() => updateMeetupStatusMutation.mutateAsync("confirmed")}
                            disabled={updateMeetupStatusMutation.isPending}
                          >
                            Confirm
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive"
                                disabled={updateMeetupStatusMutation.isPending}
                              >
                                Cancel Meetup
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will cancel the meetup for all participants. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Nevermind</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => updateMeetupStatusMutation.mutateAsync("cancelled")}
                                >
                                  Yes, Cancel Meetup
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  ) : isParticipant() ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className={`h-3 w-3 rounded-full ${
                          getParticipantStatus() === "confirmed" ? "bg-green-500" :
                          getParticipantStatus() === "declined" ? "bg-red-500" :
                          "bg-yellow-500"
                        }`} />
                        <p className="text-gray-600">
                          Your status: <span className="font-medium">{getParticipantStatus()}</span>
                        </p>
                      </div>
                      
                      {getParticipantStatus() === "confirmed" && !isPastMeetup && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              Cancel Participation
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will cancel your participation in this meetup.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Nevermind</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => updateStatusMutation.mutateAsync({ 
                                  userId: user!.id, 
                                  status: "declined" 
                                })}
                              >
                                Yes, Cancel
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      {getParticipantStatus() === "pending" && (
                        <p className="text-yellow-700 text-sm">
                          Your request to join is pending approval from the organizer.
                        </p>
                      )}
                      
                      {getParticipantStatus() === "declined" && (
                        <p className="text-red-700 text-sm">
                          Your participation request was declined.
                        </p>
                      )}
                    </div>
                  ) : canJoin ? (
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Make a reservation at {meetup.restaurant.name}.
                      </p>
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => makeReservationMutation.mutateAsync()}
                        disabled={makeReservationMutation.isPending}
                      >
                        {makeReservationMutation.isPending ? "Processing..." : "Make Reservation"}
                      </Button>
                    </div>
                  ) : isPastMeetup ? (
                    <p className="text-gray-600">
                      This meetup has already taken place.
                    </p>
                  ) : isMeetupFull ? (
                    <p className="text-gray-600">
                      This meetup is at full capacity.
                    </p>
                  ) : meetup.status === "cancelled" ? (
                    <p className="text-gray-600">
                      This meetup has been cancelled.
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Sign in to make a reservation at {meetup.restaurant.name}.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/auth">Sign In</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                {meetup.creator ? (
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={meetup.creator.profilePicture} alt={meetup.creator.fullName} />
                      <AvatarFallback>{meetup.creator.fullName?.charAt(0) || 'O'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{meetup.creator.fullName}</p>
                      <p className="text-sm text-gray-500">{meetup.creator.occupation || 'TableMate Organizer'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-gray-500">Organizer information unavailable</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
