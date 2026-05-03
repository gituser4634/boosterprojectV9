"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileAvatarButtonProps = {
  avatarUrl: string;
  alt: string;
  onClick: () => void;
  className?: string;
};

function ProfileAvatarButton({ avatarUrl, alt, onClick, className }: ProfileAvatarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("h-8 w-8 overflow-hidden rounded-full border border-primary/20 p-0 hover:bg-transparent", className)}
    >
      <img alt={alt} className="h-full w-full object-cover" src={avatarUrl} />
    </Button>
  );
}

export { ProfileAvatarButton };
