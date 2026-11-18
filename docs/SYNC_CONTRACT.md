# Collection sync contract

## User-owned data

The personal collection is private and scoped to the authenticated Supabase user.

- user_garage_items: owned cars, condition, purchase details, notes and optional photo path.
- user_wishlist_items: wanted cars, priority, target price and notes.
- diecast_garage_data: legacy v1.5 JSON snapshot used by the current app's manual push/pull flow.

The normalized tables now include a stable client_item_id per user and updated_at fields so a future client can safely upsert and detect concurrent edits. The current v1.5 interface has not yet migrated to those tables.

## Current v1.5 behavior

1. Local edits are saved to browser localStorage.
2. Catalogue releases are cached separately in IndexedDB.
3. The user explicitly pushes a complete JSON snapshot to diecast_garage_data.
4. A second device explicitly pulls that snapshot and replaces its local state after a confirmation prompt.
5. Photos are uploaded to the private diecast-photos bucket before the JSON snapshot is written; the payload stores a user-scoped storage path.
6. The UI does not yet perform automatic background sync or item-level conflict resolution.

A push overwrites the user's previous cloud snapshot. The app warns the user to use backups and does not merge simultaneous edits. Do not describe this as real-time synchronization.

## Target normalized sync behavior

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
