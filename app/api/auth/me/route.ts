import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateBoosterRank } from "@/lib/booster-ranks";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        profilePictureUrl: true,
        isActive: true,
        createdAt: true,
        boosterProfile: {
          select: {
            id: true,
            displayName: true,
            bio: true,
            country: true,
            hourlyRate: true,
            hours: true,
            successRate: true,
            averageRating: true,
            totalReviews: true,
            mainGameId: true,
            xp: true,
            mainGame: {
              select: { name: true }
            },
            languages: { select: { language: true } },
            boosterGames: {
              include: {
                game: { select: { name: true } },
                rank: { select: { name: true } }
              }
            }
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Enrich with rank info if booster
    let enrichedUser = { ...user } as any;
    if (user.role === "BOOSTER" && user.boosterProfile) {
      const rankInfo = calculateBoosterRank(user.boosterProfile.xp || 0);
      enrichedUser.boosterProfile.rankInfo = rankInfo;
    }

    return NextResponse.json({ user: enrichedUser });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
