"use client";

import { useEffect, useRef, useCallback } from "react";
import * as React from "react";
import { useSession } from "next-auth/react";

const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
const OFFLINE_AFTER_MS = 60 * 1000; // 1 minute

/**
 * usePresence
 *
 * Manages a booster's online presence:
 * - Sets isOnline=true on mount and every heartbeat
 * - Sets isOnline=false on unmount
 * - Pauses on page visibility change (tab hidden)
 * - Auto-marks as offline if no heartbeat for 1 minute
 *
 * Usage:
 *   export default function BoosterDashboard() {
 *     usePresence();
 *     // ... rest of component
 *   }
 */
export function usePresence() {
  const { data: session } = useSession();
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(0);
  const isCleaningUpRef = useRef(false);

  // Update online status
  const updatePresence = useCallback(
    async (isOnline: boolean) => {
      if (!session?.user?.id) return;

      try {
        const res = await fetch(`/api/users/${session.user.id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOnline }),
        });

        if (!res.ok) {
          console.warn("[Presence] Failed to update status:", res.statusText);
          return;
        }

        if (isOnline) {
          lastHeartbeatRef.current = Date.now();
        }

        console.log(
          `[Presence] ${isOnline ? "🟢 Online" : "⚫ Offline"}`
        );
      } catch (error) {
        console.error("[Presence] Error updating status:", error);
      }
    },
    [session?.user?.id]
  );

  // Cleanup: set offline on unmount
  useEffect(() => {
    return () => {
      if (isCleaningUpRef.current) return;
      isCleaningUpRef.current = true;
      updatePresence(false);
    };
  }, [updatePresence]);

  // Heartbeat: keep alive every 30 seconds
  useEffect(() => {
    if (!session?.user?.id) return;

    // Initial presence
    updatePresence(true);

    // Heartbeat
    heartbeatRef.current = setInterval(() => {
      updatePresence(true);
    }, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [session?.user?.id, updatePresence]);

  // Handle page visibility (tab hidden = offline)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("[Presence] Page hidden, setting offline");
        updatePresence(false);
      } else {
        console.log("[Presence] Page visible, setting online");
        updatePresence(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [updatePresence]);

  // Handle window beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      isCleaningUpRef.current = true;
      // Synchronous fetch won't work here, but we can try with keepalive
      if (session?.user?.id) {
        navigator.sendBeacon(
          `/api/users/${session.user.id}/status`,
          JSON.stringify({ isOnline: false })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [session?.user?.id]);
}

/**
 * Hook to get and monitor a list of all online boosters
 * 
 * Usage:
 *   const { onlineBoosters, isLoading, error } = useOnlineBoosters();
 */
export function useOnlineBoosters(
  pollIntervalMs: number = 10 * 1000
) {
  const [onlineBoosters, setOnlineBoosters] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const pollRef = React.useRef<NodeJS.Timeout | null>(null);

  const fetchOnlineBoosters = React.useCallback(async () => {
    try {
      const res = await fetch("/api/boosters/online");

      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `[Presence] API error ${res.status}:`,
          errorText
        );
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setOnlineBoosters(data.onlineBoosters || []);
      setError(null);
    } catch (err) {
      console.error("[Presence] Failed to fetch online boosters:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and polling
  React.useEffect(() => {
    fetchOnlineBoosters();

    pollRef.current = setInterval(fetchOnlineBoosters, pollIntervalMs);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [fetchOnlineBoosters, pollIntervalMs]);

  return { onlineBoosters, isLoading, error };
}

/**
 * Utility to check if a booster is online
 */
export function isBoosterOnline(
  boosterId: string,
  onlineBoosters: any[]
): boolean {
  return onlineBoosters.some((b) => b.id === boosterId);
}
