import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const session = await auth();

    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        // Exclude the current logged-in user so their own username shows as "Available"
        ...(session?.user?.id ? { NOT: { id: session.user.id } } : {}),
      },
      select: { id: true },
    });

    return NextResponse.json({ isUnique: !existingUser });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to check username uniqueness" },
      { status: 500 }
    );
  }
}
