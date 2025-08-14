import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, X, Navigation, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
}

interface ExperienceMapProps {
  experiences: Experience[];
  selectedExperience?: Experience | null;
  onExperienceSelect?: (experience: Experience) => void;
  onClose?: () => void;
  userLocation?: { lat: number; lng: number };
}

export default function ExperienceMap({ 
  experiences, 
  selectedExperience, 
  onExperienceSelect, 
  onClose,
  userLocation 
}: ExperienceMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initializeMap = async () => {
      try {
        // Load Mapbox GL JS dynamically
        const mapboxgl = await import('mapbox-gl');
        
        // Set access token
        mapboxgl.default.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
        
        if (!mapboxgl.default.accessToken) {
          console.warn('Mapbox token not found. Map features disabled.');
          return;
        }

        // Create map instance
        map.current = new mapboxgl.default.Map({
          container: mapContainer.current!,
          style: mapStyle,
          center: userLocation ? [userLocation.lng, userLocation.lat] : [-122.4194, 37.7749], // SF default
          zoom: userLocation ? 12 : 10,
          attributionControl: false,
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.default.NavigationControl(), 'top-right');

        // Add geolocation control
        map.current.addControl(
          new mapboxgl.default.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
          }),
          'top-right'
        );

        map.current.on('load', () => {
          setMapLoaded(true);
        });

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapStyle, userLocation]);

  // Add/update markers when experiences change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers for experiences with coordinates
    experiences.forEach(experience => {
      if (!experience.latitude || !experience.longitude) return;

      const mapboxgl = require('mapbox-gl');
      
      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'experience-marker';
      markerElement.innerHTML = `
        <div class="w-10 h-10 bg-orange-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
          <span class="text-white text-xs font-bold">${experience.type === 'free' ? 'F' : '$'}</span>
        </div>
      `;

      // Create popup content
      const popupContent = `
        <div class="max-w-xs">
          <div class="font-semibold text-sm mb-1">${experience.title}</div>
          <div class="text-xs text-gray-600 mb-2">${experience.location}</div>
          ${experience.imageUrl ? `<img src="${experience.imageUrl}" alt="${experience.title}" class="w-full h-24 object-cover rounded mb-2">` : ''}
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium ${experience.type === 'free' ? 'text-green-600' : 'text-orange-600'}">
              ${experience.type === 'free' ? 'Free' : `${experience.currency} ${experience.price}`}
            </span>
            ${experience.rating ? `<span class="text-xs text-gray-500">★ ${experience.rating}</span>` : ''}
          </div>
        </div>
      `;

      // Create popup
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        className: 'experience-popup'
      }).setHTML(popupContent);

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([experience.longitude, experience.latitude])
        .setPopup(popup)
        .addTo(map.current);

      // Add click handler
      markerElement.addEventListener('click', () => {
        onExperienceSelect?.(experience);
      });

      markers.current.push(marker);
    });

    // Fit map to show all markers if we have experiences
    if (experiences.length > 0 && experiences.some(e => e.latitude && e.longitude)) {
      const coordinates = experiences
        .filter(e => e.latitude && e.longitude)
        .map(e => [e.longitude!, e.latitude!]);

      const bounds = new (require('mapbox-gl')).LngLatBounds();
      coordinates.forEach(coord => bounds.extend(coord));
      
      map.current.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 14 
      });
    }
  }, [experiences, mapLoaded, onExperienceSelect]);

  // Highlight selected experience
  useEffect(() => {
    if (!selectedExperience || !map.current || !mapLoaded) return;

    if (selectedExperience.latitude && selectedExperience.longitude) {
      map.current.flyTo({
        center: [selectedExperience.longitude, selectedExperience.latitude],
        zoom: 15,
        duration: 1000
      });
    }
  }, [selectedExperience, mapLoaded]);

  const mapStyles = [
    { id: 'mapbox://styles/mapbox/streets-v12', name: 'Streets' },
    { id: 'mapbox://styles/mapbox/satellite-streets-v12', name: 'Satellite' },
    { id: 'mapbox://styles/mapbox/light-v11', name: 'Light' },
    { id: 'mapbox://styles/mapbox/dark-v11', name: 'Dark' },
  ];

  if (!import.meta.env.VITE_MAPBOX_TOKEN) {
    return (
      <Card className="h-96 flex items-center justify-center">
        <CardContent>
          <div className="text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Map feature requires Mapbox configuration</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Map Container */}
      <div 
        ref={mapContainer}
        className="w-full h-96 rounded-lg overflow-hidden bg-gray-100"
        style={{ minHeight: '400px' }}
      />

      {/* Close Button */}
      {onClose && (
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 left-2 z-10 bg-white/90 hover:bg-white"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      {/* Map Style Selector */}
      <div className="absolute top-2 right-2 z-10 bg-white rounded-md shadow-sm">
        <select
          value={mapStyle}
          onChange={(e) => {
            setMapStyle(e.target.value);
            if (map.current) {
              map.current.setStyle(e.target.value);
            }
          }}
          className="px-3 py-1 text-sm border-none bg-transparent focus:outline-none"
        >
          {mapStyles.map(style => (
            <option key={style.id} value={style.id}>
              {style.name}
            </option>
          ))}
        </select>
      </div>

      {/* Experience Count Badge */}
      <div className="absolute bottom-2 left-2 z-10">
        <Badge variant="secondary" className="bg-white/90">
          <MapPin className="w-3 h-3 mr-1" />
          {experiences.filter(e => e.latitude && e.longitude).length} experiences
        </Badge>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 right-2 z-10 bg-white/90 rounded-md p-2 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">$</span>
          </div>
          <span>Paid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">F</span>
          </div>
          <span>Free</span>
        </div>
      </div>

      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <div className="text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// CSS to be added to global styles
const mapStyles = `
.experience-marker {
  cursor: pointer;
}

.experience-popup .mapboxgl-popup-content {
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.experience-popup .mapboxgl-popup-tip {
  border-top-color: white;
}

.mapboxgl-popup-close-button {
  font-size: 16px;
  padding: 0;
  width: 20px;
  height: 20px;
  line-height: 20px;
}
`;