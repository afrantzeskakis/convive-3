import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useDevice } from "../../hooks/useDevice";
import { useGeolocation } from "../../hooks/useGeolocation";
import { Loader2, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

interface LocationPageProps {
  initialCity?: string | null;
  onUpdate: (city: string) => void;
  onBack: () => void;
}

export default function LocationPage({ initialCity, onUpdate, onBack }: LocationPageProps) {
  const [city, setCity] = useState<string>(initialCity || "");
  const { isMobile, isTablet } = useDevice();
  const { city: detectedCity, loading: geoLoading, error: geoError } = useGeolocation();

  // Use geolocation data when available
  useEffect(() => {
    if (detectedCity && !city) {
      setCity(detectedCity);
    }
  }, [detectedCity, city]);

  const handleNext = () => {
    if (city) {
      onUpdate(city);
    }
  };

  // Top 75 most populated cities in the United States
  const popularCities = [
    "New York City", 
    "Los Angeles", 
    "Chicago", 
    "Houston", 
    "Phoenix", 
    "Philadelphia", 
    "San Antonio", 
    "San Diego", 
    "Dallas", 
    "San Jose", 
    "Austin", 
    "Jacksonville", 
    "Fort Worth", 
    "Columbus", 
    "Indianapolis", 
    "Charlotte", 
    "San Francisco", 
    "Seattle", 
    "Denver", 
    "Washington DC", 
    "Nashville", 
    "Oklahoma City", 
    "El Paso", 
    "Boston", 
    "Portland", 
    "Las Vegas", 
    "Detroit", 
    "Memphis", 
    "Louisville", 
    "Baltimore", 
    "Milwaukee", 
    "Albuquerque", 
    "Tucson", 
    "Fresno", 
    "Sacramento", 
    "Kansas City", 
    "Mesa", 
    "Atlanta", 
    "Omaha", 
    "Colorado Springs", 
    "Raleigh", 
    "Miami", 
    "Long Beach", 
    "Virginia Beach", 
    "Oakland", 
    "Minneapolis", 
    "Tampa", 
    "Tulsa", 
    "Arlington", 
    "Wichita", 
    "Bakersfield", 
    "Aurora", 
    "New Orleans", 
    "Cleveland", 
    "Anaheim", 
    "Honolulu", 
    "Riverside", 
    "Santa Ana", 
    "Corpus Christi", 
    "Lexington", 
    "Henderson", 
    "Stockton", 
    "Saint Paul", 
    "Cincinnati", 
    "St. Louis", 
    "Pittsburgh", 
    "Greensboro", 
    "Lincoln", 
    "Anchorage", 
    "Plano", 
    "Orlando", 
    "Irvine", 
    "Newark", 
    "Toledo"
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 
          className={`${isTablet ? 'text-3xl' : 'text-2xl'} font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent`}
        >
          Where are you located?
        </h2>
        <p className={`text-muted-foreground ${isTablet ? 'text-lg' : ''}`}>
          Letting us know your city helps us find restaurants and dining companions near you.
        </p>
      </div>

      {/* Location detection status */}
      {geoLoading && (
        <div className="flex items-center gap-2 py-2 text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Detecting your location...</span>
        </div>
      )}

      {geoError && (
        <Alert className="bg-amber-50 border-amber-200">
          <MapPin className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700">
            {geoError}. Please select your city manually.
          </AlertDescription>
        </Alert>
      )}

      {detectedCity && (
        <Alert className="bg-emerald-50 border-emerald-200">
          <MapPin className="h-4 w-4 text-emerald-500" />
          <AlertDescription className="text-emerald-700">
            We detected your location as <strong>{detectedCity}</strong>. You can change it if needed.
          </AlertDescription>
        </Alert>
      )}

      <div 
        className={`
          rounded-lg bg-primary/5 p-6 border border-primary/10
          ${isTablet ? 'my-6' : 'my-4'}
        `}
      >
        <div className="space-y-4">
          <Label 
            htmlFor="city-select"
            className={`text-${isTablet ? 'lg' : 'base'} font-medium`}
          >
            Select your city
          </Label>
          
          <Select
            value={city}
            onValueChange={setCity}
          >
            <SelectTrigger 
              id="city-select"
              className={`w-full ${isTablet ? 'h-12 text-lg' : ''}`}
            >
              <SelectValue placeholder="Choose your city" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <div className="px-3 pb-2">
                <input 
                  className="w-full rounded-md border border-input px-3 py-2 text-sm"
                  placeholder="Search for a city..."
                  onChange={(e) => {
                    // Use the select's built-in filtering by adding a data-attribute
                    const searchValue = e.target.value.toLowerCase();
                    document.querySelectorAll('.city-option').forEach(el => {
                      const cityName = el.getAttribute('data-value')?.toLowerCase() || '';
                      if (cityName.includes(searchValue)) {
                        el.removeAttribute('hidden');
                      } else {
                        el.setAttribute('hidden', 'true');
                      }
                    });
                  }}
                />
              </div>
              
              {detectedCity && !popularCities.includes(detectedCity) && (
                <SelectItem 
                  key={detectedCity} 
                  value={detectedCity}
                  className={`city-option ${isTablet ? 'text-lg py-2' : ''}`}
                  data-value={detectedCity}
                >
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-2 text-primary" />
                    <span>{detectedCity} <span className="text-xs opacity-70">(Detected)</span></span>
                  </div>
                </SelectItem>
              )}
              
              {/* Sort cities alphabetically */}
              {[...popularCities].sort().map((cityName) => (
                <SelectItem 
                  key={cityName} 
                  value={cityName}
                  className={`city-option ${isTablet ? 'text-lg py-2' : ''}`}
                  data-value={cityName}
                >
                  {cityName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-muted-foreground">
              Don't see your city? Choose the nearest major city.
            </p>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => detectedCity && setCity(detectedCity)}
              disabled={!detectedCity || geoLoading}
              className="text-xs flex items-center gap-1"
            >
              <MapPin className="h-3 w-3" />
              Auto-detect
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-between">
        <Button 
          onClick={onBack} 
          variant="outline"
          className={isTablet ? 'text-base py-6 px-8' : ''}
        >
          Back
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!city}
          className={isTablet ? 'text-base py-6 px-8' : ''}
        >
          Next
        </Button>
      </div>
    </div>
  );
}