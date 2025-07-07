import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Star, Award, Shield, UtensilsCrossed, GlassWater, Users, Key, Sparkles } from "lucide-react";

export default function AboutUs() {
  // Set the page title programmatically
  document.title = "About Convive | (Come·Vibe) - Our Story and Mission";
  
  return (
    <>

      <div className="bg-white">
        {/* Hero Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="font-serif text-7xl font-bold text-slate-800 mb-4 tracking-tight">Convive</h1>
            <p className="text-lg text-slate-500 uppercase tracking-widest font-light mb-2.5 italic">Definition</p>
            
            <div className="max-w-3xl mx-auto mb-10 border-t border-b border-slate-200 py-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 text-4xl">
                <span className="font-serif font-medium text-slate-700">con·vive</span>
                <span className="text-slate-400 italic font-light tracking-wide mx-2">(Come·Vibe)</span>
                <span className="text-slate-500 font-light">noun</span>
              </div>
              
              <p className="mt-5 text-2xl font-medium text-slate-700">
                A fellow diner; one with whom you feast together
              </p>
              
              <p className="mt-3 text-slate-500 italic font-light">
                From Latin <em>convivere</em> (com- "with" + vivere "to live"),<br/>meaning "to live together, to dine together"
              </p>
            </div>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
              More than just a dining platform, Convive is a curated social experience that brings together culinary excellence and meaningful conversation.
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-serif font-bold text-slate-800">Our Story</h2>
              <div className="h-1 w-20 bg-slate-200 mx-auto mt-4"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-2xl font-serif font-bold text-slate-800 mb-6">A New Kind of Social Dining</h3>
                <p className="text-slate-500 mb-4 leading-relaxed">
                  Convive was founded on a simple but powerful insight: in our increasingly digital world, meaningful face-to-face connections have become rare and valuable.
                </p>
                <p className="text-slate-500 mb-4 leading-relaxed">
                  We recognized that the dining table has always been where the most authentic conversations happen—where strangers become friends and ideas flow freely.
                </p>
                <p className="text-slate-500 leading-relaxed">
                  Our mission became clear: to curate exceptional dining experiences that foster genuine connections between like-minded individuals who value both culinary excellence and stimulating conversation, creating memorable evenings where friendships are formed and ideas are shared.
                </p>
              </div>
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-slate-50 rounded-full filter blur-xl"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-slate-50 rounded-full filter blur-xl"></div>
                <img 
                  src="https://images.unsplash.com/photo-1559329007-40df8a9345d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="People dining together at an elegant restaurant"
                  className="rounded-sm shadow-xl relative z-10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Our Philosophy */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-serif font-bold text-slate-800">Our Philosophy</h2>
              <div className="h-1 w-20 bg-slate-200 mx-auto mt-4"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
                <div className="flex justify-center mb-6">
                  <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                    <Star className="h-8 w-8 text-slate-500" />
                  </div>
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-800 text-center mb-4">Authentic Connection</h3>
                <p className="text-slate-500 leading-relaxed text-center">
                  We believe in creating spaces where authentic human connections flourish through shared experiences and meaningful conversation around the dining table.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
                <div className="flex justify-center mb-6">
                  <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                    <Sparkles className="h-8 w-8 text-slate-500" />
                  </div>
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-800 text-center mb-4">Culinary Excellence</h3>
                <p className="text-slate-500 leading-relaxed text-center">
                  We partner with exceptional restaurants that share our commitment to extraordinary cuisine, expert hospitality, and creating memorable dining experiences.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
                <div className="flex justify-center mb-6">
                  <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                    <Users className="h-8 w-8 text-slate-500" />
                  </div>
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-800 text-center mb-4">Shared Learning</h3>
                <p className="text-slate-500 leading-relaxed text-center">
                  Every Convive experience balances exceptional dining with opportunities to learn, share perspectives, and expand horizons through guided conversation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What Sets Us Apart */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-serif font-bold text-slate-800">What Sets Us Apart</h2>
              <div className="h-1 w-20 bg-slate-200 mx-auto mt-4"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                    <UtensilsCrossed className="h-8 w-8 text-slate-500" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-slate-800">Curated Groups</h3>
                <p className="mt-2 text-slate-500">Groups of 4-6 diners paired with a dedicated restaurant host to ensure engaging conversation.</p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                    <GlassWater className="h-8 w-8 text-slate-500" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-slate-800">Expert Guidance</h3>
                <p className="mt-2 text-slate-500">A restaurant host who educates diners about cuisine while facilitating meaningful conversation.</p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                    <Award className="h-8 w-8 text-slate-500" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-slate-800">Exclusive Partners</h3>
                <p className="mt-2 text-slate-500">Carefully selected high-end restaurants with exclusive agreements to provide unique experiences. <Link href="/restaurant-partners" className="text-slate-700 hover:underline">View our partners</Link>.</p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                    <Key className="h-8 w-8 text-slate-500" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-slate-800">Tiered Access</h3>
                <p className="mt-2 text-slate-500">A thoughtful system of tickets and subscriptions for different levels of table access.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Target Audience */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-white rounded-full filter blur-xl"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white rounded-full filter blur-xl"></div>
                <img 
                  src="https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="Sophisticated diners enjoying a meal"
                  className="rounded-sm shadow-xl relative z-10"
                />
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl font-serif font-bold text-slate-800 mb-6">Who We Serve</h2>
                <p className="text-slate-500 mb-4 leading-relaxed">
                  Convive is designed for sophisticated individuals who value meaningful social interactions and exceptional culinary experiences in a refined atmosphere.
                </p>
                <p className="text-slate-500 mb-4 leading-relaxed">
                  Our members are curious, open-minded individuals who seek to expand their social circles and cultural horizons through the shared language of fine dining.
                </p>
                <p className="text-slate-500 leading-relaxed">
                  They appreciate the curated nature of our experiences, where both the venue and the company have been thoughtfully selected to create memorable evenings of conversation and connection.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Join Us CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-serif font-bold text-slate-800 mb-6"><span className="italic">(Come·Vibe)</span> With Us</h2>
            <p className="text-xl text-slate-500 mb-8 leading-relaxed">
              Join our community of culinary explorers and conversation enthusiasts. Discover a new way to dine, connect, and grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-slate-800 text-white hover:bg-slate-700 rounded-sm shadow-sm">
                <Link href="/restaurant-partners">Restaurant Partners</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-slate-300 text-slate-600 hover:bg-slate-50 rounded-sm">
                <Link href="/table-access">Browse Experiences</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}