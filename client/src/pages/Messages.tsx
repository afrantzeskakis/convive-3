import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { format, formatDistance, isPast, addDays } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
import { 
  Clock, 
  Timer, 
  AlertCircle, 
  CheckCircle2, 
  InfoIcon, 
  TimerOff,
  Hourglass,
  XCircle
} from "lucide-react";

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [showExpirationNotice, setShowExpirationNotice] = useState(false);
  const [pendingExtensionRequest, setPendingExtensionRequest] = useState<null | { id: number, requestedBy: { fullName: string, profilePicture: string | null } }>(null);
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [extensionTargetUser, setExtensionTargetUser] = useState<null | { id: number, fullName: string }>(null);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch user's meetups
  const { data: meetups, isLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/meetups`],
    enabled: !!user?.id,
  });
  
  // Fetch messages for selected meetup
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/messaging/meetup/${selectedChat}`],
    enabled: !!selectedChat,
  });
  
  // Check if user has seen expiration notice
  const { data: expirationNoticeSeen } = useQuery({
    queryKey: ["/api/messaging/expiration-notice-seen"],
    enabled: isAuthenticated,
    onSuccess: (data) => {
      if (data && !data.hasSeenNotice) {
        setShowExpirationNotice(true);
      }
    }
  });
  
  // Check for pending extension requests
  const { data: pendingExtensions } = useQuery({
    queryKey: ["/api/messaging/extensions/pending"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds to check for new requests
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setPendingExtensionRequest(data[0]);
      } else {
        setPendingExtensionRequest(null);
      }
    }
  });
  
  // Mutation to mark expiration notice as seen
  const markNoticeSeen = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/messaging/expiration-notice-seen");
      return await res.json();
    },
    onSuccess: () => {
      setShowExpirationNotice(false);
      queryClient.invalidateQueries({ queryKey: ["/api/messaging/expiration-notice-seen"] });
    }
  });
  
  // Mutation to send a message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string }) => {
      const res = await apiRequest("POST", `/api/messaging/meetup/${selectedChat}`, messageData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messaging/meetup/${selectedChat}`] });
      setMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutation to request message connection extension
  const requestExtensionMutation = useMutation({
    mutationFn: async ({ meetupId, requestedUserId }: { meetupId: number, requestedUserId: number }) => {
      const res = await apiRequest("POST", "/api/messaging/extension/request", {
        meetupId,
        requestedUserId
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Extension request sent",
        description: "We'll notify you when they respond to your request.",
      });
      setExtensionDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to request extension",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutation to approve a message connection extension
  const approveExtensionMutation = useMutation({
    mutationFn: async (extensionId: number) => {
      const res = await apiRequest("POST", `/api/messaging/extension/approve/${extensionId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Extension approved",
        description: "You can continue messaging for another week.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messaging/extensions/pending"] });
      setPendingExtensionRequest(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve extension",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutation to silently decline a message connection extension
  // The requesting user will NOT be notified of the rejection to preserve privacy
  const declineExtensionMutation = useMutation({
    mutationFn: async (extensionId: number) => {
      const res = await apiRequest("POST", `/api/messaging/extension/decline/${extensionId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Extension request declined",
        description: "The requester will only see that the connection expired naturally.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messaging/extensions/pending"] });
      setPendingExtensionRequest(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to process request",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update selected chat when meetups are loaded
  useEffect(() => {
    if (meetups?.length && !selectedChat) {
      setSelectedChat(meetups[0].id);
    }
  }, [meetups, selectedChat]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && selectedChat) {
      sendMessageMutation.mutate({ content: message.trim() });
    }
  };
  
  const handleRequestExtension = (userId: number, fullName: string) => {
    if (selectedChat) {
      setExtensionTargetUser({ id: userId, fullName });
      setExtensionDialogOpen(true);
    }
  };
  
  const handleApproveExtension = () => {
    if (pendingExtensionRequest) {
      approveExtensionMutation.mutate(pendingExtensionRequest.id);
    }
  };
  
  const handleDeclineExtension = () => {
    if (pendingExtensionRequest) {
      declineExtensionMutation.mutate(pendingExtensionRequest.id);
    }
  };
  
  const acknowledgeExpirationNotice = () => {
    markNoticeSeen.mutate();
  };
  
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="text-2xl font-bold mb-4">Please log in to view your messages</h2>
            <Button onClick={() => navigate("/login")}>Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Extension request dialog */}
      <AlertDialog open={extensionDialogOpen} onOpenChange={setExtensionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Connection Extension</AlertDialogTitle>
            <AlertDialogDescription>
              {extensionTargetUser && (
                <div>
                  <p>You're requesting to extend your messaging connection with <span className="font-medium">{extensionTargetUser.fullName}</span> for another week.</p>
                  <p className="mt-2">This requires mutual consent. They'll be notified of your request and can approve or decline it.</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedChat && extensionTargetUser) {
                  requestExtensionMutation.mutate({
                    meetupId: selectedChat,
                    requestedUserId: extensionTargetUser.id
                  });
                }
              }}
            >
              Send Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-poppins">Messages</h1>
        <p className="text-gray-600 mt-2">
          Chat with your dining partners about upcoming culinary experiences.
        </p>
      </div>
      
      {/* First-time expiration notice */}
      {showExpirationNotice && (
        <Alert variant="default" className="mb-6 bg-amber-50 border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800">Message Privacy Protection</AlertTitle>
          <AlertDescription className="text-amber-700">
            <p>For your privacy, messages expire after 1 week. This helps protect your personal information and ensures your data isn't stored indefinitely.</p>
            <p className="mt-2">If you'd like to extend a connection with someone, you can request an extension which requires mutual consent.</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={acknowledgeExpirationNotice} 
              className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900">
              Got it
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Pending extension request */}
      {pendingExtensionRequest && (
        <Alert variant="default" className="mb-6 bg-blue-50 border-blue-200">
          <InfoIcon className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-800">Connection Extension Request</AlertTitle>
          <AlertDescription className="text-blue-700">
            <div className="flex items-center space-x-2 my-2">
              <Avatar>
                <AvatarImage src={pendingExtensionRequest.requestedBy.profilePicture || undefined} />
                <AvatarFallback>{pendingExtensionRequest.requestedBy.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{pendingExtensionRequest.requestedBy.fullName}</span>
              <span>would like to continue messaging with you for another week.</span>
            </div>
            <div className="flex space-x-2 mt-3">
              <Button 
                onClick={handleApproveExtension} 
                variant="outline" 
                size="sm" 
                className="border-blue-300 text-blue-800 hover:bg-blue-100 hover:text-blue-900">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Approve
              </Button>
              <Button
                onClick={handleDeclineExtension}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-800 hover:bg-blue-100 hover:text-blue-900">
                <XCircle className="mr-1 h-4 w-4" />
                Decline
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-700 hover:bg-blue-100 hover:text-blue-900"
                onClick={() => setPendingExtensionRequest(null)}>
                Maybe Later
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="h-[calc(80vh-100px)]">
            <CardHeader>
              <CardTitle>Meetup Chats</CardTitle>
              <CardDescription>
                Select a meetup to view the conversation
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(80vh-200px)]">
                {isLoading ? (
                  <div className="space-y-2 p-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-2">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-32 mb-1" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : meetups?.length > 0 ? (
                  <div>
                    {meetups.map((meetup: any) => (
                      <div key={meetup.id}>
                        <div 
                          className={`flex items-center space-x-3 p-4 cursor-pointer hover:bg-gray-50 ${
                            selectedChat === meetup.id ? 'bg-gray-50' : ''
                          }`}
                          onClick={() => setSelectedChat(meetup.id)}
                        >
                          <Avatar>
                            <AvatarImage src={meetup.restaurant.imageUrl} alt={meetup.restaurant.name} />
                            <AvatarFallback>{meetup.restaurant.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="font-medium line-clamp-1">{meetup.title}</p>
                              <span className="text-xs text-gray-500">
                                {format(new Date(meetup.date), "MMM d")}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {meetup.restaurant.name}
                            </p>
                          </div>
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-600 mb-4">You're not part of any meetups yet.</p>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link href="/explore">Find Meetups</Link>
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card className="h-[calc(80vh-100px)] flex flex-col">
            {selectedChat ? (
              <>
                <CardHeader className="pb-3">
                  {meetups ? (
                    <>
                      <CardTitle>
                        {meetups.find((m: any) => m.id === selectedChat)?.title}
                      </CardTitle>
                      <CardDescription className="flex items-center justify-between">
                        <span>
                          {meetups.find((m: any) => m.id === selectedChat)?.restaurant.name}
                        </span>
                        <Badge variant="outline">
                          {format(new Date(meetups.find((m: any) => m.id === selectedChat)?.date), "MMMM d, yyyy")}
                        </Badge>
                      </CardDescription>
                    </>
                  ) : (
                    <>
                      <Skeleton className="h-6 w-48 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </>
                  )}
                </CardHeader>
                
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-[calc(80vh-250px)]">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                            <div className={`flex ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} items-start space-x-2 space-x-reverse:space-x-reverse`}>
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className={`max-w-[70%] rounded-lg p-3 ${
                                i % 2 === 0 ? 'bg-gray-100' : 'bg-primary text-white'
                              }`}>
                                <Skeleton className="h-4 w-24 mb-1" />
                                <Skeleton className="h-16 w-52" />
                                <Skeleton className="h-3 w-16 mt-1" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : messages?.length > 0 ? (
                      <div className="space-y-4 p-1">
                        {messages.map((msg: any) => (
                          <div key={msg.id} className={`flex ${msg.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex ${msg.sender.id === user?.id ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 space-x-reverse:space-x-reverse`}>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={msg.sender.profilePicture} alt={msg.sender.fullName} />
                                <AvatarFallback>{msg.sender.fullName?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              <div className={`max-w-[70%] rounded-lg p-3 ${
                                msg.sender.id === user?.id 
                                  ? 'bg-primary text-white' 
                                  : 'bg-gray-100 text-gray-900'
                              }`}>
                                <p className="text-sm font-semibold">
                                  {msg.sender.id === user?.id ? 'You' : msg.sender.fullName}
                                </p>
                                <p>{msg.content}</p>
                                <div className="flex justify-between items-center text-xs mt-1 opacity-70">
                                  <span>{format(new Date(msg.sentAt), 'MMM d, h:mm a')}</span>
                                  {msg.expiresAt && (
                                    <span className="flex items-center ml-2" title={`Expires on ${format(new Date(msg.expiresAt), 'MMM d, yyyy')}`}>
                                      <Timer className="h-3 w-3 mr-1" />
                                      {isPast(new Date(msg.expiresAt)) ? 
                                        'Expired' : 
                                        formatDistance(new Date(msg.expiresAt), new Date(), { addSuffix: true })}
                                    </span>
                                  )}
                                </div>
                                {msg.sender.id !== user?.id && (
                                  <div className="mt-1.5 text-xs">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 px-2 text-xs hover:bg-gray-200"
                                      onClick={() => handleRequestExtension(msg.sender.id, msg.sender.fullName)}
                                    >
                                      <Hourglass className="h-3 w-3 mr-1" />
                                      Extend Connection
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-gray-600 mb-2">No messages yet</p>
                          <p className="text-sm text-gray-500">
                            Be the first to send a message to the group
                          </p>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
                
                <CardFooter className="border-t pt-4">
                  <form onSubmit={handleSendMessage} className="w-full flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <Button type="submit" disabled={!message.trim()}>
                      Send
                    </Button>
                  </form>
                </CardFooter>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                  <p className="text-gray-600 mb-4">Select a meetup to view the conversation</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
