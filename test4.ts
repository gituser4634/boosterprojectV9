import 'dotenv/config';
import { prisma } from './lib/prisma';

async function test() {
  try {
    await prisma.boosterProfile.findFirst({
      where: { blabla: 123 }
    } as any);
    console.log('SUCCESS');
  } catch(e: any) {
    console.log('--- ERROR ---');
    console.log(e.name);
    console.log(e.message);
    console.log('-----------------');
  } finally {
    await prisma.$disconnect();
  }
}
test();
