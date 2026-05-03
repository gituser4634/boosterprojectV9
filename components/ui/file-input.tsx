import * as React from "react";

import { cn } from "@/lib/utils";

const FileInput = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input">>(
  ({ className, type = "file", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-outline/25 bg-surface-container-high/80 px-3 py-2 text-sm text-on-surface ring-offset-background file:mr-3 file:rounded file:border-0 file:bg-primary/20 file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
FileInput.displayName = "FileInput";

export { FileInput };