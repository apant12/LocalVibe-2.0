import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function ExternalDataSync() {
  const [activeSync, setActiveSync] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Eventbrite sync
  const eventbriteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/sync/eventbrite?location=San Francisco&limit=10");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Eventbrite Sync Complete",
        description: `Found ${data.count} events from Eventbrite`,
        className: "bg-success text-black",
      });
      setActiveSync(null);
    },
    onError: (error: any) => {
      toast({
        title: "Eventbrite Sync Failed", 
        description: error.message || "Failed to sync Eventbrite events",
        variant: "destructive",
      });
      setActiveSync(null);
    }
  });

  // Ticketmaster sync
  const ticketmasterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/sync/ticketmaster?city=San Francisco&limit=10");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Ticketmaster Sync Complete",
        description: `Found ${data.count} events from Ticketmaster`,
        className: "bg-success text-black",
      });
      setActiveSync(null);
    },
    onError: (error: any) => {
      toast({
        title: "Ticketmaster Sync Failed",
        description: error.message || "Failed to sync Ticketmaster events",
        variant: "destructive",
      });
      setActiveSync(null);
    }
  });

  // Google Places sync
  const placesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/sync/places?location=San Francisco&radius=5000&limit=10");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Places Sync Complete",
        description: `Found ${data.count} venues from Google Places`,
        className: "bg-success text-black",
      });
      setActiveSync(null);
    },
    onError: (error: any) => {
      toast({
        title: "Places Sync Failed",
        description: error.message || "Failed to sync Google Places data",
        variant: "destructive",
      });
      setActiveSync(null);
    }
  });

  const handleSync = (service: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to sync external data",
        variant: "destructive",
      });
      return;
    }

    setActiveSync(service);
    switch (service) {
      case 'eventbrite':
        eventbriteMutation.mutate();
        break;
      case 'ticketmaster':
        ticketmasterMutation.mutate();
        break;
      case 'places':
        placesMutation.mutate();
        break;
    }
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
            Please log in to access external data sync features
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
    <div className="space-y-4">
      <h3 className="text-xl font-bold mb-4">External Data Sync</h3>
      
      {/* Eventbrite Sync */}
      <Card className="bg-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <i className="fas fa-calendar text-orange-500 mr-2"></i>
            Eventbrite Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm mb-3">
            Sync live events from Eventbrite to discover local activities
          </p>
          <Button
            onClick={() => handleSync('eventbrite')}
            disabled={activeSync === 'eventbrite'}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {activeSync === 'eventbrite' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Syncing Events...
              </>
            ) : (
              <>
                <i className="fas fa-sync mr-2"></i>
                Sync Eventbrite
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Ticketmaster Sync */}
      <Card className="bg-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <i className="fas fa-ticket-alt text-blue-500 mr-2"></i>
            Ticketmaster Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm mb-3">
            Import concerts, shows, and sporting events from Ticketmaster
          </p>
          <Button
            onClick={() => handleSync('ticketmaster')}
            disabled={activeSync === 'ticketmaster'}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {activeSync === 'ticketmaster' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Syncing Events...
              </>
            ) : (
              <>
                <i className="fas fa-sync mr-2"></i>
                Sync Ticketmaster
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Google Places Sync */}
      <Card className="bg-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <i className="fas fa-map-marker-alt text-green-500 mr-2"></i>
            Google Places
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm mb-3">
            Discover venues and locations from Google Places
          </p>
          <Button
            onClick={() => handleSync('places')}
            disabled={activeSync === 'places'}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {activeSync === 'places' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Syncing Places...
              </>
            ) : (
              <>
                <i className="fas fa-sync mr-2"></i>
                Sync Google Places
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}