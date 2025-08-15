import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { AIPlaceMatcher, VideoRecommendationEngine } from './aiService';

// Check if we're in local development mode
const isLocalDevelopment = process.env.NODE_ENV === "development" && !process.env.REPL_ID;

// Simple authentication middleware for local development
const isAuthenticated = (req: any, res: any, next: any) => {
  if (isLocalDevelopment) {
    // For local development, always allow access
    return next();
  }
  
  // For production, check session
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  return next();
};

export async function registerRoutes(app: Express): Promise<void> {
  console.log("Registering routes...");
  console.log("isLocalDevelopment:", isLocalDevelopment);

  // Simple health check route
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV
    });
  });

  // Test route
  app.get('/api/test', (req, res) => {
    res.json({ 
      message: "Server is working", 
      timestamp: new Date().toISOString()
    });
  });

  // Calendar endpoint for browsing events by date range
  app.get('/api/calendar', async (req, res) => {
    try {
      const { startDate, endDate, category } = req.query;
      
      // Get all experiences
      const allExperiences = [
        {
          id: '1',
          title: 'Local Coffee Tasting',
          description: 'Experience the best local coffee shops in the area',
          imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          location: 'Downtown',
          price: '25',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'paid',
          availability: 'available',
          isDropIn: false,
          tags: ['coffee', 'food', 'local'],
          hostId: 'host-1',
          hostName: 'Local Coffee Expert',
          category: 'food'
        },
        {
          id: 'tm-event-1',
          title: 'Concert in the Park',
          description: 'Amazing live music performance in the heart of the city',
          imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          location: 'Golden Gate Park',
          price: '45',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'paid',
          availability: 'available',
          isDropIn: false,
          tags: ['ticketmaster', 'music', 'concert'],
          externalId: 'tm-event-1',
          externalSource: 'ticketmaster',
          category: 'music',
          hostId: 'ticketmaster',
          hostName: 'Ticketmaster Events'
        },
        {
          id: 'tm-event-2',
          title: 'Comedy Night',
          description: 'Laugh your heart out with top comedians',
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          location: 'Comedy Club Downtown',
          price: '25',
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'paid',
          availability: 'available',
          isDropIn: false,
          tags: ['ticketmaster', 'comedy', 'entertainment'],
          externalId: 'tm-event-2',
          externalSource: 'ticketmaster',
          category: 'nightlife',
          hostId: 'ticketmaster',
          hostName: 'Ticketmaster Events'
        },
        {
          id: 'tm-event-3',
          title: 'Art Gallery Opening',
          description: 'Exclusive opening of the latest contemporary art exhibition',
          imageUrl: 'https://images.unsplash.com/photo-1541961017774-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          location: 'Modern Art Museum',
          price: '15',
          startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 74 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'paid',
          availability: 'available',
          isDropIn: false,
          tags: ['ticketmaster', 'art', 'culture'],
          externalId: 'tm-event-3',
          externalSource: 'ticketmaster',
          category: 'arts',
          hostId: 'ticketmaster',
          hostName: 'Ticketmaster Events'
        }
      ];

      let filteredExperiences = allExperiences;

      // Filter by date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        filteredExperiences = allExperiences.filter(exp => {
          const eventDate = new Date(exp.startTime);
          return eventDate >= start && eventDate <= end;
        });
      }

      // Filter by category if provided
      if (category) {
        filteredExperiences = filteredExperiences.filter(exp => 
          exp.category === category || exp.tags?.includes(category as string)
        );
      }

      // Group events by date
      const eventsByDate: { [key: string]: any[] } = {};
      
      filteredExperiences.forEach(exp => {
        const dateKey = new Date(exp.startTime).toISOString().split('T')[0];
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(exp);
      });

      res.json({
        events: filteredExperiences,
        eventsByDate,
        totalEvents: filteredExperiences.length,
        dateRange: startDate && endDate ? { startDate, endDate } : null
      });
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      res.status(500).json({ message: 'Failed to fetch calendar events' });
    }
  });

  // Create new experience endpoint
  app.post('/api/experiences', isAuthenticated, async (req: any, res) => {
    try {
      const {
        title,
        description,
        location,
        price,
        maxParticipants,
        startTime,
        endTime,
        category,
        type,
        tags,
        externalSource
      } = req.body;

      // Validate required fields
      if (!title || !description || !location || !startTime || !endTime) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Create new experience
      const newExperience = {
        id: `user-event-${Date.now()}`,
        title,
        description,
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
        location,
        price: price || '0',
        startTime,
        endTime,
        status: 'active',
        type: type || 'free',
        availability: 'available',
        isDropIn: false,
        tags: tags || [category, 'user-created'],
        externalSource: externalSource || 'user-created',
        category,
        hostId: 'user-created',
        hostName: 'LocalVibe User',
        maxParticipants: parseInt(maxParticipants) || 10,
        likeCount: 0,
        saveCount: 0,
        viewCount: 0,
        createdAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        message: 'Experience created successfully',
        experience: newExperience
      });
    } catch (error) {
      console.error('Error creating experience:', error);
      res.status(500).json({ message: 'Failed to create experience' });
    }
  });

  // Stripe payment processing endpoints
  app.post('/api/payments/create-payment-intent', isAuthenticated, async (req: any, res) => {
    try {
      const { experienceId, amount, numberOfPeople } = req.body;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(400).json({ message: "Stripe service not configured" });
      }

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          experienceId,
          numberOfPeople: numberOfPeople.toString(),
          userId: req.session.userId || 'dev-user-1'
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: 'Failed to create payment intent' });
    }
  });

  app.post('/api/payments/confirm-booking', isAuthenticated, async (req: any, res) => {
    try {
      const { experienceId, paymentIntentId, numberOfPeople, startTime, endTime } = req.body;
      
      // Mock booking confirmation
      const booking = {
        id: `booking-${Date.now()}`,
        experienceId,
        paymentIntentId,
        numberOfPeople,
        startTime,
        endTime,
        status: 'confirmed',
        userId: req.session.userId || 'dev-user-1',
        createdAt: new Date().toISOString()
      };

      res.json({
        success: true,
        message: 'Booking confirmed successfully!',
        booking
      });
    } catch (error) {
      console.error('Error confirming booking:', error);
      res.status(500).json({ message: 'Failed to confirm booking' });
    }
  });

  // Quick book endpoint
  app.post('/api/experiences/:id/quick-book', isAuthenticated, async (req: any, res) => {
    try {
      const { experienceId } = req.params;
      const { numberOfPeople = 1, startTime, endTime } = req.body;
      
      // Get experience details from the experiences array
      const allExperiences = [
        // Include all experiences here for lookup
        {
          id: '1',
          title: 'Local Coffee Tasting',
          price: '25'
        },
        {
          id: 'tm-event-1',
          title: 'Concert in the Park',
          price: '45'
        },
        {
          id: 'tm-event-2',
          title: 'Comedy Night',
          price: '25'
        },
        {
          id: 'tm-event-3',
          title: 'Art Gallery Opening',
          price: '15'
        },
        {
          id: 'place-1',
          title: 'Golden Gate Bridge',
          price: '0'
        },
        {
          id: 'place-2',
          title: 'Fisherman\'s Wharf',
          price: '0'
        },
        {
          id: 'ny-event-1',
          title: 'Broadway Show',
          price: '120'
        },
        {
          id: 'ny-event-2',
          title: 'Central Park Walk',
          price: '0'
        }
      ];
      
      const experience = allExperiences.find((exp: any) => exp.id === experienceId);
      if (!experience) {
        return res.status(404).json({ message: 'Experience not found' });
      }

      const totalAmount = parseFloat(experience.price) * numberOfPeople;
      
      if (totalAmount > 0) {
        // Create payment intent for paid events
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalAmount * 100),
          currency: 'usd',
          metadata: {
            experienceId,
            numberOfPeople: numberOfPeople.toString(),
            userId: req.session.userId || 'dev-user-1'
          },
        });

        res.json({
          requiresPayment: true,
          clientSecret: paymentIntent.client_secret,
          amount: totalAmount,
          experience
        });
      } else {
        // Free event - confirm booking directly
        const booking = {
          id: `booking-${Date.now()}`,
          experienceId,
          numberOfPeople,
          startTime: startTime || new Date().toISOString(),
          endTime: endTime || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          status: 'confirmed',
          userId: req.session.userId || 'dev-user-1',
          createdAt: new Date().toISOString()
        };

        res.json({
          requiresPayment: false,
          success: true,
          message: 'Free event booked successfully!',
          booking,
          experience
        });
      }
    } catch (error) {
      console.error('Error in quick book:', error);
      res.status(500).json({ message: 'Failed to process booking' });
    }
  });

  // AI-powered recommendations endpoint
  app.get('/api/recommendations', async (req, res) => {
    try {
      const { city, category, preferences } = req.query;
      
      // Get all experiences
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/experiences`);
      const experiences = await response.json();
      
      // Convert to Place format for AI processing
      const places = experiences.map((exp: any) => ({
        id: exp.id,
        title: exp.title,
        description: exp.description,
        location: exp.location,
        city: exp.city || 'San Francisco',
        category: exp.category,
        tags: exp.tags || [],
        latitude: exp.latitude,
        longitude: exp.longitude,
        startTime: exp.startTime,
        endTime: exp.endTime,
        externalSource: exp.externalSource || 'user-created',
        price: exp.price,
        type: exp.type
      }));

      // Filter by city if provided
      let filteredPlaces = places;
      if (city) {
        filteredPlaces = places.filter((place: any) => 
          place.city?.toLowerCase().includes((city as string).toLowerCase())
        );
      }

      // Generate AI recommendations
      const clusters = AIPlaceMatcher.clusterPlaces(filteredPlaces);
      const itineraries = AIPlaceMatcher.createItineraries(clusters);

      // Parse user preferences
      let userPreferences = {};
      if (preferences) {
        try {
          userPreferences = JSON.parse(preferences as string);
        } catch (e) {
          console.warn('Invalid preferences format');
        }
      }

      const personalizedRecommendations = AIPlaceMatcher.generatePersonalizedRecommendations(
        filteredPlaces,
        userPreferences
      );

      res.json({
        clusters,
        itineraries,
        personalizedRecommendations,
        totalPlaces: filteredPlaces.length,
        totalClusters: clusters.length
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({ message: 'Failed to generate recommendations' });
    }
  });

  // AI Itinerary Generation endpoint
  app.post('/api/ai/generate-itinerary', async (req: any, res) => {
    try {
      const preferences = req.body;
      const { city, experienceType, budget, groupSize, interests, timeOfDay } = preferences;
      
      // Get experiences for the city
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/experiences?city=${encodeURIComponent(city)}`);
      const experiences = await response.json();
      
      // AI Algorithm to filter and rank experiences
      const filteredExperiences = experiences.filter((exp: any) => {
        // Filter by experience type
        const matchesType = experienceType.length === 0 || 
          experienceType.some((type: string) => 
            exp.category.toLowerCase().includes(type.toLowerCase().split(' ')[0])
          );
        
        // Filter by budget
        const matchesBudget = !budget || parseFloat(exp.price) <= parseFloat(budget);
        
        // Filter by interests
        const matchesInterests = interests.length === 0 || 
          interests.some((interest: string) => 
            exp.tags?.some((tag: string) => tag.toLowerCase().includes(interest.toLowerCase())) ||
            exp.description.toLowerCase().includes(interest.toLowerCase())
          );
        
        return matchesType && matchesBudget && matchesInterests;
      });
      
      // AI Ranking algorithm
      const rankedExperiences = filteredExperiences.map((exp: any) => {
        let score = 0;
        
        // Interest matching score
        interests.forEach((interest: string) => {
          if (exp.tags?.some((tag: string) => tag.toLowerCase().includes(interest.toLowerCase()))) {
            score += 10;
          }
          if (exp.description.toLowerCase().includes(interest.toLowerCase())) {
            score += 5;
          }
        });
        
        // Budget optimization score
        if (budget) {
          const budgetRatio = parseFloat(exp.price) / parseFloat(budget);
          if (budgetRatio <= 0.5) score += 5;
          else if (budgetRatio <= 0.8) score += 3;
          else if (budgetRatio <= 1.0) score += 1;
        }
        
        // Time of day preference score
        if (timeOfDay.length > 0) {
          const eventHour = new Date(exp.startTime).getHours();
          timeOfDay.forEach((time: string) => {
            if (time === 'Morning' && eventHour >= 6 && eventHour < 12) score += 3;
            if (time === 'Afternoon' && eventHour >= 12 && eventHour < 17) score += 3;
            if (time === 'Evening' && eventHour >= 17 && eventHour < 21) score += 3;
            if (time === 'Night' && (eventHour >= 21 || eventHour < 6)) score += 3;
          });
        }
        
        // Popularity score (based on price as proxy)
        if (parseFloat(exp.price) > 0) score += 2;
        
        return { ...exp, aiScore: score };
      }).sort((a: any, b: any) => b.aiScore - a.aiScore);
      
      // Generate itinerary with AI insights
      const selectedExperiences = rankedExperiences.slice(0, 4).map((exp: any, index: number) => ({
        id: exp.id,
        title: exp.title,
        description: exp.description,
        location: exp.location,
        startTime: new Date(Date.now() + (index * 2 + 1) * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + (index * 2 + 2) * 60 * 60 * 1000).toISOString(),
        category: exp.category,
        price: exp.price,
        imageUrl: exp.imageUrl,
        reason: generateReason(exp, preferences)
      }));
      
      const totalCost = selectedExperiences.reduce((sum: number, item: any) => sum + parseFloat(item.price), 0);
      const totalDuration = selectedExperiences.length * 2;
      
      // Generate AI insights
      const aiInsights = generateAIInsights(city, preferences, selectedExperiences);
      const recommendations = generateRecommendations(preferences, selectedExperiences);
      
      const itinerary = {
        id: `itinerary-${Date.now()}`,
        city,
        title: `Perfect ${city} Experience`,
        description: `AI-curated based on your ${experienceType.join(', ')} preferences`,
        totalCost,
        totalDuration,
        items: selectedExperiences,
        aiInsights,
        recommendations,
        aiScore: rankedExperiences[0]?.aiScore || 0
      };
      
      res.json(itinerary);
    } catch (error) {
      console.error('Error generating AI itinerary:', error);
      res.status(500).json({ message: 'Failed to generate itinerary' });
    }
  });

  // Helper function to generate reasons for recommendations
  function generateReason(experience: any, preferences: any): string {
    const reasons = [];
    
    if (preferences.interests.length > 0) {
      const matchingInterest = preferences.interests.find((interest: string) => 
        experience.tags?.some((tag: string) => tag.toLowerCase().includes(interest.toLowerCase())) ||
        experience.description.toLowerCase().includes(interest.toLowerCase())
      );
      if (matchingInterest) {
        reasons.push(`Perfect for ${matchingInterest}`);
      }
    }
    
    if (preferences.budget) {
      const budgetRatio = parseFloat(experience.price) / parseFloat(preferences.budget);
      if (budgetRatio <= 0.5) {
        reasons.push('Great value for money');
      } else if (budgetRatio <= 0.8) {
        reasons.push('Fits your budget well');
      }
    }
    
    if (preferences.groupSize) {
      if (parseInt(preferences.groupSize) <= 2) {
        reasons.push('Ideal for couples');
      } else if (parseInt(preferences.groupSize) <= 4) {
        reasons.push('Perfect for small groups');
      } else {
        reasons.push('Great for larger groups');
      }
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Highly recommended experience';
  }

  // Helper function to generate AI insights
  function generateAIInsights(city: string, preferences: any, experiences: any[]): string[] {
    const insights = [];
    
    if (preferences.interests.length > 0) {
      insights.push(`${city} is perfect for ${preferences.interests.join(', ')}`);
    }
    
    if (preferences.timeOfDay.length > 0) {
      insights.push(`Best time to visit: ${preferences.timeOfDay.join(', ')}`);
    }
    
    if (preferences.groupSize) {
      insights.push(`Recommended group size: ${preferences.groupSize} people`);
    }
    
    const avgPrice = experiences.reduce((sum: number, exp: any) => sum + parseFloat(exp.price), 0) / experiences.length;
    insights.push(`Average experience cost: $${avgPrice.toFixed(0)}`);
    
    const categories = Array.from(new Set(experiences.map((exp: any) => exp.category)));
    insights.push(`Experience mix: ${categories.join(', ')}`);
    
    return insights;
  }

  // Helper function to generate recommendations
  function generateRecommendations(preferences: any, experiences: any[]): string[] {
    const recommendations = [
      'Book experiences in advance for better availability',
      'Consider local transportation options',
      'Check weather forecasts for outdoor activities',
      'Bring comfortable walking shoes'
    ];
    
    if (preferences.timeOfDay.includes('Evening') || preferences.timeOfDay.includes('Night')) {
      recommendations.push('Plan for dinner reservations in advance');
    }
    
    if (preferences.interests.some((interest: string) => 
      ['Photography', 'Art Galleries', 'Museums'].includes(interest)
    )) {
      recommendations.push('Check opening hours for cultural venues');
    }
    
    if (preferences.interests.some((interest: string) => 
      ['Hiking', 'Outdoor', 'Water Sports'].includes(interest)
    )) {
      recommendations.push('Pack appropriate gear for outdoor activities');
    }
    
    if (parseInt(preferences.groupSize) > 4) {
      recommendations.push('Consider booking group discounts');
    }
    
    return recommendations;
  }

  // Video upload and processing endpoint
  app.post('/api/videos/upload', isAuthenticated, async (req: any, res) => {
    try {
      const { videoUrl, experienceId, title, description, tags } = req.body;
      
      // Mock video processing
      const video = {
        id: `video-${Date.now()}`,
        url: videoUrl,
        experienceId,
        title: title || 'User Video',
        description: description || '',
        tags: tags || [],
        uploadedBy: req.session.userId || 'dev-user-1',
        uploadedAt: new Date().toISOString(),
        status: 'processed',
        duration: Math.floor(Math.random() * 60) + 15, // 15-75 seconds
        thumbnailUrl: `https://picsum.photos/400/225?random=${Date.now()}`
      };

      res.json({
        success: true,
        message: 'Video uploaded successfully',
        video
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      res.status(500).json({ message: 'Failed to upload video' });
    }
  });

  // Get videos for experiences
  app.get('/api/videos', async (req, res) => {
    try {
      const { experienceId } = req.query;
      
      // Mock videos data with multiple videos per experience
      const videos = [
        // Coffee Tasting Experience - Multiple videos
        {
          id: 'video-1-1',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          experienceId: '1',
          title: 'Coffee Tasting Experience - Shop 1',
          description: 'Amazing coffee tasting at Blue Bottle Coffee',
          tags: ['coffee', 'food', 'local'],
          uploadedBy: 'user-1',
          uploadedAt: new Date().toISOString(),
          duration: 45,
          thumbnailUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        {
          id: 'video-1-2',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          experienceId: '1',
          title: 'Coffee Tasting Experience - Shop 2',
          description: 'Artisan coffee at Ritual Coffee Roasters',
          tags: ['coffee', 'food', 'local'],
          uploadedBy: 'user-2',
          uploadedAt: new Date().toISOString(),
          duration: 52,
          thumbnailUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        {
          id: 'video-1-3',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          experienceId: '1',
          title: 'Coffee Tasting Experience - Shop 3',
          description: 'Hidden gem at Sightglass Coffee',
          tags: ['coffee', 'food', 'local'],
          uploadedBy: 'user-3',
          uploadedAt: new Date().toISOString(),
          duration: 38,
          thumbnailUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        
        // Concert in the Park - Multiple videos
        {
          id: 'video-2-1',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          experienceId: 'tm-event-1',
          title: 'Concert in the Park - Opening Act',
          description: 'Amazing opening performance by local band',
          tags: ['music', 'concert', 'outdoor'],
          uploadedBy: 'user-4',
          uploadedAt: new Date().toISOString(),
          duration: 60,
          thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        {
          id: 'video-2-2',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          experienceId: 'tm-event-1',
          title: 'Concert in the Park - Main Act',
          description: 'Incredible main performance highlights',
          tags: ['music', 'concert', 'outdoor'],
          uploadedBy: 'user-5',
          uploadedAt: new Date().toISOString(),
          duration: 75,
          thumbnailUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        {
          id: 'video-2-3',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
          experienceId: 'tm-event-1',
          title: 'Concert in the Park - Crowd Experience',
          description: 'The amazing atmosphere and crowd energy',
          tags: ['music', 'concert', 'outdoor'],
          uploadedBy: 'user-6',
          uploadedAt: new Date().toISOString(),
          duration: 42,
          thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        
        // Comedy Night - Multiple videos
        {
          id: 'video-3-1',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
          experienceId: 'tm-event-2',
          title: 'Comedy Night - First Comedian',
          description: 'Hilarious opening act by Sarah Johnson',
          tags: ['comedy', 'entertainment', 'nightlife'],
          uploadedBy: 'user-7',
          uploadedAt: new Date().toISOString(),
          duration: 30,
          thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        {
          id: 'video-3-2',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMob.mp4',
          experienceId: 'tm-event-2',
          title: 'Comedy Night - Headliner',
          description: 'Side-splitting performance by Mike Chen',
          tags: ['comedy', 'entertainment', 'nightlife'],
          uploadedBy: 'user-8',
          uploadedAt: new Date().toISOString(),
          duration: 55,
          thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        {
          id: 'video-3-3',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          experienceId: 'tm-event-2',
          title: 'Comedy Night - Crowd Reactions',
          description: 'The audience having the time of their lives',
          tags: ['comedy', 'entertainment', 'nightlife'],
          uploadedBy: 'user-9',
          uploadedAt: new Date().toISOString(),
          duration: 25,
          thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        
        // Art Gallery Opening - Multiple videos
        {
          id: 'video-4-1',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          experienceId: 'tm-event-3',
          title: 'Art Gallery Opening - Exhibition Tour',
          description: 'Walking through the stunning contemporary art',
          tags: ['art', 'culture', 'gallery'],
          uploadedBy: 'user-10',
          uploadedAt: new Date().toISOString(),
          duration: 48,
          thumbnailUrl: 'https://images.unsplash.com/photo-1541961017774-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        {
          id: 'video-4-2',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          experienceId: 'tm-event-3',
          title: 'Art Gallery Opening - Artist Interview',
          description: 'Meet the featured artist and learn about their work',
          tags: ['art', 'culture', 'gallery'],
          uploadedBy: 'user-11',
          uploadedAt: new Date().toISOString(),
          duration: 65,
          thumbnailUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        {
          id: 'video-4-3',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          experienceId: 'tm-event-3',
          title: 'Art Gallery Opening - Reception',
          description: 'The elegant opening reception and networking',
          tags: ['art', 'culture', 'gallery'],
          uploadedBy: 'user-12',
          uploadedAt: new Date().toISOString(),
          duration: 35,
          thumbnailUrl: 'https://images.unsplash.com/photo-1541961017774-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        
        // Additional diverse videos for better recommendations
        {
          id: 'video-5-1',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          experienceId: 'general',
          title: 'Outdoor Adventure - Hiking Trail',
          description: 'Beautiful hiking experience in nature',
          tags: ['outdoor', 'hiking', 'nature', 'adventure'],
          uploadedBy: 'user-13',
          uploadedAt: new Date().toISOString(),
          duration: 55,
          thumbnailUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        {
          id: 'video-5-2',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          experienceId: 'general',
          title: 'Wellness Retreat - Yoga Session',
          description: 'Peaceful yoga session in a serene environment',
          tags: ['wellness', 'yoga', 'meditation', 'health'],
          uploadedBy: 'user-14',
          uploadedAt: new Date().toISOString(),
          duration: 40,
          thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        {
          id: 'video-5-3',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          experienceId: 'general',
          title: 'Food Tour - Local Cuisine',
          description: 'Exploring local food culture and cuisine',
          tags: ['food', 'cuisine', 'local', 'dining'],
          uploadedBy: 'user-15',
          uploadedAt: new Date().toISOString(),
          duration: 50,
          thumbnailUrl: 'https://images.unsplash.com/photo-1504674900240-9c69b0c9e763?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        {
          id: 'video-5-4',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          experienceId: 'general',
          title: 'Nightlife - Live Music Venue',
          description: 'Vibrant nightlife with live music and dancing',
          tags: ['nightlife', 'music', 'live', 'dancing'],
          uploadedBy: 'user-16',
          uploadedAt: new Date().toISOString(),
          duration: 45,
          thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        },
        {
          id: 'video-5-5',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          experienceId: 'general',
          title: 'Cultural Experience - Museum Tour',
          description: 'Exploring fascinating exhibits and cultural artifacts',
          tags: ['culture', 'museum', 'history', 'education'],
          uploadedBy: 'user-17',
          uploadedAt: new Date().toISOString(),
          duration: 60,
          thumbnailUrl: 'https://images.unsplash.com/photo-1541961017774-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225'
        }
      ];

      let filteredVideos = videos;
      if (experienceId) {
        filteredVideos = videos.filter(video => video.experienceId === experienceId);
      }

      res.json(filteredVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ message: 'Failed to fetch videos' });
    }
  });

  // Enhanced experiences endpoint with videos
  app.get('/api/experiences/enhanced', async (req, res) => {
    try {
      const { city, category } = req.query;
      
      // Get experiences
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/experiences`);
      const experiences = await response.json();
      
      // Get videos
      const videosResponse = await fetch(`${req.protocol}://${req.get('host')}/api/videos`);
      const videos = await videosResponse.json();
      
      // Combine experiences with their videos and add recommended videos
      const enhancedExperiences = experiences.map((exp: any) => {
        const expVideos = videos.filter((video: any) => video.experienceId === exp.id);
        
        // If no videos exist for this experience, find relatable videos
        let finalVideos = expVideos;
        if (expVideos.length === 0) {
          const recommendedVideos = VideoRecommendationEngine.findRelatableVideos(exp, videos, 3);
          finalVideos = VideoRecommendationEngine.generateContextualVideoTitles(exp, recommendedVideos);
        } else if (expVideos.length < 3) {
          // If we have some videos but not enough, add recommended ones
          const additionalVideos = VideoRecommendationEngine.findRelatableVideos(exp, videos, 3 - expVideos.length);
          const contextualVideos = VideoRecommendationEngine.generateContextualVideoTitles(exp, additionalVideos);
          finalVideos = [...expVideos, ...contextualVideos];
        }
        
        return {
          ...exp,
          videos: finalVideos,
          videoCount: finalVideos.length,
          hasVideos: finalVideos.length > 0,
          hasRecommendedVideos: finalVideos.some((video: any) => video.isRecommended)
        };
      });

      // Filter by city if provided
      let filteredExperiences = enhancedExperiences;
      if (city) {
        filteredExperiences = enhancedExperiences.filter((exp: any) => 
          exp.city?.toLowerCase().includes((city as string).toLowerCase())
        );
      }

      res.json(filteredExperiences);
    } catch (error) {
      console.error('Error fetching enhanced experiences:', error);
      res.status(500).json({ message: 'Failed to fetch enhanced experiences' });
    }
  });

  // Categories endpoint
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = [
        {
          id: 'music',
          name: 'Music & Concerts',
          icon: '🎵',
          description: 'Live music, concerts, and performances',
          color: '#FF6B6B'
        },
        {
          id: 'food',
          name: 'Food & Dining',
          icon: '🍽️',
          description: 'Restaurants, food tours, and culinary experiences',
          color: '#4ECDC4'
        },
        {
          id: 'outdoor',
          name: 'Outdoor & Adventure',
          icon: '🏔️',
          description: 'Hiking, sports, and outdoor activities',
          color: '#45B7D1'
        },
        {
          id: 'arts',
          name: 'Arts & Culture',
          icon: '🎨',
          description: 'Museums, galleries, and cultural events',
          color: '#96CEB4'
        },
        {
          id: 'nightlife',
          name: 'Nightlife',
          icon: '🌙',
          description: 'Bars, clubs, and evening entertainment',
          color: '#FFEAA7'
        },
        {
          id: 'wellness',
          name: 'Wellness & Fitness',
          icon: '🧘',
          description: 'Yoga, fitness classes, and wellness activities',
          color: '#DDA0DD'
        },
        {
          id: 'shopping',
          name: 'Shopping & Markets',
          icon: '🛍️',
          description: 'Local markets, boutiques, and shopping experiences',
          color: '#FFB347'
        },
        {
          id: 'education',
          name: 'Learning & Workshops',
          icon: '📚',
          description: 'Classes, workshops, and educational experiences',
          color: '#87CEEB'
        },
        {
          id: 'family',
          name: 'Family & Kids',
          icon: '👨‍👩‍👧‍👦',
          description: 'Family-friendly activities and events',
          color: '#98D8C8'
        },
        {
          id: 'tech',
          name: 'Tech & Innovation',
          icon: '💻',
          description: 'Tech meetups, hackathons, and innovation events',
          color: '#F7DC6F'
        }
      ];
      
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  // Services status endpoint
  app.get('/api/services/status', async (req, res) => {
    res.json({
      eventbrite: false,
      ticketmaster: !!process.env.TICKETMASTER_KEY,
      stripe: false,
      mapbox: false,
      googlePlaces: !!process.env.GOOGLE_PLACES_KEY,
      mux: !!process.env.MUX_TOKEN_SECRET && !!process.env.MUX_TOKEN_ID,
    });
  });

  // Google Places sync endpoint
  app.get('/api/sync/places', async (req, res) => {
    try {
      if (!process.env.GOOGLE_PLACES_KEY) {
        return res.status(400).json({ message: "Google Places service not configured" });
      }

      const { location = "San Francisco", radius = 5000, limit = 10 } = req.query;
      
      // Mock Google Places response for now
      const mockPlaces = [
        {
          id: 'place-1',
          title: 'Golden Gate Bridge',
          description: 'Iconic suspension bridge spanning the Golden Gate strait',
          imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          location: 'Golden Gate Bridge, San Francisco',
          price: '0',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'free',
          availability: 'available',
          isDropIn: true,
          tags: ['google-places', 'landmark', 'tourist'],
          externalId: 'place-1',
          externalSource: 'google-places',
          category: 'outdoor',
          hostId: 'google-places',
          hostName: 'Google Places'
        },
        {
          id: 'place-2',
          title: 'Fisherman\'s Wharf',
          description: 'Historic waterfront area with seafood restaurants and attractions',
          imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          location: 'Fisherman\'s Wharf, San Francisco',
          price: '0',
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'free',
          availability: 'available',
          isDropIn: true,
          tags: ['google-places', 'waterfront', 'food'],
          externalId: 'place-2',
          externalSource: 'google-places',
          category: 'food',
          hostId: 'google-places',
          hostName: 'Google Places'
        },
        {
          id: 'place-3',
          title: 'Alcatraz Island',
          description: 'Historic federal prison on an island in San Francisco Bay',
          imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          location: 'Alcatraz Island, San Francisco Bay',
          price: '45',
          startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 74 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'paid',
          availability: 'available',
          isDropIn: false,
          tags: ['google-places', 'historic', 'museum'],
          externalId: 'place-3',
          externalSource: 'google-places',
          category: 'arts',
          hostId: 'google-places',
          hostName: 'Google Places'
        }
      ];

      res.json({ 
        count: mockPlaces.length, 
        source: 'google-places',
        experiences: mockPlaces.slice(0, parseInt(limit as string)) 
      });
    } catch (error) {
      console.error("Error syncing Google Places:", error);
      res.status(500).json({ message: "Failed to sync Google Places data" });
    }
  });

  // Ticketmaster sync endpoint
  app.get('/api/sync/ticketmaster', async (req, res) => {
    try {
      if (!process.env.TICKETMASTER_KEY) {
        return res.status(400).json({ message: "Ticketmaster service not configured" });
      }

      const { location = "San Francisco", limit = 10 } = req.query;
      
      // Mock Ticketmaster response for now
      const mockEvents = [
        {
          id: 'tm-event-1',
          title: 'Concert in the Park',
          description: 'Amazing live music performance in the heart of the city',
          imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          location: location as string,
          price: '45',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'paid',
          availability: 'available',
          isDropIn: false,
          tags: ['ticketmaster', 'music', 'concert'],
          externalId: 'tm-event-1',
          externalSource: 'ticketmaster'
        },
        {
          id: 'tm-event-2',
          title: 'Comedy Night',
          description: 'Laugh your heart out with top comedians',
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          location: location as string,
          price: '25',
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'paid',
          availability: 'available',
          isDropIn: false,
          tags: ['ticketmaster', 'comedy', 'entertainment'],
          externalId: 'tm-event-2',
          externalSource: 'ticketmaster'
        }
      ];

      res.json({ 
        count: mockEvents.length, 
        source: 'ticketmaster',
        experiences: mockEvents.slice(0, parseInt(limit as string)) 
      });
    } catch (error) {
      console.error("Error syncing Ticketmaster events:", error);
      res.status(500).json({ message: "Failed to sync Ticketmaster events" });
    }
  });

  // Video like endpoint
  app.post('/api/videos/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const videoId = req.params.id;
      const isLiked = Math.random() > 0.5; // Random for demo
      
      res.json({
        isLiked,
        message: isLiked ? 'Video liked!' : 'Like removed'
      });
    } catch (error) {
      console.error('Error liking video:', error);
      res.status(500).json({ message: 'Failed to like video' });
    }
  });

  // Video save endpoint
  app.post('/api/videos/:id/save', isAuthenticated, async (req: any, res) => {
    try {
      const videoId = req.params.id;
      const isSaved = Math.random() > 0.5; // Random for demo
      
      res.json({
        isSaved,
        message: isSaved ? 'Video saved!' : 'Video unsaved'
      });
    } catch (error) {
      console.error('Error saving video:', error);
      res.status(500).json({ message: 'Failed to save video' });
    }
  });

  // Experiences endpoint
  app.get('/api/experiences', async (req, res) => {
    try {
      const { date, category, location, city } = req.query;
      
      // Base experiences with videos
      let experiences = [
        {
          id: '1',
          title: 'Local Coffee Tasting',
          description: 'Experience the best local coffee shops in the area',
          imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          location: 'Downtown San Francisco',
          city: 'San Francisco',
          price: '25',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'paid',
          availability: 'available',
          isDropIn: false,
          tags: ['coffee', 'food', 'local'],
          hostId: 'host-1',
          hostName: 'Local Coffee Expert',
          category: 'food',
          latitude: 37.7749,
          longitude: -122.4194
        }
      ];

      // Add Ticketmaster events with videos
      const ticketmasterEvents = [
        {
          id: 'tm-event-1',
          title: 'Concert in the Park',
          description: 'Amazing live music performance in the heart of the city',
          imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          location: 'Golden Gate Park, San Francisco',
          city: 'San Francisco',
          price: '45',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'paid',
          availability: 'available',
          isDropIn: false,
          tags: ['ticketmaster', 'music', 'concert'],
          externalId: 'tm-event-1',
          externalSource: 'ticketmaster',
          category: 'music',
          hostId: 'ticketmaster',
          hostName: 'Ticketmaster Events',
          latitude: 37.7694,
          longitude: -122.4862
        },
        {
          id: 'tm-event-2',
          title: 'Comedy Night',
          description: 'Laugh your heart out with top comedians',
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          location: 'Comedy Club Downtown, San Francisco',
          city: 'San Francisco',
          price: '25',
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'paid',
          availability: 'available',
          isDropIn: false,
          tags: ['ticketmaster', 'comedy', 'entertainment'],
          externalId: 'tm-event-2',
          externalSource: 'ticketmaster',
          category: 'nightlife',
          hostId: 'ticketmaster',
          hostName: 'Ticketmaster Events',
          latitude: 37.7749,
          longitude: -122.4194
        },
        {
          id: 'tm-event-3',
          title: 'Art Gallery Opening',
          description: 'Exclusive opening of the latest contemporary art exhibition',
          imageUrl: 'https://images.unsplash.com/photo-1541961017774-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          location: 'Modern Art Museum, San Francisco',
          city: 'San Francisco',
          price: '15',
          startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 74 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'paid',
          availability: 'available',
          isDropIn: false,
          tags: ['ticketmaster', 'art', 'culture'],
          externalId: 'tm-event-3',
          externalSource: 'ticketmaster',
          category: 'arts',
          hostId: 'ticketmaster',
          hostName: 'Ticketmaster Events',
          latitude: 37.7849,
          longitude: -122.4094
        }
      ];

      // Add Google Places events with videos
      const googlePlacesEvents = [
        {
          id: 'place-1',
          title: 'Golden Gate Bridge',
          description: 'Iconic suspension bridge spanning the Golden Gate strait',
          imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          location: 'Golden Gate Bridge, San Francisco',
          city: 'San Francisco',
          price: '0',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'free',
          availability: 'available',
          isDropIn: true,
          tags: ['google-places', 'landmark', 'tourist'],
          externalId: 'place-1',
          externalSource: 'google-places',
          category: 'outdoor',
          hostId: 'google-places',
          hostName: 'Google Places',
          latitude: 37.8199,
          longitude: -122.4783
        },
        {
          id: 'place-2',
          title: 'Fisherman\'s Wharf',
          description: 'Historic waterfront area with seafood restaurants and attractions',
          imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
          location: 'Fisherman\'s Wharf, San Francisco',
          city: 'San Francisco',
          price: '0',
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'free',
          availability: 'available',
          isDropIn: true,
          tags: ['google-places', 'waterfront', 'food'],
          externalId: 'place-2',
          externalSource: 'google-places',
          category: 'food',
          hostId: 'google-places',
          hostName: 'Google Places',
          latitude: 37.8080,
          longitude: -122.4177
        }
      ];

      // Add New York events for city filtering demo
      const newYorkEvents = [
        {
          id: 'ny-event-1',
          title: 'Broadway Show',
          description: 'Experience the magic of Broadway in the heart of NYC',
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
          location: 'Times Square, New York',
          city: 'New York',
          price: '120',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'paid',
          availability: 'available',
          isDropIn: false,
          tags: ['broadway', 'theater', 'entertainment'],
          externalId: 'ny-event-1',
          externalSource: 'user-created',
          category: 'arts',
          hostId: 'broadway',
          hostName: 'Broadway Shows',
          latitude: 40.7580,
          longitude: -73.9855
        },
        {
          id: 'ny-event-2',
          title: 'Central Park Walk',
          description: 'Beautiful walking tour through Central Park',
          imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMob.mp4',
          location: 'Central Park, New York',
          city: 'New York',
          price: '0',
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          type: 'free',
          availability: 'available',
          isDropIn: true,
          tags: ['park', 'outdoor', 'walking'],
          externalId: 'ny-event-2',
          externalSource: 'user-created',
          category: 'outdoor',
          hostId: 'central-park',
          hostName: 'Central Park Tours',
          latitude: 40.7829,
          longitude: -73.9654
        }
      ];

      experiences = [...experiences, ...ticketmasterEvents, ...googlePlacesEvents, ...newYorkEvents];

      // Filter by city if provided
      if (city) {
        experiences = experiences.filter(exp => 
          exp.city?.toLowerCase().includes((city as string).toLowerCase())
        );
      }

      // Filter by location if provided
      if (location) {
        experiences = experiences.filter(exp => 
          exp.location.toLowerCase().includes((location as string).toLowerCase())
        );
      }

      // Filter by date if provided
      if (date) {
        const selectedDate = new Date(date as string);
        const nextDay = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);
        
        experiences = experiences.filter(exp => {
          const eventDate = new Date(exp.startTime);
          return eventDate >= selectedDate && eventDate < nextDay;
        });
      }

      // Filter by category if provided
      if (category) {
        experiences = experiences.filter(exp => 
          exp.category === category || exp.tags?.includes(category as string)
        );
      }

      res.json(experiences);
    } catch (error) {
      console.error('Error fetching experiences:', error);
      res.status(500).json({ message: 'Failed to fetch experiences' });
    }
  });

  // Bookings endpoint
  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const { experienceId, startTime, endTime, numberOfPeople } = req.body;
      
      res.json({
        success: true,
        message: 'Booking created successfully',
        bookingId: 'booking-' + Date.now(),
        experienceId,
        startTime,
        endTime,
        numberOfPeople,
        status: 'confirmed'
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ message: 'Failed to create booking' });
    }
  });

  // Reviews endpoint
  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const { experienceId, rating, comment } = req.body;
      
      res.json({
        success: true,
        message: 'Review submitted successfully',
        reviewId: 'review-' + Date.now(),
        experienceId,
        rating,
        comment,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      res.status(500).json({ message: 'Failed to submit review' });
    }
  });

  console.log("Routes registered successfully!");
}
