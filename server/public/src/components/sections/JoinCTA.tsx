import { Button } from "../ui/button";
import { Link } from "wouter";
import { useAuth } from "../../hooks/useAuth";
import { CheckCircle } from "lucide-react";

export default function JoinCTA() {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) return null;

  const membershipBenefits = [
    "Be matched with compatible dining companions",
    "Enjoy your first drink complimentary at each meal",
    "Learn about fine cuisine from your dedicated host",
    "Connect through meaningful conversation",
    "Discover exclusive partner restaurants"
  ];

  return (
    <div className="bg-slate-800 text-slate-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-slate-700 px-4 py-2 rounded-sm mb-4 border border-slate-600">
              <span className="text-sm font-medium uppercase tracking-wide text-amber-300">Limited Membership</span>
            </div>
            <h2 className="text-4xl font-serif font-bold mb-6 text-slate-50">Become a Convive Member</h2>
            <p className="text-lg mb-8 leading-relaxed text-slate-300">
              Join our exclusive community of discerning professionals who value exceptional dining experiences and meaningful connections.
            </p>
            
            <div className="space-y-4 mb-10">
              {membershipBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-3 mt-0.5 text-amber-300" />
                  <span className="text-slate-200">{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
                <Link href="/auth?tab=register">
                  Request Membership
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-500 text-slate-200 hover:bg-slate-700 rounded-md">
                <Link href="/table-access">
                  Dining Options
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-800/70 to-transparent rounded-sm"></div>
            <img 
              src="https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Fine dining experience" 
              className="rounded-sm shadow-xl object-cover h-full w-full" 
            />
            <div className="absolute bottom-6 left-6 right-6 bg-slate-900/80 backdrop-blur-sm rounded-sm p-6 border border-slate-700">
              <p className="text-lg font-medium mb-2 text-slate-50">"Convive has transformed my dining experiences in the city."</p>
              <p className="text-amber-300">— Alexandra C., Finance Executive</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
