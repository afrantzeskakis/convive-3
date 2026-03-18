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
              Convive places someone inside every restaurant who knows its craft intimately, and gives them the chance to share that world with you.
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
                <h3 className="text-2xl font-serif font-bold text-slate-800 mb-6">Unlocking What Restaurants Do Best</h3>
                <p className="text-slate-500 mb-4 leading-relaxed">Convive was founded on a simple but powerful insight: most people never experience a restaurant at its full potential. The mystique that Anthony Bourdain showed the world, the passion that made Gordon Ramsey famous, and the grit that makes shows like "The Bear" captivating, is completely hidden from the communities they, literally, serve. The best dishes go unordered, the finest wines unpaired, and the chef's true vision unseen.</p>
                <p className="text-slate-500 mb-4 leading-relaxed">We recognized that someone who lives inside a restaurant's world for 50+ hours a week, who has watched the chef perfect a sauce over months, who knows why certain ingredients are sourced from certain places, could open a door that most diners never even know exists because they can't possibly explain it to you on a busy Friday night.</p>
                <p className="text-slate-500 leading-relaxed">
                  Our mission became clear: to place hosts inside the restaurants they love, and let them reveal the artistry, intention, and craft behind every plate. They make every guest feel like an insider, not a visitor, and the intimate table setting naturally sparks great conversation along the way.
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
                <h3 className="text-xl font-serif font-bold text-slate-800 text-center mb-4">Insider Hosts</h3>
                <p className="text-slate-500 leading-relaxed text-center">
                  Every Convive dinner is led by someone who works at the restaurant and knows its world intimately: the craft behind the kitchen, the philosophy on the plate, and the details most diners never see.
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
                  We partner with exceptional restaurants and work directly with their kitchens to craft experiences that showcase their finest dishes and hidden specialties.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
                <div className="flex justify-center mb-6">
                  <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                    <Users className="h-8 w-8 text-slate-500" />
                  </div>
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-800 text-center mb-4">Elevated Every Detail</h3>
                <p className="text-slate-500 leading-relaxed text-center">
                  From wine pairings to course timing, every element is thoughtfully orchestrated so you can simply sit back and enjoy the best the restaurant has to offer.
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
                <h3 className="text-lg font-medium text-slate-800">Your Host</h3>
                <p className="mt-2 text-slate-500">Someone who has fallen in love with this restaurant's craft and can't wait to share it with you, from the chef's obsessions to the story behind the wine list.</p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                    <GlassWater className="h-8 w-8 text-slate-500" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-slate-800">Insider Access</h3>
                <p className="mt-2 text-slate-500">Experience off-menu items, perfect wine pairings, and chef-recommended courses you'd never discover alone.</p>
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
                  Convive is for anyone who believes a great restaurant deserves more than a quick visit. People who want to truly understand and appreciate what makes a kitchen exceptional.
                </p>
                <p className="text-slate-500 mb-4 leading-relaxed">
                  Our members are curious diners who want the insider experience: the dishes the chef is proudest of, the wines that pair perfectly, and the stories that bring a meal to life.
                </p>
                <p className="text-slate-500 leading-relaxed">
                  They appreciate that dining at its best is not just about food. It's about the full experience, expertly guided, with good company as a natural part of the evening.
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
              See what restaurants are truly capable of, through the eyes of someone who knows their craft from the inside.
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