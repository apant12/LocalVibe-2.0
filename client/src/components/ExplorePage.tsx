import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Calendar, DollarSign, Users, Star, Filter, Search } from 'lucide-react';

interface Experience {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  price: string;
  startTime: string;
  endTime: string;
  category: string;
  hostName: string;
  imageUrl: string;
  tags: string[];
  latitude?: number;
  longitude?: number;
}

interface Itinerary {
  id: string;
  title: string;
  description: string;
  places: Experience[];
  center: {
    latitude: number;
    longitude: number;
    city: string;
  };
  timeSlot: string;
  recommendationScore: number;
  estimatedDuration: number;
  totalCost: number;
}

const ExplorePage: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch experiences
  const { data: experiences = [], isLoading: experiencesLoading } = useQuery({
    queryKey: ['experiences', selectedCity, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCity !== 'All') params.append('city', selectedCity);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      
      const response = await fetch(`/api/experiences?${params}`);
      return response.json();
    }
  });

  // Fetch AI recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['recommendations', selectedCity],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCity !== 'All') params.append('city', selectedCity);
      
      const response = await fetch(`/api/recommendations?${params}`);
      return response.json();
    }
  });

  // Filter experiences based on search query
  const filteredExperiences = experiences.filter((exp: Experience) =>
    exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unique cities from experiences
  const allCities = ['All', ...Array.from(new Set(experiences.map((exp: Experience) => exp.city).filter(Boolean) as string[]))];
  const categories = ['All', 'food', 'music', 'arts', 'outdoor', 'nightlife'];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return '🍽️';
      case 'music': return '🎵';
      case 'arts': return '🎨';
      case 'outdoor': return '🌲';
      case 'nightlife': return '🌙';
      default: return '🎯';
    }
  };

  const getTimeSlotColor = (timeSlot: string) => {
    switch (timeSlot) {
      case 'Morning': return 'bg-yellow-100 text-yellow-800';
      case 'Afternoon': return 'bg-orange-100 text-orange-800';
      case 'Evening': return 'bg-purple-100 text-purple-800';
      case 'Night': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (experiencesLoading || recommendationsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading experiences...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Explore Events</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Search Bar - Fixed text visibility */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search events, locations, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 search-input"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    {allCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Recommendations */}
        {recommendations?.itineraries && recommendations.itineraries.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">AI Curated Experiences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.itineraries.slice(0, 3).map((itinerary: Itinerary) => (
                <div key={itinerary.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{itinerary.title}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">
                          {(itinerary.recommendationScore * 5).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{itinerary.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{itinerary.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span>{itinerary.center.city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{itinerary.places.length} locations</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <DollarSign className="w-4 h-4" />
                        <span>${itinerary.totalCost.toFixed(2)} total</span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      View Itinerary
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Events */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              All Events ({filteredExperiences.length})
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Showing events in</span>
              <span className="font-medium">{selectedCity}</span>
              {searchQuery && (
                <>
                  <span>•</span>
                  <span>Searching for "{searchQuery}"</span>
                </>
              )}
            </div>
          </div>

          {filteredExperiences.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? `No events match "${searchQuery}"`
                  : 'Try adjusting your filters or search terms'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredExperiences.map((experience: Experience) => (
                <div key={experience.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={experience.imageUrl}
                      alt={experience.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-black/70 text-white text-xs rounded">
                        {getCategoryIcon(experience.category)} {experience.category}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded font-semibold">
                        ${experience.price}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-1 bg-black/70 text-white text-xs rounded">
                        📍 {experience.city}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {experience.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {experience.description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{experience.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(experience.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{experience.hostName}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                        Quick Book
                      </button>
                      <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
