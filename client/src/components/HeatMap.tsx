import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "@/components/LocationContext";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, TrendingUp, Clock, Users, Thermometer } from "lucide-react";

interface HeatMapData {
  lat: number;
  lng: number;
  intensity: number;
  experienceCount: number;
  avgPrice: number;
  topCategory: string;
  peakTime: string;
  label: string;
}

interface TimeSlot {
  hour: number;
  label: string;
  intensity: number;
}

export default function HeatMap() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'now' | 'evening' | 'weekend'>('now');
  const [heatmapData, setHeatmapData] = useState<HeatMapData[]>([]);
  const { currentCity } = useLocation();
  const { user } = useAuth();

  // Time ranges for analysis
  const timeRanges = {
    now: { label: 'Right Now', icon: '⚡' },
    evening: { label: 'This Evening', icon: '🌆' },
    weekend: { label: 'This Weekend', icon: '📅' }
  };

  // Generate mock heatmap data based on city and time
  const generateHeatmapData = useMemo(() => {
    const baseData: Omit<HeatMapData, 'intensity'>[] = [
      {
        lat: currentCity.coordinates.lat + 0.01,
        lng: currentCity.coordinates.lng - 0.01,
        experienceCount: 15,
        avgPrice: 45,
        topCategory: 'Food & Drinks',
        peakTime: '7:00 PM',
        label: 'Downtown District'
      },
      {
        lat: currentCity.coordinates.lat - 0.015,
        lng: currentCity.coordinates.lng + 0.02,
        experienceCount: 8,
        avgPrice: 65,
        topCategory: 'Arts & Culture',
        peakTime: '2:00 PM',
        label: 'Arts Quarter'
      },
      {
        lat: currentCity.coordinates.lat + 0.025,
        lng: currentCity.coordinates.lng + 0.015,
        experienceCount: 12,
        avgPrice: 35,
        topCategory: 'Outdoor Adventures',
        peakTime: '10:00 AM',
        label: 'Waterfront Area'
      },
      {
        lat: currentCity.coordinates.lat - 0.008,
        lng: currentCity.coordinates.lng - 0.025,
        experienceCount: 6,
        avgPrice: 85,
        topCategory: 'Wellness & Fitness',
        peakTime: '6:00 AM',
        label: 'Wellness District'
      },
      {
        lat: currentCity.coordinates.lat + 0.03,
        lng: currentCity.coordinates.lng - 0.015,
        experienceCount: 20,
        avgPrice: 55,
        topCategory: 'Nightlife & Entertainment',
        peakTime: '10:00 PM',
        label: 'Entertainment Zone'
      }
    ];

    // Calculate intensity based on time range and user preferences
    return baseData.map(area => {
      let intensity = area.experienceCount * 5; // Base intensity

      // Time-based modifiers
      if (selectedTimeRange === 'now') {
        const currentHour = new Date().getHours();
        if (area.topCategory === 'Food & Drinks' && currentHour >= 17 && currentHour <= 22) {
          intensity *= 1.5;
        } else if (area.topCategory === 'Nightlife & Entertainment' && currentHour >= 20) {
          intensity *= 2;
        } else if (area.topCategory === 'Wellness & Fitness' && currentHour >= 6 && currentHour <= 10) {
          intensity *= 1.3;
        }
      } else if (selectedTimeRange === 'evening') {
        if (['Food & Drinks', 'Nightlife & Entertainment'].includes(area.topCategory)) {
          intensity *= 1.8;
        }
      } else if (selectedTimeRange === 'weekend') {
        if (['Outdoor Adventures', 'Arts & Culture'].includes(area.topCategory)) {
          intensity *= 1.6;
        }
      }

      return {
        ...area,
        intensity: Math.min(intensity, 100) // Cap at 100
      };
    });
  }, [currentCity, selectedTimeRange]);

  useEffect(() => {
    setHeatmapData(generateHeatmapData);
  }, [generateHeatmapData]);

  // Generate hourly intensity data for timeline
  const hourlyData: TimeSlot[] = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => {
      let intensity = 20; // Base intensity

      // Peak times based on typical activity patterns
      if (hour >= 7 && hour <= 9) intensity += 25; // Morning
      if (hour >= 12 && hour <= 14) intensity += 20; // Lunch
      if (hour >= 17 && hour <= 22) intensity += 35; // Evening peak
      if (hour >= 22 || hour <= 2) intensity += 15; // Late night

      // Add some randomness
      intensity += Math.random() * 15;

      return {
        hour,
        label: hour === 0 ? '12 AM' : hour <= 12 ? `${hour} AM` : `${hour - 12} PM`,
        intensity: Math.min(intensity, 100)
      };
    });
  }, []);

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return 'bg-red-500';
    if (intensity >= 60) return 'bg-orange-500';
    if (intensity >= 40) return 'bg-yellow-500';
    if (intensity >= 20) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity >= 80) return 'Very Hot';
    if (intensity >= 60) return 'Hot';
    if (intensity >= 40) return 'Warm';
    if (intensity >= 20) return 'Cool';
    return 'Cold';
  };

  const getCurrentHour = () => new Date().getHours();

  return (
    <Card className="bg-surface border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Thermometer className="w-5 h-5 text-primary" />
            <span>Experience Heat Map</span>
          </div>
          <Badge className="bg-primary text-black">
            {currentCity.name}
          </Badge>
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Discover where the action is happening in real-time
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Time Range Selector */}
        <div className="flex space-x-2">
          {Object.entries(timeRanges).map(([key, range]) => (
            <Button
              key={key}
              onClick={() => setSelectedTimeRange(key as any)}
              variant={selectedTimeRange === key ? 'default' : 'ghost'}
              size="sm"
              className={
                selectedTimeRange === key 
                  ? 'bg-primary text-black' 
                  : 'text-gray-400 hover:text-white'
              }
            >
              <span className="mr-2">{range.icon}</span>
              {range.label}
            </Button>
          ))}
        </div>

        {/* Heat Map Visualization */}
        <div className="grid grid-cols-1 gap-3">
          {heatmapData
            .sort((a, b) => b.intensity - a.intensity)
            .map((area, index) => (
              <div
                key={`${area.lat}-${area.lng}`}
                className="bg-black/20 rounded-lg p-3 hover:bg-black/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-lg font-bold text-primary">#{index + 1}</span>
                      <MapPin className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{area.label}</h4>
                      <p className="text-xs text-gray-400">{area.topCategory}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getIntensityColor(area.intensity)} text-white`}>
                      {getIntensityLabel(area.intensity)}
                    </Badge>
                    <div className="text-xs text-gray-400 mt-1">
                      {Math.round(area.intensity)}% activity
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center space-x-1 text-gray-400">
                    <Users className="w-3 h-3" />
                    <span>{area.experienceCount} experiences</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-400">
                    <span>💰</span>
                    <span>Avg ${area.avgPrice}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>Peak: {area.peakTime}</span>
                  </div>
                </div>

                {/* Intensity Bar */}
                <div className="mt-3 bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${getIntensityColor(area.intensity)}`}
                    style={{ width: `${area.intensity}%` }}
                  ></div>
                </div>
              </div>
            ))}
        </div>

        {/* Hourly Timeline */}
        <div className="space-y-3">
          <h5 className="text-white font-semibold flex items-center space-x-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>24-Hour Activity Timeline</span>
          </h5>
          
          <div className="bg-black/20 rounded-lg p-3">
            <div className="grid grid-cols-12 gap-1 mb-2">
              {hourlyData.map((slot) => (
                <div key={slot.hour} className="text-center">
                  <div 
                    className={`h-12 rounded transition-all duration-300 ${getIntensityColor(slot.intensity)} ${
                      slot.hour === getCurrentHour() ? 'ring-2 ring-primary animate-pulse' : ''
                    }`}
                    style={{ opacity: slot.intensity / 100 }}
                    title={`${slot.label}: ${Math.round(slot.intensity)}% activity`}
                  ></div>
                  {slot.hour % 6 === 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {slot.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Current Time Indicator */}
            <div className="flex items-center justify-center space-x-2 text-xs text-primary">
              <TrendingUp className="w-3 h-3" />
              <span>Current time: {hourlyData[getCurrentHour()]?.label}</span>
              <Badge className="bg-primary text-black text-xs">
                {Math.round(hourlyData[getCurrentHour()]?.intensity || 0)}% active
              </Badge>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-black/20 rounded-lg p-3">
          <h6 className="text-white font-medium mb-2">Activity Levels</h6>
          <div className="flex justify-between items-center text-xs">
            {['Cold', 'Cool', 'Warm', 'Hot', 'Very Hot'].map((label, index) => (
              <div key={label} className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? 'bg-blue-500' :
                  index === 1 ? 'bg-green-500' :
                  index === 2 ? 'bg-yellow-500' :
                  index === 3 ? 'bg-orange-500' : 'bg-red-500'
                }`}></div>
                <span className="text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}