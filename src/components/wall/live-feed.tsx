"use client";

import * as React from "react";
import {
  Camera,
  Clock,
  Disc3,
  Loader2,
  MapPin,
  Maximize2,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { ModalDialog } from "@/components/ui/dialog";
import { PHOTO_FILTERS } from "@/lib/softclub-art";
import type { WallPost } from "@/lib/supabase";

interface LiveFeedProps {
  posts: WallPost[];
  onManualRefresh: () => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  newlyArrivedIds: Set<string>;
}

type FeedFilter = "all" | "photos";

function formatRelativeTime(isoString: string, nowTick: number): string {
  const date = new Date(isoString);
  const diffSec = Math.max(0, Math.floor((nowTick - date.getTime()) / 1000));
  if (diffSec < 12) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function formatClockTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function LiveFeed({
  posts,
  onManualRefresh,
  onDeletePost,
  newlyArrivedIds,
}: LiveFeedProps) {
  const [filter, setFilter] = React.useState<FeedFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [lightboxPost, setLightboxPost] = React.useState<WallPost | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [nowTick, setNowTick] = React.useState<number>(() => Date.now());

  // Tick every 5 seconds so relative timestamps stay current without reloading
  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const handleManualSync = async () => {
    setIsRefreshing(true);
    try {
      await onManualRefresh();
    } finally {
      window.setTimeout(() => setIsRefreshing(false), 350);
    }
  };

  const handleDelete = async (postId: string) => {
    setDeletingId(postId);
    try {
      await onDeletePost(postId);
    } finally {
      setDeletingId((current) => (current === postId ? null : current));
    }
  };

  // Newest messages always appear at the top
  const sortedPosts = React.useMemo(() => {
    return [...posts].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [posts]);

  const filteredPosts = React.useMemo(() => {
    return sortedPosts.filter((post) => {
      if (filter === "photos" && !post.photo_url) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAuthor = post.author_name.toLowerCase().includes(q);
        const matchMsg = (post.body || post.message).toLowerCase().includes(q);
        const matchLoc = (post.author_location || "").toLowerCase().includes(q);
        return matchAuthor || matchMsg || matchLoc;
      }
      return true;
    });
  }, [sortedPosts, filter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Feed Filter & Refresh Controls */}
      <Card className="border-white/90 bg-white/75 p-3.5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-white/80 bg-[#E4EFECE6] p-1 sm:rounded-full">
              {(
                [
                  { id: "all", label: `All (${sortedPosts.length})` },
                  {
                    id: "photos",
                    label: `Photos (${
                      sortedPosts.filter((p) => Boolean(p.photo_url)).length
                    })`,
                  },
                ] as { id: FeedFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    filter === tab.id
                      ? "bg-white text-[#1B2A2E] shadow-sm"
                      : "text-[#3B5B63] hover:text-[#1B2A2E]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleManualSync}
              className="h-8 w-8"
              title="Refresh feed"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#528899] ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="h-8 rounded-full pl-9 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Posts Feed List (Newest at the Top) */}
      {filteredPosts.length === 0 ? (
        <Card className="border-dashed border-[#528899]/30 bg-white/60 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {sortedPosts.length === 0
              ? "Nothing on the Wall yet. Write a message above and click Share!"
              : "No posts match your search."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {filteredPosts.map((post) => {
            const isNewlyArrived = newlyArrivedIds.has(post.id);
            const filterClass =
              PHOTO_FILTERS.find((f) => f.id === post.photo_filter)?.cssClass ||
              "";

            return (
              <Card
                key={post.id}
                className={`group relative overflow-hidden transition-all duration-300 hover:border-white hover:shadow-[0_14px_34px_-10px_rgba(38,68,77,0.15)] ${
                  isNewlyArrived
                    ? "animate-slide-in-top ring-2 ring-[#DF6D3B]/45"
                    : ""
                }`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3.5">
                    <Avatar
                      src={post.author_avatar_url}
                      alt={post.author_name}
                      fallbackText={post.author_name}
                      className="h-11 w-11 shrink-0 border-2 border-white"
                    />

                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Author & Timestamp Header */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold tracking-tight text-[#1B2A2E]">
                            {post.author_name}
                          </span>
                          {post.author_handle && (
                            <span className="text-xs text-[#528899]">
                              {post.author_handle}
                            </span>
                          )}
                          {post.author_location && (
                            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
                              <MapPin className="h-3 w-3 text-[#6B8E7B]" />
                              {post.author_location}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span
                            className="inline-flex items-center gap-1 font-medium text-[#2A4A53]"
                            title={new Date(post.created_at).toLocaleString()}
                          >
                            <Clock className="h-3 w-3 text-[#528899]" />
                            {formatRelativeTime(post.created_at, nowTick)}
                          </span>
                          <span className="hidden opacity-65 sm:inline">
                            · {formatClockTime(post.created_at)}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleDelete(post.id)}
                            disabled={deletingId === post.id}
                            aria-label="Delete post"
                            title="Delete post"
                            className="ml-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-[#DF6D3B]/12 hover:text-[#DF6D3B] focus:opacity-100 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            {deletingId === post.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Message Text (max 280 chars) */}
                      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[#1B2A2E]">
                        {post.body || post.message}
                      </p>

                      {/* Optional Uploaded Photo */}
                      {post.photo_url && (
                        <div className="pt-1">
                          <div
                            onClick={() => setLightboxPost(post)}
                            className="group/photo relative cursor-pointer overflow-hidden rounded-2xl border border-white/90 bg-[#D8E8E4] shadow-sm"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={post.photo_url}
                              alt={
                                post.photo_caption ||
                                `Photo shared by ${post.author_name}`
                              }
                              className={`max-h-80 w-full object-cover transition-transform duration-500 group-hover/photo:scale-[1.015] ${filterClass}`}
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1B2A2E]/35 via-transparent to-transparent opacity-70" />
                            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                              {post.photo_caption ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1B2A2E]/65 px-2.5 py-0.5 text-xs backdrop-blur-md">
                                  <Camera className="h-3 w-3 text-[#DF6D3B]" />
                                  {post.photo_caption}
                                </span>
                              ) : (
                                <span />
                              )}
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 backdrop-blur-md">
                                <Maximize2 className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Footer: Listening Status */}
                      {post.author_mood && (
                        <div className="inline-flex min-w-0 items-center gap-1.5 pt-1 text-xs text-[#456B75]">
                          <Disc3 className="h-3 w-3 shrink-0 text-[#DF6D3B]" />
                          <span className="max-w-[200px] truncate sm:max-w-[280px]">
                            {post.author_mood}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      <ModalDialog
        open={Boolean(lightboxPost)}
        onOpenChange={(open) => !open && setLightboxPost(null)}
        title={lightboxPost?.photo_caption || "Photo"}
        subtitle={
          lightboxPost ? `Shared by ${lightboxPost.author_name}` : undefined
        }
        className="max-w-2xl"
      >
        {lightboxPost?.photo_url && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-white bg-[#1B2A2E]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxPost.photo_url}
                alt={lightboxPost.photo_caption || "Post photo"}
                className="max-h-[65vh] w-full object-contain"
              />
            </div>
            <p className="text-sm text-[#1B2A2E]">
              {lightboxPost.body || lightboxPost.message}
            </p>
          </div>
        )}
      </ModalDialog>
    </div>
  );
}
