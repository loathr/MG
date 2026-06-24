# Studio Rebuild — Step 3: the "pick a look" Create screen

> Status note for `docs/STUDIO_REBUILD.md` §4, §8, §11 step 3.

## What this delivers

Screen 1 of the product flow (§4): **pick a look first → type the topic → one
button → land in the editor with slides ready.**

- **Create screen** (`CreateScreen.jsx`): a "Choose a look" gallery of real
  rendered previews, a single topic input, a primary "Make my carousel" button,
  and a quiet "Start from a blank canvas" link. Nothing else competes (§4).
- **Style families** (`styles.js`): Editorial / Bold / Minimal as premium look
  parameter sets (palette, fonts, weights, accent). The templates render any
  family by swapping these — same layouts, different look. (Layout-level family
  divergence is §11 step 5; this is the foundation it builds on.)
- **Style-aware generation**: `generateCarousel(topic, { style })` →
  `slidesToDoc(slides, style)` → templates render the deck in the chosen family.
- **Real previews** (`StylePreview.jsx` + `StaticSlide.jsx`): each gallery card
  is the *same* `coverTemplate` code the editor uses, scaled down — "what you
  pick is what you get". `StaticSlide` is factored out of `SlideThumb` so the
  strip and the previews share one faithful renderer.
- **Screen switching** (`Studio.jsx`): lands on Create; generate or "start blank"
  → editor; the editor top bar is now back + editable project name. `?demo=photos9`
  still jumps straight to the editor.

## How to test (mostly without spending generation tokens)

| Path | Needs tokens? | How |
| --- | --- | --- |
| Create screen renders, three looks distinct | No | Open `/studio` on the preview — the gallery shows Editorial (red/serif/dark), Bold (yellow/Arial-Black/dark), Minimal (cream/serif/light). Selecting a card highlights it. |
| Start blank → editor | No | "Start from a blank canvas" → empty slide, full editor (rail, panels, strip). |
| Photos + FLAT-LAYERS proof | No | `/studio?demo=photos9` (see `STEP3`'s sibling `STEP2_PHOTOS.md`). |
| Image search | No (uses image keys, free) | Editor → Photos → search. Or `curl -X POST …/api/images -d '{"q":"…"}'`. |
| Full pick-a-look → **generate** | **Yes** (`/api/generate`, Anthropic) | Type a topic, "Make my carousel". Spends tokens — run only with go-ahead. |

Headless checks that ran in CI/build: `next build` compiles + type-checks; the
`/studio` prerender contains the gallery, all three style labels, the preview
headline, and each family's distinct palette — so the Create screen renders
without a browser.

## Not in this step

- Auto-fetching a photo per content slide during generation (§8 enhancement) —
  for now decks generate on solid backgrounds; add photos via the Photos panel.
- Distinct per-family *layouts* and the Brand panel (§11 step 5).
- Undo/redo, snapping, slide reorder/duplicate (§11 step 4).
