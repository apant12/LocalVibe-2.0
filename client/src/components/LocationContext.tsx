import React, { createContext, useContext, useState, ReactNode } from 'react';

interface City {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface LocationContextType {
  currentCity: City;
  setCurrentCity: (city: City) => void;
  availableCities: City[];
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const availableCities: City[] = [
  {
    name: 'San Francisco',
    coordinates: { lat: 37.7749, lng: -122.4194 }
  },
  {
    name: 'New York',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  {
    name: 'Los Angeles',
    coordinates: { lat: 34.0522, lng: -118.2437 }
  },
  {
    name: 'Chicago',
    coordinates: { lat: 41.8781, lng: -87.6298 }
  },
  {
    name: 'Miami',
    coordinates: { lat: 25.7617, lng: -80.1918 }
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