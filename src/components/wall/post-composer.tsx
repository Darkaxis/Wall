"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ImagePlus,
  Loader2,
  SendHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import {
  MAX_POST_LENGTH,
  processAndUploadImage,
  type UserProfile,
} from "@/lib/supabase";

interface PostComposerProps {
  profile: UserProfile;
  onPublishPost: (payload: {
    author_name: string;
    message: string;
    photo_url?: string | null;
    photo_caption?: string | null;
  }) => Promise<{ error?: string } | void>;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function PostComposer({ profile, onPublishPost }: PostComposerProps) {
  const [message, setMessage] = React.useState("");
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = React.useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const photoInputRef = React.useRef<HTMLInputElement>(null);

  const charsUsed = message.length;
  const charsRemaining = MAX_POST_LENGTH - charsUsed;
  const progressPct = Math.min(100, (charsUsed / MAX_POST_LENGTH) * 100);
  const isNearLimit = charsRemaining <= 25;
  const isAtLimit = charsRemaining <= 0;

  const handlePhotoFile = async (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file (PNG, JPG, GIF, or WebP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMsg("Image must be smaller than 10 MB.");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const url = await processAndUploadImage(file, "posts");
      setPhotoUrl(url);
    } catch {
      setErrorMsg("Could not process the selected photo. Please try another.");
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handlePhotoFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handlePhotoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !message.trim() ||
      message.length > MAX_POST_LENGTH ||
      isPublishing ||
      isUploadingPhoto
    ) {
      return;
    }

    setErrorMsg(null);
    setIsPublishing(true);
    try {
      const result = await onPublishPost({
        author_name: profile.author_name || "Guest",
        message: message.trim().slice(0, MAX_POST_LENGTH),
        photo_url: photoUrl,
        photo_caption: photoCaption.trim() || null,
      });

      if (result && result.error) {
        setErrorMsg(result.error);
        return;
      }

      setMessage("");
      setPhotoUrl(null);
      setPhotoCaption("");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to publish post."
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (message.trim() && message.length <= MAX_POST_LENGTH) {
        void handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <Card
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={`relative overflow-hidden transition-all duration-200 ${
        isDraggingOver
          ? "border-[#DF6D3B] ring-2 ring-[#DF6D3B]/30"
          : "border-white/90"
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#528899]/15 bg-gradient-to-r from-[#DFECE9]/85 via-white/90 to-[#DCEAEF]/85 px-4 py-2.5 sm:px-5">
        <span className="text-xs font-semibold text-[#1B2A2E]">
          Write on the Wall
        </span>
        <span className="text-[11px] text-[#528899]">
          Up to {MAX_POST_LENGTH} characters
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <CardHeader className="px-4 pb-2.5 pt-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                src={profile.author_avatar_url}
                alt={profile.author_name}
                fallbackText={profile.author_name || "WL"}
                className="h-9 w-9 border-2 border-white"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[#1B2A2E]">
                  {profile.author_name}
                </div>
                {profile.author_handle && (
                  <div className="truncate text-[11px] text-[#528899]">
                    {profile.author_handle}
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/profile"
              className="shrink-0 text-xs font-medium text-[#528899] hover:underline"
            >
              Edit profile
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-3.5 px-4 pb-4 sm:px-5 sm:pb-5">
          {errorMsg && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                aria-label="Dismiss error"
                className="rounded-full p-0.5 hover:bg-destructive/15"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Message Textarea (280 char limit) */}
          <Textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value.slice(0, MAX_POST_LENGTH))
            }
            onKeyDown={handleKeyDown}
            maxLength={MAX_POST_LENGTH}
            placeholder="What's on your mind? Share a short note or drop a photo..."
            rows={3}
            aria-label="Message"
            disabled={isPublishing}
            className="min-h-[96px] resize-none rounded-2xl border-white/90 bg-white/80 p-3.5 text-sm leading-relaxed text-[#1B2A2E] shadow-[inset_0_2px_6px_rgba(27,42,46,0.04)] transition-colors"
            required
          />

          {/* Photo Attachment Preview & Filters */}
          {photoUrl && (
            <div className="space-y-2.5 rounded-2xl border border-white/90 bg-white/70 p-3 backdrop-blur-md animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#2A4A53]">
                  <Wand2 className="h-3.5 w-3.5 text-[#528899]" />
                  <span>Photo filter</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoUrl(null);
                    setPhotoCaption("");
                    setPhotoFilter("none");
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-white/90 bg-[#DCE8E6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt="Uploaded post preview"
                  className={`max-h-60 w-full object-cover transition-all duration-300 ${activeFilterObj.cssClass}`}
                />
              </div>

              {/* Filter Selector Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {PHOTO_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPhotoFilter(f.id)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                      photoFilter === f.id
                        ? "border-[#528899] bg-[#528899] text-white shadow-sm"
                        : "border-white/80 bg-white/60 text-[#2A4A53] hover:bg-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <Input
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="Add a caption (optional)..."
                maxLength={80}
                className="h-8 text-xs"
              />
            </div>
          )}

          {/* Bottom Toolbar: Photo Upload + Character Counter + Share Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload photo for post"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingPhoto || isPublishing}
                className="h-8 gap-1.5 text-xs"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#528899]" />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5 text-[#528899]" />
                )}
                {isUploadingPhoto
                  ? "Uploading..."
                  : photoUrl
                  ? "Change photo"
                  : "Add photo"}
              </Button>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* 280 Character Progress Ring + Counter */}
              <div
                aria-live="polite"
                className={`flex items-center gap-2 rounded-full border px-3 py-1 transition-colors ${
                  isAtLimit
                    ? "border-destructive/40 bg-destructive/10"
                    : isNearLimit
                    ? "border-[#DF6D3B]/40 bg-[#DF6D3B]/10"
                    : "border-white/80 bg-white/65"
                }`}
                title={`${charsRemaining} characters remaining`}
              >
                <svg className="h-4 w-4 -rotate-90" viewBox="0 0 20 20">
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    fill="none"
                    stroke="#CFE0DD"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    fill="none"
                    stroke={
                      isAtLimit
                        ? "#DC2626"
                        : isNearLimit
                        ? "#DF6D3B"
                        : "#528899"
                    }
                    strokeWidth="2.5"
                    strokeDasharray={44}
                    strokeDashoffset={44 - (44 * progressPct) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-150"
                  />
                </svg>
                <span
                  className={`text-xs font-medium tabular-nums ${
                    isAtLimit
                      ? "text-destructive"
                      : isNearLimit
                      ? "text-[#DF6D3B]"
                      : "text-[#284750]"
                  }`}
                >
                  {charsUsed} / {MAX_POST_LENGTH}
                </span>
              </div>

              {/* Primary Share Action */}
              <Button
                type="submit"
                variant="amber"
                disabled={
                  !message.trim() ||
                  message.length > MAX_POST_LENGTH ||
                  isPublishing ||
                  isUploadingPhoto
                }
                className="h-9 px-5 font-semibold"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sharing...</span>
                  </>
                ) : (
                  <>
                    <span>Share</span>
                    <SendHorizontal className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
