import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("DIRECT_URL:", process.env.DIRECT_URL);

const prisma = new PrismaClient();

async function test() {
  try {
    const result = await prisma.user.findMany({
      where: {
        email: {
          in: ["childpatron@gmail.com", "medalihiza@proton.me"]
        }
      }
    });
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
