import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import HeaderNav from "@/components/HeaderNav";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Category, Experience } from "@/types";
import MoodFilter from "@/components/MoodFilter";
import HeatMap from "@/components/HeatMap";
import RecommendationEngine from "@/components/RecommendationEngine";
import TimeAvailabilityPredictor from "@/components/TimeAvailabilityPredictor";
import GestureBrowsing from "@/components/GestureBrowsing";
import SocialSharing from "@/components/SocialSharing";
import { AnimatedButton, StaggeredList } from "@/components/MicroAnimations";

export default function Explore() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'discover' | 'mood' | 'heatmap' | 'ai' | 'timing'>('discover');
  const [moodFilters, setMoodFilters] = useState<string[]>([]);
  const [showSocialSharing, setShowSocialSharing] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: experiences = [], isLoading } = useQuery<Experience[]>({
    queryKey: ["/api/experiences"],
    enabled: true,
  });

  const handleMoodChange = (mood: string, keywords: string[]) => {
    setMoodFilters(keywords);
  };

  const handleSwipeLeft = () => {
    console.log('Swiped left - previous experience');
  };

  const handleSwipeRight = () => {
    console.log('Swiped right - next experience');
  };

  const handleSwipeUp = () => {
    console.log('Swiped up - show details');
  };

  const handleSwipeDown = () => {
    console.log('Swiped down - minimize');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'mood':
        return (
          <div className="space-y-6">
            <MoodFilter onMoodChange={handleMoodChange} />
            {moodFilters.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-white font-semibold">Experiences matching your mood:</h3>
                <StaggeredList className="space-y-3">
                  {experiences.slice(0, 5).map((experience) => (
                    <Card key={experience.id} className="bg-surface border-gray-800 hover:bg-surface/80 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex space-x-4">
                          <img
                            src={experience.images?.[0] || "/api/placeholder/100/100"}
                            alt={experience.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {experience.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                              {experience.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-primary font-bold">${experience.price}</span>
                                <Badge className="bg-green-600 text-white text-xs">
                                  Mood Match
                                </Badge>
                              </div>
                              <AnimatedButton 
                                size="sm" 
                                className="bg-primary hover:bg-primary/90 text-black"
                                onClick={() => setShowSocialSharing(true)}
                              >
                                Book Now
                              </AnimatedButton>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </StaggeredList>
              </div>
            )}
          </div>
        );

      case 'heatmap':
        return <HeatMap />;

      case 'ai':
        return <RecommendationEngine />;

      case 'timing':
        return <TimeAvailabilityPredictor />;

      default:
        return (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search experiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border-gray-800 text-white placeholder-gray-400 rounded-2xl px-4 py-3 pl-12"
              />
              <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>

            {/* Categories */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Categories</h2>
              <div className="grid grid-cols-2 gap-3">
                <AnimatedButton
                  onClick={() => setSelectedCategory("")}
                  variant={selectedCategory === "" ? "primary" : "secondary"}
                  className="p-4 h-auto justify-start"
                >
                  <i className="fas fa-th-large mr-3 text-lg"></i>
                  <span>All Categories</span>
                </AnimatedButton>
                {categories.map((category) => (
                  <AnimatedButton
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    variant={selectedCategory === category.id ? "primary" : "secondary"}
                    className="p-4 h-auto justify-start"
                  >
                    <i className={`${category.icon} mr-3 text-lg`}></i>
                    <span>{category.name}</span>
                  </AnimatedButton>
                ))}
              </div>
            </div>

            {/* Experiences */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Experiences</h2>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading experiences...</p>
                </div>
              ) : (
                <StaggeredList className="space-y-4">
                  {experiences.map((experience) => (
                    <Card key={experience.id} className="bg-surface border-gray-800 hover:bg-surface/80 transition-all duration-300 hover:scale-[1.02]">
                      <CardContent className="p-4">
                        <div className="flex space-x-4">
                          <img
                            src={experience.images?.[0] || "/api/placeholder/100/100"}
                            alt={experience.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {experience.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                              {experience.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-primary font-bold">${experience.price}</span>
                                <div className="flex items-center text-yellow-500">
                                  <i className="fas fa-star text-sm"></i>
                                  <span className="text-sm ml-1">{experience.averageRating}</span>
                                </div>
                              </div>
                              <AnimatedButton 
                                size="sm" 
                                className="bg-primary hover:bg-primary/90 text-black"
                                onClick={() => setShowSocialSharing(true)}
                              >
                                Book Now
                              </AnimatedButton>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </StaggeredList>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <GestureBrowsing
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      onSwipeUp={handleSwipeUp}
      onSwipeDown={handleSwipeDown}
    >
      <div className="min-h-screen bg-black text-white">
        <HeaderNav user={user} />
        
        {/* Advanced Features Tab Bar */}
        <div className="fixed top-16 left-0 right-0 bg-black/90 backdrop-blur-sm border-b border-gray-800 z-40">
          <div className="flex space-x-1 p-2 overflow-x-auto">
            {[
              { id: 'discover', icon: '🔍', label: 'Discover' },
              { id: 'mood', icon: '🌟', label: 'Mood' },
              { id: 'heatmap', icon: '🌡️', label: 'Heat Map' },
              { id: 'ai', icon: '🧠', label: 'AI Picks' },
              { id: 'timing', icon: '⏰', label: 'Best Times' }
            ].map(tab => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                className={`
                  flex items-center space-x-1 whitespace-nowrap min-w-fit px-3 py-2
                  ${activeTab === tab.id 
                    ? 'bg-primary text-black' 
                    : 'text-gray-400 hover:text-white'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="pt-32 pb-24 px-4">
          {renderTabContent()}
        </div>
        
        {/* Social Sharing Modal */}
        {showSocialSharing && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <SocialSharing 
                experience={experiences[0]}
                onClose={() => setShowSocialSharing(false)}
              />
            </div>
          </div>
        )}
        
        <BottomNav activeTab="explore" />
      </div>
    </GestureBrowsing>
  );
}