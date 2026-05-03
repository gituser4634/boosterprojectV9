import { prisma } from "@/lib/prisma";

export const XP_REWARDS = {
  MESSAGE_SENT: 2,
  REVIEW_RECEIVED: 50,
  ORDER_COMPLETED: 200,
};

export async function addBoosterXp(boosterId: string, amount: number) {
  try {
    const profile = await prisma.boosterProfile.update({
      where: { id: boosterId },
      data: {
        xp: {
          increment: amount,
        },
      },
    });
    return profile;
  } catch (error) {
    console.error("Failed to update booster XP:", error);
    return null;
  }
}

export async function addBoosterXpByUserId(userId: string, amount: number) {
  try {
    const booster = await prisma.boosterProfile.findUnique({
      where: { userId },
    });
    
    if (booster) {
      return await addBoosterXp(booster.id, amount);
    }
    return null;
  } catch (error) {
    console.error("Failed to find booster for XP update:", error);
    return null;
  }
}
