import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContextProvider";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import HighRollerApplicationForm from "@/components/forms/HighRollerApplicationForm";

// Define plan types
type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  dinners: number;
  description: string;
  isPopular?: boolean;
  features: string[];
};

// Type for user subscription response
type UserSubscriptionResponse = {
  hasSubscription: boolean;
  subscription?: {
    id: number;
    userId: number;
    planId: number;
    status: string;
    dinnersRemaining: number;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    plan?: {
      id: number;
      name: string;
      price: number;
      dinnerCount: number;
    }
  };
};

type PurchaseType = 'subscription' | 'convive-black' | 'ticket';

export default function TableAccess() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<PurchaseType>('subscription');
  const [isProcessing, setIsProcessing] = useState(false);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  
  // Fetch user's current subscription
  const { 
    data: subscriptionData, 
    isLoading: isLoadingSubscription,
    error: subscriptionError 
  } = useQuery<UserSubscriptionResponse>({
    queryKey: ['/api/subscriptions/my-subscription'],
    queryFn: async () => {
      const response = await fetch('/api/subscriptions/my-subscription');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      return response.json();
    },
    enabled: !!user // Only run query if user is logged in
  });

  // Subscription plans data (without Convive Black)
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "tier1",
      name: "Basic Tier",
      price: 45,
      dinners: 2,
      description: "Perfect for occasional diners",
      features: [
        "Standard match algorithm",
        "Complimentary welcome drink at each dinner"
      ]
    },
    {
      id: "tier2",
      name: "Standard Tier",
      price: 65,
      dinners: 3,
      description: "Our most popular option",
      isPopular: true,
      features: [
        "Enhanced match algorithm",
        "Complimentary welcome drink at each dinner"
      ]
    },
    {
      id: "tier3",
      name: "Premium Tier",
      price: 80,
      dinners: 4,
      description: "For the social dining enthusiast",
      features: [
        "VIP match algorithm",
        "Complimentary welcome drink at each dinner"
      ]
    }
  ];

  // Convive Black plan (separate from regular subscriptions)
  const conviveBlackPlan: SubscriptionPlan = {
    id: "tier4",
    name: "Convive Black",
    price: 375,
    dinners: 5,
    description: "Access the city's most exclusive dinner tables. No pitch decks, no panels, just real people and real chemistry. Some earn their seat. Some claim it. But everyone leaves elevated.",
    features: [
      "Up to 25 connections per month",
      "$15 per connection",
      "Super premium restaurant service experience",
      "VIP treatment from restaurant staff",
      "Reserved seating at prime tables",
      "Complimentary welcome drink at each dinner"
    ]
  };

  // One-time ticket option
  const ticketOption = {
    id: "single",
    name: "One-time Dinner Ticket",
    price: 25,
    description: "Try our service without a subscription",
    features: [
      "Single dinner experience",
      "Full matching capabilities",
      "Complimentary welcome drink at dinner",
      "No recurring charges"
    ]
  };

  // Handle payment process
  const handlePaymentProcess = async (planId: string, type: PurchaseType) => {
    try {
      setIsProcessing(true);
      
      if (type === 'subscription') {
        // Call subscription API
        const response = await apiRequest('POST', '/api/subscriptions/create', {
          planId
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create subscription');
        }
        
        const data = await response.json();
        
        toast({
          title: "Subscription Started",
          description: "Your subscription has been initiated. Note: Payment processing requires Stripe keys to be configured.",
          variant: "default",
        });
      } else {
        // Call one-time payment API for dinner ticket
        let ticketPrice = ticketOption.price;
        let ticketType = 'dinner_ticket';
        
        if (planId === 'high-roller') {
          ticketPrice = highRollerTicket.price;
          ticketType = 'high_roller_ticket';
        } else if (planId === 'private-group') {
          ticketPrice = privateGroupTicket.price;
          ticketType = 'private_group_ticket';
        }
        
        const response = await apiRequest('POST', '/api/payments/create-payment-intent', {
          amount: ticketPrice,
          type: ticketType
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process payment');
        }
        
        const data = await response.json();
        
        toast({
          title: "Ticket Purchase Initiated",
          description: "Your ticket purchase has been initiated. Note: Payment processing requires Stripe keys to be configured.",
          variant: "default",
        });
      }
      
      // Successful payment simulation for demo purposes
      setTimeout(() => {
        setIsProcessing(false);
        
        // Invalidate any relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/my-subscription'] });
        
        toast({
          title: "Purchase Simulated",
          description: "In a production environment with Stripe API keys, this would complete the payment process.",
          variant: "default",
        });
      }, 1500);
    } catch (error: any) {
      setIsProcessing(false);
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred while processing your payment. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Subscription plans section (without Convive Black)
  const renderSubscriptionPlans = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {subscriptionPlans.map((plan) => {
        const isPopular = plan.isPopular;
        
        let cardStyle = "flex flex-col";
        if (isPopular) {
          cardStyle += " border-primary shadow-md";
        }
        
        return (
          <Card key={plan.id} className={cardStyle}>
            <CardHeader className="pb-2">
              {isPopular && <Badge className="w-fit mb-2">Most Popular</Badge>}
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="py-0 flex-grow">
              <div className="mb-2">
                <div className="text-3xl font-bold relative inline-block">
                  <span className="text-gray-400 relative">
                    ${plan.price}
                    <span className="absolute left-0 right-0 top-1/2 border-t-2 border-red-500 transform -rotate-6"></span>
                  </span>
                  <span className="text-green-600 ml-2">$0</span>
                  <span className="text-sm font-normal text-gray-500">/month for 2 months</span>
                </div>
              </div>
              <p className="text-lg font-medium mb-4 text-primary">{plan.dinners} dinners per month</p>
              
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span> {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-4">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isProcessing}
                onClick={() => handlePaymentProcess(plan.id, 'subscription')}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Get 2 Months Free
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );

  // Convive Black section
  const renderConviveBlack = () => (
    <div className="mt-6">
      <Card className="flex flex-col border-primary/80 shadow-lg bg-primary/5 max-w-4xl mx-auto">
        <CardHeader className="pb-2">
          <Badge variant="secondary" className="w-fit mb-2 bg-primary/20 text-primary border-primary/30">
            High Roller Experience
          </Badge>
          <CardTitle className="font-semibold tracking-tight text-center text-[28px]">{conviveBlackPlan.name}</CardTitle>
          <div className="text-center mt-2 space-y-2">
            <p className="text-base font-medium text-[#898e96]">
              Access the city's most exclusive dinner tables.
            </p>
            <p className="text-base font-medium text-[#898e96]">
              No pitch decks, no panels, just real people and real chemistry.
            </p>
          </div>
        </CardHeader>
        <CardContent className="py-0 flex-grow">
          <div className="text-3xl font-bold mb-2">${conviveBlackPlan.price}<span className="text-sm font-normal">/month</span></div>
          <p className="text-lg font-medium mb-4 text-primary">{conviveBlackPlan.dinners} dinners per month</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conviveBlackPlan.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm list-none">
                <span className="text-primary font-bold mr-2">✓</span> {feature}
              </li>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-gray-100 text-gray-700 rounded-md text-sm">
            <p className="font-medium mb-1">High Roller Access Information:</p>
            <p className="text-center">Convive Black experiences aren't about money, they're about energy. Our algorithm finds the guests who naturally raise the stakes: big spenders, power connectors, and unforgettable dinner companions. We curate tables at the city's most exclusive restaurants where real connections happen.</p>
          </div>
          
          <p className="text-center text-base font-medium text-[#898e96] italic mt-3 mb-1">
            Some earn their seat. Some claim it. But everyone leaves elevated.
          </p>
        </CardContent>
        <CardFooter className="pt-4">
          <Button 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isProcessing}
            onClick={() => handlePaymentProcess(conviveBlackPlan.id, 'subscription')}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Claim Your Seat</Button>
        </CardFooter>
      </Card>
    </div>
  );

  // Calculate high roller ticket price based on user's average spend
  const calculateHighRollerPrice = () => {
    if (user?.averageSpendPerDinner) {
      // Apply 1.4x multiplier to user's average spend
      const calculatedPrice = Number(user.averageSpendPerDinner) * 1.4;
      // Ensure minimum price is $100
      return Math.max(100, Math.round(calculatedPrice));
    }
    return 100; // Default price if no average spend data
  };

  // One-time ticket options
  const highRollerTicket = {
    id: "high-roller",
    name: "High Roller Ticket",
    price: calculateHighRollerPrice(),
    description: "Experience premium dining with high-spending companions",
    features: [
      "Access to high check average dining experiences",
      "Super premium restaurant service experience",
      "Special VIP treatment from restaurant staff",
      "Curated companion matching",
      "Premium restaurant selection",
      "Reserved seating at the best tables",
      "Complimentary welcome drink at dinner",
      "No recurring charges"
    ]
  };
  
  // Private group dining ticket option
  const privateGroupTicket = {
    id: "private-group",
    name: "Private Group Dining Ticket",
    price: 150,
    description: "Host your own curated dining experience with your selected guests",
    features: [
      "Book a private table for your own group",
      "Same dedicated restaurant host experience",
      "Personalized menu recommendations",
      "Premium restaurant selection",
      "Reserved seating at the best tables",
      "Complimentary welcome drink for each guest",
      "No recurring charges"
    ]
  };

  // One-time ticket section
  const renderTicketOption = () => (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>{ticketOption.name}</CardTitle>
          <CardDescription>{ticketOption.description}</CardDescription>
        </CardHeader>
        <CardContent className="py-0 flex-grow">
          <div className="text-3xl font-bold mb-2">${ticketOption.price}</div>
          <ul className="space-y-2">
            {ticketOption.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span> {feature}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="pt-4">
          <Button 
            className="w-full" 
            disabled={isProcessing}
            onClick={() => handlePaymentProcess(ticketOption.id, 'ticket')}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Purchase Ticket
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col border-primary/50 shadow-md">
        <CardHeader>
          <Badge variant="secondary" className="w-fit mb-2">Premium Experience</Badge>
          <CardTitle>{highRollerTicket.name}</CardTitle>
          <CardDescription>{highRollerTicket.description}</CardDescription>
        </CardHeader>
        <CardContent className="py-0 flex-grow">
          <div className="text-3xl font-bold mb-2">${highRollerTicket.price}</div>
          <ul className="space-y-2">
            {highRollerTicket.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span> {feature}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="pt-4 flex flex-col gap-2">
          <Button 
            className="w-full bg-primary hover:bg-primary/90" 
            disabled={isProcessing}
            onClick={() => handlePaymentProcess(highRollerTicket.id, 'ticket')}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Purchase High Roller Ticket
          </Button>
          
          <div className="w-full text-center my-1">
            <span className="text-sm text-muted-foreground">or</span>
          </div>
          
          <Dialog open={applicationDialogOpen} onOpenChange={setApplicationDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full border-primary/30 text-primary hover:bg-primary/5"
              >
                <Gift className="h-4 w-4 mr-2" />
                Apply for a Free High Roller Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <HighRollerApplicationForm onClose={() => setApplicationDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
      
      <Card className="flex flex-col border-primary/40 shadow-md">
        <CardHeader>
          <Badge variant="outline" className="w-fit mb-2 border-primary/30 text-primary bg-primary/5">Group Experience</Badge>
          <CardTitle>{privateGroupTicket.name}</CardTitle>
          <CardDescription>{privateGroupTicket.description}</CardDescription>
        </CardHeader>
        <CardContent className="py-0 flex-grow">
          <div className="text-3xl font-bold mb-2">${privateGroupTicket.price}</div>
          <ul className="space-y-2">
            {privateGroupTicket.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span> {feature}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="pt-4">
          <Button 
            className="w-full bg-primary/90 hover:bg-primary" 
            disabled={isProcessing}
            onClick={() => handlePaymentProcess(privateGroupTicket.id, 'ticket')}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Book Private Group Experience
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">Table Access</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Choose your dining plan and start meeting new people over amazing food.
        </p>

        {/* Display current subscription info if available */}
        {isLoadingSubscription ? (
          <div className="flex items-center justify-center p-6 mb-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : subscriptionError ? (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertTitle className="text-blue-800">No Current Subscription</AlertTitle>
            <AlertDescription className="text-blue-700">
              You don't have an active subscription. Select a plan below to get started.
            </AlertDescription>
          </Alert>
        ) : subscriptionData?.hasSubscription && subscriptionData.subscription ? (
          <Alert className="mb-6 bg-primary/10 border-primary">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <AlertTitle className="ml-2">Active Subscription</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p><span className="font-semibold">Plan:</span> {subscriptionData.subscription.plan?.name || 'Premium Plan'}</p>
                <p><span className="font-semibold">Status:</span> {subscriptionData.subscription.status}</p>
                <p><span className="font-semibold">Dinners remaining:</span> {subscriptionData.subscription.dinnersRemaining}</p>
                {subscriptionData.subscription.currentPeriodEnd && (
                  <p><span className="font-semibold">Renews on:</span> {new Date(subscriptionData.subscription.currentPeriodEnd).toLocaleDateString()}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Toggle between subscription plans, convive black, and one-time tickets */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={selectedType === 'subscription' ? 'default' : 'outline'}
            onClick={() => setSelectedType('subscription')}
          >
            Monthly Subscriptions
          </Button>
          <Button
            variant={selectedType === 'convive-black' ? 'default' : 'outline'}
            onClick={() => setSelectedType('convive-black')}
          >
            Convive Black
          </Button>
          <Button
            variant={selectedType === 'ticket' ? 'default' : 'outline'}
            onClick={() => setSelectedType('ticket')}
          >
            One-time Ticket
          </Button>
        </div>

        {/* Display Stripe API warning */}
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <AlertTitle className="text-yellow-800">Demo Mode</AlertTitle>
          <AlertDescription className="text-yellow-700">
            This is running in demo mode without Stripe API keys. In production, users would be redirected to a Stripe payment page.
          </AlertDescription>
        </Alert>

        {/* Display special promo for subscriptions */}
        {selectedType === 'subscription' && (
          <div className="mb-8 rounded-lg bg-primary/5 border border-primary/20 p-6 text-center">
            <h3 className="text-2xl font-semibold text-primary mb-2">Join the Convive Community: First 2 Months, On Us</h3>
            <p className="text-gray-700 mb-4 max-w-3xl mx-auto">
              Experience the unparalleled value of our culinary connections with zero financial commitment. 
              We're so confident in the quality of our dining experiences that we're offering your first two months 
              complimentary when you join our Basic, Standard, or Premium membership tiers. No hidden fees, just 
              exceptional dining experiences from day one.
            </p>
            <div className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span>Limited time offer</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary ml-1"></span>
            </div>
          </div>
        )}

        {/* Display relevant options based on selection */}
        {selectedType === 'subscription' && renderSubscriptionPlans()}
        {selectedType === 'convive-black' && renderConviveBlack()}
        {selectedType === 'ticket' && renderTicketOption()}
      </div>
    </div>
  );
}