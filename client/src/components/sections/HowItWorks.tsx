import { UserRound, CalendarDays, MapPin, GlassWater } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <UserRound className="h-6 w-6" />,
      title: "Let Us Get to Know You",
      description: "Share your culinary preferences, conversation interests, and dining style to find compatible dining companions.",
      number: "01"
    },
    {
      icon: <CalendarDays className="h-6 w-6" />,
      title: "Choose Your Time",
      description: "Browse available dining times at our exclusive restaurant partners based on your schedule.",
      number: "02"
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Join the Table",
      description: "Meet your dedicated host and fellow guests for an evening of exceptional food and engaging conversation.",
      number: "03"
    },
    {
      icon: <GlassWater className="h-6 w-6" />,
      title: "Savor & Learn",
      description: "Enjoy a curated dining experience while learning about fine cuisine from your expert restaurant host.",
      number: "04"
    }
  ];

  return (
    <div className="bg-slate-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-serif text-gray-900 sm:text-4xl">How Convive Works</h2>
          <div className="h-1 w-20 bg-primary mx-auto mt-4"></div>
          <p className="mt-6 text-lg text-slate-600">
            We connect you with compatible dining companions at exclusive restaurants, creating personalized experiences that blend culinary discovery with meaningful conversation.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="absolute -top-6 -left-6 text-7xl font-serif text-slate-100 select-none">
                {step.number}
              </div>
              <div className="bg-white border border-slate-100 rounded-sm shadow-md p-8 relative">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-sm bg-primary/10 text-primary mb-5">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-3 text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-primary/5 border border-primary/10 rounded-sm p-8 text-center">
          <h3 className="text-xl font-medium text-gray-900">What Makes Convive Different</h3>
          <p className="mt-3 text-slate-600 max-w-3xl mx-auto">
            Unlike typical dining reservations, Convive matches you with compatible dining companions based on your preferences.
            Each experience includes a dedicated restaurant host who ensures conversation flows naturally and provides expert 
            insight into the cuisine. Your first drink is complimentary, creating a welcoming atmosphere for connection and 
            culinary discovery at the finest restaurants in your city.
          </p>
        </div>
      </div>
    </div>
  );
}
