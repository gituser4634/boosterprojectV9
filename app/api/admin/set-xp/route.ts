import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Temporary admin endpoint — delete after use
export async function GET() {
  const TARGET_USER_ID = "4f3f8555-44f6-4ee6-84c8-2c56a73189fc";
  const XP_AMOUNT = 250000;

  try {
    const user = await prisma.user.findUnique({
      where: { id: TARGET_USER_ID },
      select: { id: true, username: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await prisma.boosterProfile.updateMany({
      where: { userId: TARGET_USER_ID },
      data: { xp: XP_AMOUNT },
    });

    return NextResponse.json({
      ok: true,
      user,
      updatedRows: result.count,
      xpSet: XP_AMOUNT,
      message: `XP set to ${XP_AMOUNT} for @${user.username}. They are now ELITE rank.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
