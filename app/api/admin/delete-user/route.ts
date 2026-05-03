import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete related records
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Delete the user
    const deleted = await prisma.user.delete({
      where: { email },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted user: ${deleted.username} (${deleted.email})`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete user" },
      { status: 500 }
    );
  }
}
