import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Check, X, Calendar, MapPin, DollarSign, Users, Clock, MessageCircle } from "lucide-react";

interface Notification {
  id: string;
  type: 'booking_confirmed' | 'experience_reminder' | 'price_drop' | 'new_experience' | 'cancellation' | 'review_request';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    experienceId?: string;
    bookingId?: string;
    price?: number;
    originalPrice?: number;
  };
}

interface Message {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'direct' | 'booking_related' | 'experience_question';
  experienceId?: string;
}

export default function NotificationMessaging() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    enabled: !!user,
  });

  // Mark notification as read
  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest("PUT", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  // Mark message as read
  const markMessageReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return apiRequest("PUT", `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ toUserId, message, experienceId }: { toUserId: string; message: string; experienceId?: string }) => {
      return apiRequest("POST", "/api/messages", {
        toUserId,
        message,
        experienceId,
        type: experienceId ? 'experience_question' : 'direct'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
        className: "bg-green-600 text-white",
      });
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'experience_reminder':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'price_drop':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'new_experience':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'cancellation':
        return <X className="w-4 h-4 text-red-500" />;
      case 'review_request':
        return <MessageCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return 'bg-green-500/10 border-green-500/20';
      case 'experience_reminder':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'price_drop':
        return 'bg-green-500/10 border-green-500/20';
      case 'new_experience':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'cancellation':
        return 'bg-red-500/10 border-red-500/20';
      case 'review_request':
        return 'bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length + messages.filter(m => !m.isRead).length;

  // Mock data for demo (in production, this would come from API)
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: 'Your Jazz Jam Session booking has been confirmed for tonight at 8 PM',
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      isRead: false,
      metadata: { experienceId: 'jazz-session', bookingId: 'book-123' }
    },
    {
      id: '2',
      type: 'price_drop',
      title: 'Price Drop Alert',
      message: 'Sunset Photography Workshop is now $25 (was $40)',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      isRead: false,
      metadata: { experienceId: 'photo-workshop', price: 25, originalPrice: 40 }
    },
    {
      id: '3',
      type: 'new_experience',
      title: 'New Experience Available',
      message: 'A new "Rooftop Yoga" experience just launched in your area',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      isRead: true,
      metadata: { experienceId: 'rooftop-yoga' }
    },
  ];

  const mockMessages: Message[] = [
    {
      id: '1',
      fromUserId: 'host-123',
      fromUserName: 'Sarah (Jazz Club Host)',
      toUserId: user?.id || '',
      message: 'Looking forward to seeing you at tonight\'s jam session! Bring your instrument if you have one.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
      type: 'booking_related',
      experienceId: 'jazz-session'
    },
    {
      id: '2', 
      fromUserId: 'user-456',
      fromUserName: 'Mike',
      toUserId: user?.id || '',
      message: 'Hey! I saw your review of the food tour. Would you recommend it for someone new to the city?',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      isRead: false,
      type: 'direct'
    }
  ];

  const displayNotifications = notifications.length > 0 ? notifications : mockNotifications;
  const displayMessages = messages.length > 0 ? messages : mockMessages;

  return (
    <Card className="bg-surface border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <Bell className="w-5 h-5 text-primary" />
            <span>Notifications & Messages</span>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-2 mt-4">
          <Button
            onClick={() => setActiveTab('notifications')}
            variant={activeTab === 'notifications' ? 'default' : 'ghost'}
            size="sm"
            className={activeTab === 'notifications' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications ({displayNotifications.filter(n => !n.isRead).length})
          </Button>
          <Button
            onClick={() => setActiveTab('messages')}
            variant={activeTab === 'messages' ? 'default' : 'ghost'}
            size="sm"
            className={activeTab === 'messages' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Messages ({displayMessages.filter(m => !m.isRead).length})
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          {activeTab === 'notifications' ? (
            <div className="space-y-3">
              {displayNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors hover:bg-black/40 ${
                    notification.isRead ? 'bg-black/20 border-gray-700' : getNotificationColor(notification.type)
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-semibold ${notification.isRead ? 'text-gray-300' : 'text-white'}`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          {!notification.isRead && (
                            <Button
                              onClick={() => markNotificationReadMutation.mutate(notification.id)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm ${notification.isRead ? 'text-gray-400' : 'text-gray-300'}`}>
                        {notification.message}
                      </p>
                      
                      {notification.metadata && (
                        <div className="mt-2 flex items-center space-x-4 text-xs">
                          {notification.metadata.price && notification.metadata.originalPrice && (
                            <div className="flex items-center space-x-1 text-green-400">
                              <DollarSign className="w-3 h-3" />
                              <span>${notification.metadata.price}</span>
                              <span className="text-gray-500 line-through">
                                ${notification.metadata.originalPrice}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {displayMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg border transition-colors hover:bg-black/40 ${
                    message.isRead ? 'bg-black/20 border-gray-700' : 'bg-blue-500/10 border-blue-500/20'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-black">
                        {message.fromUserName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-semibold text-sm ${message.isRead ? 'text-gray-300' : 'text-white'}`}>
                          {message.fromUserName}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(message.timestamp)}
                          </span>
                          {!message.isRead && (
                            <Button
                              onClick={() => markMessageReadMutation.mutate(message.id)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm ${message.isRead ? 'text-gray-400' : 'text-gray-300'}`}>
                        {message.message}
                      </p>
                      
                      {message.experienceId && (
                        <Badge variant="secondary" className="mt-2 text-xs bg-gray-700 text-gray-300">
                          Experience Related
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Quick Actions */}
        {activeTab === 'notifications' && displayNotifications.some(n => !n.isRead) && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <Button
              onClick={() => {
                displayNotifications.forEach(n => {
                  if (!n.isRead) {
                    markNotificationReadMutation.mutate(n.id);
                  }
                });
              }}
              size="sm"
              variant="outline"
              className="text-gray-400 hover:text-white border-gray-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark All as Read
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}