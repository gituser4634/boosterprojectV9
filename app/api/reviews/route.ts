import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addBoosterXp, XP_REWARDS } from "@/lib/xp-service";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let boosterId = searchParams.get("boosterId");

    if (!boosterId) {
      return NextResponse.json({ error: "Booster ID is required" }, { status: 400 });
    }

    // If boosterId is not a UUID, treat it as a username and resolve the real ID
    if (!UUID_REGEX.test(boosterId)) {
      const profile = await prisma.boosterProfile.findFirst({
        where: { user: { username: boosterId } },
        select: { id: true }
      });
      if (!profile) {
        return NextResponse.json({ reviews: [] });
      }
      boosterId = profile.id;
    }

    const reviews = await prisma.review.findMany({
      where: { boosterId },
      include: {
        customer: {
          select: {
            displayName: true,
            username: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { orderId, rating, comment } = await req.json();

    if (!orderId || !rating) {
      return NextResponse.json({ error: "Order ID and rating are required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // 1. Check if order exists and is completed
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "COMPLETED") {
      return NextResponse.json({ error: "Can only review completed orders" }, { status: 400 });
    }

    // 2. Check if review already exists for this order
    if (order.review) {
      return NextResponse.json({ error: "Review already exists for this order" }, { status: 409 });
    }

    // 3. Create review and update booster stats in a transaction
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          orderId,
          boosterId: order.boosterId,
          customerId: order.customerId,
          rating,
          comment: comment || "",
        },
      });

      // Update booster stats
      const booster = await tx.boosterProfile.findUnique({
        where: { id: order.boosterId },
        select: { averageRating: true, totalReviews: true }
      });

      if (booster) {
        const newTotalReviews = booster.totalReviews + 1;
        const currentTotalScore = Number(booster.averageRating) * booster.totalReviews;
        const newAverageRating = (currentTotalScore + rating) / newTotalReviews;

        await tx.boosterProfile.update({
          where: { id: order.boosterId },
          data: {
            totalReviews: newTotalReviews,
            averageRating: newAverageRating,
            xp: {
              increment: XP_REWARDS.REVIEW_RECEIVED
            }
          },
        });
      }

      return newReview;
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    console.error("Failed to create review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
