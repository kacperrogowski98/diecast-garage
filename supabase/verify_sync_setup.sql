-- Run after applying schema.sql or 20261118_atomic_collection_sync.sql.
-- These queries inspect configuration only; they do not expose user collection data.

-- 1) Normalized item columns must include item_data and stable client IDs.
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('user_garage_items', 'user_wishlist_items')
  and column_name in ('client_item_id', 'item_data', 'updated_at')
order by table_name, column_name;

-- 2) Atomic RPC must exist and be executable by authenticated users.
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'sync_diecast_garage';

select
  has_function_privilege(
    'authenticated',
    'public.sync_diecast_garage(jsonb,jsonb,timestamptz)',
    'EXECUTE'
  ) as authenticated_can_execute_sync;

-- 3) RLS must be enabled on all user-owned tables.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('diecast_garage_data', 'user_garage_items', 'user_wishlist_items')
order by c.relname;

-- 4) Photo bucket must exist and remain private.
select id, name, public
from storage.buckets
where id = 'diecast-photos';


-- 5) Explicit SQL grants required by the SECURITY INVOKER sync RPC.
select
  has_table_privilege('authenticated', 'public.diecast_garage_data', 'SELECT') as snapshot_select,
  has_table_privilege('authenticated', 'public.diecast_garage_data', 'INSERT') as snapshot_insert,
  has_table_privilege('authenticated', 'public.diecast_garage_data', 'UPDATE') as snapshot_update,
  has_table_privilege('authenticated', 'public.user_garage_items', 'SELECT') as garage_select,
  has_table_privilege('authenticated', 'public.user_garage_items', 'INSERT') as garage_insert,
  has_table_privilege('authenticated', 'public.user_garage_items', 'UPDATE') as garage_update,
  has_table_privilege('authenticated', 'public.user_garage_items', 'DELETE') as garage_delete,
  has_table_privilege('authenticated', 'public.user_wishlist_items', 'SELECT') as wishlist_select,
  has_table_privilege('authenticated', 'public.user_wishlist_items', 'INSERT') as wishlist_insert,
  has_table_privilege('authenticated', 'public.user_wishlist_items', 'UPDATE') as wishlist_update,
  has_table_privilege('authenticated', 'public.user_wishlist_items', 'DELETE') as wishlist_delete;
