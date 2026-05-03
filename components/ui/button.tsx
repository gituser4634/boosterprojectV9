import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "primary-gradient border border-primary/40 text-on-primary-fixed shadow-[0_8px_30px_-10px_rgba(20,214,255,0.6)] hover:brightness-105",
        secondary:
          "border border-secondary/40 bg-secondary/10 text-secondary hover:bg-secondary/20",
        tertiary:
          "border border-tertiary/40 bg-tertiary/10 text-tertiary hover:bg-tertiary/20",
        outline:
          "border border-outline/30 bg-surface-container-high/70 text-on-surface hover:border-primary/45 hover:text-primary",
        ghost: "text-on-surface-variant hover:bg-surface-variant/60 hover:text-on-surface",
        tab: "text-on-surface-variant data-[state=active]:primary-gradient data-[state=active]:text-on-primary-fixed",
        menu:
          "w-full justify-start rounded-md px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:bg-white/10 hover:text-on-surface",
        menuDanger:
          "w-full justify-start rounded-md px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 hover:text-red-300",
      },
      size: {
        sm: "h-9 px-4 py-2",
        md: "h-10 px-5 py-2.5",
        lg: "h-12 px-8 py-3",
        icon: "h-10 w-10 p-0",
      },
      glow: {
        none: "",
        cyan: "flame-button",
        violet: "flame-button-violet",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "md",
      glow: "none",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, glow, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, glow, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
