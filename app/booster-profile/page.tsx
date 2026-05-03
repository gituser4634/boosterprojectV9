"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
  AtSign,
  ClipboardList,
  Copy,
  Crown,
  Edit3,
  Gamepad2,
  HelpCircle,
  History,
  LayoutDashboard,
  Lock,
  MessageSquare,
  MonitorSmartphone,
  Plus,
  Settings,
  Share2,
  Shield,
  Tv,
  UserCircle,
  UserRoundCheck,
  Wallet,
  X,
  Globe,
} from "lucide-react";
import { BoosterSidebar } from "@/components/booster/shell-navigation";
import { BoosterTopBar, type NotificationItem } from "@/components/booster/top-bar";
import { useNotifications } from "@/hooks/use-notifications";
import { PickerSheet } from "@/components/booster/picker-sheet";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  defaultAvatar,
  gameRanks,
  supportedCountries,
  supportedGames,
  supportedLanguages,
  supportedSocialPlatforms,
} from "./data";

type GameEntry = {
  id: number;
  name: string;
  rank: string;
  accountId: string;
};

type SocialLinkEntry = {
  id: number;
  platform: string;
  username: string;
};

export default function BoosterProfilePage() {
  const { data: session, update } = useSession();
  const savedMainGameStorageKey = "booster-main-game";
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [boosterId, setBoosterId] = useState("");
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [isUsernameUnique, setIsUsernameUnique] = useState<boolean | null>(true);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [isNotificationsOn, setIsNotificationsOn] = useState(true);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const { 
    notifications: realNotifications, 
    unreadCount: realUnreadCount, 
    markAllAsRead 
  } = useNotifications();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const avatarUrl = session?.user?.image ?? defaultAvatar;
  const [uiMessage, setUiMessage] = useState("Loading profile...");
  const [isSaving, setIsSaving] = useState(false);
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("0");
  const [languages, setLanguages] = useState<string[]>([]);
  const [isLanguagePickerOpen, setIsLanguagePickerOpen] = useState(false);
  const [languageToAdd, setLanguageToAdd] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countryToSet, setCountryToSet] = useState("");
  const [activeGames, setActiveGames] = useState<GameEntry[]>([]);
  const [nextGameId, setNextGameId] = useState(1);
  const [isGamePickerOpen, setIsGamePickerOpen] = useState(false);
  const [gameToAdd, setGameToAdd] = useState("");
  const [rankToAdd, setRankToAdd] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLinkEntry[]>([]);
  const [nextSocialId, setNextSocialId] = useState(1);
  const [isSocialPickerOpen, setIsSocialPickerOpen] = useState(false);
  const [socialPlatformToAdd, setSocialPlatformToAdd] = useState("");
  const [socialUsernameToAdd, setSocialUsernameToAdd] = useState("");
  const [primaryGame, setPrimaryGame] = useState("");
  const [savedPrimaryGame, setSavedPrimaryGame] = useState("");
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const [draftAvatarUrl, setDraftAvatarUrl] = useState(avatarUrl);
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [isTempUsernameUnique, setIsTempUsernameUnique] = useState<boolean | null>(true);
  const [isCheckingTempUsername, setIsCheckingTempUsername] = useState(false);
  const [hasPendingAvatarChange, setHasPendingAvatarChange] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isLoggedInBooster = true;
  const [passwordFields, setPasswordFields] = useState({
    current: "",
    next: "",
    confirm: "",
  });
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

  // Load real user data on mount
  useEffect(() => {
    if (!session?.user) return;

    // Populate core identity fields directly from session (always reliable)
    setUserId(session.user.id ?? "");
    setUsername((session.user as any).username ?? "");
    setOriginalUsername((session.user as any).username ?? "");
    setAlias(session.user.name ?? "");
    if ((session.user as any).email) setEmail((session.user as any).email);

    // Fetch full profile for booster-specific data (bio, games, languages, etc.)
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          // Session works fine, just couldn't enrich booster data
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        const u = data.user;
        setUserProfile(u);
        if (u.email) setEmail(u.email);
        if (u.boosterProfile) {
          const bp = u.boosterProfile;
          setBoosterId(bp.id ?? "");
          setCountryOfOrigin(bp.country ?? "");
          setLanguages(bp.languages?.map((l: { language: string }) => l.language) ?? []);
          setBio(bp.bio ?? "");
          setHourlyRate(bp.hourlyRate ? bp.hourlyRate.toString() : "0");
          console.log("Loading booster profile main game:", bp.mainGame);
          if (bp.mainGame) {
            setPrimaryGame(bp.mainGame.name);
            setSavedPrimaryGame(bp.mainGame.name);
            window.localStorage.setItem(savedMainGameStorageKey, bp.mainGame.name);
          } else if (bp.mainGameId) {
            console.warn("Main game ID exists but relation is null:", bp.mainGameId);
          }
          if (bp.boosterGames) {
            setActiveGames(bp.boosterGames.map((bg: any, index: number) => ({
              id: index + 1,
              name: bg.game.name,
              rank: bg.rank.name,
              accountId: bg.inGameUsername || ""
            })));
            setNextGameId(bp.boosterGames.length + 1);
          }
        }
        showStatus("Profile loaded.");
      } catch {
        // Silently fail enrichment — session data is still shown
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);
  const notifications: NotificationItem[] = [
    { id: "request", title: "New boost request assigned", meta: "Valorant ��� 2 min ago" },
    { id: "message", title: "Client sent you a message", meta: "Inbox ��� 14 min ago" },
  ];

  const boosterNavLinks = [
    { icon: "dashboard", label: "Dashboard", href: "#" },
    { icon: "assignment", label: "Requests", href: "/booster-requests" },
    { icon: "payments", label: "Payments", href: "/booster-payments" },
    { icon: "forum", label: "Chats", href: "/booster-chats" },
  ];

  const renderNavIcon = (icon: string, className: string) => {
    if (icon === "dashboard") return <LayoutDashboard className={className} />;
    if (icon === "assignment") return <ClipboardList className={className} />;
    if (icon === "payments") return <Wallet className={className} />;
    return <MessageSquare className={className} />;
  };

  const showStatus = (message: string) => {
    setUiMessage(message);
  };

  const availableGames = supportedGames.filter(
    (game) => !activeGames.some((active) => active.name === game)
  );
  const availableLanguages = supportedLanguages.filter(
    (language) => !languages.some((active) => active.toLowerCase() === language.toLowerCase())
  );
  const availableSocialPlatforms = supportedSocialPlatforms.filter(
    (platform) => !socialLinks.some((link) => link.platform === platform)
  );

  const handleToggleOnline = () => {
    if (isDeactivated) {
      showStatus("Account is deactivated. Availability cannot be changed.");
      return;
    }

    setIsOnline((current) => {
      const next = !current;
      showStatus(next ? "Status changed to Online." : "Status changed to Offline.");
      return next;
    });
  };

  const handleNotificationToggle = () => {
    if (isDeactivated) {
      showStatus("Account is deactivated. Notifications are locked.");
      return;
    }

    setIsNotificationsOn((current) => {
      const next = !current;
      showStatus(next ? "Notifications enabled." : "Notifications muted.");
      return next;
    });
  };

  const handleMarkNotificationsRead = () => {
    markAllAsRead();
    showStatus("Notifications marked as read.");
  };

  const handleProfileAction = async (action: string) => {
    if (action === "Settings") {
      router.push("/booster-profile");
      return;
    }

    if (action === "Logout") {
      await signOut({ callbackUrl: "/" });
      return;
    }

    setIsProfileMenuOpen(false);
    showStatus(`${action} clicked.`);
  };

  const handleAvatarUpload = () => {
    if (isDeactivated) {
      showStatus("Account is deactivated. Avatar cannot be changed.");
      return;
    }

    avatarFileInputRef.current?.click();
  };

  const handleAvatarRemove = () => {
    if (isDeactivated) {
      showStatus("Account is deactivated. Avatar cannot be changed.");
      return;
    }

    setDraftAvatarUrl(defaultAvatar);
    setHasPendingAvatarChange(defaultAvatar !== avatarUrl);
    showStatus("Avatar reset in preview. Apply settings to save.");
  };

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isDeactivated) {
      showStatus("Account is deactivated. Avatar cannot be changed.");
      event.target.value = "";
      return;
    }

    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      showStatus("Avatar update canceled.");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      showStatus("Please choose a valid image file.");
      event.target.value = "";
      return;
    }

    const maxFileSize = 2 * 1024 * 1024; // 2MB
    if (selectedFile.size > maxFileSize) {
      showStatus("Image must be 2MB or smaller.");
      event.target.value = "";
      return;
    }

    showStatus("Uploading image to storage...");
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
      setHasPendingAvatarChange(true);
      showStatus("Avatar uploaded to storage. Click Apply to save to your profile.");
    } catch (error: any) {
      console.error("Upload error:", error);
      showStatus(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      event.target.value = "";
    }
  };

  const handleApplyAvatarSettings = async () => {
    if (isDeactivated) {
      showStatus("Account is deactivated. Avatar cannot be changed.");
      return;
    }

    if (!hasPendingAvatarChange) {
      showStatus("No avatar changes to apply.");
      return;
    }

    showStatus("Saving avatar to profile...");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePictureUrl: draftAvatarUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save avatar URL to database.");
      }

      // Also update session to reflect new image immediately in header
      await update({
        ...session,
        user: {
          ...session?.user,
          image: draftAvatarUrl
        }
      });
      setHasPendingAvatarChange(false);
      showStatus("Avatar updated successfully.");
    } catch (error: any) {
      console.error("Avatar save error:", error);
      showStatus(`Failed to save avatar: ${error.message}`);
    }
  };

  useEffect(() => {
    setDraftAvatarUrl(avatarUrl);
    setHasPendingAvatarChange(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (!username || username === originalUsername) {
      setIsUsernameUnique(true);
      return;
    }
    const checkUsername = async () => {
      setIsCheckingUsername(true);
      try {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          setIsUsernameUnique(data.isUnique);
        } else {
          setIsUsernameUnique(null);
        }
      } catch {
        setIsUsernameUnique(null);
      } finally {
        setIsCheckingUsername(false);
      }
    };
    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [username, originalUsername]);
  
  useEffect(() => {
    if (openDialog !== 'username' || !tempValue || tempValue === originalUsername) {
      setIsTempUsernameUnique(true);
      return;
    }
    
    const check = async () => {
      setIsCheckingTempUsername(true);
      try {
        const res = await fetch(`/api/profile/check-username?username=${encodeURIComponent(tempValue)}`);
        if (res.ok) {
          const data = await res.json();
          setIsTempUsernameUnique(data.available);
        }
      } catch (err) {
        console.error("Check error:", err);
      } finally {
        setIsCheckingTempUsername(false);
      }
    };
    
    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [tempValue, openDialog, originalUsername]);

  const handleOpenLanguagePicker = () => {
    if (isDeactivated) {
      showStatus("Account is deactivated. Languages cannot be changed.");
      return;
    }

    if (availableLanguages.length === 0) {
      showStatus("All supported languages are already added.");
      return;
    }

    setLanguageToAdd(availableLanguages[0]);
    setIsLanguagePickerOpen(true);
  };

  const handleOpenCountryPicker = () => {
    if (isDeactivated) {
      showStatus("Account is deactivated. Country cannot be changed.");
      return;
    }

    setCountryToSet(countryOfOrigin);
    setIsCountryPickerOpen(true);
  };

  const handleSetCountryFromPicker = () => {
    setCountryOfOrigin(countryToSet);
    setIsCountryPickerOpen(false);
    setTimeout(() => handleSaveAllSettings("identity", { countryOfOrigin: countryToSet }), 0);
  };

  const handleAddLanguageFromPicker = () => {
    if (!languageToAdd) return;

    setLanguages((current) => {
      const next = [...current, languageToAdd];
      setTimeout(() => handleSaveAllSettings("identity", { languages: next }), 0);
      return next;
    });
    setIsLanguagePickerOpen(false);
  };

  const handleRemoveLanguage = (name: string) => {
    if (isDeactivated) {
      showStatus("Account is deactivated. Languages cannot be changed.");
      return;
    }

    setLanguages((current) => {
      const next = current.filter((item) => item !== name);
      setTimeout(() => handleSaveAllSettings("identity", { languages: next }), 0);
      return next;
    });
  };

  const openEdit = (field: string, currentVal: string) => {
    setOpenDialog(field);
    setTempValue(currentVal);
  };

  const saveField = async () => {
    if (isDeactivated) return;
    
    const overrides: any = {};
    
    // Update local state first
    if (openDialog === "username") {
      if (!isTempUsernameUnique) return;
      setUsername(tempValue);
      overrides.username = tempValue;
    } else if (openDialog === "alias") {
      setAlias(tempValue);
      overrides.alias = tempValue;
    } else if (openDialog === "email") {
      setEmail(tempValue);
      overrides.email = tempValue;
    } else if (openDialog === "bio") {
      setBio(tempValue);
      overrides.bio = tempValue;
    } else if (openDialog === "country") {
      setCountryOfOrigin(tempValue);
      overrides.countryOfOrigin = tempValue;
    } else if (openDialog === "hourlyRate") {
      setHourlyRate(tempValue);
      overrides.hourlyRate = tempValue;
    } else if (openDialog === "primaryGame") {
      setPrimaryGame(tempValue);
      overrides.primaryGame = tempValue;
    }

    setOpenDialog(null);
    // Trigger global save to sync with DB
    setTimeout(() => handleSaveAllSettings("identity", overrides), 0);
  };

  const handleSaveAllSettings = async (section: "identity" | "expertise", overrides: any = {}) => {
    setIsSaving(true);
    try {
      // 1. Update User Account (username, email, user.displayName)
      const resUser = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: overrides.username !== undefined ? overrides.username : username, 
          displayName: overrides.alias !== undefined ? overrides.alias : alias, 
          email: overrides.email !== undefined ? overrides.email : email 
        }),
      });
      
      if (!resUser.ok) {
        const data = await resUser.json();
        showStatus(data.error ?? "User update failed.");
        setIsSaving(false);
        return;
      }

      // 2. Update Booster Details (alias, bio, country, languages, mainGame, activeGames)
      const resBooster = await fetch("/api/profile/booster", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          alias: overrides.alias !== undefined ? overrides.alias : alias,
          bio: overrides.bio !== undefined ? overrides.bio : bio,
          country: overrides.countryOfOrigin !== undefined ? overrides.countryOfOrigin : countryOfOrigin,
          languages: overrides.languages !== undefined ? overrides.languages : languages,
          hourlyRate: overrides.hourlyRate !== undefined ? overrides.hourlyRate : hourlyRate,
          mainGameName: overrides.primaryGame !== undefined ? overrides.primaryGame : primaryGame,
          activeGames: (overrides.activeGames || activeGames).map((g: any) => ({ name: g.name, rank: g.rank, accountId: g.accountId }))
        }),
      });

      if (!resBooster.ok) {
        const data = await resBooster.json();
        showStatus(data.error ?? "Booster profile update failed.");
        setIsSaving(false);
        return;
      }

      const finalUsername = overrides.username !== undefined ? overrides.username : username;
      const finalPrimaryGame = overrides.primaryGame !== undefined ? overrides.primaryGame : primaryGame;

      setOriginalUsername(finalUsername);
      setSavedPrimaryGame(finalPrimaryGame);
      window.localStorage.setItem(savedMainGameStorageKey, finalPrimaryGame);
      
      // Refresh session for alias/pfp changes
      await update();
      
      // Re-load profile from DB to ensure UI is perfectly synced
      const resRefresh = await fetch("/api/auth/me");
      if (resRefresh.ok) {
        const data = await resRefresh.json();
        const u = data.user;
        setUserProfile(u);
        if (u.boosterProfile) {
          const bp = u.boosterProfile;
          if (bp.mainGame) {
             setPrimaryGame(bp.mainGame.name);
             setSavedPrimaryGame(bp.mainGame.name);
             window.localStorage.setItem(savedMainGameStorageKey, bp.mainGame.name);
          }
          if (bp.boosterGames) {
            setActiveGames(bp.boosterGames.map((bg: any, index: number) => ({
              id: index + 1,
              name: bg.game.name,
              rank: bg.rank.name,
              accountId: bg.inGameUsername || ""
            })));
          }
        }
      }

      showStatus(section === "identity" ? "Identity and account details saved." : "Expertise and active games saved.");
    } catch (err) {
      console.error("Save error:", err);
      showStatus("Network error. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCredentialsUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDeactivated) { showStatus("Account is deactivated. Profile updates are disabled."); return; }
    if (username && !isUsernameUnique && username !== originalUsername) { 
      showStatus("Choose an available username first."); 
      return; 
    }
    await handleSaveAllSettings("identity");
  };

  const handleCloseGame = (gameId: number) => {
    if (isDeactivated) {
      showStatus("Account is deactivated. Game list cannot be changed.");
      return;
    }

    setActiveGames((current) => {
      const gameToRemove = current.find((game) => game.id === gameId);
      const next = current.filter((game) => game.id !== gameId);
      if (gameToRemove) {
        showStatus(`${gameToRemove.name} removed from active list.`);
        // If the removed game was the primary game, clear it
        if (gameToRemove.name === primaryGame) {
          setPrimaryGame("");
          setSavedPrimaryGame("");
          window.localStorage.removeItem(savedMainGameStorageKey);
          showStatus(`Warning: ${gameToRemove.name} was your Primary Game. It has been unset.`);
        }
      }
      return next;
    });
  };

  const handleOpenGamePicker = () => {
    if (isDeactivated) {
      showStatus("Account is deactivated. Game list cannot be changed.");
      return;
    }

    if (availableGames.length === 0) {
      showStatus("All supported games are already added.");
      return;
    }

    const firstGame = availableGames[0];
    setGameToAdd(firstGame);
    setRankToAdd(gameRanks[firstGame]?.[0] || "");
    setIsGamePickerOpen(true);
  };

  const handleGameSelectionChange = (game: string) => {
    setGameToAdd(game);
    setRankToAdd(gameRanks[game]?.[0] || "");
  };

  const handleAddGameFromPicker = () => {
    if (!gameToAdd) return;

    const newGame = {
      id: nextGameId,
      name: gameToAdd,
      rank: rankToAdd || gameRanks[gameToAdd]?.[0] || "",
      accountId: "",
    };

    setActiveGames((current) => {
      const next = [...current, newGame];
      // Auto-save whenever a game is added
      setTimeout(() => handleSaveAllSettings("expertise", { activeGames: next }), 100);
      return next;
    });
    
    setNextGameId((current) => current + 1);
    setIsGamePickerOpen(false);
    showStatus(`${gameToAdd} added to active games. Saving...`);
  };

  const handleGameRankChange = (gameId: number, rank: string) => {
    setActiveGames((current) => {
      const next = current.map((game) => (game.id === gameId ? { ...game, rank } : game));
      // Auto-save on rank change
      setTimeout(() => handleSaveAllSettings("expertise", { activeGames: next }), 100);
      return next;
    });
  };

  const handleGameAccountIdChange = (gameId: number, accountId: string) => {
    setActiveGames((current) =>
      current.map((game) => (game.id === gameId ? { ...game, accountId } : game))
    );
  };

  const handleSaveExpertise = async () => {
    if (isDeactivated) { showStatus("Account is deactivated. Service expertise cannot be saved."); return; }
    await handleSaveAllSettings("expertise");
  };

  useEffect(() => {
    // We only load from localStorage as a temporary fallback, but loadUser will overwrite with DB truth
    const savedGame = window.localStorage.getItem(savedMainGameStorageKey) ?? "";
    if (savedGame && !primaryGame) {
      setSavedPrimaryGame(savedGame);
      setPrimaryGame(savedGame);
    }
  }, [primaryGame]);

  const handleOpenSocialPicker = () => {
    if (isDeactivated) {
      showStatus("Account is deactivated. Social connections cannot be changed.");
      return;
    }

    if (availableSocialPlatforms.length === 0) {
      showStatus("All supported social platforms are already linked.");
      return;
    }

    setSocialPlatformToAdd(availableSocialPlatforms[0]);
    setSocialUsernameToAdd("");
    setIsSocialPickerOpen(true);
  };

  const handleAddSocialFromPicker = () => {
    if (!socialPlatformToAdd) return;

    const trimmedUsername = socialUsernameToAdd.trim();
    if (!trimmedUsername) {
      showStatus("Enter a username/profile link first.");
      return;
    }

    setSocialLinks((current) => [
      ...current,
      {
        id: nextSocialId,
        platform: socialPlatformToAdd,
        username: trimmedUsername,
      },
    ]);
    setNextSocialId((current) => current + 1);
    setIsSocialPickerOpen(false);
    showStatus(`${socialPlatformToAdd} profile linked.`);
  };

  const handleSocialUsernameChange = (socialId: number, username: string) => {
    setSocialLinks((current) =>
      current.map((item) => (item.id === socialId ? { ...item, username } : item))
    );
  };

  const handleRemoveSocialLink = (socialId: number) => {
    if (isDeactivated) {
      showStatus("Account is deactivated. Social connections cannot be changed.");
      return;
    }

    setSocialLinks((current) => {
      const removed = current.find((item) => item.id === socialId);
      const next = current.filter((item) => item.id !== socialId);
      if (removed) {
        showStatus(`${removed.platform} unlinked.`);
      }
      return next;
    });
  };

  const getSocialAccentClasses = (platform: string) => {
    if (platform === "Twitch") return "bg-[#9146FF]/10 text-[#9146FF]";
    if (platform === "Discord") return "bg-[#5865F2]/10 text-[#5865F2]";
    if (platform === "Twitter (X)") return "bg-[#1DA1F2]/10 text-[#1DA1F2]";
    if (platform === "YouTube") return "bg-[#FF0000]/10 text-[#FF0000]";
    if (platform === "TikTok") return "bg-[#25F4EE]/10 text-[#25F4EE]";
    if (platform === "Instagram") return "bg-[#E1306C]/10 text-[#E1306C]";
    if (platform === "Steam") return "bg-[#66c0f4]/10 text-[#66c0f4]";
    if (platform === "Xbox") return "bg-[#107C10]/10 text-[#107C10]";
    if (platform === "PlayStation") return "bg-[#003791]/10 text-[#3f6dff]";
    return "bg-primary/10 text-primary";
  };

  const handleChangePassword = async () => {
    if (isDeactivated) { showStatus("Account is deactivated. Password changes are disabled."); return; }
    if (!passwordFields.current || !passwordFields.next || !passwordFields.confirm) {
      showStatus("Fill in all password fields first.");
      return;
    }
    if (passwordFields.next !== passwordFields.confirm) {
      showStatus("New password and confirmation do not match.");
      return;
    }
    if (passwordFields.next.length < 8) {
      showStatus("New password must be at least 8 characters.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwordFields.current, newPassword: passwordFields.next }),
      });
      const data = await res.json();
      if (!res.ok) { showStatus(data.error ?? "Password change failed."); return; }
      setPasswordFields({ current: "", next: "", confirm: "" });
      showStatus("Password changed successfully.");
    } catch {
      showStatus("Network error. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleLog = () => {
    setIsLogOpen((current) => {
      const next = !current;
      showStatus(next ? "Session logs expanded." : "Session logs collapsed.");
      return next;
    });
  };

  const handleTerminateAccount = () => {
    if (isDeactivated) {
      setIsDeactivated(false);
      setIsOnline(true);
      showStatus("Account reactivated locally.");
      return;
    }

    const confirmed = window.confirm("Deactivate this account on frontend preview?");
    if (!confirmed) {
      showStatus("Account deactivation canceled.");
      return;
    }
    setIsDeactivated(true);
    setIsOnline(false);
    showStatus("Account deactivated locally.");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-on-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-primary">Loading Profile...</p>
        </div>
      </div>
    );
  }

  const boosterNavItems = [
    { key: "dashboard", label: "Dashboard", href: "/booster-dashboard", icon: <LayoutDashboard className="h-5 w-5" />, isActive: false },
    { key: "requests", label: "Requests", href: "/booster-requests", icon: <ClipboardList className="h-5 w-5" />, isActive: false },
    { key: "payments", label: "Payments", href: "/booster-payments", icon: <Wallet className="h-5 w-5" />, isActive: false },
    { key: "chats", label: "Chats", href: "/booster-chats", icon: <MessageSquare className="h-5 w-5" />, isActive: false },
    { key: "settings", label: "Settings", href: "/booster-profile", icon: <Settings className="h-5 w-5" />, isActive: true },
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
        avatarAlt="Booster Profile Avatar"
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
        onMarkNotificationsRead={handleMarkNotificationsRead}
        notifications={realNotifications}
        isProfileMenuOpen={isProfileMenuOpen}
        onToggleProfileMenu={() => {
          setIsNotificationsPanelOpen(false);
          setIsProfileMenuOpen((current) => !current);
        }}
        onCloseProfileMenu={() => setIsProfileMenuOpen(false)}
        onProfileAction={handleProfileAction}
      />

      {isLoggedInBooster && !hideSidebar ? (
        <BoosterSidebar
          active="settings"
          isOnline={isOnline}
          onToggleOnline={handleToggleOnline}
          mainGame={userProfile?.boosterProfile?.mainGame?.name || savedPrimaryGame}
          rankInfo={userProfile?.boosterProfile?.rankInfo}
          xp={userProfile?.boosterProfile?.xp}
        />
      ) : null}

      <main className={`h-screen overflow-y-auto px-6 pb-24 pt-24 transition-all duration-300 ${isLoggedInBooster && !hideSidebar ? "ml-64" : ""}`}>
        <div className={`mx-auto ${hideSidebar ? "max-w-7xl" : "max-w-5xl"}`}>
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-xs font-bold uppercase tracking-wider ${
              isDeactivated
                ? "border-error/30 bg-error/10 text-error"
                : "border-primary/20 bg-primary/10 text-primary"
            }`}
          >
            {uiMessage}
          </div>

          <section className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="font-label mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-primary">
                System Configuration
              </span>
              <h1 className="font-headline text-5xl font-extrabold leading-none tracking-tighter text-on-surface md:text-6xl">
                BOOSTER{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  PROFILE
                </span>
              </h1>
              <p className="mt-4 max-w-lg text-lg font-light leading-relaxed text-on-surface-variant">
                Manage your identity and availability.
              </p>
            </div>

            <div className="ghost-border min-w-[280px] rounded-xl bg-surface-container-high p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                  Availability
                </span>
                <div
                  className={`h-2 w-2 rounded-full ${isOnline ? "animate-pulse bg-primary" : "bg-outline"}`}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-headline text-xl font-bold text-on-surface">
                    {isOnline ? "Online Now" : "Offline"}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {isOnline ? "Visible to all clients" : "Hidden from all clients"}
                  </p>
                </div>
                <Button
                  type="button"
                  aria-pressed={isOnline}
                  onClick={handleToggleOnline}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isOnline ? "bg-primary-container" : "bg-outline-variant"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full transition ${
                      isOnline
                        ? "translate-x-6 bg-on-primary-fixed"
                        : "translate-x-1 bg-on-surface-variant"
                    }`}
                  ></span>
                </Button>
              </div>
            </div>
          </section>

          <section className="ghost-border mb-6 flex flex-col items-center gap-8 rounded-xl bg-surface-container-low p-8 md:flex-row">
            <div className="group relative">
              <div className="h-32 w-32 overflow-hidden rounded-2xl border-2 border-primary/30 shadow-[0_0_30px_rgba(143,245,255,0.1)]">
                <img
                  alt="Large Profile Avatar"
                  className="h-full w-full object-cover"
                  src={draftAvatarUrl}
                />
              </div>
              <div className="absolute -bottom-2 -right-2 rounded-lg border border-primary/20 bg-background p-1.5 shadow-xl">
                <Edit3 className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="grow">
              <h2 className="font-headline mb-2 text-2xl font-bold text-on-surface">AVATAR</h2>
              <p className="mb-6 max-w-md text-sm text-on-surface-variant">
                Update your profile image. Recommended resolution: 512x512px. JPG or PNG format
                only.
              </p>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Avatar changes apply only after clicking Apply.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  type="button"
                  onClick={handleAvatarUpload}
                  className="primary-gradient font-label rounded-md px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-on-primary-fixed transition-transform active:scale-95"
                >
                  UPLOAD Avatar
                </Button>
                <FileInput
                  ref={avatarFileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={handleAvatarRemove}
                  className="font-label rounded-md border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant transition-all hover:bg-white/10"
                >
                  Remove
                </Button>
                <Button
                  type="button"
                  onClick={handleApplyAvatarSettings}
                  disabled={!hasPendingAvatarChange}
                  className="font-label rounded-md border border-primary/30 bg-primary/10 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Apply
                </Button>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="ghost-border rounded-xl bg-surface-container-low p-8 md:col-span-7">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <UserCircle className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-headline text-2xl font-bold">Identity Details</h2>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-white/5 bg-surface-container-lowest px-3 py-1.5">
                  <span className="font-mono text-xs text-on-surface-variant">Booster UID: {boosterId ? boosterId.slice(0, 20) + "…" : "—"}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-on-surface-variant hover:text-primary"
                    onClick={() => {
                      navigator.clipboard.writeText(boosterId);
                      showStatus("Booster UID copied to clipboard.");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
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

                <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-lowest border border-white/5">
                   <div>
                     <Label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Country</Label>
                     <p className="text-sm font-bold text-on-surface">{countryOfOrigin || "Not Set"}</p>
                   </div>
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     className="text-primary hover:bg-primary/10"
                     onClick={handleOpenCountryPicker}
                   >
                     <Globe className="h-4 w-4 mr-2" /> Change
                   </Button>
                </div>

                <div className="p-4 rounded-lg bg-surface-container-lowest border border-white/5">
                   <div className="flex items-center justify-between mb-3">
                     <Label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Languages</Label>
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className="text-primary hover:bg-primary/10 h-7"
                       onClick={handleOpenLanguagePicker}
                     >
                       <Plus className="h-3.5 w-3.5 mr-1" /> Add
                     </Button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {languages.length > 0 ? languages.map(lang => (
                       <div key={lang} className="flex items-center gap-1.5 px-2 py-1 rounded border border-primary/20 bg-primary/10 text-[10px] font-bold text-primary">
                         {lang}
                         <button onClick={() => handleRemoveLanguage(lang)} className="hover:text-white transition-colors">
                            <X className="h-3 w-3" />
                         </button>
                       </div>
                     )) : (
                       <p className="text-xs italic text-on-surface-variant opacity-60">No languages added.</p>
                     )}
                   </div>
                </div>
              </div>
            </div>

            <div className="ghost-border rounded-xl bg-surface-container-low p-8 md:col-span-5">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-lg bg-secondary/10 p-3">
                  <UserRoundCheck className="h-5 w-5 text-secondary" />
                </div>
                <h2 className="font-headline text-2xl font-bold">Profile Info</h2>
              </div>
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-surface-container-lowest border border-white/5">
                   <div className="flex items-center justify-between mb-2">
                     <Label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Profile Bio</Label>
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className="text-primary hover:bg-primary/10 h-7"
                       onClick={() => openEdit("bio", bio)}
                     >
                       <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                     </Button>
                   </div>
                   <p className="text-sm leading-relaxed text-on-surface opacity-80 line-clamp-6 min-h-[80px]">
                     {bio || "No bio set. Add one to attract more clients."}
                   </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-lowest border border-white/5">
                   <div>
                     <Label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Hourly Rate</Label>
                     <p className="text-sm font-bold text-on-surface">${hourlyRate}/hr</p>
                   </div>
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     className="text-primary hover:bg-primary/10"
                     onClick={() => openEdit("hourlyRate", hourlyRate)}
                   >
                     <Edit3 className="h-4 w-4 mr-2" /> Edit
                   </Button>
                </div>
              </div>
            </div>


            <div className="ghost-border rounded-xl bg-surface-container-low p-8 md:col-span-12">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-lg bg-tertiary/10 p-3">
                  <Gamepad2 className="h-5 w-5 text-tertiary" />
                </div>
                <h2 className="font-headline text-2xl font-bold">Service Expertise</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-lowest border border-white/5">
                   <div>
                     <Label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Primary Game</Label>
                     <p className="text-sm font-bold text-on-surface">{primaryGame || "Not Set"}</p>
                   </div>
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     className="text-primary hover:bg-primary/10"
                     onClick={() => openEdit("primaryGame", primaryGame)}
                   >
                     <Edit3 className="h-4 w-4 mr-2" /> Edit
                   </Button>
                </div>
              </div>
              
              <div className="mt-8 space-y-4">
                <Label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Active GAMES &amp; Ranks
                </Label>
                  <div className="flex flex-col gap-4">
                    {activeGames.map((game) => (
                      <div key={game.id} className="space-y-2">
                        <div className="ghost-border flex items-center gap-2 rounded-lg bg-surface-container-lowest p-2">
                          <div className="min-w-[120px] rounded-md border border-tertiary/30 bg-tertiary/20 px-3 py-1.5 text-xs font-bold text-tertiary">
                            {game.name}
                          </div>
                          <div className="flex flex-grow justify-end">
                            <Select
                              className="h-10 min-w-[130px] cursor-pointer rounded border border-primary/30 bg-primary/20 px-3 py-0 text-xs font-black uppercase tracking-tighter text-primary"
                              value={game.rank}
                              onChange={(event) => handleGameRankChange(game.id, event.target.value)}
                            >
                              {gameRanks[game.name] ? (
                                gameRanks[game.name].map((rank) => (
                                  <option key={`${game.id}-${rank}`} className="bg-background text-on-surface">
                                    {rank}
                                  </option>
                                ))
                              ) : (
                                <option className="bg-background text-on-surface" disabled>
                                  No ranks defined
                                </option>
                              )}
                            </Select>
                          </div>
                          <Button
                            type="button"
                            onClick={() => handleCloseGame(game.id)}
                            className="cursor-pointer px-1 text-on-surface-variant transition-colors hover:text-error"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          className="ghost-border w-full rounded-sm border-none bg-surface-container-lowest/50 px-3 py-2 text-[10px] italic text-on-surface-variant transition-all focus:ring-1 focus:ring-tertiary"
                          placeholder="Add in-game ID"
                          type="text"
                          value={game.accountId}
                          onChange={(event) => handleGameAccountIdChange(game.id, event.target.value)}
                        />
                      </div>
                    ))}

                    <Button
                      type="button"
                      onClick={handleOpenGamePicker}
                      className="mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/5 bg-surface-container-highest px-3 py-2.5 text-xs font-bold text-on-surface-variant transition-colors hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4" />
                      Add Game
                    </Button>

                    {availableGames.length === 0 ? (
                      <div className="ghost-border rounded-lg bg-surface-container-lowest/70 px-3 py-2 text-[10px] uppercase tracking-wider text-on-surface-variant">
                        All supported games already added
                      </div>
                    ) : null}
                  </div>
                </div>

            </div>



            <div className="ghost-border rounded-xl bg-surface-container-low p-8 md:col-span-12 lg:col-span-6">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-lg bg-cyan-400/10 p-3">
                  <Share2 className="h-5 w-5 text-cyan-400" />
                </div>
                <h2 className="font-headline text-2xl font-bold">Socials</h2>
              </div>
              <div className="space-y-4">
                {socialLinks.map((social) => (
                  <div
                    key={social.id}
                    className="ghost-border flex items-center gap-4 rounded-lg bg-surface-container-lowest p-3"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-md text-[10px] font-black uppercase tracking-wider ${getSocialAccentClasses(
                        social.platform
                      )}`}
                    >
                      {social.platform.slice(0, 2)}
                    </div>
                    <div className="flex-grow">
                      <Label className="mb-1 block text-[10px] font-bold uppercase text-on-surface-variant">
                        {social.platform}
                      </Label>
                      <Input
                        className="w-full border-none bg-transparent p-0 text-sm text-on-surface focus:ring-0"
                        placeholder="Profile username or URL"
                        type="text"
                        value={social.username}
                        onChange={(event) =>
                          handleSocialUsernameChange(social.id, event.target.value)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleRemoveSocialLink(social.id)}
                      className="rounded p-1 text-on-surface-variant transition-colors hover:bg-white/10 hover:text-error"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={handleOpenSocialPicker}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-white/5 bg-surface-container-highest px-3 py-2.5 text-xs font-bold text-on-surface-variant transition-colors hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                  Add Connection
                </Button>

                {availableSocialPlatforms.length === 0 ? (
                  <div className="ghost-border rounded-lg bg-surface-container-lowest/70 px-3 py-2 text-[10px] uppercase tracking-wider text-on-surface-variant">
                    All supported platforms already linked
                  </div>
                ) : null}
              </div>
            </div>

            <div className="ghost-border rounded-xl bg-surface-container-high p-8 md:col-span-12 lg:col-span-6">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-lg bg-secondary/10 p-3">
                  <Lock className="h-5 w-5 text-secondary" />
                </div>
                <h2 className="font-headline text-2xl font-bold">Security</h2>
              </div>
              <div className="space-y-4">
                <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
                  Ensure your account remains fortified with a rotating high-entropy password.
                </p>
                <div className="space-y-4">
                  <PasswordInput
                    className="ghost-border w-full rounded-sm border-none bg-surface-container-lowest px-4 py-3 text-on-surface transition-all focus:ring-1 focus:ring-secondary"
                    placeholder="Current Password"
                    value={passwordFields.current}
                    onChange={(event) =>
                      setPasswordFields((current) => ({ ...current, current: event.target.value }))
                    }
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <PasswordInput
                      className="ghost-border w-full rounded-sm border-none bg-surface-container-lowest px-4 py-3 text-on-surface transition-all focus:ring-1 focus:ring-secondary"
                      placeholder="New Password"
                      value={passwordFields.next}
                      onChange={(event) =>
                        setPasswordFields((current) => ({ ...current, next: event.target.value }))
                      }
                    />
                    <PasswordInput
                      className="ghost-border w-full rounded-sm border-none bg-surface-container-lowest px-4 py-3 text-on-surface transition-all focus:ring-1 focus:ring-secondary"
                      placeholder="Confirm New Password"
                      value={passwordFields.confirm}
                      onChange={(event) =>
                        setPasswordFields((current) => ({ ...current, confirm: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleChangePassword}
                  className="mt-4 w-full rounded-md border border-secondary/20 bg-transparent px-6 py-3 font-label text-xs font-bold uppercase tracking-widest text-secondary transition-all hover:border-secondary hover:bg-secondary/5"
                >
                  Change Password
                </Button>
              </div>
            </div>

            {/* Display Preferences */}
            <div className="ghost-border rounded-xl bg-surface-container-low p-8 md:col-span-12">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <MonitorSmartphone className="h-5 w-5 text-cyan-400" />
                </div>
                <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-on-surface">Display Preferences</h2>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-lowest border border-white/5">
                <div className="space-y-1">
                  <Label className="font-label text-sm font-bold text-on-surface">Hide Sidebar</Label>
                  <p className="text-xs text-on-surface-variant">Switch to a minimal icon-based top navigation. Perfect for more focus.</p>
                </div>
                <Button 
                  type="button" 
                  onClick={toggleHideSidebar}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${hideSidebar ? 'bg-cyan-400' : 'bg-surface-container-highest'}`}
                >
                  <span className={`${hideSidebar ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                </Button>
              </div>
            </div>

            <div className="ghost-border rounded-xl bg-surface-container p-8 md:col-span-12">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-headline text-2xl font-bold">Session Integrity</h2>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                    Last Login
                  </span>
                  <div className="flex items-center gap-2 text-on-surface">
                    <History className="h-4 w-4 text-tertiary" />
                    <p className="font-mono text-[10px] leading-tight">
                      2024.05.22
                      <br />
                      14:32:01 GMT
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                    Active Units
                  </span>
                  <div className="flex items-center gap-2 text-on-surface">
                    <MonitorSmartphone className="h-4 w-4 text-primary" />
                    <p className="font-headline text-sm font-bold uppercase">2 Systems</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                    2FA Protocol
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserRoundCheck className="h-4 w-4 text-primary" />
                      <p className="text-sm font-bold uppercase text-primary">Active</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Global Terminal Security: Optimal
                </p>
                <Button
                  type="button"
                  onClick={handleToggleLog}
                  className="text-[10px] font-bold uppercase tracking-tighter text-primary hover:text-primary-container"
                >
                  {isLogOpen ? "Hide Log History <" : "View Log History >"}
                </Button>
              </div>

              {isLogOpen ? (
                <div className="mt-4 rounded-md border border-white/5 bg-surface-container-lowest/70 p-3 text-[10px] uppercase tracking-wider text-on-surface-variant">
                  14:32:01 GMT - secure login accepted | 14:40:12 GMT - password policy sync |
                  15:04:51 GMT - session token renewed
                </div>
              ) : null}
            </div>
          </div>

          <section className="mt-12 border-t border-white/5 pt-12">
            <div className="ghost-border flex flex-col items-center justify-between gap-6 rounded-xl bg-error-container/10 p-8 md:flex-row">
              <div>
                <h3 className="font-headline text-xl font-bold text-error">Deactivate Terminal</h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Permanently remove your access and clear all tactical data from Zenith servers.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleTerminateAccount}
                className="rounded-md border border-error/20 bg-error/10 px-6 py-3 font-label text-xs font-black uppercase tracking-widest text-error transition-all hover:bg-error/20"
              >
                {isDeactivated ? "Reactivate Account" : "Terminate Account"}
              </Button>
            </div>
          </section>
        </div>
      </main>

      <PickerSheet
        open={isGamePickerOpen}
        onOpenChange={setIsGamePickerOpen}
        title="Add Supported Game"
        zIndexClassName="z-[60]"
        panelClassName="h-full w-full max-w-md border-l border-white/10 bg-surface-container px-6 py-8 shadow-2xl"
      >
        {availableGames.length > 0 ? (
          <>
            <div className="mb-6 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                Choose Game
              </p>
              <div className="grid grid-cols-1 gap-2">
                {availableGames.map((game) => (
                  <Button
                    key={game}
                    type="button"
                    onClick={() => handleGameSelectionChange(game)}
                    className={`rounded-md border px-3 py-2 text-left text-xs font-bold uppercase tracking-wider transition-all ${
                      gameToAdd === game
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-white/10 bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {game}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-8 space-y-2">
              <Label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Choose Rank
              </Label>
              <Select
                className="h-10 w-full cursor-pointer rounded border border-primary/30 bg-primary/20 px-3 py-0 text-xs font-black uppercase tracking-tighter text-primary"
                value={rankToAdd}
                onChange={(event) => setRankToAdd(event.target.value)}
              >
                {(gameRanks[gameToAdd] ?? []).map((rank) => (
                  <option key={`${gameToAdd}-${rank}`} className="bg-background text-on-surface">
                    {rank}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={() => setIsGamePickerOpen(false)}
                className="w-full rounded-md border border-white/10 bg-surface-container-low px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddGameFromPicker}
                className="primary-gradient w-full rounded-md px-4 py-3 text-xs font-black uppercase tracking-widest text-on-primary-fixed"
              >
                Add Game
              </Button>
            </div>
          </>
        ) : (
          <div className="ghost-border rounded-lg bg-surface-container-low p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            No more supported games available to add.
          </div>
        )}
      </PickerSheet>

      <PickerSheet
        open={isLanguagePickerOpen}
        onOpenChange={setIsLanguagePickerOpen}
        title="Add Language"
        zIndexClassName="z-[65]"
      >
        {availableLanguages.length > 0 ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="mb-2 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                  Top 20 Used Languages
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {availableLanguages.map((language) => (
                    <Button
                      key={language}
                      type="button"
                      onClick={() => setLanguageToAdd(language)}
                      className={`rounded-md border px-3 py-2 text-left text-xs font-bold uppercase tracking-wider transition-all ${
                        languageToAdd === language
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-white/10 bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {language}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
              <Button
                type="button"
                onClick={() => setIsLanguagePickerOpen(false)}
                className="w-full rounded-md border border-white/10 bg-surface-container-low px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddLanguageFromPicker}
                className="primary-gradient w-full rounded-md px-4 py-3 text-xs font-black uppercase tracking-widest text-on-primary-fixed"
              >
                Add Language
              </Button>
            </div>
          </>
        ) : (
          <div className="ghost-border rounded-lg bg-surface-container-low p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            All supported languages already added.
          </div>
        )}
      </PickerSheet>

      <PickerSheet
        open={isSocialPickerOpen}
        onOpenChange={setIsSocialPickerOpen}
        title="Link Platform"
        zIndexClassName="z-[66]"
      >
        {availableSocialPlatforms.length > 0 ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                  Supported Platforms
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {availableSocialPlatforms.map((platform) => (
                    <Button
                      key={platform}
                      type="button"
                      onClick={() => setSocialPlatformToAdd(platform)}
                      className={`rounded-md border px-3 py-2 text-left text-xs font-bold uppercase tracking-wider transition-all ${
                        socialPlatformToAdd === platform
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-white/10 bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {platform}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Profile Username / Link
                  </Label>
                  <Input
                    className="ghost-border w-full rounded-sm border-none bg-surface-container-lowest px-4 py-3 text-sm text-on-surface transition-all focus:ring-1 focus:ring-primary"
                    placeholder="example: @YourHandle or profile URL"
                    type="text"
                    value={socialUsernameToAdd}
                    onChange={(event) => setSocialUsernameToAdd(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
              <Button
                type="button"
                onClick={() => setIsSocialPickerOpen(false)}
                className="w-full rounded-md border border-white/10 bg-surface-container-low px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddSocialFromPicker}
                className="primary-gradient w-full rounded-md px-4 py-3 text-xs font-black uppercase tracking-widest text-on-primary-fixed"
              >
                Link Profile
              </Button>
            </div>
          </>
        ) : (
          <div className="ghost-border rounded-lg bg-surface-container-low p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            All supported platforms are already linked.
          </div>
        )}
      </PickerSheet>

      <PickerSheet
        open={isCountryPickerOpen}
        onOpenChange={setIsCountryPickerOpen}
        title="Country of Origin"
        zIndexClassName="z-[67]"
      >
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-2">
            {supportedCountries.map((country) => (
              <Button
                key={country}
                type="button"
                onClick={() => setCountryToSet(country)}
                className={`rounded-md border px-3 py-2 text-left text-xs font-bold uppercase tracking-wider transition-all ${
                  countryToSet === country
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/10 bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {country}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
          <Button
            type="button"
            onClick={() => setIsCountryPickerOpen(false)}
            className="w-full rounded-md border border-white/10 bg-surface-container-low px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSetCountryFromPicker}
            className="primary-gradient w-full rounded-md px-4 py-3 text-xs font-black uppercase tracking-widest text-on-primary-fixed"
          >
            Set Country
          </Button>
        </div>
      </PickerSheet>
      <Dialog open={!!openDialog} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[425px] border-white/10 bg-[#0c0e14] text-white shadow-[0_0_50px_rgba(34,211,238,0.15)]">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl font-bold uppercase tracking-widest text-primary">Edit {openDialog?.replace(/([A-Z])/g, ' $1')}</DialogTitle>
            <DialogDescription className="text-on-surface-variant">
              {openDialog === 'bio' ? `Max 200 characters. Current: ${tempValue.length}/200` : 
               openDialog === 'username' || openDialog === 'alias' ? 'Max 25 characters.' : 'Update your profile information below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            {openDialog === 'bio' ? (
              <Textarea 
                value={tempValue} 
                onChange={(e) => setTempValue(e.target.value.slice(0, 200))}
                className="ghost-border min-h-[120px] w-full resize-none rounded-lg border-none bg-surface-container-highest px-4 py-3 text-on-surface focus:ring-1 focus:ring-primary"
                placeholder="Write your bio..."
              />
            ) : openDialog === 'primaryGame' ? (
              <div className="space-y-3">
                {activeGames.length > 0 ? (
                  <>
                    <Select
                      className="ghost-border h-12 w-full cursor-pointer rounded-lg border-none bg-surface-container-highest px-4 text-sm font-bold text-on-surface focus:ring-1 focus:ring-primary"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                    >
                      <option value="" disabled>Select from your expertise</option>
                      {Array.from(new Set(activeGames.map(g => g.name))).map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </Select>
                    <p className="text-[10px] text-on-surface-variant italic">
                      Only games currently in your "Service Expertise" section can be set as primary.
                    </p>
                  </>
                ) : (
                  <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-error text-[10px] font-bold uppercase tracking-wider text-center">
                    You must add at least one game to your expertise first.
                  </div>
                )}
              </div>
            ) : openDialog === 'email' ? (
               <Input 
                type="email"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="ghost-border h-12 w-full rounded-lg border-none bg-surface-container-highest px-4 text-on-surface focus:ring-1 focus:ring-primary"
              />
            ) : openDialog === 'hourlyRate' ? (
               <Input 
                type="number"
                step="0.01"
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
               {isSaving ? "Saving..." : "Save Change"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


