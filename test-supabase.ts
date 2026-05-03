import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
console.log('DATABASE_URL loaded:', connectionString ? 'YES ✓' : 'NO ✗');
console.log('Host:', connectionString?.split('@')[1]?.split('/')[0]);

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function test() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    console.log('Connection SUCCESS:', result);
  } catch(e: any) {
    console.log('ERROR:', e.message?.slice(0, 200));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
test();
