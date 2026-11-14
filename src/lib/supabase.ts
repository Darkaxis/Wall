import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const MAX_POST_LENGTH = 280;

/**
 * Matches both `requirements.md` (`id`, `user_id`, `body`, `created_at`)
 * and extended Wall features (`author_name`, `message`, `photo_url`, profile fields).
 */
export interface WallPost {
  id: string;
  user_id?: string | null;
  body: string;
  message: string;
  author_name: string;
  created_at: string;
  photo_url?: string | null;
  photo_caption?: string | null;
  author_avatar_url?: string | null;
  author_handle?: string | null;
  author_bio?: string | null;
  author_location?: string | null;
  author_mood?: string | null;
}

export interface UserProfile {
  author_name: string;
  author_handle: string;
  author_avatar_url: string;
  author_bio: string;
  author_location: string;
  author_mood: string;
}

export interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
}

const STORAGE_KEYS = {
  POSTS: "wall_softclub_posts_v1",
  PROFILE: "wall_softclub_profile_v1",
  SUPABASE_CFG: "wall_softclub_supabase_cfg_v1",
  EXTRA_META: "wall_softclub_post_meta_v1",
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  author_name: "Guest",
  author_handle: "@guest",
  author_avatar_url: "",
  author_bio: "",
  author_location: "",
  author_mood: "",
};

const LEGACY_SEED_IDS = new Set([
  "sc-1999-001",
  "sc-1999-002",
  "sc-1999-003",
]);

const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const envSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

const hasValidEnvKeys =
  Boolean(envSupabaseUrl) &&
  Boolean(envSupabaseKey) &&
  !envSupabaseUrl.includes("your-project-id") &&
  !envSupabaseUrl.includes("your_project_url") &&
  !envSupabaseKey.includes("your-supabase-anon-key") &&
  !envSupabaseKey.includes("your_anon_key");

/**
 * Standard Supabase client export (matching `requirements.md` snippet)
 */
export const supabase: SupabaseClient | null = hasValidEnvKeys
  ? createClient(envSupabaseUrl, envSupabaseKey)
  : null;

let cachedClient: SupabaseClient | null = supabase;
let cachedKeySignature = hasValidEnvKeys
  ? `${envSupabaseUrl}::${envSupabaseKey}`
  : "";

export function getSupabaseConfig(): SupabaseRuntimeConfig | null {
  if (hasValidEnvKeys) {
    return { url: envSupabaseUrl, anonKey: envSupabaseKey };
  }

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.SUPABASE_CFG);
      if (raw) {
        const parsed = JSON.parse(raw) as SupabaseRuntimeConfig;
        if (parsed.url?.startsWith("http") && parsed.anonKey?.length > 10) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage parse error
    }
  }

  return null;
}

export function saveRuntimeSupabaseConfig(cfg: SupabaseRuntimeConfig | null) {
  if (typeof window === "undefined") return;
  if (!cfg || !cfg.url.trim() || !cfg.anonKey.trim()) {
    window.localStorage.removeItem(STORAGE_KEYS.SUPABASE_CFG);
    cachedClient = supabase;
    cachedKeySignature = "";
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEYS.SUPABASE_CFG,
    JSON.stringify({
      url: cfg.url.trim(),
      anonKey: cfg.anonKey.trim(),
    })
  );
  cachedClient = null;
  cachedKeySignature = "";
}

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  const sig = `${cfg.url}::${cfg.anonKey}`;
  if (cachedClient && cachedKeySignature === sig) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedKeySignature = sig;
    return cachedClient;
  } catch {
    return null;
  }
}

export function loadLocalProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_USER_PROFILE;
    return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveLocalProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export function loadLocalPosts(): WallPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WallPost[];
    if (!Array.isArray(parsed)) return [];
    const filtered = parsed.filter((p) => !LEGACY_SEED_IDS.has(p.id));
    if (filtered.length !== parsed.length) {
      window.localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(filtered));
    }
    return filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch {
    return [];
  }
}

export function saveLocalPosts(posts: WallPost[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  } catch {
    // Handle storage quota gracefully
  }
}

function getExtraMetaMap(): Record<string, Partial<WallPost>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.EXTRA_META);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExtraMeta(id: string, meta: Partial<WallPost>) {
  if (typeof window === "undefined") return;
  try {
    const map = getExtraMetaMap();
    map[id] = meta;
    window.localStorage.setItem(STORAGE_KEYS.EXTRA_META, JSON.stringify(map));
  } catch {
    // Ignore
  }
}

export function normalizePostRow(row: Record<string, unknown>): WallPost {
  const id = String(row.id || `sc-${Date.now()}`);
  const metaMap = getExtraMetaMap();
  const cached = metaMap[id] || {};
  const profileFallback = loadLocalProfile();

  const textContent = String(
    row.body ?? row.message ?? cached.body ?? cached.message ?? ""
  );

  return {
    id,
    user_id: (row.user_id as string) ?? null,
    body: textContent,
    message: textContent,
    author_name: String(
      row.author_name ||
        cached.author_name ||
        profileFallback.author_name ||
        "Guest"
    ),
    created_at: String(row.created_at || new Date().toISOString()),
    photo_url: (row.photo_url as string) ?? cached.photo_url ?? null,
    photo_caption: (row.photo_caption as string) ?? cached.photo_caption ?? null,
    author_avatar_url:
      (row.author_avatar_url as string) ??
      cached.author_avatar_url ??
      null,
    author_handle:
      (row.author_handle as string) ??
      cached.author_handle ??
      null,
    author_bio: (row.author_bio as string) ?? cached.author_bio ?? null,
    author_location:
      (row.author_location as string) ??
      cached.author_location ??
      null,
    author_mood: (row.author_mood as string) ?? cached.author_mood ?? null,
  };
}

/**
 * Compresses/resizes an uploaded image file client-side and uploads it to Supabase Storage
 * (`wall-media` bucket) when connected, with automatic DataURL fallback so images always work.
 */
export async function processAndUploadImage(
  file: File,
  folder: "posts" | "avatars" = "posts"
): Promise<string> {
  const maxDim = folder === "avatars" ? 320 : 960;
  const dataUrl = await resizeImageFileToDataUrl(file, maxDim);

  const client = getSupabaseClient();
  if (client) {
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const { error: uploadError } = await client.storage
        .from("wall-media")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (!uploadError) {
        const { data } = client.storage
          .from("wall-media")
          .getPublicUrl(fileName);
        if (data?.publicUrl) {
          return data.publicUrl;
        }
      }
    } catch {
      // Fallback to compressed DataURL if storage bucket isn't configured yet
    }
  }

  return dataUrl;
}

function resizeImageFileToDataUrl(
  file: File,
  maxDimension: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Fetches newest posts from the `posts` table in Supabase, ordered by `created_at` descending.
 * Falls back to local storage posts if Supabase is not configured or unreachable.
 */
export async function fetchWallPosts(): Promise<{
  posts: WallPost[];
  source: "supabase" | "local";
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { posts: loadLocalPosts(), source: "local" };
  }

  try {
    const { data, error } = await client
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return {
        posts: loadLocalPosts(),
        source: "local",
        error: error.message,
      };
    }

    const normalized: WallPost[] = (data || []).map((row) =>
      normalizePostRow(row as Record<string, unknown>)
    );

    return { posts: normalized, source: "supabase" };
  } catch (err) {
    return {
      posts: loadLocalPosts(),
      source: "local",
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

/**
 * Inserts a new post into the `posts` table (enforcing max 280 characters).
 * Supports both the full Soft Club schema and the minimal 4-column `requirements.md` schema (`body`).
 */
export async function createWallPost(input: {
  user_id?: string | null;
  author_name: string;
  message: string;
  photo_url?: string | null;
  photo_caption?: string | null;
  profile: UserProfile;
}): Promise<{ post: WallPost; source: "supabase" | "local"; error?: string }> {
  const cleanMessage = input.message.trim().slice(0, MAX_POST_LENGTH);
  const cleanAuthor =
    input.author_name.trim() || input.profile.author_name || "Guest";
  const nowIso = new Date().toISOString();

  const newPost: WallPost = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sc-${Date.now()}`,
    user_id: input.user_id || null,
    author_name: cleanAuthor,
    body: cleanMessage,
    message: cleanMessage,
    created_at: nowIso,
    photo_url: input.photo_url || null,
    photo_caption: input.photo_caption || null,
    author_avatar_url: input.profile.author_avatar_url,
    author_handle: input.profile.author_handle,
    author_bio: input.profile.author_bio,
    author_location: input.profile.author_location,
    author_mood: input.profile.author_mood,
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      // Attempt 1: Full schema insert (`user_id`, `body`, `message`, `author_name`, photos & profile info)
      const fullPayload = {
        user_id: newPost.user_id,
        body: newPost.body,
        message: newPost.message,
        author_name: newPost.author_name,
        created_at: newPost.created_at,
        photo_url: newPost.photo_url,
        photo_caption: newPost.photo_caption,
        author_avatar_url: newPost.author_avatar_url,
        author_handle: newPost.author_handle,
        author_bio: newPost.author_bio,
        author_location: newPost.author_location,
        author_mood: newPost.author_mood,
      };

      const { data, error } = await client
        .from("posts")
        .insert([fullPayload])
        .select()
        .single();

      if (!error && data) {
        const saved: WallPost = {
          ...newPost,
          id: String(data.id),
          created_at: String(data.created_at || newPost.created_at),
        };
        saveExtraMeta(saved.id, saved);
        return { post: saved, source: "supabase" };
      }

      // Attempt 2: Exact `requirements.md` minimal schema (`{ user_id, body }`)
      const { data: reqData, error: reqErr } = await client
        .from("posts")
        .insert([{ user_id: newPost.user_id, body: newPost.body }])
        .select()
        .single();

      if (!reqErr && reqData) {
        const saved: WallPost = {
          ...newPost,
          id: String(reqData.id),
          created_at: String(reqData.created_at || newPost.created_at),
        };
        saveExtraMeta(saved.id, saved);
        return { post: saved, source: "supabase" };
      }

      // Attempt 3: Alternative minimal schema (`{ author_name, message }`)
      const { data: altData, error: altErr } = await client
        .from("posts")
        .insert([
          {
            author_name: newPost.author_name,
            message: newPost.message,
          },
        ])
        .select()
        .single();

      if (!altErr && altData) {
        const saved: WallPost = {
          ...newPost,
          id: String(altData.id),
          created_at: String(altData.created_at || newPost.created_at),
        };
        saveExtraMeta(saved.id, saved);
        return { post: saved, source: "supabase" };
      }

      const current = loadLocalPosts();
      saveLocalPosts([newPost, ...current]);
      return {
        post: newPost,
        source: "local",
        error: reqErr?.message || error?.message,
      };
    } catch (err) {
      const current = loadLocalPosts();
      saveLocalPosts([newPost, ...current]);
      return {
        post: newPost,
        source: "local",
        error: err instanceof Error ? err.message : "Insert failed",
      };
    }
  }

  const current = loadLocalPosts();
  saveLocalPosts([newPost, ...current]);
  return { post: newPost, source: "local" };
}

/**
 * Updates the author's profile picture and profile info across their posts and local profile.
 */
export async function syncAuthorProfileOnPosts(
  previousAuthorName: string,
  updatedProfile: UserProfile
): Promise<{ error?: string }> {
  saveLocalProfile(updatedProfile);

  const local = loadLocalPosts();
  const updatedLocal = local.map((p) => {
    const matchByName =
      p.author_name.toLowerCase() === previousAuthorName.toLowerCase() ||
      p.author_name.toLowerCase() === updatedProfile.author_name.toLowerCase();

    if (matchByName) {
      return {
        ...p,
        author_name: updatedProfile.author_name,
        author_handle: updatedProfile.author_handle,
        author_avatar_url: updatedProfile.author_avatar_url,
        author_bio: updatedProfile.author_bio,
        author_location: updatedProfile.author_location,
        author_mood: updatedProfile.author_mood,
      };
    }
    return p;
  });
  saveLocalPosts(updatedLocal);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client
        .from("posts")
        .update({
          author_name: updatedProfile.author_name,
          author_handle: updatedProfile.author_handle,
          author_avatar_url: updatedProfile.author_avatar_url,
          author_bio: updatedProfile.author_bio,
          author_location: updatedProfile.author_location,
          author_mood: updatedProfile.author_mood,
        })
        .eq("author_name", previousAuthorName);
    } catch {
      // Ignore if optional columns are not present on remote table
    }
  }
  return {};
}

/**
 * Deletes a post by id from Supabase (when configured) and updates local cache.
 */
export async function deleteWallPost(
  postId: string
): Promise<{ deleted: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from("posts").delete().eq("id", postId);
      if (error) {
        return { deleted: false, error: error.message };
      }

      const { data: remaining, error: checkErr } = await client
        .from("posts")
        .select("id")
        .eq("id", postId)
        .maybeSingle();

      if (!checkErr && remaining) {
        return {
          deleted: false,
          error: "Unable to delete this post from the server.",
        };
      }
    } catch (err) {
      return {
        deleted: false,
        error: err instanceof Error ? err.message : "Delete failed",
      };
    }
  }

  const current = loadLocalPosts();
  saveLocalPosts(current.filter((p) => p.id !== postId));
  return { deleted: true };
}
