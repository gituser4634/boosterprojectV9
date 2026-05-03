import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type StatusUpdateBody = {
  isOnline: boolean;
};

/**
 * PUT /api/users/[id]/status
 * Updates a user's online status and last seen timestamp.
 * 
 * Query params:
 *   - offlineAfterMs: milliseconds before marking as offline (default: 60000)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Only allow users to update their own status
    if (session.user.id !== id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body: StatusUpdateBody = await req.json();
    const { isOnline } = body;

    if (typeof isOnline !== "boolean") {
      return NextResponse.json(
        { error: "isOnline must be a boolean" },
        { status: 400 }
      );
    }

    // Get the booster profile for this user
    const boosterProfile = await prisma.boosterProfile.findUnique({
      where: { userId: id },
    });

    if (!boosterProfile) {
      return NextResponse.json(
        { error: "Booster profile not found" },
        { status: 404 }
      );
    }

    // Update online status and last seen
    const updated = await prisma.boosterProfile.update({
      where: { id: boosterProfile.id },
      data: {
        isOnline,
        lastSeenAt: new Date(),
      },
      include: {
        user: true,
      },
    });

    console.log(
      `[Presence] Updated ${updated.user.username} to ${isOnline ? "online" : "offline"}`
    );

    return NextResponse.json({
      success: true,
      booster: {
        id: updated.id,
        isOnline: updated.isOnline,
        lastSeenAt: updated.lastSeenAt,
      },
    });
  } catch (error) {
    console.error("[Presence] Error updating status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/[id]/status
 * Gets a user's current online status.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const boosterProfile = await prisma.boosterProfile.findUnique({
      where: { userId: id },
      select: {
        id: true,
        isOnline: true,
        lastSeenAt: true,
        userId: true,
      },
    });

    if (!boosterProfile) {
      return NextResponse.json(
        { error: "Booster profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      booster: boosterProfile,
    });
  } catch (error) {
    console.error("[Presence] Error fetching status:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}
