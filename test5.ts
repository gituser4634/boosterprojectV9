import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: "postgresql://postgres:postgres@localhost:5433/postgres" });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function test() {
  try {
    await prisma.user.findFirst();
  } catch(e: any) {
    console.log('NAME:', e.name);
    console.log('CODE:', e.code);
    console.log('MESSAGE:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
