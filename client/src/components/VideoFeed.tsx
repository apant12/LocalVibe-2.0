import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share, Play, Pause, Volume2, VolumeX, MapPin, Clock, User } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  eventId: string;
  eventName: string;
  eventLocation: string;
  eventDate: string;
  uploaderId: string;
  uploaderName: string;
  uploaderAvatar: string;
  likes: number;
  comments: number;
  views: number;
  isLiked: boolean;
  isSaved: boolean;
  duration: number;
  uploadDate: string;
}

interface VideoFeedProps {
  eventId?: string; // If provided, shows videos for specific event
  category?: string; // If provided, shows videos for specific category
  limit?: number;
}

export default function VideoFeed({ eventId, category, limit = 10 }: VideoFeedProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Fetch videos
  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos", { eventId, category, limit }],
    enabled: !!user,
  });

  // Like video mutation
  const likeMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await apiRequest("POST", `/api/videos/${videoId}/like`);
      return response.json();
    },
    onSuccess: (data, videoId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: data.isLiked ? "Video liked! ❤️" : "Like removed",
        description: data.isLiked ? "Added to your liked videos" : "Removed from liked videos",
      });
    },
    onError: () => {
      toast({
        title: "Failed to like video",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Save video mutation
  const saveMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await apiRequest("POST", `/api/videos/${videoId}/save`);
      return response.json();
    },
    onSuccess: (data, videoId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: data.isSaved ? "Video saved! 💾" : "Video unsaved",
        description: data.isSaved ? "Added to your saved videos" : "Removed from saved videos",
      });
    },
    onError: () => {
      toast({
        title: "Failed to save video",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Handle video play/pause
  const togglePlayPause = (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        // Pause all other videos
        videoRefs.current.forEach((v, i) => {
          if (i !== index && v) {
            v.pause();
          }
        });
        video.play();
        setIsPlaying(true);
        setCurrentVideoIndex(index);
      }
    }
  };

  // Handle like
  const handleLike = (videoId: string) => {
    likeMutation.mutate(videoId);
  };

  // Handle save
  const handleSave = (videoId: string) => {
    saveMutation.mutate(videoId);
  };

  // Auto-play next video when current one ends
  const handleVideoEnd = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
      const nextVideo = videoRefs.current[currentVideoIndex + 1];
      if (nextVideo) {
        nextVideo.play();
        setIsPlaying(true);
      }
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-surface border-gray-800">
            <CardContent className="p-0">
              <div className="h-64 bg-gray-800 animate-pulse"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-800 animate-pulse rounded"></div>
                <div className="h-3 bg-gray-800 animate-pulse rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <Card className="bg-surface border-gray-800">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">📹</div>
          <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
          <p className="text-gray-400">
            {eventId ? "Be the first to upload a video for this event!" : "Upload the first video to get started!"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {videos.map((video, index) => (
        <Card key={video.id} className="bg-surface border-gray-800 overflow-hidden">
          <CardContent className="p-0">
            {/* Video Player */}
            <div className="relative bg-black">
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={video.videoUrl}
                poster={video.thumbnailUrl}
                className="w-full h-64 object-cover"
                onEnded={handleVideoEnd}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                muted={isMuted}
                loop={false}
              />
              
              {/* Video Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  onClick={() => togglePlayPause(index)}
                  size="lg"
                  className="bg-black/60 hover:bg-black/80 text-white border-0 rounded-full w-16 h-16"
                >
                  {isPlaying && currentVideoIndex === index ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </Button>
              </div>

              {/* Video Duration Badge */}
              <Badge className="absolute top-3 right-3 bg-black/60 text-white border-0">
                {formatDuration(video.duration)}
              </Badge>

              {/* Mute/Unmute Button */}
              <Button
                onClick={() => setIsMuted(!isMuted)}
                variant="ghost"
                size="sm"
                className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white border-0"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>

            {/* Video Info */}
            <div className="p-4 space-y-4">
              {/* Uploader Info */}
              <div className="flex items-center space-x-3">
                <img
                  src={video.uploaderAvatar || `https://ui-avatars.com/api/?name=${video.uploaderName}&background=random`}
                  alt={video.uploaderName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{video.uploaderName}</h3>
                  <p className="text-sm text-gray-400">{formatDate(video.uploadDate)}</p>
                </div>
              </div>

              {/* Video Title & Description */}
              <div>
                <h4 className="font-bold text-lg mb-2">{video.title}</h4>
                <p className="text-gray-300 text-sm mb-3">{video.description}</p>
              </div>

              {/* Event Info */}
              <div className="bg-gray-800/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400">{video.eventName}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">{video.eventLocation} • {formatDate(video.eventDate)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Like Button */}
                  <Button
                    onClick={() => handleLike(video.id)}
                    variant="ghost"
                    size="sm"
                    className={`flex items-center space-x-2 ${
                      video.isLiked ? "text-red-500" : "text-gray-400"
                    } hover:text-red-500`}
                  >
                    <Heart className={`w-5 h-5 ${video.isLiked ? "fill-current" : ""}`} />
                    <span>{video.likes}</span>
                  </Button>

                  {/* Comment Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2 text-gray-400 hover:text-blue-400"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{video.comments}</span>
                  </Button>

                  {/* Share Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2 text-gray-400 hover:text-green-400"
                  >
                    <Share className="w-5 h-5" />
                  </Button>
                </div>

                {/* Save Button */}
                <Button
                  onClick={() => handleSave(video.id)}
                  variant="ghost"
                  size="sm"
                  className={`${
                    video.isSaved ? "text-yellow-500" : "text-gray-400"
                  } hover:text-yellow-500`}
                >
                  <svg className="w-5 h-5" fill={video.isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{video.views} views</span>
                <span>{formatDate(video.uploadDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
