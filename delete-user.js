require("dotenv").config({ path: ".env.local" });

async function deleteUser() {
  const { prisma } = require("./lib/prisma");
  const email = "medalihiza@proton.me";
  
  try {
    console.log(`Attempting to delete user with email: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("❌ User not found!");
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.id} - ${user.username}`);
    
    // Delete related records first
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });
    console.log("✓ Deleted verification tokens");

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });
    console.log("✓ Deleted password reset tokens");

    // Delete the user
    const deleted = await prisma.user.delete({
      where: { email },
    });

    console.log(`✓ Successfully deleted user: ${deleted.username} (${deleted.email})`);
  } catch (error) {
    console.error("❌ Error deleting user:", error.message);
    process.exit(1);
  }
}

deleteUser();
