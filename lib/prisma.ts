import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "postgresql://postgres:postgres@localhost:5432/postgres";

const globalForPrismaV3 = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

// Reuse pool in all environments (including production)
const pool = globalForPrismaV3.pgPool ?? new Pool({ 
  connectionString,
  max: 5,
  min: 1,
  idleTimeoutMillis: 10000, // Reduced from 30000 for faster cleanup
  connectionTimeoutMillis: 2000,
  reapIntervalMillis: 5000, // Clean up idle connections every 5 seconds
  allowExitOnIdle: false, // Don't exit, keep pool alive
});

// Store globally to reuse across requests
globalForPrismaV3.pgPool = pool;

export const prisma =
  globalForPrismaV3.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Store globally to reuse across requests
globalForPrismaV3.prisma = prisma;
