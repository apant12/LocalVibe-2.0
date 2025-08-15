import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Calendar, DollarSign, Users, Clock, Tag, Star, Phone, Mail, Globe, X, CreditCard, Lock, Shield } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { loadStripe } from '@stripe/stripe-js';

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
  hostId?: string;
  status?: string;
  type?: string;
  availability?: string;
  isDropIn?: boolean;
}

interface EventDetailsModalProps {
  experience: Experience | null;
  isOpen: boolean;
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ experience, isOpen, onClose }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'map' | 'booking'>('details');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !experience) return;
    
    // Reset loading state when modal opens
    setIsMapLoading(true);
    
    if (!mapContainer.current) return;

    // Set your Mapbox access token
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example';
    mapboxgl.accessToken = mapboxToken;

    // Add a small delay to ensure the container is fully rendered
    const timer = setTimeout(() => {
      if (!mapContainer.current) return;
      
      setIsMapLoading(true);
      
      // Create map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [experience.longitude || -122.4194, experience.latitude || 37.7749],
        zoom: 14
      });

      // Wait for map to load
      map.current.on('load', () => {
        setIsMapLoading(false);
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl());

      // Add marker for the experience location
      if (experience.latitude && experience.longitude) {
        new mapboxgl.Marker({ color: '#3B82F6' })
          .setLngLat([experience.longitude, experience.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-2">
                  <h3 class="font-semibold text-sm">${experience.title}</h3>
                  <p class="text-xs text-gray-600">${experience.location}</p>
                  <p class="text-xs text-gray-600">$${experience.price}</p>
                </div>
              `)
          )
          .addTo(map.current);
      }
    }, 100); // 100ms delay to ensure DOM is ready

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isOpen, experience]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBooking = async () => {
    if (!experience) return;
    
    // Check if this is a Ticketmaster event
    if (experience.externalSource === 'ticketmaster') {
      // Redirect to Ticketmaster for booking
      const ticketmasterUrl = `https://www.ticketmaster.com/event/${experience.externalId}`;
      window.open(ticketmasterUrl, '_blank');
      return;
    }
    
    // For your own events, use Stripe checkout
    setIsCheckoutLoading(true);
    setCheckoutError(null);
    
    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experienceId: experience.id,
          title: experience.title,
          price: parseFloat(experience.price),
          location: experience.location,
          startTime: experience.startTime,
          hostName: experience.hostName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          throw new Error(error.message);
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error instanceof Error ? error.message : 'Checkout failed');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  if (!isOpen || !experience) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative h-64">
          <img
            src={experience.imageUrl}
            alt={experience.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Event info overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-black/70 text-white text-sm rounded-full">
                {getCategoryIcon(experience.category)} {experience.category}
              </span>
              {experience.status && (
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(experience.status)}`}>
                  {experience.status}
                </span>
              )}
              {experience.externalSource === 'ticketmaster' && (
                <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Ticketmaster
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">{experience.title}</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {experience.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatTime(experience.startTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'map'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Map & Location
            </button>
            <button
              onClick={() => setActiveTab('booking')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'booking'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Booking
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About this experience</h3>
                <p className="text-gray-700 leading-relaxed">{experience.description}</p>
              </div>

              {/* Key Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Start Time</p>
                      <p className="font-medium">{formatTime(experience.startTime)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium text-lg">${experience.price}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Host</p>
                      <p className="font-medium">{experience.hostName}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{experience.location}</p>
                      <p className="text-sm text-gray-600">{experience.city}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Tag className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{experience.category}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium capitalize">{experience.type || 'Standard'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {experience.tags && experience.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {experience.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Availability</h4>
                  <p className="text-gray-600">{experience.availability || 'Available'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Drop-in</h4>
                  <p className="text-gray-600">{experience.isDropIn ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Location Details</h3>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{experience.location}, {experience.city}</span>
                </div>
              </div>
              
              {/* Map Container */}
              <div className="relative">
                <div 
                  ref={mapContainer} 
                  className="w-full h-80 rounded-lg overflow-hidden border border-gray-200"
                />
                
                {/* Loading indicator */}
                {isMapLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
                
                {(!mapboxgl.accessToken || mapboxgl.accessToken.includes('example')) && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <div className="text-center text-gray-600 p-6">
                      <MapPin className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                      <h4 className="text-lg font-semibold mb-2">Map Preview</h4>
                      <p className="text-sm mb-4">Location: {experience.location}</p>
                      <p className="text-sm">Lat: {experience.latitude}, Lng: {experience.longitude}</p>
                      <p className="text-xs text-gray-500">To see the actual map, add your Mapbox token to the environment variables</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Location Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Coordinates</h4>
                  <p className="text-gray-600 text-sm">
                    {experience.latitude && experience.longitude 
                      ? `${experience.latitude.toFixed(6)}, ${experience.longitude.toFixed(6)}`
                      : 'Coordinates not available'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">City</h4>
                  <p className="text-gray-600 text-sm">{experience.city}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'booking' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Book this experience</h3>
                
                {/* Booking Source Info */}
                {experience.externalSource === 'ticketmaster' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Ticketmaster Event</span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      This event is hosted by Ticketmaster. Clicking "Book" will take you to their secure website to complete your booking.
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Direct Booking</span>
                    </div>
                    <p className="text-green-700 text-sm">
                      This event is hosted directly by us. You can book securely through our Stripe-powered checkout system.
                    </p>
                  </div>
                )}
                
                <p className="text-gray-600 mb-6">
                  Ready to book? Choose your preferred booking option below.
                </p>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Price per person</span>
                  <span className="text-2xl font-bold text-gray-900">${experience.price}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {experience.type === 'free' ? 'This is a free event' : 'Payment required at booking'}
                </p>
              </div>

              {/* Security Badges */}
              <div className="flex items-center justify-center gap-6 py-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium">SSL Secured</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <Lock className="w-5 h-5" />
                  <span className="text-sm font-medium">PCI Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm font-medium">Stripe Powered</span>
                </div>
              </div>

              {/* Booking Options */}
              <div className="space-y-4">
                <button 
                  onClick={handleBooking}
                  disabled={isCheckoutLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckoutLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : experience.externalSource === 'ticketmaster' ? (
                    <>
                      <Globe className="w-5 h-5" />
                      Book on Ticketmaster - ${experience.price}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Secure Checkout - ${experience.price}
                    </>
                  )}
                </button>
                
                {checkoutError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{checkoutError}</p>
                  </div>
                )}
                
                <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Add to Wishlist
                </button>
                
                <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Share Event
                </button>
              </div>

              {/* Contact Host */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Host</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-gray-600">Contact host for questions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-600">Send message to host</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Globe className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-gray-600">Visit host profile</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Event ID: {experience.id}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
