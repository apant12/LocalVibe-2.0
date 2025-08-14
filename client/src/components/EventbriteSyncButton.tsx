import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ExternalLink, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EventbriteSyncButton() {
  const [syncedEvents, setSyncedEvents] = useState<any[]>([]);
  const [showEvents, setShowEvents] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const eventbriteSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync/eventbrite?location=San Francisco&limit=10');
      if (!response.ok) {
        throw new Error(`Failed to sync: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSyncedEvents(data.experiences || []);
      setShowEvents(true);
      queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
      toast({
        title: "Eventbrite Sync Complete!",
        description: `Added ${data.count} new events from Eventbrite to your feed`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const ticketmasterSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync/ticketmaster?city=San Francisco&limit=10');
      if (!response.ok) {
        throw new Error(`Failed to sync: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSyncedEvents(data.experiences || []);
      setShowEvents(true);
      queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
      toast({
        title: "Ticketmaster Sync Complete!",
        description: `Added ${data.count} new events from Ticketmaster to your feed`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-3">
        <Button
          onClick={() => eventbriteSyncMutation.mutate()}
          disabled={eventbriteSyncMutation.isPending || ticketmasterSyncMutation.isPending}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          {eventbriteSyncMutation.isPending ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Syncing Eventbrite...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Load Live Events from Eventbrite</span>
            </div>
          )}
        </Button>

        <Button
          onClick={() => ticketmasterSyncMutation.mutate()}
          disabled={eventbriteSyncMutation.isPending || ticketmasterSyncMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {ticketmasterSyncMutation.isPending ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Syncing Ticketmaster...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Ticket className="w-4 h-4" />
              <span>Load Live Events from Ticketmaster</span>
            </div>
          )}
        </Button>
      </div>

      {showEvents && syncedEvents.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Recently Added Events:</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {syncedEvents.slice(0, 5).map((event, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-3 border border-orange-600/20">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-white text-sm">{event.title}</h4>
                  <Badge className="bg-orange-600 text-white text-xs">Live</Badge>
                </div>
                <div className="text-xs text-gray-300 space-y-1">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(event.startTime).toLocaleDateString()}</span>
                  </div>
                  <div className="text-green-400">${event.price}</div>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEvents(false)}
            className="w-full"
          >
            Hide Events
          </Button>
        </div>
      )}
    </div>
  );
}