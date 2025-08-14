import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Search, Star } from "lucide-react";

interface City {
  id: string;
  name: string;
  country: string;
  timezone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  experienceCount?: number;
  isPopular?: boolean;
}

interface CitySelectorProps {
  currentCity: string;
  onCityChange: (city: City) => void;
}

const POPULAR_CITIES: City[] = [
  {
    id: "sf",
    name: "San Francisco",
    country: "United States",
    timezone: "America/Los_Angeles",
    coordinates: { lat: 37.7749, lng: -122.4194 },
    experienceCount: 156,
    isPopular: true,
  },
  {
    id: "nyc",
    name: "New York",
    country: "United States", 
    timezone: "America/New_York",
    coordinates: { lat: 40.7128, lng: -74.0060 },
    experienceCount: 234,
    isPopular: true,
  },
  {
    id: "la",
    name: "Los Angeles",
    country: "United States",
    timezone: "America/Los_Angeles", 
    coordinates: { lat: 34.0522, lng: -118.2437 },
    experienceCount: 189,
    isPopular: true,
  },
  {
    id: "chicago",
    name: "Chicago",
    country: "United States",
    timezone: "America/Chicago",
    coordinates: { lat: 41.8781, lng: -87.6298 },
    experienceCount: 112,
    isPopular: true,
  },
  {
    id: "miami",
    name: "Miami",
    country: "United States",
    timezone: "America/New_York",
    coordinates: { lat: 25.7617, lng: -80.1918 },
    experienceCount: 98,
    isPopular: true,
  },
  {
    id: "austin",
    name: "Austin",
    country: "United States",
    timezone: "America/Chicago",
    coordinates: { lat: 30.2672, lng: -97.7431 },
    experienceCount: 87,
    isPopular: true,
  },
  {
    id: "london",
    name: "London", 
    country: "United Kingdom",
    timezone: "Europe/London",
    coordinates: { lat: 51.5074, lng: -0.1278 },
    experienceCount: 201,
    isPopular: true,
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    timezone: "Europe/Paris", 
    coordinates: { lat: 48.8566, lng: 2.3522 },
    experienceCount: 178,
    isPopular: true,
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    timezone: "Asia/Tokyo",
    coordinates: { lat: 35.6762, lng: 139.6503 },
    experienceCount: 143,
    isPopular: true,
  },
  {
    id: "berlin",
    name: "Berlin",
    country: "Germany", 
    timezone: "Europe/Berlin",
    coordinates: { lat: 52.5200, lng: 13.4050 },
    experienceCount: 134,
    isPopular: true,
  },
];

export default function CitySelector({ currentCity, onCityChange }: CitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCities, setFilteredCities] = useState(POPULAR_CITIES);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredCities(POPULAR_CITIES);
      return;
    }

    const filtered = POPULAR_CITIES.filter(city =>
      city.name.toLowerCase().includes(query.toLowerCase()) ||
      city.country.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCities(filtered);
  };

  const handleCitySelect = (city: City) => {
    onCityChange(city);
    setIsOpen(false);
    setSearchQuery("");
    setFilteredCities(POPULAR_CITIES);
  };

  const getCurrentCityData = () => {
    return POPULAR_CITIES.find(city => city.name === currentCity) || POPULAR_CITIES[0];
  };

  const currentCityData = getCurrentCityData();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 text-white hover:bg-gray-800">
          <MapPin className="w-4 h-4" />
          <span className="font-medium">{currentCity}</span>
          <i className="fas fa-chevron-down text-xs"></i>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-black border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span>Choose Your City</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search cities..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-surface border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          {/* Current City */}
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-primary">Current Location</h4>
                <p className="text-sm text-gray-300">
                  {currentCityData.name}, {currentCityData.country}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary font-semibold">
                  {currentCityData.experienceCount} experiences
                </p>
              </div>
            </div>
          </div>

          {/* Cities List */}
          <ScrollArea className="h-80">
            <div className="space-y-2">
              {filteredCities.map((city) => (
                <Button
                  key={city.id}
                  onClick={() => handleCitySelect(city)}
                  variant="ghost"
                  className="w-full p-3 h-auto justify-start hover:bg-surface"
                  disabled={city.name === currentCity}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-black">
                          {city.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center space-x-1">
                          <h4 className="font-medium text-white">{city.name}</h4>
                          {city.isPopular && (
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{city.country}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-300">
                        {city.experienceCount} experiences
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date().toLocaleTimeString('en-US', {
                          timeZone: city.timezone,
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>

          {filteredCities.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No cities found matching "{searchQuery}"</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}