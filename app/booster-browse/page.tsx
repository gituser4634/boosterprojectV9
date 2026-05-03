"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { BadgeCheck, Brain, Diamond, Search, Shield, Sparkles, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AuthLoginModal, ForgotPasswordModal } from "@/components/shared/auth-modals";
import { ClientProfileMenu } from "@/components/shared/client-profile-menu";
import { BoosterProfileMenu } from "@/components/shared/booster-profile-menu";
import { BoosterTopBar } from "@/components/booster/top-bar";
import { useNotifications } from "@/hooks/use-notifications";
import { useOnlineBoosters, isBoosterOnline } from "@/hooks/use-presence";
import { Home, ClipboardList, MessageSquare, Settings as SettingsIcon, LayoutDashboard, Wallet } from "lucide-react";
import { ClientSidebar } from "@/components/client/shell-navigation";
import { BoosterSidebar } from "@/components/booster/shell-navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Booster = {
  id: string;
  name: string;
  game: string;
  rating: string;
  rank: string;
  rankIcon: string;
  success: number;
  rankColor?: string;
  boosterRank?: string;
  live: boolean;
  image: string;
  xp?: number;
};

const GAME_IMAGE_POOL: Record<string, string[]> = {
  "Apex Legends": [
    "https://i.ytimg.com/vi/oQtHENM_GZU/hqdefault.jpg",
    "https://i.ytimg.com/vi/BSUqA0K7JII/hqdefault.jpg",
    "https://i.ytimg.com/vi/QzfsGxrCD4o/hqdefault.jpg",
  ],
  Valorant: [
    "https://i.ytimg.com/vi/e_E9W2vsRbQ/hqdefault.jpg",
    "https://i.ytimg.com/vi/hhlgphVf-1g/hqdefault.jpg",
    "https://i.ytimg.com/vi/lWr6dhTcu-E/hqdefault.jpg",
  ],
  "League of Legends": [
    "https://i.ytimg.com/vi/IzMnCv_lPxI/hqdefault.jpg",
    "https://i.ytimg.com/vi/BGtROJeMPeE/hqdefault.jpg",
    "https://i.ytimg.com/vi/aR-KAldshAE/hqdefault.jpg",
  ],
  "Overwatch 2": [
    "https://i.ytimg.com/vi/wB8BTbExm8g/hqdefault.jpg",
    "https://i.ytimg.com/vi/GKXS_YA9s7E/hqdefault.jpg",
    "https://i.ytimg.com/vi/LGgqyer-qr4/hqdefault.jpg",
  ],
  "Counter-Strike 2": [
    "https://i.ytimg.com/vi/edYCtaNueQY/hqdefault.jpg",
    "https://i.ytimg.com/vi/ExZtISgOxEQ/hqdefault.jpg",
    "https://i.ytimg.com/vi/nSE38xjMLqE/hqdefault.jpg",
  ],
  "Dota 2": [
    "https://i.ytimg.com/vi/-cSFPIwMEq4/hqdefault.jpg",
    "https://i.ytimg.com/vi/Cp8neRiF9-k/hqdefault.jpg",
    "https://i.ytimg.com/vi/SmnqsdeHFT0/hqdefault.jpg",
  ],
  "Rocket League": [
    "https://i.ytimg.com/vi/SgSX3gOrj60/hqdefault.jpg",
    "https://i.ytimg.com/vi/OmMF9EDbmQQ/hqdefault.jpg",
    "https://i.ytimg.com/vi/lA4ITN8R0OY/hqdefault.jpg",
  ],
  Fortnite: [
    "https://i.ytimg.com/vi/2gUtfBmw86Y/hqdefault.jpg",
    "https://i.ytimg.com/vi/WJW-bzXZM8M/hqdefault.jpg",
    "https://i.ytimg.com/vi/K4wEI5zhHB0/hqdefault.jpg",
  ],
};

const GAME_RANK_POOL: Array<{
  game: string;
  icon: Booster["rankIcon"];
  ranks: Array<{ label: string; value: number }>;
}> = [
  {
    game: "Apex Legends",
    icon: "military_tech",
    ranks: [
      { label: "Apex Predator", value: 5 },
      { label: "Master", value: 4 },
      { label: "Diamond", value: 3 },
    ],
  },
  {
    game: "Valorant",
    icon: "workspace_premium",
    ranks: [
      { label: "Radiant", value: 5 },
      { label: "Immortal", value: 4 },
      { label: "Ascendant", value: 3 },
    ],
  },
  {
    game: "League of Legends",
    icon: "stars",
    ranks: [
      { label: "Challenger", value: 5 },
      { label: "Grandmaster", value: 4 },
      { label: "Master", value: 3 },
    ],
  },
  {
    game: "Overwatch 2",
    icon: "trophy",
    ranks: [
      { label: "Top 500", value: 5 },
      { label: "Grandmaster", value: 4 },
      { label: "Master", value: 3 },
    ],
  },
  {
    game: "Counter-Strike 2",
    icon: "military_tech",
    ranks: [
      { label: "Global Elite", value: 5 },
      { label: "Supreme", value: 4 },
      { label: "Legendary Eagle", value: 3 },
    ],
  },
  {
    game: "Dota 2",
    icon: "stars",
    ranks: [
      { label: "Immortal", value: 5 },
      { label: "Divine", value: 4 },
      { label: "Ancient", value: 3 },
    ],
  },
  {
    game: "Rocket League",
    icon: "trophy",
    ranks: [
      { label: "Supersonic Legend", value: 5 },
      { label: "Grand Champion", value: 4 },
      { label: "Champion", value: 3 },
    ],
  },
  {
    game: "Fortnite",
    icon: "workspace_premium",
    ranks: [
      { label: "Unreal", value: 5 },
      { label: "Champion", value: 4 },
      { label: "Elite", value: 3 },
    ],
  },
];

const NAME_PREFIXES = [
  "Zen",
  "Arc",
  "Pulse",
  "Vanta",
  "Nova",
  "Rune",
  "Ghost",
  "Cipher",
  "Drift",
  "Blaze",
  "Aero",
  "Axiom",
  "Echo",
  "Rogue",
  "Prime",
];

const NAME_SUFFIXES = [
  "Strike",
  "Specter",
  "Rift",
  "Hunter",
  "Knight",
  "Reaper",
  "Shroud",
  "Fang",
  "Pilot",
  "Volt",
  "Storm",
  "Onyx",
  "Havoc",
  "Frost",
  "Scout",
];

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pickRandom<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] as T;
}

function getGameImage(game: string, random: () => number, variantIndex?: number): string {
  const pool = GAME_IMAGE_POOL[game] ?? GAME_IMAGE_POOL["Apex Legends"];
  if (!pool || pool.length === 0) {
    return "https://i.ytimg.com/vi/oQtHENM_GZU/hqdefault.jpg";
  }

  if (typeof variantIndex === "number") {
    return pool[variantIndex % pool.length] as string;
  }

  return pickRandom(pool, random);
}

// DEFAULT_BOOSTERS removed to ensure only real data is shown.

function generateBoosterRoster(total: number, reservedNames: string[]): Booster[] {
  // Keeping this as a potential fallback or for mock data if needed
  return [];
}

function BoosterBrowsePageContent() {
  const { data: session } = useSession();
  const isClientLoggedIn = session?.user?.role === "CLIENT";
  const isBoosterLoggedIn = session?.user?.role === "BOOSTER";
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedRank, setSelectedRank] = useState("all");
  const [sortBy, setSortBy] = useState<"game" | "success" | "rating" | "rank">("rating");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginType, setLoginType] = useState<"booster" | "client">("booster");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const scope = searchParams.get("scope")?.toLowerCase();
  const searchScope = scope === "clients" || scope === "boosters" ? scope : "all";

  const [hideSidebar, setHideSidebar] = useState(false);
  const [isNotificationsOn, setIsNotificationsOn] = useState(true);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("zenith-hide-sidebar") === "true";
    setHideSidebar(saved);
  }, []);

  const { notifications: realNotifications, unreadCount: realUnreadCount, markAllAsRead } = useNotifications();
  const avatarUrl = session?.user?.image ?? "/booster-pfps/default-avatar.svg";

  const clientNavItems = [
    { key: "home", label: "Home", href: "/", icon: <Home className="h-5 w-5" />, isActive: false },
    { key: "browse", label: "Browse", href: "/booster-browse", icon: <Search className="h-5 w-5" />, isActive: false },
    { key: "orders", label: "Orders", href: "/client-orders", icon: <ClipboardList className="h-5 w-5" />, isActive: false },
    { key: "chats", label: "Messages", href: "/client-chats", icon: <MessageSquare className="h-5 w-5" />, isActive: false },
    { key: "settings", label: "Settings", href: "/client-settings", icon: <SettingsIcon className="h-5 w-5" />, isActive: false },
  ];

  const boosterNavItems = [
    { key: "dashboard", label: "Dashboard", href: "/booster-dashboard", icon: <LayoutDashboard className="h-5 w-5" />, isActive: false },
    { key: "requests", label: "Requests", href: "/booster-requests", icon: <ClipboardList className="h-5 w-5" />, isActive: false },
    { key: "payments", label: "Payments", href: "/booster-payments", icon: <Wallet className="h-5 w-5" />, isActive: false },
    { key: "chats", label: "Chats", href: "/booster-chats", icon: <MessageSquare className="h-5 w-5" />, isActive: false },
    { key: "settings", label: "Settings", href: "/booster-profile", icon: <SettingsIcon className="h-5 w-5" />, isActive: false },
  ];

  const currentNavItems = session?.user?.role === "BOOSTER" ? boosterNavItems : clientNavItems;

  useEffect(() => {
    setSearchText(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleLoginSubmit = async (payload: { email: string; password: string; role: "booster" | "client" }) => {
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: payload.email,
        password: payload.password,
        role: payload.role,
      });

      if (result?.error) {
        return { ok: false, message: result.error };
      }

      router.push(payload.role === "booster" ? "/booster-dashboard" : "/client-settings");
      return { ok: true, message: "Login successful!" };
    } catch (error) {
      return { ok: false, message: "An unexpected error occurred during login." };
    }
  };

  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [boosterProfile, setBoosterProfile] = useState<{ xp?: number; mainGame?: string; rankInfo?: any }>({});
  
  // Fetch booster profile data if logged in as booster
  useEffect(() => {
    if (isBoosterLoggedIn) {
      const fetchBoosterProfile = async () => {
        try {
          const response = await fetch("/api/booster-dashboard");
          if (response.ok) {
            const data = await response.json();
            setBoosterProfile({
              xp: data.xp,
              mainGame: data.mainGame,
              rankInfo: data.rankInfo,
            });
          }
        } catch (error) {
          console.error("Failed to fetch booster profile:", error);
        }
      };
      fetchBoosterProfile();
    }
  }, [isBoosterLoggedIn]);
  
  // Get online boosters with polling
  const { onlineBoosters } = useOnlineBoosters(15 * 1000); // Poll every 15 seconds

  useEffect(() => {
    const fetchBoosters = async () => {
      try {
        const response = await fetch("/api/boosters");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setBoosters(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch boosters:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoosters();
  }, []);

  const availableGames = useMemo(
    () => ["all", ...new Set(boosters.map((booster) => booster.game))],
    [boosters]
  );

  const availableRanks = useMemo(
    () => ["all", ...new Set(boosters.map((booster) => booster.boosterRank))],
    [boosters]
  );

  const visibleBoosters = useMemo(() => {
    if (searchScope === "clients") {
      return [];
    }

    const term = searchText.trim().toLowerCase();

    const filtered = boosters.filter((booster) => {
      const gameMatches = selectedGame === "all" || booster.game === selectedGame;
      const rankMatches = selectedRank === "all" || booster.boosterRank === selectedRank;
      const textMatches =
        term.length === 0 ||
        booster.name.toLowerCase().includes(term) ||
        booster.game.toLowerCase().includes(term) ||
        (booster.boosterRank && booster.boosterRank.toLowerCase().includes(term));

      return gameMatches && rankMatches && textMatches;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "game") {
        return a.game.localeCompare(b.game);
      }

      if (sortBy === "success") {
        return b.success - a.success;
      }

      if (sortBy === "rank") {
        return (b.xp || 0) - (a.xp || 0);
      }

      return Number.parseFloat(b.rating) - Number.parseFloat(a.rating);
    });
  }, [boosters, searchScope, searchText, selectedGame, selectedRank, sortBy]);

  const renderRankIcon = (icon: string) => {
    switch (icon) {
      case "military_tech":
      case "workspace_premium":
        return <BadgeCheck size={18} strokeWidth={2.25} />;
      case "stars":
        return <Sparkles size={18} strokeWidth={2.25} />;
      case "trophy":
        return <Trophy size={18} strokeWidth={2.25} />;
      case "psychology":
        return <Brain size={18} strokeWidth={2.25} />;
      case "diamond":
        return <Diamond size={18} strokeWidth={2.25} />;
      case "shield":
        return <Shield size={18} strokeWidth={2.25} />;
      default:
        return <BadgeCheck size={18} strokeWidth={2.25} />;
    }
  };

  return (
    <>
      {session?.user ? (
        <BoosterTopBar
          brandLabel="ZENITH BOOST"
          brandHref="/"
          brandClassName="text-2xl font-bold tracking-tighter text-primary-fixed transition hover:text-primary"
          headerClassName="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#0c0e14]/70 px-8 shadow-md backdrop-blur-xl"
          rightClassName="flex items-center gap-6"
          avatarUrl={avatarUrl}
          navItems={hideSidebar ? currentNavItems : undefined}
          avatarAlt="User Avatar"
          avatarBorderClassName="border-primary/20"
          isNotificationsOn={isNotificationsOn}
          unreadNotificationCount={realUnreadCount}
          isNotificationsPanelOpen={isNotificationsPanelOpen}
          onToggleNotificationsPanel={() => {
            setIsProfileMenuOpen(false);
            setIsNotificationsPanelOpen((c) => !c);
          }}
          onCloseNotificationsPanel={() => setIsNotificationsPanelOpen(false)}
          onToggleNotifications={() => setIsNotificationsOn((c) => !c)}
          onMarkNotificationsRead={markAllAsRead}
          notifications={realNotifications}
          isProfileMenuOpen={isProfileMenuOpen}
          onToggleProfileMenu={() => {
            setIsNotificationsPanelOpen(false);
            setIsProfileMenuOpen((c) => !c);
          }}
          onCloseProfileMenu={() => setIsProfileMenuOpen(false)}
          onProfileAction={async (action) => {
            if (action === "Settings") { router.push(session?.user?.role === "BOOSTER" ? "/booster-profile" : "/client-settings"); return; }
            if (action === "Logout") { await signOut({ callbackUrl: "/" }); return; }
            setIsProfileMenuOpen(false);
          }}
        />
      ) : (
        <header className="ghost-border fixed top-0 z-50 w-full border-b border-outline-variant/20 bg-surface-variant/70 backdrop-blur-xl">
          <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-8 font-headline tracking-tight">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tighter text-primary-fixed transition hover:text-primary"
            >
              Zenith Boost
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="top-panel-link px-4 py-2 text-sm font-bold uppercase tracking-wide"
              >
                Home
              </Link>
              <Link
                href="/booster-browse"
                className="top-panel-link top-panel-link-active px-4 py-2 text-sm font-bold uppercase tracking-wide"
              >
                Browse
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://discord.gg/FkGNYr2R"
                target="_blank"
                rel="noreferrer"
                aria-label="Join our Discord"
                className="top-panel-icon"
              >
                <img
                  src="https://cdn.simpleicons.org/discord/5865F2"
                  alt="Discord"
                  className="h-5 w-5 opacity-90"
                />
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsLoginOpen(true)}
                className="top-panel-link px-2 py-2"
              >
                Login
              </Button>
            </div>
          </div>
        </header>
      )}

      {isClientLoggedIn && !hideSidebar && (
        <ClientSidebar active="browse" />
      )}

      {isBoosterLoggedIn && !hideSidebar && (
        <BoosterSidebar
          active="dashboard"
          isOnline={true}
          onToggleOnline={() => {}}
          mainGame={boosterProfile.mainGame}
          rankInfo={boosterProfile.rankInfo}
          xp={boosterProfile.xp}
        />
      )}

      <main className={`relative z-0 min-h-screen bg-background transition-all duration-300 ${(isClientLoggedIn || isBoosterLoggedIn) && !hideSidebar ? "ml-64 pt-24" : "pt-24"}`}>
        <section className="relative z-0 border-y border-outline-variant/10 bg-surface-container-low py-16">
          <div className="container mx-auto px-8">
            <div className="mb-10">
              <span className="font-label mb-2 block text-xs uppercase tracking-widest text-secondary">
                Booster Browse
              </span>
              <h1 className="font-headline text-5xl font-bold">CHOOSE YOUR BOOSTER</h1>
              <p className="mt-3 text-sm text-on-surface-variant">
                Sort by game, popularity, rating, or booster rank in server.
              </p>
            </div>

            <div className="ghost-border mb-8 grid grid-cols-1 gap-3 rounded-xl bg-surface-container p-4 md:grid-cols-4">
              <Label className="text-xs">
                Filter By Game
                <Select
                  value={selectedGame}
                  onChange={(event) => setSelectedGame(event.target.value)}
                  className="mt-2 w-full rounded-md border border-outline/30 bg-surface-container-high px-3 py-2 text-sm uppercase tracking-wide text-on-surface outline-none transition focus:border-primary"
                >
                  {availableGames.map((game) => (
                    <option key={game} value={game}>
                      {game === "all" ? "All Games" : game}
                    </option>
                  ))}
                </Select>
              </Label>

              <Label className="text-xs">
                Filter By Rank
                <Select
                  value={selectedRank}
                  onChange={(event) => setSelectedRank(event.target.value)}
                  className="mt-2 w-full rounded-md border border-outline/30 bg-surface-container-high px-3 py-2 text-sm uppercase tracking-wide text-on-surface outline-none transition focus:border-primary"
                >
                  {availableRanks.map((rank) => (
                    <option key={rank} value={rank}>
                      {rank === "all" ? "All Ranks" : rank}
                    </option>
                  ))}
                </Select>
              </Label>

              <Label className="text-xs">
                Sort By
                <Select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as "game" | "success" | "rating" | "rank")
                  }
                  className="mt-2 w-full rounded-md border border-outline/30 bg-surface-container-high px-3 py-2 text-sm uppercase tracking-wide text-on-surface outline-none transition focus:border-primary"
                >
                  <option value="game">Game</option>
                  <option value="success">Success</option>
                  <option value="rating">Rating</option>
                  <option value="rank">Booster Rank In Server</option>
                </Select>
              </Label>

              <Label className="text-xs">
                Search
                <Input
                  type="text"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Name, game, or rank"
                  className="mt-2 border-outline/30 bg-surface-container-high px-3 py-2"
                />
              </Label>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider">
              <span className="rounded-full border border-outline/25 bg-surface-container-high px-3 py-1.5 text-on-surface-variant">
                Scope: {searchScope}
              </span>
              {searchText.trim() ? (
                <span className="rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-primary">
                  Query: {searchText}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              {visibleBoosters.length > 0 ? (
                visibleBoosters.map((booster) => (
                  <Link
                    key={booster.id}
                    href={`/booster/${booster.id}`}
                    className="group ghost-border overflow-hidden rounded-xl bg-surface-container-highest block transition-transform hover:-translate-y-1"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img
                        className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:scale-110 group-hover:grayscale-0"
                        alt={`${booster.name} profile`}
                        src={booster.image}
                      />
                      {booster.live ? (
                        <div className="absolute left-4 top-4 rounded bg-tertiary px-3 py-1 text-[10px] font-black uppercase tracking-tighter">
                          Live Now
                        </div>
                      ) : null}
                      {isBoosterOnline(booster.id, onlineBoosters) ? (
                        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 backdrop-blur-sm">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-300">Online</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h4 className="font-headline text-xl font-bold">{booster.name}</h4>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c084fc]">
                            {booster.game}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <Star size={14} className="fill-current" />
                          <span className="font-bold">{booster.rating}</span>
                        </div>
                      </div>
                      <div 
                        className="ghost-border flex items-center gap-3 rounded-md bg-surface-dim px-4 py-3"
                        style={{ borderLeftColor: booster.rankColor, borderLeftWidth: booster.rankColor ? '3px' : '1px' }}
                      >
                        <span style={{ color: booster.rankColor }}>{renderRankIcon(booster.rankIcon)}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold uppercase tracking-tight" style={{ color: booster.rankColor }}>{booster.boosterRank}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        <span>Success</span>
                        <span className="text-primary">{booster.success}%</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="ghost-border rounded-xl bg-surface-container-high p-8 md:col-span-4">
                  <p className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                    {searchScope === "clients"
                      ? "No client search results available on the booster browse page."
                      : "No boosters matched your search input."}
                  </p>
                </div>
              )}
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
        onForgotPassword={() => {
          setIsLoginOpen(false);
          setIsForgotPasswordOpen(true);
        }}
        overlayClassName="modal-overlay-enter fixed inset-0 z-[80] flex items-center justify-center bg-background/65 px-4 backdrop-blur-md"
        panelClassName="modal-panel-enter ghost-border w-full max-w-lg rounded-2xl border border-outline/30 bg-surface-container/85 p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl"
      />

      <ForgotPasswordModal open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
    </>
  );
}

export default function BoosterBrowsePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background pt-28" />}>
      <BoosterBrowsePageContent />
    </Suspense>
  );
}
