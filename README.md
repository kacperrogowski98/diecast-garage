# Diecast Garage

Private collector app for Hot Wheels / diecast models. Current application baseline: **v1.5**.

## Current status

- The complete v1.5 single-file application is available as `index.html`.
- PWA manifest, service worker and app icons are present at the site root.
- The original v1.5 JavaScript passes a Node syntax check.
- The app currently supports local browser storage and manual Supabase JSON-payload sync through `diecast_garage_data`.
- Normalized catalogue tables and per-user garage / wishlist tables are defined in `supabase/schema.sql`; the v1.5 UI has not yet been migrated to those normalized tables.
- Full catalogue import, browser end-to-end testing, cloud sync validation and public hosting are still pending.

## Planned deployment

- Static HTTPS hosting for phone and desktop access. The GitHub Actions Pages workflow is present in `.github/workflows/pages.yml`.
- GitHub Pages setup currently fails at the Configure Pages step. Enable Pages for this repository with **Settings → Pages → Build and deployment → Source: GitHub Actions**, if the repository plan/visibility supports it.
- If Pages cannot be enabled for this private repository, use a static host such as Cloudflare Pages without making the source repository public.
- Supabase Auth + database for private collection and wishlist sync.
- PWA installation on iOS/Android.

## Data sources

- [danyjoy/diecastDb](https://github.com/danyjoy/diecastDb)
- [pvwnthem/Hotwheels-Data](https://github.com/pvwnthem/Hotwheels-Data)

The catalogue data is third-party data and needs normalization and verification. Image URLs are referenced from their original sources; image assets are not copied into this repository.

## Security

Never commit Supabase service-role keys or other secrets. Browser apps must use only the public anon/publishable key with Row Level Security enabled.

## Next implementation steps

1. Enable/configure hosting and confirm a working HTTPS URL.
2. Run browser end-to-end checks on desktop and phone.
3. Connect the app to the normalized catalogue, garage and wishlist tables.
4. Build and validate the multi-source catalogue importer.
5. Verify authentication, RLS and cross-device synchronization.
