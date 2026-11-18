# Changelog

## v1.7 — 18 November 2026

- Added atomic Supabase sync RPC for the compatibility snapshot plus normalized garage/wishlist rows.
- Added per-account write serialization and stale-snapshot conflict rejection.
- Preserved complete item data and private photo paths in normalized JSONB records.
- Added a legacy JSON fallback for projects that have not applied the atomic sync migration.
- Added direct migration instructions and a read-only Supabase setup verification script.
- Added edit support for user-created multipacks.
- Expanded Chromium smoke coverage to create, edit and delete a custom multipack.
- Bumped the PWA shell cache to v1.7.0.
