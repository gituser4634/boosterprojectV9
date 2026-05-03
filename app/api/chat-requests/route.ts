import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/chat-requests
 *
 * For a BOOSTER: returns all incoming PENDING requests (their message requests inbox).
 * For a CLIENT : returns their own outgoing requests.
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
      const requests = await prisma.chatRequest.findMany({
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
      });
      return NextResponse.json({ requests });
    }

    // CLIENT — their sent requests
    const requests = await prisma.chatRequest.findMany({
      where: { senderId: userId },
      include: {
        receiver: {
          select: { id: true, displayName: true, username: true, profilePictureUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("chat-requests GET error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

/**
 * POST /api/chat-requests
 * Body: { boosterUserId: string }
 *
 * Only CLIENTS can call this. Creates a new PENDING chat request to a booster.
 * Idempotent — if a request between the same pair already exists, returns it.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Only clients can send chat requests." }, { status: 403 });
  }

  const { boosterUserId } = await req.json();
  if (!boosterUserId) {
    return NextResponse.json({ error: "boosterUserId is required." }, { status: 400 });
  }

  const clientId = session.user.id;

  try {
    // Verify target is a booster
    const booster = await prisma.user.findUnique({
      where: { id: boosterUserId },
      select: { id: true, role: true },
    });

    if (!booster || booster.role !== "BOOSTER") {
      return NextResponse.json({ error: "Target user is not a booster." }, { status: 404 });
    }

    let chatRequest = await prisma.chatRequest.findUnique({
      where: { senderId_receiverId: { senderId: clientId, receiverId: boosterUserId } },
    });

    if (!chatRequest) {
      chatRequest = await prisma.chatRequest.create({
        data: { senderId: clientId, receiverId: boosterUserId },
      });
    }

    return NextResponse.json({ chatRequest }, { status: 201 });
  } catch (error: any) {
    console.error("chat-requests POST error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/chat-requests
 * Body: { chatRequestId: string, action: "accept" | "decline" }
 *
 * Only the BOOSTER (receiver) can accept or decline.
 */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { chatRequestId, action } = await req.json();

  if (!chatRequestId || !["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "chatRequestId and action ('accept' | 'decline') are required." }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    const chatRequest = await prisma.chatRequest.findUnique({
      where: { id: chatRequestId },
      select: { receiverId: true, status: true },
    });

    if (!chatRequest) {
      return NextResponse.json({ error: "Chat request not found." }, { status: 404 });
    }

    if (chatRequest.receiverId !== userId) {
      return NextResponse.json({ error: "Only the receiver (booster) can respond to this request." }, { status: 403 });
    }

    if (chatRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Request is no longer pending." }, { status: 409 });
    }

    const updated = await prisma.chatRequest.update({
      where: { id: chatRequestId },
      data: { status: action === "accept" ? "ACCEPTED" : "DECLINED" },
    });

    return NextResponse.json({ chatRequest: updated });
  } catch (error) {
    console.error("chat-requests PATCH error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
