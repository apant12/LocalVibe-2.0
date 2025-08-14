// Core data types for the LocalVibe application
import type { User, Experience, Category, Review } from "@shared/schema";

// Re-export shared types
export type { User, Experience, Category, Review };

// Frontend-specific types
export interface ExperienceWithInteractions extends Experience {
  isLiked?: boolean;
  isSaved?: boolean;
  hasUserReviewed?: boolean;
}

export interface UserInteractions {
  likes: string[];
  saves: string[];
  reviews: string[];
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface SearchFilters {
  category?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  type?: 'free' | 'paid' | 'donation';
  availability?: 'available' | 'full' | 'waitlist';
  isDropIn?: boolean;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface MoodFilter {
  mood: string;
  keywords: string[];
  color: string;
  emoji: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Social features
export interface ShareData {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
}

// External service types
export interface EventbriteEvent {
  id: string;
  name: { text: string };
  description: { text: string };
  start: { utc: string };
  end: { utc: string };
  logo?: { url: string };
  venue?: {
    address: { localized_address_display: string };
    latitude: string;
    longitude: string;
  };
  is_free: boolean;
  ticket_availability?: {
    minimum_ticket_price: { major_value: string };
  };
  capacity?: number;
  category?: { name: string };
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  info?: string;
  pleaseNote?: string;
  images?: Array<{ url: string }>;
  dates?: {
    start: { dateTime: string };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      city: { name: string };
      location: { latitude: string; longitude: string };
    }>;
  };
  priceRanges?: Array<{ min: number }>;
  classifications?: Array<{
    segment: { name: string };
  }>;
}

// Filter options for experience queries
export interface FilterOptions {
  categoryId?: string;
  location?: string;
  availability?: string;
  search?: string;
  date?: string; // YYYY-MM-DD format for date filtering
}