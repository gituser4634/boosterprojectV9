"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Check, X, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setStatus("error");
      setMessage("No reset token provided.");
      return;
    }
    setToken(tokenParam);
    setStatus("idle");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!password || !confirmPassword) {
      setMessage("Both password fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        setStatus("success");
        setMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => router.push("/level-up"), 2000);
      } else {
        const data = await response.json();
        setStatus("error");
        setMessage(data.error || "Failed to reset password.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "error" && !token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 py-24">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/50 p-8 text-center">
          <X className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h1 className="mb-2 text-2xl font-bold text-white">Invalid Reset Link</h1>
          <p className="mb-6 text-gray-400">{message}</p>
          <Link href="/level-up">
            <Button className="w-full">Back to Login</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 py-24">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/50 p-8 text-center">
          <Check className="mx-auto mb-4 h-12 w-12 text-cyan-400" />
          <h1 className="mb-2 text-2xl font-bold text-white">Password Reset Successful!</h1>
          <p className="text-gray-400">{message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-24">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/50 p-8">
        <h1 className="mb-2 text-2xl font-bold text-white">Reset Your Password</h1>
        <p className="mb-6 text-sm text-gray-400">Enter your new password below.</p>

        {message && (
          <div className={`mb-4 flex gap-2 rounded-lg p-3 ${status === "error" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
            {status === "error" && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
            <p className="text-sm">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>New Password</Label>
            <PasswordInput
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label>Confirm Password</Label>
            <PasswordInput
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Remember your password?{" "}
          <Link href="/level-up" className="text-cyan-400 hover:text-cyan-300">
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}
