"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Check,
  Disc3,
  Globe,
  Loader2,
  MapPin,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_USER_PROFILE,
  loadLocalProfile,
  processAndUploadImage,
  syncAuthorProfileOnPosts,
  type UserProfile,
} from "@/lib/supabase";

export function EditProfileView() {
  const [previousName, setPreviousName] = React.useState(
    DEFAULT_USER_PROFILE.author_name
  );
  const [draft, setDraft] = React.useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedBanner, setSavedBanner] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const local = loadLocalProfile();
    setDraft(local);
    setPreviousName(local.author_name);
    setIsLoaded(true);
  }, []);

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file (PNG, JPG, GIF, or WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Profile photo must be smaller than 10 MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploadedUrl = await processAndUploadImage(file, "avatars");
      setDraft((prev) => ({ ...prev, author_avatar_url: uploadedUrl }));
    } catch {
      setErrorMessage("Could not upload the selected image.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setSavedBanner(false);
    setErrorMessage(null);

    try {
      const cleaned: UserProfile = {
        author_name: draft.author_name.trim() || "Guest",
        author_handle: draft.author_handle.trim() || "@guest",
        author_avatar_url: draft.author_avatar_url,
        author_bio: draft.author_bio.trim(),
        author_location: draft.author_location.trim(),
        author_mood: draft.author_mood.trim(),
      };

      const res = await syncAuthorProfileOnPosts(previousName, cleaned);
      if (res?.error) {
        setErrorMessage(res.error);
        return;
      }

      setPreviousName(cleaned.author_name);
      setDraft(cleaned);
      setSavedBanner(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/80 bg-[#EFF4F3]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white bg-gradient-to-br from-[#528899] via-[#6B8E7B] to-[#9BC4C0] text-white shadow-[0_6px_16px_-4px_rgba(82,136,153,0.45)]">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#1B2A2E]">
                wall
              </span>
              <p className="text-[11px] text-[#4A6B74]">Edit profile</p>
            </div>
          </Link>

          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Wall
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        {!isLoaded ? (
          <Card className="overflow-hidden border-white/90 bg-white/80 p-6">
            <div className="animate-pulse space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-[#D8E8E4]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 rounded-full bg-[#D8E8E4]" />
                  <div className="h-3 w-48 rounded-full bg-[#E4EFECE6]" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="h-9 rounded-xl bg-[#E4EFECE6]" />
                <div className="h-9 rounded-xl bg-[#E4EFECE6]" />
              </div>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden border-white/90 bg-gradient-to-b from-white/90 via-[#EFF4F3]/90 to-[#DFECE9]/85">
            <div className="h-2 w-full bg-gradient-to-r from-[#9BC4C0] via-[#D8E8E4] to-[#E8B496]" />

            <CardHeader className="border-b border-[#528899]/15 pb-4 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-[#1B2A2E]">
                    Edit profile
                  </h2>
                  <p className="text-xs text-[#4A6B74]">
                    Update your profile picture and info
                  </p>
                </div>
                {savedBanner && (
                  <div className="flex items-center gap-1.5 rounded-full border border-[#6B8E7B]/40 bg-[#6B8E7B]/15 px-3 py-1 text-xs font-medium text-[#284937] animate-fade-in">
                    <UserCheck className="h-3.5 w-3.5 text-[#6B8E7B]" />
                    <span>Changes saved</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMessage && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive animate-fade-in">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setErrorMessage(null)}
                      aria-label="Dismiss error"
                      className="rounded-full p-0.5 hover:bg-destructive/15"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Profile Picture Section */}
                <div className="flex flex-col gap-5 rounded-2xl border border-white/90 bg-white/65 p-4 sm:flex-row sm:items-center">
                  <div className="relative shrink-0 self-start sm:self-center">
                    <Avatar
                      src={draft.author_avatar_url}
                      alt={draft.author_name}
                      fallbackText={draft.author_name}
                      className="h-20 w-20 border-2 border-white shadow-[0_8px_20px_-4px_rgba(38,76,87,0.28)]"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      title="Upload profile picture"
                      className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#528899] text-white shadow-md transition-transform hover:scale-105 hover:bg-[#3f7181] disabled:opacity-70"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                      aria-label="Upload profile picture"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-[#1B2A2E]">
                          Profile photo
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Upload a PNG, JPG, GIF, or WebP photo
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="gap-1.5 text-xs"
                        >
                          <Upload className="h-3.5 w-3.5 text-[#528899]" />
                          {isUploadingAvatar ? "Uploading..." : "Upload photo"}
                        </Button>
                        {draft.author_avatar_url && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                author_avatar_url: "",
                              }))
                            }
                            className="text-xs text-muted-foreground hover:text-destructive"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-name"
                      className="font-sans text-xs normal-case tracking-normal"
                    >
                      Name
                    </Label>
                    <Input
                      id="edit-name"
                      value={draft.author_name}
                      onChange={(e) =>
                        setDraft({ ...draft, author_name: e.target.value })
                      }
                      placeholder="Your display name"
                      maxLength={50}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-handle"
                      className="font-sans text-xs normal-case tracking-normal"
                    >
                      Handle
                    </Label>
                    <Input
                      id="edit-handle"
                      value={draft.author_handle}
                      onChange={(e) =>
                        setDraft({ ...draft, author_handle: e.target.value })
                      }
                      placeholder="@name"
                      maxLength={32}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-city"
                      className="inline-flex items-center gap-1 font-sans text-xs normal-case tracking-normal"
                    >
                      <MapPin className="h-3 w-3 text-[#6B8E7B]" />
                      City
                    </Label>
                    <Input
                      id="edit-city"
                      value={draft.author_location}
                      onChange={(e) =>
                        setDraft({ ...draft, author_location: e.target.value })
                      }
                      placeholder="e.g. Tokyo"
                      maxLength={40}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-mood"
                      className="inline-flex items-center gap-1 font-sans text-xs normal-case tracking-normal"
                    >
                      <Disc3 className="h-3 w-3 text-[#528899]" />
                      Listening to
                    </Label>
                    <Input
                      id="edit-mood"
                      value={draft.author_mood}
                      onChange={(e) =>
                        setDraft({ ...draft, author_mood: e.target.value })
                      }
                      placeholder="Song, album, or mood"
                      maxLength={60}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-bio"
                    className="font-sans text-xs normal-case tracking-normal"
                  >
                    About
                  </Label>
                  <Textarea
                    id="edit-bio"
                    value={draft.author_bio}
                    onChange={(e) =>
                      setDraft({ ...draft, author_bio: e.target.value })
                    }
                    placeholder="Write a short bio about yourself..."
                    rows={4}
                    maxLength={220}
                    className="min-h-[96px]"
                  />
                  <div className="text-right text-[11px] text-muted-foreground">
                    {draft.author_bio.length} / 220
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#528899]/15 pt-4">
                  <Button asChild type="button" variant="ghost">
                    <Link href="/">Back to Wall</Link>
                  </Button>

                  <Button
                    type="submit"
                    variant="amber"
                    disabled={isSaving}
                    className="gap-1.5 px-6 font-semibold"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Save profile</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
