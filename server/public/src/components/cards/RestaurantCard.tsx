import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Heart, Star, MapPin, Menu, Award } from "lucide-react";
import { Button } from "../ui/button";
import { Award as AwardType } from "@/types/restaurant";

interface RestaurantCardProps {
  restaurant: {
    id: number;
    name: string;
    cuisineType: string;
    ambiance: string;
    noiseLevel: string;
    rating: string;
    distance: string;
    imageUrl: string;
    menuUrl: string;
    awards?: AwardType[] | null;
  };
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  
  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <Card className="overflow-hidden border border-slate-100 rounded-sm shadow-sm hover:shadow transition-shadow duration-300 bg-white">
      <div className="relative">
        <img 
          className="h-64 w-full object-cover" 
          src={restaurant.imageUrl} 
          alt={restaurant.name} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        <button 
          className="absolute top-4 right-4 bg-white/90 rounded-sm p-1.5 shadow-sm z-10 hover:bg-white transition-colors"
          onClick={toggleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-slate-500 text-slate-500' : 'text-slate-700'}`} />
        </button>
        
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <Badge variant="secondary" className="bg-white/90 text-slate-700 hover:bg-white text-xs px-2.5 py-1 rounded-sm border border-slate-100">
            EXCLUSIVE PARTNER
          </Badge>
          
          {/* Awards Badge */}
          {restaurant.awards && restaurant.awards.length > 0 && (
            <Badge variant="secondary" className="bg-amber-50/90 text-amber-800 hover:bg-amber-50 text-xs px-2.5 py-1 rounded-sm border border-amber-200 flex items-center gap-1.5">
              <Award className="h-3 w-3" />
              {restaurant.awards.length > 1 ? `${restaurant.awards.length} AWARDS` : '1 AWARD'}
            </Badge>
          )}
        </div>
        
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <h3 className="text-xl font-serif font-bold text-white">{restaurant.name}</h3>
          <p className="text-white/90 text-sm mt-1">{restaurant.cuisineType}</p>
        </div>
      </div>
      
      <CardContent className="p-6 bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-slate-500 mr-1.5" />
            <span className="text-slate-800 font-medium">{restaurant.rating}</span>
            <span className="mx-2 text-slate-300">•</span>
            <span className="text-slate-500">{restaurant.ambiance}</span>
            
            {/* Award indicator in details section */}
            {restaurant.awards && restaurant.awards.length > 0 && (
              <>
                <span className="mx-2 text-slate-300">•</span>
                <div className="group relative">
                  <div className="flex items-center text-amber-600 cursor-pointer">
                    <Award className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Award Winner</span>
                  </div>
                  
                  {/* Tooltip with awards preview */}
                  <div className="absolute left-0 bottom-full mb-2 w-64 bg-white shadow-lg rounded-md border border-slate-200 p-3 text-sm hidden group-hover:block z-20">
                    <h4 className="font-medium text-slate-900 mb-1.5">Awards & Recognition</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {restaurant.awards.slice(0, 3).map((award, index) => (
                        <div key={index} className={index > 0 ? "pt-2 border-t border-slate-100" : ""}>
                          <div className="flex justify-between">
                            <p className="font-medium text-slate-800">{award.name}</p>
                            <span className="text-xs bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">{award.year}</span>
                          </div>
                          <p className="text-xs text-slate-600">{award.organization}</p>
                        </div>
                      ))}
                      {restaurant.awards.length > 3 && (
                        <p className="text-xs text-slate-500 italic text-center pt-1">
                          +{restaurant.awards.length - 3} more awards
                        </p>
                      )}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 text-center">
                      <Link href={`/restaurant/${restaurant.id}`} className="text-xs text-primary hover:text-primary/80">
                        View all awards
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center text-slate-500 text-sm">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{restaurant.distance}</span>
          </div>
        </div>
        
        <p className="text-slate-500 text-sm mb-5 leading-relaxed">
          Experience {restaurant.ambiance} dining at one of our most exclusive partner venues. 
          A dedicated host from {restaurant.name} will guide you through their exceptional menu.
        </p>
        
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="text-slate-500 border-slate-100 rounded-sm">
            {restaurant.noiseLevel} Atmosphere
          </Badge>
          
          <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-sm border-slate-300 text-slate-600 hover:bg-slate-50">
            <Link href={`/restaurant/${restaurant.id}`}>
              <Menu className="h-4 w-4" />
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
