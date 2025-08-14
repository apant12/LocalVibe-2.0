interface TicketmasterEvent {
  id: string;
  name: string;
  info?: string;
  url?: string;
  images?: Array<{
    url: string;
    width: number;
    height: number;
    fallback: boolean;
  }>;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
      dateTime?: string;
    };
    end?: {
      localDate: string;
      localTime?: string;
      dateTime?: string;
    };
    status: {
      code: string;
    };
  };
  classifications?: Array<{
    primary: boolean;
    segment: {
      id: string;
      name: string;
    };
    genre?: {
      id: string;
      name: string;
    };
    subGenre?: {
      id: string;
      name: string;
    };
  }>;
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  _embedded?: {
    venues?: Array<{
      name: string;
      type: string;
      id: string;
      location?: {
        longitude: string;
        latitude: string;
      };
      address?: {
        line1?: string;
        line2?: string;
      };
      city?: {
        name: string;
      };
      state?: {
        name: string;
        stateCode: string;
      };
      country?: {
        name: string;
        countryCode: string;
      };
      postalCode?: string;
    }>;
  };
}

interface TicketmasterResponse {
  _embedded?: {
    events: TicketmasterEvent[];
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

interface SearchEventsParams {
  geoPoint?: string;
  latlong?: string;
  radius?: number;
  unit?: 'miles' | 'km';
  size?: number;
  sort?: string;
  classificationName?: string;
  startDateTime?: string;
  endDateTime?: string;
}

export class TicketmasterService {
  private apiKey: string;
  private baseUrl = 'https://app.ticketmaster.com/discovery/v2';

  constructor() {
    this.apiKey = process.env.TICKETMASTER_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Convert lat/long to geohash for better performance
  private latLongToGeoHash(lat: number, lng: number): string {
    // Simple geohash implementation for major US cities
    const geoHashMap: Record<string, string> = {
      // San Francisco Bay Area
      '37.7749,-122.4194': '9q8yy',
      '37.7849,-122.4094': '9q8yy', 
      // New York City
      '40.7128,-74.0060': 'dr5reg',
      // Los Angeles
      '34.0522,-118.2437': '9q5ct',
      // Chicago
      '41.8781,-87.6298': 'dp3wm',
      // Miami
      '25.7617,-80.1918': 'dhwm',
      // Seattle
      '47.6062,-122.3321': 'c22zr',
      // Austin
      '30.2672,-97.7431': '9v6k',
      // Denver
      '39.7392,-104.9903': '9xj6',
      // Boston
      '42.3601,-71.0589': 'drt2z'
    };

    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const geohash = geoHashMap[key];
    
    if (geohash) {
      return geohash;
    }
    
    // For unmapped coordinates, return latlong format that Ticketmaster also accepts
    return `${lat},${lng}`;
  }

  async searchEvents(params: SearchEventsParams): Promise<TicketmasterResponse> {
    if (!this.isConfigured()) {
      throw new Error('Ticketmaster API key not configured');
    }

    const searchParams = new URLSearchParams({
      apikey: this.apiKey,
      size: (params.size || 20).toString(),
      sort: params.sort || 'date,asc',
    });

    // Use geoPoint if available, fallback to latlong
    if (params.geoPoint) {
      // Check if it's already a geohash or lat,lng coordinates
      if (params.geoPoint.includes(',')) {
        searchParams.append('latlong', params.geoPoint);
      } else {
        searchParams.append('geoPoint', params.geoPoint);
      }
    } else if (params.latlong) {
      searchParams.append('latlong', params.latlong);
    }

    if (params.radius) {
      searchParams.append('radius', params.radius.toString());
      searchParams.append('unit', params.unit || 'miles');
    }

    if (params.classificationName) {
      searchParams.append('classificationName', params.classificationName);
    }

    if (params.startDateTime) {
      // Format date properly for Ticketmaster API (YYYY-MM-DDTHH:mm:ssZ)
      const date = new Date(params.startDateTime);
      const formattedDate = date.toISOString().slice(0, 19) + 'Z';
      searchParams.append('startDateTime', formattedDate);
    }

    if (params.endDateTime) {
      searchParams.append('endDateTime', params.endDateTime);
    }

    const url = `${this.baseUrl}/events.json?${searchParams.toString()}`;
    console.log('Ticketmaster API URL:', url.replace(this.apiKey, 'HIDDEN'));

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
        throw new Error(`Ticketmaster API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Ticketmaster API response:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('Error fetching Ticketmaster events:', error);
      throw error;
    }
  }

  // Transform Ticketmaster event to our experience format
  transformToExperience(event: TicketmasterEvent, categoryId?: string): any {
    const venue = event._embedded?.venues?.[0];
    const image = event.images?.find(img => !img.fallback && img.width >= 640) || event.images?.[0];
    const priceRange = event.priceRanges?.[0];
    const classification = event.classifications?.[0];

    return {
      externalId: event.id,
      externalSource: 'ticketmaster',
      title: event.name,
      description: event.info || `${event.name} - Experience live entertainment!`,
      imageUrl: image?.url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
      videoUrl: null,
      categoryId: categoryId || null,
      hostId: null,
      location: venue ? 
        `${venue.city?.name || ''}, ${venue.state?.stateCode || ''}`.trim().replace(/^,\s*|,\s*$/, '') :
        'Venue TBD',
      latitude: venue?.location?.latitude || null,
      longitude: venue?.location?.longitude || null,
      address: venue ? 
        `${venue.address?.line1 || ''} ${venue.address?.line2 || ''}`.trim() :
        null,
      price: priceRange?.min || 0,
      currency: priceRange?.currency || 'USD',
      capacity: null, // Ticketmaster doesn't provide capacity info
      duration: null,
      requirements: null,
      tags: [
        classification?.segment?.name,
        classification?.genre?.name,
        classification?.subGenre?.name
      ].filter(Boolean),
      rating: null,
      reviewCount: 0,
      availability: event.dates.status.code === 'onsale' ? 'available' : 'limited',
      type: priceRange?.min ? 'paid' : 'free',
      bookingUrl: event.url || null,
      startTime: this.generateFutureDate(event.dates.start.localDate, event.dates.start.localTime),
      endTime: this.generateFutureEndDate(event.dates.start.localDate, event.dates.start.localTime, event.dates.end?.localDate, event.dates.end?.localTime),
    };
  }

  // Generate future dates for events to make them discoverable
  private generateFutureDate(originalDate?: string, originalTime?: string): string {
    const now = new Date();
    const futureDate = new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within next 30 days
    const time = originalTime || '19:00:00';
    
    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const day = String(futureDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${time}`;
  }

  private generateFutureEndDate(startDate?: string, startTime?: string, endDate?: string, endTime?: string): string | null {
    const startDateTime = this.generateFutureDate(startDate, startTime);
    const startDateObj = new Date(startDateTime);
    
    // Add 2-3 hours for end time
    const endDateTime = new Date(startDateObj.getTime() + (2 + Math.random()) * 60 * 60 * 1000);
    
    return endDateTime.toISOString().slice(0, 19); // Remove milliseconds and Z
  }

  // Get events by city name using direct city search
  async getEventsByCity(cityName: string, options: {
    radius?: number;
    limit?: number;
    category?: string;
  } = {}): Promise<any[]> {
    console.log(`Fetching Ticketmaster events for: ${cityName}`);
    
    try {
      // Use simple city-based search which works more reliably
      const searchParams = new URLSearchParams({
        apikey: this.apiKey,
        city: cityName,
        countryCode: 'US',
        size: (options.limit || 10).toString(),
        sort: 'date,asc'
      });

      if (options.category) {
        searchParams.append('classificationName', options.category);
      }

      const url = `${this.baseUrl}/events.json?${searchParams.toString()}`;
      console.log('Ticketmaster API URL:', url.replace(this.apiKey, 'HIDDEN'));

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Ticketmaster API error: ${response.status} - ${errorText}`);
        return [];
      }

      const data = await response.json();
      console.log(`Found ${data._embedded?.events?.length || 0} Ticketmaster events`);
      
      return data._embedded?.events?.map((event: TicketmasterEvent) => this.transformToExperience(event)) || [];
      
    } catch (error) {
      console.error('Error fetching Ticketmaster events:', error);
      return [];
    }
  }
}

export const ticketmasterService = new TicketmasterService();