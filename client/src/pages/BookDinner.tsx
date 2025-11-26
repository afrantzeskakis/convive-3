import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Calendar, Clock, ChevronRight } from "lucide-react";

interface DinnerSlot {
  id: number;
  city: string;
  date: string;
  timeSlot: string;
  capacity: number;
  currentBookings: number;
  pricePerPerson: string;
  status: string;
}

export default function BookDinner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const { data: slots, isLoading } = useQuery<DinnerSlot[]>({
    queryKey: ["/api/booking/slots"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (slotId: number) => {
      const response = await apiRequest("POST", `/api/booking/checkout/${slotId}`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to start checkout process",
        variant: "destructive",
      });
    },
  });

  const handleBookSlot = (slotId: number) => {
    setSelectedSlot(slotId);
    checkoutMutation.mutate(slotId);
  };

  const hasAvailability = (slot: DinnerSlot) => {
    return slot.capacity - slot.currentBookings > 0;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Book a Dinner</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const availableSlots = slots?.filter(s => s.status === 'open' && hasAvailability(s)) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Book a Dinner</h1>
        <p className="text-muted-foreground">
          Choose a date and time for your next dining experience. You'll be matched with compatible guests after payment.
        </p>
      </div>

      {availableSlots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Available Dinners</h3>
            <p className="text-muted-foreground">
              Check back soon for new dinner dates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableSlots.map((slot) => (
            <Card 
              key={slot.id} 
              className={`transition-shadow hover:shadow-lg ${selectedSlot === slot.id ? 'ring-2 ring-primary' : ''}`}
              data-testid={`dinner-slot-${slot.id}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(new Date(slot.date), 'EEEE, MMMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{slot.timeSlot}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleBookSlot(slot.id)}
                  disabled={checkoutMutation.isPending && selectedSlot === slot.id}
                  data-testid={`book-button-${slot.id}`}
                >
                  {checkoutMutation.isPending && selectedSlot === slot.id ? (
                    "Processing..."
                  ) : (
                    <>
                      Book Now
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">How it works</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Choose a date and time that works for you</li>
          <li>Complete your payment to secure your spot</li>
          <li>We'll match you with compatible guests based on your preferences</li>
          <li>Restaurant details will be revealed 24-48 hours before your dinner</li>
        </ol>
      </div>
    </div>
  );
}
