# Diecast Garage

Private collector experience for Hot Wheels / diecast models. Current application baseline: **v1.96**.

## Live app

**https://kacperrogowski98.github.io/diecast-garage/**

The app is published through GitHub Pages. The Mac does not need to stay on: the site is hosted in the cloud and can be opened on desktop or phone. It is a static PWA shell; collection data remains local until the user configures Supabase and signs in.

## Current capabilities

- Interactive 3D garage preview for individual releases, with colour-aware procedural car body, touch/mouse orbit and locally persisted per-release GLB models (up to 25 MB each, stored in IndexedDB). It is **not** a verified 3D scan of any particular Hot Wheels release. Locally stored GLB files can now be exported and moved manually to another device.
- Three-zone 3D collector showroom (Supercars, Racing, Other) with up to four owned vehicles per zone and page controls. Visual representations are generic; multiple exact diecast meshes are not yet included.
- Multipack-specific 3D showroom launched from each set's details, depicting up to 12 documented contents on a common stage. Body silhouettes vary across hypercars, sports cars and tall vehicles, but remain illustrative rather than true Hot Wheels scans.
- Three.js and GLB import dependencies are bundled into the published `viewer3d.js` using esbuild; browser runtime does not require remote CDN and the PWA caches the bundled viewer for offline use.
- Responsive single-page collector app (index.html) with Garage, Catalogue, Wishlist, Racing, Brands and Multipacks views. On a fresh collection the catalogue opens first; returning collectors with owned cars see their garage.
- Add/edit owned models, wishlist entries, multiple copies, purchase details, notes and photos.
- Search multipacks by set name, catalogue code, year or a vehicle inside the pack; filter by year and page through 36 cards at a time.
- Separate multipack wishlist, backed up and included in cloud collection snapshots; a purchased pack leaves its wishlist automatically. Pack cards and details show how many casting families from the pack are already owned, while warning that exact colour/year release matching is unverified.
- Unified Wishlist screen now includes wanted 5-packs/multipacks as well as individual cars, with direct details and acquisition actions.
- A missing multipack archive is retried on its own without fetching 57k vehicle records again; automated checks cover the standalone pack importer and cached-data fallback.
- Pack details distinguish an owned exactly matched release from ownership of a casting family.
- Add, edit and delete custom multipacks with year, pack type, code, model list and notes; built-in multipack coverage currently includes 663 pack records / 3,312 vehicle entries, with source and verification status retained.
- Wiki v6's documented pack containers are also bundled as a separate compressed archive, imported to their own IndexedDB store and shown in the multipack search and model details. The number depends on the completed upstream extraction.
- Link pack contents to catalogue castings through conservative unique exact-name matching; ambiguous and unmatched entries remain clearly marked.
- Show catalogue-sourced representative car photographs within pack contents where a linked casting/unique name has an image, explicitly labelled as illustrative rather than the verified exact colour variant.
- Filter packs to 5-packs only and switch between seed, Wiki v6 and user-created pack sources.
- Filter multipacks by ownership (in garage vs still missing); conservative toy/year/color matching now explicitly separates exact variant candidates from generic casting-family matches.
- Front and back packaging photos can be attached to each owned multipack, resized in the browser and included in collection backups.
- Show matching multipack appearances inside each model's details (name-family matches only; colours and exact releases may differ).
- Open prefilled Hot Wheels searches on Allegro and eBay from any model detail; these links do not claim live stock, price or exact variant availability.
- Local collection persistence in browser storage, catalogue persistence in IndexedDB. Catalogue rendering caches prepared models and debounces search for larger databases.
- Compressed Wiki v6 releases now import by streaming JSONL in chunks of 750 releases to limit peak RAM on iPhone. A successful full import writes a completion receipt; interrupted imports are retried daily rather than being incorrectly treated as finished for a month. Database write failures are fatal rather than silently reported as successful. The CI suite includes a 10k-row streaming stress test.
- Backup export/import in JSON.
- PWA manifest, service worker and app icons for installation on supported phones/desktops. The service worker uses network-first HTML updates and cached offline fallback.
- Deployment workflow includes JavaScript/PWA validation, catalogue normalization tests and a mobile Chromium smoke flow (`node scripts/validate-app.mjs`, `node scripts/test-catalog.mjs`, `node scripts/browser-smoke.mjs`) before publishing.
- Automated Chromium smoke test covering PWA/offline behavior, online catalogue import, Mainline/Premium/Silver Series filtering, sorting, search, details, adding a car to the garage and creating, editing and deleting a custom multipack.
- Mocked Supabase browser test covering atomic cloud push, normalized pull and stale-write conflict handling. This does not replace validation against a live Supabase project.
- Optional Supabase Auth and manual collection sync. When the atomic sync migration is applied, one transaction updates the compatibility JSON snapshot and normalized garage/wishlist rows, with stale-write protection; older projects retain a clearly reported legacy fallback.
- Private photo upload/download through the diecast-photos Supabase Storage bucket (requires correct bucket and policies).
- Online catalogue index import from danyjoy/diecastDb (approximately 17,800 Mainline, Premium and Silver Series release records according to upstream documentation). The index is fetched automatically on first launch, cached locally in IndexedDB and refreshed weekly; full records are enriched lazily from year/assortment files.
- Combined catalogue filters for vehicle class, TH/STH rarity (only when marked in source), year, brand and assortment (Mainline / Premium / Silver Series), plus sorting by name, release year and brand.
- Catalogue ownership filters distinguish exact releases already owned, missing or on the wishlist; an owned casting alone does not incorrectly mark every colour/year variant as collected.
- Optional authenticated GLB synchronization uses a separate private Supabase Storage bucket (`diecast-models`), user-scoped by RLS; requires the 2026-11-20 SQL migration and live account setup.
- Bulk transfer of private 3D GLB files from the cloud panel. A bulk upload never overwrites existing remote GLB data; downloads add only missing local files, and per-model replacement requires confirmation.
- Indexed release lookup avoids a full multi-thousand-record scan for each garage or wishlist item, improving large collections on mobile.
- Review and manually override heuristic vehicle classifications; user corrections are preserved separately from source catalogue data.
- Automatic catalogue refresh every seven days, matching the upstream weekly data refresh; cached records remain usable if the network is unavailable.
- Manual JSON and folder import adapters for danyjoy/diecastDb and pvwnthem/Hotwheels-Data.
- The app fetches the additional Hot Wheels Wiki-derived historical archive (1974–2023) automatically on first launch, with a manual import button available for retries. Cross-source duplicate release matching is not yet fully verified, so archive records are identified by source.

## Important current limitations

- The online index is a broad release-level catalogue: upstream coverage is Mainline 1968–2027, Premium 2012–2027 and Silver Series 2009 plus 2012–2027 (about 17,800 releases). This is distinct from the 72 locally seeded casting records and the 663 built-in multipack records. It is not a fully verified global Hot Wheels database; promotional products, regional exclusives and many variants still need separate sources.
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

## Verified packaged Wiki v6 snapshot (20 November 2026)

The generated `catalog/wiki-stats.json` currently confirms **57,348 release/product rows and 859 pack rows**, together with compressed assets. These are source-documented records, not a deduplicated census of every Hot Wheels on Earth, and not a guarantee that each row is a car. The CI workflow now validates the compressed streams against this manifest before publishing.

## Full Wiki v6 catalogue pipeline

- `.github/workflows/wiki-catalog.yml` rebuilds the approximately 57,000-release Wiki v6 source via the documented MediaWiki API and upstream open-source parser, on the first workflow-file push, manually, and monthly.
- Successful jobs verify a minimum row count, publish `catalog/wiki-v6.jsonl.gz` and deploy Pages directly. This direct deployment is necessary because commits made using `GITHUB_TOKEN` do not automatically trigger another workflow.
- On app launch, the optional prebuilt compressed dataset is imported to IndexedDB if not already present. The app retries a missing archive after 24 hours and refreshes successfully loaded data every 30 days. A `Pełne Wiki v6` button can retry the import, and the JSON importer accepts independently generated `hotwheels_db_v6.jsonl` files.
- The external source labels version records as `product_type`. The import now omits `trackset` and `pack` product rows from the vehicle list, and safely migrates older local catalogue caches to remove stale non-vehicle records, while separately importing pack containers; classifications and pack memberships are still not guaranteed exhaustive or correct. Wiki v6 records can overlap with diecastDb.
- The source project and generated data are licensed CC BY-SA 4.0, with attribution required. Photographs and trademarks may have separate rights. See https://github.com/ktrizolio/hotwheels-fandom-db for documentation.
- **Do not claim a fully loaded 57k-release database until the workflow completes and the compressed file has been verified on the deployed website.** If the Fandom API or external parser fails, the app continues with the previously available indexed catalogue.

## Catalogue completeness and interpretation

The built-in Ferrari starter set, bundled Mainline/Premium/Silver index and supplementary 1974–2023 Wiki-derived archive are **not** a guaranteed complete, fully deduplicated global history. Historical source records may overlap with index records: counts of entries are not necessarily counts of unique physical releases. Imported records remain source-labelled and classification remains heuristic unless explicitly reviewed.

For external coverage comparison (not a licence to copy or hotlink all content), independently maintained catalogues report materially larger totals. Until the physical variants, exclusives, promotional lines and regional releases are reconciled, Diecast Garage should be treated as a broad research and collection-management app rather than a definitive all-releases reference.

## Catalogue sources and provenance

- danyjoy/diecastDb — structured year-based Mainline, Premium and Silver Series records; its README identifies findmyhw.com as its upstream public data source.
- pvwnthem/Hotwheels-Data — supplementary historical archive import (1974–2023), derived from Hot Wheels Wiki community data.
- Hot Wheels Wiki community contributions are under CC BY-SA 3.0; original facts, illustrations and images can have different attribution and rights requirements.

Data fields, images and trademarks belong to their respective rights holders. The app is an unofficial fan-made collector tool and does not claim ownership or affiliation with Mattel. Retain source provenance and respect upstream terms and takedown requests.

## Security

The repository is public, so source code is visible. User collection rows are not stored in GitHub; they are local to the browser or held in Supabase under user-scoped RLS. Never commit credentials or Supabase service-role keys. The security of the backend depends on correctly applying the SQL policies and Storage policies in the user's Supabase project.

## Next implementation steps

1. Complete manual iOS/Android installation checks and validate the app against the live deployment.
2. Validate the upstream index mapping and data counts, including brand inference and classification edge cases.
3. Improve catalogue normalization/deduplication and pack/variant coverage without inventing missing records.
4. Create/connect the real Supabase project, apply schema.sql (or the incremental migration on an existing project), run verify_sync_setup.sql and validate normalized sync on two devices/accounts.
5. Validate Auth, RLS, Storage policies and cross-device behavior on phone and desktop.

## Reliability update v1.96

- A Wiki v6 import is considered complete only after all streamed batches and the final collection-state save succeed.
- Multipack matching reconciles casting families shared across Ferrari seed and Wiki/diecastDb sources, without treating a same-name match as proof of an exact release. Matching by toy code, year and body color remains conservative.
- Regression tests cover duplicate source casting IDs, cross-source 5-pack completion and failed import completion markers.
