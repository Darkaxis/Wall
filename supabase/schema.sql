
create extension if not exists "pgcrypto";

-- 1. Create the `posts` table
create table if not exists public.posts (
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

-- Index for reverse-chronological feed (newest first)
create index if not exists idx_posts_created_at_desc on public.posts (created_at desc);

-- 2. Enable Row Level Security (RLS) & public policies so the Wall works out of the box
alter table public.posts enable row level security;

drop policy if exists "Allow public read access on posts" on public.posts;
create policy "Allow public read access on posts"
  on public.posts
  for select
  to public
  using (true);

drop policy if exists "Allow public insert access on posts" on public.posts;
create policy "Allow public insert access on posts"
  on public.posts
  for insert
  to public
  with check (
    (body is null or char_length(body) <= 280)
    and (message is null or char_length(message) <= 280)
  );

drop policy if exists "Allow public update access on posts" on public.posts;
create policy "Allow public update access on posts"
  on public.posts
  for update
  to public
  using (true);

-- 3. Enable Realtime on the `posts` table (Critical requirement!)
alter publication supabase_realtime add table public.posts;

-- 4. Optional Storage Bucket for Photo & Profile Picture Uploads
insert into storage.buckets (id, name, public)
values ('wall-media', 'wall-media', true)
on conflict (id) do nothing;

drop policy if exists "Public read access for wall-media" on storage.objects;
create policy "Public read access for wall-media"
  on storage.objects for select
  to public
  using (bucket_id = 'wall-media');

drop policy if exists "Public upload access for wall-media" on storage.objects;
create policy "Public upload access for wall-media"
  on storage.objects for insert
  to public
  with check (bucket_id = 'wall-media');
