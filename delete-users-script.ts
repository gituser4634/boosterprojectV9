import { loadEnvConfig } from "@next/env";
import { prisma } from "@/lib/prisma";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
console.log("DIRECT_URL:", process.env.DIRECT_URL ? "SET" : "NOT SET");

async function deleteUsers() {
  const emailsToDelete = ["childpatron@gmail.com", "medalihiza@proton.me"];

  try {
    console.log("Looking for users with emails:", emailsToDelete);

    // Find users first to show what we're deleting
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

    // Delete related records for each user
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

    // Delete the users
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
  }
}

deleteUsers();
