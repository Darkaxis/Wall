"use client";

import * as React from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  AlertCircle,
  Globe,
  Loader2,
  LogIn,
  LogOut,
  UserPlus,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthModal } from "@/components/wall/auth-modal";
import { ProfileCard } from "@/components/wall/profile-card";
import { PostComposer } from "@/components/wall/post-composer";
import { LiveFeed } from "@/components/wall/live-feed";
import type { PhotoFilterId } from "@/lib/softclub-art";
import {
  createWallPost,
  DEFAULT_USER_PROFILE,
  fetchWallPosts,
  getSupabaseClient,
  loadLocalProfile,
  normalizePostRow,
  profileFromSupabaseUser,
  saveLocalProfile,
  signOutUser,
  type UserProfile,
  type WallPost,
} from "@/lib/supabase";

const BROADCAST_CHANNEL_NAME = "wall_softclub_live_channel_v1";

export function WallApp() {
  const [posts, setPosts] = React.useState<WallPost[]>([]);
  const [authUser, setAuthUser] = React.useState<User | null>(null);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [authModalMode, setAuthModalMode] = React.useState<"signin" | "signup">(
    "signin"
  );

  const [profile, setProfile] = React.useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [lastError, setLastError] = React.useState<string | null>(null);
  const [isLiveAutoRefresh, setIsLiveAutoRefresh] = React.useState(true);
  const [newlyArrivedIds, setNewlyArrivedIds] = React.useState<Set<string>>(
    () => new Set()
  );

  const broadcastRef = React.useRef<BroadcastChannel | null>(null);

  const openAuthModal = (mode: "signin" | "signup") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

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

  // Check Supabase Auth session & listen for login/logout changes
  React.useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setProfile(loadLocalProfile());
      setAuthChecked(true);
      return;
    }

    let mounted = true;
    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const user = data.session?.user ?? null;
      setAuthUser(user);
      if (user) {
        const userProfile = profileFromSupabaseUser(user);
        setProfile(userProfile);
        saveLocalProfile(userProfile);
      } else {
        setProfile(loadLocalProfile());
      }
      setAuthChecked(true);
    });

    const { data: listener } = client.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;
        setAuthUser(user);
        if (user) {
          const userProfile = profileFromSupabaseUser(user);
          setProfile(userProfile);
          saveLocalProfile(userProfile);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Initial load of posts
  React.useEffect(() => {
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
        } else if (event.data?.type === "PROFILE_SYNC") {
          void syncPosts(false);
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "wall_softclub_posts_v1") {
        void syncPosts(false);
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
    if (!isLiveAutoRefresh) return;
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
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [isLiveAutoRefresh, markPostNewlyArrived, syncPosts]);

  // Automatic Live Feed Polling Interval
  React.useEffect(() => {
    if (!isLiveAutoRefresh) return;
    const interval = window.setInterval(() => {
      void syncPosts(false);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [isLiveAutoRefresh, syncPosts]);

  const handleSaveProfile = async (updated: UserProfile) => {
    const prevName = profile.author_name;
    setProfile(updated);
    await syncAuthorProfileOnPosts(prevName, updated, authUser?.id);
    await syncPosts(false);
    broadcastRef.current?.postMessage({ type: "PROFILE_SYNC" });
  };

  const handleUpdateAuthorNameInline = (newName: string) => {
    const updated = { ...profile, author_name: newName };
    setProfile(updated);
    saveLocalProfile(updated);
  };

  const handlePublishPost = async (payload: {
    author_name: string;
    message: string;
    photo_url?: string | null;
    photo_caption?: string | null;
    photo_filter?: PhotoFilterId;
  }) => {
    const res = await createWallPost({
      user_id: authUser?.id || null,
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
  };

  const handleSignOut = async () => {
    await signOutUser();
    setAuthUser(null);
  };

  const myPostCount = posts.filter((p) =>
    authUser && p.user_id
      ? p.user_id === authUser.id
      : p.author_name.toLowerCase() === profile.author_name.toLowerCase()
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
                {authUser ? `${profile.author_name}'s Wall` : "Community Wall"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden rounded-full border border-white/85 bg-white/65 px-3 py-1 text-xs font-medium text-[#284750] sm:block">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </div>

            {authChecked &&
              (authUser ? (
                <div className="flex items-center gap-2">
                  <div className="hidden items-center gap-2 rounded-full border border-white/85 bg-white/70 py-1 pl-1 pr-3 sm:flex">
                    <Avatar
                      src={profile.author_avatar_url}
                      alt={profile.author_name}
                      fallbackText={profile.author_name}
                      className="h-6 w-6"
                    />
                    <span className="max-w-[120px] truncate text-xs font-medium text-[#1B2A2E]">
                      {profile.author_name}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign out</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openAuthModal("signin")}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign in</span>
                  </Button>
                  <Button
                    type="button"
                    variant="amber"
                    size="sm"
                    onClick={() => openAuthModal("signup")}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Sign up</span>
                  </Button>
                </div>
              ))}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        {lastError && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[#DF6D3B]/40 bg-[#DF6D3B]/10 px-4 py-2.5 text-xs text-[#9c3e14]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#DF6D3B]" />
            <span>Could not reach server: {lastError}</span>
          </div>
        )}

        {/* 2-Column Wall Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Sidebar: Member Profile or Sign In Card */}
          <div className="lg:col-span-4">
            {authUser ? (
              <ProfileCard
                profile={profile}
                onSaveProfile={handleSaveProfile}
                postCount={myPostCount}
                photoCount={totalPhotoCount}
              />
            ) : (
              <Card className="overflow-hidden border-white/90 bg-gradient-to-b from-white/85 via-[#EFF4F3]/85 to-[#DFECE9]/80">
                <div className="h-2 w-full bg-gradient-to-r from-[#9BC4C0] via-[#D8E8E4] to-[#E8B496]" />
                <CardContent className="space-y-4 p-5">
                  <div className="space-y-1.5">
                    <h2 className="text-base font-semibold text-[#1B2A2E]">
                      Join the Wall
                    </h2>
                    <p className="text-xs leading-relaxed text-[#36535B]">
                      Sign in or create an account to share messages, upload
                      photos, and customize your profile picture and bio.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="amber"
                      onClick={() => openAuthModal("signin")}
                      className="w-full gap-2"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign in
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openAuthModal("signup")}
                      className="w-full gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Create an account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Post Composer (when signed in) + Live Feed */}
          <div className="space-y-5 lg:col-span-8">
            {authUser ? (
              <PostComposer
                profile={profile}
                onUpdateAuthorName={handleUpdateAuthorNameInline}
                onPublishPost={handlePublishPost}
              />
            ) : (
              <Card className="flex flex-col items-start justify-between gap-4 border-white/90 bg-white/75 p-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-sm font-semibold text-[#1B2A2E]">
                    Sign in to write on the Wall
                  </h2>
                  <p className="mt-0.5 text-xs text-[#4A6B74]">
                    Share notes up to 280 characters and post photos with the
                    community.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openAuthModal("signin")}
                  >
                    Sign in
                  </Button>
                  <Button
                    type="button"
                    variant="amber"
                    size="sm"
                    onClick={() => openAuthModal("signup")}
                  >
                    Sign up
                  </Button>
                </div>
              </Card>
            )}

            {isLoading ? (
              <Card className="flex items-center justify-center gap-2.5 border-white/90 bg-white/70 p-10 text-sm text-[#355A64]">
                <Loader2 className="h-4 w-4 animate-spin text-[#528899]" />
                <span>Loading Wall...</span>
              </Card>
            ) : (
              <LiveFeed
                posts={posts}
                currentAuthorName={profile.author_name}
                isLiveAutoRefresh={isLiveAutoRefresh}
                onToggleAutoRefresh={() =>
                  setIsLiveAutoRefresh((prev) => !prev)
                }
                onManualRefresh={() => syncPosts(false)}
                newlyArrivedIds={newlyArrivedIds}
              />
            )}
          </div>
        </div>
      </main>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        initialMode={authModalMode}
      />
    </div>
  );
}
