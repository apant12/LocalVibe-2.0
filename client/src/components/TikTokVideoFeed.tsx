import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Heart, MessageCircle, Share, MapPin, Calendar, DollarSign, Users, Video } from 'lucide-react';
import MapModal from './MapModal';
import LiveVideoModal from './LiveVideoModal';

interface Video {
  id: string;
  url: string;
  experienceId: string;
  title: string;
  description: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
  duration: number;
  thumbnailUrl: string;
}

interface Experience {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  price: string;
  startTime: string;
  endTime: string;
  category: string;
  hostName: string;
  latitude?: number;
  longitude?: number;
  videos: Video[];
  videoUrl?: string;
  tags?: string[];
  imageUrl?: string;
}

interface BookingModalProps {
  experience: Experience | null;
  isOpen: boolean;
  onClose: () => void;
  onBook: (numberOfPeople: number) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ experience, isOpen, onClose, onBook }) => {
  const [numberOfPeople, setNumberOfPeople] = useState(1);

  if (!isOpen || !experience) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Quick Book: {experience.title}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Number of People</label>
            <select 
              value={numberOfPeople} 
              onChange={(e) => setNumberOfPeople(Number(e.target.value))}
              className="w-full p-2 border rounded"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{new Date(experience.startTime).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{experience.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>${experience.price} per person</span>
          </div>
          
          <div className="text-lg font-bold">
            Total: ${(parseFloat(experience.price) * numberOfPeople).toFixed(2)}
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={() => onBook(numberOfPeople)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

const TikTokVideoFeed: React.FC = () => {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showLiveVideoModal, setShowLiveVideoModal] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [showNavigationHint, setShowNavigationHint] = useState(true);
  
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Fetch enhanced experiences with videos
  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ['enhanced-experiences'],
    queryFn: async () => {
      const response = await fetch('/api/experiences/enhanced');
      return response.json();
    }
  });

  // Quick book mutation
  const quickBookMutation = useMutation({
    mutationFn: async ({ experienceId, numberOfPeople }: { experienceId: string; numberOfPeople: number }) => {
      const response = await fetch(`/api/experiences/${experienceId}/quick-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numberOfPeople })
      });
      return response.json();
    },
    onSuccess: () => {
      setShowBookingModal(false);
      // Show subtle success message
      const message = document.createElement('div');
      message.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg z-50';
      message.textContent = 'Booking successful!';
      document.body.appendChild(message);
      setTimeout(() => document.body.removeChild(message), 2000);
    },
    onError: (error) => {
      // Show subtle error message
      const message = document.createElement('div');
      message.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-50';
      message.textContent = 'Booking failed. Please try again.';
      document.body.appendChild(message);
      setTimeout(() => document.body.removeChild(message), 2000);
      console.error('Booking error:', error);
    }
  });

  // Create video items from experiences
  const videoItems = experiences.flatMap((exp: Experience) => {
    if (exp.videos && exp.videos.length > 0) {
      return exp.videos.map(video => ({ ...video, experience: exp }));
    } else {
      // Create a default video for experiences without videos
      return [{
        id: `default-${exp.id}`,
        url: exp.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        experienceId: exp.id,
        title: exp.title,
        description: exp.description,
        tags: exp.tags || [],
        uploadedBy: exp.hostName,
        uploadedAt: exp.startTime,
        duration: 30,
        thumbnailUrl: exp.imageUrl,
        experience: exp
      }];
    }
  });

  // Group videos by experience
  const experienceGroups = experiences.map((exp: Experience) => {
    const expVideos = videoItems.filter((item: any) => item.experience.id === exp.id);
    return {
      experience: exp,
      videos: expVideos.length > 0 ? expVideos : [{
        id: `default-${exp.id}`,
        url: exp.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        experienceId: exp.id,
        title: exp.title,
        description: exp.description,
        tags: exp.tags || [],
        uploadedBy: exp.hostName,
        uploadedAt: exp.startTime,
        duration: 30,
        thumbnailUrl: exp.imageUrl,
        experience: exp
      }]
    };
  });

  useEffect(() => {
    // Auto-play current video
    if (videoRefs.current[currentVideoIndex]) {
      videoRefs.current[currentVideoIndex]?.play();
    }
    
    // Hide navigation hint after 3 seconds
    const timer = setTimeout(() => setShowNavigationHint(false), 3000);
    return () => clearTimeout(timer);
  }, [currentVideoIndex, currentEventIndex]);

  const handleVideoClick = () => {
    const video = videoRefs.current[currentVideoIndex];
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  };

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent default to avoid conflicts
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragStartY(e.touches[0].clientY);
    console.log('Touch Start:', { x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent default to avoid conflicts
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent default to avoid conflicts
    
    const dragEndX = e.changedTouches[0].clientX;
    const dragEndY = e.changedTouches[0].clientY;
    const dragDistanceX = dragEndX - dragStartX;
    const dragDistanceY = dragEndY - dragStartY;
    const minSwipeDistance = 50; // Reduced threshold for easier detection

    console.log('Touch Debug:', {
      dragDistanceX,
      dragDistanceY,
      absX: Math.abs(dragDistanceX),
      absY: Math.abs(dragDistanceY),
      isVertical: Math.abs(dragDistanceY) > Math.abs(dragDistanceX),
      minSwipeDistance
    });

    // Only handle as swipe if the distance is significant
    if (Math.abs(dragDistanceX) > minSwipeDistance || Math.abs(dragDistanceY) > minSwipeDistance) {
      // Determine if it's a horizontal or vertical swipe
      if (Math.abs(dragDistanceY) > Math.abs(dragDistanceX)) {
        // Vertical swipe - change events
        if (dragDistanceY > 0) {
          console.log('🔄 Swiping DOWN - previous event');
          handleEventScroll('up');
        } else {
          console.log('🔄 Swiping UP - next event');
          handleEventScroll('down');
        }
      } else {
        // Horizontal swipe - change videos within event
        if (dragDistanceX > 0) {
          console.log('↔️ Swiping RIGHT - previous video');
          handleVideoSwipe('right');
        } else {
          console.log('↔️ Swiping LEFT - next video');
          handleVideoSwipe('left');
        }
      }
    }
    
    setIsDragging(false);
  };

  // Handle swipe for videos within an event
  const handleVideoSwipe = (direction: 'left' | 'right') => {
    const currentGroup = experienceGroups[currentEventIndex];
    if (!currentGroup) return;
    
    if (direction === 'right' && currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
    } else if (direction === 'left' && currentVideoIndex < currentGroup.videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
    }
  };

  // Handle scroll for changing events
  const handleEventScroll = (direction: 'up' | 'down') => {
    if (direction === 'down' && currentEventIndex < experienceGroups.length - 1) {
      setCurrentEventIndex(prev => prev + 1);
      setCurrentVideoIndex(0); // Reset to first video of new event
    } else if (direction === 'up' && currentEventIndex > 0) {
      setCurrentEventIndex(prev => prev - 1);
      setCurrentVideoIndex(0); // Reset to first video of new event
    }
  };

  // Add keyboard support for testing
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handleVideoSwipe('right');
          break;
        case 'ArrowRight':
          handleVideoSwipe('left');
          break;
        case 'ArrowUp':
          handleEventScroll('up');
          break;
        case 'ArrowDown':
          handleEventScroll('down');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentEventIndex, currentVideoIndex, experienceGroups]);

  const handleLike = () => {
    const currentVideo = experienceGroups[currentEventIndex].videos[currentVideoIndex];
    setLikedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentVideo.id)) {
        newSet.delete(currentVideo.id);
      } else {
        newSet.add(currentVideo.id);
      }
      return newSet;
    });
  };

  const handleShare = () => {
    const currentVideo = experienceGroups[currentEventIndex].videos[currentVideoIndex];
    const shareText = `Check out this amazing experience: ${currentVideo.title}`;
    if (navigator.share) {
      navigator.share({
        title: currentVideo.title,
        text: shareText,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      // Show subtle message
      const message = document.createElement('div');
      message.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg z-50';
      message.textContent = 'Link copied to clipboard!';
      document.body.appendChild(message);
      setTimeout(() => document.body.removeChild(message), 2000);
    }
  };

  const handleComment = () => {
    // Show subtle message
    const message = document.createElement('div');
    message.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg z-50';
    message.textContent = 'Comment feature coming soon!';
    document.body.appendChild(message);
    setTimeout(() => document.body.removeChild(message), 2000);
  };

  const handleQuickBook = (experience: Experience) => {
    setSelectedExperience(experience);
    setShowBookingModal(true);
  };

  const handleMapClick = (experience: Experience) => {
    setSelectedExperience(experience);
    setShowMapModal(true);
  };

  const handleLiveVideo = (experience: Experience) => {
    setSelectedExperience(experience);
    setShowLiveVideoModal(true);
  };

  const handleBook = (numberOfPeople: number) => {
    if (selectedExperience) {
      quickBookMutation.mutate({
        experienceId: selectedExperience.id,
        numberOfPeople
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading videos...</div>
      </div>
    );
  }

  if (experienceGroups.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">No videos available</div>
      </div>
    );
  }

  const currentGroup = experienceGroups[currentEventIndex];
  const currentVideo = currentGroup.videos[currentVideoIndex];
  const currentExperience = currentVideo.experience;
  const isLiked = likedVideos.has(currentVideo.id);

  return (
    <div className="h-screen bg-black relative overflow-hidden">




      {/* Progress Bar at Top - Shows event progress */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4">
        <div className="flex gap-1 justify-center">
          {experienceGroups.map((_: any, index: number) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentEventIndex ? 'bg-white w-8' : 'bg-white/30 w-4'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Video Progress Bar - Shows video progress within event */}
      <div className="absolute top-12 left-0 right-0 z-30 px-4">
        <div className="flex gap-1 justify-center">
          {currentGroup.videos.map((video: any, index: number) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentVideoIndex 
                  ? (video.isRecommended ? 'bg-blue-400 w-6' : 'bg-white w-6')
                  : (video.isRecommended ? 'bg-blue-400/30 w-3' : 'bg-white/20 w-3')
              }`}
            />
          ))}
        </div>
      </div>

      {/* Video Container */}
      <div 
        className="h-full relative video-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <video
          ref={el => videoRefs.current[currentVideoIndex] = el}
          src={currentVideo.url}
          className="w-full h-full object-cover"
          loop
          muted
          onClick={handleVideoClick}
          playsInline
        />
        
        {/* Video Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent">
          {/* Top Info */}
          <div className="absolute top-20 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{currentExperience.category}</span>
              {currentVideo.isRecommended && (
                <span className="bg-blue-500 px-2 py-1 rounded text-xs font-bold">AI RECOMMENDED</span>
              )}
            </div>
            <h2 className="text-xl font-bold">{currentVideo.title}</h2>
            <p className="text-sm opacity-90">{currentVideo.description}</p>
            {currentVideo.recommendationReason && (
              <p className="text-xs text-blue-300 mt-1">💡 {currentVideo.recommendationReason}</p>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="absolute right-4 bottom-24 flex flex-col gap-4">
            <button 
              onClick={handleLike}
              className="flex flex-col items-center gap-1 text-white"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${
                isLiked ? 'bg-red-500' : 'bg-white/20'
              }`}>
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-xs">{isLiked ? 'Liked' : 'Like'}</span>
            </button>
            
            <button 
              onClick={handleComment}
              className="flex flex-col items-center gap-1 text-white"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-xs">Comment</span>
            </button>
            
            <button 
              onClick={handleShare}
              className="flex flex-col items-center gap-1 text-white"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Share className="w-6 h-6" />
              </div>
              <span className="text-xs">Share</span>
            </button>
            
            <button 
              onClick={() => handleMapClick(currentExperience)}
              className="flex flex-col items-center gap-1 text-white"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="text-xs">Map</span>
            </button>

            <button 
              onClick={() => handleLiveVideo(currentExperience)}
              className="flex flex-col items-center gap-1 text-white"
            >
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Video className="w-6 h-6" />
              </div>
              <span className="text-xs">Go Live</span>
            </button>
          </div>

          {/* Bottom Event Info */}
          <div className="absolute bottom-28 left-4 right-20 text-white">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">{currentExperience.title}</h3>
              <div className="flex items-center gap-4 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{currentExperience.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>${currentExperience.price}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{currentExperience.hostName}</span>
                </div>
              </div>
              <button
                onClick={() => handleQuickBook(currentExperience)}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Quick Book
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BookingModal
        experience={selectedExperience}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onBook={handleBook}
      />
      
      <MapModal
        experience={selectedExperience}
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
      />

      <LiveVideoModal
        isOpen={showLiveVideoModal}
        onClose={() => setShowLiveVideoModal(false)}
        experienceTitle={selectedExperience?.title}
      />
    </div>
  );
};

export default TikTokVideoFeed;
