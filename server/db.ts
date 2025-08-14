import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Connect to PostgreSQL database with fallback
let pool: Pool | null = null;
let db: any = null;

try {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set, database operations will fail");
  } else {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
    db = drizzle({ client: pool, schema });
    console.log("Connected to PostgreSQL database");
  }
} catch (error) {
  console.error("Failed to connect to database:", error);
  console.log("Continuing without database connection");
}

export { pool, db };