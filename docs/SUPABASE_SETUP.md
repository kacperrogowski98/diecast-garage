# Supabase setup for Diecast Garage

This guide connects the hosted app to a real Supabase project. The repository does not contain a live Supabase project or any credentials.

## 1. Create a project

1. Sign in to [Supabase](https://supabase.com/).
2. Create a new project for Diecast Garage.
3. Choose an EU region close to Poland (for example, Central Europe / Frankfurt if offered).
4. Set a strong database password and keep it in a password manager. It is not used in the browser app.

## 2. Create the database schema

For a brand-new project:

1. Open **SQL Editor** in the Supabase dashboard.
2. Open [supabase/schema.sql](../supabase/schema.sql) from this repository.
3. Copy the complete SQL file into a new SQL query and run it.
4. Wait for the query to finish without errors.

The full schema includes the atomic sync RPC, user-owned collection tables, row-level security (RLS) policies and the private diecast-photos Storage bucket.

If a project already has the original Diecast Garage schema, do not rerun a partial setup by guesswork. Apply [the atomic sync migration](../supabase/migrations/20261118_atomic_collection_sync.sql) after the original schema.

## 3. Verify database and security setup

1. Open [supabase/verify_sync_setup.sql](../supabase/verify_sync_setup.sql).
2. Run it in SQL Editor.
3. Confirm that:
   - both normalized item tables have client_item_id, item_data and updated_at;
   - sync_diecast_garage exists and authenticated users can execute it;
   - RLS is enabled on all three user-owned tables;
   - the diecast-photos bucket exists with public = false.

Do not disable RLS to make an error disappear. Fix the relevant policy instead.

## 4. Configure Auth

1. Open **Authentication → Providers** and make sure Email/password sign-in is enabled.
2. Open **Authentication → URL Configuration**.
3. Set the Site URL to:

   https://kacperrogowski98.github.io/diecast-garage/

4. Add the same URL to the allowed redirect URLs if the dashboard requires it.
5. Keep email confirmation enabled if you want verified email addresses. After signing up in the app, open the confirmation email before signing in.

## 5. Connect the app

1. Open [Diecast Garage](https://kacperrogowski98.github.io/diecast-garage/).
2. Open **Konto / synchronizacja**.
3. In Supabase **Project Settings → API** (or **Data API / API Keys**, depending on dashboard version), copy the Project URL and the public anon key or publishable key.
4. Paste those two public values into the app and choose **Zapisz i połącz**.
5. Create your account, confirm the email if required, then sign in.

Only the public anon/publishable key belongs in the browser. Never paste the database password, an sb_secret_ key or a service_role key into the app or commit them to GitHub.

## 6. First sync and second device

1. On the device containing the collection you want to keep, export a JSON backup first.
2. Sign in and choose **Wyślij tę kolekcję do chmury**.
3. On the second device, open the same app, enter the same Project URL and public key, then sign in to the same account.
4. Choose **Pobierz kolekcję z chmury**. This replaces local collection data on that device, so export a local backup first.
5. Make a small test change on the second device, push it, then pull on the first device.

If the app reports a cloud conflict, do not keep retrying the push. Pull the latest cloud copy, reconcile any local changes, and then push again.

## 7. Security and limitations

- The GitHub repository is public; do not commit credentials or personal collection backups.
- User data is protected by RLS and is not stored in the repository.
- The photo bucket must remain private. Object paths are scoped to the authenticated user's ID.
- Sync is manual, not real-time or background.
- The browser-based mocked sync test checks client behavior only. It does not replace testing against the real Supabase project, two accounts, two devices and private photo storage.
