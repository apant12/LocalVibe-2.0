import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import HeaderNav from "@/components/HeaderNav";
import BottomNav from "@/components/BottomNav";
import EnhancedTikTokFeed from "@/components/EnhancedTikTokFeed";
import type { Experience } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState("San Francisco, CA");

  // Fetch real experiences from API including location filtering
  const { data: experiences = [], isLoading } = useQuery<Experience[]>({
    queryKey: ["/api/experiences", currentLocation],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentLocation) {
        params.set('location', currentLocation);
      }
      params.set('limit', '20');
      const response = await fetch(`/api/experiences?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch experiences');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time feel
  });

  // Sync Eventbrite data based on current location
  const { refetch: syncEventbrite } = useQuery({
    queryKey: ["/api/sync/eventbrite", currentLocation],
    enabled: false, // Don't auto-run
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('location', currentLocation);
      params.set('limit', '20');
      const response = await fetch(`/api/sync/eventbrite?${params.toString()}`);
      return response.json();
    }
  });

  // Trigger Eventbrite sync when location changes
  useEffect(() => {
    syncEventbrite();
  }, [currentLocation, syncEventbrite]);

  const handleLocationChange = (location: string) => {
    setCurrentLocation(location);
  };

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      {/* Minimal header for TikTok-style fullscreen experience */}
      <div className="absolute top-0 left-0 right-0 z-40">
        <HeaderNav user={user} currentLocation={currentLocation} onLocationChange={handleLocationChange} />
      </div>
      
      {/* Main TikTok-style feed */}
      <EnhancedTikTokFeed experiences={experiences} isLoading={isLoading} />
      
      {/* Bottom navigation - hidden during video viewing, shows on swipe */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <BottomNav activeTab="home" />
      </div>
    </div>
  );
}