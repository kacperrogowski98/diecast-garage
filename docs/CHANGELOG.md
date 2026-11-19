## v1.16 — 19 November 2026

- Corrected 10 mislinked Ferrari 5-pack content rows; the 1994, 1995 and 2026 packs now each contain five correctly sourced records.
- Added regression checks for five contents per pack and source-year consistency.

## v1.15 — 19 November 2026

- Preserve every safe upstream image URL when enriching a catalogue record, instead of keeping only the first image.
- Show the complete source photo gallery in model details, with each image opening at full size.
- Reject unsafe image URL schemes in the gallery and add regression coverage for image preservation.

# Changelog

## v1.7 — 18 November 2026

- Added atomic Supabase sync RPC for the compatibility snapshot plus normalized garage/wishlist rows.
- Added per-account write serialization and stale-snapshot conflict rejection.
- Preserved complete item data and private photo paths in normalized JSONB records.
- Added a legacy JSON fallback for projects that have not applied the atomic sync migration.
- Added direct migration instructions and a read-only Supabase setup verification script.
- Expanded Chromium smoke testing to verify PWA install assets and offline shell startup.
- Added edit support for user-created multipacks.
- Expanded Chromium smoke coverage to create, edit and delete a custom multipack.
- Bumped the PWA shell cache to v1.7.0.
