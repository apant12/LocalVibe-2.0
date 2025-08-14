import React, { createContext, useContext, useState, ReactNode } from 'react';

interface City {
  id: string;
  name: string;
  country: string;
  timezone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  experienceCount?: number;
  isPopular?: boolean;
}

interface LocationContextType {
  currentCity: City;
  setCurrentCity: (city: City) => void;
  availableCities: City[];
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const availableCities: City[] = [
  {
    id: 'sf',
    name: 'San Francisco',
    country: 'United States',
    timezone: 'America/Los_Angeles',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    experienceCount: 156,
    isPopular: true
  },
  {
    id: 'nyc',
    name: 'New York',
    country: 'United States',
    timezone: 'America/New_York',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    experienceCount: 234,
    isPopular: true
  },
  {
    id: 'la',
    name: 'Los Angeles',
    country: 'United States',
    timezone: 'America/Los_Angeles',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    experienceCount: 189,
    isPopular: true
  },
  {
    id: 'chicago',
    name: 'Chicago',
    country: 'United States',
    timezone: 'America/Chicago',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    experienceCount: 112,
    isPopular: true
  },
  {
    id: 'miami',
    name: 'Miami',
    country: 'United States',
    timezone: 'America/New_York',
    coordinates: { lat: 25.7617, lng: -80.1918 },
    experienceCount: 98,
    isPopular: true
  }
];

export function LocationProvider({ children }: { children: ReactNode }) {
  const [currentCity, setCurrentCity] = useState<City>(availableCities[0]);

  return (
    <LocationContext.Provider value={{
      currentCity,
      setCurrentCity,
      availableCities
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}