# LOATHR Studio — Rebuild Design Spec

> Handoff document for the rebuild. Read this in full before writing code.
> It captures decisions already made with the product owner; don't relitigate
> them, build to them.

## 0. Status — as built (2026-06-24)

**The §11 build order is complete.** Everything in §1–§12 below is now realised
in code on branch `claude/charming-fermat-2niyvq` (PR #9). This section is the
as-built snapshot; the rest of the doc is the plan that produced it and still
governs how to extend safely — especially §3 (FLAT LAYERS) and §12 (guardrails).

### Shipped, by build-order step (§11)
1. **Editor shell** — top bar (back · project name · undo/redo · Download ▾),
   left tool rail (Text · Elements · Photos · Templates · Brand), center
   artboard, right contextual toolbar, bottom thumbnail strip.
   `Studio.jsx`, `Artboard.jsx`, `Toolbar.jsx`.
2. **Photos panel + §3 image path** — `/api/images` search grid; set-as-background
   with an automatic readability scrim; place-as-element. Off-screen slides
   render as lightweight thumbnails (`SlideThumb.jsx`); served images capped
   ≤1280×1600. The 9-slide photo carousel stays light — the crux the old app
   failed. **No URL input anywhere.**
3. **Create screen → generation** — content category (kind) first, which seeds
   the "pick a look" style gallery, then topic input, wired to `/api/generate`.
   `CreateScreen.jsx`, `generate.js`.
4. **Undo/redo + snapping + slide ops** — global history (Cmd/Ctrl+Z / Shift+Z,
   buttons); smart guides snapping to artboard center/edges + siblings
   (`geometry.js` `snapMove`, live guides in `Artboard.jsx`); 15° rotate snap;
   slide reorder/duplicate/delete. `store.js`.
5. **Style families + Brand + Templates** — Editorial / Enterprise / News Desk as
   palette + font sets (`styles.js`); deck-wide Brand panel (accent, fonts,
   wordmark — `BrandPanel.jsx`); Templates panel with a 5-layout registry applied
   on explicit click (`TemplatesPanel.jsx`, `templates.js`). Plus §8
   auto-photo-per-slide on generation and §9 export.
6. **Editorial voice pass** — content categories with distinct per-category
   briefs (`categories.js`) and a universal craft bar + banned-phrase list in the
   prompt (`generate.js`).

### Also shipped (beyond the build order)
- **Export (§9):** "This slide" → PNG; "All slides" → a single **`.zip`**
  (dependency-free STORE-method writer — `zip.js` / `export.js`). Replaces the
  N-sequential-downloads approach browsers throttle and silently drop.
- **Per-family layout divergence:** each family maps cover/content to distinct
  layouts — Editorial left-aligned & sourced (`cover`/`classic`), Enterprise a
  B&W intelligence-brief cover (`dossier`/`classic`), News Desk a newspaper
  nameplate (`masthead`/`classic`). Families differ in arrangement, not just
  palette + fonts. `styles.js` `layouts` + `templates.js` `slidesToDoc`/
  `previewCover`. (The orphaned `statement`/`bottom`/`centered` layouts — the old
  Bold/Minimal signatures — remain available in the Templates panel for manual
  use; no family defaults to them.)
- **News Desk family (revived segment):** the old newspaper segment, reborn as a
  fourth style family in the new flat-layers model — newsprint cream bg, near-
  black ink, newspaper-red (`#c41e1e`) section flags, serif headlines/body, and a
  Courier kicker for the wire-copy dateline/sources. Its cover uses a new
  `masthead` layout (an accent top rule + a centered uppercase section name over a
  hairline, then a big serif headline + standfirst); content runs as `classic`
  newspaper columns. The custom display fonts (Crown Heritage, Eroded…) are gone,
  mapped to Georgia + Courier New stacks. Selecting the **News** category now
  seeds this look. `styles.js` `STYLES.newsdesk`; `templates.js` `L_masthead`.
- **Three more layouts (`split` / `numbered` / `quote`)** in the Templates
  panel, available across every family, reusing existing content fields only
  (a derived slide `number` for `numbered`) — no prompt/schema change.
  `templates.js` `LAYOUT_LIST`/`LAYOUT_FNS`.
- **Data-driven layouts (`stat` / `versus`):** a big-number hero and a
  head-to-head comparison that read OPTIONAL structured fields the generator may
  now emit — `stat`/`statLabel` and `versus:{left,right}` (bounded to ≤1 of each
  per deck, real-figures-only, in `generate.js`). `slidesToDoc` routes a content
  slide to the matching layout when those fields are present; otherwise the family
  default. Both also degrade gracefully when applied from the Templates panel to a
  plain slide (heading becomes the stat hero; an "A vs B" heading splits into two
  sides, else heading-vs-body), so they work on any slide. Fields ride on
  `slide.content`, so a panel re-flow keeps them. `templates.js` `L_stat`/
  `L_versus`/`normVersus`.
- **Inline `highlight` emphasis (knockout marker):** the generator may add a
  `highlight` — a short phrase copied verbatim from a slide's body — and
  `renderLayout` post-processes it onto the body/standfirst text that contains it
  (a font-size band, 26–44px, keeps it off headings/kickers/sources). Rendered as
  a knockout marker: accent-fill background, bg-color text — so it's visible in
  every family, including monochrome Enterprise where an accent-colored word would
  vanish. One pure splitter (`model.js` `highlightRuns`) feeds all three
  renderers: the live canvas (`Element` via `RichText`), the static/preview
  renderer (`StaticSlide` via `RichText`), and the manual PNG draw (`export.js`
  `drawHighlightText`/`wrapRuns`) — so the marker is identical on screen, in
  thumbnails, and in the export. Editing a text box shows raw text (no markup);
  the marker re-applies on commit if the phrase still matches.
- **Editorial palettes:** the original 9 category color schemes (Film & TV,
  Photography, Sports × Culture, Did You Know?, Art & Music, Fashion, Food &
  Drink, Nightlife, The Tea) revived as one-click **looks** in the Brand panel.
  Color only (accent + background + ink, with sub/muted tinted between ink and
  bg) — re-themes any family without touching its layout or typography.
  `styles.js` `EDITORIAL_PALETTES`/`paletteBrand`; `store.js` `applyBrand` now
  remaps the background + full text-color set (ink-first, so a monochrome family
  like Enterprise stays readable on a palette swap).
- **Logo upload (cover + closing):** the Brand panel accepts an uploaded image
  logo, downscaled to a same-origin PNG dataURL (so PNG/zip export stays
  untainted) and stamped top-right on the cover and closing slides (brand
  bookends — not content slides) as a role-tagged `image` element — a normal
  element after placement, so it drags/resizes/deletes per slide.
  Re-upload replaces, Remove clears; one undoable step. `store.js` `setLogo` (a
  thin wrapper over the pure `stampLogo`); `BrandPanel.jsx` upload UI. Coexists
  with the wordmark (closing-slide text), and now rides through regeneration
  (see next).
- **Brand kit carries through regeneration:** generating a new deck no longer
  discards the brand. `carryBrandKit(newDoc, prevDoc)` (`store.js`, run in
  `Studio.jsx` `handleGenerate`) re-applies the user's deliberate brand overrides
  onto the fresh deck — but ONLY the fields that differ from the previous style's
  defaults, so choosing a new style still adopts that style's look; just the
  custom palette / fonts / wordmark ride along. The logo always carries (it's
  never a style default), re-stamped on the new bookends. Pure and a no-op when
  nothing was customized (first generation, untouched brand). Built on the shared
  `rethemeDoc` + `stampLogo` helpers the `applyBrand`/`setLogo` actions also use.

### Deliberately deferred (scoped out, not bugs)
- **More premium layouts.** Ten ship now (cover / classic / centered /
  statement / bottom / split / numbered / quote / stat / versus) in the Templates
  panel, the last two data-driven (see "Data-driven layouts" above). Still open:
  richer data shapes (timeline, ranked list) if a topic ever needs them.
- **Recent-projects shelf** on the Create screen. Blank-start exists; a recents
  list does not (§4's "quiet secondary affordance").
- **Grid snapping.** Snapping targets artboard center/edges + siblings; the §6
  "snap to the artboard grid" line is not implemented (low priority).

### Known taste-iteration (needs owner reaction to real output)
- Generated **voice** is subjective. Tune the per-category briefs, the
  banned-phrase list, and heading length/casing against decks you actually
  generate. The structure is stable — this is dial-turning, not rebuilding.
- **Sources line now ships on every family** (cover + content): all three use
  `classic` content and a sources-bearing cover (`cover`/`dossier`/`masthead`).
  The orphaned panel-only layouts (`statement`/`centered`/`bottom`, the old
  Bold/Minimal signatures) omit it by design — a non-issue unless a family
  adopts one. The per-family map (`styles.js` `layouts`) is the one knob.

### Notes for whoever picks this up
- **Do not regress §3 FLAT LAYERS or the §12 guardrails** (no stacked
  compositing, no image-URL input, output stays premium/editorial).
- The generation model is configurable via `generateCarousel(opts.model)`;
  `generate.js` carries the default — change it there to adopt a newer model.
- All work is committed and pushed; working tree clean. Read this doc in full
  before extending.

## 1. What we're building & why

An AI-first Instagram **carousel maker**. You pick a look, type a topic, and AI
drafts the whole carousel; then you tweak it on a **Canva-like canvas**. The
output must look like premium editorial design; the *editing experience* must be
simple enough for a child to use.

This is a **from-scratch rebuild**. The previous monolith
(`app/components/LoathrMediaGenerator.jsx`, ~8k lines) is being abandoned, not
extended. See §3 for the non-negotiable reason.

### Decisions locked with the owner
- **Editor layout:** persistent tool rail (left) + canvas (center) + contextual
  toolbar (right) + slide thumbnail strip (bottom). Canva-style, everything
  visible.
- **Start flow:** **pick a look first** (visual style gallery) → then type the
  topic → generate.
- **Aesthetic:** **premium editorial look, kid-simple controls.** "Easy for
  kids" describes the UX, NOT the output. Output stays grown-up: serif type,
  photo-led, restrained. No childish/rounded/clip-art styling of the slides.

## 2. Design principles

1. **The canvas is the interface.** Click to select, drag to move, handles to
   resize/rotate, double-click text to edit. One mental model, learnable in
   ten seconds. No modes, no jargon.
2. **Contextual, not cluttered.** Show only the controls relevant to what's
   selected. A text element shows font/size/color — nothing else.
3. **Pick, never paste.** Photos are chosen from a searchable grid. There is no
   "enter image URL" prompt anywhere (that was a key piece of old clunkiness).
4. **Forgiving.** Prominent undo/redo, snapping guides, auto-readable text over
   photos. Every action reversible.
5. **AI drafts, human polishes.** Generation produces a finished-looking
   arrangement of editable elements; the user is never staring at a blank page.
6. **Crash-safe by construction** (§3).

## 3. The hard architectural rule: FLAT LAYERS

The old app crashed reproducibly on ~the 3rd/4th slide. Crash traces showed the
**JS heap flat at ~5-6MB** while the tab was killed — proving the memory lived
in **native/GPU compositor space** (decoded images + stacked filter/scrim/blend
layers), which the JS heap counter never sees. Capping image resolution
(`app/api/images`) reduced it but did NOT stop the crash, because the dominant
cost was the renderer stacking many composited layers per slide.

**Therefore, by rule:**
- A slide = one solid/Image background + a flat list of positioned elements.
- **At most one** overlay per slide (e.g. a single CSS-gradient scrim baked into
  the background element — never a stack of translucent layers).
- **No** per-element `backdrop-filter`, stacked `filter`, `mix-blend-mode`, or
  multiple full-bleed decoded images per slide.
- **One** decoded background image per slide, served pre-capped (≤1280×1600).
- Only the **current** slide renders its heavy children. Off-screen slides in
  the strip render as lightweight thumbnails, not full live slides.

This rule is what makes the rebuild safe. Any feature that needs stacked
compositing must be redesigned to respect it.

## 4. Screen 1 — Create

```
                 LOATHR STUDIO

         What kind?                          ← content/voice; seeds the look
   ( Editorial ) ( Business ) ( How-to ) …

         Choose a look                       ← visual gallery, premium only
   ┌────────┐ ┌──────────┐ ┌──────────┐
   │Editorial│ │Enterprise│ │News Desk │      (seeded from the kind; click to override)
   └────────┘ └──────────┘ └──────────┘
            ● ○ ○

         What's it about?
   ┌──────────────────────────────────┐
   │ fifa world cup best moments      │
   └──────────────────────────────────┘

            [ ✨  Make my carousel ]
```

- **Kind first, then look.** Picking a content category (voice + role labels)
  seeds the visual look from its `defaultStyle`; the gallery shows that seed
  selected and overrides it on click. Once a look is chosen manually, later
  category changes affect voice only — they don't stomp the explicit pick.
  (`seedStyleFor` + `styleTouched` in `CreateScreen.jsx`.)
- Single topic input. One primary button. Nothing else on screen.
- On submit → run generation (§8) → land in the Editor with slides ready.
- Keep a quiet secondary affordance to open a recent/blank project (don't crowd
  the first screen).

## 5. Screen 2 — Editor

```
‹ Back     FIFA Moments          ↶  ↷        ⬇ Download
──┬─────────────────────────────────────────┬──
T │                                          │ Aa   ← contextual toolbar:
▢ │            ┌─────────────────┐           │ ◧      only the selected
⛰ │            │     SLIDE 3     │           │ A+     element's controls
✦ │            │   [ photo bg ]  │           │
🎨│            └─────────────────┘           │
──┴─────────────────────────────────────────┴──
   ▭ ▭ ▣ ▭ ▭ ▭ ▭ ▭   +        ← slide strip (thumbnails, drag-reorder, add)
```

- **Top bar:** back · project/topic name · undo/redo · Download (▾ current
  slide / all as images).
- **Left tool rail** (icon + label, big targets): **Text · Elements · Photos ·
  Templates · Brand.** Clicking opens a slim panel beside the rail.
- **Center workspace:** the artboard, zoom-to-fit, on a calm neutral backdrop.
- **Right contextual toolbar:** appears next to the selection; shows only
  relevant controls (text: font, weight, size, color, align; image: replace,
  crop, scrim toggle; shape: fill, corner). Empty when nothing's selected.
- **Bottom slide strip:** thumbnail per slide, current highlighted, tap to jump,
  drag to reorder, **+** to add, right-click/long-press to duplicate/delete.

## 6. Interaction model

- **Select:** click element. Marquee/empty-click to deselect. Esc deselects.
- **Move:** drag. **Resize:** corner/edge handles. **Rotate:** top handle.
- **Edit text:** double-click → inline contenteditable, live.
- **Snapping:** smart guides to slide center, edges, and sibling elements;
  snap to the artboard grid.
- **Undo/redo:** global, prominent, keyboard (Cmd/Ctrl+Z / Shift+Z) and buttons.
- **Delete:** Del/Backspace on selection; also a button in the contextual bar.
- **Keep it physical:** drag one element re-renders only that element (the
  store already isolates updates — preserve this).

## 7. Panels

- **Text:** "Add heading / subheading / body" presets that drop pre-styled text.
- **Elements:** rectangles, lines, simple dividers (flat fills only — no heavy
  effects).
- **Photos:** search box → grid of results from `/api/images` (already capped to
  ≤1280×1600). Tap to set as the selected slide's background (with an automatic
  readability scrim) or to place as an image element. **No URL entry.**
- **Templates:** swap the current slide (or whole deck) to another premium
  layout while keeping the content.
- **Brand:** accent color, fonts, logo/wordmark, sources style — applied deck-wide.

## 8. Generation

Reuse the existing contract: `app/api/generate` is a thin Anthropic proxy; the
client builds the prompt, parses, and instantiates slides.

- Keep `app/studio/generate.js` (prompt + robust JSON parse) and
  `app/studio/templates.js` (slide JSON → positioned elements), extending them
  per style family chosen on the Create screen.
- After text generation, fetch one photo per content slide via `/api/images`
  and set it as that slide's single background image (respecting §3).
- Editorial prompt/voice quality is a tuning task; structure is in place.

## 9. Export

Render the current slide (or all) to image via the existing approach, at
1080×1350. Because slides are flat, export is cheap and faithful.

## 10. Foundation: keep vs build

**Keep (this is the crash-safe core — do NOT regress it):**
- `app/studio/model.js` — pure element/slide/doc model.
- `app/studio/store.js` — reducer with isolated immutable updates.
- `app/studio/Artboard.jsx`, `Element.jsx`, `geometry.js`, `Toolbar.jsx` —
  selection, drag/resize/rotate, inline text edit.
- `app/studio/generate.js`, `templates.js` — generation + template instancing.

**Build / redesign:**
- The **Create screen** (style gallery + topic) — new.
- The **Editor shell** (top bar, left tool rail, right contextual toolbar,
  bottom thumbnail strip) — replaces the current minimal `Studio.jsx` chrome.
- The **Photos panel** with search grid (kill the URL prompt).
- **Style families** (Editorial first; Enterprise/News Desk as premium variants)
  as template sets feeding §8.
- **Undo/redo**, snapping guides, slide reorder/duplicate.
- **Thumbnail rendering** for off-screen slides (lightweight, per §3).

## 11. Build order (suggested)

1. Editor shell (rail + contextual toolbar + thumbnail strip) around the
   existing canvas. No new capability, just the clean frame.
2. Photos panel with `/api/images` search grid + set-as-background w/ scrim.
   This proves the §3 image path: generate a 9-slide photo carousel and confirm
   navigating every slide stays light. **This is the crux the old app failed.**
3. Create screen with the style gallery → wire to generation.
4. Undo/redo + snapping + slide reorder/duplicate.
5. Enterprise/News Desk style families + Brand panel.
6. Editorial prompt/voice quality pass.

## 12. Non-goals / guardrails

- Don't port any code or layout from the old monolith renderer. Treat it as
  reference for *content/voice* only, never for *rendering*.
- Don't introduce stacked compositing to chase a visual effect (§3).
- Don't add an image-URL input.
- Keep the output premium/editorial; "kid-friendly" is the controls, not the look.
