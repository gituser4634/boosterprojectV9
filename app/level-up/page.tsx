"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AuthLoginModal, AuthRegisterModal, TermsModal, ForgotPasswordModal, EmailVerificationModal } from "@/components/shared/auth-modals";

export default function LevelUpPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEmailVerificationOpen, setIsEmailVerificationOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [loginType, setLoginType] = useState<"booster" | "client">("client");
  const [registerType, setRegisterType] = useState<"booster" | "client">("client");
  const [registrationEmail, setRegistrationEmail] = useState("");

  const handleLoginSubmit = async (payload: { email: string; password: string; role: "booster" | "client" }) => {
    try {
      // Step 1: Verify the role matches the selected tab
      const roleCheckRes = await fetch("/api/auth/verify-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email }),
      });

      if (roleCheckRes.ok) {
        const { role } = await roleCheckRes.json();
        if (role.toLowerCase() !== payload.role.toLowerCase()) {
          return {
            ok: false,
            message: `This user is registered as a ${role.toLowerCase()}`,
          };
        }
      }

      // Step 2: Proceed with NextAuth login
      const result = await signIn("credentials", {
        redirect: false,
        email: payload.email,
        password: payload.password,
      });

      if (result?.error) {
        if (result.error.includes("EMAIL_NOT_VERIFIED")) {
          return { ok: false, message: "Please verify your email first. Check your inbox for the verification link." };
        }
        return { ok: false, message: "Invalid email or password." };
      }

      // Check the role from /api/auth/me to redirect appropriately
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      const role = data.user?.role as string;

      if (role === "BOOSTER") {
        window.location.href = "/booster-profile";
      } else {
        window.location.href = "/client-settings";
      }
      return { ok: true };
    } catch {
      return { ok: false, message: "Network error. Please try again." };
    }
  };

  const handleRegisterSubmit = async (payload: {
    username: string;
    email: string;
    country: string;
    password: string;
    role: "booster" | "client";
    displayName?: string;
  }) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: payload.username,
          email: payload.email,
          password: payload.password,
          role: payload.role.toUpperCase(),
          displayName: payload.displayName,
          country: payload.country,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, message: data.error ?? "Registration failed." };
      
      // Store email for verification and show verification modal
      setRegistrationEmail(payload.email);
      setIsRegisterOpen(false);
      setIsEmailVerificationOpen(true);
      
      return { ok: true, message: data.message ?? "Account created! Please verify your email." };
    } catch {
      return { ok: false, message: "Network error. Please try again." };
    }
  };


  return (
    <>
      <header className="ghost-border fixed top-0 z-50 w-full border-b border-white/15 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-8">
          <Link
            href="/"
            className="font-headline text-2xl font-bold tracking-tighter text-primary-fixed transition hover:text-primary"
          >
            Zenith Boost
          </Link>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsLoginOpen(true)}
              className="top-panel-link px-4 py-2"
            >
              Login
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsRegisterOpen(true)}>
              Register
            </Button>
          </div>
        </div>
      </header>

      <main className="relative min-h-screen overflow-hidden bg-black pt-20">
        <div className="absolute inset-0">
          <iframe
            title="Counter Strike 2 gameplay background"
            className="h-full w-full scale-[1.28] md:scale-[1.15]"
            src="https://www.youtube.com/embed/edYCtaNueQY?start=6&autoplay=1&mute=1&controls=0&loop=1&playlist=edYCtaNueQY&modestbranding=1&rel=0&playsinline=1"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          ></iframe>
          <div className="absolute inset-0 bg-black/55"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/85"></div>
        </div>

        <section className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center px-8">
          <div className="mx-auto w-full max-w-5xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-secondary">Counter-Strike 2</p>
            <h1 className="font-headline max-w-3xl text-5xl font-black uppercase italic tracking-tight text-white md:text-7xl">
              Precision. Aim. Rank Up.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-200 md:text-lg">
              Join live CS2 boost sessions with verified high-ELO players. Track every match update in real
              time and level up with full visibility.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                type="button"
                variant="primary"
                size="lg"
                glow="cyan"
                onClick={() => setIsLoginOpen(true)}
                className="ghost-border hover:shadow-[0_0_36px_-6px_rgba(20,214,255,0.72)]"
              >
                Login
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                glow="violet"
                onClick={() => setIsRegisterOpen(true)}
                className="border-secondary/40 bg-surface-container-low/50 text-white backdrop-blur-sm hover:border-secondary hover:text-secondary"
              >
                Register
              </Button>
              <Button asChild type="button" variant="outline" size="lg" className="border-white/25 bg-black/30 text-slate-200 hover:text-white">
                <Link href="/">Back Home</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <AuthLoginModal
        open={isLoginOpen}
        onOpenChange={setIsLoginOpen}
        loginType={loginType}
        onLoginTypeChange={setLoginType}
        onSubmit={handleLoginSubmit}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
        onForgotPassword={() => {
          setIsLoginOpen(false);
          setIsForgotPasswordOpen(true);
        }}
      />

      <AuthRegisterModal
        open={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
        registerType={registerType}
        onRegisterTypeChange={setRegisterType}
        onSubmit={handleRegisterSubmit}
        onOpenTerms={() => setIsTermsOpen(true)}
      />

      <EmailVerificationModal
        open={isEmailVerificationOpen}
        onOpenChange={setIsEmailVerificationOpen}
        email={registrationEmail}
        onVerificationSuccess={() => {
          setRegistrationEmail("");
          // User can now login with verified email
          setIsLoginOpen(true);
        }}
      />

      <TermsModal open={isTermsOpen} onOpenChange={setIsTermsOpen} />

      <ForgotPasswordModal open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
    </>
  );
}
