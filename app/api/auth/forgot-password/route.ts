import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email-service";
import { generateToken, getTokenExpiry } from "@/lib/token-utils";

export async function POST(req: Request) {
  try {
    // Check if Resend API key is set
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    console.log("Forgot password request for:", email);

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log("User found:", !!user);

    // Always return success for security reasons (don't leak if email exists)
    if (!user) {
      console.log("User not found, returning success message anyway");
      return NextResponse.json(
        { message: "If an account exists with this email, a password reset link has been sent." },
        { status: 200 }
      );
    }

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new reset token
    const resetToken = generateToken();
    console.log("Creating reset token for user:", user.id);
    
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: getTokenExpiry(1), // 1 hour expiry
      },
    });

    console.log("Sending password reset email to:", email);

    // Send reset email
    const emailResult = await sendPasswordResetEmail(user.email, resetToken);
    
    console.log("Email send result:", emailResult);
    
    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again." },
        { status: 500 }
      );
    }

    console.log("Password reset email sent successfully");

    return NextResponse.json(
      { message: "If an account exists with this email, a password reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      {
        error: "Unable to process password reset request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
