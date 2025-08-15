import React, { useEffect, useRef } from 'react';
import { MapPin, Calendar, DollarSign, Users } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
}

interface MapModalProps {
  experience: Experience | null;
  isOpen: boolean;
  onClose: () => void;
}

const MapModal: React.FC<MapModalProps> = ({ experience, isOpen, onClose }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoading, setIsMapLoading] = React.useState(true);

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

  if (!isOpen || !experience) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{experience.title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Map Container */}
          <div className="relative">
            <div 
              ref={mapContainer} 
              className="w-full h-64 rounded-lg overflow-hidden"
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
          
          {/* Experience Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{experience.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{new Date(experience.startTime).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span>${experience.price}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Hosted by {experience.hostName}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-semibold mb-2">About this experience</h4>
            <p className="text-sm text-gray-600">{experience.description}</p>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MapModal;
