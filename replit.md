# LocalVibe

## Overview

LocalVibe is a mobile-first web application that helps users discover unique, last-minute experiences happening nearby. It combines the curated experiences concept from Airbnb Experiences with a TikTok-style interface for browsing local events and activities. The platform focuses on immediate availability and social discovery, allowing users to find and book experiences that are happening "right now" in their area.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: Tailwind CSS with custom dark theme design system
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First Design**: Responsive design optimized for mobile devices with TikTok-style vertical scrolling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with standardized error handling and logging middleware
- **File Upload**: Uppy integration for file handling with AWS S3 support
- **Development**: Hot module replacement and runtime error overlay for development experience

### Authentication & Authorization
- **Provider**: Replit's OpenID Connect (OIDC) authentication
- **Session Management**: Express sessions with PostgreSQL storage
- **Strategy**: Passport.js with OpenID Connect strategy
- **Security**: HTTP-only secure cookies with session expiration

### Data Storage
- **Database**: PostgreSQL via Neon serverless database
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Connection**: Connection pooling with WebSocket support for serverless environments
- **Migrations**: Drizzle Kit for database schema management and migrations

### Core Data Models
- **Users**: Profile management with location, points system, and social features
- **Categories**: Hierarchical organization of experience types with icons and colors
- **Experiences**: Rich content model with media, availability, pricing, and location data with external API integration support
- **Bookings**: Transaction management with status tracking, Stripe payment processing, and notifications
- **Social Features**: User likes, saves, reviews, and social proof mechanisms
- **External Integration**: Real-time event sync from Eventbrite and Ticketmaster with automatic data transformation

### Key Features Architecture
- **Real-time Availability**: Live status updates for experience availability
- **Location-Based Discovery**: Geographic filtering with Mapbox geocoding and Google Places integration
- **Social Interactions**: Like/save functionality with user engagement tracking
- **View Tracking**: Intersection Observer API for analytics and recommendation improvements
- **Responsive Media**: Optimized image and video handling with Mux streaming support
- **External Data Sync**: Automated import from Eventbrite and Ticketmaster APIs with data transformation
- **Payment Processing**: Stripe integration for secure booking transactions
- **Fortune Cookie Rewards**: Gamified first-time user experience with inspirational messages
- **Admin Panel**: External service management and real-time data synchronization controls

## External Dependencies

### Cloud Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Google Cloud Storage**: Media file storage and CDN delivery
- **AWS S3**: Alternative file storage option via Uppy integration

### External APIs & Services
- **Eventbrite API**: Real-time event data synchronization with automatic transformation to LocalVibe format
- **Ticketmaster Discovery API**: Venue and event data integration with geographic filtering
- **Stripe Payments**: Secure payment processing for experience bookings with metadata tracking
- **Mapbox API**: Geocoding, reverse geocoding, and location-based search functionality
- **Google Places API**: Venue search, nearby discovery, and detailed place information
- **Mux Video**: Professional video streaming and upload handling for experience media

### Authentication
- **Replit OIDC**: Primary authentication provider with secure token management
- **OpenID Client**: Standard-compliant authentication flow implementation

### Development Tools
- **Replit Platform**: Integrated development environment with deployment automation
- **Vite Plugins**: Runtime error modal and development cartographer for enhanced debugging
- **TypeScript**: Full type safety across frontend, backend, and shared schemas

### UI and Interaction
- **Radix UI**: Accessible component primitives for complex interactions
- **Lucide Icons**: Consistent icon system throughout the application
- **Font Awesome**: Additional icon library for mobile-specific icons
- **Google Fonts**: Custom typography with Inter font family

### Media and File Handling
- **Uppy**: Progressive file upload with multiple backend support
- **Image Optimization**: Responsive image loading and compression
- **Video Streaming**: Optimized video delivery for mobile consumption