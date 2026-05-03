import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAblyServer, orderChannelName, requestChannelName } from "@/lib/ably";

/**
 * GET /api/messages?orderId=<uuid>
 * GET /api/messages?chatRequestId=<uuid>
 *
 * Fetches persisted messages for an order chat or a request chat.
 * The caller must be a participant of that order/request.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const chatRequestId = searchParams.get("chatRequestId");

  if (!orderId && !chatRequestId) {
    return NextResponse.json({ error: "orderId or chatRequestId is required." }, { status: 400 });
  }

  try {
    if (orderId) {
      // Verify the caller is the customer or the booster of this order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { customerId: true, booster: { select: { userId: true } } },
      });

      if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

      const userId = session.user.id;
      const isParticipant =
        order.customerId === userId || order.booster.userId === userId;

      if (!isParticipant) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      const messages = await prisma.message.findMany({
        where: { orderId },
        include: { sender: { select: { id: true, displayName: true, username: true, profilePictureUrl: true } } },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({ messages });
    }

    // chatRequestId path
    const chatRequest = await prisma.chatRequest.findUnique({
      where: { id: chatRequestId! },
      select: { senderId: true, receiverId: true, status: true },
    });

    if (!chatRequest) return NextResponse.json({ error: "Chat request not found." }, { status: 404 });

    const userId = session.user.id;
    if (chatRequest.senderId !== userId && chatRequest.receiverId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { chatRequestId: chatRequestId! },
      include: { sender: { select: { id: true, displayName: true, username: true, profilePictureUrl: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

/**
 * POST /api/messages
 * Body: { orderId?: string, chatRequestId?: string, content: string }
 *
 * Saves the message to the DB and publishes it to the Ably channel.
 * Authorization rules:
 *  - Order chats: caller must be customer OR booster of that order.
 *  - Request chats: caller must be sender or receiver AND request must be ACCEPTED.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { orderId, chatRequestId, content, messageType } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Message content is required." }, { status: 400 });
  }

  if (!orderId && !chatRequestId) {
    return NextResponse.json({ error: "orderId or chatRequestId is required." }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    let channelName: string;

    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { customerId: true, booster: { select: { userId: true } } },
      });

      if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

      const isParticipant =
        order.customerId === userId || order.booster.userId === userId;

      if (!isParticipant) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

      channelName = orderChannelName(orderId);
    } else {
      const chatRequest = await prisma.chatRequest.findUnique({
        where: { id: chatRequestId },
        select: { senderId: true, receiverId: true, status: true },
      });

      if (!chatRequest) return NextResponse.json({ error: "Chat request not found." }, { status: 404 });
      if (chatRequest.status !== "ACCEPTED") {
        return NextResponse.json({ error: "Cannot message: request not accepted yet." }, { status: 403 });
      }
      if (chatRequest.senderId !== userId && chatRequest.receiverId !== userId) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      channelName = requestChannelName(chatRequestId);
    }

    // Persist to DB
    const message = await prisma.message.create({
      data: {
        senderId: userId,
        content: content.trim(),
        messageType: messageType ?? "TEXT",
        ...(orderId ? { orderId } : {}),
        ...(chatRequestId ? { chatRequestId } : {}),
      },
      include: {
        sender: { select: { id: true, displayName: true, username: true, profilePictureUrl: true } },
      },
    });

    // Publish to Ably channel (non-blocking, non-fatal)
    try {
      const ably = getAblyServer();
      const channel = ably.channels.get(channelName);
      
      // Serialize message properly for Ably (convert Date to string)
      const messageData = {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        messageType: message.messageType,
        createdAt: message.createdAt.toISOString(),
        sender: message.sender,
      };
      
      await channel.publish("message", messageData);
    } catch (ablyErr: any) {
      console.warn("Ably publish failed (real-time may be unavailable):", ablyErr.message);
    }

    // Format response for consistency
    const response = {
      id: message.id,
      senderId: message.senderId,
      content: message.content,
      messageType: message.messageType,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender,
    };

    return NextResponse.json({ message: response }, { status: 201 });
  } catch (error: any) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
