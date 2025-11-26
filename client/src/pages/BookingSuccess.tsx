import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Users, ArrowRight } from "lucide-react";

export default function BookingSuccess() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const session = params.get("session_id");
    setSessionId(session);
  }, [search]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">You're Confirmed!</CardTitle>
          <CardDescription className="text-base mt-2">
            Your dinner booking has been confirmed. We're now matching you with compatible guests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-3 text-left">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Group Matching in Progress</p>
                <p className="text-sm text-muted-foreground">
                  We're matching you with guests who share your interests and dining preferences.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Restaurant Revealed Soon</p>
                <p className="text-sm text-muted-foreground">
                  The restaurant location will be revealed 24-48 hours before your dinner.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => setLocation("/my-bookings")}
              data-testid="view-bookings-button"
            >
              View My Bookings
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setLocation("/book-dinner")}
              data-testid="book-another-button"
            >
              Book Another Dinner
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
