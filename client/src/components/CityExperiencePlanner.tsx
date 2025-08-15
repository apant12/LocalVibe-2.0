import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Calendar, DollarSign, Users, Star, Search, ArrowRight, Clock, Heart } from 'lucide-react';

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

interface UserPreferences {
  city: string;
  experienceType: string[];
  budget: string;
  duration: string;
  groupSize: string;
  interests: string[];
  timeOfDay: string[];
  specialRequirements: string;
}

interface ItineraryItem {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  category: string;
  price: string;
  imageUrl: string;
  reason: string;
}

interface GeneratedItinerary {
  id: string;
  city: string;
  title: string;
  description: string;
  totalCost: number;
  totalDuration: number;
  items: ItineraryItem[];
  aiInsights: string[];
  recommendations: string[];
}

const CityExperiencePlanner: React.FC = () => {
  const [step, setStep] = useState<'city' | 'preferences' | 'results'>('city');
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    city: '',
    experienceType: [],
    budget: '',
    duration: '',
    groupSize: '',
    interests: [],
    timeOfDay: [],
    specialRequirements: ''
  });

  const experienceTypes = [
    'Cultural & Arts', 'Food & Dining', 'Outdoor & Adventure', 
    'Music & Entertainment', 'Historical Tours', 'Shopping & Markets',
    'Wellness & Spa', 'Nightlife', 'Family Activities', 'Romantic'
  ];

  const interests = [
    'Photography', 'Local Cuisine', 'Live Music', 'Art Galleries', 
    'Hiking', 'Water Sports', 'Museums', 'Street Markets', 
    'Architecture', 'Local History', 'Craft Beer', 'Wine Tasting',
    'Street Art', 'Local Festivals', 'Cooking Classes'
  ];

  const timeOfDay = ['Morning', 'Afternoon', 'Evening', 'Night'];

  // Fetch experiences for the selected city
  const { data: experiences = [], isLoading: experiencesLoading } = useQuery({
    queryKey: ['experiences', userPreferences.city],
    queryFn: async () => {
      if (!userPreferences.city) return [];
      const response = await fetch(`/api/experiences?city=${encodeURIComponent(userPreferences.city)}`);
      return response.json();
    },
    enabled: !!userPreferences.city
  });

  // Generate AI itinerary
  const generateItineraryMutation = useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      const response = await fetch('/api/ai/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      return response.json();
    }
  });

  const handleCitySubmit = (city: string) => {
    setUserPreferences(prev => ({ ...prev, city }));
    setStep('preferences');
  };

  const handlePreferencesSubmit = () => {
    generateItineraryMutation.mutate(userPreferences);
    setStep('results');
  };

  const handleExperienceTypeToggle = (type: string) => {
    setUserPreferences(prev => ({
      ...prev,
      experienceType: prev.experienceType.includes(type)
        ? prev.experienceType.filter(t => t !== type)
        : [...prev.experienceType, type]
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setUserPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleTimeOfDayToggle = (time: string) => {
    setUserPreferences(prev => ({
      ...prev,
      timeOfDay: prev.timeOfDay.includes(time)
        ? prev.timeOfDay.filter(t => t !== time)
        : [...prev.timeOfDay, time]
    }));
  };

  const generateMockItinerary = (): GeneratedItinerary => {
    const filteredExperiences = experiences.filter((exp: Experience) => {
      const matchesType = userPreferences.experienceType.length === 0 || 
        userPreferences.experienceType.some(type => 
          exp.category.toLowerCase().includes(type.toLowerCase().split(' ')[0])
        );
      const matchesBudget = !userPreferences.budget || 
        parseFloat(exp.price) <= parseFloat(userPreferences.budget);
      return matchesType && matchesBudget;
    });

    const selectedExperiences = filteredExperiences.slice(0, 4).map((exp: Experience, index: number) => ({
      id: exp.id,
      title: exp.title,
      description: exp.description,
      location: exp.location,
      startTime: new Date(Date.now() + (index * 2 + 1) * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + (index * 2 + 2) * 60 * 60 * 1000).toISOString(),
      category: exp.category,
      price: exp.price,
      imageUrl: exp.imageUrl,
      reason: `Perfect for ${userPreferences.interests[0] || 'exploring'} and fits your ${userPreferences.budget ? `$${userPreferences.budget} budget` : 'preferences'}`
    }));

    return {
      id: `itinerary-${Date.now()}`,
      city: userPreferences.city,
      title: `Perfect ${userPreferences.city} Experience`,
      description: `Curated based on your ${userPreferences.experienceType.join(', ')} preferences`,
      totalCost: selectedExperiences.reduce((sum, item) => sum + parseFloat(item.price), 0),
      totalDuration: selectedExperiences.length * 2,
      items: selectedExperiences,
      aiInsights: [
        `${userPreferences.city} is perfect for ${userPreferences.interests.join(', ')}`,
        `Best time to visit: ${userPreferences.timeOfDay.join(', ')}`,
        `Recommended group size: ${userPreferences.groupSize || '2-4 people'}`
      ],
      recommendations: [
        'Book experiences in advance for better availability',
        'Consider local transportation options',
        'Check weather forecasts for outdoor activities',
        'Bring comfortable walking shoes'
      ]
    };
  };

  const itinerary = generateMockItinerary();

  if (step === 'city') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Where are you going?</h1>
            <p className="text-gray-600">Tell us your destination and we'll create the perfect experience plan</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                placeholder="Enter city name..."
                value={userPreferences.city}
                onChange={(e) => setUserPreferences(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => handleCitySubmit(userPreferences.city)}
              disabled={!userPreferences.city.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue
              <ArrowRight className="w-4 h-4 inline ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'preferences') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('city')}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">Plan Your {userPreferences.city} Experience</h1>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Preferences */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">What type of experiences are you looking for?</h2>
                <div className="grid grid-cols-2 gap-2">
                  {experienceTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleExperienceTypeToggle(type)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        userPreferences.experienceType.includes(type)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">What interests you most?</h2>
                <div className="grid grid-cols-2 gap-2">
                  {interests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-2 rounded-lg border text-sm transition-colors ${
                        userPreferences.interests.includes(interest)
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">When do you prefer to explore?</h2>
                <div className="grid grid-cols-2 gap-2">
                  {timeOfDay.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeOfDayToggle(time)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        userPreferences.timeOfDay.includes(time)
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget per person</label>
                  <select
                    value={userPreferences.budget}
                    onChange={(e) => setUserPreferences(prev => ({ ...prev, budget: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any budget</option>
                    <option value="25">Under $25</option>
                    <option value="50">Under $50</option>
                    <option value="100">Under $100</option>
                    <option value="200">Under $200</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group size</label>
                  <select
                    value={userPreferences.groupSize}
                    onChange={(e) => setUserPreferences(prev => ({ ...prev, groupSize: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any size</option>
                    <option value="1">Solo</option>
                    <option value="2">Couple</option>
                    <option value="4">Small group (3-4)</option>
                    <option value="8">Large group (5+)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special requirements</label>
                <textarea
                  value={userPreferences.specialRequirements}
                  onChange={(e) => setUserPreferences(prev => ({ ...prev, specialRequirements: e.target.value }))}
                  placeholder="Any special needs, accessibility requirements, or specific requests..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>

              <button
                onClick={handlePreferencesSubmit}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Generate My Perfect Itinerary
              </button>
            </div>

            {/* Right Column - Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Preferences Summary</h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Destination:</span>
                  <p className="text-gray-900">{userPreferences.city}</p>
                </div>
                
                {userPreferences.experienceType.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Experience Types:</span>
                    <p className="text-gray-900">{userPreferences.experienceType.join(', ')}</p>
                  </div>
                )}

                {userPreferences.interests.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Interests:</span>
                    <p className="text-gray-900">{userPreferences.interests.join(', ')}</p>
                  </div>
                )}

                {userPreferences.timeOfDay.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Preferred Times:</span>
                    <p className="text-gray-900">{userPreferences.timeOfDay.join(', ')}</p>
                  </div>
                )}

                {userPreferences.budget && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Budget:</span>
                    <p className="text-gray-900">Under ${userPreferences.budget}</p>
                  </div>
                )}

                {userPreferences.groupSize && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Group Size:</span>
                    <p className="text-gray-900">{userPreferences.groupSize}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('preferences')}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">Your Perfect {userPreferences.city} Itinerary</h1>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Itinerary Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{itinerary.title}</h2>
                <p className="text-gray-600">{itinerary.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">${itinerary.totalCost}</div>
                <div className="text-sm text-gray-600">Total cost</div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{itinerary.totalDuration} hours</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{itinerary.city}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{userPreferences.groupSize || '2-4'} people</span>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🤖 AI Insights</h3>
            <div className="space-y-2">
              {itinerary.aiInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Itinerary Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Day Plan</h3>
            {itinerary.items.map((item, index) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex gap-4">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">${item.price}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{item.category}</span>
                      <span className="text-xs text-gray-500">{item.reason}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="bg-green-50 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Recommendations</h3>
            <div className="space-y-2">
              {itinerary.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Book All Experiences
            </button>
            <button className="flex-1 bg-white text-blue-600 py-3 rounded-lg font-semibold border border-blue-600 hover:bg-blue-50 transition-colors">
              Save Itinerary
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CityExperiencePlanner;
