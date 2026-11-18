# Catalogue importer specification

The production importer is a separate trusted process. It must never run with a service-role key in the browser.

## Destination tables
- `brands`: manufacturer / marque.
- `castings`: base casting identity and broad vehicle classification.
- `releases`: year, series, assortment, collector number and source provenance.
- `variants`: color, wheels, tampo and other release variations.
- `packs` + `pack_contents`: multipacks and their contents.

## Source ingestion
1. Pull source datasets from the upstream repositories documented in [CATALOGUE_SOURCES.md](CATALOGUE_SOURCES.md).
2. Preserve original source record IDs and source URLs.
3. Normalize whitespace, casing and brand aliases without deleting the original source text.
4. Upsert using stable source keys; repeated imports must be idempotent.
5. Resolve casting identity separately from release and variant identity.
6. Do not invent missing colors, years, assortment codes or pack contents.
7. Keep uncertain classification as `unknown`; fantasy vehicles remain in the catalogue.
8. Write conflict records / verification flags when sources disagree.

## Required importer checks
- Count imported, updated, skipped and conflicting rows.
- Check duplicate source keys and orphan foreign keys.
- Compare counts by year and series to the upstream inventory.
- Sample-check images and source URLs.
- Run a second import and confirm that it creates no duplicates.

## Current state
Schema is committed, but no importer has been executed and the catalogue tables are not populated yet.
