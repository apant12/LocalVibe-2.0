import React, { useState, useRef, useEffect } from 'react';
import { Video, Mic, MicOff, VideoOff, Phone, MessageCircle, Heart, Share, Users } from 'lucide-react';

interface LiveVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  experienceTitle?: string;
}

const LiveVideoModal: React.FC<LiveVideoModalProps> = ({ isOpen, onClose, experienceTitle }) => {
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && isLive) {
      startLiveStream();
    } else if (!isLive && streamRef.current) {
      stopLiveStream();
    }
  }, [isOpen, isLive]);

  useEffect(() => {
    if (isLive) {
      // Simulate viewer count updates
      const interval = setInterval(() => {
        setViewerCount(prev => prev + Math.floor(Math.random() * 3) - 1);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isLive]);

  const startLiveStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      streamRef.current = stream;
      setViewerCount(Math.floor(Math.random() * 50) + 10);
    } catch (error) {
      console.error('Error accessing camera/microphone:', error);
      alert('Unable to access camera/microphone. Please check permissions.');
    }
  };

  const stopLiveStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLive(false);
    setViewerCount(0);
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const handleLike = () => {
    setLikes(prev => prev + 1);
  };

  const handleComment = () => {
    if (newComment.trim()) {
      setComments(prev => [...prev, newComment]);
      setNewComment('');
    }
  };

  const handleStartLive = () => {
    setIsLive(true);
  };

  const handleEndLive = () => {
    stopLiveStream();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-black rounded-lg overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-semibold">LIVE</span>
              </div>
              <span className="text-white text-sm">{experienceTitle || 'Live Stream'}</span>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative w-full h-full">
          {isLive ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Start Live Stream</h3>
                <p className="text-gray-400 mb-6">Share your experience with viewers in real-time</p>
                <button
                  onClick={handleStartLive}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold"
                >
                  Go Live
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Controls */}
        {isLive && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-full ${isMuted ? 'bg-red-600' : 'bg-white/20'} text-white`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full ${!isVideoEnabled ? 'bg-red-600' : 'bg-white/20'} text-white`}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleEndLive}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  End Live
                </button>
              </div>

              {/* Right Stats */}
              <div className="flex items-center gap-4 text-white">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{viewerCount} watching</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">{likes}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments Sidebar */}
        {isLive && (
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-black/80 backdrop-blur-sm z-30">
            <div className="p-4 h-full flex flex-col">
              <h3 className="text-white font-semibold mb-4">Live Comments</h3>
              
              {/* Comments List */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {comments.map((comment, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                      <span className="text-white text-sm font-medium">Viewer {index + 1}</span>
                    </div>
                    <p className="text-white text-sm">{comment}</p>
                  </div>
                ))}
              </div>

              {/* Comment Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 bg-white/20 text-white rounded-lg placeholder-white/60"
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                />
                <button
                  onClick={handleComment}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interaction Buttons */}
        {isLive && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 flex flex-col gap-4">
            <button
              onClick={handleLike}
              className="flex flex-col items-center gap-1 text-white"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Heart className="w-6 h-6" />
              </div>
              <span className="text-xs">{likes}</span>
            </button>
            
            <button className="flex flex-col items-center gap-1 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Share className="w-6 h-6" />
              </div>
              <span className="text-xs">Share</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveVideoModal;
