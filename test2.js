const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const boosterid = "test";
    const includeBlock = {
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
    };
    await prisma.boosterProfile.findFirst({
          where: { user: { username: boosterid } },
          include: includeBlock
        });
    console.log("Success");
  } catch (e) {
    console.error("FULL ERROR:", e);
    console.error("MESSAGE:");
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
