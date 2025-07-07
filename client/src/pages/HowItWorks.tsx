import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Users, Utensils, Award, MessageSquare, 
  Clock, CreditCard, Heart, MapPin, Check
} from "lucide-react";
import { Link } from "wouter";

export default function HowItWorks() {
  // Track which step is currently expanded on mobile
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  
  // Toggle a step's expanded state for mobile view
  const toggleStep = (stepIndex: number) => {
    setExpandedStep(expandedStep === stepIndex ? null : stepIndex);
  };
  
  // Define the steps
  const steps = [
    {
      title: "Let Us Get to Know You",
      description: "Complete our match questionnaire and find dining meetups with compatible guests who share your interests and conversation style.",
      icon: <Users className="h-8 w-8 text-primary" />,
      details: "Our matching algorithm uses your questionnaire responses to find compatible dining companions. We consider conversation topics, dining preferences, and social style to create groups of 4-6 people who are likely to enjoy each other's company while our dedicated host ensures everyone feels welcome."
    },
    {
      title: "Choose Your Time",
      description: "Select from available dining times at our exclusive restaurant partners based on your schedule and preferences.",
      icon: <Clock className="h-8 w-8 text-primary" />,
      details: "We offer flexible scheduling options with various time slots throughout the week. Simply browse available dining sessions and select the time that works best for you at one of our carefully curated restaurant partners."
    },
    {
      title: "Secure Your Seat",
      description: "Purchase a dinner ticket to reserve your place at the table. Different ticket tiers provide access to various dining experiences.",
      icon: <CreditCard className="h-8 w-8 text-primary" />,
      details: "Our tiered ticket system allows access to different dining experiences. From regular tables at partner restaurants to exclusive high-roller experiences, you can choose the dining adventure that fits your preferences and budget."
    },
    {
      title: "Enjoy the Experience",
      description: "Arrive at the restaurant where you'll be greeted by your host and fellow diners for an evening of excellent food and engaging conversation.",
      icon: <Heart className="h-8 w-8 text-primary" />,
      details: "Your dedicated restaurant host will welcome you, make introductions, and guide the dining experience. They'll share insights about menu selections, wine pairings, and the story behind the cuisine while facilitating natural conversation flow among guests."
    },
    {
      title: "Stay Connected",
      description: "After dinner, you can choose to connect with your new acquaintances through our platform's messaging system.",
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      details: "Our platform allows you to stay in touch with the people you connected with during your dinner. Messages are kept within our system to maintain privacy until both parties agree to share contact information."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="max-w-3xl mx-auto mb-16 text-center">
        <h1 className="text-4xl font-bold font-serif mb-6 text-slate-800">How Convive Works</h1>
        <div className="h-0.5 w-20 bg-slate-300 mx-auto mb-6"></div>
        <p className="text-lg text-slate-600">
          Convive transforms dining into a social adventure by connecting food enthusiasts through 
          curated experiences at exclusive restaurants. Here's how our process works:
        </p>
      </div>
      
      {/* Mobile Steps View (accordion-style for small screens) */}
      <div className="md:hidden space-y-4 mb-12">
        {steps.map((step, index) => {
          // Display the correct step number (1 through 5)
          const displayNumber = index + 1;
          
          return (
            <Card 
              key={index} 
              className={`border border-slate-200 overflow-hidden transition-all duration-200 ${
                expandedStep === index ? 'shadow-md' : ''
              }`}
            >
              <div 
                className="p-4 flex justify-between items-center cursor-pointer"
                onClick={() => toggleStep(index)}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded-full flex-shrink-0">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold text-slate-800">
                    {step.title}
                  </h3>
                </div>
                <div className="text-slate-400">
                  {expandedStep === index ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-700">
                      {displayNumber}
                    </div>
                  )}
                </div>
              </div>
              
              {expandedStep === index && (
                <CardContent className="pt-0 pb-4 px-4 border-t border-slate-100">
                  <p className="text-slate-600 mb-3">{step.description}</p>
                  <p className="text-sm text-slate-500">{step.details}</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
      
      {/* Desktop Steps View */}
      <div className="hidden md:flex flex-col mb-16">
        {/* First row - 2 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="border border-slate-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="bg-slate-100 p-3 rounded-full">
                  {steps[0].icon}
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-700">
                  1
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-3">{steps[0].title}</h3>
              <p className="text-slate-600 mb-4">{steps[0].description}</p>
              <p className="text-sm text-slate-500">{steps[0].details}</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="bg-slate-100 p-3 rounded-full">
                  {steps[1].icon}
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-700">
                  2
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-3">{steps[1].title}</h3>
              <p className="text-slate-600 mb-4">{steps[1].description}</p>
              <p className="text-sm text-slate-500">{steps[1].details}</p>
            </CardContent>
          </Card>
        </div>

        {/* Second row - 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-slate-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="bg-slate-100 p-3 rounded-full">
                  {steps[2].icon}
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-700">
                  3
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-3">{steps[2].title}</h3>
              <p className="text-slate-600 mb-4">{steps[2].description}</p>
              <p className="text-sm text-slate-500">{steps[2].details}</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="bg-slate-100 p-3 rounded-full">
                  {steps[3].icon}
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-700">
                  4
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-3">{steps[3].title}</h3>
              <p className="text-slate-600 mb-4">{steps[3].description}</p>
              <p className="text-sm text-slate-500">{steps[3].details}</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="bg-slate-100 p-3 rounded-full">
                  {steps[4].icon}
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-700">
                  5
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-3">{steps[4].title}</h3>
              <p className="text-slate-600 mb-4">{steps[4].description}</p>
              <p className="text-sm text-slate-500">{steps[4].details}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Benefits Section */}
      <div className="bg-slate-50 rounded-lg p-8 mb-16">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold font-serif mb-4 text-slate-800">The Convive Difference</h2>
          <p className="text-slate-600">
            What makes our dining experiences unique and memorable.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-4">
            <Award className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Exclusive Restaurants</h3>
            <p className="text-slate-600">
              Access to high-end restaurants with exclusivity agreements, ensuring a unique dining environment.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <Users className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Dedicated Hosts</h3>
            <p className="text-slate-600">
              Restaurant hosts who educate about cuisine and ensure engaging conversation throughout the meal.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <Heart className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Meaningful Connections</h3>
            <p className="text-slate-600">
              Curated groups of like-minded individuals who share your passion for culinary experiences.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <Clock className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Time Well Spent</h3>
            <p className="text-slate-600">
              No awkward silences or forced conversations — our hosts ensure a natural, enjoyable flow.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <MapPin className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Curated Venues</h3>
            <p className="text-slate-600">
              Handpicked restaurants known for exceptional food and ambiance, perfect for social dining.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <MessageSquare className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Privacy Respected</h3>
            <p className="text-slate-600">
              Our platform keeps your information secure while enabling connections after your dining experience.
            </p>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-bold font-serif mb-8 text-center text-slate-800">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">How much does it cost?</h3>
            <p className="text-slate-600">
              We offer different ticket tiers starting at $25 for standard dining experiences. 
              Premium and high-roller experiences have different price points, and all pricing 
              is transparent before you make a reservation. The ticket price covers your seat reservation 
              and your first drink. All other food and beverages will be paid by you directly at the restaurant.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">What if I have dietary restrictions?</h3>
            <p className="text-slate-600">
              We accommodate all dietary restrictions and allergies. During the reservation process, 
              you'll be able to specify any special dietary needs, and the restaurant will be 
              notified in advance to prepare accordingly.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Can I join as a solo diner?</h3>
            <p className="text-slate-600">
              Absolutely! Many of our guests join as solo diners. It's a great way to meet new 
              people and enjoy a social dining experience without organizing a group yourself.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">How are dining groups formed?</h3>
            <p className="text-slate-600">
              We curate groups based on dining preferences, interests, and conversation 
              compatibility. The goal is to create a balanced table where everyone can engage 
              and enjoy meaningful interactions while appreciating great food.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">What is the role of the restaurant host?</h3>
            <p className="text-slate-600">
              The restaurant host is an experienced staff member who welcomes guests, makes 
              introductions, shares culinary insights, and ensures conversation flows naturally. 
              They enhance your dining experience with their knowledge while facilitating connections 
              among guests.
            </p>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-primary/5 rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold font-serif mb-4 text-slate-800">Ready to Experience Convive?</h2>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
          Join our community of food enthusiasts and start enjoying memorable dining experiences 
          with engaging conversation and new connections.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth">
            <Button size="lg" className="min-w-[180px]">
              Sign Up Now
            </Button>
          </Link>
          
          <Link href="/restaurant-partners">
            <Button variant="outline" size="lg" className="min-w-[180px]">
              View Restaurants
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}