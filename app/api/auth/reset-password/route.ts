import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body.password === "string" ? body.password : "";

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { token },
      });

      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log("=== PASSWORD RESET DEBUG ===");
    console.log("User ID:", resetToken.userId);
    console.log("New password length:", newPassword.length);
    console.log("Hashed password length:", hashedPassword.length);
    console.log("Hashed password starts with:", hashedPassword.substring(0, 20));

    // Update password AND mark email as verified (user proved they own the email by clicking reset link)
    const updateResult = await prisma.user.update({
      where: { id: resetToken.userId },
      data: { 
        password: hashedPassword,
        emailVerified: true,  // Mark email as verified since they own the email
      },
    });

    console.log("Update result - password stored:", !!updateResult.password);
    console.log("Update result - emailVerified:", updateResult.emailVerified);
    console.log("Stored password length:", updateResult.password?.length);
    console.log("Stored password starts with:", updateResult.password?.substring(0, 20));

    // Delete the reset token
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    console.log("=== PASSWORD RESET SUCCESS ===");

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to reset password",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
