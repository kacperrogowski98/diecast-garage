# Catalogue source review

Potential upstream datasets identified for the catalogue importer:

## danyjoy/diecastDb
- Repository: https://github.com/danyjoy/diecastDb
- Structured year-based Hot Wheels records, including Mainline, Premium and Silver Series.
- Previously reviewed inventory was approximately 17.8k records across those categories.
- Must preserve source IDs and URLs, normalize year/series/assortment, and deduplicate repeated castings and releases.

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

## Import rules
1. Preserve upstream source and source ID for every imported record.
2. Separate casting identity from release, color/variant and multipack.
3. Keep fantasy castings in the database; classification is a filter, not a destructive import exclusion.
4. Keep unknown values null rather than inventing details.
5. Record conflicts between sources for later verification.
6. Do not bulk-copy image files; retain permitted source image URLs and attribution/provenance.
7. Make imports idempotent so rerunning an import does not create duplicate records.

## Current limitation
No full catalogue import has been run into a production database yet. The source repositories are references for the importer, not proof that the app catalogue is complete.
