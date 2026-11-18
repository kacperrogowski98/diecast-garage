# Implementation roadmap

## Current baseline

- [x] Single-file v1.5 app committed as index.html.
- [x] PWA manifest, service worker and app icons committed.
- [x] GitHub Pages configured for GitHub Actions.
- [x] Successful live deployment: https://kacperrogowski98.github.io/diecast-garage/
- [x] Local browser persistence for collection and IndexedDB catalogue.
- [x] Optional Supabase Auth and manual JSON-payload collection sync in the UI.
- [x] Optional private photo upload/download flow in the UI.
- [x] Online scan-index importer for the upstream diecastDb catalogue.
- [ ] Verify live app boot and primary flows in desktop/mobile browsers.
- [ ] Validate the online catalogue mapping against upstream scan-index and year files.
- [ ] Improve casting/release/variant deduplication and data provenance.
- [ ] Expand multipack catalogue beyond the current Ferrari seed.
- [ ] Migrate the collection UI from legacy JSON payload sync to normalized Supabase garage/wishlist tables.
- [ ] Add conflict-aware automatic or user-triggered incremental sync.
- [ ] Apply and test Supabase Storage policies and verify photo access is private.
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
