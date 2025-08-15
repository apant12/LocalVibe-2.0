interface Place {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  category: string;
  tags: string[];
  latitude?: number;
  longitude?: number;
  startTime?: string;
  endTime?: string;
  externalSource: string;
  price: string;
  type: 'free' | 'paid';
}

interface PlaceCluster {
  center: {
    latitude: number;
    longitude: number;
    city: string;
  };
  places: Place[];
  category: string;
  timeSlot: string;
  recommendationScore: number;
}

export class AIPlaceMatcher {
  private static readonly EARTH_RADIUS = 6371; // km
  private static readonly PROXIMITY_THRESHOLD = 2; // km
  private static readonly TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in ms
  private static readonly GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  /**
   * Calculate distance between two points using Haversine formula
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if two places are temporally compatible
   */
  private static areTemporallyCompatible(place1: Place, place2: Place): boolean {
    if (!place1.startTime || !place2.startTime) return true;
    
    const time1 = new Date(place1.startTime).getTime();
    const time2 = new Date(place2.startTime).getTime();
    const timeDiff = Math.abs(time1 - time2);
    
    return timeDiff <= this.TIME_WINDOW;
  }

  /**
   * Calculate category similarity score
   */
  private static getCategorySimilarity(place1: Place, place2: Place): number {
    if (place1.category === place2.category) return 1.0;
    
    const tagOverlap = place1.tags.filter(tag => place2.tags.includes(tag)).length;
    const totalTags = new Set([...place1.tags, ...place2.tags]).size;
    
    return tagOverlap / totalTags;
  }

  /**
   * Calculate recommendation score for a place combination
   */
  private static calculateRecommendationScore(places: Place[]): number {
    if (places.length < 2) return 0;

    let totalScore = 0;
    let comparisons = 0;

    for (let i = 0; i < places.length; i++) {
      for (let j = i + 1; j < places.length; j++) {
        const place1 = places[i];
        const place2 = places[j];

        // Distance score (closer is better)
        if (place1.latitude && place2.latitude && place1.longitude && place2.longitude) {
          const distance = this.calculateDistance(
            place1.latitude, place1.longitude,
            place2.latitude, place2.longitude
          );
          const distanceScore = Math.max(0, 1 - (distance / this.PROXIMITY_THRESHOLD));
          totalScore += distanceScore;
        }

        // Category similarity score
        const categoryScore = this.getCategorySimilarity(place1, place2);
        totalScore += categoryScore;

        // Temporal compatibility score
        const temporalScore = this.areTemporallyCompatible(place1, place2) ? 1 : 0;
        totalScore += temporalScore;

        // Price diversity score (mix of free and paid is good)
        const priceDiversity = place1.type !== place2.type ? 0.5 : 0;
        totalScore += priceDiversity;

        comparisons++;
      }
    }

    return comparisons > 0 ? totalScore / comparisons : 0;
  }

  /**
   * Cluster places by proximity and create recommendations
   */
  static clusterPlaces(places: Place[]): PlaceCluster[] {
    const clusters: PlaceCluster[] = [];
    const processed = new Set<string>();

    for (const place of places) {
      if (processed.has(place.id)) continue;

      const cluster: Place[] = [place];
      processed.add(place.id);

      // Find nearby places
      for (const otherPlace of places) {
        if (processed.has(otherPlace.id)) continue;
        if (!place.latitude || !place.longitude || !otherPlace.latitude || !otherPlace.longitude) continue;

        const distance = this.calculateDistance(
          place.latitude, place.longitude,
          otherPlace.latitude, otherPlace.longitude
        );

        if (distance <= this.PROXIMITY_THRESHOLD && this.areTemporallyCompatible(place, otherPlace)) {
          cluster.push(otherPlace);
          processed.add(otherPlace.id);
        }
      }

      if (cluster.length > 1) {
        // Calculate cluster center
        const avgLat = cluster.reduce((sum, p) => sum + (p.latitude || 0), 0) / cluster.length;
        const avgLon = cluster.reduce((sum, p) => sum + (p.longitude || 0), 0) / cluster.length;

        // Determine dominant category
        const categoryCounts: { [key: string]: number } = {};
        cluster.forEach(p => {
          categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
        });
        const dominantCategory = Object.entries(categoryCounts)
          .sort(([,a], [,b]) => b - a)[0][0];

        // Calculate recommendation score
        const score = this.calculateRecommendationScore(cluster);

        clusters.push({
          center: {
            latitude: avgLat,
            longitude: avgLon,
            city: place.city
          },
          places: cluster,
          category: dominantCategory,
          timeSlot: this.getTimeSlot(cluster),
          recommendationScore: score
        });
      }
    }

    return clusters.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * Get time slot for a cluster
   */
  private static getTimeSlot(places: Place[]): string {
    const placesWithTime = places.filter(p => p.startTime);
    if (placesWithTime.length === 0) return 'Anytime';

    const times = placesWithTime.map(p => new Date(p.startTime!).getTime());
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const date = new Date(avgTime);

    const hour = date.getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 21) return 'Evening';
    return 'Night';
  }

  /**
   * Generate personalized recommendations based on user preferences
   */
  static generatePersonalizedRecommendations(
    places: Place[],
    userPreferences: {
      preferredCategories?: string[];
      preferredPriceRange?: 'free' | 'paid' | 'mixed';
      preferredTimeSlots?: string[];
      maxDistance?: number;
    } = {}
  ): Place[] {
    const { preferredCategories, preferredPriceRange, preferredTimeSlots, maxDistance } = userPreferences;

    return places.filter(place => {
      // Category filter
      if (preferredCategories && preferredCategories.length > 0) {
        if (!preferredCategories.includes(place.category)) return false;
      }

      // Price filter
      if (preferredPriceRange) {
        if (preferredPriceRange === 'free' && place.type !== 'free') return false;
        if (preferredPriceRange === 'paid' && place.type !== 'paid') return false;
      }

      // Time slot filter
      if (preferredTimeSlots && preferredTimeSlots.length > 0 && place.startTime) {
        const hour = new Date(place.startTime).getHours();
        let timeSlot = 'Morning';
        if (hour >= 12 && hour < 17) timeSlot = 'Afternoon';
        else if (hour >= 17 && hour < 21) timeSlot = 'Evening';
        else if (hour >= 21) timeSlot = 'Night';

        if (!preferredTimeSlots.includes(timeSlot)) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by relevance score
      let scoreA = 0, scoreB = 0;

      // Category preference bonus
      if (preferredCategories?.includes(a.category)) scoreA += 2;
      if (preferredCategories?.includes(b.category)) scoreB += 2;

      // Price preference bonus
      if (preferredPriceRange === a.type) scoreA += 1;
      if (preferredPriceRange === b.type) scoreB += 1;

      return scoreB - scoreA;
    });
  }

  /**
   * Create experience itineraries from place clusters
   */
  static createItineraries(clusters: PlaceCluster[], maxItineraries: number = 5): any[] {
    return clusters.slice(0, maxItineraries).map((cluster, index) => ({
      id: `itinerary-${index + 1}`,
      title: `${cluster.category} Experience in ${cluster.center.city}`,
      description: `Curated ${cluster.category} experience with ${cluster.places.length} locations`,
      places: cluster.places,
      center: cluster.center,
      timeSlot: cluster.timeSlot,
      recommendationScore: cluster.recommendationScore,
      estimatedDuration: cluster.places.length * 2, // 2 hours per place
      totalCost: cluster.places.reduce((sum, place) => sum + parseFloat(place.price), 0)
    }));
  }
}

export class VideoRecommendationEngine {
  private static readonly GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  // Video similarity scoring based on multiple factors
  static calculateVideoSimilarity(event: any, video: any): number {
    let score = 0;
    
    // Category matching (highest weight)
    if (event.category && video.tags && video.tags.includes(event.category)) {
      score += 40;
    }
    
    // Tag overlap
    if (event.tags && video.tags) {
      const eventTags = new Set(event.tags.map((tag: string) => tag.toLowerCase()));
      const videoTags = new Set(video.tags.map((tag: string) => tag.toLowerCase()));
      const overlap = Array.from(eventTags).filter(tag => videoTags.has(tag)).length;
      score += overlap * 15;
    }
    
    // Location similarity (if available)
    if (event.city && video.location && video.location.toLowerCase().includes(event.city.toLowerCase())) {
      score += 25;
    }
    
    // Title/keyword matching
    const eventKeywords = this.extractKeywords(event.title + ' ' + event.description);
    const videoKeywords = this.extractKeywords(video.title + ' ' + video.description);
    const keywordOverlap = eventKeywords.filter(keyword => videoKeywords.includes(keyword)).length;
    score += keywordOverlap * 10;
    
    // Activity type matching
    if (this.isActivityTypeMatch(event, video)) {
      score += 20;
    }
    
    // Time of day matching (for events with specific times)
    if (this.isTimeOfDayMatch(event, video)) {
      score += 10;
    }
    
    return score;
  }
  
  // Extract meaningful keywords from text
  static extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
    
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
  }
  
  // Check if activity types match
  static isActivityTypeMatch(event: any, video: any): boolean {
    const activityTypes: Record<string, string[]> = {
      'outdoor': ['hiking', 'walking', 'running', 'cycling', 'climbing', 'swimming', 'sports', 'park', 'nature', 'adventure'],
      'indoor': ['museum', 'gallery', 'theater', 'cinema', 'restaurant', 'cafe', 'shopping', 'workshop', 'class', 'gym'],
      'nightlife': ['bar', 'club', 'pub', 'dance', 'music', 'concert', 'party', 'comedy', 'karaoke', 'night'],
      'food': ['restaurant', 'cafe', 'food', 'dining', 'cooking', 'tasting', 'wine', 'beer', 'coffee', 'dessert'],
      'culture': ['museum', 'gallery', 'theater', 'concert', 'art', 'history', 'culture', 'heritage', 'exhibition', 'performance'],
      'wellness': ['yoga', 'meditation', 'spa', 'massage', 'fitness', 'gym', 'wellness', 'health', 'relaxation', 'therapy']
    };
    
    const eventType = this.getEventType(event);
    const videoType = this.getVideoType(video);
    
    return eventType === videoType || 
           (activityTypes[eventType] && activityTypes[eventType].some((activity: string) => 
             video.title.toLowerCase().includes(activity) || 
             video.description.toLowerCase().includes(activity)
           ));
  }
  
  // Get event type based on category and tags
  static getEventType(event: any): string {
    const category = event.category?.toLowerCase();
    const tags = event.tags?.map((tag: string) => tag.toLowerCase()) || [];
    
    if (category === 'outdoor' || tags.some((tag: string) => ['hiking', 'walking', 'park', 'nature'].includes(tag))) {
      return 'outdoor';
    }
    if (category === 'nightlife' || tags.some((tag: string) => ['bar', 'club', 'music', 'party'].includes(tag))) {
      return 'nightlife';
    }
    if (category === 'food' || tags.some((tag: string) => ['restaurant', 'cafe', 'food', 'dining'].includes(tag))) {
      return 'food';
    }
    if (category === 'arts' || tags.some((tag: string) => ['museum', 'gallery', 'art', 'culture'].includes(tag))) {
      return 'culture';
    }
    if (category === 'wellness' || tags.some((tag: string) => ['yoga', 'fitness', 'wellness'].includes(tag))) {
      return 'wellness';
    }
    
    return 'indoor';
  }
  
  // Get video type based on content
  static getVideoType(video: any): string {
    const title = video.title.toLowerCase();
    const description = video.description.toLowerCase();
    const tags = video.tags?.map((tag: string) => tag.toLowerCase()) || [];
    
    if (tags.some(tag => ['outdoor', 'hiking', 'walking', 'park', 'nature'].includes(tag)) ||
        title.includes('outdoor') || description.includes('outdoor')) {
      return 'outdoor';
    }
    if (tags.some(tag => ['nightlife', 'bar', 'club', 'music', 'party'].includes(tag)) ||
        title.includes('night') || description.includes('night')) {
      return 'nightlife';
    }
    if (tags.some(tag => ['food', 'restaurant', 'cafe', 'dining'].includes(tag)) ||
        title.includes('food') || description.includes('food')) {
      return 'food';
    }
    if (tags.some(tag => ['art', 'museum', 'gallery', 'culture'].includes(tag)) ||
        title.includes('art') || description.includes('art')) {
      return 'culture';
    }
    if (tags.some(tag => ['wellness', 'yoga', 'fitness'].includes(tag)) ||
        title.includes('wellness') || description.includes('wellness')) {
      return 'wellness';
    }
    
    return 'indoor';
  }
  
  // Check if time of day matches
  static isTimeOfDayMatch(event: any, video: any): boolean {
    if (!event.startTime) return false;
    
    const eventHour = new Date(event.startTime).getHours();
    const videoTitle = video.title.toLowerCase();
    const videoDescription = video.description.toLowerCase();
    
    // Morning (6-12)
    if (eventHour >= 6 && eventHour < 12) {
      return videoTitle.includes('morning') || videoDescription.includes('morning') ||
             videoTitle.includes('breakfast') || videoDescription.includes('breakfast');
    }
    // Afternoon (12-18)
    else if (eventHour >= 12 && eventHour < 18) {
      return videoTitle.includes('afternoon') || videoDescription.includes('afternoon') ||
             videoTitle.includes('lunch') || videoDescription.includes('lunch');
    }
    // Evening (18-24)
    else if (eventHour >= 18 && eventHour < 24) {
      return videoTitle.includes('evening') || videoDescription.includes('evening') ||
             videoTitle.includes('dinner') || videoDescription.includes('dinner');
    }
    // Night (0-6)
    else {
      return videoTitle.includes('night') || videoDescription.includes('night') ||
             videoTitle.includes('late') || videoDescription.includes('late');
    }
  }
  
  // Find relatable videos for an event
  static findRelatableVideos(event: any, allVideos: any[], maxVideos: number = 3): any[] {
    // Calculate similarity scores for all videos
    const scoredVideos = allVideos.map(video => ({
      ...video,
      similarityScore: this.calculateVideoSimilarity(event, video)
    }));
    
    // Sort by similarity score (highest first)
    scoredVideos.sort((a, b) => b.similarityScore - a.similarityScore);
    
    // Filter out videos with very low scores and return top matches
    const relevantVideos = scoredVideos
      .filter(video => video.similarityScore > 20) // Minimum relevance threshold
      .slice(0, maxVideos);
    
    // If we don't have enough relevant videos, add some fallback videos
    if (relevantVideos.length < maxVideos) {
      const fallbackVideos = this.getFallbackVideos(event, allVideos, maxVideos - relevantVideos.length);
      relevantVideos.push(...fallbackVideos);
    }
    
    return relevantVideos.map(video => ({
      ...video,
      isRecommended: true,
      recommendationReason: this.getRecommendationReason(event, video)
    }));
  }
  
  // Get fallback videos when not enough relevant ones are found
  static getFallbackVideos(event: any, allVideos: any[], count: number): any[] {
    const eventType = this.getEventType(event);
    
    // Get videos of the same type
    const sameTypeVideos = allVideos.filter(video => 
      this.getVideoType(video) === eventType
    );
    
    // If still not enough, get popular videos
    if (sameTypeVideos.length < count) {
      const popularVideos = allVideos
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, count - sameTypeVideos.length);
      return [...sameTypeVideos, ...popularVideos];
    }
    
    return sameTypeVideos.slice(0, count);
  }
  
  // Generate recommendation reason
  static getRecommendationReason(event: any, video: any): string {
    const eventType = this.getEventType(event);
    const videoType = this.getVideoType(video);
    
    if (eventType === videoType) {
      return `Similar ${eventType} experience`;
    }
    
    if (event.category && video.tags && video.tags.includes(event.category)) {
      return `Matches ${event.category} category`;
    }
    
    if (event.city && video.location && video.location.toLowerCase().includes(event.city.toLowerCase())) {
      return `From the same area`;
    }
    
    const keywordOverlap = this.extractKeywords(event.title).filter(keyword => 
      this.extractKeywords(video.title).includes(keyword)
    );
    
    if (keywordOverlap.length > 0) {
      return `Similar keywords: ${keywordOverlap.slice(0, 2).join(', ')}`;
    }
    
    return 'Popular related content';
  }
  
  // Generate contextual video titles for events
  static generateContextualVideoTitles(event: any, baseVideos: any[]): any[] {
    return baseVideos.map((video, index) => {
      const eventType = this.getEventType(event);
      const videoType = this.getVideoType(video);
      
      let contextualTitle = video.title;
      let contextualDescription = video.description;
      
      // Add context based on event type
      switch (eventType) {
        case 'food':
          contextualTitle = `${event.title} - Food Experience ${index + 1}`;
          contextualDescription = `Discover amazing food experiences like ${event.title}`;
          break;
        case 'outdoor':
          contextualTitle = `${event.title} - Outdoor Adventure ${index + 1}`;
          contextualDescription = `Explore outdoor activities similar to ${event.title}`;
          break;
        case 'nightlife':
          contextualTitle = `${event.title} - Nightlife Experience ${index + 1}`;
          contextualDescription = `Experience the nightlife scene like ${event.title}`;
          break;
        case 'culture':
          contextualTitle = `${event.title} - Cultural Experience ${index + 1}`;
          contextualDescription = `Immerse yourself in culture like ${event.title}`;
          break;
        case 'wellness':
          contextualTitle = `${event.title} - Wellness Experience ${index + 1}`;
          contextualDescription = `Find your zen with experiences like ${event.title}`;
          break;
        default:
          contextualTitle = `${event.title} - Related Experience ${index + 1}`;
          contextualDescription = `Discover experiences similar to ${event.title}`;
      }
      
      return {
        ...video,
        title: contextualTitle,
        description: contextualDescription,
        isContextual: true
      };
    });
  }

  /**
   * Fetch real places from Google Places API
   */
  static async fetchGooglePlaces(city: string, category: string, limit: number = 10): Promise<any[]> {
    if (!this.GOOGLE_PLACES_API_KEY) {
      console.warn('Google Places API key not configured, using mock data');
      return this.getMockGooglePlaces(city, category, limit);
    }

    try {
      // Get city coordinates first
      const cityCoords = await this.getCityCoordinates(city);
      if (!cityCoords) {
        throw new Error(`Could not find coordinates for city: ${city}`);
      }

      // Map categories to Google Places types
      const placeType = this.mapCategoryToGoogleType(category);
      
      // Fetch nearby places
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${cityCoords.lat},${cityCoords.lng}&radius=5000&type=${placeType}&key=${this.GOOGLE_PLACES_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      // Transform Google Places data to our format
      return data.results.slice(0, limit).map((place: any, index: number) => ({
        id: place.place_id,
        title: place.name,
        description: this.generateDescriptionFromGooglePlace(place, category),
        location: place.vicinity,
        city: city,
        category: category,
        tags: this.generateTagsFromGooglePlace(place, category),
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        startTime: '09:00', // Default, would be customized based on place type
        endTime: '17:00',   // Default, would be customized based on place type
        externalSource: 'google-places',
        price: this.getPriceLevel(place.price_level),
        type: place.price_level === 0 ? 'free' : 'paid',
        rating: place.rating,
        reviewCount: place.user_ratings_total,
        photos: place.photos ? place.photos.slice(0, 3).map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.GOOGLE_PLACES_API_KEY}`
        ) : [],
        icon: place.icon,
        openingHours: place.opening_hours?.weekday_text || [],
        website: place.website,
        phone: place.formatted_phone_number
      }));

    } catch (error) {
      console.error('Error fetching Google Places:', error);
      return this.getMockGooglePlaces(city, category, limit);
    }
  }

  /**
   * Get city coordinates using Google Geocoding API
   */
  private static async getCityCoordinates(city: string): Promise<{lat: number, lng: number} | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${this.GOOGLE_PLACES_API_KEY}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }

      return null;
    } catch (error) {
      console.error('Error getting city coordinates:', error);
      return null;
    }
  }

  /**
   * Map our categories to Google Places types
   */
  private static mapCategoryToGoogleType(category: string): string {
    const categoryMap: Record<string, string> = {
      'food': 'restaurant',
      'entertainment': 'amusement_park',
      'outdoor': 'park',
      'culture': 'museum',
      'shopping': 'shopping_mall',
      'nightlife': 'bar',
      'music': 'night_club',
      'arts': 'art_gallery',
      'sports': 'gym',
      'wellness': 'spa'
    };

    return categoryMap[category] || 'establishment';
  }

  /**
   * Generate description from Google Place data
   */
  private static generateDescriptionFromGooglePlace(place: any, category: string): string {
    const baseDescription = `${place.name} is a ${category} located in ${place.vicinity}`;
    
    if (place.rating) {
      return `${baseDescription}. It has a ${place.rating}/5 rating from ${place.user_ratings_total} reviews.`;
    }
    
    return baseDescription;
  }

  /**
   * Generate tags from Google Place data
   */
  private static generateTagsFromGooglePlace(place: any, category: string): string[] {
    const tags = [category, 'google-places'];
    
    if (place.types) {
      tags.push(...place.types.slice(0, 3));
    }
    
    if (place.rating && place.rating >= 4.0) {
      tags.push('highly-rated');
    }
    
    if (place.price_level === 0) {
      tags.push('free');
    } else if (place.price_level >= 3) {
      tags.push('luxury');
    }
    
    return tags;
  }

  /**
   * Get price level description
   */
  private static getPriceLevel(priceLevel?: number): string {
    if (!priceLevel) return '0';
    
    const priceMap: Record<number, string> = {
      0: '0',
      1: '15',
      2: '35',
      3: '75',
      4: '150'
    };
    
    return priceMap[priceLevel] || '0';
  }

  /**
   * Get mock Google Places data when API is not available
   */
  private static getMockGooglePlaces(city: string, category: string, limit: number): any[] {
    const mockPlaces = [
      {
        id: `mock-${city}-${category}-1`,
        title: `${city} ${category} Experience`,
        description: `Amazing ${category} experience in ${city}`,
        location: `${city} Downtown`,
        city: city,
        category: category,
        tags: [category, 'mock', city.toLowerCase()],
        latitude: 37.7749,
        longitude: -122.4194,
        startTime: '09:00',
        endTime: '17:00',
        externalSource: 'google-places',
        price: '25',
        type: 'paid' as const,
        rating: 4.2,
        reviewCount: 150,
        photos: [
          'https://images.unsplash.com/photo-1504674900240-9c69b0c9e763?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
          'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'
        ],
        icon: 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/generic_business-71.png',
        openingHours: ['Monday: 9:00 AM – 5:00 PM', 'Tuesday: 9:00 AM – 5:00 PM'],
        website: 'https://example.com',
        phone: '+1 (555) 123-4567'
      }
    ];

    // Generate more mock places
    for (let i = 2; i <= limit; i++) {
      mockPlaces.push({
        ...mockPlaces[0],
        id: `mock-${city}-${category}-${i}`,
        title: `${city} ${category} ${i}`,
        rating: 3.5 + Math.random() * 1.5,
        reviewCount: Math.floor(Math.random() * 200) + 50
      });
    }

    return mockPlaces;
  }

  // AI insight methods for enhanced recommendations
  static getBestTimeToVisit(category: string): string {
    const timeMap: Record<string, string> = {
      'food': 'Lunch (12-2 PM) or Dinner (6-8 PM)',
      'entertainment': 'Evening (7-10 PM)',
      'outdoor': 'Morning (9-11 AM) or Afternoon (3-5 PM)',
      'culture': 'Afternoon (1-4 PM)',
      'shopping': 'Morning (10 AM-12 PM) or Afternoon (2-5 PM)',
      'nightlife': 'Night (9 PM-1 AM)',
      'music': 'Evening (8-11 PM)',
      'arts': 'Afternoon (2-5 PM)',
      'sports': 'Morning (6-9 AM) or Evening (6-8 PM)',
      'wellness': 'Morning (7-9 AM) or Evening (6-8 PM)'
    };
    
    return timeMap[category] || 'Anytime during business hours';
  }

  static predictCrowdLevel(rating: number, reviewCount: number): string {
    if (rating >= 4.5 && reviewCount > 500) return 'Very Busy - Peak hours';
    if (rating >= 4.0 && reviewCount > 200) return 'Busy - Popular spot';
    if (rating >= 3.5 && reviewCount > 100) return 'Moderate - Good balance';
    if (rating >= 3.0) return 'Quiet - Off-peak hours';
    return 'Variable - Check reviews for timing';
  }

  static generateLocalTip(category: string, city: string): string {
    const tips: Record<string, string> = {
      'food': `Try visiting during off-peak hours (2-4 PM) for shorter waits`,
      'entertainment': `Book tickets in advance, especially on weekends`,
      'outdoor': `Early morning visits avoid crowds and offer better photo opportunities`,
      'culture': `Many places offer free admission on certain days - check their website`,
      'shopping': `Weekday mornings are typically less crowded than weekends`,
      'nightlife': `Arrive before 10 PM to avoid cover charges and long lines`,
      'music': `Check for happy hour specials and early bird discounts`,
      'arts': `First Friday events often have special programming and refreshments`,
      'sports': `Weekday sessions are usually less crowded than weekend classes`,
      'wellness': `Book appointments during off-peak hours for better availability`
    };
    
    return tips[category] || `Check local ${city} guides for insider tips`;
  }

  static getWeatherConsideration(category: string): string {
    const weatherMap: Record<string, string> = {
      'food': 'Indoor activity - weather independent',
      'entertainment': 'Mostly indoor - check for outdoor venues',
      'outdoor': 'Weather dependent - check forecast before visiting',
      'culture': 'Indoor activity - perfect for rainy days',
      'shopping': 'Indoor activity - weather independent',
      'nightlife': 'Indoor activity - weather independent',
      'music': 'Indoor activity - weather independent',
      'arts': 'Indoor activity - perfect for any weather',
      'sports': 'Check if indoor or outdoor facility',
      'wellness': 'Indoor activity - weather independent'
    };
    
    return weatherMap[category] || 'Check venue details for weather considerations';
  }
}
