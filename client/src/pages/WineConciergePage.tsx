import { useAuth } from "@/contexts/AuthContextProvider";
import { WineConcierge } from "@/components/WineConcierge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wine, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function WineConciergePage() {
  const { user } = useAuth();

  // Get restaurant ID based on user role
  const getRestaurantId = () => {
    if (user?.role === 'super_admin') {
      // For super admin, you might want to add a restaurant selector
      // For now, we'll use restaurant ID 1 as default
      return 1;
    } else if (user?.role === 'restaurant_admin' && user?.authorizedRestaurants?.length > 0) {
      return user.authorizedRestaurants[0];
    } else if (user?.authorizedRestaurants?.length > 0) {
      return user.authorizedRestaurants[0];
    }
    return null;
  };

  const restaurantId = getRestaurantId();

  if (!restaurantId) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have access to any restaurant's wine concierge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wine className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Wine Concierge</h1>
            </div>
            <Link href="/restaurants/wines">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Wine List
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-6">
        <WineConcierge restaurantId={restaurantId} />
      </div>
    </div>
  );
}