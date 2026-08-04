# Loathr website — build handoff

Continuation notes for a fresh session. Read this top to bottom before touching code.

## Standing rule (do not skip)
**Show a visual before implementing.** For every build or feature change, render a
visual first — a mockup, before/after, diagram, or rendered screen — and get the
user's sign-off BEFORE writing or editing code. This applies even to copy changes
(a before/after table counts as the visual). Carry this rule into the next handoff too.

Also: this is a modified Next.js — read the guide in `node_modules/next/dist/docs/`
before writing Next code; APIs may differ from training data.

## Stack
- Next.js 16 (Turbopack) + React 19, TypeScript, scoped global CSS under `.site`.
- Sanity CMS (Studio at `/cms`, Presentation/visual editing live). `next-sanity`.
- Cloudflare R2 for media (S3-compatible). Public base:
  `https://pub-ea1f271a548f41ada37411b1a646b020.r2.dev`, bucket `loathr-media`.
- Deploys to Vercel.
- Route groups: `app/(marketing)/` = public site; `app/studio/` = the separate
  loathrdotcom carousel app (DO NOT touch); Sanity Studio mounts at `/cms`.

## Git
- Repo: `loathr/MG`. Default branch: `main`.
- Dev branch: `claude/website-rebuild-mplag6`. Established flow this project:
  edit on the dev branch → commit → push → fast-forward merge into `main` → push.
  Keep dev branch and `main` in sync.
- Latest copy work is merged to `main` (brand→company, em-dash removal,
  "your company" second-person voice).

## Sanity — how content works
- Project id `71hpjqi4`, dataset `production`, apiVersion `2025-01-01`.
- Every marketing page reads a Sanity singleton with a HARDCODED FALLBACK object
  in the page's `.tsx` (`const F = {...}` / `HERO_F` / `FALLBACK`). Edits must be
  made in BOTH the page fallback AND `sanity/seed/seed-pages.mjs`, or code and CMS
  drift apart.
- The live site renders the Sanity docs, not the fallbacks. After changing copy,
  the docs must be RE-SEEDED to go live:
  ```
  SANITY_PROJECT_ID=71hpjqi4 SANITY_DATASET=production \
    SANITY_WRITE_TOKEN=sk... node sanity/seed/seed-pages.mjs --replace
  ```
  `--replace` (createOrReplace) is REQUIRED to overwrite existing docs; a plain run
  uses createIfNotExists and won't touch them.
- Seed scripts (run locally by the user; the agent container has no write token):
  - `seed-pages.mjs` — 7 page singletons (home/about/what-we-do/work/insights/newsletter/contact).
  - `seed-videos.mjs` — sets `videoUrl` on existing projects + creates the video-led projects.
  - `seed-posters.mjs` — sets `coverUrl` to poster frames for the video projects.
  - `seed-projects.mjs` — the original ~22 projects.

## SECURITY — rotate the Sanity write token
The `SANITY_WRITE_TOKEN` was pasted into chat during seeding. Rotate it at
manage.sanity.io → API → Tokens, and never paste it into chat again. The token
is NOT stored in the repo.

## Media pipeline (Drive → R2 → Sanity) — READ THIS re: the Drive reorg
Tool: `tools/video-transcode-r2.py` (paste into Google Colab, same Google account).
Flow:
1. Reads video masters from a Google Drive folder (by folder id, recurses subfolders).
2. Transcodes each to a web MP4 + a 12s muted preview loop.
3. Uploads to R2 under `video/<slug>-preview.mp4` (poster cell writes `image/<slug>-poster.jpg`).
4. `<slug>` is derived from the Drive FILENAME.
5. `seed-videos.mjs` and `seed-posters.mjs` contain HARDCODED slug→project maps
   (e.g. `we-are-assholes-fashion-film`, `benefits-for-parents`, `badesere-2`,
   `6393-video-7-1`, `summer-fashion-film`, `spring-fashion-film`,
   `a-day-at-the-market-fashion-film`, `faahion-film-2-clip`).

**Impact of the Drive reorganization:** because slugs come from Drive filenames and
the seed maps are hardcoded to those slugs, any renamed/moved/re-foldered master
changes its slug → the existing R2 keys and the seed mappings no longer line up, so
`videoUrl`/`coverUrl` can point at 404s or the wrong file.

**What the next session needs from the user to reconcile it:**
- The new Drive folder id(s) and structure (which folder now holds masters; sub-foldering).
- The new → old filename mapping (or the new filenames), so the slug maps in
  `seed-videos.mjs` / `seed-posters.mjs` can be updated, OR the masters re-transcoded
  so R2 keys match the new slugs.
- Category assignment for any new/moved files. Current category conventions:
  VODs→events, 6393 clip→social, fashion films→fashion (sub-section),
  shayo-galore-ii→music (Wavy), We Are Assholes→commercial, MyWoosah→commercial,
  Badesere→fashion.
- Confirm the R2 bucket/keys after re-upload (public base above; keys under
  `video/` and `image/`).

## State — done
- Marketing site rebuilt, all pages CMS-editable with live Presentation editing.
- Project detail pages at `/work/[slug]` (hero/video, story, credits, gallery mosaic, next-project, CTA).
- Virtual gallery at `/gallery`; Our Work grid filters incl. commercial/social.
- 39 previews transcoded to R2; 4 existing projects wired with video (GAS, Agidi
  Magazine, Events, Wavy); 8 new video projects created; poster-frame covers seeded.
- Copy: "brand"→"company" where it described us; em-dashes removed from visible copy;
  tab titles `· Loathr`; second-person "your company" voice in value props.

## Pending / offered next
1. **Reconcile the Drive reorg** with R2 keys + seed slug maps (see above) — likely first.
2. **Per-project tailored copy** — in-voice, fact-free summaries + detail-page stories
   for each project (a 5-project sample was approved in concept; NOTE the rule: no
   fabricated facts — dates/results/credits must come from the user). Would live in
   an updated project seed.
3. **Detail-page galleries** — auto-populate each `/work/[slug]` gallery from the
   project's R2 stills (e.g. from a `media-clean.json`) so pages fill out.
4. Re-seed reminder: after ANY copy/seed change, run `seed-pages.mjs --replace`.
5. Optional: working contact/newsletter forms, custom domain, fashion-films grouping.
