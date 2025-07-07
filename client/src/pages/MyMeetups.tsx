import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { format, isPast, isFuture } from "date-fns";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyMeetups() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  // Fetch user's meetups
  const { data: meetups, isLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/meetups`],
    enabled: !!user?.id,
  });
  
  // Filter meetups by status
  const upcomingMeetups = meetups?.filter((meetup: any) => {
    return isFuture(new Date(meetup.date)) && meetup.status !== "cancelled";
  });
  
  const pastMeetups = meetups?.filter((meetup: any) => {
    return isPast(new Date(meetup.date)) || meetup.status === "cancelled";
  });
  
  // Filter by meetups created by user
  const createdMeetups = meetups?.filter((meetup: any) => {
    return meetup.createdBy === user?.id;
  });
  
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="text-2xl font-bold mb-4">Please log in to view your meetups</h2>
            <Button onClick={() => navigate("/login")}>Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold font-poppins">My Meetups</h1>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/explore">Find New Meetups</Link>
        </Button>
      </div>
      
      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="created">Created by Me</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6">
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <Skeleton className="h-5 w-20 mb-1" />
                        <Skeleton className="h-6 w-48 mb-1" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-14 w-14 rounded-lg" />
                    </div>
                    <div className="mt-4">
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="mt-4 flex justify-between">
                      <Skeleton className="h-9 w-28" />
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingMeetups?.length > 0 ? (
            <div className="space-y-6">
              {upcomingMeetups.map((meetup: any) => (
                <MeetupItem key={meetup.id} meetup={meetup} />
              ))}
            </div>
          ) : (
            <Card className="w-full">
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 mb-4">You don't have any upcoming meetups.</p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/explore">Find Meetups</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-6">
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <Skeleton className="h-5 w-20 mb-1" />
                        <Skeleton className="h-6 w-48 mb-1" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-14 w-14 rounded-lg" />
                    </div>
                    <div className="mt-4">
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="mt-4 flex justify-between">
                      <Skeleton className="h-9 w-28" />
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pastMeetups?.length > 0 ? (
            <div className="space-y-6">
              {pastMeetups.map((meetup: any) => (
                <MeetupItem key={meetup.id} meetup={meetup} isPast />
              ))}
            </div>
          ) : (
            <Card className="w-full">
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600">You don't have any past meetups.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="created" className="mt-6">
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <Skeleton className="h-5 w-20 mb-1" />
                        <Skeleton className="h-6 w-48 mb-1" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-14 w-14 rounded-lg" />
                    </div>
                    <div className="mt-4">
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="mt-4 flex justify-between">
                      <Skeleton className="h-9 w-28" />
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : createdMeetups?.length > 0 ? (
            <div className="space-y-6">
              {createdMeetups.map((meetup: any) => (
                <MeetupItem 
                  key={meetup.id} 
                  meetup={meetup} 
                  isCreator 
                  isPast={isPast(new Date(meetup.date))} 
                />
              ))}
            </div>
          ) : (
            <Card className="w-full">
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 mb-4">You haven't created any meetups yet.</p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/explore">Create a Meetup</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// MeetupItem component for displaying individual meetups
function MeetupItem({ meetup, isPast = false, isCreator = false }: { meetup: any, isPast?: boolean, isCreator?: boolean }) {
  const meetupDate = new Date(meetup.date);
  const formattedDate = format(meetupDate, "EEEE, MMMM d, yyyy");
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <Badge 
              variant={
                isPast 
                  ? "secondary" 
                  : meetup.status === "confirmed" 
                    ? "success" 
                    : meetup.status === "cancelled" 
                      ? "destructive" 
                      : "warning"
              }
              className="mb-2"
            >
              {meetup.status.charAt(0).toUpperCase() + meetup.status.slice(1)}
              {isPast && meetup.status !== "cancelled" && " (Past)"}
            </Badge>
            <h3 className="text-xl font-semibold font-poppins">{meetup.title}</h3>
            <p className="text-gray-600">{meetup.restaurant.name}</p>
          </div>
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-2">
            <span className="text-sm font-semibold">
              {format(meetupDate, "MMM").toUpperCase()}
            </span>
            <span className="text-xl font-bold">
              {format(meetupDate, "d")}
            </span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center">
            <i className="fas fa-clock text-gray-400 mr-2"></i>
            <span className="text-gray-600">{formattedDate}, {meetup.startTime} - {meetup.endTime}</span>
          </div>
          <div className="flex items-center mt-1">
            <i className="fas fa-map-marker-alt text-gray-400 mr-2"></i>
            <span className="text-gray-600">{meetup.restaurant.address}</span>
          </div>
          <div className="flex items-center mt-1">
            <i className="fas fa-users text-gray-400 mr-2"></i>
            <span className="text-gray-600">
              {meetup.participants.length} / {meetup.maxParticipants} participants
            </span>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap -space-x-2 overflow-hidden">
          {meetup.participants.slice(0, 5).map((participant: any) => (
            <Avatar key={participant.id} className="border-2 border-white">
              <AvatarImage src={participant.profilePicture} alt={participant.fullName} />
              <AvatarFallback>{participant.fullName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          ))}
          {meetup.participants.length > 5 && (
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 border-2 border-white">
              <span className="text-xs font-medium">+{meetup.participants.length - 5}</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-between">
          <Button asChild variant="outline">
            <Link href={`/meetup/${meetup.id}`}>View Details</Link>
          </Button>
          
          {!isPast ? (
            <Button asChild className="bg-[#00A699] hover:bg-[#00A699]/90">
              <Link href={`/meetup/${meetup.id}/chat`}>Chat</Link>
            </Button>
          ) : isCreator ? (
            <Button asChild variant="outline">
              <Link href={`/meetup/${meetup.id}/feedback`}>View Feedback</Link>
            </Button>
          ) : (
            <Button asChild variant="secondary">
              <Link href={`/meetup/${meetup.id}/feedback`}>Leave Feedback</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
