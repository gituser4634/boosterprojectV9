"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Copy, UserCircle, Edit3, Home, Search, ClipboardList, MessageSquare, Settings, MonitorSmartphone } from "lucide-react";
import { ClientProfileMenu } from "@/components/shared/client-profile-menu";
import { BoosterProfileMenu } from "@/components/shared/booster-profile-menu";
import { PickerSheet } from "@/components/booster/picker-sheet";
import { supportedCountries } from "@/app/booster-profile/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { FileInput } from "@/components/ui/file-input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { ClientSidebar, ClientMobileNav } from "@/components/client/shell-navigation";
import { BoosterTopBar } from "@/components/booster/top-bar";
import { useNotifications } from "@/hooks/use-notifications";

export default function ClientSettingsPage() {
  const { data: session, update } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // User identity state
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countryToSet, setCountryToSet] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("/booster-pfps/default-avatar.svg");
  const [draftAvatarUrl, setDraftAvatarUrl] = useState(""); // staged but not yet saved
  const [statusMessage, setStatusMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hideSidebar, setHideSidebar] = useState(false);

  // Persistence for UI preferences
  useEffect(() => {
    const saved = window.localStorage.getItem("zenith-hide-sidebar") === "true";
    setHideSidebar(saved);
  }, []);

  const toggleHideSidebar = () => {
    const next = !hideSidebar;
    setHideSidebar(next);
    window.localStorage.setItem("zenith-hide-sidebar", String(next));
  };

  // Username uniqueness
  const [isUsernameUnique, setIsUsernameUnique] = useState<boolean | null>(true);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isNotificationsOn, setIsNotificationsOn] = useState(true);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const { notifications: realNotifications, unreadCount: realUnreadCount, markAllAsRead } = useNotifications();

  // Dialog State
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [isCheckingTempUsername, setIsCheckingTempUsername] = useState(false);
  const [isTempUsernameUnique, setIsTempUsernameUnique] = useState<boolean | null>(true);

  const showStatus = (text: string, ok = true) => {
    setStatusMessage({ text, ok });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Load current user from session
  useEffect(() => {
    if (!session?.user) return;

    // Populate directly from the session (always available, no auth() cookie issues)
    setUserId(session.user.id ?? "");
    setUsername((session.user as any).username ?? "");
    setOriginalUsername((session.user as any).username ?? "");
    setAlias(session.user.name ?? "");
    // Email is available directly on the session user object
    if ((session.user as any).email) setEmail((session.user as any).email);
    if (session.user.image) setAvatarUrl(session.user.image);

    // Enrich with full profile data (email fallback + any extra fields)
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user?.email) setEmail(data.user.email);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [session]);

  // Username uniqueness check
  useEffect(() => {
    if (!username || username === originalUsername) {
      setIsUsernameUnique(true);
      return;
    }
    const check = async () => {
      setIsCheckingUsername(true);
      try {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          setIsUsernameUnique(data.isUnique);
        }
      } catch {
        setIsUsernameUnique(null);
      } finally {
        setIsCheckingUsername(false);
      }
    };
    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [username, originalUsername]);

  const hasUnsavedProfileChanges = useMemo(() => {
    return Boolean(username !== originalUsername || alias);
  }, [username, originalUsername, alias]);

  const openEdit = (field: string, currentVal: string) => {
    setTempValue(currentVal);
    setOpenDialog(field);
    if (field === 'username') {
      setIsTempUsernameUnique(true);
      setIsCheckingTempUsername(false);
    }
  };

  useEffect(() => {
    if (openDialog !== 'username') return;
    if (!tempValue || tempValue === originalUsername) {
      setIsTempUsernameUnique(true);
      return;
    }
    const check = async () => {
      setIsCheckingTempUsername(true);
      try {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(tempValue)}`);
        if (res.ok) {
          const data = await res.json();
          setIsTempUsernameUnique(data.isUnique);
        }
      } catch {
        setIsTempUsernameUnique(null);
      } finally {
        setIsCheckingTempUsername(false);
      }
    };
    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [tempValue, originalUsername, openDialog]);

  const saveField = async () => {
    if (openDialog === 'username' && !isTempUsernameUnique) return;
    
    const overrides: any = {};
    if (openDialog === "username") {
      setUsername(tempValue);
      overrides.username = tempValue;
    } else if (openDialog === "alias") {
      setAlias(tempValue);
      overrides.alias = tempValue;
    } else if (openDialog === "email") {
      setEmail(tempValue);
      overrides.email = tempValue;
    }
    
    setOpenDialog(null);
    setTimeout(() => handleSaveProfile(overrides), 0);
  };

  const handleAvatarUploadClick = () => fileInputRef.current?.click();

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      showStatus("Please choose a valid image file.", false);
      event.target.value = "";
      return;
    }

    const maxFileSize = 2 * 1024 * 1024; // 2MB
    if (selectedFile.size > maxFileSize) {
      showStatus("Image must be 2MB or smaller.", false);
      event.target.value = "";
      return;
    }

    showStatus("Uploading image...");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setDraftAvatarUrl(data.publicUrl);
      showStatus("Avatar staged. Click Apply to save.");
    } catch (error: any) {
      console.error("Upload error:", error);
      showStatus(`Upload failed: ${error.message || 'Unknown error'}`, false);
    } finally {
      event.target.value = "";
    }
  };

  const handleApplyAvatar = async () => {
    if (!draftAvatarUrl) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePictureUrl: draftAvatarUrl }),
      });
      if (!res.ok) {
        const d = await res.json();
        showStatus(d.error ?? "Failed to apply avatar.", false);
        return;
      }
      setAvatarUrl(draftAvatarUrl);
      setDraftAvatarUrl("");
      await update({ ...session, user: { ...session?.user, image: draftAvatarUrl } });
      showStatus("Avatar applied and saved!");
    } catch {
      showStatus("Network error. Try again.", false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async (overrides: any = {}) => {
    const finalUsername = overrides.username !== undefined ? overrides.username : username;
    const finalAlias = overrides.alias !== undefined ? overrides.alias : alias;
    const finalEmail = overrides.email !== undefined ? overrides.email : email;

    if (finalUsername && finalUsername !== originalUsername && !isTempUsernameUnique) {
      showStatus("Choose an available username first.", false);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: finalUsername, 
          displayName: finalAlias, 
          email: finalEmail,
          profilePictureUrl: avatarUrl
        }),
      });
      const data = await res.json();
      if (!res.ok) { showStatus(data.error ?? "Save failed.", false); return; }
      setOriginalUsername(finalUsername);
      // Update session to reflect new image immediately in header
      await update({
        ...session,
        user: {
          ...session?.user,
          image: avatarUrl
        }
      });
      showStatus("Profile saved successfully.");
    } catch {
      showStatus("Network error. Try again.", false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !nextPassword || !confirmPassword) {
      showStatus("Fill all password fields.", false);
      return;
    }
    if (nextPassword !== confirmPassword) {
      showStatus("New password and confirmation do not match.", false);
      return;
    }
    if (nextPassword.length < 8) {
      showStatus("New password must be at least 8 characters.", false);
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword: nextPassword }),
      });
      const data = await res.json();
      if (!res.ok) { showStatus(data.error ?? "Password change failed.", false); return; }
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      showStatus("Password changed successfully.");
    } catch {
      showStatus("Network error. Try again.", false);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant animate-pulse">Loading your profile...</p>
      </div>
    );
  }

  const clientNavItems = [
    { key: "home", label: "Home", href: "/", icon: <Home className="h-5 w-5" />, isActive: false },
    { key: "browse", label: "Browse", href: "/booster-browse", icon: <Search className="h-5 w-5" />, isActive: false },
    { key: "orders", label: "Orders", href: "/client-orders", icon: <ClipboardList className="h-5 w-5" />, isActive: false },
    { key: "chats", label: "Messages", href: "/client-chats", icon: <MessageSquare className="h-5 w-5" />, isActive: false },
    { key: "settings", label: "Settings", href: "/client-settings", icon: <Settings className="h-5 w-5" />, isActive: true },
  ];

  return (
    <>
      {!hideSidebar && <ClientSidebar active="settings" />}

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
          if (action === "Settings") { setIsProfileMenuOpen(false); return; }
          if (action === "Logout") { await signOut({ callbackUrl: "/" }); return; }
          setIsProfileMenuOpen(false);
        }}
      />

      <main className={`${hideSidebar ? "" : "ml-64"} min-h-screen bg-background pt-24 pb-20 transition-all duration-300`}>
        <div className={`mx-auto ${hideSidebar ? "max-w-7xl" : "max-w-5xl"} px-12`}>
          <h1 className="font-headline mb-3 text-5xl font-bold uppercase italic tracking-tight text-on-surface">Client Settings</h1>
          <p className="mb-8 text-on-surface-variant">Manage your profile and account security.</p>

          {statusMessage ? (
            <div className={`mb-6 rounded-lg border px-4 py-3 text-xs font-bold uppercase tracking-wider ${statusMessage.ok ? "border-primary/30 bg-primary/10 text-primary" : "border-error/30 bg-error/10 text-error"}`}>
              {statusMessage.text}
            </div>
          ) : null}

          {/* Avatar */}
          <section className="ghost-border mb-6 flex flex-col items-center gap-8 rounded-xl bg-surface-container-low p-8 md:flex-row">
            <div className="group relative">
              <div className="h-32 w-32 overflow-hidden rounded-2xl border-2 border-primary/30 shadow-[0_0_30px_rgba(143,245,255,0.1)]">
                <img src={draftAvatarUrl || avatarUrl} alt="Client avatar preview" className="h-full w-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 rounded-lg border border-primary/20 bg-background p-1.5 shadow-xl">
                <Edit3 className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="grow">
              <h2 className="font-headline mb-2 text-2xl font-bold text-on-surface">AVATAR</h2>
              <p className="mb-4 max-w-md text-sm text-on-surface-variant">Update your profile image. Recommended resolution: 512x512px. JPG or PNG format only.</p>
              {draftAvatarUrl ? (
                <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-amber-400">⚠ Preview only — click Apply to save.</p>
              ) : null}
              <div className="flex flex-wrap gap-4">
                <Button type="button" onClick={handleAvatarUploadClick} className="primary-gradient font-label rounded-md px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-on-primary-fixed transition-transform active:scale-95">UPLOAD Avatar</Button>
                <FileInput ref={fileInputRef} accept="image/png,image/jpeg,image/webp" onChange={handleAvatarFileChange} className="hidden" />
                <Button type="button" onClick={() => { setDraftAvatarUrl(""); setAvatarUrl("/booster-pfps/default-avatar.svg"); }} className="font-label rounded-md border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant transition-all hover:bg-white/10">Remove</Button>
                <Button
                  type="button"
                  onClick={handleApplyAvatar}
                  disabled={!draftAvatarUrl || isSaving}
                  className="font-label rounded-md border border-primary/30 bg-primary/10 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSaving ? "Saving..." : "Apply"}
                </Button>
              </div>
            </div>
          </section>

          {/* Identity */}
          <section className="ghost-border mb-6 rounded-xl bg-surface-container-low p-8">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <UserCircle className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-headline text-2xl font-bold">Identity Details</h2>
              </div>
              {userId ? (
                <div className="flex items-center gap-2 rounded-md border border-white/5 bg-surface-container-lowest px-3 py-1.5">
                  <span className="font-mono text-xs text-on-surface-variant">ID: {userId.slice(0, 20)}…</span>
                  <Button
                    type="button" variant="ghost" size="icon"
                    className="h-6 w-6 text-on-surface-variant hover:text-primary"
                    onClick={() => { navigator.clipboard.writeText(userId); showStatus("Internal UID copied to clipboard."); }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-lowest border border-white/5">
                 <div>
                   <Label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Username</Label>
                   <p className="text-sm font-bold text-on-surface">@{username}</p>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="text-primary hover:bg-primary/10"
                   onClick={() => openEdit("username", username)}
                 >
                   <Edit3 className="h-4 w-4 mr-2" /> Edit
                 </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-lowest border border-white/5">
                 <div>
                   <Label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Alias / Display Name</Label>
                   <p className="text-sm font-bold text-on-surface">{alias}</p>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="text-primary hover:bg-primary/10"
                   onClick={() => openEdit("alias", alias)}
                 >
                   <Edit3 className="h-4 w-4 mr-2" /> Edit
                 </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-lowest border border-white/5">
                 <div>
                   <Label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Email Address</Label>
                   <p className="text-sm font-bold text-on-surface">{email}</p>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="text-primary hover:bg-primary/10"
                   onClick={() => openEdit("email", email)}
                 >
                   <Edit3 className="h-4 w-4 mr-2" /> Edit
                 </Button>
              </div>
            </div>
          </section>

          {/* Display Preferences */}
          <section className="ghost-border mb-6 rounded-xl bg-surface-container-low p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <MonitorSmartphone className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight">Display Preferences</h2>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-lowest border border-white/5">
              <div className="space-y-1">
                <Label className="font-label text-sm font-bold text-on-surface">Hide Sidebar</Label>
                <p className="text-xs text-on-surface-variant">Switch to a minimal icon-based top navigation. Perfect for more focus.</p>
              </div>
              <Button 
                type="button" 
                onClick={toggleHideSidebar}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${hideSidebar ? 'bg-primary' : 'bg-surface-container-highest'}`}
              >
                <span className={`${hideSidebar ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
              </Button>
            </div>
          </section>

          {/* Password */}
          <section className="ghost-border rounded-xl bg-surface-container-low p-8">
            <h2 className="font-headline mb-6 text-2xl font-bold">Change Password</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">Current Password</Label>
                <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="ghost-border rounded-sm border-none bg-surface-container-lowest px-4 py-3 text-on-surface transition-all focus:ring-1 focus:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">New Password</Label>
                <PasswordInput value={nextPassword} onChange={(e) => setNextPassword(e.target.value)} className="ghost-border rounded-sm border-none bg-surface-container-lowest px-4 py-3 text-on-surface transition-all focus:ring-1 focus:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">Confirm Password</Label>
                <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="ghost-border rounded-sm border-none bg-surface-container-lowest px-4 py-3 text-on-surface transition-all focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="mt-8">
              <Button
                type="button"
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="primary-gradient font-label rounded-md px-8 py-3 text-sm font-extrabold uppercase tracking-wider text-on-primary-fixed shadow-[0_0_20px_rgba(143,245,255,0.2)] transition-transform active:scale-95 disabled:opacity-40"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </section>
        </div>
      </main>

      <ClientMobileNav active="settings" avatarUrl={avatarUrl} />

      <Dialog open={!!openDialog} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[425px] border-white/10 bg-[#0c0e14] text-white shadow-[0_0_50px_rgba(34,211,238,0.15)]">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl font-bold uppercase tracking-widest text-primary">Edit {openDialog?.replace(/([A-Z])/g, ' $1')}</DialogTitle>
            <DialogDescription className="text-on-surface-variant">
              {openDialog === 'username' || openDialog === 'alias' ? 'Max 25 characters.' : 'Update your profile information below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            {openDialog === 'email' ? (
               <Input 
                type="email"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="ghost-border h-12 w-full rounded-lg border-none bg-surface-container-highest px-4 text-on-surface focus:ring-1 focus:ring-primary"
              />
            ) : (
              <div className="space-y-2">
                <Input 
                  value={tempValue}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (openDialog === 'username' || openDialog === 'alias') val = val.slice(0, 25);
                    setTempValue(val);
                  }}
                  className="ghost-border h-12 w-full rounded-lg border-none bg-surface-container-highest px-4 text-on-surface focus:ring-1 focus:ring-primary"
                />
                {openDialog === 'username' && (
                   <div className="flex justify-end pt-1">
                      {isCheckingTempUsername ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Checking...</span>
                      ) : tempValue && tempValue !== originalUsername ? (
                        isTempUsernameUnique ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Available</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-error">Taken</span>
                        )
                      ) : null}
                   </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
             <Button variant="ghost" onClick={() => setOpenDialog(null)} className="font-bold uppercase tracking-wider">Cancel</Button>
             <Button 
               onClick={saveField}
               disabled={isSaving || (openDialog === 'username' && !isTempUsernameUnique)}
               className="cta-flame-soft cta-flame-soft-primary px-8 font-bold uppercase tracking-widest"
             >
               {isSaving ? "Saving..." : "Save"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
