import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBoosterRank } from "@/lib/booster-ranks";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

  try {
    const boosters = await prisma.boosterProfile.findMany({
      include: {
        user: true,
        mainGame: true,
        boosterGames: {
          include: {
            rank: true
          }
        },
        reviews: true
      },
      orderBy: [
        { averageRating: 'desc' },
        { successRate: 'desc' }
      ],
      take: limit
    });

    const formattedBoosters = boosters.map(booster => {
      const mainBoosterGame = booster.boosterGames.find(bg => bg.gameId === booster.mainGameId);
      const defaultAvatar = "/booster-pfps/default-avatar.svg";
      
      const bRank = calculateBoosterRank(booster.xp || 0);
      
      return {
        id: booster.id,
        userId: booster.userId,
        name: booster.displayName || booster.user.username || "Anonymous Booster",
        game: booster.mainGame?.name || "All Games",
        rating: Number(booster.averageRating).toFixed(1),
        rank: mainBoosterGame?.rank.name || "ROOKIE",
        rankIcon: bRank.icon, 
        rankColor: bRank.color,
        boosterRank: bRank.name,
        success: booster.successRate || 100,
        rankValue: mainBoosterGame?.rank.order || 0,
        live: false,
        image: booster.user.profilePictureUrl || defaultAvatar,
        xp: booster.xp || 0
      };
    });

    return NextResponse.json(formattedBoosters);
  } catch (error) {
    console.error("Failed to fetch boosters:", error);
    return NextResponse.json({ error: "Failed to fetch boosters" }, { status: 500 });
  }
}
