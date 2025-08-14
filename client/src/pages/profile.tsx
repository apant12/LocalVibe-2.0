import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import HeaderNav from "@/components/HeaderNav";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/logout', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Invalidate and refetch the auth query to update the UI
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
      } else {
        console.error('Logout failed');
        toast({
          title: "Logout failed",
          description: "There was an error logging you out.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging you out.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (!user) {
    return null;
  }

  const getUserInitials = (user: any) => {
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  const getBadgeForPoints = (points: number) => {
    if (points >= 1000) return { name: "Explorer Master", icon: "fas fa-crown", color: "bg-warning" };
    if (points >= 500) return { name: "Adventure Seeker", icon: "fas fa-star", color: "bg-primary" };
    if (points >= 100) return { name: "Local Explorer", icon: "fas fa-compass", color: "bg-secondary" };
    return { name: "Newcomer", icon: "fas fa-user", color: "bg-gray-600" };
  };

  const badge = getBadgeForPoints(user.points || 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderNav user={user} />
      
      <div className="pt-20 pb-24 px-4 space-y-6">
        {/* Profile Header */}
        <Card className="bg-surface border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="w-20 h-20 border-2 border-primary">
                <AvatarImage src={user.profileImageUrl} />
                <AvatarFallback className="bg-primary text-white text-xl font-bold">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email?.split('@')[0] || 'User'
                  }
                </h1>
                {user.email && (
                  <p className="text-gray-400">{user.email}</p>
                )}
                {user.location && (
                  <div className="flex items-center text-sm text-gray-300 mt-1">
                    <i className="fas fa-map-marker-alt mr-1"></i>
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge className={`${badge.color} text-white`}>
                <i className={`${badge.icon} mr-1`}></i>
                {badge.name}
              </Badge>
              <div className="text-sm">
                <span className="text-gray-400">Points:</span>
                <span className="ml-1 font-bold text-warning">{user.points || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-surface border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">0</div>
              <div className="text-xs text-gray-400">Experiences</div>
            </CardContent>
          </Card>
          <Card className="bg-surface border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary mb-1">0</div>
              <div className="text-xs text-gray-400">Reviews</div>
            </CardContent>
          </Card>
          <Card className="bg-surface border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning mb-1">0</div>
              <div className="text-xs text-gray-400">Saved</div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Options */}
        <div className="space-y-3">
          <Card className="bg-surface border-gray-800">
            <CardContent className="p-0">
              <Button variant="ghost" className="w-full h-auto p-4 justify-start rounded-none">
                <i className="fas fa-heart text-primary mr-3"></i>
                <span>Liked Experiences</span>
                <i className="fas fa-chevron-right ml-auto text-gray-400"></i>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-surface border-gray-800">
            <CardContent className="p-0">
              <Button variant="ghost" className="w-full h-auto p-4 justify-start rounded-none">
                <i className="fas fa-bookmark text-secondary mr-3"></i>
                <span>Saved Experiences</span>
                <i className="fas fa-chevron-right ml-auto text-gray-400"></i>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-surface border-gray-800">
            <CardContent className="p-0">
              <Button variant="ghost" className="w-full h-auto p-4 justify-start rounded-none">
                <i className="fas fa-star text-warning mr-3"></i>
                <span>My Reviews</span>
                <i className="fas fa-chevron-right ml-auto text-gray-400"></i>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-surface border-gray-800">
            <CardContent className="p-0">
              <Button variant="ghost" className="w-full h-auto p-4 justify-start rounded-none">
                <i className="fas fa-cog text-gray-400 mr-3"></i>
                <span>Settings</span>
                <i className="fas fa-chevron-right ml-auto text-gray-400"></i>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-surface border-gray-800">
            <CardContent className="p-0">
              <Button variant="ghost" className="w-full h-auto p-4 justify-start rounded-none">
                <i className="fas fa-question-circle text-gray-400 mr-3"></i>
                <span>Help & Support</span>
                <i className="fas fa-chevron-right ml-auto text-gray-400"></i>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Logout Button */}
        <Card className="bg-surface border-gray-800">
          <CardContent className="p-4">
            <Button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="destructive" 
              className="w-full"
            >
              {isLoggingOut ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Signing out...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Sign Out
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNav activeTab="profile" />
    </div>
  );
}
