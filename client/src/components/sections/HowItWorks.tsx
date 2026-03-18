import { UserRound, CalendarDays, MapPin, GlassWater } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <UserRound className="h-6 w-6" />,
      title: "Let Us Get to Know You",
      description: "Let us get to know you so we can tailor the perfect experience for you.",
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
      title: "Experience the Best",
      description: "Your host reveals the craft and artistry behind every plate, the stories, and the details most diners never get to see.",
      number: "03"
    },
    {
      icon: <GlassWater className="h-6 w-6" />,
      title: "Savor & Learn",
      description: "Every detail is elevated and bespoke, so you can simply sit back and enjoy your meal with the expert.",
      number: "04"
    }
  ];

  return (
    <div className="bg-slate-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-serif text-gray-900 sm:text-4xl">How Convive Works</h2>
          <div className="h-1 w-20 bg-primary mx-auto mt-4"></div>
          <p className="mt-6 text-lg text-slate-600">Every Convive evening features someone who deeply knows the restaurant, its kitchen, its philosophy, the hidden details that make each venue extraordinary, and we provide perfect company to enjoy it with.</p>
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
          <p className="mt-3 text-slate-600 max-w-3xl mx-auto">Unlike typical dining reservations, every Convive evening features a host who works at the restaurant and knows it from the inside. They'll help you see the restaurant in a new light, acting as a concierge for your palate, and making sure everyone experiences the best dinner the restaurant could offer. Your first drink is guided by the host, completely complimentary, setting the tone for an evening of exceptional dining at the finest restaurants in your city.</p>
        </div>
      </div>
    </div>
  );
}
