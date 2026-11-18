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
as $$
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
      when coalesce(x.item->>'price', '') ~ '^[0-9]+([.][0-9]{1,2})?$'
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
      when coalesce(x.item->>'targetPrice', x.item->>'price', '') ~ '^[0-9]+([.][0-9]{1,2})?$'
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
$$;

revoke all on function public.sync_diecast_garage(jsonb, jsonb, timestamptz) from public, anon;
grant execute on function public.sync_diecast_garage(jsonb, jsonb, timestamptz) to authenticated;
