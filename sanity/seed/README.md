# Seeding Sanity from the R2 library

`seed-projects.mjs` turns the curated media manifest (`media-featured.json`)
into Sanity `project` documents — one per project group, each with a real R2
cover URL. It maps the 22 project groups across the site's categories (iPhotos →
Photography), reuses the site's hand-written copy where a project already has it,
and marks the four Home projects as `featured`.

## Preview without writing anything

```bash
# Plain list of what would be created:
node sanity/seed/seed-projects.mjs --dry

# A rendered HTML grid (real covers) — open in a browser:
node sanity/seed/seed-projects.mjs --html > preview.html
```

## Run it for real

Needs a **write token**: sanity.io/manage → your project → **API → Tokens →
Add token** → Editor (or Deploy Studio) permission → copy it (shown once).

```bash
SANITY_PROJECT_ID=xxxxxxxx \
SANITY_WRITE_TOKEN=sk... \
  node sanity/seed/seed-projects.mjs
```

Optional env: `SANITY_DATASET` (default `production`), `SANITY_API_VERSION`
(default `2025-01-01`).

## Notes

- **Idempotent.** Deterministic `_id` + `createIfNotExists`, so re-running never
  duplicates and never overwrites edits you've made in the Studio. Pass
  `--replace` to force `createOrReplace` (this *does* overwrite Studio edits —
  use it only to re-seed from scratch).
- **Published immediately.** Docs are created with public ids, so they go live on
  the site right away. Refine copy / reorder / swap covers in `/cms` afterward.
- **Covers are R2 URLs**, not uploaded assets — they point at the existing CDN
  library (webp ~1280w). Swap any card to an uploaded image later if you prefer.
- **Placeholder copy.** Projects without site copy get their name as the headline
  and an empty summary; edit them in the Studio.
- The token is a secret — pass it inline as above; never commit it.
