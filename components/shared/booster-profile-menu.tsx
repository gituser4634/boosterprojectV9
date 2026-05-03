"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ProfileAvatarButton } from "@/components/booster/profile-avatar-button";
import { Button } from "@/components/ui/button";

type BoosterProfileMenuProps = {
  avatarUrl: string;
  alt?: string;
};

export function BoosterProfileMenu({ avatarUrl, alt = "Booster profile avatar" }: BoosterProfileMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="relative z-[56]">
      <ProfileAvatarButton
        avatarUrl={avatarUrl}
        alt={alt}
        onClick={() => setIsOpen((current) => !current)}
      />

      {isOpen ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close profile menu"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[55] h-auto w-auto cursor-default rounded-none p-0"
          ></Button>
          <div className="ghost-border absolute right-0 top-10 z-[56] w-[220px] rounded-xl border border-white/10 bg-surface-container p-2 shadow-2xl">
            <Button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push("/booster-dashboard");
              }}
              variant="menu"
            >
              Dashboard
            </Button>
            <Button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push("/booster-profile");
              }}
              variant="menu"
            >
              Settings
            </Button>
            <Button
              type="button"
              onClick={handleLogout}
              variant="menuDanger"
            >
              Logout
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
