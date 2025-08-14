import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/components/LocationContext";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp, 
  Star, 
  Eye, 
  MessageSquare, 
  Settings,
  BarChart3,
  Clock
} from "lucide-react";

interface BusinessMetrics {
  totalRevenue: number;
  revenueChange: number;
  totalBookings: number;
  bookingsChange: number;
  avgRating: number;
  ratingChange: number;
  totalViews: number;
  viewsChange: number;
  activeExperiences: number;
  pendingRequests: number;
}

interface ExperiencePerformance {
  id: string;
  title: string;
  revenue: number;
  bookings: number;
  views: number;
  rating: number;
  conversionRate: number;
  status: 'active' | 'paused' | 'draft';
}

export default function BusinessDashboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const { user } = useAuth();
  const { currentCity } = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock business metrics (in production, this would come from API)
  const mockMetrics: BusinessMetrics = {
    totalRevenue: 12450,
    revenueChange: 15.2,
    totalBookings: 89,
    bookingsChange: 8.3,
    avgRating: 4.7,
    ratingChange: 0.2,
    totalViews: 2341,
    viewsChange: 22.1,
    activeExperiences: 12,
    pendingRequests: 3
  };

  // Mock experience performance data
  const mockPerformances: ExperiencePerformance[] = [
    {
      id: '1',
      title: 'Jazz Jam Session',
      revenue: 3200,
      bookings: 32,
      views: 456,
      rating: 4.8,
      conversionRate: 7.0,
      status: 'active'
    },
    {
      id: '2', 
      title: 'Sunset Photography Workshop',
      revenue: 2800,
      bookings: 28,
      views: 523,
      rating: 4.6,
      conversionRate: 5.4,
      status: 'active'
    },
    {
      id: '3',
      title: 'Rooftop Yoga Session',
      revenue: 1950,
      bookings: 39,
      views: 678,
      rating: 4.9,
      conversionRate: 5.8,
      status: 'active'
    }
  ];

  const { data: metrics = mockMetrics } = useQuery({
    queryKey: ['/api/business/metrics', timeRange],
    enabled: !!user,
  });

  const { data: performances = mockPerformances } = useQuery({
    queryKey: ['/api/business/performance', timeRange],
    enabled: !!user,
  });

  const updateExperienceStatusMutation = useMutation({
    mutationFn: async ({ experienceId, status }: { experienceId: string; status: string }) => {
      return apiRequest("PUT", `/api/experiences/${experienceId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business/performance'] });
      toast({
        title: "Status Updated",
        description: "Experience status has been updated successfully",
        className: "bg-green-600 text-white",
      });
    }
  });

  const getChangeIcon = (change: number) => {
    return change >= 0 ? '↗️' : '↘️';
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-500' : 'text-red-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'paused':
        return 'bg-yellow-500 text-black';
      case 'draft':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Business Dashboard</h1>
          <p className="text-gray-400">
            Managing experiences in {currentCity.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-surface border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="year">Last year</option>
          </select>
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-black">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-surface border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ${metrics.totalRevenue.toLocaleString()}
                </p>
                <p className={`text-sm flex items-center space-x-1 mt-1 ${getChangeColor(metrics.revenueChange)}`}>
                  <span>{getChangeIcon(metrics.revenueChange)}</span>
                  <span>{Math.abs(metrics.revenueChange)}% vs last {timeRange}</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Bookings</p>
                <p className="text-2xl font-bold text-white">{metrics.totalBookings}</p>
                <p className={`text-sm flex items-center space-x-1 mt-1 ${getChangeColor(metrics.bookingsChange)}`}>
                  <span>{getChangeIcon(metrics.bookingsChange)}</span>
                  <span>{Math.abs(metrics.bookingsChange)}% vs last {timeRange}</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Rating</p>
                <p className="text-2xl font-bold text-white">{metrics.avgRating}</p>
                <p className={`text-sm flex items-center space-x-1 mt-1 ${getChangeColor(metrics.ratingChange)}`}>
                  <span>{getChangeIcon(metrics.ratingChange)}</span>
                  <span>+{Math.abs(metrics.ratingChange)} vs last {timeRange}</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Views</p>
                <p className="text-2xl font-bold text-white">{metrics.totalViews.toLocaleString()}</p>
                <p className={`text-sm flex items-center space-x-1 mt-1 ${getChangeColor(metrics.viewsChange)}`}>
                  <span>{getChangeIcon(metrics.viewsChange)}</span>
                  <span>{Math.abs(metrics.viewsChange)}% vs last {timeRange}</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experience Performance */}
      <Card className="bg-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span>Experience Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performances.map((exp) => (
              <div key={exp.id} className="bg-black/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-white font-semibold">{exp.title}</h4>
                    <Badge className={getStatusColor(exp.status)}>
                      {exp.status}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateExperienceStatusMutation.mutate({
                      experienceId: exp.id,
                      status: exp.status === 'active' ? 'paused' : 'active'
                    })}
                    className="text-gray-400 hover:text-white border-gray-600"
                  >
                    {exp.status === 'active' ? 'Pause' : 'Activate'}
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Revenue</p>
                    <p className="text-white font-semibold">${exp.revenue}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Bookings</p>
                    <p className="text-white font-semibold">{exp.bookings}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Views</p>
                    <p className="text-white font-semibold">{exp.views}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Rating</p>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-white font-semibold">{exp.rating}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400">Conversion</p>
                    <p className="text-white font-semibold">{exp.conversionRate}%</p>
                  </div>
                </div>

                {/* Conversion Rate Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Conversion Rate</span>
                    <span>{exp.conversionRate}%</span>
                  </div>
                  <Progress value={exp.conversionRate} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-surface border-gray-800">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white">{metrics.activeExperiences}</h3>
            <p className="text-gray-400 text-sm">Active Experiences</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-800">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold text-white">{metrics.pendingRequests}</h3>
            <p className="text-gray-400 text-sm">Pending Requests</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-800">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-white">
              ${(metrics.totalRevenue / metrics.totalBookings).toFixed(0)}
            </h3>
            <p className="text-gray-400 text-sm">Avg Booking Value</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}