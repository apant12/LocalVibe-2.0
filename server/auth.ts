import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as AppleStrategy } from "passport-apple";

// Extend session interface for local development
declare module "express-session" {
  interface SessionData {
    userId?: string;
    user?: any;
    appleEmail?: string;
  }
}

const isLocalDevelopment = process.env.NODE_ENV === "development" && !process.env.REPL_ID;

// Simple local user for development
const LOCAL_USER = {
  id: 'local-user-1',
  email: 'local@example.com',
  firstName: 'Local',
  lastName: 'User',
  profileImageUrl: null
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  if (isLocalDevelopment) {
    // For local development, use memory store
    return session({
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // Allow HTTP in development
        maxAge: sessionTtl,
      },
    });
  } else {
    // For production, use PostgreSQL store
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
    return session({
      secret: process.env.SESSION_SECRET!,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: true,
        maxAge: sessionTtl,
      },
    });
  }
}

function updateUserSession(
  user: any,
  tokens: any
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = tokens.expires_at;
}

async function upsertUser(claims: any) {
  const user = {
    id: claims.sub,
    email: claims.email,
    firstName: claims.given_name || claims.first_name || 'Unknown',
    lastName: claims.family_name || claims.last_name || 'User',
    profileImageUrl: claims.picture || null
  };
  
  await storage.upsertUser(user);
  return user;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  if (isLocalDevelopment) {
    // For local development, don't use Passport.js at all
    console.log("Running in local development mode - Passport.js disabled");
    return; // Exit early for local development
  }

  // Initialize Passport.js for production
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ['profile', 'email']
    }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        const user = await upsertUser({
          sub: profile.id,
          email: profile.emails?.[0]?.value,
          given_name: profile.name?.givenName,
          family_name: profile.name?.familyName,
          picture: profile.photos?.[0]?.value
        });
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // Apple OAuth Strategy
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(new AppleStrategy({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY,
      callbackURL: "/api/auth/apple/callback",
      passReqToCallback: true
    }, async (req: any, accessToken: any, refreshToken: any, idToken: any, profile: any, done: any) => {
      try {
        // Apple doesn't provide email in subsequent logins, so we need to handle this
        const user = await upsertUser({
          sub: profile.id,
          email: profile.email || req.session.appleEmail, // Use stored email if available
          given_name: profile.name?.firstName,
          family_name: profile.name?.lastName
        });
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // Serialization
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (isLocalDevelopment) {
    // For local development, check session directly
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return next();
  }

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
