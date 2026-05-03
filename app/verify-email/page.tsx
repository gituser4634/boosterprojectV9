"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X, Loader } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("No verification token provided.");
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus("success");
          setMessage("Email verified successfully!");
          setTimeout(() => router.push("/level-up"), 2000);
        } else {
          const data = await response.json();
          setStatus("error");
          setMessage(data.error || "Failed to verify email.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification.");
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-24">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/50 p-8 text-center">
        {status === "loading" && (
          <>
            <Loader className="mx-auto mb-4 h-12 w-12 animate-spin text-cyan-400" />
            <h1 className="mb-2 text-2xl font-bold text-white">Verifying your email...</h1>
            <p className="text-gray-400">Please wait while we verify your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <Check className="mx-auto mb-4 h-12 w-12 text-cyan-400" />
            <h1 className="mb-2 text-2xl font-bold text-white">Email Verified!</h1>
            <p className="mb-6 text-gray-400">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </>
        )}

        {status === "error" && (
          <>
            <X className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h1 className="mb-2 text-2xl font-bold text-white">Verification Failed</h1>
            <p className="mb-6 text-gray-400">{message}</p>
            <div className="space-y-3">
              <Link href="/level-up">
                <Button className="w-full">Back to Login</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
