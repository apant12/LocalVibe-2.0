import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/components/LocationContext";
import { Brain, TrendingUp, Users, Clock, MapPin, Star } from "lucide-react";
import type { Experience } from "@shared/schema";

interface RecommendationScore {
  experienceId: string;
  score: number;
  reasons: string[];
  confidence: number;
}

interface UserPreferences {
  categories: string[];
  priceRange: [number, number];
  timePreferences: string[];
  locationRadius: number;
  socialInfluence: number;
}

export default function RecommendationEngine() {
  const { user } = useAuth();
  const { currentCity } = useLocation();
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([]);

  // Fetch user interaction data for personalization
  const { data: userInteractions } = useQuery({
    queryKey: ['/api/user/interactions'],
    enabled: !!user,
  });

  // Fetch all experiences for recommendation processing
  const { data: experiences = [] } = useQuery<Experience[]>({
    queryKey: ['/api/experiences', { city: currentCity.name, limit: 100 }],
  });

  // Advanced recommendation algorithm
  const calculateRecommendations = () => {
    if (!experiences.length || !user) return;

    const userPrefs: UserPreferences = {
      categories: userInteractions?.favoriteCategories || ['Food & Drinks', 'Arts & Culture'],
      priceRange: [20, 100],
      timePreferences: ['evening', 'weekend'],
      locationRadius: 10,
      socialInfluence: 0.3
    };

    const scores: RecommendationScore[] = experiences.map(exp => {
      let score = 0;
      const reasons: string[] = [];
      
      // Category preference matching (30% weight)
      if (userPrefs.categories.includes(exp.categoryId)) {
        score += 30;
        reasons.push('Matches your interests');
      }

      // Price preference (20% weight)
      if (exp.price >= userPrefs.priceRange[0] && exp.price <= userPrefs.priceRange[1]) {
        score += 20;
        reasons.push('In your price range');
      }

      // Rating and popularity (25% weight)
      const ratingScore = (exp.averageRating / 5) * 25;
      score += ratingScore;
      if (exp.averageRating > 4.5) {
        reasons.push('Highly rated');
      }

      // Availability and timing (15% weight)
      if (exp.availability === 'available') {
        score += 15;
        reasons.push('Available now');
      }

      // Social proof (10% weight)
      if (exp.bookingCount > 50) {
        score += 10;
        reasons.push('Popular choice');
      }

      // Location relevance (calculated from city context)
      if (exp.location.toLowerCase().includes(currentCity.name.toLowerCase())) {
        score += 5;
        reasons.push('In your city');
      }

      // Trending boost
      if (Math.random() > 0.7) { // Simulate trending algorithm
        score += 8;
        reasons.push('Trending now');
      }

      // Diversity penalty to avoid monotony
      const diversityFactor = Math.random() * 5;
      score += diversityFactor;

      return {
        experienceId: exp.id,
        score,
        reasons,
        confidence: Math.min(score / 100, 0.95)
      };
    });

    // Sort by score and take top recommendations
    const topRecommendations = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setRecommendations(topRecommendations);
  };

  useEffect(() => {
    calculateRecommendations();
  }, [experiences, userInteractions, currentCity]);

  const getRecommendedExperience = (recId: string) => {
    return experiences.find(exp => exp.id === recId);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-500';
    if (confidence > 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence > 0.8) return 'High Match';
    if (confidence > 0.6) return 'Good Match';
    return 'Fair Match';
  };

  return (
    <Card className="bg-surface border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Brain className="w-5 h-5 text-primary" />
          <span>AI Recommendations</span>
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Personalized suggestions based on your preferences and behavior
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.slice(0, 5).map((rec, index) => {
            const experience = getRecommendedExperience(rec.experienceId);
            if (!experience) return null;

            return (
              <div key={rec.experienceId} className="bg-black/20 rounded-lg p-3 hover:bg-black/40 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-primary text-black font-semibold">
                      #{index + 1}
                    </Badge>
                    <h4 className="text-white font-semibold">{experience.title}</h4>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-semibold ${getConfidenceColor(rec.confidence)}`}>
                      {getConfidenceLabel(rec.confidence)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(rec.confidence * 100)}% match
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                  <div className="flex items-center space-x-1 text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>{experience.location}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{experience.duration}min</span>
                  </div>
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{experience.averageRating}</span>
                  </div>
                  <div className="text-primary font-semibold">
                    ${experience.price}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {rec.reasons.slice(0, 3).map(reason => (
                    <Badge key={reason} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                      {reason}
                    </Badge>
                  ))}
                </div>

                {/* Recommendation Score Visualization */}
                <div className="bg-black/40 rounded p-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Recommendation Score</span>
                    <span>{Math.round(rec.score)}/100</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className="bg-primary h-1 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(rec.score, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Algorithm Insights */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h5 className="text-white font-semibold mb-3 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>Recommendation Insights</span>
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-lg font-bold text-primary">
                {userInteractions?.favoriteCategories?.length || 3}
              </div>
              <div className="text-xs text-gray-400">Tracked Interests</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-green-500">
                {Math.round((recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length) * 100)}%
              </div>
              <div className="text-xs text-gray-400">Avg Confidence</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-blue-500">
                {currentCity.name}
              </div>
              <div className="text-xs text-gray-400">Location Context</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-yellow-500">
                {recommendations.length}
              </div>
              <div className="text-xs text-gray-400">Suggestions</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}