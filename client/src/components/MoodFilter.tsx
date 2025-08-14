import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MoodOption {
  id: string;
  label: string;
  icon: string;
  color: string;
  gradient: string;
  keywords: string[];
  description: string;
}

interface MoodFilterProps {
  onMoodChange: (mood: string, keywords: string[]) => void;
  activeMood?: string;
}

export default function MoodFilter({ onMoodChange, activeMood }: MoodFilterProps) {
  const [selectedMood, setSelectedMood] = useState<string>(activeMood || '');

  const moodOptions: MoodOption[] = [
    {
      id: 'adventurous',
      label: 'Adventurous',
      icon: '🏔️',
      color: 'from-orange-500 to-red-500',
      gradient: 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30',
      keywords: ['outdoor', 'adventure', 'hiking', 'extreme', 'thrill', 'exploration'],
      description: 'Seek thrills and new challenges'
    },
    {
      id: 'relaxed',
      label: 'Relaxed',
      icon: '🧘',
      color: 'from-blue-400 to-cyan-400',
      gradient: 'bg-gradient-to-br from-blue-400/20 to-cyan-400/20 border-blue-400/30',
      keywords: ['spa', 'wellness', 'meditation', 'peaceful', 'calm', 'yoga'],
      description: 'Unwind and find your zen'
    },
    {
      id: 'social',
      label: 'Social',
      icon: '🎉',
      color: 'from-purple-500 to-pink-500',
      gradient: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30',
      keywords: ['party', 'social', 'group', 'networking', 'friends', 'nightlife'],
      description: 'Connect with people and have fun'
    },
    {
      id: 'creative',
      label: 'Creative',
      icon: '🎨',
      color: 'from-yellow-400 to-orange-400',
      gradient: 'bg-gradient-to-br from-yellow-400/20 to-orange-400/20 border-yellow-400/30',
      keywords: ['art', 'creative', 'workshop', 'music', 'craft', 'design'],
      description: 'Express yourself and learn new skills'
    },
    {
      id: 'romantic',
      label: 'Romantic',
      icon: '💕',
      color: 'from-rose-400 to-pink-400',
      gradient: 'bg-gradient-to-br from-rose-400/20 to-pink-400/20 border-rose-400/30',
      keywords: ['romantic', 'date', 'intimate', 'sunset', 'dinner', 'couples'],
      description: 'Perfect for date nights and special moments'
    },
    {
      id: 'foodie',
      label: 'Foodie',
      icon: '🍽️',
      color: 'from-green-400 to-emerald-400',
      gradient: 'bg-gradient-to-br from-green-400/20 to-emerald-400/20 border-green-400/30',
      keywords: ['food', 'dining', 'culinary', 'taste', 'restaurant', 'cooking'],
      description: 'Discover amazing flavors and cuisines'
    },
    {
      id: 'cultural',
      label: 'Cultural',
      icon: '🏛️',
      color: 'from-indigo-400 to-purple-400',
      gradient: 'bg-gradient-to-br from-indigo-400/20 to-purple-400/20 border-indigo-400/30',
      keywords: ['culture', 'history', 'museum', 'art', 'heritage', 'educational'],
      description: 'Explore history, art, and local culture'
    },
    {
      id: 'spontaneous',
      label: 'Spontaneous',
      icon: '🎲',
      color: 'from-teal-400 to-blue-500',
      gradient: 'bg-gradient-to-br from-teal-400/20 to-blue-500/20 border-teal-400/30',
      keywords: ['random', 'surprise', 'spontaneous', 'last-minute', 'unexpected', 'available'],
      description: 'Let serendipity guide your experience'
    }
  ];

  const handleMoodSelect = (mood: MoodOption) => {
    if (selectedMood === mood.id) {
      setSelectedMood('');
      onMoodChange('', []);
    } else {
      setSelectedMood(mood.id);
      onMoodChange(mood.id, mood.keywords);
    }
  };

  const clearMood = () => {
    setSelectedMood('');
    onMoodChange('', []);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center space-x-2">
          <span>🌟</span>
          <span>What's your mood?</span>
        </h3>
        {selectedMood && (
          <Button
            onClick={clearMood}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Selected Mood Display */}
      {selectedMood && (
        <Card className="p-3 bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">
                {moodOptions.find(m => m.id === selectedMood)?.icon}
              </span>
              <div>
                <h4 className="text-white font-semibold">
                  {moodOptions.find(m => m.id === selectedMood)?.label} Mode
                </h4>
                <p className="text-gray-300 text-sm">
                  {moodOptions.find(m => m.id === selectedMood)?.description}
                </p>
              </div>
            </div>
            <Badge className="bg-primary text-black">
              Active
            </Badge>
          </div>
        </Card>
      )}

      {/* Mood Options Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {moodOptions.map((mood) => (
          <Button
            key={mood.id}
            onClick={() => handleMoodSelect(mood)}
            variant="ghost"
            className={`
              h-auto p-4 flex-col space-y-2 transition-all duration-300 hover:scale-105
              ${selectedMood === mood.id 
                ? `${mood.gradient} border-2 shadow-lg` 
                : 'bg-surface border border-gray-700 hover:border-gray-600'
              }
            `}
          >
            <span className="text-3xl">{mood.icon}</span>
            <div className="text-center">
              <div className={`font-semibold text-sm ${
                selectedMood === mood.id ? 'text-white' : 'text-gray-300'
              }`}>
                {mood.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {mood.description}
              </div>
            </div>
            
            {/* Selection indicator */}
            {selectedMood === mood.id && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full animate-pulse">
                <div className="w-full h-full bg-primary rounded-full animate-ping"></div>
              </div>
            )}
          </Button>
        ))}
      </div>

      {/* Mood Keywords Preview */}
      {selectedMood && (
        <div className="bg-black/20 rounded-lg p-3">
          <h5 className="text-white text-sm font-medium mb-2">Finding experiences matching:</h5>
          <div className="flex flex-wrap gap-1">
            {moodOptions.find(m => m.id === selectedMood)?.keywords.slice(0, 6).map(keyword => (
              <Badge key={keyword} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex space-x-2 text-xs">
        <Button
          onClick={() => handleMoodSelect(moodOptions[Math.floor(Math.random() * moodOptions.length)])}
          variant="outline"
          size="sm"
          className="text-gray-400 border-gray-600 hover:text-white"
        >
          🎲 Surprise Me
        </Button>
        <Button
          onClick={() => handleMoodSelect(moodOptions.find(m => m.id === 'spontaneous')!)}
          variant="outline" 
          size="sm"
          className="text-gray-400 border-gray-600 hover:text-white"
        >
          ⚡ Available Now
        </Button>
      </div>
    </div>
  );
}