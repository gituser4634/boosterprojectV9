"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Bell,
  BellOff,
  ClipboardList,
  Crown,
  DollarSign,
  Gamepad2,
  HelpCircle,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Monitor,
  Plus,
  Rocket,
  ShieldCheck,
  Swords,
  Wallet,
  X,
  Settings,
} from "lucide-react";
import { BoosterSidebar } from "@/components/booster/shell-navigation";
import { BoosterTopBar, type NotificationItem } from "@/components/booster/top-bar";
import { useNotifications } from "@/hooks/use-notifications";
import { usePresence } from "@/hooks/use-presence";
import { useSession } from "next-auth/react";

type IncomingRequest = {
  id: string;
  game: string;
  detail: string;
  amount: number;
  etaHours: number;
  tone: "secondary" | "tertiary";
};

type ActiveOrder = {
  id: string;
  name: string;
  customer: string;
  pct: number;
};

type MessageItem = {
  id: string;
  user: string;
  time: string;
  msg: string;
  img: string;
  border: string;
};

type ActivityItem = {
  id: string;
  time: string;
  msg: string;
  tone: "primary" | "secondary";
};

type DashboardData = {
  sessionActive: string;
  activeOrdersCount: number;
  activeOrdersDeltaPct: number;
  pendingRequestsCount: number;
  newRequestsCount: number;
  monthlyEarnings: number;
  newMessagesCount: number;
  incomingRequests: IncomingRequest[];
  activeOrders: ActiveOrder[];
  trendPoints: number[];
  trendGrowthPct: number;
  trendAvgWeekly: number;
  recentMessages: MessageItem[];
  activityFeed: ActivityItem[];
  eliteTopPct: number;
  eliteRating: number;
  unreadNotifications: number;
};

const emptyDashboardData: DashboardData = {
  sessionActive: "0h 00m",
  activeOrdersCount: 0,
  activeOrdersDeltaPct: 0,
  pendingRequestsCount: 0,
  newRequestsCount: 0,
  monthlyEarnings: 0,
  newMessagesCount: 0,
  incomingRequests: [],
  activeOrders: [],
  trendPoints: [0, 0, 0, 0, 0, 0, 0, 0],
  trendGrowthPct: 0,
  trendAvgWeekly: 0,
  recentMessages: [],
  activityFeed: [],
  eliteTopPct: 0,
  eliteRating: 0,
  unreadNotifications: 0,
};

export default function BoosterDashboardPage() {
  const router = useRouter();
  
  // Setup presence tracking for this booster
  usePresence();
  
  const [isNotificationsOn, setIsNotificationsOn] = useState(true);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSidebarOnline, setIsSidebarOnline] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>(emptyDashboardData);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [savedPrimaryGame, setSavedPrimaryGame] = useState("");
  const [hideSidebar, setHideSidebar] = useState(false);
  const savedMainGameStorageKey = "booster-main-game";

  // Persistence for UI preferences
  useEffect(() => {
    const saved = window.localStorage.getItem("zenith-hide-sidebar") === "true";
    setHideSidebar(saved);
  }, []);

  const { 
    notifications: realNotifications, 
    unreadCount: realUnreadCount, 
    markAllAsRead 
  } = useNotifications();

  const { data: session } = useSession();
  const avatarUrl = session?.user?.image ?? "/booster-pfps/default-avatar.svg";

  const handleNotificationToggle = () => {
    setIsNotificationsOn((current) => !current);
  };



  useEffect(() => {
    const saved = window.localStorage.getItem(savedMainGameStorageKey) ?? "";
    setSavedPrimaryGame(saved);

    const controller = new AbortController();

    const loadDashboardData = async () => {
      try {
        setIsDashboardLoading(true);
        const response = await fetch("/api/booster-dashboard", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const payload = (await response.json()) as Partial<DashboardData>;
        const merged = {
          ...emptyDashboardData,
          ...payload,
        } as DashboardData;

        setDashboardData(merged);
      } catch {
        // Keep dashboard initialized to zero until backend becomes available.
        setDashboardData(emptyDashboardData);
      } finally {
        setIsDashboardLoading(false);
      }
    };

    const loadUserProfile = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          console.log("Dashboard User Profile:", data.user);
          setUserProfile(data.user);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };

    loadUserProfile();
    loadDashboardData();
    return () => controller.abort();
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }

    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const trendMax = Math.max(...dashboardData.trendPoints, 1);
  const trendToY = (value: number) => {
    const minY = 12;
    const maxY = 34;
    const normalized = value / trendMax;
    return (maxY - normalized * (maxY - minY)).toFixed(2);
  };

  const trendPath = dashboardData.trendPoints
    .map((point, index) => {
      const x = ((index * 100) / (Math.max(dashboardData.trendPoints.length - 1, 1))).toFixed(2);
      const y = trendToY(point);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const trendAreaPath = `${trendPath} L100,40 L0,40 Z`;

  const latestPointY = trendToY(dashboardData.trendPoints[dashboardData.trendPoints.length - 1] ?? 0);

  const renderNavItem = (label: string) => {
    if (label === "Dashboard") {
      return (
        <div className="flex items-center gap-3 rounded-l-lg border-r-2 border-cyan-400 bg-cyan-400/10 p-3 text-cyan-400">
          <LayoutDashboard className="h-5 w-5" />
          <span>{label}</span>
        </div>
      );
    }

    const icon =
      label === "Requests" ? (
        <ClipboardList className="h-5 w-5" />
      ) : label === "Payments" ? (
        <Wallet className="h-5 w-5" />
      ) : (
        <MessageSquare className="h-5 w-5" />
      );

    return (
      <a
        href={
          label === "Payments"
            ? "/booster-payments"
            : label === "Requests"
              ? "/booster-requests"
              : "/booster-chats"
        }
        className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-3 text-slate-500 transition-all duration-300 hover:translate-x-1 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300 hover:shadow-[0_0_22px_rgba(34,211,238,0.25)] active:opacity-80"
      >
        {icon}
        <span>{label}</span>
      </a>
    );
  };

  const boosterNavItems = [
    { key: "dashboard", label: "Dashboard", href: "/booster-dashboard", icon: <LayoutDashboard className="h-5 w-5" />, isActive: true },
    { key: "requests", label: "Requests", href: "/booster-requests", icon: <ClipboardList className="h-5 w-5" />, isActive: false },
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
        onToggleNotifications={handleNotificationToggle}
        onMarkNotificationsRead={markAllAsRead}
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
          active="dashboard"
          isOnline={isSidebarOnline}
          onToggleOnline={async () => {
            const newStatus = !isSidebarOnline;
            setIsSidebarOnline(newStatus);
            // Update backend presence
            if (session?.user?.id) {
              await fetch(`/api/users/${session.user.id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isOnline: newStatus }),
              }).catch((err) =>
                console.error("Failed to update presence:", err)
              );
            }
          }}
          mainGame={userProfile?.boosterProfile?.mainGame?.name || savedPrimaryGame}
          rankInfo={userProfile?.boosterProfile?.rankInfo}
          xp={userProfile?.boosterProfile?.xp}
        />
      )}

      <main className={`h-screen overflow-y-auto pb-24 pl-8 pr-8 pt-24 transition-all duration-300 ${hideSidebar ? "" : "md:ml-64"}`}>
        <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="font-headline mb-2 text-4xl font-bold tracking-tight text-on-surface">
              Dashboard
            </h1>
            <p className="font-medium text-on-surface-variant">
              Session Active: <span className="text-primary">{dashboardData.sessionActive}</span>
            </p>
            {isDashboardLoading ? (
              <p className="mt-2 text-xs uppercase tracking-widest text-on-surface-variant">
                Waiting for backend data...
              </p>
            ) : null}
          </div>
        </header>

        <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="ghost-border group rounded-xl bg-surface-container-high p-6 transition-colors hover:bg-surface-bright">
            <div className="mb-4 flex items-start justify-between">
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <Rocket className="h-5 w-5" />
              </span>
              <span className="rounded bg-primary/5 px-2 py-1 text-xs font-bold text-primary">
                {dashboardData.activeOrdersDeltaPct >= 0 ? "+" : ""}
                {dashboardData.activeOrdersDeltaPct}%
              </span>
            </div>
            <span className="mb-1 block text-sm font-medium text-on-surface-variant">Active Orders</span>
            <span className="text-3xl font-bold tracking-tighter">{dashboardData.activeOrdersCount}</span>
          </div>

          <div className="ghost-border group rounded-xl bg-surface-container-high p-6 transition-colors hover:bg-surface-bright">
            <div className="mb-4 flex items-start justify-between">
              <span className="rounded-lg bg-secondary/10 p-2 text-secondary">
                <ClipboardList className="h-5 w-5" />
              </span>
              <span className="rounded bg-secondary/5 px-2 py-1 text-xs font-bold text-secondary">
                {dashboardData.newRequestsCount} New
              </span>
            </div>
            <span className="mb-1 block text-sm font-medium text-on-surface-variant">Pending Requests</span>
            <span className="text-3xl font-bold tracking-tighter">{dashboardData.pendingRequestsCount}</span>
          </div>

          <div className="ghost-border group rounded-xl bg-surface-container-high p-6 transition-colors hover:bg-surface-bright">
            <div className="mb-4 flex items-start justify-between">
              <span className="rounded-lg bg-tertiary/10 p-2 text-tertiary">
                <DollarSign className="h-5 w-5" />
              </span>
            </div>
            <span className="mb-1 block text-sm font-medium text-on-surface-variant">Monthly Earnings</span>
            <span className="text-3xl font-bold tracking-tighter">{formatCurrency(dashboardData.monthlyEarnings)}</span>
          </div>

          <div className="ghost-border group rounded-xl bg-surface-container-high p-6 transition-colors hover:bg-surface-bright">
            <div className="mb-4 flex items-start justify-between">
              <span className="rounded-lg bg-on-surface/10 p-2 text-on-surface">
                <Mail className="h-5 w-5" />
              </span>
            </div>
            <span className="mb-1 block text-sm font-medium text-on-surface-variant">New Messages</span>
            <span className="text-3xl font-bold tracking-tighter">{dashboardData.newMessagesCount}</span>
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <section>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  <span className="h-6 w-1.5 rounded-full bg-primary"></span>
                  Incoming Requests
                </h2>
                <button className="text-sm font-bold text-primary hover:underline">View All Queue</button>
              </div>

              <div className="space-y-4">
                {dashboardData.incomingRequests.length > 0 ? (
                  dashboardData.incomingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="ghost-border flex flex-col justify-between gap-6 rounded-xl bg-surface-container-low p-5 transition-all hover:bg-surface-container md:flex-row md:items-center"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-outline-variant/20 bg-surface-container-highest">
                          {request.tone === "secondary" ? (
                            <Gamepad2 className="h-8 w-8 text-secondary" />
                          ) : (
                            <Swords className="h-8 w-8 text-tertiary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-on-surface">{request.game}</h3>
                          <p className="text-xs text-on-surface-variant">
                            Request: <span className={request.tone === "secondary" ? "text-secondary" : "text-tertiary"}>{request.detail}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center md:items-end">
                        <span className="text-xl font-bold text-primary">${request.amount.toFixed(2)}</span>
                        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">Est. Time: {request.etaHours}h</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="px-4 py-2 text-on-surface-variant transition-all hover:text-error">
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ghost-border rounded-xl bg-surface-container-low p-5 text-xs uppercase tracking-widest text-on-surface-variant">
                    No incoming requests yet.
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  <span className="h-6 w-1.5 rounded-full bg-tertiary"></span>
                  Active Orders
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {dashboardData.activeOrders.length > 0 ? (
                  dashboardData.activeOrders.map((item) => (
                  <div key={item.id} className="ghost-border relative overflow-hidden rounded-xl bg-surface-container p-6">
                    <div className="absolute right-0 top-0 p-3">
                      <span className="rounded bg-tertiary/10 px-2 py-1 text-[10px] font-black uppercase tracking-tighter text-tertiary">
                        In Progress
                      </span>
                    </div>
                    <div className="mb-4">
                      <span className="mb-1 block text-[10px] uppercase tracking-widest text-on-surface-variant">
                        Customer: {item.customer}
                      </span>
                      <h3 className="text-lg font-bold">{item.name}</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-on-surface-variant">Current Progress</span>
                        <span className="font-bold text-primary">{item.pct}%</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-variant">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${item.pct}%` }}></div>
                      </div>
                    </div>
                    <button className="mt-6 w-full rounded-md border border-outline-variant/30 py-2 text-sm font-bold text-on-surface transition-all hover:bg-surface-bright">
                      View Details
                    </button>
                  </div>
                ))
                ) : (
                  <div className="ghost-border rounded-xl bg-surface-container p-6 text-xs uppercase tracking-widest text-on-surface-variant md:col-span-2">
                    No active orders yet.
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                    <span className="h-6 w-1.5 rounded-full bg-primary"></span>
                    Received Orders Trend
                  </h2>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {dashboardData.trendGrowthPct >= 0 ? "+" : ""}
                    {dashboardData.trendGrowthPct}% Monthly Growth
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Last 30 Days
                  </span>
                </div>
              </div>

              <div className="ghost-border group relative overflow-hidden rounded-xl bg-surface-container-low p-6">
                <div className="relative h-[200px] w-full">
                  <svg className="h-full w-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <line x1="0" y1="10" x2="100" y2="10" strokeWidth="0.1" className="stroke-outline-variant/10" />
                    <line x1="0" y1="20" x2="100" y2="20" strokeWidth="0.1" className="stroke-outline-variant/10" />
                    <line x1="0" y1="30" x2="100" y2="30" strokeWidth="0.1" className="stroke-outline-variant/10" />

                    <defs>
                      <linearGradient id="linearAreaGradientDashboard" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00eefc" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#00eefc" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <path
                      d={trendPath}
                      fill="none"
                      stroke="#00eefc"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="graph-line"
                    />

                    <path
                      d={trendAreaPath}
                      fill="url(#linearAreaGradientDashboard)"
                    />

                    <circle cx="100" cy={latestPointY} r="1.5" fill="#0b0e14" stroke="#00eefc" strokeWidth="1" />
                  </svg>
                </div>

                <div className="mt-4 flex justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <span>30 Days Ago</span>
                  <span>15 Days Ago</span>
                  <span>Today</span>
                </div>

                <div className="absolute right-6 top-6 flex items-center gap-2 rounded-lg border border-white/5 bg-surface-bright/80 px-3 py-1.5 shadow-xl backdrop-blur-md">
                  <span className="text-[10px] font-bold text-on-surface-variant">Avg. Weekly:</span>
                  <span className="text-xs font-black text-primary">{dashboardData.trendAvgWeekly} Orders</span>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8 lg:col-span-4">
            <section className="ghost-border overflow-hidden rounded-xl bg-surface-container-high">
              <div className="flex items-center justify-between border-b border-outline-variant/10 p-5">
                <h2 className="font-bold tracking-tight">Recent Messages</h2>
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-on-primary-fixed">
                  {dashboardData.newMessagesCount} NEW
                </span>
              </div>

              <div className="divide-y divide-outline-variant/5">
                {dashboardData.recentMessages.length > 0 ? (
                  dashboardData.recentMessages.map((item) => (
                  <div key={item.id} className="flex cursor-pointer gap-4 p-4 transition-all hover:bg-surface-bright">
                    <img alt={item.user} className={`h-10 w-10 rounded-full border ${item.border}`} src={item.img} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="truncate text-sm font-bold">{item.user}</span>
                        <span className="text-[10px] text-on-surface-variant">{item.time}</span>
                      </div>
                      <p className="truncate text-xs text-on-surface-variant">{item.msg}</p>
                    </div>
                  </div>
                ))
                ) : (
                  <div className="p-4 text-xs uppercase tracking-widest text-on-surface-variant">
                    No new messages.
                  </div>
                )}
              </div>

              <Link
                href="/booster-chats"
                className="block w-full py-3 text-center text-xs font-bold text-on-surface-variant transition-all hover:text-primary"
              >
                Go to Messenger
              </Link>
            </section>

            <section className="ghost-border rounded-xl bg-surface-container-low p-5">
              <h2 className="mb-6 flex items-center gap-2 font-bold tracking-tight">
                <ShieldCheck className="h-4 w-4 text-secondary" />
                Activity Feed
              </h2>
              <div className="relative space-y-6 before:absolute before:bottom-2 before:left-3 before:top-2 before:w-px before:bg-outline-variant/20">
                {dashboardData.activityFeed.length > 0 ? (
                  dashboardData.activityFeed.map((item) => (
                    <div key={item.id} className="relative pl-8">
                      <div className={`absolute left-1.5 top-1.5 h-3 w-3 rounded-full ${item.tone === "primary" ? "bg-primary" : "bg-secondary"} ring-4 ring-surface-container-low`}></div>
                      <span className="mb-1 block text-[10px] uppercase tracking-widest text-on-surface-variant">{item.time}</span>
                      <p className="text-xs font-medium leading-relaxed">{item.msg}</p>
                    </div>
                  ))
                ) : (
                  <div className="relative pl-8 text-xs uppercase tracking-widest text-on-surface-variant">
                    No recent activity.
                  </div>
                )}
              </div>
            </section>

            <div className="group relative overflow-hidden rounded-xl border border-cyan-400/20 bg-slate-950 p-6">
              <div className="relative z-10">
                <h3 className="mb-2 text-lg font-black text-cyan-400">ELITE STATUS</h3>
                <p className="mb-4 text-xs leading-relaxed text-slate-300">
                  You are in the top {dashboardData.eliteTopPct}% of boosters this month. Maintain your rating to unlock 2%
                  commission reduction.
                </p>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-cyan-400" />
                  <span className="font-bold text-cyan-400">{dashboardData.eliteRating.toFixed(2)} Rating</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-cyan-400/5 blur-2xl transition-all duration-700 group-hover:bg-cyan-400/10"></div>
            </div>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-white/5 bg-slate-950/90 px-4 backdrop-blur-xl md:hidden">
        <button className="flex flex-col items-center gap-1 text-cyan-400">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
          <Rocket className="h-5 w-5" />
          <span className="text-[10px]">Queue</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
          <MessageSquare className="h-5 w-5" />
          <span className="text-[10px]">Chat</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
          <Monitor className="h-5 w-5" />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>
    </>
  );
}
