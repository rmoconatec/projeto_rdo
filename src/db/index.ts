import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function createPool() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  return new Pool({ connectionString: databaseUrl });
}

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ?? (databaseUrl ? createPool() : null!);

if (databaseUrl && process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = databaseUrl ? drizzle(pool) : null!;
