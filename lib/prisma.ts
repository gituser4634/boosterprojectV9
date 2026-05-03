import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "postgresql://postgres:postgres@localhost:5432/postgres";

const globalForPrismaV3 = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

const pool = globalForPrismaV3.pgPool ?? new Pool({ connectionString });

if (process.env.NODE_ENV !== "production") {
  globalForPrismaV3.pgPool = pool;
}

export const prisma =
  globalForPrismaV3.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrismaV3.prisma = prisma;
}
