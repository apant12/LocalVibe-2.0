import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Share, 
  UserPlus, 
  Users, 
  MessageCircle, 
  Heart, 
  ExternalLink,
  Copy,
  Facebook,
  Twitter,
  Instagram
} from "lucide-react";
import type { Experience, User } from "@shared/schema";

interface Friend {
  id: string;
  username: string;
  profileImageUrl?: string;
  mutualFriends: number;
  status: 'pending' | 'accepted' | 'suggested';
}

interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  experienceId: string;
  experienceTitle: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface SocialSharingProps {
  experience?: Experience;
  onClose?: () => void;
}

export default function SocialSharing({ experience, onClose }: SocialSharingProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'friends' | 'feed'>('share');
  const [shareText, setShareText] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock friends data (in production, this would come from API)
  const mockFriends: Friend[] = [
    {
      id: '1',
      username: 'alex_explorer',
      profileImageUrl: '',
      mutualFriends: 5,
      status: 'accepted'
    },
    {
      id: '2', 
      username: 'sarah_adventures',
      profileImageUrl: '',
      mutualFriends: 3,
      status: 'accepted'
    },
    {
      id: '3',
      username: 'mike_foodie',
      profileImageUrl: '',
      mutualFriends: 2,
      status: 'suggested'
    }
  ];

  // Mock social feed (in production, this would come from API)
  const mockFeed: SocialPost[] = [
    {
      id: '1',
      userId: '1',
      userName: 'alex_explorer',
      experienceId: 'jazz-session',
      experienceTitle: 'Jazz Jam Session',
      content: 'Amazing jazz night! The atmosphere was incredible and met some talented musicians. Highly recommend! 🎷',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      likes: 12,
      comments: 3,
      isLiked: false
    },
    {
      id: '2',
      userId: '2', 
      userName: 'sarah_adventures',
      experienceId: 'photo-workshop',
      experienceTitle: 'Sunset Photography Workshop',
      content: 'Learned so much about composition and lighting. The golden hour shots came out perfect! 📸',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      likes: 8,
      comments: 5,
      isLiked: true
    }
  ];

  const { data: friends = mockFriends } = useQuery({
    queryKey: ['/api/friends'],
    enabled: !!user,
  });

  const { data: socialFeed = mockFeed } = useQuery({
    queryKey: ['/api/social/feed'],
    enabled: !!user,
  });

  const shareExperienceMutation = useMutation({
    mutationFn: async ({ platform, content }: { platform: string; content: string }) => {
      return apiRequest("POST", "/api/social/share", {
        experienceId: experience?.id,
        platform,
        content
      });
    },
    onSuccess: () => {
      toast({
        title: "Shared Successfully",
        description: "Your experience has been shared with your network",
        className: "bg-green-600 text-white",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social/feed'] });
    }
  });

  const addFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      return apiRequest("POST", `/api/friends/${friendId}/add`);
    },
    onSuccess: () => {
      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent",
        className: "bg-green-600 text-white",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
    }
  });

  const likeFeedPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("POST", `/api/social/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/feed'] });
    }
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard",
        description: "Share link has been copied",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const generateShareUrl = () => {
    if (!experience) return '';
    return `${window.location.origin}/experience/${experience.id}`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card className="bg-surface border-gray-800 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Share className="w-5 h-5 text-primary" />
            <span>Social Hub</span>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400">
              ✕
            </Button>
          )}
        </CardTitle>
        
        {/* Tab Navigation */}
        <div className="flex space-x-2 mt-4">
          <Button
            onClick={() => setActiveTab('share')}
            variant={activeTab === 'share' ? 'default' : 'ghost'}
            size="sm"
            className={activeTab === 'share' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            onClick={() => setActiveTab('friends')}
            variant={activeTab === 'friends' ? 'default' : 'ghost'}
            size="sm"
            className={activeTab === 'friends' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}
          >
            <Users className="w-4 h-4 mr-2" />
            Friends ({friends.filter(f => f.status === 'accepted').length})
          </Button>
          <Button
            onClick={() => setActiveTab('feed')}
            variant={activeTab === 'feed' ? 'default' : 'ghost'}
            size="sm"
            className={activeTab === 'feed' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Feed
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Share Tab */}
        {activeTab === 'share' && experience && (
          <div className="space-y-4">
            <div className="bg-black/20 rounded-lg p-3">
              <h4 className="text-white font-semibold mb-2">{experience.title}</h4>
              <p className="text-gray-400 text-sm mb-3">{experience.description}</p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>${experience.price}</span>
                <span>•</span>
                <span>{experience.location}</span>
                <span>•</span>
                <span>⭐ {experience.averageRating}</span>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                placeholder="Add a personal message..."
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                className="w-full bg-black/40 border border-gray-600 rounded-md p-3 text-white placeholder-gray-400 resize-none"
                rows={3}
              />

              {/* Share Platforms */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => shareExperienceMutation.mutate({ platform: 'facebook', content: shareText })}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </Button>
                <Button
                  onClick={() => shareExperienceMutation.mutate({ platform: 'twitter', content: shareText })}
                  className="bg-sky-500 hover:bg-sky-600 text-white flex items-center space-x-2"
                >
                  <Twitter className="w-4 h-4" />
                  <span>Twitter</span>
                </Button>
                <Button
                  onClick={() => shareExperienceMutation.mutate({ platform: 'instagram', content: shareText })}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white flex items-center space-x-2"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </Button>
                <Button
                  onClick={() => copyToClipboard(generateShareUrl())}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800 flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {friends.map(friend => (
              <div key={friend.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={friend.profileImageUrl} />
                    <AvatarFallback className="bg-primary text-black font-semibold">
                      {friend.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-white font-semibold">{friend.username}</h4>
                    <p className="text-xs text-gray-400">{friend.mutualFriends} mutual friends</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    className={
                      friend.status === 'accepted' ? 'bg-green-600 text-white' :
                      friend.status === 'pending' ? 'bg-yellow-600 text-white' :
                      'bg-gray-600 text-white'
                    }
                  >
                    {friend.status}
                  </Badge>
                  {friend.status === 'suggested' && (
                    <Button
                      onClick={() => addFriendMutation.mutate(friend.id)}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-black"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {socialFeed.map(post => (
              <div key={post.id} className="bg-black/20 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={post.userAvatar} />
                    <AvatarFallback className="bg-primary text-black font-semibold text-sm">
                      {post.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h5 className="text-white font-semibold text-sm">{post.userName}</h5>
                    <p className="text-xs text-gray-400">{formatTimeAgo(post.timestamp)}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <Badge variant="secondary" className="mb-2 text-xs bg-gray-700 text-gray-300">
                    {post.experienceTitle}
                  </Badge>
                  <p className="text-gray-300 text-sm">{post.content}</p>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  <Button
                    onClick={() => likeFeedPostMutation.mutate(post.id)}
                    variant="ghost"
                    size="sm"
                    className={`p-0 h-auto ${post.isLiked ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="p-0 h-auto text-gray-400 hover:text-white">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {post.comments}
                  </Button>
                  <Button variant="ghost" size="sm" className="p-0 h-auto text-gray-400 hover:text-white">
                    <Share className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}