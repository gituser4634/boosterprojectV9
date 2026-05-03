"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

type PickerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  zIndexClassName: string;
  children: React.ReactNode;
  panelClassName?: string;
};

function PickerSheet({
  open,
  onOpenChange,
  title,
  zIndexClassName,
  children,
  panelClassName = "flex h-full w-full max-w-md flex-col border-l border-white/10 bg-surface-container px-6 py-8 shadow-2xl",
}: PickerSheetProps) {
  return (
    <div className={`fixed inset-0 ${zIndexClassName} ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onOpenChange(false)}
        aria-label={`Close ${title.toLowerCase()} overlay`}
        className={`absolute inset-0 h-auto w-auto cursor-default rounded-none bg-black/60 p-0 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      ></Button>

      <aside
        className={`absolute right-0 top-0 transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        } ${panelClassName}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-headline text-2xl font-bold text-on-surface">{title}</h3>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-white/10 p-1 text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {children}
      </aside>
    </div>
  );
}

export { PickerSheet };
