# Collection sync contract

## User-owned data

The personal collection is private and scoped to the authenticated Supabase user.

- user_garage_items: owned cars, condition, purchase details, notes and optional photo path.
- user_wishlist_items: wanted cars, priority, target price and notes.
- diecast_garage_data: legacy v1.5 JSON snapshot used by the current app's manual push/pull flow.

The normalized tables include a stable client_item_id per user, updated_at and item_data JSONB so complete item details (including model snapshots and private photo paths) survive sync. The app now uses the sync_diecast_garage RPC when the migration is installed. The RPC writes the compatibility snapshot and normalized garage/wishlist rows in one transaction, removes stale normalized rows, and rejects stale writes using an expected updated_at value.

## Current sync behavior

1. Local edits are saved to browser localStorage.
2. Catalogue releases are cached separately in IndexedDB.
3. The user explicitly pushes the collection. With the atomic migration installed, one RPC transaction writes the compatibility JSON snapshot plus normalized garage/wishlist rows.
4. A second device explicitly pulls the snapshot and normalized rows, preferring normalized item records, then replaces its local state after a confirmation prompt.
5. Photos are uploaded to the private diecast-photos bucket before the JSON snapshot is written; the payload stores a user-scoped storage path.
6. If the migration is not installed, the UI falls back to legacy JSON snapshot sync and clearly reports that atomic normalized sync is unavailable.\n7. Sync remains user-triggered; it is not background or real-time sync.

With the migration installed, a push uses a per-user advisory lock and exact updated_at compare-and-swap; concurrent stale writes are rejected. The client still asks the user before replacing a newer remote snapshot. Legacy fallback retains the previous best-effort guard and is not atomic. Do not describe manual sync as real-time synchronization.

## Remaining sync work

1. Require sign-in before enabling cloud sync.
2. Load only rows belonging to auth.uid().
3. Upsert using the pair (user_id, client_item_id).
4. Track updated_at and show a conflict prompt if two devices edited the same item since the last sync.
5. Never overwrite another user's data.
6. Keep local-only mode available if the user chooses not to sign in.
7. Never store Supabase service-role credentials in HTML, JavaScript, PWA assets or GitHub Pages settings.

## Photo storage

The SQL schema creates a private Supabase Storage bucket named diecast-photos and owner-scoped policies. The current app writes objects under a path beginning with the authenticated user's UUID. Keep the bucket private and test upload, download, upsert and deletion with two separate user accounts before production use.

## Credentials

Only the public anon/publishable key may be entered in the browser. RLS and Storage policies must remain enabled. A public GitHub repository must never contain personal collection backups or credentials.
