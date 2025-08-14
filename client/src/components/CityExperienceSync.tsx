import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/components/LocationContext";
import { MapPin, Loader2, Calendar, Ticket, Building } from "lucide-react";

export default function CityExperienceSync() {
  const [syncingServices, setSyncingServices] = useState<string[]>([]);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { currentCity } = useLocation();
  const queryClient = useQueryClient();

  // City-specific sync mutations
  const eventbriteMutation = useMutation({
    mutationFn: async () => {
      setSyncingServices(prev => [...prev, 'eventbrite']);
      const response = await apiRequest("GET", `/api/sync/eventbrite?location=${currentCity.name}&limit=20`);
      const data = await response.json();
      setSyncingServices(prev => prev.filter(s => s !== 'eventbrite'));
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Eventbrite Sync Complete",
        description: `Found ${data.count} events in ${currentCity.name}`,
        className: "bg-green-600 text-white",
      });
      // Invalidate experiences cache to refresh the feed
      queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
    },
    onError: (error: any) => {
      setSyncingServices(prev => prev.filter(s => s !== 'eventbrite'));
      toast({
        title: "Eventbrite Sync Failed",
        description: error.message || "Failed to sync events",
        variant: "destructive",
      });
    }
  });

  const ticketmasterMutation = useMutation({
    mutationFn: async () => {
      setSyncingServices(prev => [...prev, 'ticketmaster']);
      const response = await apiRequest("GET", `/api/sync/ticketmaster?city=${currentCity.name}&limit=20`);
      const data = await response.json();
      setSyncingServices(prev => prev.filter(s => s !== 'ticketmaster'));
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Ticketmaster Sync Complete",
        description: `Found ${data.count} events in ${currentCity.name}`,
        className: "bg-green-600 text-white",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
    },
    onError: (error: any) => {
      setSyncingServices(prev => prev.filter(s => s !== 'ticketmaster'));
      toast({
        title: "Ticketmaster Sync Failed",
        description: error.message || "Failed to sync events",
        variant: "destructive",
      });
    }
  });

  const placesMutation = useMutation({
    mutationFn: async () => {
      setSyncingServices(prev => [...prev, 'places']);
      const response = await apiRequest("GET", `/api/sync/places?location=${currentCity.name}&radius=10000&limit=20`);
      const data = await response.json();
      setSyncingServices(prev => prev.filter(s => s !== 'places'));
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Places Sync Complete",
        description: `Found ${data.count} venues in ${currentCity.name}`,
        className: "bg-green-600 text-white",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
    },
    onError: (error: any) => {
      setSyncingServices(prev => prev.filter(s => s !== 'places'));
      toast({
        title: "Places Sync Failed",
        description: error.message || "Failed to sync venues",
        variant: "destructive",
      });
    }
  });

  const syncAllForCity = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to sync city data",
        variant: "destructive",
      });
      return;
    }

    // Sequence the API calls to avoid overwhelming the services
    eventbriteMutation.mutate();
    setTimeout(() => ticketmasterMutation.mutate(), 2000);
    setTimeout(() => placesMutation.mutate(), 4000);
  };

  const syncService = (service: string, mutation: any) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required", 
        description: "Please log in to sync external data",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate();
  };

  if (!isAuthenticated) {
    return (
      <Card className="bg-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-center">
            <i className="fas fa-lock mr-2"></i>
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center">
            Please log in to sync experiences for {currentCity.name}
          </p>
          <Button
                onClick={() => window.location.href = "/login"}
            className="w-full mt-4 bg-primary hover:bg-primary/90"
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-primary" />
          <span>Sync Experiences for {currentCity.name}</span>
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Import live events and venues from external services for your selected city
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* City Info */}
        <div className="bg-black/20 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white">{currentCity.name}, {currentCity.country}</h4>
              <p className="text-sm text-gray-400">
                {currentCity.coordinates.lat.toFixed(4)}, {currentCity.coordinates.lng.toFixed(4)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary font-semibold">
                {currentCity.experienceCount} current experiences
              </p>
              <p className="text-xs text-gray-500">
                Local time: {new Date().toLocaleTimeString('en-US', {
                  timeZone: currentCity.timezone,
                  hour12: true,
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Sync All Button */}
        <Button
          onClick={syncAllForCity}
          disabled={syncingServices.length > 0}
          className="w-full bg-primary hover:bg-primary/90 py-3"
        >
          {syncingServices.length > 0 ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Syncing {syncingServices.length} service{syncingServices.length > 1 ? 's' : ''}...
            </>
          ) : (
            <>
              <i className="fas fa-sync mr-2"></i>
              Sync All Services for {currentCity.name}
            </>
          )}
        </Button>

        {/* Individual Service Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={() => syncService('eventbrite', eventbriteMutation)}
            disabled={syncingServices.includes('eventbrite')}
            variant="outline"
            className="flex items-center space-x-2 border-orange-600 hover:bg-orange-600/10"
          >
            {syncingServices.includes('eventbrite') ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            <span>Eventbrite</span>
          </Button>

          <Button
            onClick={() => syncService('ticketmaster', ticketmasterMutation)}
            disabled={syncingServices.includes('ticketmaster')}
            variant="outline"
            className="flex items-center space-x-2 border-blue-600 hover:bg-blue-600/10"
          >
            {syncingServices.includes('ticketmaster') ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Ticket className="w-4 h-4" />
            )}
            <span>Ticketmaster</span>
          </Button>

          <Button
            onClick={() => syncService('places', placesMutation)}
            disabled={syncingServices.includes('places')}
            variant="outline"
            className="flex items-center space-x-2 border-green-600 hover:bg-green-600/10"
          >
            {syncingServices.includes('places') ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Building className="w-4 h-4" />
            )}
            <span>Google Places</span>
          </Button>
        </div>

        {/* Sync Status */}
        {syncingServices.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <h4 className="text-blue-400 font-semibold mb-2">Sync Progress</h4>
            <div className="space-y-2">
              {syncingServices.map(service => (
                <div key={service} className="flex items-center space-x-2 text-sm">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                  <span className="text-gray-300">
                    Syncing {service} events for {currentCity.name}...
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}