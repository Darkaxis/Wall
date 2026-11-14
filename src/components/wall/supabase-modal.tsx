"use client";

import * as React from "react";
import { Check, Copy, Database, ExternalLink, Unplug } from "lucide-react";
import { ModalDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getSupabaseConfig,
  saveRuntimeSupabaseConfig,
} from "@/lib/supabase";

interface SupabaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataSource: "supabase" | "local";
  lastError?: string | null;
  onConfigUpdated: () => Promise<void>;
}

const POSTS_SQL_SNIPPET = `create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  body text check (char_length(body) <= 280),
  author_name text default 'Sora Takahashi',
  message text check (char_length(message) <= 280),
  photo_url text,
  photo_caption text,
  photo_filter text default 'none',
  author_avatar_url text,
  author_handle text,
  author_bio text,
  author_location text,
  author_mood text,
  created_at timestamptz default now()
);

alter table public.posts enable row level security;
create policy "Public read posts" on public.posts for select using (true);
create policy "Public insert posts" on public.posts for insert with check (true);
create policy "Public update posts" on public.posts for update using (true);
alter publication supabase_realtime add table public.posts;`;

export function SupabaseModal({
  open,
  onOpenChange,
  dataSource,
  lastError,
  onConfigUpdated,
}: SupabaseModalProps) {
  const [url, setUrl] = React.useState("");
  const [anonKey, setAnonKey] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const cfg = getSupabaseConfig();
      setUrl(cfg?.url || "");
      setAnonKey(cfg?.anonKey || "");
    }
  }, [open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      saveRuntimeSupabaseConfig(null);
    } else {
      saveRuntimeSupabaseConfig({
        url: url.trim(),
        anonKey: anonKey.trim(),
      });
    }
    await onConfigUpdated();
    onOpenChange(false);
  };

  const handleDisconnect = async () => {
    saveRuntimeSupabaseConfig(null);
    setUrl("");
    setAnonKey("");
    await onConfigUpdated();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(POSTS_SQL_SNIPPET);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Supabase Backend // Database Terminal"
      subtitle="TABLE: PUBLIC.POSTS // REALTIME_CHANNEL: WALL-LIVE-FEED"
      className="max-w-xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/80 bg-white/70 p-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[#528899]" />
            <span className="font-mono text-xs font-semibold text-[#1B2A2E]">
              BACKEND MODE:
            </span>
            {dataSource === "supabase" ? (
              <Badge variant="sage">CONNECTED // SUPABASE LIVE</Badge>
            ) : (
              <Badge variant="amber">HYBRID // LOCAL + REALTIME SYNC</Badge>
            )}
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            schema: supabase/schema.sql
          </span>
        </div>

        {lastError && (
          <div className="rounded-xl border border-[#DF6D3B]/40 bg-[#DF6D3B]/10 p-2.5 font-mono text-[11px] text-[#9e3e14]">
            SUPABASE NOTICE: {lastError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="sb-url">
              NEXT_PUBLIC_SUPABASE_URL (or Runtime Project URL)
            </Label>
            <Input
              id="sb-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="sb-key">
              NEXT_PUBLIC_SUPABASE_ANON_KEY (Public Anon Key)
            </Label>
            <Input
              id="sb-key"
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              className="font-mono text-[11px]"
            >
              <Unplug className="h-3.5 w-3.5" />
              Use Local Demo Store
            </Button>
            <Button type="submit" size="sm">
              Connect Supabase
            </Button>
          </div>
        </form>

        <div className="space-y-2 border-t border-[#528899]/15 pt-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#284750]">
              ONE SIMPLE &ldquo;POSTS&rdquo; TABLE SQL SCHEMA
            </span>
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/80 px-2.5 py-0.5 font-mono text-[10px] text-[#284750] hover:bg-white"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-[#6B8E7B]" />
                  COPIED SQL
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  COPY SQL
                </>
              )}
            </button>
          </div>
          <pre className="max-h-40 overflow-x-auto overflow-y-auto rounded-xl border border-white/80 bg-[#1B2A2E] p-3 font-mono text-[10px] leading-relaxed text-[#D8E8E4]">
            {POSTS_SQL_SNIPPET}
          </pre>
          <p className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <ExternalLink className="h-3 w-3 shrink-0" />
            Full SQL with storage bucket policies is saved in{" "}
            <code className="rounded bg-white/70 px-1 text-[#1B2A2E]">
              supabase/schema.sql
            </code>
          </p>
        </div>
      </div>
    </ModalDialog>
  );
}
