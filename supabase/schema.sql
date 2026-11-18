-- Diecast Garage: private per-user collection sync.
-- Run in Supabase SQL Editor. This is a starter schema, not yet connected to the app.

create table if not exists public.diecast_garage_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.diecast_garage_data enable row level security;

drop policy if exists "Users can read their own Diecast Garage data" on public.diecast_garage_data;
create policy "Users can read their own Diecast Garage data"
  on public.diecast_garage_data for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own Diecast Garage data" on public.diecast_garage_data;
create policy "Users can insert their own Diecast Garage data"
  on public.diecast_garage_data for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own Diecast Garage data" on public.diecast_garage_data;
create policy "Users can update their own Diecast Garage data"
  on public.diecast_garage_data for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No public/anon access policies. Each authenticated user can access only their own row.
