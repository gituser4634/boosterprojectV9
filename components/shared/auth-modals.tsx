import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

type UserType = "booster" | "client";

const basePanelClassName =
  "ghost-border w-full transform-gpu rounded-2xl border border-outline/30 bg-surface-container p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)]";

const loginPanelClassName = `modal-panel-enter ${basePanelClassName} max-w-lg`;
const registerPanelClassName = `modal-panel-enter ${basePanelClassName} max-w-2xl`;
const termsPanelClassName = `${basePanelClassName} max-w-3xl`;

type LoginModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loginType: UserType;
  onLoginTypeChange: (type: UserType) => void;
  onSubmit: (payload: { email: string; password: string; role: UserType }) => Promise<{ ok: boolean; message?: string }>;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
  overlayClassName?: string;
  panelClassName?: string;
};

export function AuthLoginModal({
  open,
  onOpenChange,
  loginType,
  onLoginTypeChange,
  onSubmit,
  onSwitchToRegister,
  onForgotPassword,
  overlayClassName = "modal-overlay-enter fixed inset-0 z-[80] flex items-center justify-center bg-black/65 px-4",
  panelClassName = loginPanelClassName,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setStatusMessage("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmit({ email: trimmedEmail, password, role: loginType });
    setIsSubmitting(false);

    if (!result.ok) {
      setStatusMessage(result.message ?? "Login failed.");
      return;
    }

    setStatusMessage("Login successful.");
    setPassword("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className={overlayClassName} />
      <DialogContent className={`!left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 ${panelClassName}`}>
        <DialogTitle className="sr-only">Welcome Back</DialogTitle>
        <DialogDescription className="sr-only">Sign in as a booster or client to continue.</DialogDescription>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-headline text-3xl font-bold tracking-tight text-primary-fixed">Welcome Back</h3>
            <p className="mt-2 text-sm text-on-surface-variant">Sign in as a booster or client to continue.</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-surface-dim p-1">
          <Button
            type="button"
            variant="tab"
            size="sm"
            data-state={loginType === "booster" ? "active" : "inactive"}
            onClick={() => onLoginTypeChange("booster")}
            className="rounded-md"
          >
            Booster Login
          </Button>
          <Button
            type="button"
            variant="tab"
            size="sm"
            data-state={loginType === "client" ? "active" : "inactive"}
            onClick={() => onLoginTypeChange("client")}
            className="rounded-md"
          >
            Client Login
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label>{loginType === "booster" ? "Booster Email" : "Client Email"}</Label>
            <Input
              type="email"
              placeholder={loginType === "booster" ? "booster@email.com" : "client@email.com"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div>
            <Label>Password</Label>
            <PasswordInput
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {statusMessage ? <p className="text-xs text-on-surface-variant">{statusMessage}</p> : null}

          <Button type="submit" variant="primary" size="md" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : loginType === "booster" ? "Login as Booster" : "Login as Client"}
          </Button>
        </form>

        {onSwitchToRegister ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs">
            {onForgotPassword ? (
              <Button
                type="button"
                onClick={onForgotPassword}
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-secondary hover:bg-transparent hover:text-primary"
              >
                Forgot password?
              </Button>
            ) : (
              <div className="h-auto p-0 font-semibold text-secondary" />
            )}
            <div className="text-on-surface-variant">
              If you&apos;re new here,
              <Button
                type="button"
                onClick={onSwitchToRegister}
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0 font-semibold text-primary hover:bg-transparent hover:text-primary-fixed"
              >
                Register
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type RegisterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registerType: UserType;
  onRegisterTypeChange: (type: UserType) => void;
  onSubmit: (payload: {
    username: string;
    email: string;
    country: string;
    password: string;
    role: UserType;
    displayName?: string;
  }) => Promise<{ ok: boolean; message?: string }>;
  onOpenTerms: () => void;
  panelClassName?: string;
};

export function AuthRegisterModal({
  open,
  onOpenChange,
  registerType,
  onRegisterTypeChange,
  onSubmit,
  onOpenTerms,
  panelClassName = registerPanelClassName,
}: RegisterModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);

    if (!username.trim() || !email.trim() || !country.trim() || !password) {
      setStatusMessage("All required fields must be filled.");
      return;
    }

    if (!displayName.trim()) {
      setStatusMessage("Display name is required.");
      return;
    }

    if (password !== confirmPassword) {
      setStatusMessage("Password and confirmation do not match.");
      return;
    }

    if (!acceptedTerms) {
      setStatusMessage("You must accept terms and conditions first.");
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmit({
      username: username.trim(),
      email: email.trim(),
      country: country.trim(),
      password,
      role: registerType,
      displayName: displayName.trim(),
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setStatusMessage(result.message ?? "Registration failed.");
      return;
    }

    setStatusMessage("Account created successfully.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 z-[85] flex items-center justify-center bg-black/65 px-4 py-6" />
      <DialogContent className={`!left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 ${panelClassName}`}>
        <DialogTitle className="sr-only">
          {registerType === "booster" ? "Booster Inscription Form" : "Client Registration Form"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {registerType === "booster"
            ? "Fill your details to request a booster account."
            : "Create your client account to hire top-rated boosters."}
        </DialogDescription>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-headline text-3xl font-bold tracking-tight text-primary-fixed">
              {registerType === "booster" ? "Booster Inscription Form" : "Client Registration Form"}
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              {registerType === "booster"
                ? "Fill your details to request a booster account."
                : "Create your client account to hire top-rated boosters."}
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-surface-dim p-1">
          <Button
            type="button"
            variant="tab"
            size="sm"
            data-state={registerType === "booster" ? "active" : "inactive"}
            onClick={() => onRegisterTypeChange("booster")}
            className="rounded-md data-[state=active]:shadow-[0_8px_30px_-10px_rgba(20,214,255,0.6)]"
          >
            Booster Register
          </Button>
          <Button
            type="button"
            variant="tab"
            size="sm"
            data-state={registerType === "client" ? "active" : "inactive"}
            onClick={() => onRegisterTypeChange("client")}
            className="rounded-md data-[state=active]:shadow-[0_8px_30px_-10px_rgba(20,214,255,0.6)]"
          >
            Client Register
          </Button>
        </div>

        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <Label>Display Name</Label>
            <Input
              type="text"
              placeholder="Your public display name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>

          <div>
            <Label>Username</Label>
            <Input type="text" placeholder="Your username" value={username} onChange={(event) => setUsername(event.target.value)} />
          </div>

          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="you@email.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>

          <div>
            <Label>Country Of Origin</Label>
            <Input type="text" placeholder="Country" value={country} onChange={(event) => setCountry(event.target.value)} />
          </div>

          <div>
            <Label>Password</Label>
            <PasswordInput
              placeholder="Create password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div>
            <Label>Confirm Password</Label>
            <PasswordInput
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <div className="rounded-md border border-outline/20 bg-surface-dim/50 px-4 py-3 text-sm text-on-surface-variant">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-outline/40 bg-transparent accent-primary"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                />
                <span>
                  I accept the
                  <Button
                    type="button"
                    onClick={onOpenTerms}
                    variant="ghost"
                    size="sm"
                    className="mx-1 inline-block h-auto p-0 font-bold text-primary underline decoration-primary/70 underline-offset-4 hover:bg-transparent hover:text-primary-fixed"
                  >
                    Terms and Conditions
                  </Button>
                  and confirm that my registration information is accurate.
                </span>
              </label>
            </div>
          </div>

          {statusMessage ? <p className="md:col-span-2 text-xs text-on-surface-variant">{statusMessage}</p> : null}

          <div className="mt-2 md:col-span-2">
            <Button type="submit" variant="primary" size="md" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? "Creating account..."
                : registerType === "booster"
                  ? "Submit Booster Registration"
                  : "Create Client Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type TermsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panelClassName?: string;
};

export function TermsModal({
  open,
  onOpenChange,
  panelClassName = termsPanelClassName,
}: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-6" />
      <DialogContent className={panelClassName}>
        <DialogTitle className="sr-only">Terms and Conditions</DialogTitle>
        <DialogDescription className="sr-only">
          Please read before accepting booster inscription.
        </DialogDescription>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-headline text-3xl font-bold tracking-tight text-primary-fixed">Terms and Conditions</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Please read before accepting booster inscription.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-9 w-9 rounded-md"
            aria-label="Close terms and conditions"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto rounded-md border border-outline/20 bg-surface-dim/40 p-4 text-sm leading-relaxed text-on-surface-variant">
          <p>
            By submitting this form, you agree to provide true and accurate information. Any false information may result in refusal or suspension of your booster account.
          </p>
          <p>
            You are responsible for the security of your login credentials. Do not share your password with anyone and report suspicious activity immediately.
          </p>
          <p>
            Booster performance and conduct must follow platform standards, including respectful behavior, fair play, and compliance with game publisher policies.
          </p>
          <p>
            Payments, commissions, and account status are managed under platform rules and may be adjusted in case of abuse, fraud, or violation of these terms.
          </p>
          <p>
            Personal data is processed for account operations, fraud prevention, and service quality. By continuing, you acknowledge our data handling practices.
          </p>
          <p>
            Continued use of the platform means you accept updates to these terms when legally required, with notice provided through official channels.
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="button" variant="primary" size="sm" onClick={() => onOpenChange(false)}>
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type ForgotPasswordModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panelClassName?: string;
};

export function ForgotPasswordModal({
  open,
  onOpenChange,
  panelClassName = loginPanelClassName,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatusMessage("Email is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Submitting forgot password request for:", trimmedEmail);
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        setIsSuccess(true);
        setStatusMessage(data.message || "Reset link sent to your email.");
        setEmail("");
        setTimeout(() => {
          setIsSuccess(false);
          onOpenChange(false);
        }, 2000);
      } else {
        setStatusMessage(data.error || "Failed to send reset link.");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setStatusMessage("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="modal-overlay-enter fixed inset-0 z-[80] flex items-center justify-center bg-black/65 px-4" />
      <DialogContent className={`!left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 ${panelClassName}`}>
        <DialogTitle className="sr-only">Reset Password</DialogTitle>
        <DialogDescription className="sr-only">Enter your email to receive a password reset link.</DialogDescription>
        
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-headline text-3xl font-bold tracking-tight text-primary-fixed">Reset Password</h3>
            <p className="mt-2 text-sm text-on-surface-variant">Enter your email address to receive a password reset link.</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-on-surface-variant">{statusMessage}</p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {statusMessage && !isSuccess ? (
              <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded">{statusMessage}</p>
            ) : null}

            <Button type="submit" variant="primary" size="md" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-semibold text-secondary hover:bg-transparent hover:text-primary"
          >
            Back to Login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type EmailVerificationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onVerificationSuccess: () => void;
  panelClassName?: string;
};

export function EmailVerificationModal({
  open,
  onOpenChange,
  email,
  onVerificationSuccess,
  panelClassName = loginPanelClassName,
}: EmailVerificationModalProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);

    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length !== 6) {
      setStatusMessage("Please enter a valid 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: trimmedCode,
          email: email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setStatusMessage("Email verified successfully!");
        setCode("");
        setTimeout(() => {
          onVerificationSuccess();
          onOpenChange(false);
        }, 1500);
      } else {
        setStatusMessage(data.error || "Invalid verification code.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatusMessage("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="modal-overlay-enter fixed inset-0 z-[80] flex items-center justify-center bg-black/65 px-4" />
      <DialogContent className={`!left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 ${panelClassName}`}>
        <DialogTitle className="sr-only">Verify Email</DialogTitle>
        <DialogDescription className="sr-only">Enter the 6-digit code sent to your email.</DialogDescription>
        
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-headline text-3xl font-bold tracking-tight text-primary-fixed">Verify Your Email</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              We sent a 6-digit code to<br />
              <span className="font-semibold text-primary">{email}</span>
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="space-y-4 text-center py-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-on-surface-variant">{statusMessage}</p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="verification-code">6-Digit Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ''))}
                disabled={isSubmitting}
                className="text-center text-2xl tracking-widest"
              />
              <p className="mt-2 text-xs text-on-surface-variant">
                Check your email for the verification code. It will expire in 15 minutes.
              </p>
            </div>

            {statusMessage && !isSuccess ? (
              <p className="text-xs text-red-400">{statusMessage}</p>
            ) : null}

            <Button type="submit" variant="primary" size="md" className="w-full" disabled={isSubmitting || code.length !== 6}>
              {isSubmitting ? "Verifying..." : "Verify Email"}
            </Button>
          </form>
        )}

        {!isSuccess && (
          <div className="mt-4 text-center">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs font-semibold text-secondary hover:bg-transparent hover:text-primary"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
