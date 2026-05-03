"use client";

import { Switch } from "@/components/ui/switch";

type OnlineStatusSwitchProps = {
  isOnline: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
};

function OnlineStatusSwitch({ isOnline, onCheckedChange, className }: OnlineStatusSwitchProps) {
  return (
    <div className={className ?? "mb-3 flex items-center justify-between rounded-md border border-white/10 bg-surface-container-high/60 px-2.5 py-2"}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-400" : "bg-slate-500"}`}></span>
        <span className="text-[11px] font-semibold text-on-surface-variant">{isOnline ? "Online" : "Offline"}</span>
      </div>
      <Switch checked={isOnline} onCheckedChange={onCheckedChange} aria-label="Toggle online status" />
    </div>
  );
}

export { OnlineStatusSwitch };
