# Catalogue source review

Potential upstream datasets identified for the catalogue importer:

## danyjoy/diecastDb
- Repository: https://github.com/danyjoy/diecastDb
- Structured year-based Hot Wheels records, including Mainline, Premium and Silver Series.
- Upstream README describes Mainline coverage from 1968–2027, Premium from 2012–2027, and Silver Series from 2009 plus 2012–2027, with approximately 17,800 cars in total.
- The upstream repository contains 93 year/assortment JSON files across 60 year folders in the current tree, and a weekly GitHub Action refreshes the current and next year.
- This is broad release-level coverage, not every Hot Wheels product worldwide: multipacks, promotional releases and many regional/exclusive variants still need separate sources and verification.
- Must preserve source IDs and URLs, normalize year/series/assortment, and deduplicate repeated castings and releases.

### Upstream coverage snapshot

The upstream `diecastDb` data documentation currently reports 14,474 Mainline releases (1968–2027), 1,954 Premium releases (2012–2027) and 1,404 Silver Series releases (2009 and 2012–2027), for **17,832 release records** in total. These are upstream-published counts, not an independent completeness audit. They describe three assortment datasets, not every Hot Wheels product ever sold; 5-packs, other multipacks, promotional releases, regional exclusives and many packaging/colour variants remain outside this coverage unless separately sourced and verified.

## pvwnthem/Hotwheels-Data
- Repository: https://github.com/pvwnthem/Hotwheels-Data
- Includes HotApi JSON Lines and community wiki-derived data.
- Treat as a secondary enrichment source, not unquestioned ground truth.


## Multipack and wider catalogue references

These are useful for future coverage and cross-checking, but they are not currently imported automatically:

- [HW Collectors News Digital Car Catalog](https://catalog.hwcollectorsnews.com/Search) exposes separate Castings, Sets, Series and Variations search categories. Its public search interface is a research reference; no supported bulk export has been confirmed.
- [HW Collectors Garage — Multi-Packs](https://www.hwcgarage.com/en/assortment/multi-packs) lists multipack-related vehicle releases and is useful for identifying candidate sets.
- [Wheel Wonderland — Multipacks](https://www.wheelwonderland.com/en/multipacks/) is another reference for multipack-exclusive releases and series.

Do not scrape or bulk-import these sources until a permitted export/API and its terms are confirmed. Keep pack identity separate from individual car releases, and verify the complete pack contents against packaging photos or a reliable source.

## Verified and research-stage multipack additions

- 2007 Exotics and 2011 HW Exotics 5-Packs: five entries each from Hot Wheels Wiki community pages; both remain flagged for independent packaging-photo verification.

- HW Exotics 5-Packs 2014 (BFB36), 2015 (CDT27) and 2016 (DJD29): five cars per pack transcribed from South Texas Diecast, HW Collectors News and Hot Wheels Wiki. These are community-reference records and remain flagged for packaging-photo verification.



- HW Exotics 5-Pack (2018), assortment FKT62: five vehicles recorded from Mattel's official announcement; production colors and packaging variations are not inferred.

- HW Exotics 5-Packs 2017, 2019 and 2021: five vehicles per pack, transcribed from Mattel's official yearly announcements. Production color and packaging variations remain unverified; the articles note that production items may vary.

- 2020 HW Exotics 5-Pack: the five contents are recorded from Mattel's official 2020 announcement. Production colors and packaging variations remain unverified; the source itself notes that production cars may vary from photos.

## Multipack source candidates

- [South Texas Diecast 5-Pack archive](https://www.southtexasdiecast.com/hwguide/5pack.html) — historical 5-pack tables with codes and contents.
- [Hot Wheels Wiki 5-Packs](https://hotwheels.fandom.com/wiki/5-Packs) and [5-Packs category](https://hotwheels.fandom.com/wiki/Category:5-Packs) — community-maintained year and pack discovery references.
- [HW Collectors News Digital Car Catalog](https://catalog.hwcollectorsnews.com/Search) — search categories include Castings, Sets, Series and Variations; no supported bulk export has been confirmed.

See [MULTIPACK_IMPORT_SPEC.md](MULTIPACK_IMPORT_SPEC.md) for the proposed pack data model and verification rules. No bulk multipack import has been performed.

## Import rules
1. Preserve upstream source and source ID for every imported record.
2. Separate casting identity from release, color/variant and multipack.
3. Keep fantasy castings in the database; classification is a filter, not a destructive import exclusion.
4. Keep unknown values null rather than inventing details.
5. Record conflicts between sources for later verification.
6. Do not bulk-copy image files; retain permitted source image URLs and attribution/provenance.
7. Make imports idempotent so rerunning an import does not create duplicate records.

## Current limitation
The browser app can import the upstream scan index and lazily load year/assortment files into local IndexedDB. No full catalogue import has been run into a production Supabase database. The upstream dataset is broad but not exhaustive; the source repositories are references for the importer, not proof that every Hot Wheels product is represented.


## 2022 five-packs

- Wheel Wonderland, Hot Wheels 5-Packs 2022: https://www.wheelwonderland.com/en/5-packs/2022/ — source for 18 package codes/variants and 90 listed vehicle entries. These are independent collector-database records and remain flagged for packaging-photo verification.


## 2023–2024 five-packs

- Wheel Wonderland 2023: https://www.wheelwonderland.com/fr/5-packs/2023/ — 18 complete package codes with five listed vehicles each (90 entries). Incomplete/variant-only series entries were not guessed into pack compositions.
- Wheel Wonderland 2024: https://www.wheelwonderland.com/fr/5-packs/2024/ — 17 complete package codes with five listed vehicles each (85 entries). Incomplete/variant-only series entries were not guessed into pack compositions.
- All community database records remain flagged for packaging-photo verification.


## 2025–2026 five-packs

- Wheel Wonderland 2025: https://www.wheelwonderland.com/fr/5-packs/2025/ — 18 fully enumerated package codes and 90 vehicle entries; the two Stunt Tracks codes are kept as separate packs.
- Wheel Wonderland 2026: https://www.wheelwonderland.com/fr/5-packs/2026/ — 17 additional fully enumerated package codes and 85 vehicle entries; the separately curated Ferrari 5-Pack is not duplicated.
- Source-listed colours are included where available. All community database records remain flagged for packaging-photo verification.


## 2020–2021 five-packs

- Wheel Wonderland 2020: https://www.wheelwonderland.com/fr/5-packs/2020/ — 17 complete numbered pack compositions / 85 entries added; the curated HW Exotics set was not duplicated.
- Wheel Wonderland 2021: https://www.wheelwonderland.com/fr/5-packs/2021/ — 16 complete numbered pack compositions / 80 entries added; the curated HW Exotics set was not duplicated.
- Variant-only rows without a separate numbered composition were not guessed into additional packs.
