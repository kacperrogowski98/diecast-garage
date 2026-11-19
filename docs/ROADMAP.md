# Implementation roadmap

## Current baseline

- [x] Single-file v1.7 app committed as index.html.
- [x] PWA manifest, service worker and app icons committed.
- [x] GitHub Pages configured for GitHub Actions.
- [x] Successful live deployment: https://kacperrogowski98.github.io/diecast-garage/
- [x] Local browser persistence for collection and IndexedDB catalogue.
- [x] Optional Supabase Auth and manual JSON-payload collection sync in the UI.
- [x] Optional private photo upload/download flow in the UI.
- [x] Online scan-index importer for the upstream diecastDb catalogue.
- [x] Add Mainline / Premium / Silver Series filters to the imported release catalogue.
- [x] Automatically refresh the local catalogue every seven days while preserving the last successful local copy if the network is unavailable.
- [x] Allow collectors to manually review and override heuristic vehicle classifications without changing upstream source records.
- [x] Add automated Chromium smoke coverage for PWA manifest/icons, offline shell, online catalogue import, search, details, garage add and custom multipack create/edit/delete.
- [x] Add custom multipack create/edit/delete in the collector UI.
- [ ] Verify manual installation and primary flows on iOS/Android.
- [ ] Validate the online catalogue mapping against upstream scan-index and year files, including edge cases and provenance.
- [ ] Improve casting/release/variant deduplication and data provenance.
- [ ] Expand multipack catalogue beyond the current Ferrari seed.
- [x] Add atomic Supabase RPC that writes the compatibility snapshot and normalized garage/wishlist rows in one transaction, preserving complete item JSON and photos.
- [x] Add explicit SQL grants for the SECURITY INVOKER sync RPC and verification queries for those privileges.
- [x] Add mocked browser coverage for atomic push, normalized pull and stale-write conflict handling.
- [x] Add a step-by-step Supabase project setup guide and link it from the app.
- [ ] Create/connect the live Supabase project, apply schema.sql, run verify_sync_setup.sql and validate with two separate devices/accounts.
- [ ] Add conflict-aware automatic or user-triggered incremental sync.
- [ ] Apply and test Supabase Storage policies and verify photo access is private.
- [x] Validate the cached PWA shell reopens offline in Chromium.
- [ ] Validate offline behavior and PWA installation on iOS/Android.

## Data model target

1. Casting — base model identity.
2. Release — year, series, assortment and release identifier.
3. Variant — color, tampo, wheels, country and other variation details.
4. Pack — multipack identity and included releases.
5. Brand — manufacturer / marque.
6. Classification — Supercar, Hypercar, Real Car, Fantasy, Racing or Other.
7. Provenance — source, source ID, source URL and verification status.

## Non-negotiable product requirements

- The catalogue is shared and centrally maintained in the long term; a new device should not need a manual folder import.
- A user's collection and wishlist must sync privately across devices after sign-in.
- Keep source provenance and do not invent unknown years, colors, variants or pack contents.
- Keep fantasy castings in the database; classification is a filter, not a destructive import exclusion.
- Keep the Mac off: production hosting must remain cloud-hosted.
