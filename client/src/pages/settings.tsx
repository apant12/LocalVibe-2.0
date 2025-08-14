import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, User as UserIcon, Bell, Shield, CreditCard, MapPin, Moon, Sun } from "lucide-react";
import { useLocation } from "wouter";

export default function Settings() {
  const { user } = useAuth() as { user: User | null };
  const [, navigate] = useLocation();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-lg border-b border-gray-800 px-4 py-4">
        <div className="flex items-center">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="mr-4 text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Section */}
        <Card className="bg-surface border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <UserIcon className="w-5 h-5 mr-2" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold text-white">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-gray-400 text-sm">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-gray-700 text-white hover:bg-gray-800"
              onClick={() => navigate('/profile')}
            >
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="bg-surface border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <div>
                  <p className="font-medium text-white">Dark Mode</p>
                  <p className="text-sm text-gray-400">Toggle dark/light theme</p>
                </div>
              </div>
              <Switch 
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5" />
                <div>
                  <p className="font-medium text-white">Notifications</p>
                  <p className="text-sm text-gray-400">Experience updates and reminders</p>
                </div>
              </div>
              <Switch 
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5" />
                <div>
                  <p className="font-medium text-white">Location Sharing</p>
                  <p className="text-sm text-gray-400">Find experiences near you</p>
                </div>
              </div>
              <Switch 
                checked={locationSharing}
                onCheckedChange={setLocationSharing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment & Security */}
        <Card className="bg-surface border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Payment & Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-white hover:bg-gray-800"
            >
              <CreditCard className="w-5 h-5 mr-3" />
              Payment Methods
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-white hover:bg-gray-800"
            >
              <Shield className="w-5 h-5 mr-3" />
              Privacy & Security
            </Button>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="bg-surface border-gray-800">
          <CardContent className="pt-6 space-y-4">
            <Button 
              variant="destructive"
              className="w-full"
                onClick={() => window.location.href = "/api/logout"}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}