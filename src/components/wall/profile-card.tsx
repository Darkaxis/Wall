"use client";

import * as React from "react";
import Link from "next/link";
import { Disc3, Edit3, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { UserProfile } from "@/lib/supabase";

interface ProfileCardProps {
  profile: UserProfile;
  postCount: number;
  photoCount: number;
}

export function ProfileCard({
  profile,
  postCount,
  photoCount,
}: ProfileCardProps) {
  return (
    <Card className="relative overflow-hidden border-white/90 bg-gradient-to-b from-white/85 via-[#EFF4F3]/85 to-[#DFECE9]/80">
      <div className="h-2 w-full bg-gradient-to-r from-[#9BC4C0] via-[#D8E8E4] to-[#E8B496]" />

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start gap-3.5">
          <Avatar
            src={profile.author_avatar_url}
            alt={profile.author_name}
            fallbackText={profile.author_name}
            className="h-16 w-16 border-2 border-white shadow-[0_6px_18px_-4px_rgba(38,76,87,0.28)]"
          />

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold tracking-tight text-[#1B2A2E]">
              {profile.author_name}
            </h2>

            {profile.author_handle && (
              <p className="text-xs font-medium text-[#528899]">
                {profile.author_handle}
              </p>
            )}

            {profile.author_location && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="sage"
                  className="text-[10px] normal-case tracking-normal"
                >
                  <MapPin className="h-2.5 w-2.5" />
                  {profile.author_location}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5">
        {/* Profile Bio */}
        <div className="rounded-xl border border-white/80 bg-white/60 p-3 shadow-[inset_0_1px_2px_rgba(27,42,46,0.04)]">
          <div className="mb-1 text-[11px] font-medium text-muted-foreground">
            About
          </div>
          <p className="text-xs leading-relaxed text-[#26393E]">
            {profile.author_bio ||
              "Add a short bio to introduce yourself on the Wall."}
          </p>
        </div>

        {/* Listening To */}
        {profile.author_mood && (
          <div className="flex items-center gap-2.5 rounded-xl border border-white/75 bg-[#E3EFECE6] px-3 py-2">
            <Disc3 className="h-4 w-4 shrink-0 animate-spin text-[#528899] [animation-duration:8s]" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-muted-foreground">
                Listening to
              </div>
              <div className="truncate text-xs font-medium text-[#1B2A2E]">
                {profile.author_mood}
              </div>
            </div>
          </div>
        )}

        {/* Activity Counters */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/80 bg-white/55 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">Posts</div>
            <div className="text-base font-semibold text-[#1B2A2E]">
              {postCount}
            </div>
          </div>
          <div className="rounded-xl border border-white/80 bg-white/55 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">Photos</div>
            <div className="text-base font-semibold text-[#528899]">
              {photoCount}
            </div>
          </div>
        </div>

        {/* Link to Dedicated Edit Profile Page */}
        <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
          <Link href="/profile">
            <Edit3 className="h-3.5 w-3.5 text-[#528899]" />
            Edit profile
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
