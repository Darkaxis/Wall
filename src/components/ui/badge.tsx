import * as React from "react";
import { cn } from "@/lib/utils";

export type SoftBadgeTone =
  | "default"
  | "secondary"
  | "outline"
  | "amber"
  | "sage"
  | "glacier";

const TONE_CLASSES: Record<SoftBadgeTone, string> = {
  default: "border-primary/25 bg-primary/15 text-primary",
  secondary: "border-white/75 bg-secondary/85 text-secondary-foreground",
  outline: "border-border/80 bg-white/60 text-foreground",
  amber: "border-[#DF6D3B]/35 bg-[#DF6D3B]/15 text-[#b54d20]",
  sage: "border-[#6B8E7B]/35 bg-[#6B8E7B]/15 text-[#365745]",
  glacier: "border-[#528899]/35 bg-[#528899]/15 text-[#275563]",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: SoftBadgeTone;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-widest transition-colors",
        TONE_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}
