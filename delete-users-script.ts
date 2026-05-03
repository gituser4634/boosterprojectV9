import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function deleteUsers() {
  const emailsToDelete = ["taheroeurfelli@gmail.com"];

  try {
    console.log("Looking for users with emails:", emailsToDelete);

    const usersToDelete = await prisma.user.findMany({
      where: {
        email: {
          in: emailsToDelete,
        },
      },
    });

    if (usersToDelete.length === 0) {
      console.log("No users found with these emails.");
      process.exit(0);
    }

    console.log("Found users to delete:");
    usersToDelete.forEach((user: any) => {
      console.log(`  - ${user.email} (${user.username})`);
    });

    for (const user of usersToDelete) {
      console.log(`Deleting data for user: ${user.email}`);
      
      await prisma.verificationToken.deleteMany({
        where: { userId: user.id },
      });
      console.log("  - Deleted verification tokens");

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });
      console.log("  - Deleted password reset tokens");
    }

    const deleteResult = await prisma.user.deleteMany({
      where: {
        email: {
          in: emailsToDelete,
        },
      },
    });

    console.log(`Successfully deleted ${deleteResult.count} user(s)`);
    process.exit(0);
  } catch (error) {
    console.error("Error deleting users:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

deleteUsers();
