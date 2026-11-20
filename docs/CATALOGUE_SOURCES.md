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


## 2019 five-packs

- Wheel Wonderland 2019: https://www.wheelwonderland.com/fr/5-packs/2019/ — 15 complete numbered package compositions / 75 entries added. The already curated HW Exotics pack was not duplicated; incomplete X-Raycers content was excluded.


## 2017–2018 five-packs

- Wheel Wonderland 2017: https://www.wheelwonderland.com/fr/5-packs/2017/ — 19 complete numbered package compositions / 95 entries added; the curated HW Exotics pack was not duplicated.
- Wheel Wonderland 2018: https://www.wheelwonderland.com/fr/5-packs/2018/ — 18 complete numbered package compositions / 90 entries added, including two separately coded City packs; the curated HW Exotics pack was not duplicated.
- Variant-only rows without a separate numbered composition were not guessed into extra pack records.


## 2016 five-packs

- Wheel Wonderland 2016: https://www.wheelwonderland.com/fr/5-packs/2016/ — 16 complete numbered package compositions / 80 entries added; the curated HW Exotics pack was not duplicated and the incomplete Batman v Superman composition was excluded.


## Ferrari 5-Packs (2002, 2003, 2005)

- 2002: https://www.wheelwonderland.com/fr/series/ferrari-5-pack-2002/ — five numbered models and colours.
- 2003: https://www.wheelwonderland.com/fr/series/ferrari-5-pack-2003/ — five numbered models and colours; the base five-model composition was used, not duplicate colour-variant rows.
- 2005: https://www.wheelwonderland.com/fr/series/ferrari-5-pack-2005/ — five numbered models and colours.


## Ferrari 5-Packs (2009–2014)

- 2009: https://www.wheelwonderland.com/fr/series/ferrari-5-pack-2009/ — 10 listed vehicles split into two five-car assortments.
- 2010: https://www.wheelwonderland.com/fr/series/ferrari-5-pack-2010/ — five numbered vehicles.
- 2011: https://www.wheelwonderland.com/fr/series/ferrari-5-pack-2011/ — five numbered vehicles.
- 2012: https://www.wheelwonderland.com/fr/series/ferrari-5-pack-2012/ — five numbered vehicles.
- 2013: https://www.wheelwonderland.com/fr/5-packs/2013/ — five numbered vehicles.
- 2014: https://www.wheelwonderland.com/fr/series/ferrari-5-pack-2014/ — five numbered vehicles.


## 2015 five-packs

- Wheel Wonderland 2015: https://www.wheelwonderland.com/fr/5-packs/2015/ — 16 complete numbered package compositions / 80 entries added; the curated HW Exotics pack was not duplicated.


## 2014 five-packs

- Wheel Wonderland 2014: https://www.wheelwonderland.com/fr/5-packs/2014/ — 18 complete numbered package compositions / 90 entries added; existing Ferrari and HW Exotics packs were not duplicated.


## 2012–2013 five-packs

- Wheel Wonderland 2012: https://www.wheelwonderland.com/fr/5-packs/2012/ — 16 complete numbered five-packs / 80 entries plus the six-car Halloween assortment.
- Wheel Wonderland 2013: https://www.wheelwonderland.com/fr/5-packs/2013/ — 22 complete numbered five-packs / 110 entries, including three separately numbered HW Test Facility packs. The curated Ferrari pack was not duplicated.


## 2010–2011 five-packs

- Wheel Wonderland 2010: https://www.wheelwonderland.com/fr/5-packs/2010/ — 18 complete numbered five-pack compositions / 90 entries added; the Ferrari pack was not duplicated.
- Wheel Wonderland 2011: https://www.wheelwonderland.com/fr/5-packs/2011/ — 23 complete numbered five-pack compositions / 115 entries added; existing Ferrari and HW Exotics packs were not duplicated.
- Variant-only rows without a separate numbered composition were not guessed into additional packs.


## 2009 five-packs

- Wheel Wonderland 2009: https://www.wheelwonderland.com/fr/5-packs/2009/ — 16 complete numbered five-pack compositions / 80 entries added; the two existing Ferrari assortments were retained and variant-only rows excluded.


## 2007–2008 five-packs and other multipacks

- Wheel Wonderland 2007: https://www.wheelwonderland.com/fr/5-packs/2007/ — 10 complete numbered five-packs / 50 entries, plus the eight-car Easter Eggs-Treme, seven-car Fright Cars and six-car Gotham City packs. Existing Ferrari and Exotics records were retained.
- Wheel Wonderland 2008: https://www.wheelwonderland.com/fr/5-packs/2008/ — 15 complete numbered non-Ferrari five-packs / 75 entries, plus the five-car Ferrari GT pack. Variant-only rows were not duplicated.


## 2006 five-packs

- Wheel Wonderland 2006: https://www.wheelwonderland.com/fr/5-packs/2006/ — 13 numbered five-packs / 65 entries and the six-car X-Raycers assortment. Duplicate non-numbered colour variants were not imported as separate pack records.


## 2005 five-packs

- Wheel Wonderland 2005: https://www.wheelwonderland.com/fr/5-packs/2005/ — eleven additional numbered five-packs / 55 entries and the six-car Dual Cool assortment. The existing Ferrari 5-Pack was retained; non-numbered duplicate colour variants were not added as separate sets.


## 2004 five-packs

- Wheel Wonderland 2004: https://www.wheelwonderland.com/es/5-packs/2004/ — 12 complete numbered five-packs / 60 entries. Duplicate non-numbered colour variants and a separate single-car entry were excluded.


## 2003 five-packs

- Wheel Wonderland 2003: https://www.wheelwonderland.com/fr/5-packs/2003/ — 11 complete numbered five-packs / 55 entries. Existing Ferrari pack retained; alternate-colour duplicate rows excluded.


## 2002 five-packs

- Wheel Wonderland 2002: https://www.wheelwonderland.com/fr/5-packs/2002/ — 12 additional numbered five-packs / 60 entries; the existing Ferrari set was retained and alternate-colour duplicates excluded.


## 2001 five- and six-packs

- Wheel Wonderland 2001: https://www.wheelwonderland.com/en/5-packs/2001/ — ten five-packs / 50 entries and two six-packs / 12 entries. The actual numbered card counts are retained.


## 2000 five-packs

- Wheel Wonderland 2000: https://www.wheelwonderland.com/fr/5-packs/2000/ — 13 complete numbered five-packs / 65 entries. Variant-only duplicate rows were excluded.


## 1999 five-packs

- Wheel Wonderland 1999: https://www.wheelwonderland.com/en/5-packs/1999/ — 12 complete numbered five-packs / 60 entries. Non-numbered alternate-colour records were excluded.


## 1998 five-packs

- Wheel Wonderland 1998: https://www.wheelwonderland.com/fr/5-packs/1998/ — 11 complete numbered five-packs / 55 entries. Only numbered 1/5–5/5 compositions were imported; alternate variants and incomplete series were excluded pending verification.


## 1997 five-packs

- Wheel Wonderland 1997: https://www.wheelwonderland.com/fr/5-packs/1997/ — 12 complete numbered five-packs / 60 entries. Only numbered 1/5–5/5 compositions were imported; incomplete/variant rows were excluded.


## 1996 five-packs and multipacks

- Wheel Wonderland 1996: https://www.wheelwonderland.com/fr/5-packs/1996/ — nine complete numbered five-packs / 45 entries plus the six-car Super Show Cars 6-Pack.
- The Super Show Cars set is preserved as a 6-pack based on its 1/6–6/6 numbering; incomplete/variant-only rows are not inferred.


## 1995 five- and six-packs

- Wheel Wonderland 1995: https://www.wheelwonderland.com/fr/5-packs/1995/ — three additional complete five-packs / 15 entries plus two six-packs / 12 entries. The existing Ferrari 5-Pack was retained without duplication.


## 1994 five- and six-packs

- Wheel Wonderland 1994: https://www.wheelwonderland.com/fr/5-packs/1994/ — six additional complete five-packs / 30 entries plus the six-car Action Command assortment. Existing Ferrari 5-Packs were not duplicated.


## 1993 five-packs

- Wheel Wonderland 1993: https://www.wheelwonderland.com/fr/5-packs/1993/ — six complete numbered five-packs / 30 entries. Only numbered 1/5–5/5 compositions were imported.


## 1991–1992 five-packs

- Wheel Wonderland 1991: https://www.wheelwonderland.com/fr/5-packs/1991/ — seven complete numbered five-packs / 35 entries.
- Wheel Wonderland 1992: https://www.wheelwonderland.com/fr/5-packs/1992/ — five complete numbered five-packs / 25 entries plus six-entry Off Road Explorers variant assortment. Ambiguous double-numbered Classic Collection rows were excluded.


## 1988–1990 historical packs

- Wheel Wonderland 1988: https://www.wheelwonderland.com/fr/5-packs/1988/ — seven numbered five-packs / 35 entries.
- Wheel Wonderland 1989: https://www.wheelwonderland.com/fr/5-packs/1989/ — four five-packs / 20 entries and one six-car Trailbusters Gift Pack. The ambiguous Super Sportscars list was excluded.
- Wheel Wonderland 1990: https://www.wheelwonderland.com/fr/5-packs/1990/ — six numbered five-packs / 30 entries.


## 1985–1987 early five-packs

- Wheel Wonderland 1985: https://www.wheelwonderland.com/fr/5-packs/1985/ — one five-pack / five entries.
- Wheel Wonderland 1986: https://www.wheelwonderland.com/fr/5-packs/1986/ — four Gift Pak five-packs / 20 entries.
- Wheel Wonderland 1987: https://www.wheelwonderland.com/fr/5-packs/1987/ — four five-packs / 20 entries.
