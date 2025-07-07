import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [geolocation, setGeolocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    city: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeolocation(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return;
    }

    // Get position from browser geolocation API
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Update state with coordinates immediately
          setGeolocation(prev => ({
            ...prev,
            latitude,
            longitude,
            loading: true, // Still loading while we get the city
          }));

          // First, try OpenStreetMap Nominatim geocoding service
          try {
            // OpenStreetMap Nominatim is a free service but rate limited
            const osResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'en',
                  'User-Agent': 'Convive-App' // Be respectful with User-Agent for Nominatim API
                }
              }
            );
            
            if (osResponse.ok) {
              const osData = await osResponse.json();
              
              // Extract city from OSM response - try different fields
              const city = 
                osData.address?.city || 
                osData.address?.town || 
                osData.address?.village || 
                osData.address?.suburb ||
                osData.address?.county ||
                null;
              
              if (city) {
                // Update state with city name if found
                setGeolocation(prev => ({
                  ...prev,
                  city,
                  loading: false,
                }));
                return; // Exit if we got the city
              }
            }
          } catch (osmError) {
            // Silently fail and try fallback service
            console.warn('OpenStreetMap geocoding failed:', osmError);
          }

          // Fallback to BigDataCloud
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (!response.ok) {
            throw new Error('Failed to get location information');
          }
          
          const data = await response.json();
          const city = data.city || data.locality || data.principalSubdivision || null;
          
          // Update state with city name
          setGeolocation(prev => ({
            ...prev,
            city,
            loading: false,
          }));
        } catch (error) {
          setGeolocation(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'An unknown error occurred',
            loading: false,
          }));
        }
      },
      (error) => {
        let errorMessage = 'An unknown error occurred';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please allow location access to use this feature.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please try again later.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get your location timed out. Please try again.';
            break;
        }
        
        setGeolocation(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // Increased timeout to 10 seconds for better accuracy
        maximumAge: 0,
      }
    );
  }, []);

  return geolocation;
}