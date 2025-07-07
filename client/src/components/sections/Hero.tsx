import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { GlassWater, UtensilsCrossed } from "lucide-react";

export default function Hero() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-white text-slate-700">
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-0.5 w-10 bg-slate-300"></div>
              <p className="text-slate-500 font-medium uppercase tracking-wider text-sm">Convive</p>
            </div>
            <h1 className="text-4xl font-bold font-serif tracking-tight sm:text-5xl md:text-6xl">
              <span className="block text-slate-800">Curated Dining</span>
              <span className="block text-slate-600">Extraordinary Connections</span>
            </h1>
            <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-xl">
              Join an exclusive community where fine dining becomes a social adventure. Engage in thoughtful conversation, savor exceptional cuisine, and learn from a dedicated host at the finest restaurants in your city.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <>
                  <Button asChild size="lg" className="bg-slate-800 text-white hover:bg-slate-700 rounded-sm shadow-sm">
                    <Link href="/table-access">Browse Experiences</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-slate-300 text-slate-600 hover:bg-slate-50 rounded-sm">
                    <Link href="/my-meetups">View My Reservations</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-slate-800 text-white hover:bg-slate-700 rounded-sm shadow-sm">
                    <Link href="/auth?tab=register">Request Membership</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-slate-300 text-slate-600 hover:bg-slate-50 rounded-sm">
                    <Link href="/table-access">Browse Experiences</Link>
                  </Button>
                </>
              )}
            </div>
            <div className="mt-10 grid grid-cols-2 gap-8">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-sm bg-white/90 border border-slate-100 shadow-sm">
                  <UtensilsCrossed className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800">Curated Experiences</h3>
                  <p className="mt-1 text-sm text-slate-500">4-6 guests + dedicated host at exclusive partner restaurants</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-sm bg-white/90 border border-slate-100 shadow-sm">
                  <GlassWater className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800">Guided Discovery</h3>
                  <p className="mt-1 text-sm text-slate-500">Educated by a restaurant expert on fine cuisine and dining culture</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 lg:mt-0 relative">
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-slate-50 rounded-full filter blur-xl"></div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-slate-100 rounded-full filter blur-xl"></div>
            <img 
              className="rounded-sm shadow-2xl relative z-10 object-cover h-full w-full" 
              src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Luxury dining experience at Convive" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
