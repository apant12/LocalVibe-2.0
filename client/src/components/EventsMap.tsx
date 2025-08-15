import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

interface EventsMapProps {
  experiences: Experience[];
  onExperienceClick?: (experience: Experience) => void;
}

export default function EventsMap({ experiences, onExperienceClick }: EventsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  console.log("EventsMap component rendering with", experiences.length, "experiences");
  
  // Filter experiences with valid coordinates
  const experiencesWithCoords = experiences.filter(exp => exp.latitude && exp.longitude);
  
  useEffect(() => {
    if (!mapContainer.current || experiencesWithCoords.length === 0) return;

    // Set Mapbox access token
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example';
    mapboxgl.accessToken = mapboxToken;

    // Calculate center point
    const centerLng = experiencesWithCoords.reduce((sum, exp) => sum + (exp.longitude || 0), 0) / experiencesWithCoords.length;
    const centerLat = experiencesWithCoords.reduce((sum, exp) => sum + (exp.latitude || 0), 0) / experiencesWithCoords.length;

    // Create map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [centerLng, centerLat],
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl());

    // Add markers for each experience
    experiencesWithCoords.forEach((experience) => {
      if (experience.latitude && experience.longitude) {
        // Create custom marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        markerEl.innerHTML = `
          <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold ${
            experience.type === 'free' ? 'bg-green-500' : 'bg-orange-500'
          }">
            ${experience.type === 'free' ? 'F' : '$'}
          </div>
        `;

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-3 max-w-xs">
              <h3 class="font-semibold text-sm mb-1">${experience.title}</h3>
              <p class="text-xs text-gray-600 mb-2">${experience.location}</p>
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium">$${experience.price}</span>
                <span class="text-gray-500">${experience.type}</span>
              </div>
            </div>
          `);

        // Add marker to map
        new mapboxgl.Marker(markerEl)
          .setLngLat([experience.longitude, experience.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        // Add click handler
        markerEl.addEventListener('click', () => {
          onExperienceClick?.(experience);
        });
      }
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [experiencesWithCoords, onExperienceClick]);

  if (experiencesWithCoords.length === 0) {
    return (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
          <p className="text-sm">No events with location data available</p>
        </div>
      </div>
    );
  }

  // Check if Mapbox token is available
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const hasValidToken = mapboxToken && !mapboxToken.includes('example');

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden">
      {hasValidToken ? (
        // Real Mapbox map
        <div ref={mapContainer} className="w-full h-full" />
      ) : (
        // Placeholder with better styling
        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 relative">
          {/* Map Grid */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }} />
          </div>
          
          {/* Event Markers */}
          {experiencesWithCoords.map((experience, index) => {
            // Calculate relative position on map (simplified positioning)
            const x = 20 + (index % 3) * 30; // 3 columns
            const y = 20 + Math.floor(index / 3) * 25; // Rows
            
            return (
              <div
                key={experience.id}
                className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${x}%`, top: `${y}%` }}
                onClick={() => onExperienceClick?.(experience)}
              >
                {/* Marker */}
                <div className="relative">
                  <div className={`
                    w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold
                    ${experience.type === 'free' ? 'bg-green-500' : 'bg-orange-500'}
                    hover:scale-110 transition-transform duration-200
                  `}>
                    {experience.type === 'free' ? 'F' : '$'}
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      {experience.title}
                    </div>
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black mx-auto"></div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Map placeholder message */}
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 shadow-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-1">Interactive Map Preview</p>
              <p>Add your Mapbox token to see the real map</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
