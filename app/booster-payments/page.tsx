"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ArrowRight,
  Bell,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  WalletCards,
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoosterMobileNav, BoosterSidebar } from "@/components/booster/shell-navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BoosterTopBar, type NotificationItem } from "@/components/booster/top-bar";
import { useNotifications } from "@/hooks/use-notifications";
import { useSession } from "next-auth/react";

type OrderRow = {
  id: string;
  date: string;
  service: string;
  serviceTone: "secondary" | "tertiary";
  commission: string;
  netAmount: string;
};

export default function BoosterPaymentsPage() {
  const router = useRouter();
  const [isNotificationsOn, setIsNotificationsOn] = useState(true);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSidebarOnline, setIsSidebarOnline] = useState(true);
  const { 
    notifications: realNotifications, 
    unreadCount: realUnreadCount, 
    markAllAsRead 
  } = useNotifications();
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

  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [availableBalance] = useState(0);
  const [balanceChangePercent] = useState(0);
  const [pendingPayouts] = useState(0);
  const [settlementHours] = useState(0);
  const [totalTaxable] = useState(0);
  const [taxPeriodLabel] = useState("Tax Year 2024 • Fiscal Period Q3");
  const [weeklyRevenue] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [completedOrders] = useState<OrderRow[]>([]);
  const avatarUrl = session?.user?.image ?? "/booster-pfps/default-avatar.svg";

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

  const maxWeeklyRevenue = Math.max(...weeklyRevenue, 1);
  const weeklyHeights = weeklyRevenue.map((value) => `${(value / maxWeeklyRevenue) * 100}%`);
  const filteredOrders = completedOrders.filter((order) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;

    return (
      order.id.toLowerCase().includes(term) ||
      order.service.toLowerCase().includes(term) ||
      order.date.toLowerCase().includes(term)
    );
  });

  const handleMarkNotificationsRead = () => {
    markAllAsRead();
  };

  const csvEscape = (value: string | number) => {
    const raw = String(value);
    if (raw.includes(",") || raw.includes("\n") || raw.includes('"')) {
      return `"${raw.replace(/"/g, '""')}"`;
    }

    return raw;
  };

  const handleDownloadReport = () => {
    const generatedAt = new Date();
    const generatedAtIso = generatedAt.toISOString();
    const dateStamp = generatedAtIso.slice(0, 10);

    const summaryRows = [
      ["Metric", "Value"],
      ["Generated At", generatedAtIso],
      ["Tax Period", taxPeriodLabel],
      ["Available Balance", availableBalance],
      ["Balance Change Percent", balanceChangePercent],
      ["Pending Payouts", pendingPayouts],
      ["Settlement Hours", settlementHours],
      ["Total Taxable", totalTaxable],
      ["Completed Orders Count", completedOrders.length],
    ];

    const weeklyRows = [
      ["Day", "Revenue"],
      ...weekDays.map((day, index) => [day, weeklyRevenue[index] ?? 0]),
    ];

    const ordersRows = [
      ["Order ID", "Date", "Service Type", "Commission", "Net Amount", "Status"],
      ...completedOrders.map((order) => [
        order.id,
        order.date,
        order.service,
        order.commission,
        order.netAmount,
        "Completed",
      ]),
    ];

    const allRows = [
      ["Payments Report"],
      [],
      ...summaryRows,
      [],
      ["Weekly Revenue"],
      ...weeklyRows,
      [],
      ["Completed Orders"],
      ...ordersRows,
    ];

    const csvContent = allRows
      .map((row) => row.map((cell) => csvEscape(cell)).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `payments-report-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  const boosterNavItems = [
    { key: "dashboard", label: "Dashboard", href: "/booster-dashboard", icon: <LayoutDashboard className="h-5 w-5" />, isActive: false },
    { key: "requests", label: "Requests", href: "/booster-requests", icon: <ClipboardList className="h-5 w-5" />, isActive: false },
    { key: "payments", label: "Payments", href: "/booster-payments", icon: <WalletCards className="h-5 w-5" />, isActive: true },
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
          active="payments"
          isOnline={isSidebarOnline}
          onToggleOnline={() => setIsSidebarOnline((current) => !current)}
          mainGame={userProfile?.boosterProfile?.mainGame?.name || savedPrimaryGame}
          rankInfo={userProfile?.boosterProfile?.rankInfo}
          xp={userProfile?.boosterProfile?.xp}
        />
      )}

      <main className={`h-screen overflow-y-auto bg-background pb-12 pl-6 pr-6 pt-24 transition-all duration-300 ${hideSidebar ? "" : "ml-64"}`}>
        <div className="mx-auto max-w-7xl">
          <header className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h1 className="font-headline mb-4 text-5xl font-bold uppercase italic leading-none tracking-tighter text-on-surface md:text-7xl">
                Earnings
              </h1>
              <p className="text-lg font-light leading-relaxed text-on-surface-variant">
                Track your performance revenue, monitor pending commissions, and manage your wallet
                settlements with precision-grade analytics.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleDownloadReport}
                className="ghost-border rounded-md bg-surface-container-high/70 px-6 py-3 text-sm font-bold uppercase tracking-widest text-secondary transition-all hover:bg-secondary/10 active:scale-95"
              >
                Download Report
              </Button>
              <Button
                type="button"
                className="rounded-md bg-gradient-to-br from-primary to-primary-container px-8 py-3 text-sm font-bold uppercase tracking-widest text-on-primary-fixed transition-all hover:shadow-[0_0_20px_rgba(143,245,255,0.3)] active:scale-95"
              >
                Withdraw Now
              </Button>
            </div>
          </header>

          <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="ghost-border relative overflow-hidden rounded-xl bg-surface-container-high/70 p-8 md:col-span-8">
              <div className="absolute right-0 top-0 p-8 opacity-15">
                <WalletCards className="h-24 w-24 text-primary" />
              </div>

              <Label className="font-label mb-2 block text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
                Available Balance
              </Label>
              <div className="mb-8 flex items-baseline gap-2">
                <span className="font-headline text-6xl font-black tracking-tighter text-on-surface md:text-8xl">
                  {formatCurrency(availableBalance)}
                </span>
                <span className="text-xl font-bold text-secondary">{formatPercent(balanceChangePercent)}</span>
              </div>

              <div className="flex h-24 w-full items-end gap-2">
                {weeklyHeights.map((height, index) => (
                  <div
                    key={`weekly-bar-${index}`}
                    className={`flex-1 rounded-t-sm ${
                      index === 4
                        ? "border-t-2 border-primary bg-primary/20"
                        : "bg-surface-container-highest transition-colors hover:bg-primary/40"
                    }`}
                    style={{ height }}
                  ></div>
                ))}
              </div>

              <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-widest text-outline">
                {weekDays.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6 md:col-span-4">
              <div className="ghost-border flex flex-1 flex-col justify-between rounded-xl bg-surface-container-high/70 p-6">
                <div>
                  <Label className="font-label mb-1 block text-[10px] font-extrabold uppercase tracking-[0.2em] text-outline">
                    Pending Payouts
                  </Label>
                  <p className="font-headline text-4xl font-bold text-on-surface">{formatCurrency(pendingPayouts)}</p>
                </div>
                <div className="mt-3 inline-flex w-fit items-center gap-2 rounded bg-tertiary/5 px-2 py-1 text-xs font-bold text-tertiary-dim">
                  <Bell className="h-3.5 w-3.5" />
                  Settlement in {settlementHours}h
                </div>
              </div>

              <div className="ghost-border flex flex-1 flex-col justify-between rounded-xl bg-surface-container-high/70 p-6">
                <div>
                  <Label className="font-label mb-1 block text-[10px] font-extrabold uppercase tracking-[0.2em] text-outline">
                    Total Taxable
                  </Label>
                  <p className="font-headline text-4xl font-bold text-on-surface">{formatCurrency(totalTaxable)}</p>
                </div>
                <p className="text-[10px] uppercase tracking-wider text-outline">{taxPeriodLabel}</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl bg-surface-container-low">
            <div className="flex items-center justify-between p-6">
              <h3 className="font-headline text-2xl font-bold uppercase italic tracking-tight">
                Completed Orders
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                  <Input
                    type="text"
                    placeholder="Search ID..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="h-9 w-48 rounded-sm border-none bg-surface-container-lowest py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary"
                  />
                </div>
                <Button type="button" className="p-2 text-outline transition-colors hover:text-on-surface">
                  <Filter className="h-4.5 w-4.5" />
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-container text-left">
                    <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-outline">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-outline">
                      Date
                    </th>
                    <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-outline">
                      Service Type
                    </th>
                    <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-outline">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-extrabold uppercase tracking-[0.2em] text-outline">
                      Commission (15%)
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
                      Net Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.02]">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="cursor-pointer transition-colors hover:bg-surface-bright"
                      >
                        <td className="px-6 py-5 font-headline font-bold text-on-surface">{order.id}</td>
                        <td className="px-6 py-5 text-sm text-on-surface-variant">{order.date}</td>
                        <td className="px-6 py-5">
                          <span
                            className={`rounded px-2 py-1 text-xs font-bold uppercase tracking-wider ${
                              order.serviceTone === "secondary"
                                ? "bg-secondary/10 text-secondary"
                                : "bg-tertiary/10 text-tertiary"
                            }`}
                          >
                            {order.service}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(143,245,255,0.6)]"></span>
                            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right text-sm font-medium text-error-dim">
                          {order.commission}
                        </td>
                        <td className="px-6 py-5 text-right font-headline font-bold text-primary">
                          {order.netAmount}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-6 py-8 text-sm text-on-surface-variant" colSpan={6}>
                        No payment data yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-center gap-2 p-6">
              <Button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-sm bg-surface-container text-outline transition-colors hover:text-on-surface"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-xs font-bold text-on-primary-fixed"
              >
                1
              </Button>
              <Button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-sm bg-surface-container text-xs font-bold text-outline transition-colors hover:text-on-surface"
              >
                2
              </Button>
              <Button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-sm bg-surface-container text-xs font-bold text-outline transition-colors hover:text-on-surface"
              >
                3
              </Button>
              <Button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-sm bg-surface-container text-outline transition-colors hover:text-on-surface"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </section>

          <section className="group relative mt-12 h-64 overflow-hidden rounded-xl">
            <img
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Neon gaming arena"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfne0XVaSyF2nBJ4DsWbzlHQAti9R0jO5DLsD6qBwoIqObjXI35Jok_8UzY_qClpuuX-tXQynO2lmd2cz2uF_xqWVeAkA2xX4mpRE3DZ7ekLraDWb0WlIoIn5jvyPhRqObVza2hvWL0n8PmCdYF9RyBfpKDjVMhBFKmq9mPlp8sDiCZFf863aRe_RlXjBaqmFPmRz2CDauTz-L2nJJkLA7Vw2Hquh5rFKpEUw88-gSEiTGT-dtJP7ZMcif3GCIRbao5VJTiwsag5U"
            />
            <div className="absolute inset-0 flex items-center bg-gradient-to-r from-background via-background/80 to-transparent px-12">
              <div className="max-w-md">
                <h2 className="font-headline mb-2 text-3xl font-bold uppercase italic text-on-surface">
                  Refer a Colleague
                </h2>
                <p className="mb-6 text-sm text-on-surface-variant">
                  Earn 5% flat commission from every boost your referee completes in their first 3
                  months.
                </p>
                <Button type="button" className="group/btn flex items-center gap-2">
                  <span className="font-label text-xs font-extrabold uppercase tracking-widest text-primary">
                    Get Referral Link
                  </span>
                  <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <BoosterMobileNav active="payments" avatarUrl={avatarUrl} />
    </>
  );
}


