"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { sanitizeMediaUrl } from "@/lib/supabase";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallbackText?: string;
}

export function Avatar({
  src,
  alt = "Member avatar",
  fallbackText = "WL",
  className,
  children,
  ...props
}: AvatarProps) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const safeSrc = sanitizeMediaUrl(src);

  React.useEffect(() => {
    setImgFailed(false);
  }, [safeSrc]);

  if (children) {
    return (
      <div
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/90 bg-gradient-to-br from-[#D8E8E4] via-[#B8D8BA] to-[#8FB9C4] shadow-sm",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/90 bg-gradient-to-br from-[#D8E8E4] via-[#B8D8BA] to-[#8FB9C4] font-mono text-xs font-semibold text-[#1B2A2E] shadow-sm",
        className
      )}
      {...props}
    >
      {safeSrc && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={safeSrc}
          alt={alt}
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{fallbackText.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}

export function AvatarImage({
  src,
  alt = "",
  className,
}: {
  src?: string;
  alt?: string;
  className?: string;
}) {
  const safeSrc = sanitizeMediaUrl(src);
  if (!safeSrc) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={safeSrc}
      alt={alt}
      className={cn("aspect-square h-full w-full object-cover", className)}
    />
  );
}

export function AvatarFallback({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-full w-full items-center justify-center font-mono text-xs font-semibold text-[#1B2A2E]",
        className
      )}
    >
      {children}
    </span>
  );
}
