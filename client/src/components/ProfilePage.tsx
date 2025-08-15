import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, Edit, Camera, Heart, MessageCircle, Share, MoreHorizontal, Grid, Play } from 'lucide-react';

interface UserVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  experienceId: string;
  experienceTitle: string;
  uploadedAt: string;
  likes: number;
  comments: number;
  views: number;
  duration: number;
}

interface UserStats {
  totalVideos: number;
  totalLikes: number;
  totalViews: number;
  followers: number;
  following: number;
}

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'videos' | 'liked' | 'saved'>('videos');

  // Mock user data
  const user = {
    id: 'user-1',
    username: 'traveler_jane',
    displayName: 'Jane Traveler',
    bio: 'Exploring the world one experience at a time ✈️🌍',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150',
    isVerified: true,
    location: 'San Francisco, CA',
    website: 'https://janetraveler.com'
  };

  const stats: UserStats = {
    totalVideos: 8,
    totalLikes: 1247,
    totalViews: 15420,
    followers: 342,
    following: 156
  };

  // Mock user videos
  const userVideos: UserVideo[] = [
    {
      id: 'video-1',
      title: 'Amazing Coffee Tasting Experience',
      description: 'Had the best coffee tasting in downtown SF!',
      thumbnailUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      experienceId: '1',
      experienceTitle: 'Local Coffee Tasting',
      uploadedAt: '2025-01-15T10:00:00Z',
      likes: 45,
      comments: 12,
      views: 234,
      duration: 45
    },
    {
      id: 'video-2',
      title: 'Concert in the Park Highlights',
      description: 'Incredible live music performance!',
      thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      experienceId: 'tm-event-1',
      experienceTitle: 'Concert in the Park',
      uploadedAt: '2025-01-12T15:30:00Z',
      likes: 89,
      comments: 23,
      views: 567,
      duration: 60
    },
    {
      id: 'video-3',
      title: 'Golden Gate Bridge Sunset',
      description: 'Perfect sunset at the iconic bridge',
      thumbnailUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      experienceId: 'place-1',
      experienceTitle: 'Golden Gate Bridge',
      uploadedAt: '2025-01-10T18:00:00Z',
      likes: 156,
      comments: 34,
      views: 892,
      duration: 30
    },
    {
      id: 'video-4',
      title: 'Comedy Night Laughs',
      description: 'Hilarious comedy show downtown!',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      experienceId: 'tm-event-2',
      experienceTitle: 'Comedy Night',
      uploadedAt: '2025-01-08T20:15:00Z',
      likes: 67,
      comments: 18,
      views: 445,
      duration: 40
    }
  ];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">{user.username}</h1>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Camera className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Profile Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-24 h-24 rounded-full object-cover"
              />
              {user.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">{user.displayName}</h2>
                <button className="px-4 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors">
                  Edit Profile
                </button>
              </div>
              
              <p className="text-gray-600 mb-3">{user.bio}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span>{user.location}</span>
                {user.website && (
                  <a href={user.website} className="text-blue-600 hover:underline">
                    {user.website.replace('https://', '')}
                  </a>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{formatNumber(stats.totalVideos)}</div>
                  <div className="text-sm text-gray-600">videos</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{formatNumber(stats.followers)}</div>
                  <div className="text-sm text-gray-600">followers</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{formatNumber(stats.following)}</div>
                  <div className="text-sm text-gray-600">following</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{formatNumber(stats.totalLikes)}</div>
                  <div className="text-sm text-gray-600">likes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'videos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            Videos ({userVideos.length})
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'liked'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Heart className="w-4 h-4" />
            Liked
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'saved'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Saved
          </button>
        </div>

        {/* Videos Grid */}
        {activeTab === 'videos' && (
          <div className="grid grid-cols-3 gap-1">
            {userVideos.map((video) => (
              <div key={video.id} className="relative group cursor-pointer">
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  
                  {/* Video Duration */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                    {formatDuration(video.duration)}
                  </div>
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Video Stats */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 text-white text-xs">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{formatNumber(video.likes)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{formatNumber(video.comments)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Video Info */}
                <div className="mt-2">
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{video.title}</h3>
                  <p className="text-xs text-gray-600">{video.experienceTitle}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(video.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Liked Videos */}
        {activeTab === 'liked' && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No liked videos yet</h3>
            <p className="text-gray-600">Videos you like will appear here</p>
          </div>
        )}

        {/* Saved Videos */}
        {activeTab === 'saved' && (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved videos yet</h3>
            <p className="text-gray-600">Videos you save will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
