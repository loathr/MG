# Studio — Session Handover

A pick-it-up-cold snapshot of the Studio rebuild work on this branch. For the
full architecture and the as-built rationale, read **`docs/STUDIO_REBUILD.md`**
first — this file is the working state on top of it.

## Snapshot
- **Branch:** `claude/charming-fermat-2niyvq` (develop + push here only).
- **HEAD at handover:** `a5d4d60`.
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
- `a5d4d60` Side-by-side **"Feature ⇆"** split variant (photo left / text right).
- `d90bb04` Image+text **"Feature"** layout family (top band + `featureBottom`);
  photo as canonical `content.image`, moved between bg and element by `reflowSlide`.
- `bff9b08` Steer **stat/versus onto data/evidence roles** (one prompt nudge).
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
- `templates.js` — pure layout registry (`LAYOUT_FNS`/`LAYOUT_LIST`, incl. the
  `feature`/`featureBottom`/`featureSplit` image+text layouts), `renderLayout`
  (+ the `highlight` post-process), `reflowSlide` (re-flow a slide to a layout,
  moving the photo between the background and a feature element only when crossing
  the feature boundary), `slidesToDoc` (generation → doc, routing incl.
  stat/versus + caution; stamps `content.image`), `cautionElement`.
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

### ✅ Resolved since `3c4cedb` (the two flagged ⚠️ gaps)
1. **Image+text "feature" layout** — shipped (`d90bb04` + `a5d4d60`). Three panel
   layouts: `feature` (top image band), `featureBottom`, `featureSplit` (left
   photo / right text). The photo is canonical `content.image`; `reflowSlide`
   moves it between the background and a feature element only when crossing the
   feature boundary, so non-feature re-flows keep any manual background. No photo →
   solid accent block. Same §3 crash profile as a bg photo (one image element +
   flat type, never stacked). **Panel-only** by choice; auto-routing deferred.
2. **stat/versus role-tie** — shipped (`bff9b08`). One `buildPrompt` line steers a
   STAT or VERSUS onto data/evidence roles ("The Numbers", "The Data", "The
   Evidence", "The Proof", "The Stakes").

### ⚠️ Still open
- **"Assets" beyond the logo (Phase 4).** No reusable upload shelf or icon set;
  the logo is the only persistent brand asset (Photos panel is live search).
  Lift: **medium**. Defer until there's a concrete need — logo + search cover
  most workflows.
- **Feature-layout auto-routing.** Generation still emits full-bleed photo
  backgrounds; `feature` is opt-in from the Templates panel. Auto-selecting it for
  photo-bearing narrative slides would change default decks — deferred by choice
  (ship manual, validate the look first). Lift: **small** (a route rule in
  `slidesToDoc`, like the stat/versus branch).
- **Caution carry-through-regen.** An *edited* caution is re-seeded from the
  category on regenerate rather than carried like the brand kit. Lift: **small** —
  extend `carryBrandKit` to carry a caution that differs from the previous
  category's default. Offered, not built.

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
