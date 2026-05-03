import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email-service";
import { generateToken, generateVerificationCode, getTokenExpiry } from "@/lib/token-utils";

const ALLOWED_ROLES = new Set(["CLIENT", "BOOSTER"]);

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const displayName =
      typeof body.displayName === "string"
        ? body.displayName.trim()
        : typeof body.alias === "string"
          ? body.alias.trim()
          : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = typeof body.role === "string" ? body.role.trim().toUpperCase() : "";
    const country = typeof body.country === "string" ? body.country.trim() : null;

    console.log("=== REGISTRATION DEBUG ===");
    console.log("Username:", username);
    console.log("Email:", email);
    console.log("Role:", role);
    console.log("Country:", country);
    console.log("Password length:", password.length);

    if (!username || !email || !password || !ALLOWED_ROLES.has(role)) {
      console.log("Validation failed - missing fields");
      return NextResponse.json(
        {
          error: "Invalid payload",
          required: ["username", "email", "password", "role: CLIENT|BOOSTER"],
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully, length:", hashedPassword.length);

    const user = await prisma.user.create({
      data: {
        username,
        displayName: displayName || username,
        email,
        password: hashedPassword,
        role: role as "CLIENT" | "BOOSTER",
        wallet: {
          create: {},
        },
        ...(role === "BOOSTER" ? {
          boosterProfile: {
            create: {
              displayName: displayName || username,
              country: country,
              // hours: 0 and successRate: 100 are handled by schema defaults
            }
          }
        } : {})
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    console.log("User created:", user.id, "Email verified:", user.emailVerified);

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    const verificationToken = generateToken();
    console.log("Generated verification code:", verificationCode);
    
    const tokenRecord = await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        code: verificationCode,
        expiresAt: getTokenExpiry(0.25), // 15 minutes
      },
    });
    console.log("Token record created:", tokenRecord.id);

    const emailResult = await sendVerificationEmail(user.email, verificationCode);
    console.log("Email send result:", emailResult);
    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
      // Still return success as user was created
    } else {
      console.log("Verification email sent successfully to:", user.email);
    }

    return NextResponse.json(
      { 
        user,
        message: "Account created successfully. Please check your email for the 6-digit verification code."
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const maybePrismaError = error as { code?: string; meta?: { target?: string[] } };
    if (maybePrismaError.code === "P2002") {
      return NextResponse.json(
        {
          error: "User already exists",
          field: maybePrismaError.meta?.target,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Unable to create user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
