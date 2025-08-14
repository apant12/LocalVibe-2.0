import { useEffect, useState } from "react";
import { useLocation } from "@/components/LocationContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Loader2, Navigation } from "lucide-react";

// Popular cities data to match against detected location
const CITY_MAPPING = [
  { name: "San Francisco", coordinates: { lat: 37.7749, lng: -122.4194 }, radius: 50 },
  { name: "New York", coordinates: { lat: 40.7128, lng: -74.0060 }, radius: 50 },
  { name: "Los Angeles", coordinates: { lat: 34.0522, lng: -118.2437 }, radius: 50 },
  { name: "Chicago", coordinates: { lat: 41.8781, lng: -87.6298 }, radius: 50 },
  { name: "Miami", coordinates: { lat: 25.7617, lng: -80.1918 }, radius: 50 },
  { name: "Austin", coordinates: { lat: 30.2672, lng: -97.7431 }, radius: 50 },
  { name: "London", coordinates: { lat: 51.5074, lng: -0.1278 }, radius: 50 },
  { name: "Paris", coordinates: { lat: 48.8566, lng: 2.3522 }, radius: 50 },
  { name: "Tokyo", coordinates: { lat: 35.6762, lng: 139.6503 }, radius: 50 },
  { name: "Berlin", coordinates: { lat: 52.5200, lng: 13.4050 }, radius: 50 },
];

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function findNearestCity(lat: number, lng: number) {
  let nearestCity = null;
  let minDistance = Infinity;

  for (const city of CITY_MAPPING) {
    const distance = calculateDistance(lat, lng, city.coordinates.lat, city.coordinates.lng);
    if (distance < city.radius && distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }

  return nearestCity;
}

export default function LocationDetector() {
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const { currentCity, setCurrentCity } = useLocation();
  const { toast } = useToast();

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location detection",
        variant: "destructive",
      });
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nearestCity = findNearestCity(latitude, longitude);
        
        if (nearestCity && nearestCity.name !== currentCity.name) {
          setDetectedCity(nearestCity.name);
          setShowPrompt(true);
        } else {
          toast({
            title: "Location Updated",
            description: nearestCity 
              ? `You're already in ${nearestCity.name}`
              : "No supported city detected in your area",
          });
        }
        setIsDetecting(false);
      },
      (error) => {
        console.error("Location detection error:", error);
        setIsDetecting(false);
        toast({
          title: "Location Detection Failed",
          description: "Unable to detect your current location",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const handleCitySwitch = (switchToDetected: boolean) => {
    if (switchToDetected && detectedCity) {
      const cityData = CITY_MAPPING.find(c => c.name === detectedCity);
      if (cityData) {
        setCurrentCity({
          id: cityData.name.toLowerCase().replace(' ', ''),
          name: cityData.name,
          country: cityData.name.includes('London') || cityData.name.includes('Paris') || cityData.name.includes('Berlin') 
            ? (cityData.name === 'London' ? 'United Kingdom' : cityData.name === 'Paris' ? 'France' : 'Germany')
            : cityData.name === 'Tokyo' ? 'Japan' : 'United States',
          timezone: cityData.name === 'Tokyo' ? 'Asia/Tokyo' 
            : cityData.name === 'London' ? 'Europe/London'
            : cityData.name === 'Paris' ? 'Europe/Paris'
            : cityData.name === 'Berlin' ? 'Europe/Berlin'
            : cityData.name.includes('Los Angeles') || cityData.name.includes('San Francisco') ? 'America/Los_Angeles'
            : cityData.name.includes('Chicago') || cityData.name.includes('Austin') ? 'America/Chicago'
            : 'America/New_York',
          coordinates: cityData.coordinates,
          isPopular: true,
        });
        toast({
          title: "City Switched",
          description: `Now exploring experiences in ${detectedCity}`,
          className: "bg-green-600 text-white",
        });
      }
    }
    setShowPrompt(false);
    setDetectedCity(null);
  };

  // Auto-detect location on first load (optional)
  useEffect(() => {
    const hasAskedForLocation = localStorage.getItem('localvibe-location-asked');
    if (!hasAskedForLocation) {
      localStorage.setItem('localvibe-location-asked', 'true');
      // Optionally auto-detect on first visit
      // detectLocation();
    }
  }, []);

  if (showPrompt && detectedCity) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
        <Card className="bg-black border-primary">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Navigation className="w-5 h-5 text-primary mt-1" />
              <div className="flex-1">
                <h4 className="text-white font-semibold text-sm">
                  Location Detected
                </h4>
                <p className="text-gray-300 text-xs mt-1">
                  We detected you're in {detectedCity}. Switch to see local experiences?
                </p>
                <div className="flex space-x-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => handleCitySwitch(true)}
                    className="bg-primary hover:bg-primary/90 text-black text-xs px-3 py-1"
                  >
                    Switch to {detectedCity}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCitySwitch(false)}
                    className="text-gray-400 hover:text-white text-xs px-3 py-1"
                  >
                    Stay in {currentCity.name}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Button
      onClick={detectLocation}
      disabled={isDetecting}
      size="sm"
      variant="ghost"
      className="text-gray-400 hover:text-white"
    >
      {isDetecting ? (
        <Loader2 className="w-4 h-4 animate-spin mr-1" />
      ) : (
        <Navigation className="w-4 h-4 mr-1" />
      )}
      {isDetecting ? "Detecting..." : "Detect Location"}
    </Button>
  );
}