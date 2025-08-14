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
import { AnimatedButton, StaggeredList } from "@/components/MicroAnimations";
import { Brain, MapPin, Clock, Thermometer, TrendingUp } from "lucide-react";

export default function Explore() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: experiences = [], isLoading } = useQuery<Experience[]>({
    queryKey: ["/api/experiences", { search: searchQuery, categoryId: selectedCategory }],
    enabled: true,
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderNav user={user} />
      
      <div className="pt-20 pb-24 px-4 space-y-6">
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
            <Button
              onClick={() => setSelectedCategory("")}
              variant={selectedCategory === "" ? "default" : "outline"}
              className="p-4 h-auto justify-start"
            >
              <i className="fas fa-th-large mr-3 text-lg"></i>
              <span>All Categories</span>
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="p-4 h-auto justify-start"
              >
                <i className={`${category.icon} mr-3 text-lg`} style={{ color: category.color }}></i>
                <span>{category.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Experiences Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">
            {searchQuery ? `Results for "${searchQuery}"` : "All Experiences"}
          </h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-surface border-gray-800">
                  <CardContent className="p-0">
                    <div className="h-48 bg-gray-800 animate-pulse rounded-t-lg"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-800 animate-pulse rounded"></div>
                      <div className="h-3 bg-gray-800 animate-pulse rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : experiences.length === 0 ? (
            <Card className="bg-surface border-gray-800">
              <CardContent className="p-8 text-center">
                <i className="fas fa-search text-4xl text-gray-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">No experiences found</h3>
                <p className="text-gray-400">
                  {searchQuery ? "Try different search terms" : "No experiences available right now"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {experiences.map((experience) => (
                <Card key={experience.id} className="bg-surface border-gray-800 cursor-pointer hover:bg-surface/80 transition-colors">
                  <CardContent className="p-0">
                    <div 
                      className="h-48 bg-cover bg-center rounded-t-lg"
                      style={{ backgroundImage: `url(${experience.imageUrl})` }}
                    >
                      <div className="h-full bg-gradient-to-t from-black/60 to-transparent rounded-t-lg flex items-end">
                        <div className="p-4 text-white">
                          <div className="flex items-center space-x-2 text-sm mb-2">
                            {experience.availability === "available" && (
                              <div className="flex items-center space-x-1 bg-success/20 px-2 py-1 rounded-full">
                                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                                <span className="text-success font-medium">Available</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{experience.title}</h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{experience.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-sm text-gray-300">
                          <div className="flex items-center space-x-1">
                            <i className="fas fa-star text-warning"></i>
                            <span>{experience.rating || "0.0"}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <i className="fas fa-map-marker-alt"></i>
                            <span>{experience.location}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            {experience.type === "free" ? "FREE" : `$${experience.price}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav activeTab="explore" />
    </div>
  );
}
