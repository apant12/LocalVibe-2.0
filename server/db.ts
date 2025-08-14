import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// For Vercel deployment without database, use in-memory fallback
let pool: Pool | null = null;
let db: any = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
    db = drizzle({ client: pool, schema });
    console.log("Connected to PostgreSQL database");
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error);
  }
} else {
  console.log("No DATABASE_URL provided, using in-memory storage");
}

export { pool, db };