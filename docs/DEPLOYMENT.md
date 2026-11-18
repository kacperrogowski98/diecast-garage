# Hosting and phone access

The target is an installable PWA served over HTTPS. The Mac must not be running for the app to work.

## GitHub Pages setup

1. Open repository Settings → Pages.
2. Under Build and deployment, choose **GitHub Actions**.
3. Pushes to `main` will run `.github/workflows/pages.yml`.
4. GitHub will publish the repository root as a static site.

The workflow is prepared, but the app cannot be considered deployed until the real application entry point and all referenced assets are committed and a successful Pages deployment is visible.

## Before enabling production

- Verify the app uses relative asset paths that work under the GitHub Pages project subpath.
- Configure Supabase URL and public anon key in the app (never a service-role key).
- Apply `supabase/schema.sql` and verify Row Level Security.
- Add authentication, then test that two devices signed into the same account see the same collection.
- Confirm offline shell caching and app update behavior on iOS and Android.

## Important

A static Pages deployment does not itself provide a shared database. Supabase (or another backend) is required for cross-device collection sync and a centrally maintained catalogue.
