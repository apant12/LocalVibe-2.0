import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import EventsMap from '@/components/EventsMap';
import { ArrowLeft, Search, Filter, MapPin, Clock, Star, Users, Heart, Calendar, Ticket } from 'lucide-react';
import { Link } from 'wouter';
import { useLocation } from '@/components/LocationContext';

interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  dates: {
    start: {
      localDate: string;
      localTime: string;
      dateTime: string;
    };
    status: {
      code: string;
    };
  };
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  _embedded?: {
    venues?: Array<{
      name: string;
      city: {
        name: string;
      };
      state: {
        name: string;
      };
      country: {
        name: string;
      };
      location: {
        latitude: string;
        longitude: string;
      };
    }>;
  };
  classifications?: Array<{
    segment: {
      name: string;
    };
    genre: {
      name: string;
    };
  }>;
}

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

  // Fetch Ticketmaster events
  const { data: ticketmasterEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['ticketmaster-events', currentCity?.name],
    queryFn: async () => {
      if (!currentCity?.name) return [];
      
      try {
        // You'll need to add your Ticketmaster API key to .env
        const apiKey = import.meta.env.VITE_TICKETMASTER_API_KEY || 'demo';
        const response = await fetch(
          `https://app.ticketmaster.com/discovery/v2/events.json?city=${encodeURIComponent(currentCity.name)}&apikey=${apiKey}&size=50&sort=date,asc`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        return data._embedded?.events || [];
      } catch (error) {
        console.error('Error fetching Ticketmaster events:', error);
        // Return demo data if API fails
        return getDemoEvents();
      }
    },
    enabled: !!currentCity?.name,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Convert Ticketmaster events to our Experience format
  const experiences: Experience[] = ticketmasterEvents.map((event: TicketmasterEvent) => {
    const venue = event._embedded?.venues?.[0];
    const priceRange = event.priceRanges?.[0];
    
    return {
      id: event.id,
      title: event.name,
      description: `${event.classifications?.[0]?.segment?.name || 'Event'} - ${event.classifications?.[0]?.genre?.name || 'Entertainment'}`,
      imageUrl: event.images?.[0]?.url,
      location: venue ? `${venue.name}, ${venue.city.name}, ${venue.state.name}` : 'Location TBD',
      latitude: venue?.location?.latitude ? parseFloat(venue.location.latitude) : null,
      longitude: venue?.location?.longitude ? parseFloat(venue.location.longitude) : null,
      price: priceRange?.min || 0,
      currency: priceRange?.currency || 'USD',
      type: priceRange?.min === 0 ? 'free' : 'paid',
      availability: event.dates.status.code === 'onsale' ? 'Available' : 'Limited',
      startTime: event.dates.start.dateTime,
      tags: [
        event.classifications?.[0]?.segment?.name,
        event.classifications?.[0]?.genre?.name
      ].filter(Boolean) as string[],
      rating: 4.5, // Demo rating
      reviewCount: Math.floor(Math.random() * 100) + 10,
      likeCount: Math.floor(Math.random() * 500) + 50,
      saveCount: Math.floor(Math.random() * 200) + 20,
      viewCount: Math.floor(Math.random() * 1000) + 100,
    };
  });

  // Demo events for when API is not available
  function getDemoEvents(): any[] {
    const cityName = currentCity?.name || 'New York';
    return [
      {
        id: 'demo-1',
        name: 'Summer Music Festival',
        _embedded: {
          venues: [{
            name: 'Central Park',
            city: { name: cityName },
            state: { name: 'NY' },
            location: { latitude: '40.7829', longitude: '-73.9654' }
          }]
        },
        images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop' }],
        dates: { start: { dateTime: new Date(Date.now() + 86400000).toISOString() } },
        priceRanges: [{ min: 25, currency: 'USD' }],
        classifications: [{ segment: { name: 'Music' }, genre: { name: 'Rock' } }]
      },
      {
        id: 'demo-2',
        name: 'Food & Wine Expo',
        _embedded: {
          venues: [{
            name: 'Downtown Convention Center',
            city: { name: cityName },
            state: { name: 'NY' },
            location: { latitude: '40.7589', longitude: '-73.9654' }
          }]
        },
        images: [{ url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop' }],
        dates: { start: { dateTime: new Date(Date.now() + 172800000).toISOString() } },
        priceRanges: [{ min: 0, currency: 'USD' }],
        classifications: [{ segment: { name: 'Food & Drink' }, genre: { name: 'Culinary' } }]
      }
    ];
  }

  // Filter experiences
  const filteredExperiences = experiences.filter(exp => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        exp.title.toLowerCase().includes(query) ||
        exp.location.toLowerCase().includes(query) ||
        exp.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    if (filterType !== 'all') {
      return exp.type === filterType;
    }
    
    return true;
  });

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

  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
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
                  {currentCity?.name || 'San Francisco'} • {experiencesWithLocation.length} experiences on map
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
              onExperienceClick={(experience) => setSelectedExperience(experience)}
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
                      <Calendar className="w-4 h-4 text-gray-400" />
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