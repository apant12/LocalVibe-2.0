// Location services combining Mapbox and Google Places
export class MapService {
  private mapboxToken: string;
  private googlePlacesKey: string;

  constructor() {
    this.mapboxToken = process.env.MAPBOX_TOKEN || '';
    this.googlePlacesKey = process.env.GOOGLE_PLACES_KEY || '';
  }

  isMapboxConfigured(): boolean {
    return !!this.mapboxToken;
  }

  isGooglePlacesConfigured(): boolean {
    return !!this.googlePlacesKey;
  }

  // Mapbox Geocoding API
  async geocodeLocation(address: string) {
    if (!this.isMapboxConfigured()) {
      throw new Error('Mapbox token not configured');
    }

    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${this.mapboxToken}&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Mapbox reverse geocoding
  async reverseGeocode(longitude: number, latitude: number) {
    if (!this.isMapboxConfigured()) {
      throw new Error('Mapbox token not configured');
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${this.mapboxToken}&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Google Places search
  async searchPlaces(params: {
    query: string;
    location?: string; // latitude,longitude
    radius?: number;
    type?: string;
    minprice?: number;
    maxprice?: number;
  }) {
    if (!this.isGooglePlacesConfigured()) {
      throw new Error('Google Places API key not configured');
    }

    const searchParams = new URLSearchParams();
    searchParams.set('query', params.query);
    searchParams.set('key', this.googlePlacesKey);
    if (params.location) searchParams.set('location', params.location);
    if (params.radius) searchParams.set('radius', params.radius.toString());
    if (params.type) searchParams.set('type', params.type);
    if (params.minprice) searchParams.set('minprice', params.minprice.toString());
    if (params.maxprice) searchParams.set('maxprice', params.maxprice.toString());

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${searchParams}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Google Places nearby search
  async findNearbyPlaces(params: {
    location: string; // latitude,longitude
    radius: number;
    type?: string;
    keyword?: string;
    minprice?: number;
    maxprice?: number;
  }) {
    if (!this.isGooglePlacesConfigured()) {
      throw new Error('Google Places API key not configured');
    }

    const searchParams = new URLSearchParams();
    searchParams.set('location', params.location);
    searchParams.set('radius', params.radius.toString());
    searchParams.set('key', this.googlePlacesKey);
    if (params.type) searchParams.set('type', params.type);
    if (params.keyword) searchParams.set('keyword', params.keyword);
    if (params.minprice) searchParams.set('minprice', params.minprice.toString());
    if (params.maxprice) searchParams.set('maxprice', params.maxprice.toString());

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${searchParams}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get place details
  async getPlaceDetails(placeId: string, fields?: string[]) {
    if (!this.isGooglePlacesConfigured()) {
      throw new Error('Google Places API key not configured');
    }

    const searchParams = new URLSearchParams();
    searchParams.set('place_id', placeId);
    searchParams.set('key', this.googlePlacesKey);
    if (fields) {
      searchParams.set('fields', fields.join(','));
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${searchParams}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    return response.json();
  }
}