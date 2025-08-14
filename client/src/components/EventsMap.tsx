import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock, DollarSign, Users, Star } from 'lucide-react';
import type { Experience } from '@/types';
import { useLocation } from '@/components/LocationContext';

// Set your Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoiYXl1c2hwOTY0NSIsImEiOiJjbWU4dXY1NDEwOWt4MmtvZmsyZDJ6dHRuIn0.UEyAr9CrIiIiVWDDgX4ddw';

interface EventsMapProps {
  experiences: Experience[];
  onExperienceClick?: (experience: Experience) => void;
}

export default function EventsMap({ experiences, onExperienceClick }: EventsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { currentCity } = useLocation();
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [showHeatMap, setShowHeatMap] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [currentCity.coordinates.lng, currentCity.coordinates.lat],
      zoom: 11
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [currentCity]);

  useEffect(() => {
    if (!map.current || !experiences.length) return;

    // Remove existing markers and layers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    if (map.current.getLayer('heatmap-layer')) {
      map.current.removeLayer('heatmap-layer');
    }
    if (map.current.getSource('heatmap-source')) {
      map.current.removeSource('heatmap-source');
    }

    // Add event markers
    experiences.forEach((experience) => {
      if (!experience.latitude || !experience.longitude) return;

      // Create marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'event-marker';
      markerEl.style.width = '20px';
      markerEl.style.height = '20px';
      markerEl.style.borderRadius = '50%';
      markerEl.style.backgroundColor = getMarkerColor(experience);
      markerEl.style.border = '2px solid white';
      markerEl.style.cursor = 'pointer';
      markerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3 max-w-xs">
          <h3 class="font-semibold text-lg mb-2">${experience.title || 'Untitled Event'}</h3>
          <p class="text-gray-600 text-sm mb-2">${experience.description?.substring(0, 100) || 'No description available'}...</p>
          <div class="flex items-center text-sm text-gray-500 mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            ${experience.location || 'Location not specified'}
          </div>
          ${experience.startTime ? `
            <div class="flex items-center text-sm text-gray-500 mb-2">
              <Calendar className="w-4 h-4 mr-1" />
              ${new Date(experience.startTime).toLocaleDateString()}
            </div>
          ` : ''}
          ${experience.price ? `
            <div class="flex items-center text-sm text-gray-500">
              <DollarSign className="w-4 h-4 mr-1" />
              $${experience.price}
            </div>
          ` : ''}
        </div>
      `);

      // Add marker to map
      new mapboxgl.Marker(markerEl)
        .setLngLat([experience.longitude, experience.latitude])
        .setPopup(popup)
        .addTo(map.current);

      // Add click event
      markerEl.addEventListener('click', () => {
        setSelectedExperience(experience);
        if (onExperienceClick) {
          onExperienceClick(experience);
        }
      });
    });

    // Add heat map if enabled
    if (showHeatMap) {
      const heatmapData = experiences
        .filter(exp => exp.latitude && exp.longitude)
        .map(exp => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [exp.longitude, exp.latitude]
          },
          properties: {
            intensity: getHeatmapIntensity(exp)
          }
        }));

      map.current.addSource('heatmap-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: heatmapData
        }
      });

      map.current.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-source',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 0,
            10, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            9, 3
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',
            0.2, 'rgba(0, 0, 255, 0.5)',
            0.4, 'rgba(0, 255, 255, 0.8)',
            0.6, 'rgba(0, 255, 0, 0.8)',
            0.8, 'rgba(255, 255, 0, 0.8)',
            1, 'rgba(255, 0, 0, 0.8)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            9, 20
          ],
          'heatmap-opacity': 0.8
        }
      });
    }
  }, [experiences, showHeatMap, onExperienceClick]);

  // Update map center when city changes
  useEffect(() => {
    if (map.current) {
      map.current.flyTo({
        center: [currentCity.coordinates.lng, currentCity.coordinates.lat],
        zoom: 11,
        duration: 2000
      });
    }
  }, [currentCity]);

  const getMarkerColor = (experience: Experience): string => {
    if (experience.type === 'free') return '#10B981'; // Green for free
    if (experience.price && Number(experience.price) > 100) return '#EF4444'; // Red for expensive
    if (experience.price && Number(experience.price) > 50) return '#F59E0B'; // Orange for medium
    return '#3B82F6'; // Blue for default
  };

  const getHeatmapIntensity = (experience: Experience): number => {
    let intensity = 1;
    
    // Increase intensity based on price (more expensive = more popular)
    if (experience.price) {
      intensity += Math.min(Number(experience.price) / 50, 5);
    }
    
    // Increase intensity for popular categories
    if (experience.categoryId) {
      const popularCategories = ['music', 'sports', 'food', 'art'];
      if (popularCategories.includes(experience.categoryId)) {
        intensity += 2;
      }
    }
    
    return intensity;
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Button
          variant={showHeatMap ? "default" : "secondary"}
          size="sm"
          onClick={() => setShowHeatMap(!showHeatMap)}
          className="bg-black/80 text-white hover:bg-black/90"
        >
          {showHeatMap ? 'Hide' : 'Show'} Heat Map
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (map.current) {
              map.current.flyTo({
                center: [currentCity.coordinates.lng, currentCity.coordinates.lat],
                zoom: 11,
                duration: 1000
              });
            }
          }}
          className="bg-black/80 text-white hover:bg-black/90"
        >
          Reset View
        </Button>
      </div>

      {/* City Info Overlay */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="bg-black/80 text-white border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{currentCity.name}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm text-gray-300">
              <p>{experiences.length} events found</p>
              <p className="text-xs text-gray-400">
                {currentCity.coordinates.lat.toFixed(4)}, {currentCity.coordinates.lng.toFixed(4)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Experience Dialog */}
      {selectedExperience && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <Card className="bg-black/90 text-white border-gray-600">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedExperience.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedExperience(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-300 text-sm mb-3">
                {selectedExperience.description?.substring(0, 150)}...
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                {selectedExperience.location && (
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {selectedExperience.location}
                  </div>
                )}
                
                {selectedExperience.startTime && (
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(selectedExperience.startTime).toLocaleDateString()}
                  </div>
                )}
                
                {selectedExperience.price && (
                  <div className="flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" />
                    ${selectedExperience.price}
                  </div>
                )}
                
                {selectedExperience.capacity && (
                  <div className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {selectedExperience.capacity} spots
                  </div>
                )}
              </div>
              
              <div className="mt-3 flex space-x-2">
                <Button size="sm" className="bg-primary text-black hover:bg-primary/90">
                  View Details
                </Button>
                <Button size="sm" variant="outline" className="border-gray-600 text-white">
                  Book Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legend */}
      {showHeatMap && (
        <div className="absolute bottom-4 right-4 z-10">
          <Card className="bg-black/80 text-white border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Heat Map Legend</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1 text-xs">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  <span>Low Activity</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span>Medium Activity</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                  <span>High Activity</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  <span>Very High Activity</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
