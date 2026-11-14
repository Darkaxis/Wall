create extension if not exists "pgcrypto";

-- 1. Create the `posts` table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  body text check (char_length(body) <= 280),
  author_name text default 'Guest',
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

alter table public.posts alter column author_name set default 'Guest';

-- Index for reverse-chronological feed (newest first)
create index if not exists idx_posts_created_at_desc on public.posts (created_at desc);

-- 2. Enable Row Level Security (RLS) & constrained public policies
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
    coalesce(nullif(trim(body), ''), nullif(trim(message), '')) is not null
    and (body is null or char_length(body) <= 280)
    and (message is null or char_length(message) <= 280)
    and (author_name is null or char_length(author_name) <= 50)
    and (author_handle is null or char_length(author_handle) <= 32)
    and (author_bio is null or char_length(author_bio) <= 220)
    and (author_location is null or char_length(author_location) <= 40)
    and (author_mood is null or char_length(author_mood) <= 60)
    and (photo_caption is null or char_length(photo_caption) <= 80)
    and (
      photo_url is null
      or (
        char_length(photo_url) <= 2500000
        and (
          photo_url ~* '^https://'
          or photo_url ~* '^data:image/(jpeg|jpg|png|webp|gif);base64,'
        )
      )
    )
    and (
      author_avatar_url is null
      or author_avatar_url = ''
      or (
        char_length(author_avatar_url) <= 2500000
        and (
          author_avatar_url ~* '^https://'
          or author_avatar_url ~* '^data:image/(jpeg|jpg|png|webp|gif);base64,'
        )
      )
    )
  );

drop policy if exists "Allow public update access on posts" on public.posts;
create policy "Allow public update access on posts"
  on public.posts
  for update
  to public
  using (true)
  with check (
    (body is null or char_length(body) <= 280)
    and (message is null or char_length(message) <= 280)
    and (author_name is null or char_length(author_name) <= 50)
    and (author_handle is null or char_length(author_handle) <= 32)
    and (author_bio is null or char_length(author_bio) <= 220)
    and (author_location is null or char_length(author_location) <= 40)
    and (author_mood is null or char_length(author_mood) <= 60)
    and (photo_caption is null or char_length(photo_caption) <= 80)
    and (
      photo_url is null
      or (
        char_length(photo_url) <= 2500000
        and (
          photo_url ~* '^https://'
          or photo_url ~* '^data:image/(jpeg|jpg|png|webp|gif);base64,'
        )
      )
    )
    and (
      author_avatar_url is null
      or author_avatar_url = ''
      or (
        char_length(author_avatar_url) <= 2500000
        and (
          author_avatar_url ~* '^https://'
          or author_avatar_url ~* '^data:image/(jpeg|jpg|png|webp|gif);base64,'
        )
      )
    )
  );

drop policy if exists "Allow public delete access on posts" on public.posts;
create policy "Allow public delete access on posts"
  on public.posts
  for delete
  to public
  using (true);

-- 3. Enable Realtime on the `posts` table (ignore error 42710 if already added)
do $$
begin
  alter publication supabase_realtime add table public.posts;
exception
  when duplicate_object then null;
end $$;

-- 4. Restricted Storage Bucket for Photo & Profile Picture Uploads (raster images only, max 5 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wall-media',
  'wall-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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
