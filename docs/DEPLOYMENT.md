# Hosting and phone access

The app is hosted in the cloud. The Mac does not need to be running.

## Live deployment

- App: https://kacperrogowski98.github.io/diecast-garage/
- Hosting: GitHub Pages.
- Deployment workflow: .github/workflows/pages.yml.
- Deployment is triggered by pushes to main and can also be run manually from GitHub Actions.

## PWA installation

Open the live HTTPS URL on the phone. On iPhone, use Safari → Share → Add to Home Screen. On Android, use the browser's Install app / Add to Home screen option when offered. The exact prompt varies by browser. The service worker caches the app shell; catalogue and collection persistence are handled separately by IndexedDB and local storage.

## Supabase setup still required for cloud collection sync

A static Pages deployment does not itself provide a shared database. To sync a collection between devices:

1. Create or select a Supabase project.
2. Apply supabase/schema.sql in the Supabase SQL Editor.
3. Create the private Storage bucket diecast-photos and configure owner-scoped policies for upload, download and deletion.
4. In the app, open Konto / synchronizacja and enter the Project URL and public anon/publishable key.
5. Create an account and sign in on each device with the same account.
6. Use Wyślij tę kolekcję do chmury on the source device; use Pobierz kolekcję z chmury on the other device.

The current v1.6 UI uses the legacy diecast_garage_data JSON payload table and manual push/pull. The normalized garage/wishlist tables are defined in SQL but are not yet integrated into the UI. The app does not yet provide automatic background synchronization.

## Security

- Only the public anon/publishable key belongs in browser configuration. Never use a service-role key in the frontend.
- Keep RLS enabled and test with two different user accounts to confirm each can access only their own data.
- Keep the photo bucket private and apply owner-scoped Storage policies before relying on photo sync.
- The GitHub repository is public; never commit credentials, personal backups or collection exports.

## Known limitations

- The catalogue is currently fetched from the public upstream diecastDb scan index and cached in each browser's IndexedDB. It is not yet served from the app's own Supabase catalogue tables.
- A successful Pages deployment confirms hosting, not full browser compatibility, sync correctness or catalogue completeness. Those checks remain on the roadmap.
