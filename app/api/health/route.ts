import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const targetBoosterId = "4f3f8555-44f6-4ee6-84c8-2c56a73189fc";
    const updateResult = await prisma.$executeRaw`
      UPDATE "BoosterProfile"
      SET "xp" = 250000
      WHERE "id" = ${targetBoosterId}::uuid
    `;

    const boosters = await prisma.$queryRaw`
      SELECT bp."id", bp."xp", u."username"
      FROM "BoosterProfile" bp
      JOIN "User" u ON bp."userId" = u."id"
    `;

    return NextResponse.json({
      ok: true,
      updatedRows: updateResult,
      boosters,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "disconnected",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
