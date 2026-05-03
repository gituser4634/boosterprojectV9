"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import {
  CircleHelp,
  ClipboardList,
  Crown,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Wallet,
  X,
} from "lucide-react";
import { BoosterSidebar } from "@/components/booster/shell-navigation";
import { BoosterTopBar, type NotificationItem } from "@/components/booster/top-bar";
import { useNotifications } from "@/hooks/use-notifications";
import { useSession } from "next-auth/react";

type RequestType = "Boost Request" | "Coaching" | "Play Together";

type RequestCard = {
  id: string;
  customer: string;
  customerId: string;
  avatar: string;
  chatThreadId: string;
  hasUnreadMessage: boolean;
  requestType: RequestType;
  requestedDate: string;
  requestedTime: string;
  game: string;
  currentRank: string;
  desiredRank?: string;
  requestedHours: number;
  payPrice: string;
  notes: string;
};

type WeeklySchedule = {
  day: string;
  requested: string[];
  busy: string[];
};

const initialRequestCards: RequestCard[] = [
  {
    id: "card-1",
    customer: "GamerPro",
    customerId: "#88219",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCPPZ6U_Kh8jC7zTziP1WtlNMabB0UW1pH3ljHt5pKWlFBhg9Uu-z2eNl7UUfLA3zAS4z9yuSMky4ICXNYGWr_SbSwOq8cbgoRJMRX-GfcDxB1jAOH2ZuA-l0TXCyQ8ko2S6_mA76m2f-MoQ12fnJPWOJpnFxQVmxFu8ba1hDMmVIis_Xm7DeWCn7nJcx1mPXDrHu48a3JURo22aEQnkJHWDAXCwUwpaQD4TdBq5EjTf3MSTR0CI5x5C6LtWpO6LyqzUdfcWQyY4tE",
    chatThreadId: "card-1",
    hasUnreadMessage: true,
    requestType: "Boost Request",
    requestedDate: "Apr 19, 2026",
    requestedTime: "09:15 AM",
    game: "League of Legends",
    currentRank: "Platinum IV",
    desiredRank: "Diamond IV",
    requestedHours: 12,
    payPrice: "$120.00",
    notes: '"Prefers morning sessions, use VPN"',
  },
  {
    id: "card-2",
    customer: "ShadowReaper",
    customerId: "#88224",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBGfvlQ0S9lW3oDV8rWDSZeCf5oKnU8BuViauBXEnFTBV4oyicHXMM41MWYo6Yqa6BE-12udJjOrmut1zuL2lmbmJaB9XqDS5FEvRYINY_YWuRr8bIldB1KH1mIGs2ivUm1O1pnM2MuuZIG2aCXPt3uo1O2UzZ0rTIjqQYcHPNTNCgbuGIxzuLg7xCXGgFZ5Y1x8cXmrlf2UPjIvZdbWjoMzHRjTJU7mxt--LP-BvlLcG6IZQul9ivJcoinBavR1MAeJurfBP5o7FU",
    chatThreadId: "card-2",
    hasUnreadMessage: true,
    requestType: "Coaching",
    requestedDate: "Apr 19, 2026",
    requestedTime: "01:40 PM",
    game: "Counter-Strike 2",
    currentRank: "Faceit Lv. 6",
    requestedHours: 4,
    payPrice: "$75.00",
    notes: '"Wants aim + utility review, screen share available"',
  },
  {
    id: "card-3",
    customer: "NovaStrike",
    customerId: "#88301",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAiW2NaeWuuVRQ93jf8ldCnsr6l8wTL1OG-DuufzqFsk19InG4n3rSMxUJMsAi-fcnPYfcPxe6FWRb6IUbbpV8yF-rWLMTzbaEw6mu_wJxVcwv1hf5T2QILVY6G4_pYdUGD7TvWjI0JDQsiRNHNDDYNFli5W6yqhFP4z25XpcF_Xz6AtRCTA-LO5c4_DSfr2nSmRmd5xYFEpuEWodqH3WjNS7yHwBa5yb6jymaPh-DGlvjdFFrfSLg5uXVBW9Fg35iiWJ_D4srvtoA",
    chatThreadId: "card-3",
    hasUnreadMessage: true,
    requestType: "Play Together",
    requestedDate: "Apr 20, 2026",
    requestedTime: "08:00 PM",
    game: "Valorant",
    currentRank: "Ascendant I",
    requestedHours: 3,
    payPrice: "$45.00",
    notes: '"Duo queue preferred, comms on Discord"',
  },
];

const scheduleByRequest: Record<string, WeeklySchedule[]> = {
  "card-1": [
    { day: "Mon", requested: ["09:00-11:00"], busy: ["10:00-12:00", "18:00-20:00"] },
    { day: "Tue", requested: ["09:00-11:00"], busy: ["14:00-16:00"] },
    { day: "Wed", requested: ["08:00-10:00"], busy: ["08:00-10:00", "20:00-22:00"] },
    { day: "Thu", requested: ["09:00-11:00"], busy: ["12:00-14:00"] },
    { day: "Fri", requested: ["09:00-11:00"], busy: ["17:00-19:00"] },
    { day: "Sat", requested: ["10:00-12:00"], busy: ["10:00-12:00", "15:00-17:00"] },
    { day: "Sun", requested: ["09:00-11:00"], busy: ["13:00-15:00"] },
  ],
  "card-2": [
    { day: "Mon", requested: ["13:00-15:00"], busy: ["09:00-11:00"] },
    { day: "Tue", requested: ["13:00-15:00"], busy: ["13:00-15:00", "20:00-22:00"] },
    { day: "Wed", requested: ["13:00-15:00"], busy: ["17:00-19:00"] },
    { day: "Thu", requested: ["13:00-15:00"], busy: ["13:00-15:00"] },
    { day: "Fri", requested: ["13:00-15:00"], busy: ["11:00-13:00"] },
    { day: "Sat", requested: ["14:00-16:00"], busy: ["18:00-20:00"] },
    { day: "Sun", requested: ["14:00-16:00"], busy: ["14:00-16:00"] },
  ],
  "card-3": [
    { day: "Mon", requested: ["20:00-21:30"], busy: ["18:00-20:00"] },
    { day: "Tue", requested: ["20:00-21:30"], busy: ["20:00-22:00"] },
    { day: "Wed", requested: ["20:00-21:30"], busy: ["09:00-11:00"] },
    { day: "Thu", requested: ["20:00-21:30"], busy: ["20:00-21:30"] },
    { day: "Fri", requested: ["20:00-21:30"], busy: ["16:00-18:00"] },
    { day: "Sat", requested: ["19:00-20:30"], busy: ["19:00-20:30", "21:00-22:30"] },
    { day: "Sun", requested: ["19:00-20:30"], busy: ["11:00-13:00"] },
  ],
};

export default function BoosterRequestsPage() {
  const router = useRouter();
  const [requestCards, setRequestCards] = useState<RequestCard[]>(initialRequestCards);
  const [inspectingRequestId, setInspectingRequestId] = useState<string | null>(null);
  const [isAcceptStepUnlocked, setIsAcceptStepUnlocked] = useState(false);
  const [rescheduleRequestedIds, setRescheduleRequestedIds] = useState<string[]>([]);
  const [isSidebarOnline, setIsSidebarOnline] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [savedPrimaryGame, setSavedPrimaryGame] = useState("");
  const [hideSidebar, setHideSidebar] = useState(false);
  const savedMainGameStorageKey = "booster-main-game";

  useEffect(() => {
    const savedSidebar = window.localStorage.getItem("zenith-hide-sidebar") === "true";
    setHideSidebar(savedSidebar);
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem(savedMainGameStorageKey) ?? "";
    setSavedPrimaryGame(saved);

    const loadUserProfile = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.user);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };
    loadUserProfile();
  }, []);
  const [isNotificationsOn, setIsNotificationsOn] = useState(true);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const { 
    notifications: realNotifications, 
    unreadCount: realUnreadCount, 
    markAllAsRead 
  } = useNotifications();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const avatarUrl = session?.user?.image ?? "/booster-pfps/default-avatar.svg";

  const inspectedRequest = useMemo(
    () => requestCards.find((item) => item.id === inspectingRequestId) ?? null,
    [requestCards, inspectingRequestId]
  );

  const inspectedSchedule = useMemo(() => {
    if (!inspectingRequestId) return [];
    return scheduleByRequest[inspectingRequestId] ?? [];
  }, [inspectingRequestId]);

  const hasScheduleConflict = useMemo(
    () => inspectedSchedule.some((slot) => slot.requested.some((time) => slot.busy.includes(time))),
    [inspectedSchedule]
  );

  const handleInspect = (requestId: string) => {
    setInspectingRequestId(requestId);
    setIsAcceptStepUnlocked(false);
  };

  const handleReject = (requestId: string) => {
    setRequestCards((current) => current.filter((item) => item.id !== requestId));
    setRescheduleRequestedIds((current) => current.filter((id) => id !== requestId));
    if (inspectingRequestId === requestId) {
      setInspectingRequestId(null);
      setIsAcceptStepUnlocked(false);
    }
  };

  const handleRequestReschedule = () => {
    if (!inspectedRequest) return;
    setRescheduleRequestedIds((current) =>
      current.includes(inspectedRequest.id) ? current : [...current, inspectedRequest.id]
    );
    setInspectingRequestId(null);
    setIsAcceptStepUnlocked(false);
  };

  const handleMarkNotificationsRead = () => {
    markAllAsRead();
  };

  const handleConfirmRequest = () => {
    if (!inspectedRequest) return;
    setRequestCards((current) => current.filter((item) => item.id !== inspectedRequest.id));
    setInspectingRequestId(null);
    setIsAcceptStepUnlocked(false);
  };

  const getScheduleDateLabel = (dayAbbrev: string) => {
    if (!inspectedRequest) return "";

    const baseDate = new Date(inspectedRequest.requestedDate);
    if (Number.isNaN(baseDate.getTime())) return "";

    const dayIndexByAbbrev: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const targetDayIndex = dayIndexByAbbrev[dayAbbrev];
    if (targetDayIndex === undefined) return "";

    const diffDays = (targetDayIndex - baseDate.getDay() + 7) % 7;
    const resolvedDate = new Date(baseDate);
    resolvedDate.setDate(baseDate.getDate() + diffDays);

    return resolvedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderSidebarItem = (label: string) => {
    const icon =
      label === "Dashboard" ? (
        <LayoutDashboard className="h-5 w-5" />
      ) : label === "Requests" ? (
        <ClipboardList className="h-5 w-5" />
      ) : label === "Payments" ? (
        <Wallet className="h-5 w-5" />
      ) : (
        <MessageSquare className="h-5 w-5" />
      );

    if (label === "Requests") {
      return (
        <div className="flex items-center gap-3 rounded-l-lg border-r-2 border-cyan-400 bg-cyan-400/10 p-3 text-cyan-400">
          {icon}
          <span>{label}</span>
        </div>
      );
    }

    return (
      <a
        href={label === "Dashboard" ? "/booster-dashboard" : label === "Payments" ? "/booster-payments" : "/booster-chats"}
        className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-3 text-slate-500 transition-all duration-300 hover:translate-x-1 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300 hover:shadow-[0_0_22px_rgba(34,211,238,0.25)] active:opacity-80"
      >
        {icon}
        <span>{label}</span>
      </a>
    );
  };

  const boosterNavItems = [
    { key: "dashboard", label: "Dashboard", href: "/booster-dashboard", icon: <LayoutDashboard className="h-5 w-5" />, isActive: false },
    { key: "requests", label: "Requests", href: "/booster-requests", icon: <ClipboardList className="h-5 w-5" />, isActive: true },
    { key: "payments", label: "Payments", href: "/booster-payments", icon: <Wallet className="h-5 w-5" />, isActive: false },
    { key: "chats", label: "Chats", href: "/booster-chats", icon: <MessageSquare className="h-5 w-5" />, isActive: false },
    { key: "settings", label: "Settings", href: "/booster-profile", icon: <Settings className="h-5 w-5" />, isActive: false },
  ];

  return (
    <>
      <BoosterTopBar
        brandLabel="ZENITH BOOSTER"
        brandClassName="font-headline text-2xl font-bold uppercase tracking-tighter text-cyan-400"
        headerClassName={`fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#0b0e14]/65 px-8 ${hideSidebar ? "" : "pl-72"} shadow-sm shadow-black/20 backdrop-blur-xl`}
        rightClassName="flex items-center gap-6 pr-8"
        avatarUrl={avatarUrl}
        navItems={hideSidebar ? boosterNavItems : undefined}
        avatarAlt="User Avatar"
        avatarBorderClassName="border-cyan-400/30"
        isNotificationsOn={isNotificationsOn}
        unreadNotificationCount={realUnreadCount}
        isNotificationsPanelOpen={isNotificationsPanelOpen}
        onToggleNotificationsPanel={() => {
          setIsProfileMenuOpen(false);
          setIsNotificationsPanelOpen((current) => !current);
        }}
        onCloseNotificationsPanel={() => setIsNotificationsPanelOpen(false)}
        onToggleNotifications={() => setIsNotificationsOn((current) => !current)}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        notifications={realNotifications}
        isProfileMenuOpen={isProfileMenuOpen}
        onToggleProfileMenu={() => {
          setIsNotificationsPanelOpen(false);
          setIsProfileMenuOpen((current) => !current);
        }}
        onCloseProfileMenu={() => setIsProfileMenuOpen(false)}
        onProfileAction={async (action) => {
          if (action === "Settings") {
            router.push("/booster-profile");
            return;
          }
          if (action === "Logout") {
            await signOut({ callbackUrl: "/" });
            return;
          }
          setIsProfileMenuOpen(false);
        }}
      />

      {!hideSidebar && (
        <BoosterSidebar
          active="requests"
          isOnline={isSidebarOnline}
          onToggleOnline={() => setIsSidebarOnline((current) => !current)}
          mainGame={userProfile?.boosterProfile?.mainGame?.name || savedPrimaryGame}
          rankInfo={userProfile?.boosterProfile?.rankInfo}
          xp={userProfile?.boosterProfile?.xp}
        />
      )}

      <main className={`h-screen overflow-y-auto pb-24 pl-8 pr-8 pt-24 transition-all duration-300 ${hideSidebar ? "" : "md:ml-64"}`}>
        <div className="mx-auto max-w-6xl p-6 md:p-10">
          <header className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Live Feed</div>
              <h1 className="font-headline mb-4 text-5xl font-bold leading-none tracking-tighter text-on-surface md:text-6xl">
                Pending <span className="text-primary italic">Requests</span>
              </h1>
              <p className="font-body max-w-lg text-lg leading-relaxed text-on-surface-variant">
                Analyze incoming assignments and inspect requested times before accepting.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {requestCards.map((item) => (
              <div key={item.id} className="ghost-border group relative rounded-xl bg-surface-container-low p-6 transition-all duration-500 hover:bg-surface-container">
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="ghost-border h-12 w-12 overflow-hidden rounded-lg">
                      <img className="h-full w-full object-cover" alt={`${item.customer} avatar`} src={item.avatar} />
                    </div>
                    <div>
                      <h3 className="font-headline text-xl font-bold text-on-surface transition-colors group-hover:text-primary">{item.customer}</h3>
                      <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Customer ID: {item.customerId}</div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item.requestedDate} • {item.requestedTime}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-headline text-2xl font-bold text-primary">{item.requestedHours}h</div>
                    <div className="mt-1 text-sm font-bold text-cyan-300">{item.payPrice}</div>
                    <div className="mt-1 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-primary">
                      {item.requestType}
                    </div>
                    {rescheduleRequestedIds.includes(item.id) ? (
                      <div className="mt-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                        Reschedule Requested
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mb-6 rounded-lg bg-surface-container-lowest p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Game</div>
                      <div className="font-headline text-base font-semibold text-on-surface">{item.game}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Rank</div>
                      <div className="text-sm font-bold text-slate-300">{item.currentRank}</div>
                    </div>
                    {item.requestType === "Boost Request" ? (
                      <div className="sm:col-span-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Desired Rank</div>
                        <div className="inline-flex rounded bg-primary/20 px-3 py-1 text-sm font-bold text-primary">{item.desiredRank ?? "Not specified"}</div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mb-6 rounded-lg border border-white/5 bg-surface-container-highest/30 px-4 py-3">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Notes</div>
                  <p className="text-xs italic leading-relaxed text-on-surface opacity-80">{item.notes}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleInspect(item.id)}
                    className="rounded-md border border-primary/40 bg-primary/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary transition-all hover:bg-primary/20 active:scale-95"
                  >
                    Inspect
                  </button>
                  {item.hasUnreadMessage ? (
                    <Link
                      href={`/booster-chats?thread=${item.chatThreadId}`}
                      className="inline-flex items-center gap-2 rounded-md border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-emerald-300 transition-all hover:bg-emerald-500/20 active:scale-95"
                      aria-label={`Open chat from ${item.customer}`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Message
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleReject(item.id)}
                    className="rounded-md border border-red-500/70 px-5 py-3 text-xs font-bold uppercase tracking-widest text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300 active:scale-95"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          {requestCards.length === 0 ? (
            <div className="mt-8 rounded-xl border border-white/10 bg-surface-container-low p-8 text-center text-sm uppercase tracking-widest text-on-surface-variant">
              No pending requests left.
            </div>
          ) : null}
        </div>
      </main>

      {inspectedRequest ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-6" onClick={() => setInspectingRequestId(null)}>
          <div className="ghost-border w-full max-w-4xl rounded-2xl border border-white/10 bg-surface-container p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-headline text-3xl font-bold tracking-tight text-primary-fixed">Inspect Schedule</h3>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Requested by {inspectedRequest.customer} • {inspectedRequest.requestType}
                </p>
              </div>
              <button type="button" onClick={() => setInspectingRequestId(null)} className="rounded-md p-2 text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface" aria-label="Close inspect modal">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 text-[11px] uppercase tracking-widest text-on-surface-variant sm:grid-cols-3">
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">Requested Slot In Schedule</div>
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2">Already Busy</div>
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2">Requested Slot Not In Schedule</div>
            </div>

            <div className="mb-6 rounded-xl border border-white/10 bg-surface-container-low p-4">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Visual Weekly Calendar</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {inspectedSchedule.map((slot) => {
                  const dateLabel = getScheduleDateLabel(slot.day);
                  const requestedSlots = slot.requested.map((time) => ({
                    time,
                    inSchedule: !slot.busy.includes(time),
                  }));

                  return (
                    <div key={`calendar-${slot.day}-${dateLabel || "no-date"}`} className="rounded-lg border border-white/10 bg-surface-container-high/60 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="text-sm font-bold text-on-surface">{slot.day}</div>
                        <div className="text-[11px] text-on-surface-variant">{dateLabel}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {requestedSlots.map((requestedSlot) => (
                          <span
                            key={`${slot.day}-${requestedSlot.time}`}
                            className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                              requestedSlot.inSchedule
                                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                                : "border-red-500/50 bg-red-500/15 text-red-300"
                            }`}
                          >
                            {requestedSlot.time}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant">
                    <th className="border-b border-white/10 px-3 py-2">Day & Date</th>
                    <th className="border-b border-white/10 px-3 py-2">Requested Hours</th>
                    <th className="border-b border-white/10 px-3 py-2">Booster Busy Hours</th>
                    <th className="border-b border-white/10 px-3 py-2">Availability Check</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectedSchedule.map((slot) => {
                    const overlaps = slot.requested.filter((time) => slot.busy.includes(time));
                    const isConflict = overlaps.length > 0;
                    const dateLabel = getScheduleDateLabel(slot.day);
                    const requestedSlots = slot.requested.map((time) => ({
                      time,
                      inSchedule: !slot.busy.includes(time),
                    }));

                    return (
                      <tr key={`${slot.day}-${dateLabel || "no-date"}`} className="border-b border-white/5">
                        <td className="px-3 py-3 font-bold text-on-surface">
                          {slot.day}
                          {dateLabel ? <span className="ml-2 text-xs font-medium text-on-surface-variant">({dateLabel})</span> : null}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            {requestedSlots.map((requestedSlot) => (
                              <span
                                key={`${slot.day}-table-${requestedSlot.time}`}
                                className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                                  requestedSlot.inSchedule
                                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                                    : "border-red-500/50 bg-red-500/15 text-red-300"
                                }`}
                              >
                                {requestedSlot.time}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-on-surface-variant">{slot.busy.join(", ")}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${isConflict ? "bg-red-500/15 text-red-300 border border-red-500/40" : "bg-primary/15 text-primary border border-primary/40"}`}>
                            {isConflict ? "Conflict" : "Available"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {hasScheduleConflict ? "Conflicting hours found" : "All requested hours are in schedule"}
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleReject(inspectedRequest.id)}
                  className="rounded-md border border-red-500/70 px-5 py-3 text-xs font-bold uppercase tracking-widest text-red-300 transition-all hover:bg-red-500/10 hover:text-red-200 active:scale-95"
                >
                  Deny Request
                </button>

                {hasScheduleConflict ? (
                  <button
                    type="button"
                    onClick={handleRequestReschedule}
                    className="rounded-md border border-amber-400/60 bg-amber-400/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-amber-200 transition-all hover:bg-amber-400/20 active:scale-95"
                  >
                    Accept & Reschedule
                  </button>
                ) : !isAcceptStepUnlocked ? (
                  <button
                    type="button"
                    onClick={() => setIsAcceptStepUnlocked(true)}
                    className="rounded-md bg-gradient-to-br from-primary to-primary-container px-6 py-3 text-xs font-black uppercase tracking-widest text-on-primary-fixed transition-all hover:scale-[1.02] active:scale-95"
                  >
                    Accept
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmRequest}
                    className="rounded-md bg-gradient-to-br from-primary to-primary-container px-6 py-3 text-xs font-black uppercase tracking-widest text-on-primary-fixed transition-all hover:scale-[1.02] active:scale-95"
                  >
                    Confirm Request
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed bottom-0 z-50 flex h-16 w-full items-center justify-around border-t border-white/10 bg-slate-950/90 px-4 backdrop-blur-xl md:hidden">
        <Link href="/booster-dashboard" className="flex flex-col items-center gap-1 text-slate-500">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-bold">DASH</span>
        </Link>
        <button className="flex flex-col items-center gap-1 text-cyan-400">
          <ClipboardList className="h-5 w-5" />
          <span className="text-[10px] font-bold">REQS</span>
        </button>
        <Link href="/booster-payments" className="flex flex-col items-center gap-1 text-slate-500">
          <Wallet className="h-5 w-5" />
          <span className="text-[10px] font-bold">PAY</span>
        </Link>
        <Link href="/booster-chats" className="flex flex-col items-center gap-1 text-slate-500">
          <MessageSquare className="h-5 w-5" />
          <span className="text-[10px] font-bold">CHAT</span>
        </Link>
      </nav>
    </>
  );
}
