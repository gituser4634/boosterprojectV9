"use client";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

function AblyErrorSuppressor() {
  useEffect(() => {
    // Suppress all Ably detach/attach errors
    const originalError = console.error;
    const originalWarn = console.warn;
    
    const isAblyError = (arg: any): boolean => {
      const str = arg?.toString() || "";
      return (
        str.includes("Unable to attach") ||
        str.includes("Unable to detach") ||
        str.includes("state = detached") ||
        str.includes("Ably") && (str.includes("detach") || str.includes("attach"))
      );
    };

    console.error = function (...args: any[]) {
      // Check if this is an Ably error
      if (args.some(isAblyError)) {
        return; // Silently suppress
      }
      originalError.apply(console, args);
    };

    console.warn = function (...args: any[]) {
      if (args.some(isAblyError)) {
        return;
      }
      originalWarn.apply(console, args);
    };

    // Also set up a global error handler for uncaught errors
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes("Unable to attach") || event.message?.includes("state = detached")) {
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AblyErrorSuppressor />
      {children}
    </SessionProvider>
  );
}
