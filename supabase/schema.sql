-- Diecast Garage shared catalogue + private collection sync.
-- Apply in Supabase SQL Editor. No service-role key belongs in the browser.

create extension if not exists pgcrypto;

-- Shared reference catalogue. Public read; trusted importer writes with service role.
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.castings (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id),
  name text not null,
  casting_name text not null,
  vehicle_type text not null default 'unknown'
    check (vehicle_type in ('supercar','hypercar','real_car','fantasy','racing','other','unknown')),
  is_fantasy boolean,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  casting_id uuid not null references public.castings(id) on delete cascade,
  release_year integer,
  series text,
  assortment text,
  collector_number text,
  release_name text,
  country text,
  source_name text not null,
  source_record_id text,
  source_url text,
  image_url text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','source_matched','verified','conflicting')),
  created_at timestamptz not null default now(),
  unique (source_name, source_record_id)
);

create table if not exists public.variants (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases(id) on delete cascade,
  color text,
  wheel_type text,
  tampo text,
  base_code text,
  notes text,
  source_record_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.packs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pack_type text not null default 'multipack',
  release_year integer,
  assortment text,
  source_name text,
  source_record_id text,
  source_url text,
  image_url text,
  unique (source_name, source_record_id)
);

create table if not exists public.pack_contents (
  pack_id uuid not null references public.packs(id) on delete cascade,
  release_id uuid not null references public.releases(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  primary key (pack_id, release_id)
);

create table if not exists public.diecast_garage_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.brands enable row level security;
alter table public.castings enable row level security;
alter table public.releases enable row level security;
alter table public.variants enable row level security;
alter table public.packs enable row level security;
alter table public.pack_contents enable row level security;
alter table public.diecast_garage_data enable row level security;

-- Catalogue is readable by everyone, but writes are reserved for trusted server-side imports.
drop policy if exists "Public can read brands" on public.brands;
create policy "Public can read brands" on public.brands for select to anon, authenticated using (true);
drop policy if exists "Public can read castings" on public.castings;
create policy "Public can read castings" on public.castings for select to anon, authenticated using (true);
drop policy if exists "Public can read releases" on public.releases;
create policy "Public can read releases" on public.releases for select to anon, authenticated using (true);
drop policy if exists "Public can read variants" on public.variants;
create policy "Public can read variants" on public.variants for select to anon, authenticated using (true);
drop policy if exists "Public can read packs" on public.packs;
create policy "Public can read packs" on public.packs for select to anon, authenticated using (true);
drop policy if exists "Public can read pack contents" on public.pack_contents;
create policy "Public can read pack contents" on public.pack_contents for select to anon, authenticated using (true);

-- Each signed-in user can read and write only their own collection/wishlist payload.
drop policy if exists "Users can read their own Diecast Garage data" on public.diecast_garage_data;
create policy "Users can read their own Diecast Garage data" on public.diecast_garage_data
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert their own Diecast Garage data" on public.diecast_garage_data;
create policy "Users can insert their own Diecast Garage data" on public.diecast_garage_data
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own Diecast Garage data" on public.diecast_garage_data;
create policy "Users can update their own Diecast Garage data" on public.diecast_garage_data
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists castings_name_idx on public.castings using gin (to_tsvector('simple', name));
create index if not exists releases_year_idx on public.releases (release_year);
create index if not exists releases_casting_idx on public.releases (casting_id);
create index if not exists variants_release_idx on public.variants (release_id);


-- Optional normalized collection tables for the next app integration step.
-- The existing JSON payload table remains available for backward-compatible v1 sync.

create table if not exists public.user_garage_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_item_id text not null default gen_random_uuid()::text,
  release_id uuid references public.releases(id) on delete set null,
  casting_id uuid references public.castings(id) on delete set null,
  custom_name text,
  condition text,
  purchase_date date,
  purchase_price numeric(10,2),
  purchase_currency text default 'PLN',
  notes text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (release_id is not null or casting_id is not null or custom_name is not null)
);

create table if not exists public.user_wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_item_id text not null default gen_random_uuid()::text,
  release_id uuid references public.releases(id) on delete cascade,
  casting_id uuid references public.castings(id) on delete cascade,
  custom_name text,
  priority smallint not null default 0 check (priority between 0 and 5),
  target_price numeric(10,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (release_id is not null or casting_id is not null or custom_name is not null)
);

alter table public.user_garage_items enable row level security;
alter table public.user_wishlist_items enable row level security;

drop policy if exists "Users manage only their own garage items" on public.user_garage_items;
create policy "Users manage only their own garage items" on public.user_garage_items
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage only their own wishlist items" on public.user_wishlist_items;
create policy "Users manage only their own wishlist items" on public.user_wishlist_items
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_garage_items_user_idx on public.user_garage_items (user_id);
create index if not exists user_wishlist_items_user_idx on public.user_wishlist_items (user_id);


-- Stable client-side IDs allow safe upserts when the UI is migrated to normalized sync.
-- These ALTERs also make this schema safe to re-run on projects created with an earlier draft.
alter table public.user_garage_items
  add column if not exists client_item_id text not null default gen_random_uuid()::text;
alter table public.user_wishlist_items
  add column if not exists client_item_id text not null default gen_random_uuid()::text;
alter table public.user_wishlist_items
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists user_garage_items_client_item_idx
  on public.user_garage_items (user_id, client_item_id);
create unique index if not exists user_wishlist_items_client_item_idx
  on public.user_wishlist_items (user_id, client_item_id);

-- Private photo bucket used by the current browser app. Object paths must start with the
-- authenticated user's UUID: <auth.uid()>/<generated-file-name>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'diecast-photos',
  'diecast-photos',
  false,
  12582912,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users read own Diecast Garage photos" on storage.objects;
create policy "Users read own Diecast Garage photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'diecast-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload own Diecast Garage photos" on storage.objects;
create policy "Users upload own Diecast Garage photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'diecast-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own Diecast Garage photos" on storage.objects;
create policy "Users update own Diecast Garage photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'diecast-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'diecast-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own Diecast Garage photos" on storage.objects;
create policy "Users delete own Diecast Garage photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'diecast-photos' and (storage.foldername(name))[1] = auth.uid()::text);
