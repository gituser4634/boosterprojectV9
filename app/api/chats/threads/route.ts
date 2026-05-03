import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/chats/threads
 *
 * Returns the booster's active chat threads built from:
 *  1. Orders where this booster is assigned (order-based chats)
 *  2. Accepted chat requests (non-order chats)
 *
 * Returns pending (PENDING) chat requests separately for the requests inbox.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = session.user.id;
  const role = session.user.role;

  try {
    if (role === "BOOSTER") {
      // Get the boosterProfile id
      const profile = await prisma.boosterProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!profile) {
        return NextResponse.json({ orderThreads: [], requestThreads: [], pendingRequests: [] });
      }

      const [orders, acceptedRequests, pendingRequests] = await Promise.all([
        // Order-based threads
        prisma.order.findMany({
          where: { boosterId: profile.id },
          include: {
            customer: {
              select: { id: true, displayName: true, username: true, profilePictureUrl: true },
            },
            game: { select: { name: true } },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
        }),
        // Accepted non-order chats
        prisma.chatRequest.findMany({
          where: { receiverId: userId, status: "ACCEPTED" },
          include: {
            sender: {
              select: { id: true, displayName: true, username: true, profilePictureUrl: true },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
        }),
        // Pending (inbox) requests
        prisma.chatRequest.findMany({
          where: { receiverId: userId, status: "PENDING" },
          include: {
            sender: {
              select: { id: true, displayName: true, username: true, profilePictureUrl: true },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return NextResponse.json({ orderThreads: orders, requestThreads: acceptedRequests, pendingRequests });
    }

    // CLIENT view
    const [orders, sentRequests] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: userId },
        include: {
          booster: {
            include: {
              user: {
                select: { id: true, displayName: true, username: true, profilePictureUrl: true },
              },
            },
          },
          game: { select: { name: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.chatRequest.findMany({
        where: { senderId: userId, status: { in: ["PENDING", "ACCEPTED"] } },
        include: {
          receiver: {
            select: { id: true, displayName: true, username: true, profilePictureUrl: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return NextResponse.json({ orderThreads: orders, requestThreads: sentRequests });
  } catch (error) {
    console.error("chats/threads GET error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
