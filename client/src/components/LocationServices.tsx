import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "@/components/LocationContext";
import { MapPin, Navigation, Search, Star, Clock, DollarSign } from "lucide-react";

interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  rating: number;
  priceLevel?: number;
  distance: number;
  types: string[];
  photoUrl?: string;
  isOpen?: boolean;
}

export default function LocationServices() {
  const [searchRadius, setSearchRadius] = useState(5000); // 5km default
  const [searchType, setSearchType] = useState('tourist_attraction');
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const { currentCity } = useLocation();
  const { toast } = useToast();

  // Available place types for search
  const placeTypes = [
    { value: 'tourist_attraction', label: 'Tourist Attractions', icon: '🏛️' },
    { value: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { value: 'art_gallery', label: 'Art Galleries', icon: '🎨' },
    { value: 'museum', label: 'Museums', icon: '🏛️' },
    { value: 'park', label: 'Parks', icon: '🌳' },
    { value: 'shopping_mall', label: 'Shopping', icon: '🛍️' },
    { value: 'night_club', label: 'Nightlife', icon: '🌙' },
    { value: 'gym', label: 'Fitness', icon: '💪' },
  ];

  const searchPlacesMutation = useMutation({
    mutationFn: async ({ type, radius }: { type: string; radius: number }) => {
      const response = await apiRequest("GET", 
        `/api/places/nearby?lat=${currentCity.coordinates.lat}&lng=${currentCity.coordinates.lng}&type=${type}&radius=${radius}`
      );
      return response.json();
    },
    onSuccess: (data) => {
      setNearbyPlaces(data.places || []);
      toast({
        title: "Places Found",
        description: `Found ${data.places?.length || 0} places nearby`,
        className: "bg-green-600 text-white",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Search Failed", 
        description: error.message || "Unable to search nearby places",
        variant: "destructive",
      });
    }
  });

  const geocodeMutation = useMutation({
    mutationFn: async (address: string) => {
      const response = await apiRequest("GET", `/api/geocode?address=${encodeURIComponent(address)}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Location Found",
        description: `${data.formattedAddress}`,
        className: "bg-green-600 text-white",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Geocoding Failed",
        description: error.message || "Unable to find location",
        variant: "destructive",
      });
    }
  });

  const handleSearch = () => {
    searchPlacesMutation.mutate({ type: searchType, radius: searchRadius });
  };

  const getPriceDisplay = (level?: number) => {
    if (!level) return 'N/A';
    return '$'.repeat(level) + '·'.repeat(4 - level);
  };

  const getDistanceDisplay = (distance: number) => {
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const formatPlaceTypes = (types: string[]) => {
    return types
      .filter(type => !type.includes('establishment') && !type.includes('point_of_interest'))
      .slice(0, 2)
      .map(type => type.replace(/_/g, ' '))
      .map(type => type.charAt(0).toUpperCase() + type.slice(1))
      .join(', ');
  };

  // Auto-search on city change
  useEffect(() => {
    if (currentCity) {
      handleSearch();
    }
  }, [currentCity.name]);

  return (
    <div className="space-y-6">
      <Card className="bg-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-primary" />
            <span>Advanced Location Services</span>
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Discover nearby places and map experiences in {currentCity.name}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Place Type</label>
              <select 
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full bg-black/40 border border-gray-600 rounded-md px-3 py-2 text-white"
              >
                {placeTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Search Radius: {searchRadius/1000}km
              </label>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={searchPlacesMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-black font-semibold"
          >
            {searchPlacesMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2"></div>
                Searching Places...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search Nearby Places
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Nearby Places Results */}
      {nearbyPlaces.length > 0 && (
        <Card className="bg-surface border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span>Nearby Places</span>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {nearbyPlaces.length} found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {nearbyPlaces.map((place) => (
                <div key={place.id} className="bg-black/20 rounded-lg p-3 hover:bg-black/40 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-white font-semibold">{place.name}</h4>
                        {place.isOpen !== undefined && (
                          <Badge 
                            variant="secondary"
                            className={place.isOpen ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
                          >
                            {place.isOpen ? 'Open' : 'Closed'}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-2">{place.address}</p>
                      
                      <div className="flex items-center space-x-4 text-xs">
                        {place.rating > 0 && (
                          <div className="flex items-center space-x-1 text-yellow-400">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{place.rating}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Navigation className="w-3 h-3" />
                          <span>{getDistanceDisplay(place.distance)}</span>
                        </div>

                        {place.priceLevel && (
                          <div className="flex items-center space-x-1 text-green-400">
                            <DollarSign className="w-3 h-3" />
                            <span>{getPriceDisplay(place.priceLevel)}</span>
                          </div>
                        )}
                      </div>

                      {place.types.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">
                            {formatPlaceTypes(place.types)}
                          </span>
                        </div>
                      )}
                    </div>

                    {place.photoUrl && (
                      <img
                        src={place.photoUrl}
                        alt={place.name}
                        className="w-16 h-16 object-cover rounded-lg ml-3"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Address Geocoding */}
      <Card className="bg-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span>Address Lookup</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter any address to geocode..."
              className="bg-black/40 border-gray-600 text-white flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const address = (e.target as HTMLInputElement).value;
                  if (address.trim()) {
                    geocodeMutation.mutate(address.trim());
                  }
                }
              }}
            />
            <Button
              onClick={() => {
                const input = document.querySelector('input[placeholder*="address"]') as HTMLInputElement;
                if (input?.value.trim()) {
                  geocodeMutation.mutate(input.value.trim());
                }
              }}
              disabled={geocodeMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-black"
            >
              {geocodeMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}