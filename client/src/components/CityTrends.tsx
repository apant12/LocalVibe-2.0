import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "@/components/LocationContext";
import { TrendingUp, MapPin, Clock, Users } from "lucide-react";

interface TrendingCategory {
  id: string;
  name: string;
  growth: number;
  experienceCount: number;
}

interface CityTrend {
  category: string;
  popularity: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  averagePrice: number;
}

export default function CityTrends() {
  const { currentCity } = useLocation();

  // Mock trending data - in production, this would come from analytics API
  const mockTrends: CityTrend[] = [
    { category: "Food & Drinks", popularity: 85, timeOfDay: 'evening', averagePrice: 45 },
    { category: "Outdoor Adventures", popularity: 78, timeOfDay: 'morning', averagePrice: 65 },
    { category: "Arts & Culture", popularity: 72, timeOfDay: 'afternoon', averagePrice: 35 },
    { category: "Wellness & Fitness", popularity: 68, timeOfDay: 'morning', averagePrice: 55 },
    { category: "Nightlife & Entertainment", popularity: 64, timeOfDay: 'evening', averagePrice: 40 },
  ];

  const { data: trends = mockTrends } = useQuery({
    queryKey: ['/api/trends', currentCity.name],
    queryFn: async () => {
      // In production, fetch real trending data
      return mockTrends;
    },
    enabled: !!currentCity,
  });

  const getTimeIcon = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'morning':
        return '🌅';
      case 'afternoon': 
        return '☀️';
      case 'evening':
        return '🌆';
      default:
        return '⏰';
    }
  };

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 80) return 'bg-green-500';
    if (popularity >= 70) return 'bg-yellow-500';
    if (popularity >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getLocalTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: currentCity.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card className="bg-surface border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span>Trending in {currentCity.name}</span>
        </CardTitle>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3" />
            <span>{currentCity.country}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Local: {getLocalTime()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trends.map((trend, index) => (
            <div key={trend.category} className="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/40 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-primary">
                    #{index + 1}
                  </span>
                  <span className="text-lg">
                    {getTimeIcon(trend.timeOfDay)}
                  </span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">{trend.category}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className={`${getPopularityColor(trend.popularity)} text-white text-xs`}>
                      {trend.popularity}% hot
                    </Badge>
                    <span className="text-xs text-gray-400">
                      Popular in {trend.timeOfDay}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">
                  ${trend.averagePrice}
                </div>
                <div className="text-xs text-gray-400">
                  avg price
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* City Stats */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">
                {currentCity.experienceCount || 156}
              </div>
              <div className="text-xs text-gray-400">Experiences</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-500">
                {Math.floor(Math.random() * 50) + 20}
              </div>
              <div className="text-xs text-gray-400">Available Now</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-yellow-500">
                4.{Math.floor(Math.random() * 3) + 6}
              </div>
              <div className="text-xs text-gray-400">Avg Rating</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}