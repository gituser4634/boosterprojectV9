import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db-retry";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const notifications = await withRetry(async () => prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }));

    const unreadCount = await withRetry(async () => prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }));

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      await withRetry(async () => prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      }));
    } else if (notificationId) {
      await withRetry(async () => prisma.notification.update({
        where: { id: notificationId, userId: session.user.id },
        data: { isRead: true },
      }));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Notification update error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
