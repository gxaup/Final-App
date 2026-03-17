import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// We export db as optional or handle the missing DATABASE_URL gracefully 
// to allow the app to boot even without a real database (using MemStorage fallback)
let database;
let connectionPool;

if (process.env.DATABASE_URL) {
  connectionPool = new Pool({ connectionString: process.env.DATABASE_URL });
  database = drizzle(connectionPool, { schema });
}

export const pool = connectionPool;
export const db = database;
