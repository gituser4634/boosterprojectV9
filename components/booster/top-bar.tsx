"use client";

import Link from "next/link";
import { Bell, BellOff } from "lucide-react";

import { ProfileAvatarButton } from "@/components/booster/profile-avatar-button";
import { Button } from "@/components/ui/button";

type NotificationItem = {
  id: string;
  title: string;
  meta: string;
};

type BoosterTopBarProps = {
  brandLabel?: string;
  brandHref?: string;
  brandClassName?: string;
  headerClassName?: string;
  rightClassName?: string;
  avatarUrl: string;
  avatarAlt?: string;
  avatarBorderClassName?: string;
  isNotificationsOn: boolean;
  unreadNotificationCount: number;
  isNotificationsPanelOpen: boolean;
  onToggleNotificationsPanel: () => void;
  onCloseNotificationsPanel: () => void;
  onToggleNotifications: () => void;
  onMarkNotificationsRead: () => void;
  notifications: NotificationItem[];
  isProfileMenuOpen: boolean;
  onToggleProfileMenu: () => void;
  onCloseProfileMenu: () => void;
  onProfileAction: (action: "View Profile" | "Settings" | "Help Support" | "Logout") => void;
  navItems?: Array<{ key: string; label: string; href: string; icon: React.ReactNode; isActive: boolean }>;
};

const profileActions: Array<"View Profile" | "Settings" | "Help Support" | "Logout"> = [
  "View Profile",
  "Settings",
  "Help Support",
  "Logout",
];

function BoosterTopBar({
  brandLabel = "ZENITH BOOST",
  brandHref = "/",
  brandClassName = "font-headline text-2xl font-bold tracking-tighter text-cyan-400 transition hover:text-cyan-300",
  headerClassName = "fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/10 bg-slate-950/70 px-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-xl",
  rightClassName = "flex items-center gap-4",
  avatarUrl,
  avatarAlt = "Booster profile avatar",
  avatarBorderClassName = "border-primary/20",
  isNotificationsOn,
  unreadNotificationCount,
  isNotificationsPanelOpen,
  onToggleNotificationsPanel,
  onCloseNotificationsPanel,
  onToggleNotifications,
  onMarkNotificationsRead,
  notifications,
  isProfileMenuOpen,
  onToggleProfileMenu,
  onCloseProfileMenu,
  onProfileAction,
  navItems,
}: BoosterTopBarProps) {
  return (
    <header className={headerClassName}>
      <div className="flex items-center gap-8">
        <Link href={brandHref} className={brandClassName}>
          {brandLabel}
        </Link>
      </div>

      {/* Inline Navigation Icons (only visible when sidebar is hidden) */}
      {navItems && navItems.length > 0 && (
        <nav className="absolute left-1/2 top-1/2 z-[51] flex -translate-x-1/2 -translate-y-1/2 items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
                item.isActive
                  ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(143,245,255,0.15)]"
                  : "text-slate-500 hover:bg-white/5 hover:text-on-surface"
              }`}
              title={item.label}
            >
              {item.icon}
            </Link>
          ))}
        </nav>
      )}

      <div className={rightClassName}>
        <div className="relative z-[55]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleNotificationsPanel}
            className={`relative rounded-lg p-1 transition-all duration-200 active:scale-95 ${
              isNotificationsOn ? "text-cyan-300" : "text-red-400 hover:text-red-300"
            }`}
            aria-label="Toggle notifications panel"
          >
            {isNotificationsOn ? <Bell className="h-6 w-6" /> : <BellOff className="h-6 w-6" />}
            {unreadNotificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            ) : null}
          </Button>

          {isNotificationsPanelOpen ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close notifications panel"
                onClick={onCloseNotificationsPanel}
                className="fixed inset-0 z-[54] h-auto w-auto cursor-default rounded-none p-0"
              ></Button>
              <div className="ghost-border absolute right-0 top-10 z-[55] w-[320px] rounded-xl border border-white/10 bg-surface-container p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-headline text-sm font-bold uppercase tracking-wider text-on-surface">
                    Notifications
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onMarkNotificationsRead}
                    className="h-auto p-0 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-transparent hover:text-primary-container"
                  >
                    Mark Read
                  </Button>
                </div>

                <div className="space-y-2">
                  {notifications.map((item) => (
                    <div key={item.id} className="rounded-md border border-white/5 bg-surface-container-low px-3 py-2">
                      <p className="text-xs font-semibold text-on-surface">{item.title}</p>
                      <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">{item.meta}</p>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={onToggleNotifications}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-bold uppercase tracking-widest ${
                    isNotificationsOn
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
                      : "border-red-500/30 bg-red-500/15 text-red-300 hover:bg-red-500/25"
                  }`}
                >
                  {isNotificationsOn ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  {isNotificationsOn ? "Mute Notifications" : "Unmute Notifications"}
                </Button>
              </div>
            </>
          ) : null}
        </div>

        <div className="relative z-[56]">
          <ProfileAvatarButton
            avatarUrl={avatarUrl}
            alt={avatarAlt}
            onClick={onToggleProfileMenu}
            className={avatarBorderClassName}
          />

          {isProfileMenuOpen ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close profile menu"
                onClick={onCloseProfileMenu}
                className="fixed inset-0 z-[55] h-auto w-auto cursor-default rounded-none p-0"
              ></Button>
              <div className="ghost-border absolute right-0 top-10 z-[56] w-[220px] rounded-xl border border-white/10 bg-surface-container p-2 shadow-2xl">
                {profileActions.map((action) => (
                  <Button
                    key={action}
                    type="button"
                    onClick={() => onProfileAction(action)}
                    variant={action === "Logout" ? "menuDanger" : "menu"}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export type { NotificationItem };
export { BoosterTopBar };
