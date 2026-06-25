# Studio — Session Handover

A pick-it-up-cold snapshot of the Studio rebuild work on this branch. For the
full architecture and the as-built rationale, read **`docs/STUDIO_REBUILD.md`**
first — this file is the working state on top of it.

## Snapshot
- **Branch:** `claude/charming-fermat-2niyvq` (develop + push here only).
- **HEAD at handover:** `3c4cedb`.
- **App:** the Studio lives under `app/studio/` (a Canva-style editor). Entry
  `app/studio/page.jsx` → `Studio.jsx`.
- **Preview:** `https://mg-git-claude-charming-fermat-2niyvq-loathrs-projects.vercel.app/studio`
  (append `?v=<sha>` to pin a build).

## How to work here
- **Build (the real gate):** `npm run build`. Run it before every commit; it's
  the durable check that catches JSX/import errors across the whole module graph.
- **Ad-hoc unit tests:** the studio modules use extensionless ESM imports
  (`from "./model"`), which bare Node can't resolve. During this session tests
  ran via a tiny custom loader that appends `.js`, invoked as
  `node --no-warnings --loader <resolver>.mjs <test>.mjs` with **absolute**
  `/home/user/MG/app/studio/*.js` import specifiers. The pure modules
  (`model.js`, `templates.js`, `store.js`, `styles.js`, `categories.js`,
  `generate.js`, `export.js`) are designed to be importable headless. There is
  no committed test runner yet — see Open Items.
- **Commits:** conventional, imperative subject; end with the `Co-Authored-By`
  / `Claude-Session` trailers used on every commit in `git log`. Do **not** put
  the model id in any committed artifact.
- **Guardrails (do not regress):** §3 FLAT-LAYERS (one solid bg OR one photo +
  one baked scrim; never stacked compositing), §12 (no image-URL input;
  premium/editorial output). `AGENTS.md`: this Next.js has breaking changes —
  read `node_modules/next/dist/docs/` before touching Next APIs.

## Shipped this session (newest first)
- `3c4cedb` Per-category **caution label** on the closing slide (Business/News
  seed one; straight default + witty alts; editable/removable in Brand panel).
- `4f7235d` Inline **highlight** emphasis (knockout marker) across live canvas,
  static/preview, and PNG export.
- `d565cea` Replace **Bold/Minimal** families with **Enterprise** (Editorial,
  Enterprise, News Desk are the three families now).
- `2d190da` Revive **News Desk** family (`masthead` cover).
- `537b0b5` **Data-driven layouts**: `stat` + `versus` (+ optional generation fields).
- `96ec82c` Carry the **brand kit + logo** through regeneration.
- `ed7b63f` Create screen leads with **"What kind?"** and seeds the look.
- `c22deec` Scope the **logo** to cover + closing bookends.
- `ee6ae3f` Deck-wide **logo upload** in the Brand panel.
- `de5d9c3` Revive the **9 editorial palettes** as Brand-panel looks.
- `24e0fc1` Add **quote / numbered / split** layouts (Phase 1).

## Key files
- `styles.js` — the 3 style families (Editorial / Enterprise / News Desk):
  palette + fonts + per-family `layouts` map. `brandFromStyle`, the 9
  `EDITORIAL_PALETTES`, `paletteBrand`.
- `templates.js` — pure layout registry (`LAYOUT_FNS`/`LAYOUT_LIST`),
  `renderLayout` (+ the `highlight` post-process), `slidesToDoc` (generation →
  doc, routing incl. stat/versus + caution), `cautionElement`.
- `store.js` — reducer + history. Pure brand helpers `rethemeDoc`, `stampLogo`,
  `carryBrandKit`; actions `applyBrand`, `setLogo`, `setCaution`, `setLayout`.
- `categories.js` — content kinds (voice + role labels + `defaultStyle` +
  `caution`). `cautionFor`.
- `generate.js` — prompt builder + `generateCarousel` (calls `/api/generate`,
  `/api/images`, then `slidesToDoc`).
- `model.js` — pure element model; `highlightRuns`.
- Renderers: `Element.jsx` (live), `StaticSlide.jsx` (thumb/preview),
  `export.js` (manual canvas → PNG), shared `RichText.jsx` for highlight.
- Panels: `CreateScreen.jsx`, `BrandPanel.jsx`, `TemplatesPanel.jsx`,
  `PhotosPanel.jsx`.

## Open items

### ⚠️ Flagged in the phase retrospective (the real "to discuss")
1. **No image+text "feature" layout (Phase 1).** `split` shipped as a *text*
   divider, not a composition that places a photo as an *element* beside text.
   Photos only ever render as full-bleed backgrounds. Lift: **medium** — thread
   the slide image into `renderLayout` (today it only gets `hasImage`), add a
   `feature` layout that lays out one image element + text, route image-bearing
   slides to it, and handle the panel case where the current slide has no image.
2. **stat/versus prompt is role-agnostic (Phase 3).** The prompt allows ≤1 stat
   and ≤1 versus but doesn't steer them onto number-heavy roles ("The Numbers",
   "The Data", "The Proof"). Lift: **trivial** — one nudge line in
   `generate.js buildPrompt`. Highest value-per-effort of the three.
3. **"Assets" beyond the logo (Phase 4).** No reusable upload shelf or icon set;
   the logo is the only persistent brand asset (Photos panel is live search).
   Lift: **medium**. Defer until there's a concrete need — logo + search cover
   most workflows.

### Other deferred (from STUDIO_REBUILD.md "Deliberately deferred")
- **Revived families are visual shells**, not the original generation pipelines
  (no web-search source-first workflow, `keywords`, `mosaic`, breaking banners,
  funny-closer arrays, depth/tone/focus pickers). Decision: families = palette +
  fonts + cover layout; content unified on `classic`.
- **Custom display fonts dropped** (Crown Heritage, Eroded, Otilito, Qogee…) →
  Georgia / Helvetica / Courier New stacks.
- **Orphaned panel layouts** `statement`/`centered`/`bottom` (old Bold/Minimal
  signatures) remain as manual options; no family defaults to them.
- **Recent-projects shelf** and **grid snapping** not built (low priority).
- **Voice/taste pass** — subjective dial-turning against real generated decks.
- **No committed automated test runner** — unit checks were ad-hoc; `npm run
  build` is the only standing gate.

## Gotchas
- **Export draws text to canvas manually** (`export.js`), not via DOM
  rasterization — any new text styling must be added there too (that's why
  `highlight` has a `drawHighlightText`/`wrapRuns` path mirroring `RichText`).
- **History resets on `loadDoc`** (generation/blank) — a fresh deck is a fresh
  undo stack; brand carries via `carryBrandKit`, not via undo.
- **`carryBrandKit` carries only deliberate overrides** (fields differing from
  the previous style's defaults) + the logo. `caution` is category-seeded, not
  carried.
- **Monochrome families** (Enterprise: accent === ink): the `applyBrand` color
  remap is ink-first, and `highlight` uses a knockout marker, both so emphasis
  stays visible.
