import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAblyTokenRequest } from "@/lib/ably";

/**
 * GET /api/ably-token
 * Returns a short-lived Ably token request for the authenticated user.
 * The browser-side Ably client uses this endpoint to obtain credentials.
 */
export async function GET(req: Request) {
  console.log("[Ably Token] Request received");
  
  const session = await auth();
  console.log("[Ably Token] Session:", session?.user?.id ? "authenticated" : "not authenticated");

  if (!session?.user?.id) {
    console.error("[Ably Token] Not authenticated");
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    console.log("[Ably Token] Creating token request for user:", session.user.id);
    const tokenRequest = await createAblyTokenRequest(session.user.id);
    console.log("[Ably Token] Token request created successfully");
    return NextResponse.json(tokenRequest);
  } catch (error: any) {
    console.error("[Ably Token] Error:", error);
    return NextResponse.json({ 
      error: "Failed to generate token.", 
      details: error?.message 
    }, { status: 500 });
  }
}
