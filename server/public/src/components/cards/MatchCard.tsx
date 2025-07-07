import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { useState } from "react";

interface MatchCardProps {
  match: {
    id: number;
    fullName: string;
    age: number;
    occupation: string;
    profilePicture?: string;
    compatibilityScore: number;
    preferences: {
      interests: string[];
      diningPreferences: {
        noisePreference: string;
        drinkPreference: string;
        cuisinePreference: string;
        groupSizePreference: string;
      };
    };
  };
}

export default function MatchCard({ match }: MatchCardProps) {
  const [connecting, setConnecting] = useState(false);
  
  const handleConnect = () => {
    setConnecting(true);
    // In a real app, this would make an API call to initiate the connection
    setTimeout(() => {
      setConnecting(false);
    }, 1000);
  };

  return (
    <Card className="overflow-hidden border border-gray-200 flex flex-col">
      <div className="relative">
        <img 
          className="h-56 w-full object-cover" 
          src={match.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.fullName)}&background=FF5A5F&color=fff`} 
          alt={match.fullName} 
        />
        <div className="absolute top-0 right-0 bg-primary text-white font-bold rounded-bl-lg py-1 px-3">
          {match.compatibilityScore}% Match
        </div>
      </div>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold font-poppins">{match.fullName}, {match.age}</h3>
            <p className="text-gray-600 text-sm">{match.occupation}</p>
          </div>
        </div>
        
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-600">Interests</h4>
          <div className="mt-1 flex flex-wrap gap-1">
            {match.preferences.interests.slice(0, 3).map((interest, index) => (
              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary bg-opacity-10 text-primary">
                {interest}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-600">Dining Preferences</h4>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <i className={`fas fa-volume-${match.preferences.diningPreferences.noisePreference === 'Quiet' ? 'down' : 'up'} text-gray-400 mr-2`}></i>
              <span className="text-gray-600 text-sm">{match.preferences.diningPreferences.noisePreference} places</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-wine-glass-alt text-gray-400 mr-2"></i>
              <span className="text-gray-600 text-sm">{match.preferences.diningPreferences.drinkPreference}</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-utensils text-gray-400 mr-2"></i>
              <span className="text-gray-600 text-sm">{match.preferences.diningPreferences.cuisinePreference}</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-users text-gray-400 mr-2"></i>
              <span className="text-gray-600 text-sm">{match.preferences.diningPreferences.groupSizePreference}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <div className="px-4 pb-4">
        <Button 
          className="w-full bg-primary hover:bg-primary/90"
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? "Connecting..." : "Connect"}
        </Button>
      </div>
    </Card>
  );
}
