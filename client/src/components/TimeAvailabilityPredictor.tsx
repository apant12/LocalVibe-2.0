import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/components/LocationContext";
import { Clock, TrendingUp, Calendar, AlertCircle, CheckCircle, Zap } from "lucide-react";

interface TimeSlot {
  time: string;
  hour: number;
  availability: 'high' | 'medium' | 'low' | 'full';
  probability: number;
  experienceCount: number;
  avgPrice: number;
  popularCategories: string[];
}

interface DayPrediction {
  date: string;
  dayName: string;
  isWeekend: boolean;
  weatherImpact: 'positive' | 'neutral' | 'negative';
  overallAvailability: number;
  peakHours: number[];
  recommendedTime: string;
}

export default function TimeAvailabilityPredictor() {
  const [selectedDay, setSelectedDay] = useState(0); // 0 = today
  const [predictions, setPredictions] = useState<DayPrediction[]>([]);
  const [hourlySlots, setHourlySlots] = useState<TimeSlot[]>([]);
  const { currentCity } = useLocation();

  // Generate predictions for next 7 days
  const generatePredictions = useMemo(() => {
    const days: DayPrediction[] = [];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      // Simulate weather impact (in production, use weather API)
      const weatherImpact = Math.random() > 0.7 ? 'negative' : Math.random() > 0.3 ? 'positive' : 'neutral';
      
      // Calculate overall availability based on day type and weather
      let baseAvailability = isWeekend ? 85 : 65;
      if (weatherImpact === 'positive') baseAvailability += 10;
      if (weatherImpact === 'negative') baseAvailability -= 15;
      
      // Peak hours vary by day type
      const peakHours = isWeekend 
        ? [11, 12, 13, 15, 16, 19, 20]
        : [12, 13, 18, 19, 20, 21];
      
      const recommendedTime = isWeekend ? '2:00 PM' : '7:00 PM';
      
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayName,
        isWeekend,
        weatherImpact,
        overallAvailability: Math.max(20, Math.min(95, baseAvailability + Math.random() * 10)),
        peakHours,
        recommendedTime
      });
    }
    
    return days;
  }, []);

  // Generate hourly slots for selected day
  const generateHourlySlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    const selectedDayData = generatePredictions[selectedDay];
    
    if (!selectedDayData) return slots;
    
    for (let hour = 8; hour <= 23; hour++) {
      // Calculate availability based on multiple factors
      let probability = 40; // Base probability
      
      // Peak hours boost
      if (selectedDayData.peakHours.includes(hour)) {
        probability += 30;
      }
      
      // Time of day adjustments
      if (hour >= 17 && hour <= 22) probability += 20; // Evening boost
      if (hour >= 12 && hour <= 14) probability += 15; // Lunch boost
      if (hour >= 22 || hour <= 9) probability -= 20; // Late/early penalty
      
      // Weekend adjustments
      if (selectedDayData.isWeekend) {
        if (hour >= 10 && hour <= 16) probability += 15; // Weekend afternoon boost
      } else {
        if (hour >= 9 && hour <= 17) probability -= 10; // Weekday work hours penalty
      }
      
      // Weather impact
      if (selectedDayData.weatherImpact === 'positive') probability += 10;
      if (selectedDayData.weatherImpact === 'negative') probability -= 15;
      
      // Add randomness
      probability += (Math.random() - 0.5) * 20;
      probability = Math.max(10, Math.min(95, probability));
      
      // Determine availability level
      let availability: TimeSlot['availability'];
      if (probability >= 80) availability = 'high';
      else if (probability >= 60) availability = 'medium';
      else if (probability >= 40) availability = 'low';
      else availability = 'full';
      
      // Calculate experience count and pricing based on availability
      const baseExperienceCount = 15;
      const experienceCount = Math.round(baseExperienceCount * (probability / 100) * (Math.random() * 0.4 + 0.8));
      
      const basePriceMultiplier = selectedDayData.isWeekend ? 1.2 : 1.0;
      const demandMultiplier = (100 - probability) / 100 * 0.3 + 0.9; // Higher prices when less available
      const avgPrice = Math.round(45 * basePriceMultiplier * demandMultiplier);
      
      // Popular categories based on time
      let popularCategories: string[] = [];
      if (hour >= 8 && hour <= 11) popularCategories = ['Wellness & Fitness', 'Outdoor Adventures'];
      else if (hour >= 12 && hour <= 14) popularCategories = ['Food & Drinks', 'Cultural Experiences'];
      else if (hour >= 15 && hour <= 18) popularCategories = ['Arts & Culture', 'Outdoor Adventures'];
      else if (hour >= 19 && hour <= 22) popularCategories = ['Food & Drinks', 'Nightlife & Entertainment'];
      else popularCategories = ['Nightlife & Entertainment', 'Social Events'];
      
      slots.push({
        time: hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`,
        hour,
        availability,
        probability,
        experienceCount,
        avgPrice,
        popularCategories
      });
    }
    
    return slots;
  }, [selectedDay, generatePredictions]);

  useEffect(() => {
    setPredictions(generatePredictions);
  }, [generatePredictions]);

  useEffect(() => {
    setHourlySlots(generateHourlySlots);
  }, [generateHourlySlots]);

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-orange-500';
      case 'full': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'high': return <CheckCircle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <AlertCircle className="w-4 h-4" />;
      case 'full': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getWeatherIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return '☀️';
      case 'negative': return '🌧️';
      default: return '⛅';
    }
  };

  const getCurrentHour = () => new Date().getHours();
  const getBestTimeSlots = () => hourlySlots.filter(slot => slot.availability === 'high').slice(0, 3);

  return (
    <div className="space-y-6">
      <Card className="bg-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span>Smart Time Availability Predictor</span>
          </CardTitle>
          <p className="text-gray-400 text-sm">
            AI-powered predictions for optimal experience booking times in {currentCity.name}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Day Selector */}
          <div className="grid grid-cols-7 gap-2">
            {predictions.map((day, index) => (
              <Button
                key={day.date}
                onClick={() => setSelectedDay(index)}
                variant={selectedDay === index ? 'default' : 'ghost'}
                size="sm"
                className={`
                  flex-col space-y-1 h-auto py-2 text-xs
                  ${selectedDay === index 
                    ? 'bg-primary text-black' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                <div className="font-semibold">
                  {day.dayName.length > 6 ? day.dayName.slice(0, 3) : day.dayName}
                </div>
                <div className="flex items-center space-x-1">
                  <span>{getWeatherIcon(day.weatherImpact)}</span>
                  <span className="text-xs">{Math.round(day.overallAvailability)}%</span>
                </div>
              </Button>
            ))}
          </div>

          {/* Selected Day Overview */}
          {predictions[selectedDay] && (
            <Card className="bg-black/20 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{predictions[selectedDay].dayName}</span>
                    {predictions[selectedDay].isWeekend && (
                      <Badge className="bg-purple-600 text-white text-xs">Weekend</Badge>
                    )}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span>{getWeatherIcon(predictions[selectedDay].weatherImpact)}</span>
                    <Badge className={`${getAvailabilityColor('high')} text-white`}>
                      {Math.round(predictions[selectedDay].overallAvailability)}% Available
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-primary font-bold text-lg">
                      {predictions[selectedDay].recommendedTime}
                    </div>
                    <div className="text-gray-400">Best Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-500 font-bold text-lg">
                      {predictions[selectedDay].peakHours.length}
                    </div>
                    <div className="text-gray-400">Peak Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-500 font-bold text-lg">
                      {getBestTimeSlots().length}
                    </div>
                    <div className="text-gray-400">High Availability</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hourly Breakdown */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold flex items-center space-x-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Hourly Predictions</span>
            </h4>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {hourlySlots.map((slot) => (
                <div
                  key={slot.hour}
                  className={`
                    bg-black/20 rounded-lg p-3 hover:bg-black/40 transition-colors
                    ${slot.hour === getCurrentHour() && selectedDay === 0 
                      ? 'ring-2 ring-primary/50' 
                      : ''
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {slot.hour === getCurrentHour() && selectedDay === 0 && (
                          <Zap className="w-4 h-4 text-primary animate-pulse" />
                        )}
                        <span className="text-white font-semibold">{slot.time}</span>
                      </div>
                      <div className={`flex items-center space-x-1 text-white px-2 py-1 rounded text-xs ${getAvailabilityColor(slot.availability)}`}>
                        {getAvailabilityIcon(slot.availability)}
                        <span className="capitalize">{slot.availability}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {Math.round(slot.probability)}%
                      </div>
                      <div className="text-xs text-gray-400">probability</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="text-gray-400">
                      <span className="block">Experiences</span>
                      <span className="text-white font-semibold">{slot.experienceCount}</span>
                    </div>
                    <div className="text-gray-400">
                      <span className="block">Avg Price</span>
                      <span className="text-white font-semibold">${slot.avgPrice}</span>
                    </div>
                    <div className="text-gray-400">
                      <span className="block">Popular</span>
                      <span className="text-white font-semibold">
                        {slot.popularCategories[0]?.split(' ')[0] || 'Various'}
                      </span>
                    </div>
                  </div>

                  {/* Probability bar */}
                  <div className="mt-2 bg-gray-700 rounded-full h-1 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getAvailabilityColor(slot.availability)}`}
                      style={{ width: `${slot.probability}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}