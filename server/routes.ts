import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertExperienceSchema, insertBookingSchema, insertReviewSchema } from "@shared/schema";
import passport from "passport";
import { EventbriteService } from "./services/eventbriteService";
import { TicketmasterService } from "./services/ticketmasterService";
import { StripeService } from "./services/stripeService";
import { MapService } from "./services/mapService";
import { MuxService } from "./services/muxService";
import { z } from "zod";
import Stripe from "stripe";
import bcrypt from "bcryptjs";

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Check if we're in local development mode
const isLocalDevelopment = process.env.NODE_ENV === "development" && !process.env.REPL_ID;



if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize external services
  const eventbriteService = new EventbriteService();
  const ticketmasterService = new TicketmasterService();
  const stripeService = new StripeService();
  const mapService = new MapService();
  const muxService = new MuxService();

  // Auth middleware - must be set up first
  await setupAuth(app);

  // Production authentication routes (only if not in local development)
  console.log("isLocalDevelopment:", isLocalDevelopment);
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("REPL_ID:", process.env.REPL_ID);
  
  // New authentication routes for Google and Apple
  if (!isLocalDevelopment) {
    // Google OAuth routes
    app.get("/api/auth/google", passport.authenticate("google"));
    
    app.get("/api/auth/google/callback", 
      passport.authenticate("google", { 
        failureRedirect: "/login",
        successRedirect: "/"
      })
    );

    // Apple OAuth routes
    app.get("/api/auth/apple", passport.authenticate("apple"));
    
    app.get("/api/auth/apple/callback", 
      passport.authenticate("apple", { 
        failureRedirect: "/login",
        successRedirect: "/"
      })
    );

    // Logout route
    app.get("/api/auth/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });
  }

  // Local development authentication routes (must be AFTER production routes to override them)
  if (process.env.NODE_ENV === "development" && !process.env.REPL_ID) {
    // Add fallback OAuth routes for local development
    app.get('/api/auth/google', (req, res) => {
      res.json({ 
        message: "Google OAuth not configured for local development. Please use email/password login.",
        redirectUrl: null 
      });
    });

    app.get('/api/auth/apple', (req, res) => {
      res.json({ 
        message: "Apple OAuth not configured for local development. Please use email/password login.",
        redirectUrl: null 
      });
    });

    // Override the Replit login route for local development
    app.get('/api/login', async (req: any, res) => {
      try {
        // For local development, automatically log in a user
        const user = {
          id: 'local-user-1',
          email: 'local@example.com',
          firstName: 'Local',
          lastName: 'User',
          profileImageUrl: null
        };
        
        // Upsert the user to the database first
        await storage.upsertUser(user);
        
        // Set session directly without passport
        req.session.userId = user.id;
        req.session.user = user;
        
        res.json({ success: true, user });
      } catch (error) {
        res.status(500).json({ message: "Error saving user" });
      }
    });

    app.post('/api/login', async (req: any, res) => {
      try {
        const { email, password } = req.body;
        
        // Check if this is admin login
        if (email === 'admin@vibe.com' && password === 'admin123') {
          const adminUser = {
            id: 'admin-user-1',
            email: 'admin@vibe.com',
            firstName: 'Admin',
            lastName: 'User',
            profileImageUrl: null,
            isAdmin: true
          };
          
          // Upsert the admin user to the database
          await storage.upsertUser(adminUser);
          
          // Set session
          req.session.userId = adminUser.id;
          req.session.user = adminUser;
          
          return res.json({ success: true, user: adminUser });
        }
        
        // For regular users, check if they exist and validate password
        const existingUser = await storage.getUserByEmail(email);
        if (!existingUser) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
        
        // Check if user has a password (for users created via signup)
        if (existingUser.password) {
          const isValidPassword = await bcrypt.compare(password, existingUser.password);
          if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid email or password" });
          }
        } else {
          // For legacy users without passwords, allow any password in development
          if (process.env.NODE_ENV !== 'development') {
            return res.status(401).json({ message: "Invalid email or password" });
          }
        }
        
        // Set session
        req.session.userId = existingUser.id;
        req.session.user = existingUser;
        
        res.json({ success: true, user: existingUser });
      } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Error during login" });
      }
    });

    app.post('/api/signup', async (req: any, res) => {
      try {
        const { email, password, firstName, lastName, isAdmin } = req.body;
        
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "User with this email already exists" });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = {
          id: `user-${Date.now()}`,
          email,
          firstName,
          lastName,
          profileImageUrl: null,
          password: hashedPassword,
          isAdmin: isAdmin || false
        };
        
        // Save user to database
        await storage.upsertUser(newUser);
        
        // Set session
        req.session.userId = newUser.id;
        req.session.user = newUser;
        
        // Don't send password in response
        const { password: _, ...userWithoutPassword } = newUser;
        
        res.json({ success: true, user: userWithoutPassword });
      } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Error creating user" });
      }
    });

    app.get('/api/logout', (req: any, res) => {
      req.session.destroy((err: any) => {
        if (err) {
          return res.status(500).json({ message: "Error logging out" });
        }
        res.json({ success: true });
      });
    });
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      if (isLocalDevelopment) {
        // For local development, check session directly
        if (!req.session.userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const user = await storage.getUser(req.session.userId);
        if (!user) {
          // Create the user if it doesn't exist
          const localUser = {
            id: 'local-user-1',
            email: 'local@example.com',
            firstName: 'Local',
            lastName: 'User',
            profileImageUrl: null
          };
          await storage.upsertUser(localUser);
          return res.json(localUser);
        }
        return res.json(user);
      } else {
        const userId = req.user.claims.sub || req.user.id;
        const user = await storage.getUser(userId);
        res.json(user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Experiences with city-based filtering (Ticketmaster only)
  app.get('/api/experiences', async (req, res) => {
    try {
      const {
        limit = "20",
        offset = "0",
        categoryId,
        location,
        availability,
        search,
        city,
        coordinates,
        date
      } = req.query;

      // Get ALL experiences without filtering in storage layer  
      const allExperiences = await storage.getAllExperiences();
      
      // Filter for Ticketmaster events only
      let ticketmasterEvents = allExperiences.filter(exp => exp.externalSource === 'ticketmaster');
      
      // Filter by city if provided
      if (city && typeof city === 'string') {
        ticketmasterEvents = ticketmasterEvents.filter(exp => {
          if (!exp.location) return false;
          return exp.location.toLowerCase().includes(city.toLowerCase());
        });
      }
      
      // Filter by coordinates if provided (radius-based filtering)
      if (coordinates && typeof coordinates === 'string') {
        const [lat, lng] = coordinates.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          ticketmasterEvents = ticketmasterEvents.filter(exp => {
            if (!exp.latitude || !exp.longitude) return false;
            const distance = calculateDistance(lat, lng, exp.latitude, exp.longitude);
            return distance <= 50; // 50km radius
          });
        }
      }
      
      // Filter by date if provided (YYYY-MM-DD format)
      if (date && typeof date === 'string') {
        const selectedDate = new Date(date);
        const nextDay = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);
        
        ticketmasterEvents = ticketmasterEvents.filter(exp => {
          if (!exp.startTime) return false;
          const eventDate = new Date(exp.startTime);
          return eventDate >= selectedDate && eventDate < nextDay;
        });
      }

      // Apply limit and offset
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      const paginatedEvents = ticketmasterEvents.slice(offsetNum, offsetNum + limitNum);

      res.json(paginatedEvents);
    } catch (error) {
      console.error("Error fetching experiences:", error);
      res.status(500).json({ message: "Failed to fetch experiences" });
    }
  });

  app.get('/api/experiences/:id', async (req, res) => {
    try {
      const experience = await storage.getExperience(req.params.id);
      if (!experience) {
        return res.status(404).json({ message: "Experience not found" });
      }
      res.json(experience);
    } catch (error) {
      console.error("Error fetching experience:", error);
      res.status(500).json({ message: "Failed to fetch experience" });
    }
  });

  app.post('/api/experiences/:id/view', async (req, res) => {
    try {
      await storage.incrementExperienceViews(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error incrementing views:", error);
      res.status(500).json({ message: "Failed to increment views" });
    }
  });

  // User interactions (protected)
  app.post('/api/experiences/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = isLocalDevelopment ? req.session.userId : req.user.claims.sub;
      const result = await storage.toggleLike(userId, req.params.id);
      res.json(result);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.post('/api/experiences/:id/save', isAuthenticated, async (req: any, res) => {
    try {
      const userId = isLocalDevelopment ? req.session.userId : req.user.claims.sub;
      const result = await storage.toggleSave(userId, req.params.id);
      res.json(result);
    } catch (error) {
      console.error("Error toggling save:", error);
      res.status(500).json({ message: "Failed to toggle save" });
    }
  });

  app.get('/api/user/interactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = isLocalDevelopment ? req.session.userId : req.user.claims.sub;
      const [likes, saves] = await Promise.all([
        storage.getUserLikes(userId),
        storage.getUserSaves(userId),
      ]);
      res.json({ likes, saves });
    } catch (error) {
      console.error("Error fetching user interactions:", error);
      res.status(500).json({ message: "Failed to fetch user interactions" });
    }
  });

  // Bookings (protected)
  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = isLocalDevelopment ? req.session.userId : req.user.claims.sub;
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId,
      });
      
      const booking = await storage.createBooking(bookingData);
      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = isLocalDevelopment ? req.session.userId : req.user.claims.sub;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.patch('/api/bookings/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const booking = await storage.updateBookingStatus(req.params.id, status);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Reviews (protected)
  app.post('/api/experiences/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = isLocalDevelopment ? req.session.userId : req.user.claims.sub;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId,
        experienceId: req.params.id,
      });
      
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get('/api/experiences/:id/reviews', async (req, res) => {
    try {
      const reviews = await storage.getExperienceReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Fortune Cookie routes
  app.get("/api/fortune-cookie/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = isLocalDevelopment ? req.session.userId : req.user.claims.sub;
      const status = await storage.checkDailyFortuneCookie(userId);
      res.json(status);
    } catch (error) {
      console.error("Error checking fortune cookie status:", error);
      res.status(500).json({ message: "Failed to check fortune cookie status" });
    }
  });

  app.post("/api/fortune-cookie/claim", isAuthenticated, async (req: any, res) => {
    try {
      const userId = isLocalDevelopment ? req.session.userId : req.user.claims.sub;
      
      // Check if user can claim today
      const { canClaim } = await storage.checkDailyFortuneCookie(userId);
      if (!canClaim) {
        return res.status(400).json({ message: "Fortune cookie already claimed today" });
      }

      const result = await storage.claimFortuneCookie(userId);
      res.json(result);
    } catch (error) {
      console.error("Error claiming fortune cookie:", error);
      res.status(500).json({ message: "Failed to claim fortune cookie" });
    }
  });

  app.get("/api/fortune-cookies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = isLocalDevelopment ? req.session.userId : req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const cookies = await storage.getUserFortuneCookies(userId, limit);
      res.json(cookies);
    } catch (error) {
      console.error("Error fetching fortune cookies:", error);
      res.status(500).json({ message: "Failed to fetch fortune cookies" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { experienceId, numberOfPeople, amount } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Amount already in cents
        currency: "usd",
        metadata: {
          experienceId,
          numberOfPeople: numberOfPeople.toString(),
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // External data sync endpoints - Public for TikTok feed
  
  // Ticketmaster event sync
  app.get('/api/sync/ticketmaster', async (req, res) => {
    try {
      if (!ticketmasterService.isConfigured()) {
        return res.status(400).json({ message: "Ticketmaster service not configured" });
      }

      const { location = "San Francisco", category, limit = 10, radius = 25 } = req.query;
      console.log('Fetching Ticketmaster events for:', location);

      const events = await ticketmasterService.getEventsByCity(location as string, {
        radius: parseInt(radius as string),
        limit: parseInt(limit as string),
        category: category as string,
      });

      // Transform and save events to database
      const experiences = [];
      console.log('Processing Ticketmaster events:', events.length);
      
      for (const event of events) {
        try {
          // Check if this event already exists in our database
          const existingExperience = await storage.getExperienceByExternalId(event.externalId);
          if (existingExperience) {
            experiences.push(existingExperience);
            continue;
          }

          // Save new experience to database with proper date conversion
          const processedEvent = {
            ...event,
            startTime: event.startTime ? new Date(event.startTime) : null,
            endTime: event.endTime ? new Date(event.endTime) : null,
          };
          const experience = await storage.createExperience(processedEvent);
          experiences.push(experience);
          console.log('Saved Ticketmaster experience:', experience.title);
        } catch (error) {
          console.error('Error processing Ticketmaster event:', error);
          console.error('Event data:', JSON.stringify(event, null, 2));
        }
      }

      res.json({
        count: experiences.length,
        source: 'ticketmaster',
        experiences: experiences.slice(0, parseInt(limit as string))
      });
    } catch (error) {
      console.error("Error syncing Ticketmaster events:", error);
      res.status(500).json({ message: "Failed to sync Ticketmaster events" });
    }
  });
  app.get('/api/sync/eventbrite', async (req, res) => {
    try {
      if (!eventbriteService.isConfigured()) {
        return res.status(400).json({ message: "Eventbrite service not configured" });
      }

      const { location = "San Francisco, CA", category, limit = 10 } = req.query;
      const events = await eventbriteService.searchEvents({
        location: location as string,
        category: category as string,
        limit: parseInt(limit as string),
        sort: 'date',
        startDateRange: new Date().toISOString(), // Only future events
        endDateRange: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Next 30 days
      });

      // Transform Eventbrite events to our experience format and save to database
      const experiences = [];
      console.log('Processing Eventbrite events:', events.events?.length || 0);
      console.log('Raw events data:', JSON.stringify(events, null, 2));
      
      if (events.events && events.events.length > 0) {
        for (const event of events.events) {
          try {
            // Check if this event already exists in our database
            const existingExperience = await storage.getExperienceByExternalId(event.id);
            if (existingExperience) {
              experiences.push(existingExperience);
              continue;
            }

            const experienceData = {
              title: event.name?.text || 'Untitled Event',
              description: event.description?.text || 'Amazing local event happening now!',
              imageUrl: event.logo?.url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
              videoUrl: null, // Eventbrite doesn't provide videos directly
              location: event.venue?.address?.localized_address_display || location,
              latitude: event.venue?.latitude || null,
              longitude: event.venue?.longitude || null,
              price: parseFloat(event.ticket_availability?.minimum_ticket_price?.major_value || '0'),
              duration: 120, // Default 2 hours
              categoryId: null, // Let database set default or use null
              hostId: null, // Let database set default or use null
              startTime: new Date(event.start?.utc),
              endTime: new Date(event.end?.utc),
              maxParticipants: event.capacity || 100,
              availableSpots: event.capacity || 100,
              status: 'active' as const,
              type: event.is_free ? 'free' as const : 'paid' as const,
              availability: 'available' as const,
              isDropIn: false,
              tags: ['eventbrite', 'live-event', event.category?.name?.toLowerCase() || 'general'],
              rating: 4.5,
              reviewCount: 0,
              likeCount: Math.floor(Math.random() * 50),
              saveCount: Math.floor(Math.random() * 20),
              viewCount: Math.floor(Math.random() * 200),
              externalId: event.id,
              externalSource: 'eventbrite'
            };
            
            // Save to database
            const savedExperience = await storage.createExperience(experienceData);
            experiences.push(savedExperience);
            console.log('Saved Eventbrite experience:', savedExperience.title);
          } catch (error) {
            console.error('Error saving Eventbrite experience:', error);
          }
        }
      }

      // Try to fetch from Ticketmaster as a fallback if Eventbrite fails
      if (experiences.length === 0 && ticketmasterService.isConfigured()) {
        console.log('No Eventbrite events found, trying Ticketmaster...');
        try {
          const ticketmasterEvents = await ticketmasterService.getEventsByCity(location as string, {
            radius: 25,
            limit: parseInt(limit as string),
            category: category as string,
          });

          for (const event of ticketmasterEvents) {
            try {
              const existingExperience = await storage.getExperienceByExternalId(event.externalId);
              if (existingExperience) {
                experiences.push(existingExperience);
                continue;
              }
              const experience = await storage.createExperience(event);
              experiences.push(experience);
            } catch (error) {
              console.error('Error processing fallback Ticketmaster event:', error);
            }
          }
        } catch (error) {
          console.error('Ticketmaster fallback failed:', error);
        }
      }

      res.json({ 
        count: experiences.length, 
        source: experiences.length > 0 ? 'eventbrite+ticketmaster' : 'eventbrite',
        experiences: experiences.slice(0, parseInt(limit as string)) 
      });
    } catch (error) {
      console.error("Error syncing Eventbrite:", error);
      res.status(500).json({ message: "Failed to sync Eventbrite events" });
    }
  });

  app.get('/api/sync/ticketmaster', async (req, res) => {
    try {
      if (!ticketmasterService.isConfigured()) {
        return res.status(400).json({ message: "Ticketmaster service not configured" });
      }

      const { city = "San Francisco", classification, limit = 20 } = req.query;
      const events = await ticketmasterService.searchEvents({
        city: city as string,
        classificationName: classification as string,
        size: parseInt(limit as string),
        sort: 'date,asc',
      });

      // Transform Ticketmaster events to our experience format
      const experiences = events._embedded?.events?.map((event: any) => ({
        title: event.name || 'Untitled Event',
        description: event.info || event.pleaseNote || '',
        imageUrl: event.images?.[0]?.url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
        location: `${event._embedded?.venues?.[0]?.name}, ${event._embedded?.venues?.[0]?.city?.name}`,
        latitude: event._embedded?.venues?.[0]?.location?.latitude || null,
        longitude: event._embedded?.venues?.[0]?.location?.longitude || null,
        price: event.priceRanges?.[0]?.min?.toString() || '0',
        startTime: new Date(event.dates?.start?.dateTime),
        endTime: new Date(new Date(event.dates?.start?.dateTime).getTime() + 2 * 60 * 60 * 1000), // +2 hours
        status: 'active' as const,
        type: event.priceRanges?.[0]?.min > 0 ? 'paid' as const : 'free' as const,
        availability: 'available' as const,
        isDropIn: false,
        tags: ['ticketmaster', 'live-event', event.classifications?.[0]?.segment?.name?.toLowerCase()].filter(Boolean),
        externalId: event.id,
        externalSource: 'ticketmaster'
      })) || [];

      res.json({ 
        count: experiences.length, 
        source: 'ticketmaster',
        experiences: experiences.slice(0, parseInt(limit as string)) 
      });
    } catch (error) {
      console.error("Error syncing Ticketmaster:", error);
      res.status(500).json({ message: "Failed to sync Ticketmaster events" });
    }
  });

  // Payment processing endpoints
  app.post('/api/payments/create-intent', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripeService.isConfigured()) {
        return res.status(400).json({ message: "Stripe service not configured" });
      }

      const { amount, experienceId, description } = req.body;
      const userId = isLocalDevelopment ? req.session.userId : req.user.claims.sub;

      const paymentIntent = await stripeService.createPaymentIntent({
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        description: description || 'LocalVibe Experience Booking',
        metadata: {
          userId,
          experienceId,
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Location services
  app.get('/api/location/geocode', async (req, res) => {
    try {
      const { address } = req.query;
      if (!address) {
        return res.status(400).json({ message: "Address parameter required" });
      }

      if (!mapService.isMapboxConfigured()) {
        return res.status(400).json({ message: "Mapbox service not configured" });
      }

      const result = await mapService.geocodeLocation(address as string);
      res.json(result);
    } catch (error) {
      console.error("Error geocoding address:", error);
      res.status(500).json({ message: "Failed to geocode address" });
    }
  });

  app.get('/api/location/places/search', async (req, res) => {
    try {
      const { query, location, radius = 5000, type } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Query parameter required" });
      }

      if (!mapService.isGooglePlacesConfigured()) {
        return res.status(400).json({ message: "Google Places service not configured" });
      }

      const result = await mapService.searchPlaces({
        query: query as string,
        location: location as string,
        radius: parseInt(radius as string),
        type: type as string,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error searching places:", error);
      res.status(500).json({ message: "Failed to search places" });
    }
  });

  // Video streaming endpoints
  app.post('/api/media/upload', isAuthenticated, async (req, res) => {
    try {
      if (!muxService.isConfigured()) {
        return res.status(400).json({ message: "Mux service not configured" });
      }

      const upload = await muxService.createDirectUpload({
        corsOrigin: req.get('origin'),
        newAssetSettings: {
          playbackPolicy: 'public'
        }
      });

      res.json({
        uploadUrl: upload.data.url,
        uploadId: upload.data.id
      });
    } catch (error) {
      console.error("Error creating video upload:", error);
      res.status(500).json({ message: "Failed to create video upload" });
    }
  });

  // Service status endpoint
  app.get('/api/services/status', async (req, res) => {
    res.json({
      eventbrite: eventbriteService.isConfigured(),
      ticketmaster: ticketmasterService.isConfigured(),
      stripe: stripeService.isConfigured(),
      mapbox: mapService.isMapboxConfigured(),
      googlePlaces: mapService.isGooglePlacesConfigured(),
      mux: muxService.isConfigured(),
    });
  });

  // Google Places sync endpoint
  app.get('/api/sync/places', isAuthenticated, async (req, res) => {
    try {
      if (!process.env.GOOGLE_PLACES_KEY) {
        return res.status(400).json({ message: "Google Places service not configured" });
      }

      const { location = "San Francisco", radius = 5000, limit = 20 } = req.query;
      const places = await mapService.searchPlaces({
        location: location as string,
        radius: parseInt(radius as string),
        type: 'tourist_attraction',
        limit: parseInt(limit as string),
      });

      // Transform Places data to our experience format
      const experiences = places?.results?.map((place: any) => ({
        title: place.name || 'Unnamed Place',
        description: place.types?.join(', ') || 'Local venue',
        imageUrl: place.photos?.[0]?.photo_reference 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_PLACES_KEY}`
          : 'https://images.unsplash.com/photo-1559666126-84f389727b9a',
        location: place.vicinity || location,
        latitude: place.geometry?.location?.lat || null,
        longitude: place.geometry?.location?.lng || null,
        price: '0',
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        status: 'active' as const,
        type: 'free' as const,
        availability: 'available' as const,
        isDropIn: true,
        tags: ['google-places', 'venue', ...(place.types || [])],
        externalId: place.place_id,
        externalSource: 'google-places'
      })) || [];

      res.json({ 
        count: experiences.length, 
        source: 'google-places',
        experiences: experiences.slice(0, parseInt(limit as string)) 
      });
    } catch (error) {
      console.error("Error syncing Google Places:", error);
      res.status(500).json({ message: "Failed to sync Google Places data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
