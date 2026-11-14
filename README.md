# WALL // Y2K Gen-X Soft Club Edition

A **React 19** and **Next.js 15** live social feed application built with **Tailwind CSS**, **shadcn/ui**, and **Supabase** (`@supabase/supabase-js`), styled in the late-90s / early-2000s **Y2K Gen-X Soft Club** aesthetic (frosted seafoam acrylic, glacier blue, soft sage, micro-barcodes, and international airport transit lounge telemetry).

## Features

- **280-Character Wall Composer**: Write a short message (strictly capped at 280 characters with a live progress gauge) and press **Share** to publish it.
- **Auto-Refreshing Live Feed**: Shows the newest messages at the top (`ORDER BY created_at DESC`) and refreshes automatically without reloading the page via **Supabase Realtime** (`postgres_changes` on `public.posts`), background polling, and cross-tab `BroadcastChannel` sync.
- **Single Simple `posts` Table**: Stores every entry with its unique `id`, `author_name`, `message` text, and `created_at` timestamp, plus optional photo & profile columns.
- **Photo Uploads & Y2K Optic Filters**: Attach photos to any post via file upload or drag-and-drop, apply Y2K Soft Club filters (`RAW // CLEAN`, `AERO // CYAN`, `SOFT // 1999`, `SUNSET // LOUNGE`), and inspect photos in a full-screen lightbox.
- **Profile Picture & Profile Info**: Upload a custom profile picture (or select from procedural Soft Club avatars) and customize your author name, handle, location/gate, ambient listening status, and bio.

## Supabase Setup

1. Copy `.env.local.example` to `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   *(Alternatively, click **SUPABASE // POSTS DB** in the top navigation bar of the running app to enter your Supabase URL and Anon Key directly in the browser).*
2. Run the SQL migration inside [`supabase/schema.sql`](./supabase/schema.sql) in your Supabase SQL Editor to create the `posts` table, enable Supabase Realtime, and configure the `wall-media` storage bucket.

## Getting Started

```bash
npm install
npm run dev
```
