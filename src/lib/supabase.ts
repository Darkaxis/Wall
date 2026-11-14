import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const MAX_POST_LENGTH = 280;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_GIF_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 10000;

export const FIELD_LIMITS = {
  AUTHOR_NAME: 50,
  AUTHOR_HANDLE: 32,
  AUTHOR_LOCATION: 40,
  AUTHOR_MOOD: 60,
  AUTHOR_BIO: 220,
  PHOTO_CAPTION: 80,
} as const;

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const DISALLOWED_IMAGE_EXTENSIONS = /\.(svg|svgz|html|htm|xhtml|xml|js|mjs)$/i;
const SAFE_DATA_IMAGE_RE =
  /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i;
const SAFE_POST_ID_RE = /^[A-Za-z0-9_-]{1,80}$/;

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

const STORAGE_KEYS = {
  POSTS: "wall_softclub_posts_v1",
  PROFILE: "wall_softclub_profile_v1",
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

/**
 * Strips NUL, unsafe control characters, and Unicode BiDi override controls, then caps length.
 */
export function sanitizeText(
  value: unknown,
  maxLength: number,
  multiline = false
): string {
  if (typeof value !== "string") return "";
  let cleaned = value.replace(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g,
    ""
  );
  if (!multiline) {
    cleaned = cleaned.replace(/[\r\n]+/g, " ");
  } else {
    cleaned = cleaned.replace(/\r\n?/g, "\n");
  }
  return cleaned.trim().slice(0, maxLength);
}

/**
 * Validates that an image/avatar URL uses HTTPS or a safe raster base64 DataURL (blocks SVG/script/http schemes).
 */
export function sanitizeMediaUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 2_500_000) return null;

  if (trimmed.toLowerCase().startsWith("data:")) {
    return SAFE_DATA_IMAGE_RE.test(trimmed) ? trimmed : null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeProfile(input: Partial<UserProfile>): UserProfile {
  const safeName =
    sanitizeText(input.author_name, FIELD_LIMITS.AUTHOR_NAME) || "Guest";
  const safeHandle = sanitizeText(input.author_handle, FIELD_LIMITS.AUTHOR_HANDLE);
  const safeAvatar = sanitizeMediaUrl(input.author_avatar_url) || "";

  return {
    author_name: safeName,
    author_handle: safeHandle,
    author_avatar_url: safeAvatar,
    author_bio: sanitizeText(input.author_bio, FIELD_LIMITS.AUTHOR_BIO, true),
    author_location: sanitizeText(
      input.author_location,
      FIELD_LIMITS.AUTHOR_LOCATION
    ),
    author_mood: sanitizeText(input.author_mood, FIELD_LIMITS.AUTHOR_MOOD),
  };
}

/**
 * Client-side pre-check for uploaded image files before inspecting magic bytes.
 */
export function validateImageFile(file: File | null | undefined): string | null {
  if (!file) return "No image file selected.";
  if (DISALLOWED_IMAGE_EXTENSIONS.test(file.name)) {
    return "Please choose a PNG, JPG, GIF, or WebP photo.";
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
    return "Please select a PNG, JPG, GIF, or WebP photo.";
  }
  if (file.size <= 0) {
    return "The selected image file is empty.";
  }
  if (file.type.toLowerCase() === "image/gif" && file.size > MAX_GIF_BYTES) {
    return "GIF files must be smaller than 5 MB.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be smaller than 10 MB.";
  }
  return null;
}

type DetectedImageMime =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif";

async function inspectImageMagicType(
  file: File
): Promise<DetectedImageMime | null> {
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const b = new Uint8Array(buffer);
    if (b.length < 12) return null;

    // JPEG: FF D8 FF
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
      return "image/jpeg";
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a
    ) {
      return "image/png";
    }
    // GIF87a / GIF89a
    if (
      b[0] === 0x47 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x38 &&
      (b[4] === 0x37 || b[4] === 0x39) &&
      b[5] === 0x61
    ) {
      return "image/gif";
    }
    // WEBP: RIFF....WEBP
    if (
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50
    ) {
      return "image/webp";
    }
  } catch {
    return null;
  }
  return null;
}

function isSafeSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") return true;
    return (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const envSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

const hasValidEnvKeys =
  Boolean(envSupabaseUrl) &&
  Boolean(envSupabaseKey) &&
  isSafeSupabaseUrl(envSupabaseUrl) &&
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

export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}

export function loadLocalProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_USER_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return sanitizeProfile(parsed);
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveLocalProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  const cleaned = sanitizeProfile(profile);
  window.localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(cleaned));
}

export function loadLocalPosts(): WallPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    if (!Array.isArray(parsed)) return [];
    const sanitized = parsed
      .filter(
        (p) =>
          p &&
          typeof p === "object" &&
          !LEGACY_SEED_IDS.has(String(p.id || ""))
      )
      .map((p) => normalizePostRow(p));
    if (sanitized.length !== parsed.length) {
      saveLocalPosts(sanitized);
    }
    return sanitized.sort(
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
    window.localStorage.setItem(
      STORAGE_KEYS.POSTS,
      JSON.stringify(posts.slice(0, 100))
    );
  } catch {
    // Handle storage quota gracefully
  }
}

function getExtraMetaMap(): Record<string, Partial<WallPost>> {
  if (typeof window === "undefined") return Object.create(null);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.EXTRA_META);
    if (!raw) return Object.create(null);
    const parsed = JSON.parse(raw) as Record<string, Partial<WallPost>>;
    const safeMap: Record<string, Partial<WallPost>> = Object.create(null);
    for (const [k, v] of Object.entries(parsed)) {
      if (SAFE_POST_ID_RE.test(k) && v && typeof v === "object") {
        safeMap[k] = v;
      }
    }
    return safeMap;
  } catch {
    return Object.create(null);
  }
}

function saveExtraMeta(id: string, meta: Partial<WallPost>) {
  if (typeof window === "undefined" || !SAFE_POST_ID_RE.test(id)) return;
  try {
    const map = getExtraMetaMap();
    map[id] = meta;
    const keys = Object.keys(map);
    if (keys.length > 100) {
      for (const oldKey of keys.slice(0, keys.length - 100)) {
        delete map[oldKey];
      }
    }
    window.localStorage.setItem(STORAGE_KEYS.EXTRA_META, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

export function normalizePostRow(row: Record<string, unknown>): WallPost {
  const id = String(row.id || `sc-${Date.now()}`);
  const metaMap = getExtraMetaMap();
  const cached = Object.prototype.hasOwnProperty.call(metaMap, id)
    ? metaMap[id]
    : {};
  const profileFallback = loadLocalProfile();

  const textContent = sanitizeText(
    row.body ?? row.message ?? cached.body ?? cached.message ?? "",
    MAX_POST_LENGTH,
    true
  );

  const parsedDate = row.created_at ? new Date(String(row.created_at)) : null;
  const createdAt =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toISOString()
      : new Date().toISOString();

  return {
    id,
    user_id: typeof row.user_id === "string" ? row.user_id : null,
    body: textContent,
    message: textContent,
    author_name:
      sanitizeText(
        row.author_name ||
          cached.author_name ||
          profileFallback.author_name ||
          "Guest",
        FIELD_LIMITS.AUTHOR_NAME
      ) || "Guest",
    created_at: createdAt,
    photo_url: sanitizeMediaUrl(row.photo_url ?? cached.photo_url),
    photo_caption:
      sanitizeText(
        row.photo_caption ?? cached.photo_caption ?? "",
        FIELD_LIMITS.PHOTO_CAPTION
      ) || null,
    author_avatar_url: sanitizeMediaUrl(
      row.author_avatar_url ?? cached.author_avatar_url
    ),
    author_handle:
      sanitizeText(
        row.author_handle ?? cached.author_handle ?? "",
        FIELD_LIMITS.AUTHOR_HANDLE
      ) || null,
    author_bio:
      sanitizeText(
        row.author_bio ?? cached.author_bio ?? "",
        FIELD_LIMITS.AUTHOR_BIO,
        true
      ) || null,
    author_location:
      sanitizeText(
        row.author_location ?? cached.author_location ?? "",
        FIELD_LIMITS.AUTHOR_LOCATION
      ) || null,
    author_mood:
      sanitizeText(
        row.author_mood ?? cached.author_mood ?? "",
        FIELD_LIMITS.AUTHOR_MOOD
      ) || null,
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });
}

function loadValidatedImage(file: File): Promise<{
  img: HTMLImageElement;
  cleanup: () => void;
}> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    const cleanup = () => URL.revokeObjectURL(objectUrl);

    img.onload = () => {
      if (
        img.naturalWidth <= 0 ||
        img.naturalHeight <= 0 ||
        img.naturalWidth > MAX_IMAGE_DIMENSION ||
        img.naturalHeight > MAX_IMAGE_DIMENSION
      ) {
        cleanup();
        reject(new Error("Image dimensions are not supported."));
        return;
      }
      resolve({ img, cleanup });
    };
    img.onerror = () => {
      cleanup();
      reject(new Error("Could not decode the selected image file."));
    };
    img.src = objectUrl;
  });
}

async function sanitizeAndEncodeImage(
  file: File,
  maxDimension: number,
  detectedMime: DetectedImageMime
): Promise<{
  blob: Blob;
  dataUrl: string;
  contentType: string;
  ext: string;
}> {
  const { img, cleanup } = await loadValidatedImage(file);
  try {
    if (detectedMime === "image/gif") {
      const safeGifBlob = new Blob([await file.arrayBuffer()], {
        type: "image/gif",
      });
      const dataUrl = await blobToDataUrl(safeGifBlob);
      return {
        blob: safeGifBlob,
        dataUrl,
        contentType: "image/gif",
        ext: "gif",
      };
    }

    let width = img.naturalWidth;
    let height = img.naturalHeight;
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.max(1, Math.round((height * maxDimension) / width));
        width = maxDimension;
      } else {
        width = Math.max(1, Math.round((width * maxDimension) / height));
        height = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not process the selected image.");
    }

    // Re-encoding through canvas strips EXIF/GPS metadata and non-pixel payloads.
    ctx.drawImage(img, 0, 0, width, height);

    const outMime = detectedMime === "image/png" ? "image/png" : "image/jpeg";
    const outExt = outMime === "image/png" ? "png" : "jpg";

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error("Could not process the selected image."));
            return;
          }
          resolve(result);
        },
        outMime,
        0.85
      );
    });

    const dataUrl = await blobToDataUrl(blob);
    return {
      blob,
      dataUrl,
      contentType: outMime,
      ext: outExt,
    };
  } finally {
    cleanup();
  }
}

/**
 * Validates image headers, strips EXIF/embedded payloads by re-encoding client-side,
 * and uploads ONLY the sanitized image blob to Supabase Storage (`wall-media`).
 */
export async function processAndUploadImage(
  file: File,
  folder: "posts" | "avatars" = "posts"
): Promise<string> {
  const fileError = validateImageFile(file);
  if (fileError) {
    throw new Error(fileError);
  }

  const detectedMime = await inspectImageMagicType(file);
  if (!detectedMime) {
    throw new Error("Please select a valid PNG, JPG, GIF, or WebP image.");
  }

  const maxDim = folder === "avatars" ? 320 : 960;
  const sanitized = await sanitizeAndEncodeImage(file, maxDim, detectedMime);

  const client = getSupabaseClient();
  if (client) {
    try {
      const randomPart =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const fileName = `${folder}/${randomPart}.${sanitized.ext}`;

      const { error: uploadError } = await client.storage
        .from("wall-media")
        .upload(fileName, sanitized.blob, {
          cacheControl: "3600",
          upsert: false,
          contentType: sanitized.contentType,
        });

      if (!uploadError) {
        const { data } = client.storage
          .from("wall-media")
          .getPublicUrl(fileName);
        const safePublicUrl = sanitizeMediaUrl(data?.publicUrl);
        if (safePublicUrl) {
          return safePublicUrl;
        }
      }
    } catch {
      // Fallback to sanitized DataURL if storage bucket isn't reachable
    }
  }

  const safeDataUrl = sanitizeMediaUrl(sanitized.dataUrl);
  if (!safeDataUrl) {
    throw new Error("Could not process the selected image.");
  }
  return safeDataUrl;
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
        error: "Could not refresh posts right now.",
      };
    }

    const normalized: WallPost[] = (data || [])
      .filter((row) => row && typeof row === "object")
      .map((row) => normalizePostRow(row as Record<string, unknown>));

    return { posts: normalized, source: "supabase" };
  } catch {
    return {
      posts: loadLocalPosts(),
      source: "local",
      error: "Connection failed. Showing saved posts.",
    };
  }
}

/**
 * Inserts a new post into the `posts` table (enforcing max 280 characters and field sanitization).
 */
export async function createWallPost(input: {
  user_id?: string | null;
  author_name: string;
  message: string;
  photo_url?: string | null;
  photo_caption?: string | null;
  profile: UserProfile;
}): Promise<{ post: WallPost; source: "supabase" | "local"; error?: string }> {
  const cleanMessage = sanitizeText(input.message, MAX_POST_LENGTH, true);
  if (!cleanMessage) {
    throw new Error("Please write a message before sharing.");
  }

  const safeProfile = sanitizeProfile(input.profile);
  const cleanAuthor =
    sanitizeText(input.author_name, FIELD_LIMITS.AUTHOR_NAME) ||
    safeProfile.author_name ||
    "Guest";
  const nowIso = new Date().toISOString();

  const newPost: WallPost = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sc-${Date.now()}`,
    user_id: typeof input.user_id === "string" ? input.user_id : null,
    author_name: cleanAuthor,
    body: cleanMessage,
    message: cleanMessage,
    created_at: nowIso,
    photo_url: sanitizeMediaUrl(input.photo_url),
    photo_caption:
      sanitizeText(input.photo_caption, FIELD_LIMITS.PHOTO_CAPTION) || null,
    author_avatar_url: safeProfile.author_avatar_url || null,
    author_handle: safeProfile.author_handle || null,
    author_bio: safeProfile.author_bio || null,
    author_location: safeProfile.author_location || null,
    author_mood: safeProfile.author_mood || null,
  };

  const client = getSupabaseClient();
  if (client) {
    try {
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

      const current = loadLocalPosts();
      saveLocalPosts([newPost, ...current]);
      return {
        post: newPost,
        source: "local",
        error: "Could not reach the server. Saved on this device only.",
      };
    } catch {
      const current = loadLocalPosts();
      saveLocalPosts([newPost, ...current]);
      return {
        post: newPost,
        source: "local",
        error: "Could not reach the server. Saved on this device only.",
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
  previousAuthorNameRaw: string,
  updatedProfile: UserProfile
): Promise<{ error?: string }> {
  const previousAuthorName = sanitizeText(
    previousAuthorNameRaw,
    FIELD_LIMITS.AUTHOR_NAME
  );
  const cleanedProfile = sanitizeProfile(updatedProfile);

  saveLocalProfile(cleanedProfile);

  const local = loadLocalPosts();
  const updatedLocal = local.map((p) => {
    const matchByName =
      (previousAuthorName &&
        p.author_name.toLowerCase() === previousAuthorName.toLowerCase()) ||
      p.author_name.toLowerCase() === cleanedProfile.author_name.toLowerCase();

    if (matchByName) {
      return {
        ...p,
        author_name: cleanedProfile.author_name,
        author_handle: cleanedProfile.author_handle,
        author_avatar_url: cleanedProfile.author_avatar_url,
        author_bio: cleanedProfile.author_bio,
        author_location: cleanedProfile.author_location,
        author_mood: cleanedProfile.author_mood,
      };
    }
    return p;
  });
  saveLocalPosts(updatedLocal);

  const client = getSupabaseClient();
  if (client && previousAuthorName) {
    try {
      await client
        .from("posts")
        .update({
          author_name: cleanedProfile.author_name,
          author_handle: cleanedProfile.author_handle,
          author_avatar_url: cleanedProfile.author_avatar_url,
          author_bio: cleanedProfile.author_bio,
          author_location: cleanedProfile.author_location,
          author_mood: cleanedProfile.author_mood,
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
  if (!SAFE_POST_ID_RE.test(postId)) {
    return { deleted: false, error: "Invalid post identifier." };
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from("posts").delete().eq("id", postId);
      if (error) {
        return {
          deleted: false,
          error: "Unable to delete this post from the server.",
        };
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
    } catch {
      return {
        deleted: false,
        error: "Unable to delete this post right now.",
      };
    }
  }

  const current = loadLocalPosts();
  saveLocalPosts(current.filter((p) => p.id !== postId));
  return { deleted: true };
}
