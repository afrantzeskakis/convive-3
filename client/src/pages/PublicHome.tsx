import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import JoinCTA from "@/components/sections/JoinCTA";
import PwaStatus from "@/components/PwaStatus";
import { Link } from "wouter";

// A simplified version of the home page for public (non-authenticated) users
export default function PublicHome() {
  return (
    <div>
      <Hero />
      <HowItWorks />
      
      {/* Public CTA section */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-6">Learn More About Convive</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Want to know more about how Convive works and the exclusive restaurants we've partnered with?
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/how-it-works">
              <button className="bg-white border border-primary text-primary hover:bg-primary/5 px-6 py-3 rounded-lg font-medium">
                How It Works
              </button>
            </Link>
            <Link href="/about">
              <button className="bg-white border border-primary text-primary hover:bg-primary/5 px-6 py-3 rounded-lg font-medium">
                About Us
              </button>
            </Link>
            <Link href="/restaurant-partners">
              <button className="bg-white border border-primary text-primary hover:bg-primary/5 px-6 py-3 rounded-lg font-medium">
                Restaurant Partners
              </button>
            </Link>
          </div>
        </div>
      </section>
      
      <JoinCTA />
      
      {/* Temporary PWA Status component to verify installation features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <PwaStatus />
      </div>
    </div>
  );
}