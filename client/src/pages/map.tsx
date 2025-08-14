import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import EventsMap from '@/components/EventsMap';
import { ArrowLeft, Search, Filter, MapPin, Clock, Star, Users, Heart } from 'lucide-react';
import { Link } from 'wouter';
import { useLocation } from '@/components/LocationContext';

interface Experience {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  price: number;
  currency: string;
  type: 'free' | 'paid';
  availability: string;
  startTime?: string;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  likeCount?: number;
  saveCount?: number;
  viewCount?: number;
}

export default function MapPage() {
  const { currentCity } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'free' | 'paid'>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();

  // Get user's current location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  // Fetch experiences
  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ['/api/experiences'],
    select: (data: Experience[]) => {
      let filtered = data;
      
      // Filter by search query
      if (searchQuery) {
        filtered = filtered.filter(exp => 
          exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exp.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      // Filter by type
      if (filterType !== 'all') {
        filtered = filtered.filter(exp => exp.type === filterType);
      }
      
      return filtered;
    },
  });

  const filteredExperiences = experiences || [];
  const experiencesWithLocation = filteredExperiences.filter(exp => exp.latitude && exp.longitude);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Flexible timing';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Experience Map
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {city || 'San Francisco'} • {experiencesWithLocation.length} experiences on map
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search experiences, locations, activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All
              </Button>
              <Button
                variant={filterType === 'free' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('free')}
              >
                Free
              </Button>
              <Button
                variant={filterType === 'paid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('paid')}
              >
                Paid
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 h-[600px]">
            <EventsMap
              experiences={experiencesWithLocation}
              onExperienceClick={setSelectedExperience}
            />
          </div>

          {/* Experience Details Sidebar */}
          <div className="space-y-4">
            {selectedExperience ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{selectedExperience.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedExperience.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedExperience.imageUrl && (
                    <img
                      src={selectedExperience.imageUrl}
                      alt={selectedExperience.title}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={selectedExperience.type === 'free' ? 'secondary' : 'default'}
                      className={selectedExperience.type === 'free' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {selectedExperience.type === 'free' 
                        ? 'Free' 
                        : `${selectedExperience.currency} ${selectedExperience.price}`
                      }
                    </Badge>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {selectedExperience.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{selectedExperience.rating}</span>
                        </div>
                      )}
                      {selectedExperience.likeCount !== undefined && (
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{selectedExperience.likeCount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedExperience.startTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatDate(selectedExperience.startTime)}
                      </span>
                    </div>
                  )}

                  {selectedExperience.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedExperience.description}
                    </p>
                  )}

                  {selectedExperience.tags && selectedExperience.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedExperience.tags.slice(0, 4).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Button className="w-full" size="sm">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Click on a marker to see experience details
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Map Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total experiences</span>
                  <span className="font-medium">{filteredExperiences.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">On map</span>
                  <span className="font-medium">{experiencesWithLocation.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Free experiences</span>
                  <span className="font-medium text-green-600">
                    {filteredExperiences.filter(e => e.type === 'free').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Paid experiences</span>
                  <span className="font-medium text-orange-600">
                    {filteredExperiences.filter(e => e.type === 'paid').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}