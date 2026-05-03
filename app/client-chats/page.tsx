"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Info, MessageSquare, PlusCircle, Search, Send, Smile, ArrowLeft, Home, ClipboardList, Settings, Mic, MicOff, Image as ImageIcon, X } from "lucide-react";
import { uploadChatMedia } from "@/lib/supabase-storage";
import { useRealtimeChat } from "@/hooks/use-realtime-chat";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileInput } from "@/components/ui/file-input";
import { ClientSidebar, ClientMobileNav } from "@/components/client/shell-navigation";
import { BoosterTopBar } from "@/components/booster/top-bar";

// Unified thread shape
type Thread = {
  id: string;
  type: "order" | "request";
  displayName: string;
  avatarUrl: string | null;
  lastMessage: string;
  updatedAt: string;
  gameTag?: string;
  hasUnread: boolean;
  requestStatus?: "PENDING" | "ACCEPTED" | "DECLINED";
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function toOrderThread(raw: any): Thread {
  const last = raw.messages?.[0];
  const boosterUser = raw.booster?.user;
  return {
    id: raw.id,
    type: "order",
    displayName: boosterUser?.displayName || boosterUser?.username || "Booster",
    avatarUrl: boosterUser?.profilePictureUrl ?? null,
    lastMessage: last?.content ?? "No messages yet",
    updatedAt: raw.updatedAt,
    gameTag: raw.game?.name?.toUpperCase(),
    hasUnread: false,
  };
}

function toRequestThread(raw: any): Thread {
  const peer = raw.receiver || raw.sender;
  const last = raw.messages?.[0];
  return {
    id: raw.id,
    type: "request",
    displayName: peer?.displayName || peer?.username || "Booster",
    avatarUrl: peer?.profilePictureUrl ?? null,
    lastMessage: last?.content ?? "No messages yet",
    updatedAt: raw.updatedAt || raw.createdAt,
    hasUnread: false,
    requestStatus: raw.status,
  };
}

const emojiPool = ["🔥", "✅", "💯", "🎯", "🚀", "😎", "🫡", "👍"];

// Fallback detectors for when messageType is missing from API response
function looksLikeAudio(content: string): boolean {
  return /\.(webm|mp3|ogg|wav|m4a)(\?|$)/i.test(content) || content.includes("/audio/");
}
function looksLikeImage(content: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(content) || content.includes("/images/");
}

type ActiveKey = { id: string; type: "order" | "request" } | null;

function ClientChatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const avatarUrl = session?.user?.image ?? "/booster-pfps/default-avatar.svg";

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeKey, setActiveKey] = useState<ActiveKey>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isNotificationsOn, setIsNotificationsOn] = useState(true);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [hideSidebar, setHideSidebar] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Persistence for UI preferences
  useEffect(() => {
    const saved = window.localStorage.getItem("zenith-hide-sidebar") === "true";
    setHideSidebar(saved);
  }, []);

  const { notifications: realNotifications, unreadCount: realUnreadCount, markAllAsRead } = useNotifications();

  // Load threads
  const loadThreads = useCallback(async () => {
    const res = await fetch("/api/chats/threads");
    if (!res.ok) return;
    const data = await res.json();
    const order: Thread[] = (data.orderThreads ?? []).map(toOrderThread);
    const req: Thread[] = (data.requestThreads ?? []).map(toRequestThread);
    const all = [...order, ...req];
    setThreads(all);
    if (!activeKey && all.length > 0) {
      // Check if there is a thread requested in URL
      const reqId = searchParams.get("request");
      const ordId = searchParams.get("order");
      const requestedId = reqId || ordId;
      const found = all.find(t => t.id === requestedId);
      if (found) {
        setActiveKey({ id: found.id, type: found.type });
      } else {
        setActiveKey({ id: all[0].id, type: all[0].type });
      }
    }
  }, [activeKey, searchParams]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  // Realtime hook
  const { messages, sendMessage, isLoading: messagesLoading } = useRealtimeChat({
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
  }, [messages]);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) => t.displayName.toLowerCase().includes(q) || (t.gameTag ?? "").toLowerCase().includes(q)
    );
  }, [search, threads]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeKey?.id) ?? null,
    [threads, activeKey]
  );

  const sendText = async () => {
    const value = draft.trim();
    if (!value || !activeKey) return;
    if (activeThread?.requestStatus === "PENDING") return;
    setDraft("");
    try { await sendMessage(value, "TEXT"); } catch (e: any) { console.error("Send failed:", e.message); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeKey || activeThread?.requestStatus === "PENDING") return;
    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `images/${crypto.randomUUID()}.${ext}`;
      const url = await uploadChatMedia(file, path, file.type);
      await sendMessage(url, "IMAGE");
    } catch (e: any) { console.error("Image upload failed:", e.message); }
    finally { setIsUploading(false); if (imageInputRef.current) imageInputRef.current.value = ""; }
  };

  const startRecording = async () => {
    if (activeThread?.requestStatus === "PENDING") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsUploading(true);
        try {
          const path = `audio/${crypto.randomUUID()}.webm`;
          const url = await uploadChatMedia(blob, path, "audio/webm");
          await sendMessage(url, "AUDIO");
        } catch (e: any) { console.error("Audio upload failed:", e.message); }
        finally { setIsUploading(false); }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch { console.error("Mic access denied."); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const openThread = (t: Thread) => {
    setActiveKey({ id: t.id, type: t.type });
  };

  const isPending = activeThread?.requestStatus === "PENDING";

  const clientNavItems = [
    { key: "home", label: "Home", href: "/", icon: <Home className="h-5 w-5" />, isActive: false },
    { key: "browse", label: "Browse", href: "/booster-browse", icon: <Search className="h-5 w-5" />, isActive: false },
    { key: "orders", label: "Orders", href: "/client-orders", icon: <ClipboardList className="h-5 w-5" />, isActive: false },
    { key: "chats", label: "Messages", href: "/client-chats", icon: <MessageSquare className="h-5 w-5" />, isActive: true },
    { key: "settings", label: "Settings", href: "/client-settings", icon: <Settings className="h-5 w-5" />, isActive: false },
  ];

  return (
    <>
      {!hideSidebar && <ClientSidebar active="chats" />}

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

      <main className={`h-screen overflow-hidden pt-16 transition-all duration-300 ${hideSidebar ? "" : "ml-64"}`}>
        <div className="grid h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[22rem_minmax(0,1fr)] overflow-hidden">
          
          {/* ── Sidebar thread list ── */}
          <section className="flex min-h-0 flex-col border-r border-outline-variant/10 bg-surface-container-low/85">
            <div className="p-6 pb-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="headline text-2xl font-bold text-on-surface">Conversations</h2>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                <Input
                  className="w-full rounded-xl border-none bg-surface-container-lowest/90 py-2.5 pl-10 pr-4 text-sm placeholder:text-outline-variant/60 focus:ring-1 focus:ring-primary/50"
                  placeholder="Search boosters..."
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="custom-scrollbar mt-2 flex-1 overflow-y-auto px-3 pb-6">
              {filteredList.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <MessageSquare className="h-8 w-8 text-outline-variant/40" />
                  <p className="text-xs uppercase tracking-widest text-outline-variant">
                    No conversations yet.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-2 text-[10px] uppercase tracking-widest">
                    <Link href="/booster-browse">Browse Boosters</Link>
                  </Button>
                </div>
              )}
              {filteredList.map((t) => {
                const isActive = activeKey?.id === t.id;
                return (
                  <Button
                    key={t.id}
                    type="button"
                    onClick={() => openThread(t)}
                    className={`mb-3 h-auto min-h-[80px] w-full cursor-pointer overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 ${
                      isActive
                        ? "border-primary/25 bg-surface-container-highest/55 shadow-[0_0_0_1px_rgba(143,245,255,0.06)]"
                        : "group border-white/5 bg-surface-container-high/30 hover:border-white/15 hover:bg-surface-container-high/55"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="relative shrink-0">
                        {t.avatarUrl ? (
                          <img className={`h-12 w-12 rounded-xl object-cover ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`} alt="avatar" src={t.avatarUrl} />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-lg font-bold text-primary">
                            {t.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <h3 className={`truncate text-sm font-bold ${isActive ? "text-on-surface" : "text-on-surface-variant group-hover:text-on-surface"}`}>
                            {t.displayName}
                          </h3>
                          {t.gameTag && <span className="text-[10px] uppercase tracking-wider text-outline">{t.gameTag}</span>}
                        </div>
                        {t.requestStatus === "PENDING" && (
                          <span className="mb-1 inline-block rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-400">
                            Awaiting Booster
                          </span>
                        )}
                        <p className={`truncate text-xs ${t.hasUnread ? "font-semibold text-on-surface" : "text-outline-variant"}`}>
                          {t.lastMessage}
                        </p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </section>

          {/* ── Message pane ── */}
          <section className="relative flex min-h-0 flex-1 flex-col bg-surface-container-low/35">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute right-[-5%] top-[-10%] h-[320px] w-[320px] rounded-full bg-primary/4 blur-[90px]" />
              <div className="absolute bottom-[-10%] left-[-5%] h-[240px] w-[240px] rounded-full bg-tertiary/4 blur-[72px]" />
            </div>

            {activeThread ? (
              <>
                {/* Chat header */}
                <div className="z-10 flex h-20 items-center justify-between border-b border-white/5 bg-surface/45 px-8 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    {activeThread.avatarUrl ? (
                      <img className="h-10 w-10 rounded-full border border-outline-variant/30 object-cover" alt="avatar" src={activeThread.avatarUrl} />
                    ) : (
                      <div className="h-10 w-10 rounded-full border border-outline-variant/30 bg-surface-container-highest flex items-center justify-center font-bold text-primary">
                        {activeThread.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="headline font-bold tracking-tight text-on-surface">{activeThread.displayName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {activeThread.gameTag && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{activeThread.gameTag}</span>
                        )}
                        {activeThread.type === "order" && (
                          <span className="rounded-full border border-primary/40 bg-primary/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-fixed">Assigned Booster</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button className="p-2 text-outline-variant transition-colors hover:text-primary" type="button">
                    <Info className="h-5 w-5" />
                  </Button>
                </div>

                {/* Messages */}
                <div ref={messagesContainerRef} className="custom-scrollbar relative z-10 flex-1 space-y-5 overflow-y-auto p-8">
                  {messagesLoading && (
                    <div className="flex justify-center py-8">
                      <span className="text-xs uppercase tracking-widest text-outline-variant">Loading messages…</span>
                    </div>
                  )}
                  {!messagesLoading && messages.length === 0 && !isPending && (
                    <div className="flex justify-center py-8">
                      <span className="text-xs uppercase tracking-widest text-outline-variant">No messages yet. Say hi!</span>
                    </div>
                  )}
                  {isPending && (
                    <div className="flex flex-col items-center gap-3 py-12">
                      <MessageSquare className="h-8 w-8 text-amber-400/50" />
                      <p className="text-center text-xs uppercase tracking-widest text-outline-variant">
                        Your request has been sent.<br />You can chat once the booster accepts it.
                      </p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const fromMe = msg.senderId === userId;
                    const isImage = msg.messageType === "IMAGE" || (!msg.messageType && looksLikeImage(msg.content));
                    const isAudio = msg.messageType === "AUDIO" || (!msg.messageType && looksLikeAudio(msg.content));
                    return (
                      <div key={msg.id} className={`flex ${fromMe ? "ml-auto max-w-[70%] items-end justify-end gap-3" : "max-w-[70%] items-end gap-3"}`}>
                        <div className={`flex ${fromMe ? "items-end" : ""} flex-col gap-1`}>
                          {!fromMe && (
                            <span className="ml-1 text-[10px] text-outline">{msg.sender?.displayName || msg.sender?.username}</span>
                          )}
                          <div className={`overflow-hidden ${isImage ? "p-0" : "px-4 py-3"} ${fromMe
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

                {/* Input bar */}
                <div className="z-10 border-t border-white/5 bg-surface/58 p-6 backdrop-blur-md">
                  {/* Hidden inputs */}
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <FileInput ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={() => {}} />

                  {/* Emoji picker */}
                  {isEmojiOpen && (
                    <div className="mb-3 flex w-fit gap-1 rounded-xl border border-outline-variant/20 bg-surface-container p-2 shadow-xl">
                      {emojiPool.map((emoji) => (
                        <Button key={emoji} type="button" onClick={() => { setDraft((d) => `${d}${emoji}`); setIsEmojiOpen(false); }} className="rounded px-2 py-1 text-base transition hover:bg-white/10">
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Recording indicator */}
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
                    {/* Image attach */}
                    <Button type="button" onClick={() => imageInputRef.current?.click()} disabled={isPending || isUploading || isRecording} className="p-2 text-outline-variant transition-colors hover:text-tertiary" aria-label="Attach image">
                      {isUploading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-tertiary border-t-transparent" /> : <ImageIcon className="h-5 w-5" />}
                    </Button>

                    {/* Mic button */}
                    <Button type="button" onClick={isRecording ? stopRecording : startRecording} disabled={isPending || isUploading} className={`p-2 transition-colors ${isRecording ? "text-error hover:text-error/80" : "text-outline-variant hover:text-secondary"}`} aria-label={isRecording ? "Stop recording" : "Record voice note"}>
                      {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>

                    {/* Emoji */}
                    <Button type="button" onClick={() => setIsEmojiOpen((c) => !c)} className="p-2 text-outline-variant transition-colors hover:text-secondary" aria-label="Emoji">
                      <Smile className="h-5 w-5" />
                    </Button>

                    <Input
                      className="flex-1 border-none bg-transparent text-sm text-on-surface placeholder:text-outline-variant/50 focus:ring-0"
                      placeholder={isPending ? "Waiting for booster to accept…" : isRecording ? "Recording voice note…" : `Message ${activeThread.displayName.split(" ")[0]}…`}
                      type="text"
                      disabled={isPending || isRecording}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendText(); } }}
                    />
                    <Button
                      type="button" variant="primary" size="icon"
                      onClick={sendText}
                      disabled={isPending || !draft.trim() || isRecording}
                      className="h-10 w-10 rounded-xl active:scale-90"
                      aria-label="Send"
                    >
                      <Send className="h-4 w-4 text-slate-950 stroke-[2.5]" />
                    </Button>
                  </div>
                  <div className="mt-3 flex justify-end px-2">
                    <span className="font-mono text-[10px] tracking-tighter text-outline-variant/40">ZENITH_ENCRYPTED_COMMS_v2.0</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4">
                <MessageSquare className="h-12 w-12 text-outline-variant/30" />
                <p className="text-sm uppercase tracking-widest text-outline-variant">
                  {threads.length === 0 ? "No conversations yet." : "Select a conversation."}
                </p>
                {threads.length === 0 && (
                  <Button asChild variant="primary" size="sm" className="mt-2 text-xs uppercase tracking-widest">
                    <Link href="/booster-browse">Browse Boosters</Link>
                  </Button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <ClientMobileNav active="chats" avatarUrl={avatarUrl} />
    </>
  );
}

export default function ClientChatsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#04060a]"><p className="text-primary animate-pulse text-xs uppercase tracking-widest">Initialising Client Comms...</p></div>}>
      <ClientChatsContent />
    </Suspense>
  );
}
