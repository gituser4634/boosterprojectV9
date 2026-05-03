import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      activeOrdersCount,
      pendingRequestsCount,
      newMessagesCount,
      unreadNotifications,
      monthlyPayments,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          status: { in: ["ACCEPTED", "IN_PROGRESS"] },
        },
      }),
      prisma.order.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.message.count({
        where: {
          isRead: false,
        },
      }),
      prisma.notification.count({
        where: {
          isRead: false,
        },
      }),
      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    const monthlyEarnings = Number(monthlyPayments._sum.amount ?? 0);

    const payload = {
      sessionActive: "0h 00m",
      activeOrdersCount,
      activeOrdersDeltaPct: 0,
      pendingRequestsCount,
      newRequestsCount: pendingRequestsCount,
      monthlyEarnings,
      newMessagesCount,
      incomingRequests: [],
      activeOrders: [],
      trendPoints: [0, 0, 0, 0, 0, 0, 0, 0],
      trendGrowthPct: 0,
      trendAvgWeekly: 0,
      recentMessages: [],
      activityFeed: [],
      eliteTopPct: 0,
      eliteRating: 0,
      unreadNotifications,
    };

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
