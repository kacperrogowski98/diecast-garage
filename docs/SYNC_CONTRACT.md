# Collection sync contract

## User-owned data

- `user_garage_items`: owned cars, condition, purchase details, notes, private photo path and complete `item_data` JSON.
- `user_wishlist_items`: wanted cars, priority, target price, notes and complete `item_data` JSON.
- `diecast_garage_data`: compatibility snapshot containing the full app state, including custom models, multipacks, overrides and other settings.

## Current sync behavior

1. Local edits are saved to browser localStorage.
2. Catalogue releases are cached separately in IndexedDB.
3. The user explicitly pushes the collection. When the atomic migration is installed, the `sync_diecast_garage` RPC writes the compatibility snapshot and normalized garage/wishlist rows in one database transaction.
4. The RPC serializes writes per account, compares the exact cloud `updated_at` value, and rejects stale writes with a conflict error. It also removes normalized rows deleted locally.
5. A second device explicitly pulls the compatibility snapshot and normalized rows. When normalized records exist, they are used as the source for garage and wishlist items; the remaining app state comes from the snapshot.
6. Photos are uploaded to the private `diecast-photos` bucket before sync. Item JSON stores only the user-scoped storage path, not the image data URL.
7. If the atomic migration is not installed, the app falls back to legacy JSON snapshot sync and reports that the safer normalized mode is unavailable.
8. Sync is user-triggered. It is not real-time or automatic background sync.

## Setup

- New Supabase project: apply `supabase/schema.sql`.
- Existing project: apply `supabase/migrations/20261118_atomic_collection_sync.sql` after the original schema.
- Configure the app with the Supabase Project URL and public anon/publishable key.
- Never place a service-role key in the browser.
- Keep RLS enabled and the photo bucket private.

## Remaining validation

1. Apply the migration in the actual Supabase project.
2. Test push and pull with two devices using the same account.
3. Test two separate accounts to confirm RLS prevents cross-account access.
4. Test conflict rejection by editing the same account from two devices before either device syncs.
5. Test photo upload, pull, replacement and deletion.
6. Consider automatic sync only after the manual conflict flow is proven reliable.

