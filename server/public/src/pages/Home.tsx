import Hero from "../components/sections/Hero";
import HowItWorks from "../components/sections/HowItWorks";
import UpcomingMeetups from "../components/sections/UpcomingMeetups";
import FeaturedRestaurants from "../components/sections/FeaturedRestaurants";
import CompatibleMatches from "../components/sections/CompatibleMatches";
import JoinCTA from "../components/sections/JoinCTA";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Tab Navigation for mobile */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto whitespace-nowrap px-4 py-2">
          <a href="#" className="font-medium text-primary border-b-2 border-primary px-3 py-2 text-sm">Home</a>
          <a href="#" className="font-medium text-gray-600 hover:text-primary px-3 py-2 text-sm">Explore</a>
          <a href="#" className="font-medium text-gray-600 hover:text-primary px-3 py-2 text-sm">My Meetups</a>
          <a href="#" className="font-medium text-gray-600 hover:text-primary px-3 py-2 text-sm">Messages</a>
        </div>
      </div>
      
      <Hero />
      <HowItWorks />
      <UpcomingMeetups />
      <FeaturedRestaurants />
      {isAuthenticated && <CompatibleMatches />}
      <JoinCTA />
    </div>
  );
}
