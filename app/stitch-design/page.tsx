"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Diamond,
  Gamepad2,
  Headset,
  PlayCircle,
  Rocket,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AuthLoginModal, AuthRegisterModal, TermsModal, ForgotPasswordModal } from "@/components/shared/auth-modals";
import { ClientProfileMenu } from "@/components/shared/client-profile-menu";
import { BoosterProfileMenu } from "@/components/shared/booster-profile-menu";
import { buildBrowseSearchUrl } from "@/lib/search-url";

export default function StitchDesignPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isClientLoggedIn = session?.user?.role === "CLIENT";
  const isBoosterLoggedIn = session?.user?.role === "BOOSTER";
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginType, setLoginType] = useState<"booster" | "client">("booster");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerType, setRegisterType] = useState<"booster" | "client">("booster");
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchScope, setSearchScope] = useState<"all" | "clients" | "boosters">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const featureCards = [
    {
      title: "Elite Pros Only",
      description:
        "We strictly recruit from the top 0.1% of every region. Every booster undergoes rigorous background and skill verification.",
      icon: "workspace_premium",
      color: "text-primary bg-primary/10",
    },
    {
      title: "Secure & Private",
      description:
        "Your account safety is our priority. We use military-grade VPNs and customized hardware IDs for every session.",
      icon: "shield_with_heart",
      color: "text-secondary bg-secondary/10",
    },
    {
      title: "24/7 Support",
      description:
        "Dedicated account managers available around the clock to track your progress and answer questions instantly.",
      icon: "support_agent",
      color: "text-tertiary bg-tertiary/10",
    },
  ];

  const [boosters, setBoosters] = useState<
    Array<{
      id?: string;
      name: string;
      game: string;
      rating: string;
      rank: string;
      rankIcon: string;
      live: boolean;
      image: string;
      success?: number;
    }>
  >([
    {
      name: "MOHAMED123",
      game: "Apex Legends",
      rating: "5.0",
      rank: "Apex Predator",
      rankIcon: "military_tech",
      live: true,
      image:
        "https://scontent.ftun15-1.fna.fbcdn.net/v/t39.30808-1/576952454_1436088074602191_7652156089798589190_n.jpg?stp=c446.0.1148.1148a_dst-jpg_s200x200_tt6&_nc_cat=103&ccb=1-7&_nc_sid=e99d92&_nc_ohc=5FwttousWeUQ7kNvwE2_dOn&_nc_oc=AdpPk4mtAIl23paB3xhJJBwWv2nX6TeHu1ST7rflEfluu-RBof0n3HUrQ-vTuGuZWxE&_nc_zt=24&_nc_ht=scontent.ftun15-1.fna&_nc_gid=SLWLHC_59ZkFmSMtogr80A&_nc_ss=7a3a8&oh=00_Af0A48KoauoK8UwFMnMGF5pzA-Y_8_wIedIQnnUsCPbeBw&oe=69E194CD",
      success: 97,
    },
    {
      name: "SALMA444",
      game: "Valorant",
      rating: "4.9",
      rank: "Radiant #42",
      rankIcon: "workspace_premium",
      live: false,
      image:
        "https://scontent.ftun15-1.fna.fbcdn.net/v/t39.30808-1/410088379_1490825255102121_3710042049867810931_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=101&ccb=1-7&_nc_sid=e99d92&_nc_ohc=_kSMp2EeG-QQ7kNvwGlNKTg&_nc_oc=Adp_MILVnCVDTs_ebIdxlYcwbG3_fRIPGGzTeVjxZdpz9LtfAQYSkwXlqV2PdBgTD9Y&_nc_zt=24&_nc_ht=scontent.ftun15-1.fna&_nc_gid=AqYDt4sKU_0rHSiYRfXtxQ&_nc_ss=7a3a8&oh=00_Af1zWPBcBpwet9BbP-YmFjO9zrg2lYLFHfRbmRHcVdvpWQ&oe=69E192A2",
    },
    {
      name: "Adam",
      game: "League of Legends",
      rating: "5.0",
      rank: "Challenger",
      rankIcon: "stars",
      live: false,
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Black_colour.jpg/960px-Black_colour.jpg",
    },
    {
      name: "TAHERXx12",
      game: "Overwatch 2",
      rating: "4.8",
      rank: "Top 500",
      rankIcon: "trophy",
      live: false,
      image:
        "https://scontent.ftun15-1.fna.fbcdn.net/v/t39.30808-1/462228392_2496981260655405_7587418930506211631_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=110&ccb=1-7&_nc_sid=e99d92&_nc_ohc=2WP56qrdVRsQ7kNvwFWkYS1&_nc_oc=Adoq-ZuUDnBhCQbyAR9VqREYcSxy5LvOkJlDh0N84iYLiDROjba75ybNbZY9hlt-tko&_nc_zt=24&_nc_ht=scontent.ftun15-1.fna&_nc_gid=mhkCClg0bo0Nr3kTbd-DLg&_nc_ss=7a3a8&oh=00_Af0mTktaRLpe0cPJdYydbfjfpXr8CNbc7S3pXGW71HVz1w&oe=69E1BA45",
      success: 82,
    },
  ]);

  useEffect(() => {
    const fetchTopBoosters = async () => {
      try {
        const response = await fetch("/api/boosters?limit=4");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setBoosters(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch top boosters:", error);
      }
    };
    fetchTopBoosters();
  }, []);

  const reviews = [
    {
      quote:
        '"Needed help getting through Platinum hell in Apex. Commander Z was a beast. Finished the boost 2 days earlier than expected. Truly elite service."',
      name: "Rayen",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDNXsUfB_KRjVToDPWa4taaWWzLGwaIZCLMErgSWZ_AcTWhAQzh25zYapvScWeR4MAZxn5MTjkscV_hXSNz-OKryhv3eW62cOY4ArfbJPv5nnv-aYDSO5JelHpca-s__lxnkG8sL6LjuhP3oSFLL6dZYkZyEowgUUrWKRIucP1eiteFhGX00XenhjXwDW372r7OkidhsZnFeOMSazPyeLNaMHENDtniIM_uYyuYSVczxszO6T-3UaJuTgBMhKy53u6I1xAPDKoq7oo",
    },
    {
      quote:
        '"Privacy was my biggest concern. Zenith\'s dashboard made me feel completely at ease. I could track every game without revealing my credentials."',
      name: "Khaled.",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB7lsycYM7JNpQWzAywiY8kd9dKWA2T1jzpHzwd00HGfr0YPpmGMmVdFRe8WpdDds7YqzhIYTA7GVd-VmpO4nHw-MRpluLpTL6pSVoub_NhxODHF-F2WeNbjOSToBi_X4jpsyZj6AMFJX4pCLvB9NhNiYTRLgHRpfu2nGhvZrBSxARH0TzsYIWDnbR0TF7AMTFfkiLEBvi77BYBsZ6PerIkwR3l-A9sHGE4sIgHxLw7WevG1H5ARSVkdMbCB3JJQNIhAT16T79RxxU",
    },
  ];

  const renderFeatureIcon = (icon: string) => {
    switch (icon) {
      case "workspace_premium":
        return <BadgeCheck size={22} strokeWidth={2.5} />;
      case "shield_with_heart":
        return <ShieldCheck size={22} strokeWidth={2.5} />;
      case "support_agent":
        return <Headset size={22} strokeWidth={2.5} />;
      default:
        return <BadgeCheck size={22} strokeWidth={2.5} />;
    }
  };

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

  const openRegisterModal = (type: "booster" | "client") => {
    setRegisterType(type);
    setIsRegisterOpen(true);
  };

  const heroParticles = [Gamepad2, Trophy, Swords, Rocket, ShieldCheck, Sparkles, Gamepad2, Trophy];

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(buildBrowseSearchUrl(searchScope, searchQuery));
    setIsSearchOpen(false);
  };

  const handleLoginSubmit = async (payload: { email: string; password: string; role: "booster" | "client" }) => {
    try {
      // Step 1: Verify the role matches the selected tab
      const roleCheckRes = await fetch("/api/auth/verify-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email }),
      });

      if (roleCheckRes.ok) {
        const { role } = await roleCheckRes.json();
        if (role.toLowerCase() !== payload.role.toLowerCase()) {
          return {
            ok: false,
            message: `This user is registered as a ${role.toLowerCase()}`,
          };
        }
      }

      // Step 2: Proceed with NextAuth login
      const result = await signIn("credentials", {
        redirect: false,
        email: payload.email,
        password: payload.password,
      });

      if (result?.error) {
        return { ok: false, message: "Invalid email or password." };
      }

      const res = await fetch("/api/auth/me");
      const data = await res.json();
      const role = data.user?.role as string;

      if (role === "BOOSTER") {
        window.location.href = "/booster-profile";
      } else {
        window.location.href = "/client-settings";
      }
      return { ok: true };
    } catch {
      return { ok: false, message: "Network error. Please try again." };
    }
  };

  const handleRegisterSubmit = async (payload: {
    username: string;
    email: string;
    country: string;
    password: string;
    role: "booster" | "client";
    displayName?: string;
  }) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: payload.username,
          email: payload.email,
          password: payload.password,
          role: payload.role.toUpperCase(),
          displayName: payload.displayName,
          country: payload.country,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, message: data.error ?? "Registration failed." };
      return { ok: true, message: "Account created! You can now log in." };
    } catch {
      return { ok: false, message: "Network error. Please try again." };
    }
  };

  return (
    <>
      <header className="ghost-border fixed top-0 z-50 w-full border-b border-white/15 bg-black/35 backdrop-blur-xl">
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
              className="top-panel-link top-panel-link-active px-4 py-2 text-sm font-bold uppercase tracking-wide"
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
                <Search size={18} />
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
            {isClientLoggedIn ? (
              <ClientProfileMenu 
                avatarUrl={session?.user?.image ?? "/booster-pfps/default-avatar.svg"} 
                alt={session?.user?.name ?? "Client profile"} 
              />
            ) : isBoosterLoggedIn ? (
              <BoosterProfileMenu 
                avatarUrl={session?.user?.image ?? "/booster-pfps/default-avatar.svg"} 
                alt={session?.user?.name ?? "Booster profile"} 
              />
            ) : (
              <Button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="top-panel-link px-2 py-2"
                variant="ghost"
                size="sm"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative flex min-h-screen items-center overflow-hidden pt-20">
          <div className="absolute inset-0 z-0">
            <img
              className="h-full w-full object-cover opacity-40 grayscale-[0.5] contrast-125"
              alt="futuristic neon city"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjVhifURNLFwD_jErE39duat_p1FOXRRu3xs_vEm5dmUEeU8Os3c0OwuWAbaMeVb5DU3MPoS6fh_XukSa4frKaGOrRZMqZaL9VD3TPnM4SHMXG7DQfJF6g45L7W56O990uNrveRnMmcmUcIjOkqkWyjWy9z2WB3-ai33MMcZvo2tXKDEfeI0S1SJv7TUGJHXtespbzkx-J0voobMIWqCO8rLb0OG6Q-_hhErVizgiwK-Uv5ONXR-lziXhu-nTuvUmqZkV0icSCDhE"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-background to-transparent"></div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-[5]">
            {heroParticles.map((ParticleIcon, index) => (
              <div
                key={`hero-particle-${index}`}
                className="gaming-particle"
                style={{
                  left: `${6 + index * 12}%`,
                  animationDelay: `${index * 0.55}s`,
                  animationDuration: `${7 + (index % 4)}s`,
                  opacity: 0.55,
                  color: index % 3 === 1 ? "rgba(196, 138, 255, 0.9)" : undefined,
                  filter:
                    index % 3 === 1
                      ? "drop-shadow(0 0 10px rgba(168, 85, 247, 0.65)) drop-shadow(0 0 18px rgba(168, 85, 247, 0.45))"
                      : undefined,
                }}
              >
                <ParticleIcon className="h-4 w-4 md:h-5 md:w-5" />
              </div>
            ))}
          </div>

          <div className="container relative z-10 mx-auto px-8">
            <div className="max-w-4xl">
              <span className="font-label mb-4 block text-xs uppercase tracking-[0.2em] text-primary">
                Engineered for Victory
              </span>
              <h1 className="font-headline mb-8 text-6xl font-bold italic leading-[0.9] tracking-tighter md:text-8xl">
                ASCEND TO YOUR{" "}
                <div>
                  <span className="inline-block bg-gradient-to-r from-primary to-primary-fixed bg-clip-text text-transparent">
                    DESIRED RANK{" "}
                  </span>
                </div>
              </h1>
              <p className="mb-10 max-w-2xl text-xl leading-relaxed text-on-surface-variant md:text-2xl">
                Unleash your true potential with our secure and elite gaming performance platform.
              </p>
              <div className="flex flex-wrap gap-6">
                <Link
                  href="/level-up"
                  className="flame-button primary-gradient ghost-border rounded-md px-10 py-5 text-lg font-bold text-on-primary-fixed transition-all hover:shadow-[0_0_36px_-6px_rgba(20,214,255,0.72)]"
                >
                  LEVEL UP
                </Link>
                <Link
                  href="/live-boosts"
                  className="flame-button-violet flex items-center gap-3 rounded-md border border-secondary/40 bg-surface-container-low/50 px-10 py-5 text-lg font-bold backdrop-blur-sm transition-colors hover:border-secondary"
                >
                  <PlayCircle size={22} />
                  VIEW LIVE BOOSTS
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-black py-24">
          <div className="container mx-auto px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {featureCards.map((feature) => (
                <div
                  key={feature.title}
                  className="group ghost-border rounded-xl bg-surface-container-low p-8 transition-all duration-300 hover:bg-surface-container-high"
                >
                  <div
                    className={`mb-6 flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${feature.color}`}
                  >
                    {renderFeatureIcon(feature.icon)}
                  </div>
                  <h3 className="font-headline mb-4 text-2xl font-bold">{feature.title}</h3>
                  <p className="leading-relaxed text-on-surface-variant">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/15 bg-black py-24">
          <div className="container mx-auto px-8">
            <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <span className="font-label mb-2 block text-xs uppercase tracking-widest text-secondary">
                  Available Talent
                </span>
                <h2 className="font-headline text-5xl font-bold">TOP RATED BOOSTERS</h2>
              </div>
              <Link href="/booster-browse" className="group flex items-center gap-2 font-bold text-primary">
                VIEW ALL PROFESSIONALS
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              {boosters.map((booster) => (
                <Link
                  key={booster.id || booster.name}
                  href={booster.id ? `/booster/${booster.id}` : "/booster-browse"}
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
                  </div>
                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h4 className="font-headline text-xl font-bold">{booster.name}</h4>
                        <p className="text-xs uppercase tracking-widest text-on-surface-variant">
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
                      style={{ borderLeftColor: (booster as any).rankColor, borderLeftWidth: (booster as any).rankColor ? '3px' : '1px' }}
                    >
                      <span style={{ color: (booster as any).rankColor }}>{renderRankIcon(booster.rankIcon)}</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{booster.rank}</span>
                        <span className="text-sm font-bold uppercase tracking-tight" style={{ color: (booster as any).rankColor }}>{(booster as any).boosterRank || "ROOKIE"}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      <span>Success</span>
                      <span className="text-primary">{(booster as any).success ?? 100}%</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-black py-24">
          <div className="container relative z-10 mx-auto px-8">
            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <h2 className="font-headline mb-8 text-5xl font-bold italic tracking-tighter">
                  ELITE RESULTS, <br />
                  VERIFIED.
                </h2>
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="text-6xl font-black italic text-primary">98%</div>
                    <div className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                      customer satisfaction
                      <br />
                      ON 15K+ ORDERS
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-6xl font-black italic text-secondary">4.9</div>
                    <div className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                      rating
                      <div>FROM REAL USERS</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-8">
                {reviews.map((review) => (
                  <div
                    key={review.name}
                    className="ghost-border relative rounded-xl bg-surface-container-high p-8"
                  >
                    <div className="mb-6 flex gap-1 text-primary">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={`${review.name}-star-${index}`} size={13} className="fill-current" />
                      ))}
                    </div>
                    <p className="mb-8 italic leading-relaxed text-on-surface">{review.quote}</p>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-surface-container-highest">
                        <img
                          className="h-full w-full object-cover"
                          alt={`${review.name} avatar`}
                          src={review.avatar}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{review.name}</div>
                        <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                          Verified Customer
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-black py-32">
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="container relative z-10 mx-auto px-8 text-center">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-headline mb-8 text-6xl font-bold italic leading-[0.9] tracking-tighter md:text-7xl">
                READY TO <br />
                LEVEL UP?
              </h2>
              <p className="mb-12 text-xl text-on-surface-variant">
                Join 15,000+ players who have reclaimed their competitive glory. Don&apos;t let your
                rank define your skill ceiling.
              </p>
              <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
                <Button
                  type="button"
                  onClick={() => openRegisterModal("booster")}
                  className="cta-flame-soft cta-flame-soft-primary w-full text-xl transition-transform hover:scale-105 active:scale-95 md:w-auto"
                  variant="primary"
                  size="lg"
                >
                  BECOME A BOOSTER
                </Button>
                <Button className="cta-flame-soft cta-flame-soft-outline w-full border-outline/30 text-xl hover:bg-surface-variant md:w-auto" variant="outline" size="lg">
                  HIRE A BOOSTER
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/15 bg-black">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-8 py-12 md:flex-row">
          <div className="text-xl font-black text-primary-fixed">WEBSITE NAME</div>
          <div className="flex flex-wrap justify-center gap-8 font-label text-sm uppercase tracking-widest">
            {["Privacy Policy", "Terms of Service", "Contact Support", "Careers", "Refund Policy"].map(
              (item) => (
                <a key={item} href="#" className="text-on-surface/60 transition-colors duration-200 hover:text-primary-fixed">
                  {item}
                </a>
              )
            )}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface/60">
            © 2024 Zenith Boost. All rights reserved.
          </div>
        </div>
      </footer>

      <AuthLoginModal
        open={isLoginOpen}
        onOpenChange={setIsLoginOpen}
        loginType={loginType}
        onLoginTypeChange={setLoginType}
        onSubmit={handleLoginSubmit}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          openRegisterModal(loginType);
        }}
        onForgotPassword={() => {
          setIsLoginOpen(false);
          setIsForgotPasswordOpen(true);
        }}
      />

      <AuthRegisterModal
        open={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
        registerType={registerType}
        onRegisterTypeChange={setRegisterType}
        onSubmit={handleRegisterSubmit}
        onOpenTerms={() => setIsTermsOpen(true)}
      />

      <TermsModal
        open={isTermsOpen}
        onOpenChange={setIsTermsOpen}
      />

      <ForgotPasswordModal open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
    </>
  );
}
