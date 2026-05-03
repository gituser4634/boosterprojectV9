const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.boosterProfile.findFirst({
      where: { user: { username: "test" } },
      include: {
        user: true,
        mainGame: true,
        boosterGames: { include: { rank: true } },
        reviews: { include: { customer: true }, take: 4, orderBy: { createdAt: 'desc' } },
        languages: true
      }
    });
    console.log("Success");
  } catch (e) {
    console.error("ERROR CAUGHT:");
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
