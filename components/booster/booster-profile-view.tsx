"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Calendar,
  CheckCircle2,
  Diamond,
  Flag,
  Languages,
  MapPin,
  MessageCircle,
  Search as SearchIcon,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Zap,
  Home,
  ClipboardList,
  LayoutDashboard,
  Wallet,
  Settings as SettingsIcon,
  MessageSquare,
} from "lucide-react";

import { BoosterTopBar } from "@/components/booster/top-bar";
import { useNotifications } from "@/hooks/use-notifications";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { buildBrowseSearchUrl } from "@/lib/search-url";
import { ReviewSystem } from "@/components/reviews/review-system";

type Review = {
  id: string;
  name: string;
  summary: string;
  rating: 4 | 5;
  comment: string;
  tone: "primary" | "secondary" | "tertiary";
};

const reviews: Review[] = [
  {
    id: "viper",
    name: "Viper_Ops",
    summary: "Gold to Predator",
    rating: 5,
    comment:
      '"Fast and professional boosting! My account was handled with extreme care and the speed was unbelievable."',
    tone: "primary",
  },
  {
    id: "night",
    name: "NightMayer",
    summary: "Placement Matches",
    rating: 5,
    comment:
      '"Third time using this service. Consistent, discrete, and friendly. The live stream was a nice touch."',
    tone: "secondary",
  },
  {
    id: "sky",
    name: "SkyHigh_23",
    summary: "20 Bomb Badge",
    rating: 4,
    comment:
      '"Amazing skill level. Dropped 20 kills in the first two games. Communication was top-tier throughout."',
    tone: "tertiary",
  },
  {
    id: "kev",
    name: "Kevlar_99",
    summary: "Diamond Rank Up",
    rating: 5,
    comment:
      '"No issues at all. Super helpful and even gave me some tips for my main character."',
    tone: "primary",
  },
];

const toneToClass: Record<Review["tone"], string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  tertiary: "text-tertiary",
};

function ReviewStars({ rating }: { rating: Review["rating"] }) {
  return (
    <div className="flex items-center gap-0.5 text-primary">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={`star-${index}`}
          className={`h-3.5 w-3.5 ${index < rating ? "fill-current" : "opacity-35"}`}
        />
      ))}
    </div>
  );
}

export interface BoosterProfileData {
  boosterId: string;
  username: string;
  alias: string;
  pfpUrl: string;
  bio: string;
  origin: string;
  languages: string[];
  joinDate: string;
  rating: number;
  totalOrders: number;
  hourlyRate: number;
  hoursPlayed: string;
  successRate: string;
  mainGame: string;
  mainRank: string;
  mainBadgeUrl: string;
  games?: Array<{
    name: string;
    rank: string;
  }>;
  reviews: Review[];
  serverRank?: string;
  serverRankIcon?: string;
  serverRankColor?: string;
  boosterUserId?: string;
}

export function BoosterProfileView({
  profileData,
  profileOverrides
}: {
  profileData?: BoosterProfileData,
  profileOverrides?: Partial<BoosterProfileData>
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isClientLoggedIn = status === "authenticated";
  const navItems = ["Services", "Games", "About"];
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchScope, setSearchScope] = useState<"all" | "clients" | "boosters">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMessaging, setIsMessaging] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

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
    { key: "browse", label: "Browse", href: "/booster-browse", icon: <SearchIcon className="h-5 w-5" />, isActive: false },
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

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(buildBrowseSearchUrl(searchScope, searchQuery));
    setIsSearchOpen(false);
  };

  const handleMessageBooster = async () => {
    if (!isClientLoggedIn) { router.push("/login"); return; }
    if (!data.boosterUserId) return;
    setIsMessaging(true);
    setMessageError(null);
    try {
      const res = await fetch("/api/chat-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boosterUserId: data.boosterUserId }),
      });
      const json = await res.json();
      if (!res.ok) { setMessageError(json.error ?? "Could not start chat."); return; }
      router.push(`/client-chats?request=${json.chatRequest.id}`);
    } catch {
      setMessageError("Network error. Please try again.");
    } finally {
      setIsMessaging(false);
    }
  };

  // Fallback data if none is provided
  const defaultData: BoosterProfileData = {
    boosterId: "commander-z",
    username: "CommanderZ",
    alias: "COMMANDER Z",
    pfpUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=512&q=80",
    bio: "Professional Apex Legends player with 5+ years of competitive experience. I specialize in high-speed rank climbing, tactical awareness training, and badge attainment. My approach focuses on account safety and providing an educational experience through private streaming.",
    origin: "Germany",
    languages: ["English", "German", "French"],
    joinDate: "Jan 2022",
    rating: 4.9,
    totalOrders: 500,
    hourlyRate: 15.0,
    hoursPlayed: "3K+",
    successRate: "98%",
    mainGame: "Apex Legends",
    mainRank: "Apex Predator",
    mainBadgeUrl: "https://mmonster.co/media/40/b0/a8/1715176623/apex-legends-predator-badge.webp",
    reviews: reviews
  };

  const renderRankIcon = (icon: string) => {
    switch (icon) {
      case "military_tech":
      case "workspace_premium":
        return <BadgeCheck size={20} strokeWidth={2.25} />;
      case "stars":
        return <Sparkles size={20} strokeWidth={2.25} />;
      case "trophy":
        return <Trophy size={20} strokeWidth={2.25} />;
      case "psychology":
        return <Brain size={20} strokeWidth={2.25} />;
      case "diamond":
        return <Diamond size={20} strokeWidth={2.25} />;
      case "shield":
        return <Shield size={20} strokeWidth={2.25} />;
      default:
        return <BadgeCheck size={20} strokeWidth={2.25} />;
    }
  };

  const data = {
    ...defaultData,
    ...profileData,
    ...profileOverrides
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary selection:text-on-primary-fixed">
      {isClientLoggedIn ? (
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
                className="top-panel-link px-4 py-2 text-sm font-bold uppercase tracking-wide"
              >
                Browse
              </Link>
            </div>

            <nav className="hidden items-center gap-8 md:flex">
              {navItems.map((item, index) => (
                <a
                  key={item}
                  href="#"
                  className={
                    index === 0
                      ? "border-b-2 border-primary-fixed pb-1 font-bold text-primary-fixed"
                      : "text-on-surface transition-colors hover:text-primary-fixed"
                  }
                >
                  {item}
                </a>
              ))}
            </nav>

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
              <div className="relative z-[70]">
                <Button
                  type="button"
                  aria-label="Search"
                  onClick={() => setIsSearchOpen((current) => !current)}
                  className="top-panel-icon h-9 w-9"
                  variant="ghost"
                  size="icon"
                >
                  <SearchIcon size={18} />
                </Button>

                {isSearchOpen ? (
                  <>
                    <Button
                      type="button"
                      aria-label="Close search panel"
                      onClick={() => setIsSearchOpen(false)}
                      className="fixed inset-0 z-[69] cursor-default"
                      variant="ghost"
                      size="icon"
                    ></Button>
                    <form
                      onSubmit={handleSearchSubmit}
                      className="ghost-border absolute right-0 top-12 z-[70] w-[340px] rounded-xl border border-white/10 bg-surface-container/95 p-4 shadow-2xl"
                    >
                      <Label className="text-[10px] tracking-[0.2em]">Search In</Label>
                      <Select
                        value={searchScope}
                        onChange={(event) =>
                          setSearchScope(event.target.value as "all" | "clients" | "boosters")
                        }
                        className="mb-3 w-full rounded-md border border-outline/30 bg-surface-container-high px-3 py-2 text-sm uppercase tracking-wide text-on-surface outline-none transition focus:border-primary"
                      >
                        <option value="all">All</option>
                        <option value="clients">Clients</option>
                        <option value="boosters">Boosters</option>
                      </Select>

                      <Label className="text-[10px] tracking-[0.2em]">Search Query</Label>
                      <Input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Type a name, game, or rank..."
                        className="mb-4 border-outline/30 bg-surface-container-high px-3 py-2"
                      />

                      <Button
                        type="submit"
                        className="cta-flame-soft cta-flame-soft-primary w-full"
                        variant="primary"
                        size="sm"
                      >
                        Search
                      </Button>
                    </form>
                  </>
                ) : null}
              </div>
              <Button
                type="button"
                className="top-panel-link px-4 py-2"
                variant="ghost"
                size="sm"
                onClick={() => router.push("/login")}
              >
                Login
              </Button>
            </div>
          </div>
        </header>
      )}

      <main className="pt-20">
        <section className="relative flex min-h-[716px] items-end overflow-hidden px-8 pb-20">
          <div className="absolute inset-0 z-0">
            <img
              className="h-full w-full object-cover"
              alt="Apex environment"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1ro8g4fku5immOj-vm3-t2gNy4TAVNjubr8wbeb5RWnknF3bn-wn0H8VWAtjxWua245P1rStlyMEEbb9jOJuYDgMj06B8cl8DZTWcKm7yNN5jmfbVQ5Y8EKj1kmCz69pdXdz5TY425ng2mgwO1U5cz7UTzt2zkDYriNpJQ4-fUtn5T5qzcivGlsLDsVvjk3p1M9d4bFbob59xu1O4dd1UweGzh5-DceyZN7yE2iPZ0iQh2Ka2U4Pxu6cTFnc3dmKuN358iNzLsRs"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface via-transparent to-transparent" />
          </div>

          <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-end gap-12 lg:grid-cols-12">
            <div className={session?.user?.role === "BOOSTER" ? "lg:col-span-12" : "lg:col-span-8"}>
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <span className="rounded-sm border border-outline-variant/40 bg-tertiary/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-tertiary">
                  Top Rated Booster
                </span>
                {data.serverRank && (
                  <div className="flex items-center gap-1.5 rounded-full bg-surface-container-highest px-3 py-1 text-[10px] font-black uppercase tracking-widest" style={{ color: data.serverRankColor, border: `1px solid ${data.serverRankColor}40` }}>
                    {renderRankIcon(data.serverRankIcon || "")}
                    {data.serverRank}
                  </div>
                )}
                <div className="flex items-center gap-1 text-primary">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-bold">{data.rating} Score</span>
                </div>
                <span className="text-sm text-on-surface-variant/60">•</span>
                <span className="text-sm font-medium text-on-surface-variant">{data.totalOrders}+ Orders Completed</span>
              </div>

              <div className="mb-8 flex flex-col gap-8 md:flex-row md:items-center">
                <div className="relative h-28 w-28 shrink-0 md:h-40 md:w-40">
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-primary via-secondary to-tertiary opacity-30 blur-xl"></div>
                  <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-white/20 bg-surface-container-high shadow-2xl">
                    <img
                      alt={`${data.alias} Profile`}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                      src={data.pfpUrl}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <h1 className="font-headline text-6xl font-bold leading-[0.9] tracking-tighter text-on-surface md:text-8xl">
                    <span className="uppercase">{data.alias}</span>
                  </h1>
                  <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary opacity-70">@{data.username}</p>
                  
                  <div className="flex items-center gap-3 mt-4">
                    <div className="min-w-[80px] rounded-xl border border-primary/20 bg-surface-container-high/60 px-4 py-2 text-center backdrop-blur-md">
                      <p className="font-headline text-xl font-bold leading-none text-primary">{data.hoursPlayed}</p>
                      <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Hours</p>
                    </div>
                    <div className="min-w-[80px] rounded-xl border border-secondary/20 bg-surface-container-high/60 px-4 py-2 text-center backdrop-blur-md">
                      <p className="font-headline text-xl font-bold leading-none text-secondary">{data.successRate}</p>
                      <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Success</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container/80 p-3 backdrop-blur-md">
                  <img
                    className="h-12 w-12 object-contain"
                    alt={`${data.mainGame} badge`}
                    src={data.mainBadgeUrl}
                  />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {data.mainGame} - {data.mainRank}
                  </p>
                </div>

                <Button variant="outline" size="md" className="border-error/30 px-6 text-[10px] font-black uppercase tracking-widest text-error hover:bg-error/10 hover:text-error">
                  <Flag className="h-4 w-4" />
                  Report Booster
                </Button>
              </div>
            </div>

              {session?.user?.role !== "BOOSTER" && (
              <div className="relative rounded-xl border border-outline-variant/30 bg-surface-container-high/90 p-8 shadow-2xl backdrop-blur-2xl lg:col-span-4">
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Starting At</p>
                    <div className="flex items-baseline gap-1">
                      <span className="font-headline text-4xl font-bold text-primary">${data.hourlyRate.toFixed(2)}</span>
                      <span className="text-sm uppercase text-on-surface-variant">/hr</span>
                    </div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container">
                    <Zap className="h-5 w-5 text-secondary" />
                  </div>
                </div>

                <div className="mb-8 space-y-4">
                  {["Protection Guaranteed", "Private Live Stream Included", "Priority Support"].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-on-surface-variant">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <Button variant="primary" size="lg" className="mb-4 w-full text-sm font-black uppercase tracking-widest">
                  Create Order
                </Button>

                <Button variant="outline" size="lg" className="mb-4 w-full text-sm font-black uppercase tracking-widest" onClick={handleMessageBooster} disabled={isMessaging}>
                  <MessageCircle className="h-4 w-4" />
                  {isMessaging ? "Opening chat..." : "Message Booster"}
                </Button>
                {messageError && (
                  <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-widest text-error">{messageError}</p>
                )}

                <p className="text-center text-[10px] uppercase tracking-wider text-on-surface-variant">Fast delivery • 24/7 Availability</p>
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-8 py-24 lg:grid-cols-12">
          <div className="space-y-12 lg:col-span-8">
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-8">
              <h2 className="font-headline mb-4 text-2xl font-bold uppercase tracking-tight text-primary">Booster Bio</h2>
              <p className="mb-4 leading-relaxed text-on-surface-variant">
                {data.bio}
              </p>
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {(data.games || []).map((game) => (
                   <div key={game.name} className="flex items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container-highest px-4 py-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">{game.name}</span>
                      <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{game.rank}</span>
                   </div>
                ))}
              </div>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-headline mb-2 text-4xl font-bold tracking-tight text-on-surface">Customer Reviews</h2>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} className={i < Math.round(data.rating) ? "fill-current" : "opacity-20"} />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-on-surface-variant">Based on {data.reviews.length} verified reviews</span>
                </div>
              </div>
            </div>

            <ReviewSystem boosterId={data.boosterId} />
          </div>

          <aside className="space-y-8 lg:col-span-4">
            <div className="rounded-xl border border-outline-variant/30 border-l-4 border-l-primary bg-surface-container-high p-8">
              <h3 className="font-headline mb-6 text-xl font-bold uppercase tracking-tight">Quick Info</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    <MapPin className="h-3.5 w-3.5" />
                    Account Based In
                  </span>
                  <span className="text-sm font-bold text-on-surface">{data.origin}</span>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    <Calendar className="h-3.5 w-3.5" />
                    Member Since
                  </span>
                  <span className="text-sm font-bold text-on-surface">{data.joinDate}</span>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    <Languages className="h-3.5 w-3.5" />
                    Languages
                  </span>
                  <span className="text-sm font-bold text-on-surface">{data.languages.join(", ")}</span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <footer className="mt-auto w-full border-t border-outline-variant/10 bg-[#0b0e14] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-8 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <span className="font-headline font-bold tracking-tight text-primary-fixed">KINETIC ZENITH</span>
            <p className="text-[10px] uppercase tracking-[0.1em] text-on-surface/40">
              © 2024 KINETIC ZENITH. ENGINEERED FOR PERFORMANCE.
            </p>
          </div>

          <div className="flex gap-8">
            {[
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
              { label: "API Status", href: "#" },
              { label: "Contact", href: "#" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[10px] uppercase tracking-[0.1em] text-on-surface/40 transition-colors hover:text-primary-fixed"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
