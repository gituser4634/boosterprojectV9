"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { Home, Search, ClipboardList, MessageSquare, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ClientProfileMenu } from "@/components/shared/client-profile-menu";
import { BoosterProfileMenu } from "@/components/shared/booster-profile-menu";
import { ClientSidebar, ClientMobileNav } from "@/components/client/shell-navigation";
import { BoosterTopBar } from "@/components/booster/top-bar";
import { useNotifications } from "@/hooks/use-notifications";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

type ClientOrder = {
  id: string;
  game: string;
  service: string;
  status: "pending" | "accepted";
  createdAt: string;
};

export default function ClientOrdersPage() {
  const { data: session } = useSession();
  const [orders] = useState<ClientOrder[]>([]);
  const [message] = useState<string | null>(
    "Temporary auth was removed. Connect your real backend to load client orders."
  );
  
  const router = useRouter();
  const [isNotificationsOn, setIsNotificationsOn] = useState(true);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const [hideSidebar, setHideSidebar] = useState(false);
  
  // Persistence for UI preferences
  useEffect(() => {
    const saved = window.localStorage.getItem("zenith-hide-sidebar") === "true";
    setHideSidebar(saved);
  }, []);

  const { notifications: realNotifications, unreadCount: realUnreadCount, markAllAsRead } = useNotifications();
  const avatarUrl = session?.user?.image ?? "/booster-pfps/default-avatar.svg";

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "pending"),
    [orders]
  );
  const acceptedOrders = useMemo(
    () => orders.filter((order) => order.status === "accepted"),
    [orders]
  );

  const clientNavItems = [
    { key: "home", label: "Home", href: "/", icon: <Home className="h-5 w-5" />, isActive: false },
    { key: "browse", label: "Browse", href: "/booster-browse", icon: <Search className="h-5 w-5" />, isActive: false },
    { key: "orders", label: "Orders", href: "/client-orders", icon: <ClipboardList className="h-5 w-5" />, isActive: true },
    { key: "chats", label: "Messages", href: "/client-chats", icon: <MessageSquare className="h-5 w-5" />, isActive: false },
    { key: "settings", label: "Settings", href: "/client-settings", icon: <Settings className="h-5 w-5" />, isActive: false },
  ];

  return (
    <>
      {!hideSidebar && <ClientSidebar active="orders" />}

      <BoosterTopBar
        brandLabel="ZENITH CLIENT"
        brandClassName="font-headline text-2xl font-bold uppercase tracking-tighter text-primary transition hover:text-primary-fixed"
        headerClassName={`fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#0b0e14]/65 px-8 ${hideSidebar ? "" : "pl-72"} shadow-sm shadow-black/20 backdrop-blur-xl`}
        rightClassName="flex items-center gap-6 pr-8"
        avatarUrl={avatarUrl}
        navItems={hideSidebar ? clientNavItems : undefined}
        avatarAlt="User Avatar"
        avatarBorderClassName="border-primary/30"
        isNotificationsOn={isNotificationsOn}
        unreadNotificationCount={realUnreadCount}
        isNotificationsPanelOpen={isNotificationsPanelOpen}
        onToggleNotificationsPanel={() => { setIsProfileMenuOpen(false); setIsNotificationsPanelOpen((c) => !c); }}
        onCloseNotificationsPanel={() => setIsNotificationsPanelOpen(false)}
        onToggleNotifications={() => setIsNotificationsOn((c) => !c)}
        onMarkNotificationsRead={markAllAsRead}
        notifications={realNotifications}
        isProfileMenuOpen={isProfileMenuOpen}
        onToggleProfileMenu={() => { setIsNotificationsPanelOpen(false); setIsProfileMenuOpen((c) => !c); }}
        onCloseProfileMenu={() => setIsProfileMenuOpen(false)}
        onProfileAction={async (action) => {
          if (action === "Settings") { router.push("/client-settings"); return; }
          if (action === "Logout") { await signOut({ callbackUrl: "/" }); return; }
          setIsProfileMenuOpen(false);
        }}
      />

      <main className={`${hideSidebar ? "" : "ml-64"} min-h-screen bg-background pt-24 pb-20 transition-all duration-300`}>
        <div className="mx-auto max-w-6xl px-12">
          <h1 className="font-headline mb-3 text-5xl font-bold uppercase italic tracking-tight text-on-surface">My Orders</h1>
          <p className="mb-8 text-on-surface-variant">Track pending and accepted orders you sent.</p>

          {message ? (
            <div className="mb-6 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-error">
              {message}
            </div>
          ) : null}

          <section className="mb-6">
            <h2 className="font-headline mb-3 text-2xl font-bold text-on-surface">Pending</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {pendingOrders.length === 0 ? (
                <div className="ghost-border rounded-xl bg-surface-container-low p-5 text-sm text-on-surface-variant">No pending orders.</div>
              ) : (
                pendingOrders.map((order) => (
                  <article key={order.id} className="ghost-border rounded-xl bg-surface-container-low p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Pending</p>
                    <h3 className="font-headline mt-2 text-xl font-bold">{order.game}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">{order.service}</p>
                    <p className="mt-3 text-[11px] uppercase tracking-wider text-on-surface-variant">{new Date(order.createdAt).toLocaleString()}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="font-headline mb-3 text-2xl font-bold text-on-surface">Accepted</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {acceptedOrders.length === 0 ? (
                <div className="ghost-border rounded-xl bg-surface-container-low p-5 text-sm text-on-surface-variant">No accepted orders yet.</div>
              ) : (
                acceptedOrders.map((order) => (
                  <article key={order.id} className="ghost-border rounded-xl bg-surface-container-low p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Accepted</p>
                    <h3 className="font-headline mt-2 text-xl font-bold">{order.game}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">{order.service}</p>
                    <p className="mt-3 text-[11px] uppercase tracking-wider text-on-surface-variant">{new Date(order.createdAt).toLocaleString()}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <ClientMobileNav active="orders" avatarUrl={avatarUrl} />
    </>
  );
}
