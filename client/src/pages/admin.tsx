import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ExternalDataSync from "@/components/ExternalDataSync";
import ExternalAPITester from "@/components/ExternalAPITester";
import CityExperienceSync from "@/components/CityExperienceSync";
import CityTrends from "@/components/CityTrends";
import { useLocation } from "wouter";

export default function Admin() {
  const { user, isAuthenticated } = useAuth() as { user: User | null; isAuthenticated: boolean };
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-gray-400 mb-6">Admin access requires authentication</p>
          <Button
                onClick={() => window.location.href = "/login"}
            className="bg-primary hover:bg-primary/90"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="mr-4 text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {user?.firstName || user?.email}
            </span>
            {user?.profileImageUrl && (
              <img
                src={user.profileImageUrl}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">LocalVibe Admin</h2>
          <p className="text-gray-400">
            Manage external data sources and sync live events from various platforms
          </p>
        </div>

        <ExternalDataSync />

        {/* External API Testing Section */}
        <div className="mt-12">
          <ExternalAPITester />
        </div>

        {/* City-specific Experience Sync */}
        <div className="mt-12">
          <CityExperienceSync />
        </div>

        {/* City Trends Analytics */}
        <div className="mt-12">
          <CityTrends />
        </div>

        {/* Statistics Section */}
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-6">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">API Status</h4>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-2xl font-bold text-green-500">Online</p>
              <p className="text-sm text-gray-400">All systems operational</p>
            </div>

            <div className="bg-surface border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">External APIs</h4>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
              <p className="text-2xl font-bold text-yellow-500">3/5</p>
              <p className="text-sm text-gray-400">APIs configured</p>
            </div>

            <div className="bg-surface border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Database</h4>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-2xl font-bold text-green-500">Connected</p>
              <p className="text-sm text-gray-400">PostgreSQL active</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
          <div className="bg-surface border border-gray-800 rounded-lg p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-300">System started successfully</span>
                <span className="text-gray-500">2 minutes ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Database connected</span>
                <span className="text-gray-500">2 minutes ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-300">External APIs initialized</span>
                <span className="text-gray-500">2 minutes ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}