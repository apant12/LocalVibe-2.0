import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Settings, User, Home, LogOut, MapPin } from "lucide-react";
import CitySelector from "@/components/CitySelector";
import { useLocation as useLocationContext } from "@/components/LocationContext";
import FortuneCookie from "@/components/FortuneCookie";
import { useAuth } from "@/hooks/useAuth";

interface HeaderNavProps {
  user?: any;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  currentLocation?: string;
  onLocationChange?: (location: string) => void;
}

export default function HeaderNav({ 
  user, 
  onSearchClick, 
  onNotificationsClick, 
  currentLocation, 
  onLocationChange 
}: HeaderNavProps) {
  const [, navigate] = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { currentCity, setCurrentCity } = useLocationContext();
  const { signOut } = useAuth();
  
  const handleLocationChange = (city: any) => {
    setCurrentCity(city);
    if (onLocationChange) {
      onLocationChange(city.name);
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-3 sm:p-4 flex justify-between items-center glass-effect">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <CitySelector 
          currentCity={currentLocation || currentCity.name}
          onCityChange={handleLocationChange}
        />
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4">
        <FortuneCookie />
        <div className="relative">
          <i 
            className="fas fa-search text-base sm:text-lg cursor-pointer hover:text-primary transition-colors" 
            onClick={onSearchClick}
          ></i>
        </div>
        <div className="relative">
          <i 
            className="fas fa-bell text-base sm:text-lg cursor-pointer hover:text-primary transition-colors" 
            onClick={onNotificationsClick}
          ></i>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></div>
        </div>
        
        {/* Profile Menu */}
        <div className="relative">
          <div 
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-primary cursor-pointer"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <img 
              src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 top-10 bg-surface border border-gray-800 rounded-xl shadow-lg w-40 sm:w-48 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-800">
                <p className="font-medium text-white text-sm">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-gray-400 text-xs">{user?.email}</p>
              </div>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-gray-800 px-4"
                onClick={() => {
                  navigate('/');
                  setShowProfileMenu(false);
                }}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-gray-800 px-4"
                onClick={() => {
                  navigate('/map');
                  setShowProfileMenu(false);
                }}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Map
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-gray-800 px-4"
                onClick={() => {
                  navigate('/profile');
                  setShowProfileMenu(false);
                }}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-gray-800 px-4"
                onClick={() => {
                  navigate('/settings');
                  setShowProfileMenu(false);
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              
              <div className="border-t border-gray-800 my-2" />
              
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-gray-800 px-4"
                onClick={() => {
                  signOut();
                  setShowProfileMenu(false);
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Close menu when clicking outside */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </div>
  );
}
