import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase() },
      select: { role: true },
    });

    if (!user) {
      // Return 404 so the client knows the user doesn't exist
      // The client will proceed to NextAuth which will return "Invalid credentials"
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ role: user.role });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
