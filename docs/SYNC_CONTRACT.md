# Collection sync contract

## User-owned data
The app's personal state is private and keyed by the authenticated Supabase user:
- `user_garage_items`: owned cars, with condition, purchase information, notes and optional photo URL.
- `user_wishlist_items`: wanted cars, priority and target price.
- `diecast_garage_data`: temporary compatibility storage for the existing v1.5 JSON snapshot.

## Sync behavior to implement
1. Require sign-in before enabling cloud sync.
2. Load the current user's rows only.
3. Upsert records using stable client-generated UUIDs.
4. Track `updated_at` and show a conflict prompt if two devices edited the same item since last sync.
5. Never overwrite another user's data.
6. Keep local-only mode available if the user chooses not to sign in.
7. Do not store Supabase service-role credentials in HTML, JavaScript, PWA assets or GitHub Pages settings.

## Photo storage
Use a private Supabase Storage bucket with per-user folder policies. Store only the storage path in the row; generate signed URLs when displaying private photos.
