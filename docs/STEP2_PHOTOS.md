# Studio Rebuild — Step 2: Photos panel + the FLAT-LAYERS image-path proof

> Status note for `docs/STUDIO_REBUILD.md` §11 step 2 — "the crux the old app
> failed." Read alongside §3 (FLAT LAYERS) and §7 (Panels).

## What this delivers

The image path is the thing that crashed the old monolith: nine full-bleed
photos, decoded into native/GPU memory, navigated one slide at a time until the
OS killed the tab. Step 2 makes that path safe **by construction** and gives the
user a real way to add photos.

- **Photos panel** (`app/studio/PhotosPanel.jsx`): a search box → grid of results
  from `/api/images`. Tap a result to **set it as the current slide's background**
  (with an automatic readability scrim) or **add it to the canvas** as a movable
  image element. "Pick, never paste" — the `window.prompt("Image URL:")` is gone.
- **Search mode on `/api/images`** (`app/api/images/route.js`): a flat
  `{ q } → { results }` branch that mixes Unsplash/Pexels/Pixabay/Commons,
  deduped. Every `url` is **pre-capped to ≤1280×1600** (Unsplash was previously
  uncapped — now fixed, so the route's stated cap is true for all providers).
- **Lightweight slide strip** (`app/studio/SlideThumb.jsx`): off-screen slides
  render only `bg.thumb` (a ~200–400px image), never the full-res `bg.src`.
- **Editor shell**: left tool rail (Text · Elements · Photos · Templates · Brand)
  with slim panels; the numbered slide buttons are now real thumbnails + an add.

## The FLAT-LAYERS invariant (§3) and how to verify it

**Invariant:** at any moment, exactly **one** full-resolution background image is
mounted — the active slide's, inside `Artboard`. Every other slide in the strip
holds only its small `thumb`. So a 9-slide photo deck never holds more than one
heavy decode in native memory, no matter how you navigate.

This is enforced structurally, not by discipline:

| Where | Renders | Marker |
| --- | --- | --- |
| `Artboard.jsx` (active slide only) | full-res `bg.src` | `data-role="artboard-bg"` |
| `SlideThumb.jsx` (every strip item) | small `bg.thumb` only | `data-role="thumb-bg"` |

`bg.src` appears in exactly one component (the active Artboard); `SlideThumb`
never references it. Image *elements* follow the same rule: full `src` on the
active artboard, `thumb` in the strip.

### Browser proof (run on the Vercel preview for PR — this sandbox has no browser)

1. Open `…/studio?demo=photos9` (loads a 9-slide photo carousel; no API keys or
   generation tokens needed — uses picsum.photos).
2. In DevTools console, assert the invariant while clicking through all 9 slides:
   ```js
   // Always 1 — only the active slide mounts a full-res background.
   document.querySelectorAll('[data-role=artboard-bg]').length   // => 1
   // Equals the slide count — strip thumbnails are the small variant.
   document.querySelectorAll('[data-role=thumb-bg]').length      // => 9
   ```
3. In the Memory / Performance Monitor, watch JS heap **and** (the part the old
   crash traces couldn't see) the process's native footprint. Navigating every
   slide should keep both flat — no per-slide ratchet. The old app ratcheted ~8MB
   of native bitmap per slide and died around slide 3–4.

### Quick API check (works headless)

```bash
curl -s -X POST localhost:3000/api/images -H 'Content-Type: application/json' \
  -d '{"q":"mountains"}' | head
# Every Unsplash/Pexels url contains w=1280&h=1600; thumbs are small.
```

## Not in this step (kept for their own passes, per §11)

- Undo/redo, snapping-guide UI, slide reorder/duplicate (step 4).
- Bold/Minimal style families + Brand panel (step 5).
- The "pick a look" Create screen (step 3).
- Export wiring (§9).

Templates/Brand rail items are intentionally placeholders for now.
