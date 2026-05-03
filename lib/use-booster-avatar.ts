"use client";

import { useCallback, useEffect, useState } from "react";

const boosterAvatarStorageKey = "booster-avatar-url";
const boosterAvatarUpdatedEvent = "booster-avatar-updated";

const normalizeAvatarUrl = (value: string, fallbackAvatarUrl: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallbackAvatarUrl;
};

const readStoredAvatarUrl = (fallbackAvatarUrl: string) => {
  if (typeof window === "undefined") {
    return fallbackAvatarUrl;
  }

  try {
    const storedAvatarUrl = window.localStorage.getItem(boosterAvatarStorageKey);
    if (!storedAvatarUrl) {
      return fallbackAvatarUrl;
    }

    return normalizeAvatarUrl(storedAvatarUrl, fallbackAvatarUrl);
  } catch {
    return fallbackAvatarUrl;
  }
};

export function useBoosterAvatar(fallbackAvatarUrl: string) {
  const [avatarUrl, setAvatarUrl] = useState(fallbackAvatarUrl);

  useEffect(() => {
    const syncAvatarFromStorage = () => {
      setAvatarUrl(readStoredAvatarUrl(fallbackAvatarUrl));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== boosterAvatarStorageKey) {
        return;
      }

      syncAvatarFromStorage();
    };

    syncAvatarFromStorage();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(boosterAvatarUpdatedEvent, syncAvatarFromStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(boosterAvatarUpdatedEvent, syncAvatarFromStorage);
    };
  }, [fallbackAvatarUrl]);

  const setBoosterAvatarUrl = useCallback(
    (nextAvatarUrl: string) => {
      const normalizedAvatarUrl = normalizeAvatarUrl(nextAvatarUrl, fallbackAvatarUrl);

      try {
        window.localStorage.setItem(boosterAvatarStorageKey, normalizedAvatarUrl);
        window.dispatchEvent(new Event(boosterAvatarUpdatedEvent));
        setAvatarUrl(normalizedAvatarUrl);
        return true;
      } catch {
        return false;
      }
    },
    [fallbackAvatarUrl]
  );

  const resetBoosterAvatarUrl = useCallback(() => {
    return setBoosterAvatarUrl(fallbackAvatarUrl);
  }, [fallbackAvatarUrl, setBoosterAvatarUrl]);

  return {
    avatarUrl,
    setBoosterAvatarUrl,
    resetBoosterAvatarUrl,
  };
}
