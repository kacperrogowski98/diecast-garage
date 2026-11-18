# Hosting and phone access

The app is hosted in the cloud. The Mac does not need to be running.

## Live deployment

- App: https://kacperrogowski98.github.io/diecast-garage/
- Hosting: GitHub Pages.
- Deployment workflow: `.github/workflows/pages.yml`.
- Deployment is triggered by pushes to `main`.

## PWA installation

Open the live HTTPS URL on the phone. On iPhone, use Safari → Share → Add to Home Screen. On Android, use the browser's Install app / Add to Home screen option when offered. The service worker caches the app shell; catalogue and collection persistence are handled separately by IndexedDB and local storage.

## Supabase setup

A static Pages deployment does not itself provide a shared database. To sync a collection between devices:

1. Create or select a Supabase project.
2. For a new project, apply `supabase/schema.sql` in the Supabase SQL Editor. For an existing project created from the earlier schema, apply `supabase/migrations/20261118_atomic_collection_sync.sql`.
3. In Supabase Authentication settings, add `https://kacperrogowski98.github.io/diecast-garage/` to the allowed redirect URLs.
4. In the app, open Konto / synchronizacja and enter the Project URL and public anon/publishable key.
5. Create an account and sign in on each device with the same account.
6. Use Wyślij tę kolekcję do chmury on the source device; use Pobierz kolekcję z chmury on the other device.

The photo bucket and owner-scoped Storage policies are created by `supabase/schema.sql`. Keep the bucket private. The atomic migration makes garage/wishlist sync transactional and protects against stale writes. If the migration is missing, the app reports and uses the older JSON fallback.

## Security

- Only the public anon/publishable key belongs in browser configuration. Never use a service-role key in the frontend.
- Keep RLS enabled and test with two different user accounts to confirm each can access only their own data.
- Keep the photo bucket private and apply owner-scoped Storage policies before relying on photo sync.
- The GitHub repository is public; never commit credentials, personal backups or collection exports.

## Known limitations

- The catalogue is fetched from the public upstream diecastDb scan index and cached in each browser's IndexedDB. It is not yet served from the app's own Supabase catalogue tables.
- Automated Chromium smoke tests cover catalogue import, search, details, garage add and custom multipack create/edit/delete.
- Manual iOS/Android installation, live Supabase cross-device sync, RLS isolation and private photo access still require validation.

