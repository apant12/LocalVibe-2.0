import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  location: varchar("location"),
  points: integer("points").default(0),
  lastFortuneCookieDate: timestamp("last_fortune_cookie_date"),
  password: varchar("password"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Experience categories
export const experienceStatusEnum = pgEnum("experience_status", ["active", "inactive", "draft"]);
export const experienceTypeEnum = pgEnum("experience_type", ["paid", "free", "donation"]);
export const availabilityEnum = pgEnum("availability", ["available", "limited", "full", "ongoing"]);

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Experiences table
export const experiences = pgTable("experiences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("image_url").notNull(),
  videoUrl: varchar("video_url"),
  categoryId: varchar("category_id").references(() => categories.id),
  hostId: varchar("host_id").references(() => users.id),
  location: varchar("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  duration: integer("duration_minutes"),
  maxParticipants: integer("max_participants"),
  availableSpots: integer("available_spots"),
  status: experienceStatusEnum("status").default("active"),
  type: experienceTypeEnum("type").default("paid"),
  availability: availabilityEnum("availability").default("available"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  isDropIn: boolean("is_drop_in").default(false),
  tags: text("tags").array(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  likeCount: integer("like_count").default(0),
  saveCount: integer("save_count").default(0),
  viewCount: integer("view_count").default(0),
  externalId: varchar("external_id"),
  externalSource: varchar("external_source"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bookings
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "cancelled", "completed"]);

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  experienceId: varchar("experience_id").references(() => experiences.id).notNull(),
  numberOfPeople: integer("number_of_people").default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  status: bookingStatusEnum("status").default("pending"),
  paymentMethod: varchar("payment_method"),
  paymentId: varchar("payment_id"),
  bookedAt: timestamp("booked_at").defaultNow(),
  cancelledAt: timestamp("cancelled_at"),
});

// User interactions
export const userLikes = pgTable("user_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  experienceId: varchar("experience_id").references(() => experiences.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSaves = pgTable("user_saves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  experienceId: varchar("experience_id").references(() => experiences.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  experienceId: varchar("experience_id").references(() => experiences.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fortune Cookies
export const fortuneCookies = pgTable("fortune_cookies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  points: integer("points").default(10),
  claimedAt: timestamp("claimed_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  experiences: many(experiences),
  bookings: many(bookings),
  likes: many(userLikes),
  saves: many(userSaves),
  reviews: many(reviews),
  fortuneCookies: many(fortuneCookies),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  experiences: many(experiences),
}));

export const experiencesRelations = relations(experiences, ({ one, many }) => ({
  category: one(categories, {
    fields: [experiences.categoryId],
    references: [categories.id],
  }),
  host: one(users, {
    fields: [experiences.hostId],
    references: [users.id],
  }),
  bookings: many(bookings),
  likes: many(userLikes),
  saves: many(userSaves),
  reviews: many(reviews),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  experience: one(experiences, {
    fields: [bookings.experienceId],
    references: [experiences.id],
  }),
}));

export const userLikesRelations = relations(userLikes, ({ one }) => ({
  user: one(users, {
    fields: [userLikes.userId],
    references: [users.id],
  }),
  experience: one(experiences, {
    fields: [userLikes.experienceId],
    references: [experiences.id],
  }),
}));

export const userSavesRelations = relations(userSaves, ({ one }) => ({
  user: one(users, {
    fields: [userSaves.userId],
    references: [users.id],
  }),
  experience: one(experiences, {
    fields: [userSaves.experienceId],
    references: [experiences.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  experience: one(experiences, {
    fields: [reviews.experienceId],
    references: [experiences.id],
  }),
}));

export const fortuneCookiesRelations = relations(fortuneCookies, ({ one }) => ({
  user: one(users, {
    fields: [fortuneCookies.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertExperienceSchema = createInsertSchema(experiences).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, bookedAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertFortuneCookieSchema = createInsertSchema(fortuneCookies).omit({ id: true, claimedAt: true });

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type Experience = typeof experiences.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertFortuneCookie = z.infer<typeof insertFortuneCookieSchema>;
export type FortuneCookie = typeof fortuneCookies.$inferSelect;
export type UserLike = typeof userLikes.$inferSelect;
export type UserSave = typeof userSaves.$inferSelect;
