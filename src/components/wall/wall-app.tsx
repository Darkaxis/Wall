"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, Globe, RefreshCw, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ProfileCard } from "@/components/wall/profile-card";
import { PostComposer } from "@/components/wall/post-composer";
import { LiveFeed } from "@/components/wall/live-feed";
import type { PhotoFilterId } from "@/lib/softclub-art";
import {
  createWallPost,
  DEFAULT_USER_PROFILE,
  deleteWallPost,
  fetchWallPosts,
  getSupabaseClient,
  loadLocalProfile,
  normalizePostRow,
  type UserProfile,
  type WallPost,
} from "@/lib/supabase";

const BROADCAST_CHANNEL_NAME = "wall_softclub_live_channel_v1";

export function WallApp() {
  const [posts, setPosts] = React.useState<WallPost[]>([]);
  const [profile, setProfile] = React.useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [lastError, setLastError] = React.useState<string | null>(null);
  const [newlyArrivedIds, setNewlyArrivedIds] = React.useState<Set<string>>(
    () => new Set()
  );

  const broadcastRef = React.useRef<BroadcastChannel | null>(null);

  const markPostNewlyArrived = React.useCallback((id: string) => {
    setNewlyArrivedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    window.setTimeout(() => {
      setNewlyArrivedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 3200);
  }, []);

  const syncPosts = React.useCallback(
    async (showInitialLoader = false) => {
      if (showInitialLoader) setIsLoading(true);
      try {
        const result = await fetchWallPosts();
        setPosts((prev) => {
          const prevIds = new Set(prev.map((p) => p.id));
          result.posts.forEach((p) => {
            if (!prevIds.has(p.id) && !showInitialLoader) {
              markPostNewlyArrived(p.id);
            }
          });
          return result.posts;
        });
        if (result.error) {
          setLastError(result.error);
        } else {
          setLastError(null);
        }
      } finally {
        if (showInitialLoader) setIsLoading(false);
      }
    },
    [markPostNewlyArrived]
  );

  // Initial load of profile and posts
  React.useEffect(() => {
    setProfile(loadLocalProfile());
    void syncPosts(true);
  }, [syncPosts]);

  // Cross-tab BroadcastChannel + storage listener for instant live updates
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastRef.current = bc;
      bc.onmessage = (event) => {
        if (event.data?.type === "NEW_POST" && event.data?.post) {
          const incoming = event.data.post as WallPost;
          setPosts((prev) => {
            if (prev.some((p) => p.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
          markPostNewlyArrived(incoming.id);
        } else if (event.data?.type === "DELETE_POST" && event.data?.postId) {
          setPosts((prev) =>
            prev.filter((p) => p.id !== String(event.data.postId))
          );
        } else if (event.data?.type === "PROFILE_SYNC") {
          setProfile(loadLocalProfile());
          void syncPosts(false);
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "wall_softclub_posts_v1") {
        void syncPosts(false);
      } else if (e.key === "wall_softclub_profile_v1") {
        setProfile(loadLocalProfile());
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      broadcastRef.current?.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [markPostNewlyArrived, syncPosts]);

  // Supabase Realtime Subscription
  React.useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel("posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          if (payload.new) {
            const incoming = normalizePostRow(
              payload.new as Record<string, unknown>
            );
            setPosts((current) => {
              if (current.some((p) => p.id === incoming.id)) return current;
              return [incoming, ...current];
            });
            markPostNewlyArrived(incoming.id);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        () => {
          void syncPosts(false);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          const deletedId = (payload.old as Record<string, unknown> | null)?.id;
          if (deletedId) {
            setPosts((current) =>
              current.filter((p) => p.id !== String(deletedId))
            );
          } else {
            void syncPosts(false);
          }
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [markPostNewlyArrived, syncPosts]);

  // Automatic Live Feed Polling Interval
  React.useEffect(() => {
    const interval = window.setInterval(() => {
      void syncPosts(false);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [syncPosts]);

  const handlePublishPost = async (payload: {
    author_name: string;
    message: string;
    photo_url?: string | null;
    photo_caption?: string | null;
    photo_filter?: PhotoFilterId;
  }) => {
    const res = await createWallPost({
      author_name: payload.author_name,
      message: payload.message,
      photo_url: payload.photo_url,
      photo_caption: payload.photo_caption,
      photo_filter: payload.photo_filter,
      profile: {
        ...profile,
        author_name: payload.author_name,
      },
    });

    setPosts((prev) => {
      const filtered = prev.filter((p) => p.id !== res.post.id);
      return [res.post, ...filtered];
    });
    markPostNewlyArrived(res.post.id);
    if (res.error) setLastError(res.error);

    broadcastRef.current?.postMessage({
      type: "NEW_POST",
      post: res.post,
    });

    return res.error ? { error: res.error } : {};
  };

  const handleDeletePost = async (postId: string) => {
    const res = await deleteWallPost(postId);
    if (!res.deleted) {
      if (res.error) setLastError(res.error);
      return;
    }

    setLastError(null);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    broadcastRef.current?.postMessage({
      type: "DELETE_POST",
      postId,
    });
  };

  const myPostCount = posts.filter(
    (p) => p.author_name.toLowerCase() === profile.author_name.toLowerCase()
  ).length;
  const totalPhotoCount = posts.filter((p) => Boolean(p.photo_url)).length;

  return (
    <div className="min-h-screen pb-16">
      {/* Top Soft Club Header */}
      <header className="sticky top-0 z-30 border-b border-white/80 bg-[#EFF4F3]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-white bg-gradient-to-br from-[#528899] via-[#6B8E7B] to-[#9BC4C0] text-white shadow-[0_6px_16px_-4px_rgba(82,136,153,0.45)]">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#1B2A2E]">
                wall
              </h1>
              <p className="text-[11px] text-[#4A6B74]">
                {profile.author_name}&apos;s Wall
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden rounded-full border border-white/85 bg-white/65 px-3 py-1 text-xs font-medium text-[#284750] sm:block">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </div>

            <Link
              href="/profile"
              title="Edit profile"
              className="flex items-center gap-2 rounded-full border border-white/85 bg-white/70 py-1 pl-1 pr-3 transition-colors hover:bg-white"
            >
              <Avatar
                src={profile.author_avatar_url}
                alt={profile.author_name}
                fallbackText={profile.author_name}
                className="h-6 w-6"
              />
              <span className="max-w-[120px] truncate text-xs font-medium text-[#1B2A2E]">
                {profile.author_name}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-5xl px-3 pt-5 sm:px-6 sm:pt-6">
        {lastError && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#DF6D3B]/40 bg-[#DF6D3B]/10 px-4 py-2.5 text-xs text-[#9c3e14] animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#DF6D3B]" />
              <span>Connection issue: {lastError}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void syncPosts(true)}
                className="inline-flex items-center gap-1 rounded-full bg-white/75 px-2.5 py-1 text-[11px] font-medium text-[#1B2A2E] transition-colors hover:bg-white"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
              <button
                type="button"
                onClick={() => setLastError(null)}
                aria-label="Dismiss alert"
                className="rounded-full p-1 hover:bg-white/60"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Responsive 2-Column Wall Layout (Feed first on mobile, Sidebar left on desktop) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          {/* Left Sidebar: Profile Card */}
          <div className="order-2 lg:order-1 lg:col-span-4">
            <ProfileCard
              profile={profile}
              postCount={myPostCount}
              photoCount={totalPhotoCount}
            />
          </div>

          {/* Right Column: Post Composer + Live Feed */}
          <div className="order-1 space-y-5 lg:order-2 lg:col-span-8">
            <PostComposer
              profile={profile}
              onPublishPost={handlePublishPost}
            />

            {isLoading ? (
              <div className="space-y-3.5">
                {[0, 1, 2].map((idx) => (
                  <Card
                    key={idx}
                    className="border-white/90 bg-white/75 p-4 sm:p-5"
                  >
                    <div className="animate-pulse flex items-start gap-3.5">
                      <div className="h-11 w-11 shrink-0 rounded-full bg-[#D8E8E4]" />
                      <div className="flex-1 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="h-3.5 w-32 rounded-full bg-[#D8E8E4]" />
                          <div className="h-3 w-16 rounded-full bg-[#E4EFECE6]" />
                        </div>
                        <div className="h-3.5 w-full rounded-full bg-[#E4EFECE6]" />
                        <div className="h-3.5 w-3/4 rounded-full bg-[#E4EFECE6]" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <LiveFeed
                posts={posts}
                onManualRefresh={() => syncPosts(false)}
                onDeletePost={handleDeletePost}
                newlyArrivedIds={newlyArrivedIds}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
