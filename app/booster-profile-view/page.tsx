import { BoosterProfileView, BoosterProfileData } from "@/components/booster/booster-profile-view";
import { prisma } from "@/lib/prisma";

export default async function BoosterProfileViewPage() {
  let profileOverrides: Partial<BoosterProfileData> = {};
  
  try {
    const boosterProfile = await prisma.boosterProfile.findFirst({
      include: {
        user: true,
        mainGame: true,
        boosterGames: {
          include: {
            rank: true
          }
        },
        reviews: {
          include: {
            customer: true
          },
          take: 4,
          orderBy: {
            createdAt: 'desc'
          }
        },
        languages: true
      }
    });

    if (boosterProfile) {
      const completedOrders = await prisma.order.count({
        where: {
          boosterId: boosterProfile.id,
          status: "COMPLETED"
        }
      });

      const mainBoosterGame = boosterProfile.boosterGames.find(bg => bg.gameId === boosterProfile.mainGameId);

      profileOverrides = {
        boosterId: boosterProfile.id,
        username: boosterProfile.user.username,
        alias: boosterProfile.displayName,
        rating: Number(boosterProfile.averageRating),
        hoursPlayed: boosterProfile.hours.toString(),
        successRate: `${boosterProfile.successRate}%`,
        totalOrders: boosterProfile.totalReviews,
        mainGame: boosterProfile.mainGame.name,
        mainRank: mainBoosterGame?.rank.name || "Unranked",
        origin: boosterProfile.country,
        languages: boosterProfile.languages.map(l => l.language),
        joinDate: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(boosterProfile.createdAt),
        reviews: boosterProfile.reviews.map(r => ({
          id: r.id,
          name: r.customer.displayName,
          summary: "Verified Client",
          rating: (r.rating >= 4 ? r.rating : 5) as 4 | 5,
          comment: r.comment,
          tone: (["primary", "secondary", "tertiary"][Math.floor(Math.random() * 3)]) as "primary" | "secondary" | "tertiary"
        }))
      };
    }
  } catch (error) {
    console.error("Failed to fetch booster for preview:", error);
  }

  return <BoosterProfileView profileOverrides={profileOverrides} />;
}
