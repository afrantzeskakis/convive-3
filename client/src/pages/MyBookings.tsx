import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { format, isPast, isWithinInterval, addHours } from "date-fns";
import { Calendar, Clock, MapPin, Users, Eye, ChevronRight, Plus } from "lucide-react";

interface Booking {
  id: number;
  userId: number;
  slotId: number;
  groupId: number | null;
  paymentStatus: string;
  amountPaid: string | null;
  restaurantRevealed: boolean;
  bookedAt: string;
  paidAt: string | null;
  slot: {
    id: number;
    city: string;
    date: string;
    timeSlot: string;
    restaurantRevealAt: string | null;
  };
  restaurant: {
    id: number;
    name: string;
    address: string;
    cuisineType: string;
  } | null;
}

export default function MyBookings() {
  const [, setLocation] = useLocation();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/booking/my-bookings"],
  });

  const getBookingStatus = (booking: Booking) => {
    if (booking.paymentStatus !== 'paid') {
      return { label: 'Payment Pending', variant: 'secondary' as const };
    }
    
    const dinnerDate = new Date(booking.slot.date);
    if (isPast(dinnerDate)) {
      return { label: 'Completed', variant: 'outline' as const };
    }
    
    if (booking.restaurantRevealed || booking.restaurant) {
      return { label: 'Restaurant Revealed', variant: 'default' as const };
    }
    
    return { label: 'Confirmed', variant: 'default' as const };
  };

  const isRestaurantRevealingSoon = (booking: Booking) => {
    if (booking.restaurantRevealed || booking.restaurant) return false;
    if (!booking.slot.restaurantRevealAt) return false;
    
    const revealDate = new Date(booking.slot.restaurantRevealAt);
    const now = new Date();
    
    return isWithinInterval(now, {
      start: addHours(revealDate, -2),
      end: revealDate
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings?.filter(b => 
    b.paymentStatus === 'paid' && !isPast(new Date(b.slot.date))
  ) || [];
  
  const pastBookings = bookings?.filter(b => 
    b.paymentStatus === 'paid' && isPast(new Date(b.slot.date))
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <Button onClick={() => setLocation("/book-dinner")} data-testid="book-new-button">
          <Plus className="h-4 w-4 mr-2" />
          Book a Dinner
        </Button>
      </div>

      {bookings?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Bookings Yet</h3>
            <p className="text-muted-foreground mb-4">
              Book your first dinner and meet new people.
            </p>
            <Button onClick={() => setLocation("/book-dinner")}>
              Browse Dinners
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {upcomingBookings.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Upcoming Dinners</h2>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => {
                  const status = getBookingStatus(booking);
                  const revealingSoon = isRestaurantRevealingSoon(booking);
                  
                  return (
                    <Card 
                      key={booking.id}
                      className="hover:shadow-md transition-shadow"
                      data-testid={`booking-${booking.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <MapPin className="h-5 w-5" />
                              {booking.slot.city}
                              {booking.restaurant && (
                                <span className="text-muted-foreground font-normal">
                                  - {booking.restaurant.name}
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {format(new Date(booking.slot.date), 'EEEE, MMMM d, yyyy')}
                            </CardDescription>
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.slot.timeSlot}</span>
                          </div>
                          {booking.groupId && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>Group #{booking.groupId}</span>
                            </div>
                          )}
                        </div>
                        
                        {!booking.restaurantRevealed && !booking.restaurant && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Eye className="h-4 w-4" />
                            <span>
                              {revealingSoon 
                                ? "Restaurant revealing soon..."
                                : "Restaurant will be revealed before dinner"
                              }
                            </span>
                          </div>
                        )}
                        
                        {booking.restaurant && (
                          <div className="bg-muted rounded-lg p-3 mt-2">
                            <p className="font-medium">{booking.restaurant.name}</p>
                            <p className="text-sm text-muted-foreground">{booking.restaurant.address}</p>
                            <p className="text-sm text-muted-foreground">{booking.restaurant.cuisineType}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {pastBookings.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Past Dinners</h2>
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <Card 
                    key={booking.id}
                    className="opacity-75"
                    data-testid={`past-booking-${booking.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <MapPin className="h-5 w-5" />
                            {booking.slot.city}
                            {booking.restaurant && (
                              <span className="text-muted-foreground font-normal">
                                - {booking.restaurant.name}
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {format(new Date(booking.slot.date), 'MMMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">Completed</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
