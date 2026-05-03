import 'dotenv/config';
import { prisma } from './lib/prisma';

async function test() {
  try {
    const boosterid = 'test';
    await prisma.boosterProfile.findFirst({
      where: { user: { is: { username: boosterid } } },
      include: {
        user: true,
        mainGame: true,
        boosterGames: {
          include: {
            rank: true
          }
        },
        reviews: {
          include: {
            customer: true
          },
          take: 4,
          orderBy: {
            createdAt: 'desc'
          }
        },
        languages: true
      }
    });
    console.log('SUCCESS');
  } catch(e: any) {
    console.log('--- ERROR ---');
    console.log(e.name);
    console.log(e.code);
    console.log(e.message);
    console.log('-----------------');
  } finally {
    await prisma.$disconnect();
  }
}
test();
