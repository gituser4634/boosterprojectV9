require("dotenv").config({ path: ".env.local" });

async function deleteUser() {
  const { db } = require("./lib/db") || require("./lib/prisma") || {};
  // let's just require PrismaClient from their actual file instead, wait let's look at their file structure
  // the previous file used `const { prisma } = require("./lib/prisma");`
  const { prisma } = require("./lib/prisma") || require("./db.js"); // Wait, db.js might be it.
  
  const email = "taheroeurfelli@gmail.com";
  
  try {
    const client = prisma || require("./lib/prisma").prisma || require("./db.js").db;
    console.log(`Attempting to delete user with email: ${email}`);
    
    const user = await client.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("❌ User not found!");
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.id} - ${user.username}`);
    
    // Delete related records first
    await client.verificationToken.deleteMany({
      where: { userId: user.id },
    });
    console.log("✓ Deleted verification tokens");

    await client.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });
    console.log("✓ Deleted password reset tokens");

    // Delete the user
    const deleted = await client.user.delete({
      where: { email },
    });

    console.log(`✓ Successfully deleted user: ${deleted.username} (${deleted.email})`);
  } catch (error) {
    console.error("❌ Error deleting user:", error.message);
    process.exit(1);
  }
}

deleteUser();
