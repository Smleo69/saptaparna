-- Supabase backend for the Saptaparna site.
-- Admin email: smleo4411@gmail.com

create extension if not exists "pgcrypto";

create or replace function public.is_site_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'smleo4411@gmail.com';
$$;

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.poems (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  written_on date not null default current_date,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  audio_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.gallery_items enable row level security;
alter table public.poems enable row level security;
alter table public.site_settings enable row level security;
alter table public.music_tracks enable row level security;

drop policy if exists "public can read gallery" on public.gallery_items;
create policy "public can read gallery"
on public.gallery_items for select
to anon, authenticated
using (true);

drop policy if exists "admin can manage gallery" on public.gallery_items;
create policy "admin can manage gallery"
on public.gallery_items for all
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

drop policy if exists "public can read poems" on public.poems;
create policy "public can read poems"
on public.poems for select
to anon, authenticated
using (true);

drop policy if exists "admin can manage poems" on public.poems;
create policy "admin can manage poems"
on public.poems for all
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

drop policy if exists "public can read settings" on public.site_settings;
create policy "public can read settings"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "admin can manage settings" on public.site_settings;
create policy "admin can manage settings"
on public.site_settings for all
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

drop policy if exists "public can read music tracks" on public.music_tracks;
create policy "public can read music tracks"
on public.music_tracks for select
to anon, authenticated
using (true);

drop policy if exists "admin can manage music tracks" on public.music_tracks;
create policy "admin can manage music tracks"
on public.music_tracks for all
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

-- Public defaults. You can edit these later from the site admin panel once wired.
insert into public.site_settings (key, value)
values
  ('letter', '""'::jsonb),
  ('surprises', '[]'::jsonb)
on conflict (key) do nothing;

-- Storage policies. Create public buckets named "memories" and "music" first.
drop policy if exists "public can read memory files" on storage.objects;
create policy "public can read memory files"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('memories', 'music'));

drop policy if exists "admin can upload memory files" on storage.objects;
create policy "admin can upload memory files"
on storage.objects for insert
to authenticated
with check (bucket_id in ('memories', 'music') and public.is_site_admin());

drop policy if exists "admin can update memory files" on storage.objects;
create policy "admin can update memory files"
on storage.objects for update
to authenticated
using (bucket_id in ('memories', 'music') and public.is_site_admin())
with check (bucket_id in ('memories', 'music') and public.is_site_admin());

drop policy if exists "admin can delete memory files" on storage.objects;
create policy "admin can delete memory files"
on storage.objects for delete
to authenticated
using (bucket_id in ('memories', 'music') and public.is_site_admin());
