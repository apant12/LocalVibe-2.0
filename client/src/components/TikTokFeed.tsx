import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, MessageCircle, Bookmark, Play, Pause, MoreVertical, MapPin, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Experience } from "@shared/schema";
import VideoUploadStreaming from "./VideoUploadStreaming";
import EventbriteSyncButton from "./EventbriteSyncButton";

interface TikTokFeedProps {
  experiences: Experience[];
  isLoading: boolean;
}

export default function TikTokFeed({ experiences, isLoading }: TikTokFeedProps) {
  const { user } = useAuth();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
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
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (experienceId: string) => {
      const response = await apiRequest("POST", `/api/experiences/${experienceId}/save`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/interactions"] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: async (experienceId: string) => {
      const response = await apiRequest("POST", "/api/social/share", {
        experienceId,
        platform: "native",
        content: `Check out this amazing experience!`
      });
      return response.json();
    },
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

  const handleVideoClick = () => {
    setIsPlaying(!isPlaying);
  };

  const handleLike = (experienceId: string) => {
    likeMutation.mutate(experienceId);
  };

  const handleSave = (experienceId: string) => {
    saveMutation.mutate(experienceId);
  };

  const handleShare = (experienceId: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Amazing Local Experience',
        text: 'Check out this local experience!',
        url: `${window.location.origin}/experience/${experienceId}`,
      });
    } else {
      shareMutation.mutate(experienceId);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Fixed Action Buttons */}
      <div className="fixed top-20 right-4 z-50 space-y-3">
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-primary text-black hover:bg-primary/90 rounded-full p-3"
        >
          <i className="fas fa-plus text-xl"></i>
        </Button>
      </div>
      
      {/* Eventbrite Sync Panel - Fixed Position */}
      <div className="fixed top-20 left-4 z-50 w-80 bg-black/90 backdrop-blur-sm rounded-lg">
        <EventbriteSyncButton />
      </div>

      {/* TikTok-style Video Feed */}
      <div 
        className="h-full relative"
        style={{ transform: `translateY(-${currentVideoIndex * 100}vh)`, transition: 'transform 0.3s ease' }}
      >
        {experiences.map((experience, index) => (
          <div key={experience.id} className="h-screen relative flex">
            {/* Video/Image Section */}
            <div className="flex-1 relative">
              {experience.videoUrl ? (
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  className="w-full h-full object-cover"
                  src={experience.videoUrl}
                  loop
                  muted
                  playsInline
                  onClick={handleVideoClick}
                />
              ) : (
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${experience.imageUrl})` }}
                  onClick={handleVideoClick}
                >
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>
              )}

              {/* Play/Pause Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 rounded-full p-4">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                </div>
              )}

              {/* Experience Info Overlay */}
              <div className="absolute bottom-0 left-0 right-20 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="space-y-3">
                  {/* Title and Description */}
                  <div>
                    <h2 className="text-white text-2xl font-bold mb-2">{experience.title}</h2>
                    <p className="text-white/90 text-sm leading-relaxed">{experience.description}</p>
                  </div>

                  {/* Experience Details */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary text-black text-xs px-2 py-1">
                      ${experience.price}
                    </Badge>
                    {experience.availability === "available" && (
                      <Badge className="bg-green-600 text-white text-xs px-2 py-1">
                        Available Now
                      </Badge>
                    )}
                    <div className="flex items-center text-white/80 text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      {experience.location}
                    </div>
                    <div className="flex items-center text-white/80 text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {experience.duration} mins
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button className="bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-2 mt-3">
                    Book Now
                  </Button>
                </div>
              </div>
            </div>

            {/* Social Actions Sidebar */}
            <div className="absolute right-4 bottom-32 flex flex-col items-center space-y-6">
              {/* Like Button */}
              <button
                onClick={() => handleLike(experience.id)}
                className="flex flex-col items-center space-y-1"
                disabled={likeMutation.isPending}
              >
                <div className={`p-3 rounded-full ${userInteractions.likes.includes(experience.id) 
                  ? 'bg-red-500' : 'bg-black/50'}`}>
                  <Heart 
                    className={`w-6 h-6 ${userInteractions.likes.includes(experience.id) 
                      ? 'text-white fill-current' : 'text-white'}`} 
                  />
                </div>
                <span className="text-white text-xs">{experience.likeCount || 0}</span>
              </button>

              {/* Share Button */}
              <button
                onClick={() => handleShare(experience.id)}
                className="flex flex-col items-center space-y-1"
                disabled={shareMutation.isPending}
              >
                <div className="p-3 bg-black/50 rounded-full">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">Share</span>
              </button>

              {/* Save/Bookmark Button */}
              <button
                onClick={() => handleSave(experience.id)}
                className="flex flex-col items-center space-y-1"
                disabled={saveMutation.isPending}
              >
                <div className={`p-3 rounded-full ${userInteractions.saves.includes(experience.id) 
                  ? 'bg-yellow-500' : 'bg-black/50'}`}>
                  <Bookmark 
                    className={`w-6 h-6 ${userInteractions.saves.includes(experience.id) 
                      ? 'text-white fill-current' : 'text-white'}`} 
                  />
                </div>
                <span className="text-white text-xs">Save</span>
              </button>

              {/* Comments Button */}
              <button className="flex flex-col items-center space-y-1">
                <div className="p-3 bg-black/50 rounded-full">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">{experience.reviewCount || 0}</span>
              </button>

              {/* More Options */}
              <button className="flex flex-col items-center space-y-1">
                <div className="p-3 bg-black/50 rounded-full">
                  <MoreVertical className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Indicators */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
        {experiences.map((_, index) => (
          <div
            key={index}
            className={`w-1 h-8 rounded-full transition-colors ${
              index === currentVideoIndex ? 'bg-primary' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
        <button
          onClick={() => handleScroll('up')}
          className="p-3 bg-black/50 rounded-full"
          disabled={currentVideoIndex === 0}
        >
          <i className="fas fa-chevron-up text-white"></i>
        </button>
        <button
          onClick={() => handleScroll('down')}
          className="p-3 bg-black/50 rounded-full"
          disabled={currentVideoIndex === experiences.length - 1}
        >
          <i className="fas fa-chevron-down text-white"></i>
        </button>
      </div>

      {/* Video Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black">Upload Experience Video</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <i className="fas fa-times text-black"></i>
                </button>
              </div>
              <VideoUploadStreaming />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}