## v1.25 — 20 November 2026

- Multipack contents without casting IDs are now linked to the main catalogue only when normalized model names produce one unique exact match.
- Ambiguous and unmatched pack contents are explicitly labelled instead of being guessed; uniquely linked contents can now correctly reflect owned-model status.
- Added regression checks for conservative matching and visible match-status labels.

## v1.24 — 20 November 2026

- Added 2007 Exotics and 2011 HW Exotics five-packs, 10 source-linked vehicle entries from the community catalogue.
- Entries are explicitly marked for packaging-photo verification; fantasy castings remain present rather than being silently removed.

- Expanded HW Exotics 5-Pack history with 2014 (BFB36), 2015 (CDT27) and 2016 (DJD29), adding 15 vehicle entries from specialist collector references.
- Clearly marked community-sourced records for packaging-photo verification; tests confirm five entries and preserve source links per pack.

- Added the 2018 HW Exotics 5-Pack (FKT62) with five vehicles transcribed from Mattel's official announcement.
- Added regression checks for the exact contents and official source attribution.

- Expanded the source-backed HW Exotics multipack catalogue with 2017, 2019 and 2021 five-packs, adding 15 officially documented vehicle entries from Mattel announcements.
- Added automated checks for exact five-car contents and official Mattel provenance for all three new packs.

## v1.20 — 20 November 2026

- Added the 2020 HW Exotics 5-Pack with all five vehicles listed in Mattel's official announcement: Cadillac Elmiraj, Jaguar F-Type Project 7, Porsche 911 GT3 RS, McLaren F1 GTR and Aston Martin V8 Vantage.
- Added a source-backed regression check for the pack and its five contents.

## v1.19 — 20 November 2026

- Added three-source fallback for catalogue index and lazy year-file downloads (GitHub raw, jsDelivr, GitHub Pages) to reduce CDN/network failures on mobile.
- Added regression checks for the mirror fallback and brand inference across Bugatti, Porsche and Mercedes-Benz naming variants.

## v1.18 — 20 November 2026

- Improved vehicle classification precedence: explicit competition variants (GT3/GT4/GTR/GT1, Le Mans, Formula, rally and named race variants) are assigned to Racing before broad supercar model-name matches.
- Added regression tests ensuring McLaren F1 GTR is Racing while road-going McLaren F1 and Ford GT remain Supercar/Hypercar candidates.

## v1.17 — 20 November 2026

- Reviewed and corrected classification for 21 Ferrari seed castings: F50 and F50 Spider are Supercar/Hypercar; competition prototypes and Formula cars are Racing; remaining road-going classics are Sports/Exotic.
- Applied the curated classification to every linked release, so the release-level filter agrees with the casting record.
- Added regression checks for all 21 reviewed seed classifications.

## v1.16 — 19 November 2026

- Corrected 10 mislinked Ferrari 5-pack content rows; the 1994, 1995 and 2026 packs now each contain five correctly sourced records.
- Added regression checks for five contents per pack and source-year consistency.

## v1.15 — 19 November 2026

- Preserve every safe upstream image URL when enriching a catalogue record, instead of keeping only the first image.
- Show the complete source photo gallery in model details, with each image opening at full size.
- Reject unsafe image URL schemes in the gallery and add regression coverage for image preservation.

# Changelog

## v1.7 — 18 November 2026

- Added atomic Supabase sync RPC for the compatibility snapshot plus normalized garage/wishlist rows.
- Added per-account write serialization and stale-snapshot conflict rejection.
- Preserved complete item data and private photo paths in normalized JSONB records.
- Added a legacy JSON fallback for projects that have not applied the atomic sync migration.
- Added direct migration instructions and a read-only Supabase setup verification script.
- Expanded Chromium smoke testing to verify PWA install assets and offline shell startup.
- Added edit support for user-created multipacks.
- Expanded Chromium smoke coverage to create, edit and delete a custom multipack.
- Bumped the PWA shell cache to v1.7.0.
