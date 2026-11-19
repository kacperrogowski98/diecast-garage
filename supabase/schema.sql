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


-- Explicit read grants for the shared public catalogue; policies still prohibit writes.
grant select on public.brands, public.castings, public.releases, public.variants, public.packs, public.pack_contents to anon, authenticated;

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


-- Atomic cloud sync for Diecast Garage.
-- Apply once in Supabase SQL Editor. Safe to re-run.

alter table public.user_garage_items
  add column if not exists item_data jsonb not null default '{}'::jsonb;
alter table public.user_wishlist_items
  add column if not exists item_data jsonb not null default '{}'::jsonb;

create or replace function public.sync_diecast_garage(
  p_payload jsonb,
  p_items jsonb,
  p_expected_updated_at timestamptz default null
)
returns table(updated_at timestamptz, garage_count integer, wishlist_count integer)
language plpgsql
security invoker
set search_path = public
as $
declare
  v_user_id uuid := auth.uid();
  v_current timestamptz;
  v_now timestamptz := clock_timestamp();
  v_garage_ids text[];
  v_wishlist_ids text[];
  v_garage_count integer := 0;
  v_wishlist_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if jsonb_typeof(p_payload) <> 'object' or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Invalid Diecast Garage sync payload' using errcode = '22023';
  end if;

  -- Serialize writes per account and compare the exact snapshot version.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  select d.updated_at into v_current
  from public.diecast_garage_data d
  where d.user_id = v_user_id
  for update;

  if v_current is distinct from p_expected_updated_at then
    raise exception 'SYNC_CONFLICT: cloud collection changed since it was read'
      using errcode = '40001';
  end if;

  insert into public.diecast_garage_data(user_id, payload, updated_at)
  values (v_user_id, p_payload, v_now)
  on conflict (user_id) do update
    set payload = excluded.payload,
        updated_at = excluded.updated_at;

  select coalesce(array_agg(x.item->>'collectionId'), array[]::text[])
  into v_garage_ids
  from jsonb_array_elements(p_items) as x(item)
  where x.item->>'status' = 'owned'
    and nullif(x.item->>'collectionId', '') is not null;

  select coalesce(array_agg(x.item->>'collectionId'), array[]::text[])
  into v_wishlist_ids
  from jsonb_array_elements(p_items) as x(item)
  where x.item->>'status' = 'wishlist'
    and nullif(x.item->>'collectionId', '') is not null;

  insert into public.user_garage_items(
    user_id, client_item_id, custom_name, condition, purchase_date,
    purchase_price, purchase_currency, notes, photo_url, item_data, updated_at
  )
  select
    v_user_id,
    x.item->>'collectionId',
    coalesce(x.item->'modelSnapshot'->>'canonical_name', x.item->>'name', 'Hot Wheels model'),
    x.item->>'condition',
    nullif(x.item->>'date', '')::date,
    case
      when coalesce(x.item->>'price', '') ~ '^[0-9]+([.][0-9]{1,2})?
      then (x.item->>'price')::numeric
      else null
    end,
    'PLN',
    x.item->>'notes',
    x.item->>'photo',
    x.item,
    v_now
  from jsonb_array_elements(p_items) as x(item)
  where x.item->>'status' = 'owned'
    and nullif(x.item->>'collectionId', '') is not null
  on conflict (user_id, client_item_id) do update set
    custom_name = excluded.custom_name,
    condition = excluded.condition,
    purchase_date = excluded.purchase_date,
    purchase_price = excluded.purchase_price,
    purchase_currency = excluded.purchase_currency,
    notes = excluded.notes,
    photo_url = excluded.photo_url,
    item_data = excluded.item_data,
    updated_at = excluded.updated_at;

  get diagnostics v_garage_count = row_count;

  insert into public.user_wishlist_items(
    user_id, client_item_id, custom_name, priority, target_price, notes, item_data, updated_at
  )
  select
    v_user_id,
    x.item->>'collectionId',
    coalesce(x.item->'modelSnapshot'->>'canonical_name', x.item->>'name', 'Hot Wheels model'),
    greatest(0, least(5, coalesce(nullif(x.item->>'priority', '')::smallint, 0))),
    case
      when coalesce(x.item->>'targetPrice', x.item->>'price', '') ~ '^[0-9]+([.][0-9]{1,2})?
      then coalesce(x.item->>'targetPrice', x.item->>'price')::numeric
      else null
    end,
    x.item->>'notes',
    x.item,
    v_now
  from jsonb_array_elements(p_items) as x(item)
  where x.item->>'status' = 'wishlist'
    and nullif(x.item->>'collectionId', '') is not null
  on conflict (user_id, client_item_id) do update set
    custom_name = excluded.custom_name,
    priority = excluded.priority,
    target_price = excluded.target_price,
    notes = excluded.notes,
    item_data = excluded.item_data,
    updated_at = excluded.updated_at;

  get diagnostics v_wishlist_count = row_count;

  delete from public.user_garage_items g
  where g.user_id = v_user_id
    and not (g.client_item_id = any(v_garage_ids));

  delete from public.user_wishlist_items w
  where w.user_id = v_user_id
    and not (w.client_item_id = any(v_wishlist_ids));

  return query select v_now, v_garage_count, v_wishlist_count;
end;
$;

revoke all on function public.sync_diecast_garage(jsonb, jsonb, timestamptz) from public, anon;
grant execute on function public.sync_diecast_garage(jsonb, jsonb, timestamptz) to authenticated;


-- Explicit table privileges are required by the SECURITY INVOKER RPC.
-- RLS still restricts every row to auth.uid() = user_id.
grant select, insert, update on public.diecast_garage_data to authenticated;
grant select, insert, update, delete on public.user_garage_items to authenticated;
grant select, insert, update, delete on public.user_wishlist_items to authenticated;
