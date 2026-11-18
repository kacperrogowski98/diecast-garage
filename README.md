# Diecast Garage

Private collector app for Hot Wheels / diecast models. Current application baseline: **v1.5**.

## Project status

This repository is the source-control home for the project. The v1.5 prototype has been validated for HTML structure, JavaScript syntax, data-adapter smoke tests and package integrity. Full browser end-to-end testing, full catalogue import, cloud sync and public hosting are still pending.

## Planned deployment

- Static HTTPS hosting (Cloudflare Pages or GitHub Pages) for phone and desktop access.
- Supabase Auth + database for private collection and wishlist sync.
- A shared catalogue import pipeline, so all devices use the same catalogue rather than separate manual imports.
- PWA installation on iOS/Android.

## Data sources

- [danyjoy/diecastDb](https://github.com/danyjoy/diecastDb)
- [pvwnthem/Hotwheels-Data](https://github.com/pvwnthem/Hotwheels-Data)

The catalogue data is third-party data and needs normalization and verification. Image URLs are referenced from their original sources; image assets are not copied into this repository.

## Security

Never commit Supabase service-role keys or other secrets. Browser apps must use only the public anon/publishable key with Row Level Security enabled.

## Next implementation steps

1. Add the v1.5 application source and PWA assets.
2. Configure the shared catalogue database and importer.
3. Configure Supabase authentication and per-user collection sync.
4. Deploy the PWA over HTTPS and test on desktop and phone.
