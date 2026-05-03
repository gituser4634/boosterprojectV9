import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log('\n🔍 Checking Supabase connection...\n');

  // 1. Basic connectivity
  try {
    const res = await prisma.$queryRaw<[{ ok: number }]>`SELECT 1 as ok`;
    console.log('✅ Connection:      ONLINE');
  } catch (e: any) {
    console.log('❌ Connection:      FAILED -', e.message?.slice(0, 100));
    process.exit(1);
  }

  // 2. Check which tables exist
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  if (tables.length === 0) {
    console.log('⚠️  Tables:          NONE FOUND (migrations not run yet)');
  } else {
    console.log(`✅ Tables found:    ${tables.length}`);
    tables.forEach(t => console.log(`   - ${t.tablename}`));
  }

  // 3. Row counts for key tables (if they exist)
  const expectedTables = ['User', 'BoosterProfile', 'Game', 'Rank', 'Order'];
  console.log('\n📊 Row counts:');
  for (const tbl of expectedTables) {
    const exists = tables.some(t => t.tablename.toLowerCase() === tbl.toLowerCase());
    if (!exists) {
      console.log(`   ${tbl.padEnd(20)} → not found`);
      continue;
    }
    try {
      const count = await (prisma as any)[tbl.charAt(0).toLowerCase() + tbl.slice(1)].count();
      console.log(`   ${tbl.padEnd(20)} → ${count} rows`);
    } catch {
      console.log(`   ${tbl.padEnd(20)} → (count failed)`);
    }
  }

  await prisma.$disconnect();
  await pool.end();
  console.log('\n✅ Database check complete.\n');
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
