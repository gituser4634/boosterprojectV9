require("dotenv").config({ path: ".env.local" });

async function deleteUsers() {
  const { prisma } = require("./lib/prisma");
  const emailsToDelete = ["childpatron@gmail.com", "medalihiza@proton.me"];

  try {
    console.log("🔍 Looking for users with these emails:", emailsToDelete);

    // Find users first to show what we're deleting
    const usersToDelete = await prisma.user.findMany({
      where: {
        email: {
          in: emailsToDelete,
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
      },
    });

    if (usersToDelete.length === 0) {
      console.log("❌ No users found with these emails.");
      process.exit(0);
    }

    console.log("\n📋 Found users to delete:");
    usersToDelete.forEach((user) => {
      console.log(`  - ${user.email} (${user.username})`);
    });

    // Delete related records for each user
    for (const user of usersToDelete) {
      console.log(`\n🗑️ Deleting data for user: ${user.email}`);
      
      await prisma.verificationToken.deleteMany({
        where: { userId: user.id },
      });
      console.log("  ✓ Deleted verification tokens");

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });
      console.log("  ✓ Deleted password reset tokens");
    }

    // Delete the users
    const deleteResult = await prisma.user.deleteMany({
      where: {
        email: {
          in: emailsToDelete,
        },
      },
    });

    console.log(`\n✅ Successfully deleted ${deleteResult.count} user(s)`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error deleting users:", error.message);
    process.exit(1);
  }
}

deleteUsers();
