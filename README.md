# Diecast Garage

Private collector experience for Hot Wheels / diecast models. Current application baseline: **v1.59**.

## Live app

**https://kacperrogowski98.github.io/diecast-garage/**

The app is published through GitHub Pages. The Mac does not need to stay on: the site is hosted in the cloud and can be opened on desktop or phone. It is a static PWA shell; collection data remains local until the user configures Supabase and signs in.

## Current capabilities

- Responsive single-page collector app (index.html) with Garage, Catalogue, Wishlist, Racing, Brands and Multipacks views.
- Add/edit owned models, wishlist entries, multiple copies, purchase details, notes and photos.
- Add, edit and delete custom multipacks with year, pack type, code, model list and notes; built-in multipack coverage currently includes 564 pack records / 2,817 vehicle entries, with source and verification status retained.
- Link pack contents to catalogue castings through conservative unique exact-name matching; ambiguous and unmatched entries remain clearly marked.
- Local collection persistence in browser storage, catalogue persistence in IndexedDB.
- Backup export/import in JSON.
- PWA manifest, service worker and app icons for installation on supported phones/desktops.
- Automated Chromium smoke test covering PWA/offline behavior, online catalogue import, Mainline/Premium/Silver Series filtering, sorting, search, details, adding a car to the garage and creating, editing and deleting a custom multipack.
- Mocked Supabase browser test covering atomic cloud push, normalized pull and stale-write conflict handling. This does not replace validation against a live Supabase project.
- Optional Supabase Auth and manual collection sync. When the atomic sync migration is applied, one transaction updates the compatibility JSON snapshot and normalized garage/wishlist rows, with stale-write protection; older projects retain a clearly reported legacy fallback.
- Private photo upload/download through the diecast-photos Supabase Storage bucket (requires correct bucket and policies).
- Online catalogue index import from danyjoy/diecastDb (approximately 17,800 Mainline, Premium and Silver Series release records according to upstream documentation). The index is fetched automatically on first launch, cached locally in IndexedDB and refreshed weekly; full records are enriched lazily from year/assortment files.
- Combined catalogue filters for vehicle class, year, brand and assortment (Mainline / Premium / Silver Series), plus sorting by name, release year and brand.
- Review and manually override heuristic vehicle classifications; user corrections are preserved separately from source catalogue data.
- Automatic catalogue refresh every seven days, matching the upstream weekly data refresh; cached records remain usable if the network is unavailable.
- Manual JSON and folder import adapters for danyjoy/diecastDb and pvwnthem/Hotwheels-Data.

## Important current limitations

- The online index is a broad release-level catalogue: upstream coverage is Mainline 1968–2027, Premium 2012–2027 and Silver Series 2009 plus 2012–2027 (about 17,800 releases). This is distinct from the 72 locally seeded casting records and the 537 built-in multipack records. It is not a fully verified global Hot Wheels database; promotional products, regional exclusives and many variants still need separate sources.
- Brand and Supercar/Hypercar classification are partly heuristic and need review. Unknown values must remain unknown; do not treat automated classifications as verified facts.
- The catalogue is currently stored per browser/device in IndexedDB. It is not yet served from the app's Supabase catalogue tables.
- Collection sync is user-triggered, not real-time/background. Atomic normalized sync requires applying `supabase/migrations/20261118_atomic_collection_sync.sql` in the connected Supabase project; until then, the app falls back to the legacy JSON snapshot.
- Manual iOS/Android installation and real Supabase cross-device sync validation are still required; automated and mocked browser tests do not replace those checks.
- Supabase configuration must be entered separately on each device. Only the public anon/publishable key belongs in the browser; never expose a service-role key.

## Repository structure

- index.html — application.
- manifest.webmanifest, sw.js, icon.svg, icon-192.png — PWA shell.
- .github/workflows/pages.yml — GitHub Pages deployment.
- supabase/schema.sql — full database schema, RLS policies and atomic sync RPC.
- supabase/migrations/ — incremental SQL migrations for existing Supabase projects.
- supabase/verify_sync_setup.sql — read-only checks for the Supabase sync setup.
- docs/SUPABASE_SETUP.md — step-by-step setup for a real Supabase project.
- docs/MULTIPACK_IMPORT_SPEC.md — multipack catalogue data model, source review and import rules.
- docs/ — catalogue, sync, deployment and implementation notes.

## Catalogue sources and provenance

- danyjoy/diecastDb — structured year-based Mainline, Premium and Silver Series records; its README identifies findmyhw.com as its upstream public data source.
- pvwnthem/Hotwheels-Data — secondary enrichment/import source.

Data fields, images and trademarks belong to their respective rights holders. The app is an unofficial fan-made collector tool and does not claim ownership or affiliation with Mattel. Retain source provenance and respect upstream terms and takedown requests.

## Security

The repository is public, so source code is visible. User collection rows are not stored in GitHub; they are local to the browser or held in Supabase under user-scoped RLS. Never commit credentials or Supabase service-role keys. The security of the backend depends on correctly applying the SQL policies and Storage policies in the user's Supabase project.

## Next implementation steps

1. Complete manual iOS/Android installation checks and validate the app against the live deployment.
2. Validate the upstream index mapping and data counts, including brand inference and classification edge cases.
3. Improve catalogue normalization/deduplication and pack/variant coverage without inventing missing records.
4. Create/connect the real Supabase project, apply schema.sql (or the incremental migration on an existing project), run verify_sync_setup.sql and validate normalized sync on two devices/accounts.
5. Validate Auth, RLS, Storage policies and cross-device behavior on phone and desktop.
