import { db } from "../server/db";
import { categories, experiences } from "../shared/schema";

async function seedData() {
  console.log("Seeding database with sample data...");

  // Seed categories
  const sampleCategories = [
    {
      name: "Food & Drink",
      icon: "fas fa-utensils",
      color: "#FF6B6B",
    },
    {
      name: "Art & Culture",
      icon: "fas fa-palette",
      color: "#4ECDC4",
    },
    {
      name: "Outdoor",
      icon: "fas fa-mountain",
      color: "#45B7D1",
    },
    {
      name: "Music & Nightlife",
      icon: "fas fa-music",
      color: "#96CEB4",
    },
    {
      name: "Workshops",
      icon: "fas fa-tools",
      color: "#FECA57",
    },
    {
      name: "Wellness",
      icon: "fas fa-leaf",
      color: "#9B59B6",
    },
  ];

  const insertedCategories = await db.insert(categories).values(sampleCategories).returning();
  console.log(`Created ${insertedCategories.length} categories`);

  // Seed experiences
  const sampleExperiences = [
    {
      title: "Rooftop Cocktail Making Class",
      description: "Learn to craft signature cocktails while enjoying stunning city views. Professional mixologist will guide you through 3 unique recipes using premium spirits.",
      imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=1000",
      videoUrl: null,
      categoryId: insertedCategories[0].id,
      hostId: null,
      location: "Downtown San Francisco",
      latitude: "37.7749",
      longitude: "-122.4194",
      price: "65.00",
      duration: 120,
      maxParticipants: 12,
      availableSpots: 5,
      status: "active" as const,
      type: "paid" as const,
      availability: "available" as const,
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      isDropIn: false,
      tags: ["cocktails", "rooftop", "evening", "social"],
      rating: "4.8",
      reviewCount: 127,
      likeCount: 89,
      saveCount: 156,
      viewCount: 2341,
    },
    {
      title: "Street Art Walking Tour",
      description: "Discover hidden murals and graffiti art in the Mission District. Local artists will share stories behind the most iconic pieces.",
      imageUrl: "https://images.unsplash.com/photo-1569019786342-b7a91b34c50b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=1000",
      videoUrl: null,
      categoryId: insertedCategories[1].id,
      hostId: null,
      location: "Mission District, SF",
      latitude: "37.7599",
      longitude: "-122.4148",
      price: "25.00",
      duration: 90,
      maxParticipants: 15,
      availableSpots: 8,
      status: "active" as const,
      type: "paid" as const,
      availability: "available" as const,
      startTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      isDropIn: true,
      tags: ["art", "walking", "culture", "local"],
      rating: "4.6",
      reviewCount: 93,
      likeCount: 156,
      saveCount: 203,
      viewCount: 1876,
    },
    {
      title: "Golden Gate Sunrise Hike",
      description: "Experience the magic of sunrise over the Golden Gate Bridge. Easy-moderate hike through Battery Spencer trail with photo opportunities.",
      imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=1000",
      videoUrl: null,
      categoryId: insertedCategories[2].id,
      hostId: null,
      location: "Marin Headlands",
      latitude: "37.8270",
      longitude: "-122.4960",
      price: "0",
      duration: 180,
      maxParticipants: 20,
      availableSpots: 12,
      status: "active" as const,
      type: "free" as const,
      availability: "available" as const,
      startTime: new Date(Date.now() + 16 * 60 * 60 * 1000), // Tomorrow morning
      endTime: new Date(Date.now() + 19 * 60 * 60 * 1000),
      isDropIn: false,
      tags: ["hiking", "sunrise", "photography", "nature"],
      rating: "4.9",
      reviewCount: 234,
      likeCount: 412,
      saveCount: 678,
      viewCount: 5432,
    },
    {
      title: "Jazz Jam Session",
      description: "Open jam session at historic jazz club. Bring your instrument or just come to listen. All skill levels welcome in this supportive environment.",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=1000",
      videoUrl: null,
      categoryId: insertedCategories[3].id,
      hostId: null,
      location: "North Beach Jazz Club",
      latitude: "37.8067",
      longitude: "-122.4102",
      price: "15.00",
      duration: 180,
      maxParticipants: 30,
      availableSpots: 18,
      status: "active" as const,
      type: "paid" as const,
      availability: "ongoing" as const,
      startTime: new Date(Date.now() - 30 * 60 * 1000), // Started 30 minutes ago
      endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
      isDropIn: true,
      tags: ["jazz", "music", "live", "instruments"],
      rating: "4.7",
      reviewCount: 178,
      likeCount: 267,
      saveCount: 189,
      viewCount: 3456,
    },
    {
      title: "Pottery Wheel Workshop",
      description: "Get your hands dirty in this beginner-friendly pottery class. Create your own ceramic piece and take home your masterpiece after firing.",
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=1000",
      videoUrl: null,
      categoryId: insertedCategories[4].id,
      hostId: null,
      location: "SOMA Art Studio",
      latitude: "37.7726",
      longitude: "-122.4027",
      price: "85.00",
      duration: 150,
      maxParticipants: 8,
      availableSpots: 2,
      status: "active" as const,
      type: "paid" as const,
      availability: "limited" as const,
      startTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      isDropIn: false,
      tags: ["pottery", "art", "handmade", "creative"],
      rating: "4.8",
      reviewCount: 89,
      likeCount: 123,
      saveCount: 245,
      viewCount: 1987,
    },
    {
      title: "Sunset Yoga in the Park",
      description: "Flow with the golden hour in this peaceful outdoor yoga session. All levels welcome. Mats and props provided.",
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=1000",
      videoUrl: null,
      categoryId: insertedCategories[5].id,
      hostId: null,
      location: "Dolores Park",
      latitude: "37.7596",
      longitude: "-122.4269",
      price: "20.00",
      duration: 75,
      maxParticipants: 25,
      availableSpots: 15,
      status: "active" as const,
      type: "paid" as const,
      availability: "available" as const,
      startTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now (sunset)
      endTime: new Date(Date.now() + 6.25 * 60 * 60 * 1000),
      isDropIn: true,
      tags: ["yoga", "sunset", "outdoor", "wellness"],
      rating: "4.5",
      reviewCount: 156,
      likeCount: 234,
      saveCount: 312,
      viewCount: 2876,
    },
  ];

  const insertedExperiences = await db.insert(experiences).values(sampleExperiences).returning();
  console.log(`Created ${insertedExperiences.length} experiences`);

  console.log("Database seeding completed!");
}

// Run the seeding function
seedData().catch(console.error);