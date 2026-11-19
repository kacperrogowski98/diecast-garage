# Multipack catalogue importer specification

## Objective

Build a searchable, provenance-backed catalogue of Hot Wheels multipacks without treating an incomplete checklist as a complete source of truth. The first practical target is 5-packs; later coverage can include 2-, 3-, 4-, 6-, 9-, 10-, 20-packs, gift sets, and other boxed assortments.

## Candidate research sources

- [HW Collectors News Digital Car Catalog](https://catalog.hwcollectorsnews.com/Search): its search separates Castings, Sets, Series and Variations. Treat it as a strong cross-reference for pack/set identity; no supported bulk export has been confirmed.
- [South Texas Diecast 5-Pack archive](https://www.southtexasdiecast.com/hwguide/5pack.html): historical 5-pack tables from 1986 onward, with pack codes, names, years and included-car descriptions. Coverage shown on the page runs through 2018.
- [Hot Wheels Wiki 5-Packs category](https://hotwheels.fandom.com/wiki/Category:5-Packs): a community-maintained index of hundreds of pack pages and year-specific lists. Useful for discovery and cross-checking, not unquestioned ground truth.
- [Hot Wheels Wiki 5-Packs by year](https://hotwheels.fandom.com/wiki/5-Packs): yearly navigation and pack-format context.

Before any automated collection, confirm each source's current terms, licensing and permitted access method. Do not assume that a publicly viewable page grants bulk-reuse rights.

## Pack record

Each pack should preserve:

- Stable internal pack ID and original source ID/code.
- Pack name, release year (nullable), pack type and assortment/series.
- Packaging variation or regional variant, where explicitly documented.
- Source URL, source name, retrieval date and verification status.
- Front/back packaging image URLs only where use is permitted and provenance is retained.

## Ordered contents

Each content row should preserve:

- Position in the pack (1..N).
- Original source car name exactly as listed.
- Optional link to a catalogue casting/release when confidently matched.
- Match status: matched, unmatched, ambiguous or alternate_candidate.
- Source note and confidence/verification status.

Do not force an ambiguous pack-content name onto a casting. If a source says “Model A or Model B”, store alternatives rather than recording both as included cars. Do not infer color, wheels, tampo or exact release variant from a generic car name.

## Import and QA workflow

1. Create a candidate pack from a source page and preserve the raw source wording.
2. Normalize the pack identity while retaining the original name and code.
3. Parse included cars into ordered content rows.
4. Match contents against the release catalogue only when the name/year evidence is sufficient.
5. Cross-check pack code, year and contents against packaging photos or an independent source.
6. Mark unresolved or conflicting facts for review; never fill gaps by guessing.
7. Re-run imports idempotently using source ID + pack variant as the natural key.
8. Report candidate packs, verified packs, ambiguous contents, duplicate keys and unmatched car names.

## Scope and current state

The app currently supports collector-created custom multipacks, but it does not yet contain a comprehensive verified public multipack catalogue. Existing seed data is limited. The sources above are research references; no bulk pack import has been performed.

## Suggested rollout

1. Pilot 5-packs for 2020–2026 with source links and exact pack codes.
2. Add older 5-packs from historical archives after cross-checking.
3. Expand to other pack sizes and gift sets.
4. Add packaging photos and pack-variant identification only after provenance and permissions are clear.