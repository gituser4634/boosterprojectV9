import Image from "next/image";
import Link from "next/link";
import { ClipboardList, LayoutDashboard, MessageSquare, Settings, Search, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

type ClientSection = "home" | "browse" | "orders" | "chats" | "settings";

type ClientSidebarProps = {
  active: ClientSection;
};

type ClientMobileNavProps = {
  active: ClientSection;
  avatarUrl?: string;
};

const navItems: Array<{ key: ClientSection; label: string; mobileLabel: string; href: string }> = [
  { key: "home", label: "Home", mobileLabel: "HOME", href: "/" },
  { key: "browse", label: "Browse", mobileLabel: "SHOP", href: "/booster-browse" },
  { key: "orders", label: "Orders", mobileLabel: "ORDR", href: "/client-orders" },
  { key: "chats", label: "Messages", mobileLabel: "CHAT", href: "/client-chats" },
  { key: "settings", label: "Settings", mobileLabel: "SET", href: "/client-settings" },
];

const getIcon = (key: ClientSection) => {
  if (key === "home") return <Home className="h-5 w-5" />;
  if (key === "browse") return <Search className="h-5 w-5" />;
  if (key === "orders") return <ClipboardList className="h-5 w-5" />;
  if (key === "settings") return <Settings className="h-5 w-5" />;
  return <MessageSquare className="h-5 w-5" />;
};

function ClientSidebar({ active }: ClientSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-white/15 bg-[#04060a]/95 pt-20 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <div className="mb-4 flex flex-col items-center border-b border-white/5 px-6 py-8">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_30px_rgba(143,245,255,0.1)]">
          <Image src="/logo.svg" alt="Zenith Logo" width={48} height={48} className="brightness-125" />
        </div>
        <h3 className="font-headline text-xl font-bold tracking-tighter text-on-surface uppercase italic">Zenith Client</h3>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mt-1">Premium Gaming Services</p>
      </div>

      <nav className="font-label flex grow flex-col gap-2 p-4 text-sm font-semibold tracking-wide">
        {navItems.map((item) => {
          const isActive = item.key === active;
          if (isActive) {
            return (
              <div key={item.key} className="flex items-center gap-3 rounded-l-lg border-r-2 border-primary bg-primary/10 p-3 text-primary">
                {getIcon(item.key)}
                <span>{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-3 text-slate-500 transition-all duration-300 hover:translate-x-1 hover:border-primary/40 hover:bg-primary/10 hover:text-primary-fixed hover:shadow-[0_0_22px_rgba(34,211,238,0.25)] active:opacity-80"
            >
              {getIcon(item.key)}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-5">
        <div className="mb-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <Link href="/support" className="flex items-center gap-3 rounded-lg px-4 py-2 text-slate-500 transition-all hover:bg-white/5 hover:text-slate-300">
          <Settings className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Help & Support</span>
        </Link>
      </div>
    </aside>
  );
}

function ClientMobileNav({ active, avatarUrl }: ClientMobileNavProps) {
  const labelClass = "text-[10px] font-bold uppercase tracking-tighter";

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-white/10 bg-slate-950/90 px-4 backdrop-blur-xl md:hidden">
      {navItems.map((item) => {
        const isActive = item.key === active;
        return (
          <Link key={item.key} href={item.href} className={`flex flex-col items-center gap-1 ${isActive ? "text-primary" : "text-slate-500"}`}>
            {getIcon(item.key)}
            <span className={labelClass}>{item.mobileLabel}</span>
          </Link>
        );
      })}
      <Link href="/client-settings" className="flex flex-col items-center gap-1 text-slate-500">
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

export { ClientMobileNav, ClientSidebar };
