import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const { username, displayName, email, profilePictureUrl } = body;

    // Validate username uniqueness if it's being changed
    if (username) {
      const existing = await prisma.user.findFirst({
        where: { username, NOT: { id: userId } },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username ? { username } : {}),
        ...(displayName !== undefined ? { displayName } : {}),
        ...(email ? { email: email.trim().toLowerCase() } : {}),
        ...(profilePictureUrl !== undefined ? { profilePictureUrl } : {}),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        profilePictureUrl: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
