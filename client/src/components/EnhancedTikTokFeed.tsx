import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, MessageCircle, Bookmark, Play, Pause, MoreVertical, MapPin, Clock, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Experience } from "@shared/schema";
import VideoUploadStreaming from "./VideoUploadStreaming";
import EventbriteSyncButton from "./EventbriteSyncButton";
import { useToast } from "@/hooks/use-toast";

interface EnhancedTikTokFeedProps {
  experiences: Experience[];
  isLoading: boolean;
}

export default function EnhancedTikTokFeed({ experiences, isLoading }: EnhancedTikTokFeedProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [startY, setStartY] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const queryClient = useQueryClient();

  const { data: userInteractions = { likes: [], saves: [] } } = useQuery<{likes: string[], saves: string[]}>({
    queryKey: ["/api/user/interactions"],
    enabled: !!user,
  });

  const likeMutation = useMutation({
    mutationFn: async (experienceId: string) => {
      const response = await apiRequest("POST", `/api/experiences/${experienceId}/like`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/interactions"] });
      toast({ title: "Liked!", description: "Added to your favorites" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (experienceId: string) => {
      const response = await apiRequest("POST", `/api/experiences/${experienceId}/save`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/interactions"] });
      toast({ title: "Saved!", description: "Added to your saved experiences" });
    },
  });

  // Auto-sync Eventbrite data periodically
  const { refetch: syncEventbrite } = useQuery({
    queryKey: ["/api/sync/eventbrite"],
    queryFn: async () => {
      const response = await fetch('/api/sync/eventbrite?location=San Francisco, CA&limit=5');
      if (response.ok) {
        const data = await response.json();
        queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
        return data;
      }
      throw new Error('Sync failed');
    },
    enabled: false,
    refetchInterval: 5 * 60 * 1000, // Every 5 minutes
  });

  useEffect(() => {
    const video = videoRefs.current[currentVideoIndex];
    if (video) {
      if (isPlaying) {
        video.play().catch(console.error);
      } else {
        video.pause();
      }
    }
  }, [currentVideoIndex, isPlaying]);

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'down' && currentVideoIndex < experiences.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else if (direction === 'up' && currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const handleLike = (experienceId: string) => {
    likeMutation.mutate(experienceId);
  };

  const handleSave = (experienceId: string) => {
    saveMutation.mutate(experienceId);
  };

  const handleShare = (experienceId: string, title: string) => {
    if (navigator.share) {
      navigator.share({
        title: `Amazing Local Experience: ${title}`,
        text: 'Check out this local experience on LocalVibe!',
        url: `${window.location.origin}/experience/${experienceId}`,
      });
    } else {
      // Fallback: Copy link to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/experience/${experienceId}`);
      toast({ title: "Link Copied!", description: "Share link copied to clipboard" });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-3 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-white text-lg">Loading amazing experiences...</p>
        </div>
      </div>
    );
  }

  const currentExperience = experiences[currentVideoIndex];

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Action Buttons - Top Right */}
      <div className="fixed top-4 right-4 z-50 flex space-x-2 sm:right-6 md:right-8 lg:right-20">
        <Button
          onClick={() => setShowSyncPanel(!showSyncPanel)}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-full p-2 sm:p-3"
          title="Sync Live Events"
        >
          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-primary hover:bg-primary/90 text-black rounded-full p-2 sm:p-3"
          title="Upload Video"
        >
          <i className="fas fa-plus text-base sm:text-lg"></i>
        </Button>
      </div>

      {/* Eventbrite Sync Panel */}
      {showSyncPanel && (
        <div className="fixed top-16 right-4 z-40 w-72 sm:w-80 bg-black/95 backdrop-blur-lg rounded-xl border border-orange-600/30 max-h-[80vh] overflow-y-auto">
          <EventbriteSyncButton />
        </div>
      )}

      {/* Main Video Feed */}
      <div 
        className="h-full relative overflow-hidden"
        onWheel={(e) => {
          e.preventDefault();
          if (e.deltaY > 0) {
            handleScroll('down');
          } else {
            handleScroll('up');
          }
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          setStartY(touch.clientY);
        }}
        onTouchMove={(e) => {
          if (!startY) return;
          const touch = e.touches[0];
          const diff = startY - touch.clientY;
          if (Math.abs(diff) > 50) {
            if (diff > 0) {
              handleScroll('down');
            } else {
              handleScroll('up');
            }
            setStartY(null);
          }
        }}
      >
        {experiences.length > 0 ? (
          <div 
            className="h-full relative transition-transform duration-300 ease-out"
            style={{ transform: `translateY(-${currentVideoIndex * 100}vh)` }}
          >
            {experiences.map((experience, index) => (
              <div key={experience.id} className="h-screen relative">
                {/* Background Media */}
                {experience.videoUrl ? (
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    className="w-full h-full object-cover"
                    src={experience.videoUrl}
                    loop
                    muted
                    playsInline
                    onClick={() => setIsPlaying(!isPlaying)}
                  />
                ) : (
                  <div 
                    className="w-full h-full bg-cover bg-center cursor-pointer"
                    style={{ backgroundImage: `url(${experience.imageUrl})` }}
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
                  </div>
                )}

                {/* Play/Pause Overlay */}
                {!isPlaying && experience.videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="bg-black/60 rounded-full p-6 backdrop-blur-sm">
                      <Play className="w-16 h-16 text-white ml-2" />
                    </div>
                  </div>
                )}

                {/* Content Overlay - Bottom */}
                <div className="absolute bottom-0 left-0 right-4 sm:right-6 md:right-8 lg:right-20 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <div className="space-y-4">
                    {/* Experience Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h1 className="text-white text-2xl font-bold leading-tight">
                          {experience.title}
                        </h1>
                        {experience.tags?.includes('eventbrite') && (
                          <Badge className="bg-orange-600 text-white text-xs px-2 py-1">
                            LIVE
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-white/90 text-base leading-relaxed line-clamp-3">
                        {experience.description}
                      </p>
                    </div>

                    {/* Experience Details */}
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center text-white text-sm bg-black/40 rounded-full px-3 py-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {experience.location}
                      </div>
                      <div className="flex items-center text-white text-sm bg-black/40 rounded-full px-3 py-1">
                        <Clock className="w-4 h-4 mr-1" />
                        {experience.duration || 120} mins
                      </div>
                      <div className="flex items-center text-primary text-sm bg-primary/20 rounded-full px-3 py-1 font-semibold">
                        ${experience.price}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button className="bg-primary hover:bg-primary/90 text-black font-bold px-8 py-3 rounded-full text-base">
                      Book Experience
                    </Button>
                  </div>
                </div>

                {/* Social Actions - Right Side */}
                <div className="absolute right-2 sm:right-4 bottom-20 sm:bottom-32 flex flex-col items-center space-y-4 sm:space-y-6">
                  {/* Like */}
                  <button
                    onClick={() => handleLike(experience.id)}
                    className="flex flex-col items-center space-y-1 group"
                    disabled={likeMutation.isPending}
                  >
                    <div className={`p-3 sm:p-4 rounded-full transition-all ${
                      userInteractions.likes.includes(experience.id) 
                        ? 'bg-red-500 scale-110' 
                        : 'bg-black/50 group-hover:bg-black/70'
                    }`}>
                      <Heart 
                        className={`w-6 h-6 sm:w-7 sm:h-7 ${
                          userInteractions.likes.includes(experience.id) 
                            ? 'text-white fill-current' 
                            : 'text-white'
                        }`} 
                      />
                    </div>
                    <span className="text-white text-sm font-medium">
                      {experience.likeCount || 0}
                    </span>
                  </button>

                  {/* Share */}
                  <button
                    onClick={() => handleShare(experience.id, experience.title)}
                    className="flex flex-col items-center space-y-1 group"
                  >
                    <div className="p-3 sm:p-4 bg-black/50 group-hover:bg-black/70 rounded-full transition-all">
                      <Share2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <span className="text-white text-sm font-medium">Share</span>
                  </button>

                  {/* Save */}
                  <button
                    onClick={() => handleSave(experience.id)}
                    className="flex flex-col items-center space-y-1 group"
                    disabled={saveMutation.isPending}
                  >
                    <div className={`p-3 sm:p-4 rounded-full transition-all ${
                      userInteractions.saves.includes(experience.id) 
                        ? 'bg-yellow-500 scale-110' 
                        : 'bg-black/50 group-hover:bg-black/70'
                    }`}>
                      <Bookmark 
                        className={`w-6 h-6 sm:w-7 sm:h-7 ${
                          userInteractions.saves.includes(experience.id) 
                            ? 'text-white fill-current' 
                            : 'text-white'
                        }`} 
                      />
                    </div>
                    <span className="text-white text-sm font-medium">Save</span>
                  </button>

                  {/* Comments */}
                  <button className="flex flex-col items-center space-y-1 group">
                    <div className="p-3 sm:p-4 bg-black/50 group-hover:bg-black/70 rounded-full transition-all">
                      <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <span className="text-white text-sm font-medium">
                      {experience.reviewCount || 0}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-4">
              <h2 className="text-white text-2xl font-bold">No experiences yet</h2>
              <p className="text-white/70">Click the sync button to load live events</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Dots */}
      {experiences.length > 1 && (
        <div className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1 sm:space-y-2">
          {experiences.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentVideoIndex(index)}
              className={`w-2 h-8 rounded-full transition-all ${
                index === currentVideoIndex ? 'bg-primary' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Swipe Controls */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
        <button
          onClick={() => handleScroll('up')}
          className="p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all"
          disabled={currentVideoIndex === 0}
        >
          <i className="fas fa-chevron-up text-white text-lg"></i>
        </button>
        <button
          onClick={() => handleScroll('down')}
          className="p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all"
          disabled={currentVideoIndex === experiences.length - 1}
        >
          <i className="fas fa-chevron-down text-white text-lg"></i>
        </button>
      </div>

      {/* Video Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Share Your Experience</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <i className="fas fa-times text-white text-xl"></i>
                </button>
              </div>
              <VideoUploadStreaming onClose={() => setShowUploadModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}