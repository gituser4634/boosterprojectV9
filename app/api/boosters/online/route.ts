import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/boosters/online
 * Returns list of currently online booster IDs and their basic info
 * 
 * Query params:
 *   - offlineAfterMs: milliseconds before marking as offline (default: 60000)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const offlineAfterMs = parseInt(
      searchParams.get("offlineAfterMs") || "60000"
    );

    const cutoffTime = new Date(Date.now() - offlineAfterMs);

    // Get all online boosters
    const onlineBoosters = await prisma.boosterProfile.findMany({
      where: {
        isOnline: true,
        lastSeenAt: {
          gte: cutoffTime,
        },
      },
      select: {
        id: true,
        userId: true,
        displayName: true,
        user: {
          select: {
            username: true,
            profilePictureUrl: true,
          },
        },
        mainGame: {
          select: {
            name: true,
          },
        },
        averageRating: true,
        successRate: true,
        xp: true,
      },
    });

    return NextResponse.json({
      onlineBoosters: onlineBoosters.map((b) => ({
        id: b.id,
        userId: b.userId,
        name: b.displayName || b.user.username,
        game: b.mainGame?.name || "All Games",
        rating: Number(b.averageRating).toFixed(1),
        success: b.successRate,
        avatar: b.user.profilePictureUrl,
        xp: b.xp,
      })),
      count: onlineBoosters.length,
    });
  } catch (error) {
    console.error("[Online] Error fetching online boosters:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Online] Full error details:", errorMessage);
    return NextResponse.json(
      { error: "Failed to fetch online boosters", details: errorMessage },
      { status: 500 }
    );
  }
}
