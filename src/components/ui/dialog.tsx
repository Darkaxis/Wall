"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function ModalDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  className,
}: ModalDialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#1B2A2E]/35 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/90 bg-[#EFF4F3]/95 p-6 text-foreground shadow-[0_24px_60px_-15px_rgba(27,42,46,0.28),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl animate-slide-in-top",
          className
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-[#528899]/15 pb-3">
          <div>
            {title && (
              <h2 className="text-base font-semibold tracking-tight text-[#1B2A2E]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-white/70 text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
