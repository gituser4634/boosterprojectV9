"use client";

import Ably from "ably";
import { useEffect, useRef, useState, useCallback } from "react";

export type ChatMessage = {
  id: string;
  senderId: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "AUDIO";
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
    username: string;
    profilePictureUrl: string | null;
  };
};

type UseChatOptions = {
  /** One of these must be provided */
  orderId?: string;
  chatRequestId?: string;
  /** The current user's id — used to distinguish sent vs received */
  currentUserId: string;
};

type UseChatReturn = {
  messages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  sendMessage: (content: string, messageType?: "TEXT" | "IMAGE" | "AUDIO") => Promise<void>;
  error: string | null;
};

let ablyClient: Ably.Realtime | null = null;

function getAblyClient(): Ably.Realtime {
  if (!ablyClient) {
    console.log("[Ably] Initializing Ably Realtime client with token auth");
    ablyClient = new Ably.Realtime({
      authUrl: "/api/ably-token",
      authMethod: "GET",
      autoConnect: true,
      closeOnUnload: true,
      // Add timeout and logging
      logLevel: 2, // Enable debug logging
    });

    // Log connection errors
    ablyClient.connection.on((stateChange) => {
      console.log(`[Ably] Connection state:`, {
        previous: stateChange.previous,
        current: stateChange.current,
        reason: stateChange.reason,
      });
      if (stateChange.reason) {
        console.error(`[Ably] Connection error:`, stateChange.reason);
      }
    });
  }
  return ablyClient;
}

function channelName(opts: Pick<UseChatOptions, "orderId" | "chatRequestId">) {
  if (opts.orderId) return `chat:order:${opts.orderId}`;
  if (opts.chatRequestId) return `chat:request:${opts.chatRequestId}`;
  return null;
}

/**
 * useRealtimeChat
 *
 * Manages message state for a single chat thread (order or request-based).
 * - Fetches message history from the server on mount.
 * - Subscribes to the Ably channel for real-time incoming messages.
 * - Provides a `sendMessage` function that POSTs to the server (which then
 *   publishes to Ably — the sender also receives it via the subscription,
 *   so we deduplicate by message id).
 */
export function useRealtimeChat({
  orderId,
  chatRequestId,
  currentUserId,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track seen message ids to avoid duplicates when sender echoes back
  const seenIds = useRef<Set<string>>(new Set());
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  const channel = channelName({ orderId, chatRequestId });

  // ── Fetch history ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!channel) return;

    setIsLoading(true);
    setMessages([]);
    seenIds.current = new Set();

    const params = orderId
      ? `orderId=${orderId}`
      : `chatRequestId=${chatRequestId}`;

    console.log(`[Chat] Fetching message history for ${channel}`);

    fetch(`/api/messages?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) {
          const msgs: ChatMessage[] = data.messages;
          console.log(`[Chat] Loaded ${msgs.length} messages for ${channel}`);
          msgs.forEach((m) => seenIds.current.add(m.id));
          setMessages(msgs);
        }
        if (data.error) {
          console.error(`[Chat] Error loading messages:`, data.error);
          setError(data.error);
        }
      })
      .catch((err) => {
        console.error(`[Chat] Failed to load messages:`, err);
        setError("Failed to load messages.");
      })
      .finally(() => setIsLoading(false));
  }, [channel, orderId, chatRequestId]);

  // ── Ably subscription ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!channel) return;

    const ably = getAblyClient();

    const onConnectionChange = (stateChange: Ably.ConnectionStateChange) => {
      console.log(`[Ably] Connection state changed: ${stateChange.previous} -> ${stateChange.current}`);
      setIsConnected(stateChange.current === "connected");
    };

    ably.connection.on(onConnectionChange);

    const ablyChannel = ably.channels.get(channel);
    channelRef.current = ablyChannel;

    // Attach to channel with error handling
    ablyChannel.attach()
      .then(() => {
        console.log(`[Ably] Successfully attached to channel: ${channel}`);
      })
      .catch((err: Error) => {
        console.error(`[Ably] Failed to attach to channel ${channel}:`, err);
        setError(`Failed to connect to real-time: ${err.message}`);
      });

    ablyChannel.subscribe("message", (msg: Ably.Message) => {
      console.log(`[Ably] Received message on ${channel}:`, msg.data);
      const incoming: ChatMessage = msg.data;
      if (!incoming?.id) {
        console.warn("[Ably] Received message without id:", incoming);
        return;
      }
      if (seenIds.current.has(incoming.id)) {
        console.log("[Ably] Duplicate message ignored:", incoming.id);
        return; // deduplicate
      }
      seenIds.current.add(incoming.id);
      console.log("[Ably] Adding new message to state:", incoming.id);
      setMessages((prev) => [...prev, incoming]);
    });

    return () => {
      try {
        console.log(`[Ably] Cleaning up channel: ${channel}`);
        
        // Remove all listeners
        ablyChannel.unsubscribe();
        ably.connection.off(onConnectionChange);
        
        // Don't attempt to detach - just let the channel clean up on its own
        // Detach is causing the error, so we'll skip it entirely
      } catch (err) {
        // Suppress any errors during cleanup
      } finally {
        channelRef.current = null;
      }
    };
  }, [channel]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string, messageType: "TEXT" | "IMAGE" | "AUDIO" = "TEXT") => {
      if (!content.trim()) {
        console.warn("[Chat] Empty message, not sending");
        return;
      }

      const body: Record<string, string> = { content, messageType };
      if (orderId) body.orderId = orderId;
      if (chatRequestId) body.chatRequestId = chatRequestId;

      console.log("[Chat] Sending message:", { orderId, chatRequestId, contentLength: content.length, messageType });

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[Chat] Failed to send message:", data);
        throw new Error(data.error ?? "Failed to send message.");
      }
      
      console.log("[Chat] Message sent successfully");
    },
    [orderId, chatRequestId]
  );

  return { messages, isConnected, isLoading, sendMessage, error };
}
