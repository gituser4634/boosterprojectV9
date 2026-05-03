"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { useRealtimeChat } from "@/hooks/use-realtime-chat";
import {
  ArrowLeft,
  Info,
  MessageSquare,
  Mic,
  MicOff,
  PlusCircle,
  Search,
  Send,
  Smile,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { BoosterMobileNav, BoosterSidebar } from "@/components/booster/shell-navigation";
import { BoosterTopBar } from "@/components/booster/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { LayoutDashboard, ClipboardList, Wallet, Settings } from "lucide-react";
import { uploadChatMedia } from "@/lib/supabase-storage";

type TabType = "chats" | "requests";

// Unified sidebar thread
type Thread = {
  id: string;
  type: "order" | "request";
  displayName: string;
  avatarUrl: string | null;
  lastMessage: string;
  gameTag?: string;
  hasUnread: boolean;
  clientStatus: "current" | "previous" | "none";
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function looksLikeAudio(content: string): boolean {
  return /\.(webm|mp3|ogg|wav|m4a)(\?|$)/i.test(content) || content.includes("/audio/");
}
function looksLikeImage(content: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(content) || content.includes("/images/");
}

function formatLastMessage(msg: any): string {
  if (!msg) return "No messages yet";
  if (msg.messageType === "IMAGE" || looksLikeImage(msg.content)) return "[Image]";
  if (msg.messageType === "AUDIO" || looksLikeAudio(msg.content)) return "[Voice Note]";
  return msg.content;
}

function toOrderThread(raw: any): Thread {
  const last = raw.messages?.[0];
  return {
    id: raw.id,
    type: "order",
    displayName: raw.customer?.displayName || raw.customer?.username || "Client",
    avatarUrl: raw.customer?.profilePictureUrl ?? null,
    lastMessage: formatLastMessage(last),
    gameTag: raw.game?.name?.toUpperCase(),
    hasUnread: false,
    clientStatus: raw.status === "COMPLETED" ? "previous" : "current",
  };
}

function toRequestThread(raw: any): Thread {
  const peer = raw.sender || raw.receiver;
  const last = raw.messages?.[0];
  return {
    id: raw.id,
    type: "request",
    displayName: peer?.displayName || peer?.username || "Client",
    avatarUrl: peer?.profilePictureUrl ?? null,
    lastMessage: formatLastMessage(last),
    hasUnread: false,
    clientStatus: "none",
  };
}

const emojiPool = ["🔥", "✅", "💯", "🎯", "🚀", "😎", "🫡", "👍"];

// ─── Active thread key ─────────────────────────────────────────────────────────
type ActiveKey = { id: string; type: "order" | "request" } | null;

// ─── Inner component ───────────────────────────────────────────────────────────
function BoosterChatsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const avatarUrl = session?.user?.image ?? "/booster-pfps/default-avatar.svg";

  const [tab, setTab] = useState<TabType>("chats");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Thread[]>([]);
  const [activeKey, setActiveKey] = useState<ActiveKey>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isNotificationsOn, setIsNotificationsOn] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [savedPrimaryGame, setSavedPrimaryGame] = useState("");
  const [threadError, setThreadError] = useState<string | null>(null);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const [hideSidebar, setHideSidebar] = useState(false);

  const boosterNavItems = [
    { key: "dashboard", label: "Dashboard", href: "/booster-dashboard", icon: <LayoutDashboard className="h-5 w-5" />, isActive: false },
    { key: "requests", label: "Requests", href: "/booster-requests", icon: <ClipboardList className="h-5 w-5" />, isActive: false },
    { key: "payments", label: "Payments", href: "/booster-payments", icon: <Wallet className="h-5 w-5" />, isActive: false },
    { key: "chats", label: "Chats", href: "/booster-chats", icon: <MessageSquare className="h-5 w-5" />, isActive: true },
    { key: "settings", label: "Settings", href: "/booster-profile", icon: <Settings className="h-5 w-5" />, isActive: false },
  ];

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("zenith-hide-sidebar") === "true";
    setHideSidebar(saved);
  }, []);

  const { notifications: realNotifications, unreadCount: realUnreadCount, markAllAsRead } = useNotifications();

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/chats/threads");
      if (!res.ok) return;
      const data = await res.json();
      const orderThreads: Thread[] = (data.orderThreads ?? []).map(toOrderThread);
      const reqThreads: Thread[] = (data.requestThreads ?? []).map(toRequestThread);
      const pending: Thread[] = (data.pendingRequests ?? []).map(toRequestThread);
      setThreads([...orderThreads, ...reqThreads]);
      setPendingRequests(pending);
      if (!activeKey) {
        const first = orderThreads[0] ?? reqThreads[0];
        if (first) setActiveKey({ id: first.id, type: first.type });
      }
    } catch {
      setThreadError("Failed to load conversations.");
    }
  }, [activeKey]);

  useEffect(() => {
    const saved = window.localStorage.getItem("booster-main-game") ?? "";
    setSavedPrimaryGame(saved);

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserProfile(d.user))
      .catch(() => {});

    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    const requestedId = searchParams.get("thread");
    if (!requestedId) return;
    const inChats = threads.find((t) => t.id === requestedId);
    const inReqs = pendingRequests.find((t) => t.id === requestedId);
    if (inChats) { setTab("chats"); setActiveKey({ id: requestedId, type: inChats.type }); }
    if (inReqs) { setTab("requests"); setActiveKey({ id: requestedId, type: inReqs.type }); }
  }, [searchParams, threads, pendingRequests]);

  const { messages: realtimeMessages, sendMessage, isLoading: messagesLoading } = useRealtimeChat({
    orderId: activeKey?.type === "order" ? activeKey.id : undefined,
    chatRequestId: activeKey?.type === "request" ? activeKey.id : undefined,
    currentUserId: userId,
  });

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 0);
    }
  }, [realtimeMessages]);

  const activeList = tab === "chats" ? threads : pendingRequests;

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeList;
    return activeList.filter(
      (t) =>
        t.displayName.toLowerCase().includes(q) ||
        (t.gameTag ?? "").toLowerCase().includes(q)
    );
  }, [search, activeList]);

  const activeThread = useMemo(
    () => activeList.find((t) => t.id === activeKey?.id) ?? filteredList[0] ?? null,
    [activeList, activeKey, filteredList]
  );

  const openThread = (thread: Thread) => {
    setActiveKey({ id: thread.id, type: thread.type });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeKey) return;
    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `images/${crypto.randomUUID()}.${ext}`;
      const url = await uploadChatMedia(file, path, file.type);
      await sendMessage(url, "IMAGE");
    } catch (e: any) {
      console.error("Image upload failed:", e.message);
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsUploading(true);
        try {
          const path = `audio/${crypto.randomUUID()}.webm`;
          const url = await uploadChatMedia(blob, path, "audio/webm");
          await sendMessage(url, "AUDIO");
        } catch (e: any) {
          console.error("Audio upload failed:", e.message);
        } finally {
          setIsUploading(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const acceptRequest = async () => {
    if (!activeThread || tab !== "requests") return;
    try {
      const res = await fetch(`/api/chat-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatRequestId: activeThread.id, action: "accept" }),
      });
      if (res.ok) {
        await loadThreads();
        setTab("chats");
      } else {
        const error = await res.json();
        console.error("Failed to accept request:", error);
      }
    } catch (e) {
      console.error("Failed to accept request:", e);
    }
  };

  const declineRequest = async () => {
    if (!activeThread || tab !== "requests") return;
    try {
      const res = await fetch(`/api/chat-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatRequestId: activeThread.id, action: "decline" }),
      });
      if (res.ok) {
        await loadThreads();
      } else {
        const error = await res.json();
        console.error("Failed to decline request:", error);
      }
    } catch (e) {
      console.error("Failed to decline request:", e);
    }
  };

  const getClientTag = (status: Thread["clientStatus"]) => {
    if (status === "current") {
      return (
        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-300">
          Current Client
        </span>
      );
    }
    if (status === "previous") {
      return (
        <span className="rounded-full border border-violet-400/40 bg-violet-400/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-violet-200">
          Previous Client
        </span>
      );
    }
    return null;
  };

  return (
    <>
      {!hideSidebar && (
        <BoosterSidebar
          active="chats"
          isOnline={isNotificationsOn}
          onToggleOnline={() => setIsNotificationsOn((c) => !c)}
          mainGame={userProfile?.boosterProfile?.mainGame?.name || savedPrimaryGame}
          rankInfo={userProfile?.boosterProfile?.rankInfo}
          xp={userProfile?.boosterProfile?.xp}
        />
      )}

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
        onToggleNotifications={() => setIsNotificationsOn((c) => !c)}
        onMarkNotificationsRead={markAllAsRead}
        notifications={realNotifications}
        isProfileMenuOpen={isProfileMenuOpen}
        onToggleProfileMenu={() => {
          setIsNotificationsPanelOpen(false);
          setIsProfileMenuOpen((current) => !current);
        }}
        onCloseProfileMenu={() => setIsProfileMenuOpen(false)}
        onProfileAction={async (action) => {
          if (action === "Settings") { router.push("/booster-profile"); return; }
          if (action === "Logout") { await signOut({ callbackUrl: "/" }); return; }
          setIsProfileMenuOpen(false);
        }}
      />

      <main className={`h-screen overflow-hidden pt-16 transition-all duration-300 ${hideSidebar ? "" : "ml-64"}`}>
        <div className="grid h-[calc(100vh-4rem)] grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1.2fr)] overflow-hidden lg:grid-cols-[22rem_minmax(0,1fr)] lg:grid-rows-1">
          <section className="flex min-h-0 flex-col border-b border-outline-variant/10 bg-surface-container-low/85 lg:border-b-0 lg:border-r">
            <div className="p-6 pb-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="headline text-2xl font-bold text-on-surface">Messages</h2>
              </div>
              <div className="mb-6 flex items-center gap-2">
                {tab === "requests" && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setTab("chats"); }} className="h-10 w-10 rounded-xl border border-white/10 bg-surface-container-highest/20 text-on-surface-variant hover:bg-surface-container-highest/40 hover:text-on-surface">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <Button type="button" onClick={() => { setTab("requests"); }} className="group h-auto w-full items-center justify-between rounded-xl border border-primary/20 bg-surface-container-highest/25 px-4 py-3 transition-all duration-200 hover:border-primary/40 hover:bg-surface-container-highest/45">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold tracking-tight text-on-surface">Message Requests</span>
                  </div>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-on-primary-fixed">{pendingRequests.length}</span>
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                <Input
                  className="w-full rounded-xl border-none bg-surface-container-lowest/90 py-2.5 pl-10 pr-4 text-sm placeholder:text-outline-variant/60 focus:ring-1 focus:ring-primary/50"
                  placeholder="Search conversations..."
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="custom-scrollbar mt-2 flex-1 overflow-y-auto px-3 pb-6">
              {threadError && (
                <p className="px-4 py-2 text-xs text-red-400">{threadError}</p>
              )}
              {filteredList.length === 0 && !threadError && (
                <p className="px-4 py-6 text-center text-xs uppercase tracking-widest text-outline-variant">
                  {tab === "requests" ? "No pending requests." : "No conversations yet."}
                </p>
              )}
              {filteredList.map((thread) => {
                const isActive = activeThread?.id === thread.id;
                return (
                  <Button
                    key={thread.id}
                    type="button"
                    onClick={() => openThread(thread)}
                    className={`mb-3 h-auto min-h-[80px] w-full cursor-pointer overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 ${
                      isActive
                        ? "border-cyan-400/25 bg-surface-container-highest/55 shadow-[0_0_0_1px_rgba(143,245,255,0.06)]"
                        : "group border-white/5 bg-surface-container-high/30 hover:border-white/15 hover:bg-surface-container-high/55"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="relative shrink-0">
                        {thread.avatarUrl ? (
                          <img
                            className={`h-12 w-12 rounded-xl object-cover ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}
                            alt="avatar"
                            src={thread.avatarUrl}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-lg font-bold text-primary">
                            {thread.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <h3 className={`truncate text-sm font-bold ${isActive ? "text-on-surface" : "text-on-surface-variant group-hover:text-on-surface"}`}>
                            {thread.displayName}
                          </h3>
                          {thread.gameTag && (
                            <span className="text-[10px] uppercase tracking-wider text-outline">{thread.gameTag}</span>
                          )}
                        </div>
                        <div className="mb-1">{getClientTag(thread.clientStatus)}</div>
                        <p className={`truncate text-xs ${thread.hasUnread ? "font-semibold text-on-surface" : "text-outline-variant"}`}>
                          {thread.lastMessage}
                        </p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </section>

          <section className="relative flex min-h-0 flex-1 flex-col bg-surface-container-low/35">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute right-[-5%] top-[-10%] h-[320px] w-[320px] rounded-full bg-primary/4 blur-[90px]" />
              <div className="absolute bottom-[-10%] left-[-5%] h-[240px] w-[240px] rounded-full bg-tertiary/4 blur-[72px]" />
            </div>

            {activeThread ? (
              <>
                <div className="z-10 flex h-20 items-center justify-between border-b border-white/5 bg-surface/45 px-8 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {activeThread.avatarUrl ? (
                        <img className="h-10 w-10 rounded-full border border-outline-variant/30 object-cover" alt="avatar" src={activeThread.avatarUrl} />
                      ) : (
                        <div className="h-10 w-10 rounded-full border border-outline-variant/30 bg-surface-container-highest flex items-center justify-center font-bold text-primary">
                          {activeThread.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="headline font-bold tracking-tight text-on-surface">{activeThread.displayName}</h3>
                      {activeThread.gameTag && (
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{activeThread.gameTag}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {tab === "requests" && (
                      <>
                        <Button type="button" onClick={declineRequest} className="rounded-md border border-red-500/50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-300 transition hover:bg-red-500/10">
                          Decline
                        </Button>
                        <Button type="button" onClick={acceptRequest} className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-500/20">
                          Accept Request
                        </Button>
                      </>
                    )}
                    <Button className="p-2 text-outline-variant transition-colors hover:text-primary" type="button" aria-label="Conversation details">
                      <Info className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div ref={messagesContainerRef} className="custom-scrollbar relative z-10 flex-1 space-y-5 overflow-y-auto p-8">
                  {messagesLoading && (
                    <div className="flex justify-center py-8">
                      <span className="text-xs uppercase tracking-widest text-outline-variant">Loading messages…</span>
                    </div>
                  )}

                  {!messagesLoading && realtimeMessages.length === 0 && (
                    <div className="flex justify-center py-8">
                      <span className="text-xs uppercase tracking-widest text-outline-variant">No messages yet. Say hi!</span>
                    </div>
                  )}

                  {realtimeMessages.map((msg) => {
                    const fromMe = msg.senderId === userId;
                    const isImage = msg.messageType === "IMAGE" || (!msg.messageType && looksLikeImage(msg.content));
                    const isAudio = msg.messageType === "AUDIO" || (!msg.messageType && looksLikeAudio(msg.content));
                    return (
                      <div key={msg.id} className={`flex ${fromMe ? "ml-auto max-w-[70%] items-end justify-end gap-3" : "max-w-[70%] items-end gap-3"}`}>
                        <div className={`flex ${fromMe ? "items-end" : ""} flex-col gap-1`}>
                          {!fromMe && (
                            <span className="ml-1 text-[10px] text-outline">{msg.sender?.displayName || msg.sender?.username}</span>
                          )}
                          <div className={`${isImage ? "p-0" : "px-4 py-3"} ${fromMe
                            ? "rounded-2xl rounded-br-none border border-white/40 bg-slate-900/98 shadow-[0_8px_18px_rgba(0,0,0,0.32)]"
                            : "rounded-2xl rounded-bl-none border border-white/10 bg-surface-container-highest/85"
                          }`}>
                            {isImage ? (
                              <a href={msg.content} target="_blank" rel="noreferrer">
                                <img src={msg.content} alt="Shared image" className="max-h-60 max-w-xs rounded-2xl object-cover" />
                              </a>
                            ) : isAudio ? (
                              <audio controls src={msg.content} className="h-10 w-52" />
                            ) : (
                              <p className={`text-sm ${fromMe ? "font-medium text-white" : "text-on-surface"}`}>{msg.content}</p>
                            )}
                          </div>
                          <span className={`text-[10px] text-outline ${fromMe ? "mr-1 text-right" : "ml-1"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="z-10 border-t border-white/5 bg-surface/58 p-6 backdrop-blur-md">
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {isEmojiOpen && (
                    <div className="mb-3 flex w-fit gap-1 rounded-xl border border-outline-variant/20 bg-surface-container p-2 shadow-xl">
                      {emojiPool.map((emoji) => (
                        <Button key={emoji} type="button" onClick={() => { setDraft((d) => `${d}${emoji}`); setIsEmojiOpen(false); }} className="rounded px-2 py-1 text-base transition hover:bg-white/10">
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  )}

                  {isRecording && (
                    <div className="mb-3 flex items-center gap-3 rounded-xl border border-error/30 bg-error/10 px-4 py-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-error" />
                      <span className="text-xs font-bold uppercase tracking-widest text-error">Recording {recordingSeconds}s</span>
                      <Button type="button" onClick={stopRecording} className="ml-auto p-1 text-error hover:text-error/80" aria-label="Stop recording">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-4 rounded-2xl border border-outline-variant/10 bg-surface-container-low/90 p-2 shadow-lg shadow-black/20">
                    <Button type="button" onClick={() => imageInputRef.current?.click()} disabled={tab === "requests" || isUploading || isRecording} className="p-2 text-outline-variant transition-colors hover:text-tertiary" aria-label="Attach image">
                      {isUploading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-tertiary border-t-transparent" /> : <ImageIcon className="h-5 w-5" />}
                    </Button>
                    <Button type="button" onClick={isRecording ? stopRecording : startRecording} disabled={tab === "requests" || isUploading} className={`p-2 transition-colors ${isRecording ? "text-error hover:text-error/80" : "text-outline-variant hover:text-secondary"}`} aria-label={isRecording ? "Stop recording" : "Record voice note"}>
                      {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <Button type="button" onClick={() => setIsEmojiOpen((c) => !c)} className="p-2 text-outline-variant transition-colors hover:text-secondary" aria-label="Toggle emoji picker">
                      <Smile className="h-5 w-5" />
                    </Button>
                    <Input
                      className="flex-1 border-none bg-transparent text-sm text-on-surface placeholder:text-outline-variant/50 focus:ring-0"
                      placeholder={tab === "requests" ? "Accept the request to start messaging…" : isRecording ? "Recording voice note…" : `Message ${activeThread.displayName.split(" ")[0]}…`}
                      type="text"
                      value={draft}
                      disabled={tab === "requests" || isRecording}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(draft, "TEXT"); setDraft(""); } }}
                    />
                    <Button type="button" onClick={() => { sendMessage(draft, 'TEXT'); setDraft(''); }} disabled={tab === "requests" || isUploading || isRecording || !draft.trim()} className="h-10 w-10 rounded-xl active:scale-95" variant="primary" size="icon">
                      <Send className="h-4 w-4 text-slate-950" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="relative z-10 flex flex-1 items-center justify-center text-sm uppercase tracking-widest text-outline">
                No conversation selected.
              </div>
            )}
          </section>
        </div>
      </main>

      <BoosterMobileNav active="chats" avatarUrl={avatarUrl} />
    </>
  );
}

export default function BoosterChatsPage() {
  return (
    <Suspense fallback={<main className="ml-64 h-screen overflow-hidden pt-16" />}>
      <BoosterChatsPageContent />
    </Suspense>
  );
}
