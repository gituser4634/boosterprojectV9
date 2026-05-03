import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;
  const userRole = session.user.role;

  if (userRole !== "BOOSTER") {
    return NextResponse.json({ error: "Only boosters can update booster profile." }, { status: 403 });
  }

  try {
    const body = await req.json();
    console.log("Booster Profile Update Body:", body);
    const { alias, bio, hourlyRate, country, languages, mainGameName, activeGames } = body;

    // Find their booster profile
    const profile = await prisma.boosterProfile.findUnique({
      where: { userId: userId },
      select: { id: true },
    });

    if (!profile) {
      console.error("Booster profile not found for user:", userId);
      return NextResponse.json({ error: "Booster profile not found." }, { status: 404 });
    }

    // Prepare data for update
    const updateData: any = {};
    if (alias !== undefined) updateData.displayName = alias;
    if (bio !== undefined) updateData.bio = bio;
    if (hourlyRate !== undefined) {
      const parsed = parseFloat(hourlyRate);
      if (!isNaN(parsed)) {
        updateData.hourlyRate = parsed;
      }
    }
    if (country !== undefined) updateData.country = country;

    // Handle Main Game if provided by name
    if (mainGameName) {
      const game = await prisma.game.findFirst({ 
        where: { name: { equals: mainGameName, mode: 'insensitive' } } 
      });
      if (game) {
        updateData.mainGameId = game.id;
      } else {
        console.warn("Game not found (case-insensitive search):", mainGameName);
      }
    }

    // Update profile fields
    console.log("Updating BoosterProfile with:", updateData);
    const updated = await prisma.boosterProfile.update({
      where: { id: profile.id },
      data: updateData,
    });

    // Use a transaction to ensure atomicity for languages and games
    await prisma.$transaction(async (tx) => {
      // Replace languages if provided
      if (Array.isArray(languages)) {
        console.log("Updating languages:", languages);
        await tx.boosterLanguage.deleteMany({ where: { boosterId: profile.id } });
        if (languages.length > 0) {
          await tx.boosterLanguage.createMany({
            data: languages.map((lang: string) => ({
              boosterId: profile.id,
              language: lang,
            })),
          });
        }
      }

      // Replace games if provided
      if (Array.isArray(activeGames)) {
        console.log("Updating active games:", activeGames);
        await tx.boosterGame.deleteMany({ where: { boosterId: profile.id } });
        
        for (const g of activeGames) {
          const game = await tx.game.findFirst({ 
            where: { name: { equals: g.name, mode: 'insensitive' } } 
          });
          if (game) {
            const rank = await tx.rank.findFirst({ 
              where: { 
                gameId: game.id, 
                name: { equals: g.rank, mode: 'insensitive' } 
              } 
            });
            if (rank) {
              await tx.boosterGame.create({
                data: {
                  boosterId: profile.id,
                  gameId: game.id,
                  rankId: rank.id,
                  inGameUsername: g.accountId || "",
                }
              });
            } else {
              console.warn(`Rank not found for game ${game.name}:`, g.rank);
              // We throw to rollback the transaction if data is invalid
              throw new Error(`Invalid rank '${g.rank}' for game '${g.name}'.`);
            }
          } else {
            console.warn("Game not found for active games list:", g.name);
            throw new Error(`Game '${g.name}' not found in database.`);
          }
        }
      }
    });

    return NextResponse.json({ ok: true, profile: updated });
  } catch (error: any) {
    console.error("Booster profile update error:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}
