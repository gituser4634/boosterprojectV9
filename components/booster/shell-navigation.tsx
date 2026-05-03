import Image from "next/image";
import Link from "next/link";
import { ClipboardList, Crown, HelpCircle, LayoutDashboard, MessageSquare, Settings, Wallet } from "lucide-react";
import { BOOSTER_RANKS, calculateBoosterRank } from "@/lib/booster-ranks";

import { Button } from "@/components/ui/button";

type BoosterSection = "dashboard" | "requests" | "payments" | "chats" | "settings";

type BoosterSidebarProps = {
  active: BoosterSection;
  isOnline: boolean;
  onToggleOnline: () => void;
  mainGame?: string;
  rankInfo?: {
    name: string;
    color: string;
    icon: string;
    minXp: number;
  };
  xp?: number;
};

type BoosterMobileNavProps = {
  active: BoosterSection;
  avatarUrl?: string;
};

const navItems: Array<{ key: BoosterSection; label: string; mobileLabel: string; href: string }> = [
  { key: "dashboard", label: "Dashboard", mobileLabel: "DASH", href: "/booster-dashboard" },
  { key: "requests", label: "Requests", mobileLabel: "REQS", href: "/booster-requests" },
  { key: "payments", label: "Payments", mobileLabel: "PAY", href: "/booster-payments" },
  { key: "chats", label: "Chats", mobileLabel: "CHAT", href: "/booster-chats" },
];

const getIcon = (key: BoosterSection) => {
  if (key === "dashboard") return <LayoutDashboard className="h-5 w-5" />;
  if (key === "requests") return <ClipboardList className="h-5 w-5" />;
  if (key === "payments") return <Wallet className="h-5 w-5" />;
  return <MessageSquare className="h-5 w-5" />;
};

function BoosterSidebar({ active, isOnline, onToggleOnline, mainGame, rankInfo, xp = 0 }: BoosterSidebarProps) {
  const sidebarMainGame = mainGame?.trim() || "Not Set";
  
  // Calculate rank from XP if rankInfo is missing or mismatched
  const currentRank = rankInfo || calculateBoosterRank(xp);
  
  // Calculate next rank and progress
  const nextRank = BOOSTER_RANKS.find((r: any) => r.minXp > currentRank.minXp) || null;
  const xpInLevel = xp - currentRank.minXp;
  const xpNeededForNext = nextRank ? nextRank.minXp - currentRank.minXp : 1000;
  const progressPct = nextRank ? Math.min(Math.floor((xpInLevel / xpNeededForNext) * 100), 100) : 100;

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-white/15 bg-[#04060a]/95 pt-20 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <div className="mb-4 flex flex-col items-center border-b border-white/5 px-6 py-4">
        <div className="ghost-border mb-2 flex h-16 w-16 items-center justify-center rounded-xl bg-surface-container-highest" style={{ borderColor: `${currentRank.color}44` }}>
          <Crown className="h-8 w-8" style={{ color: currentRank.color }} />
        </div>
        <h3 className="font-headline font-bold text-on-surface" style={{ color: currentRank.color }}>{currentRank.name}</h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Main Game: {sidebarMainGame}</p>
        <div className="mt-3 w-full space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <span>{currentRank.name} XP</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div className="h-full" style={{ width: `${progressPct}%`, backgroundColor: currentRank.color, boxShadow: `0 0 10px ${currentRank.color}66` }}></div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70" style={{ color: currentRank.color }}>{xp} / {nextRank ? nextRank.minXp : "MAX"} XP</p>
        </div>
      </div>

      <nav className="font-label flex grow flex-col gap-2 p-4 text-sm font-semibold tracking-wide">
        {navItems.map((item) => {
          if (item.key === active) {
            return (
              <div key={item.key} className="flex items-center gap-3 rounded-l-lg border-r-2 border-cyan-400 bg-cyan-400/10 p-3 text-cyan-400">
                {getIcon(item.key)}
                <span>{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-3 text-slate-500 transition-all duration-300 hover:translate-x-1 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300 hover:shadow-[0_0_22px_rgba(34,211,238,0.25)] active:opacity-80"
            >
              {getIcon(item.key)}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-5">
        <div className="mb-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="mb-3 flex items-center justify-between rounded-md border border-white/10 bg-surface-container-high/60 px-2.5 py-2">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-400" : "bg-slate-500"}`}></span>
            <span className="text-[11px] font-semibold text-on-surface-variant">{isOnline ? "Online" : "Offline"}</span>
          </div>
          <Button
            type="button"
            aria-pressed={isOnline}
            onClick={onToggleOnline}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isOnline ? "bg-cyan-400/70" : "bg-outline-variant"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full transition ${
                isOnline ? "translate-x-5 bg-slate-950" : "translate-x-1 bg-on-surface-variant"
              }`}
            ></span>
          </Button>
        </div>
        <a className="mb-1 flex items-center gap-3 rounded-lg px-4 py-2 text-slate-500 transition-all hover:bg-white/5 hover:text-slate-300" href="#">
          <HelpCircle className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Support</span>
        </a>
      </div>
    </aside>
  );
}

function BoosterMobileNav({ active, avatarUrl }: BoosterMobileNavProps) {
  const labelClass = "text-[10px] font-bold uppercase tracking-tighter";

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-white/10 bg-slate-950/90 px-4 backdrop-blur-xl md:hidden">
      {navItems.map((item) => {
        const isActive = item.key === active;
        return (
          <Link key={item.key} href={item.href} className={`flex flex-col items-center gap-1 ${isActive ? "text-cyan-400" : "text-slate-500"}`}>
            {getIcon(item.key)}
            <span className={labelClass}>{item.mobileLabel}</span>
          </Link>
        );
      })}
      <Link href="/booster-profile" className="flex flex-col items-center gap-1 text-slate-500">
        {avatarUrl ? (
          <Image alt="Profile" className="h-6 w-6 rounded-full grayscale" src={avatarUrl} width={24} height={24} unoptimized />
        ) : (
          <Settings className="h-5 w-5" />
        )}
        <span className={labelClass}>Account</span>
      </Link>
    </nav>
  );
}

export { BoosterMobileNav, BoosterSidebar };