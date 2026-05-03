import Ably from "ably";

// Server-side Ably REST client (used for token auth and server publish)
let ably: Ably.Rest | null = null;

export function getAblyServer(): Ably.Rest {
  if (!ably) {
    const key = process.env.ABLY_API_KEY;
    if (!key) {
      throw new Error("ABLY_API_KEY is not set in environment variables.");
    }
    console.log("[Ably Server] Initializing REST client");
    ably = new Ably.Rest({
      key,
      autoConnect: true,
    });
  }
  return ably;
}

/**
 * Returns a short-lived Ably token request object for a client.
 * The clientId is the user's DB id — used to identify the sender in channels.
 */
export async function createAblyTokenRequest(clientId: string) {
  try {
    console.log("[Ably Auth] Creating token request for clientId:", clientId);
    const server = getAblyServer();
    const tokenRequest = await server.auth.createTokenRequest({ 
      clientId,
      ttl: 60 * 60 * 1000, // 1 hour
    });
    console.log("[Ably Auth] Token request created successfully");
    return tokenRequest;
  } catch (error: any) {
    console.error("[Ably Auth] Failed to create token request:", error);
    throw error;
  }
}

/**
 * Channel naming conventions (keep in sync with the client hook):
 *  - Order chat:   chat:order:{orderId}
 *  - Request chat: chat:request:{chatRequestId}
 */
export function orderChannelName(orderId: string) {
  return `chat:order:${orderId}`;
}

export function requestChannelName(chatRequestId: string) {
  return `chat:request:${chatRequestId}`;
}
