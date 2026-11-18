# Implementation roadmap

## Current baseline
- [x] Private GitHub repository created.
- [x] Project README and initial deployment architecture.
- [x] Starter Supabase per-user collection table with RLS.
- [x] PWA manifest and service-worker shell.
- [ ] Commit the full v1.5 application source and image assets.
- [ ] Verify app boot and all primary flows in a real browser.
- [ ] Build a central, normalized multi-brand catalogue import.
- [ ] Complete Supercar / Hypercar classification and source verification.
- [ ] Add Supabase Auth and collection/wishlist sync to the app.
- [ ] Deploy to HTTPS hosting and verify install on iPhone/Android.

## Data model target
1. Casting — base model identity.
2. Release — year, series, assortment and release identifier.
3. Variant — color, tampo, wheels, country and other variation details.
4. Pack — multipack identity and included releases.
5. Brand — manufacturer / marque.
6. Classification — Supercar, Hypercar, Real Car, Fantasy, Racing or Other.
7. Provenance — source, source ID, source URL and verification status.

## Non-negotiable product requirement
The catalogue must be shared centrally. A new device should not need a separate full catalogue import. A user's collection and wishlist must sync privately across devices after sign-in.
