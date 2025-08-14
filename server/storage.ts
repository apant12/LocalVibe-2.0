import {
  users,
  categories,
  experiences,
  bookings,
  userLikes,
  userSaves,
  reviews,
  fortuneCookies,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Experience,
  type InsertExperience,
  type Booking,
  type InsertBooking,
  type Review,
  type InsertReview,
  type FortuneCookie,
  type InsertFortuneCookie,
  type UserLike,
  type UserSave,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, sql, count, avg } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Experience operations
  getExperiences(params: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    location?: string;
    availability?: string;
    search?: string;
    userId?: string;
  }): Promise<Experience[]>;
  getExperience(id: string): Promise<Experience | undefined>;
  createExperience(experience: InsertExperience): Promise<Experience>;
  updateExperience(id: string, updates: Partial<InsertExperience>): Promise<Experience | undefined>;
  incrementExperienceViews(id: string): Promise<void>;
  getExperienceByExternalId(externalId: string): Promise<Experience | undefined>;

  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getUserBookings(userId: string): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;

  // User interactions
  toggleLike(userId: string, experienceId: string): Promise<{ liked: boolean }>;
  toggleSave(userId: string, experienceId: string): Promise<{ saved: boolean }>;
  getUserLikes(userId: string): Promise<string[]>;
  getUserSaves(userId: string): Promise<string[]>;

  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getExperienceReviews(experienceId: string): Promise<Review[]>;

  // Fortune Cookies
  checkDailyFortuneCookie(userId: string): Promise<{ canClaim: boolean; lastClaimed?: Date }>;
  claimFortuneCookie(userId: string): Promise<{ cookie: FortuneCookie; pointsEarned: number }>;
  getUserFortuneCookies(userId: string, limit?: number): Promise<FortuneCookie[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      console.log("Attempting to upsert user:", { id: userData.id, email: userData.email });
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      console.log("User upserted successfully:", { id: user.id, email: user.email });
      return user;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async getAllExperiences(): Promise<Experience[]> {
    return await db.select().from(experiences);
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  }

  async getExperiences(params: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    location?: string;
    availability?: string;
    search?: string;
    userId?: string;
  }): Promise<Experience[]> {
    const {
      limit = 10,
      offset = 0,
      categoryId,
      location,
      availability,
      search,
      userId,
    } = params;
    let query = db
      .select({
        id: experiences.id,
        title: experiences.title,
        description: experiences.description,
        imageUrl: experiences.imageUrl,
        videoUrl: experiences.videoUrl,
        categoryId: experiences.categoryId,
        hostId: experiences.hostId,
        location: experiences.location,
        latitude: experiences.latitude,
        longitude: experiences.longitude,
        price: experiences.price,
        duration: experiences.duration,
        maxParticipants: experiences.maxParticipants,
        availableSpots: experiences.availableSpots,
        status: experiences.status,
        type: experiences.type,
        availability: experiences.availability,
        startTime: experiences.startTime,
        endTime: experiences.endTime,
        isDropIn: experiences.isDropIn,
        tags: experiences.tags,
        rating: experiences.rating,
        reviewCount: experiences.reviewCount,
        likeCount: experiences.likeCount,
        saveCount: experiences.saveCount,
        viewCount: experiences.viewCount,
        externalId: experiences.externalId,
        externalSource: experiences.externalSource,
        createdAt: experiences.createdAt,
        updatedAt: experiences.updatedAt,
      })
      .from(experiences);

    const conditions = [eq(experiences.status, "active")];

    if (categoryId) {
      conditions.push(eq(experiences.categoryId, categoryId));
    }

    if (availability) {
      conditions.push(eq(experiences.availability, availability as any));
    }

    if (search) {
      conditions.push(
        or(
          sql`${experiences.title} ILIKE ${`%${search}%`}`,
          sql`${experiences.description} ILIKE ${`%${search}%`}`,
          sql`${experiences.location} ILIKE ${`%${search}%`}`
        )!
      );
    }

    if (location) {
      conditions.push(sql`${experiences.location} ILIKE ${`%${location}%`}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query
      .orderBy(desc(experiences.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getExperience(id: string): Promise<Experience | undefined> {
    const [experience] = await db
      .select()
      .from(experiences)
      .where(eq(experiences.id, id));
    return experience;
  }

  async createExperience(experienceData: InsertExperience): Promise<Experience> {
    const [experience] = await db
      .insert(experiences)
      .values(experienceData)
      .returning();
    return experience;
  }

  async updateExperience(id: string, updates: Partial<InsertExperience>): Promise<Experience | undefined> {
    const [experience] = await db
      .update(experiences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(experiences.id, id))
      .returning();
    return experience;
  }

  async incrementExperienceViews(id: string): Promise<void> {
    await db
      .update(experiences)
      .set({ viewCount: sql`${experiences.viewCount} + 1` })
      .where(eq(experiences.id, id));
  }

  async getExperienceByExternalId(externalId: string): Promise<Experience | undefined> {
    const [experience] = await db
      .select()
      .from(experiences)
      .where(eq(experiences.externalId, externalId));
    return experience;
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    return booking;
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.bookedAt));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));
    return booking;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ status: status as any })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async toggleLike(userId: string, experienceId: string): Promise<{ liked: boolean }> {
    const existing = await db
      .select()
      .from(userLikes)
      .where(and(eq(userLikes.userId, userId), eq(userLikes.experienceId, experienceId)));

    if (existing.length > 0) {
      // Unlike
      await db
        .delete(userLikes)
        .where(and(eq(userLikes.userId, userId), eq(userLikes.experienceId, experienceId)));
      
      await db
        .update(experiences)
        .set({ likeCount: sql`${experiences.likeCount} - 1` })
        .where(eq(experiences.id, experienceId));

      return { liked: false };
    } else {
      // Like
      await db.insert(userLikes).values({ userId, experienceId });
      
      await db
        .update(experiences)
        .set({ likeCount: sql`${experiences.likeCount} + 1` })
        .where(eq(experiences.id, experienceId));

      return { liked: true };
    }
  }

  async toggleSave(userId: string, experienceId: string): Promise<{ saved: boolean }> {
    const existing = await db
      .select()
      .from(userSaves)
      .where(and(eq(userSaves.userId, userId), eq(userSaves.experienceId, experienceId)));

    if (existing.length > 0) {
      // Unsave
      await db
        .delete(userSaves)
        .where(and(eq(userSaves.userId, userId), eq(userSaves.experienceId, experienceId)));
      
      await db
        .update(experiences)
        .set({ saveCount: sql`${experiences.saveCount} - 1` })
        .where(eq(experiences.id, experienceId));

      return { saved: false };
    } else {
      // Save
      await db.insert(userSaves).values({ userId, experienceId });
      
      await db
        .update(experiences)
        .set({ saveCount: sql`${experiences.saveCount} + 1` })
        .where(eq(experiences.id, experienceId));

      return { saved: true };
    }
  }

  async getUserLikes(userId: string): Promise<string[]> {
    const likes = await db
      .select({ experienceId: userLikes.experienceId })
      .from(userLikes)
      .where(eq(userLikes.userId, userId));
    
    return likes.map(like => like.experienceId);
  }

  async getUserSaves(userId: string): Promise<string[]> {
    const saves = await db
      .select({ experienceId: userSaves.experienceId })
      .from(userSaves)
      .where(eq(userSaves.userId, userId));
    
    return saves.map(save => save.experienceId);
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    
    // Update experience rating and review count
    const avgRating = await db
      .select({ avg: avg(reviews.rating) })
      .from(reviews)
      .where(eq(reviews.experienceId, reviewData.experienceId));

    const reviewCount = await db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.experienceId, reviewData.experienceId));

    await db
      .update(experiences)
      .set({
        rating: avgRating[0].avg?.toString(),
        reviewCount: reviewCount[0].count,
      })
      .where(eq(experiences.id, reviewData.experienceId));

    return review;
  }

  async getExperienceReviews(experienceId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.experienceId, experienceId))
      .orderBy(desc(reviews.createdAt));
  }

  // Fortune Cookie Methods
  async checkDailyFortuneCookie(userId: string): Promise<{ canClaim: boolean; lastClaimed?: Date }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { canClaim: false };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastClaimed = user.lastFortuneCookieDate;
    if (!lastClaimed) {
      return { canClaim: true };
    }

    const lastClaimedDate = new Date(lastClaimed);
    lastClaimedDate.setHours(0, 0, 0, 0);

    const canClaim = today.getTime() > lastClaimedDate.getTime();
    return { canClaim, lastClaimed };
  }

  async claimFortuneCookie(userId: string): Promise<{ cookie: FortuneCookie; pointsEarned: number }> {
    const fortuneMessages = [
      "Today you'll discover something amazing nearby! 🌟",
      "Adventure awaits those who explore beyond their comfort zone.",
      "The best experiences come when you least expect them.",
      "Local treasures are hidden in plain sight - open your eyes today!",
      "Your next great memory is just around the corner.",
      "Spontaneity is the spice of life - say yes to something new today!",
      "Every neighborhood has secrets waiting to be discovered.",
      "The journey of a thousand experiences begins with a single step.",
      "Today's experience could become tomorrow's favorite memory.",
      "Connection happens when you show up and stay curious.",
      "The world is full of micro-adventures - find yours today!",
      "Local experiences create the richest stories.",
      "Your comfort zone is a beautiful place, but nothing grows there.",
      "Every moment offers a chance to discover something wonderful.",
      "The best time to explore is right now.",
      "Adventure doesn't require a passport - just an open mind.",
      "Small discoveries lead to big transformations.",
      "The most beautiful experiences are often the most unexpected.",
      "Today holds infinite possibilities for connection and discovery.",
      "Life is a collection of moments - make this one count!"
    ];

    const randomMessage = fortuneMessages[Math.floor(Math.random() * fortuneMessages.length)];
    const pointsEarned = 10;

    // Create fortune cookie record
    const [cookie] = await db
      .insert(fortuneCookies)
      .values({
        userId,
        message: randomMessage,
        points: pointsEarned,
      })
      .returning();

    // Update user points and last claimed date
    await db
      .update(users)
      .set({
        points: sql`${users.points} + ${pointsEarned}`,
        lastFortuneCookieDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { cookie, pointsEarned };
  }

  async getUserFortuneCookies(userId: string, limit = 10): Promise<FortuneCookie[]> {
    return await db
      .select()
      .from(fortuneCookies)
      .where(eq(fortuneCookies.userId, userId))
      .orderBy(desc(fortuneCookies.claimedAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
