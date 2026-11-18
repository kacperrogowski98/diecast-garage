# Diecast Garage

Private collector experience for Hot Wheels / diecast models. Current application baseline: **v1.5**.

## Live app

**https://kacperrogowski98.github.io/diecast-garage/**

The app is published through GitHub Pages. The Mac does not need to stay on: the site is hosted in the cloud and can be opened on desktop or phone. It is a static PWA shell; collection data remains local until the user configures Supabase and signs in.

## Current capabilities

- Responsive single-page collector app (index.html) with Garage, Catalogue, Wishlist, Racing, Brands and Multipacks views.
- Add/edit owned models, wishlist entries, multiple copies, purchase details, notes and photos.
- Local collection persistence in browser storage, catalogue persistence in IndexedDB.
- Backup export/import in JSON.
- PWA manifest, service worker and app icons for installation on supported phones/desktops.
- Optional Supabase Auth and manual collection sync through the legacy diecast_garage_data JSON payload table.
- Private photo upload/download through the diecast-photos Supabase Storage bucket (requires correct bucket and policies).
- Online catalogue index import from danyjoy/diecastDb (approximately 17,800 Mainline, Premium and Silver Series records according to its upstream documentation). The index is fetched by the browser and cached locally in IndexedDB; full details are loaded lazily from year/assortment files.
- Manual JSON and folder import adapters for danyjoy/diecastDb and pvwnthem/Hotwheels-Data.

## Important current limitations

- The online index is a broad release-level catalogue, not a fully verified global Hot Wheels database. It covers the upstream dataset's collections and years; it does not mean every Hot Wheels product, multipack or variant worldwide is represented.
- Brand and Supercar/Hypercar classification are partly heuristic and need review. Unknown values must remain unknown; do not treat automated classifications as verified facts.
- The catalogue is currently stored per browser/device in IndexedDB. It is not yet served from the app's Supabase catalogue tables.
- Collection sync is manual push/pull using the legacy JSON table. The normalized user_garage_items and user_wishlist_items tables exist in SQL but are not yet used by the v1.5 UI. Automatic background sync is not implemented.
- Browser end-to-end testing on iOS/Android and real cross-device sync validation are still required.
- Supabase configuration must be entered separately on each device. Only the public anon/publishable key belongs in the browser; never expose a service-role key.

## Repository structure

- index.html — application.
- manifest.webmanifest, sw.js, icon.svg, icon-192.png — PWA shell.
- .github/workflows/pages.yml — GitHub Pages deployment.
- supabase/schema.sql — database schema and RLS policies.
- docs/ — catalogue, sync, deployment and implementation notes.

## Catalogue sources and provenance

- danyjoy/diecastDb — structured year-based Mainline, Premium and Silver Series records; its README identifies findmyhw.com as its upstream public data source.
- pvwnthem/Hotwheels-Data — secondary enrichment/import source.

Data fields, images and trademarks belong to their respective rights holders. The app is an unofficial fan-made collector tool and does not claim ownership or affiliation with Mattel. Retain source provenance and respect upstream terms and takedown requests.

## Security

The repository is public, so source code is visible. User collection rows are not stored in GitHub; they are local to the browser or held in Supabase under user-scoped RLS. Never commit credentials or Supabase service-role keys. The security of the backend depends on correctly applying the SQL policies and Storage policies in the user's Supabase project.

## Next implementation steps

1. Run automated checks and browser smoke tests against the live deployment.
2. Validate the upstream index mapping and data counts, including brand inference and classification edge cases.
3. Improve catalogue normalization/deduplication and pack/variant coverage without inventing missing records.
4. Migrate app collection UI to normalized Supabase tables and implement safer conflict-aware sync.
5. Validate Auth, RLS, Storage policies and cross-device behavior on phone and desktop.
