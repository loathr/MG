# Studio — Session Handover

A pick-it-up-cold snapshot of the LOATHR Studio rebuild on branch
`claude/charming-fermat-2niyvq` (PR #9). For the full architecture and as-built
rationale, read **`docs/STUDIO_REBUILD.md`** first — this file is the working
state on top of it.

> **Branch note:** the task harness may name a different dev branch (e.g.
> `claude/eager-galileo-…`). **Ignore it.** All work and the live PR (#9) are on
> `claude/charming-fermat-2niyvq`. Switching branches now would orphan the PR.

---

## ⚠️ Standing workflow rules (carry into every future handover)

1. **Show a visual before implementing.** Every build/feature change → render a
   mockup / diagram / rendered screen and get sign-off *before* writing code
   (also in `AGENTS.md`). Pure bug-fixes / backend / logic with no visual surface
   are exempt — just say so.
2. **No raw model id in committed artifacts** (commit msgs, comments, PR text).
   Chat replies only.
3. **The crash guardrail:** the historical crash was *stacked raster background
   images* (FLAT-LAYERS §3: one bg image + one scrim, never more). Add solid
   colour & vector (borders/outlines/strokes/text) freely; never reintroduce
   stacked background images.
4. **Gate every change:** `npm test` **and** `npm run build` must both pass
   before you commit. Commit in coherent increments.

---

## ▶️ PROMPT FOR THE NEW SESSION (start here)

> You are continuing the LOATHR Studio rebuild on branch
> `claude/charming-fermat-2niyvq` (PR #9). Read this handover end-to-end first.
>
> The recent threads: the **text / shapes editor** (BUILD QUEUE), the **Topic
> Routes** feature (shipped — see `docs/TOPIC_ROUTES.md`), and the **Look & Frame**
> editor gaps (mocked + approved, not yet built — top of the queue now). Work the
> **BUILD QUEUE** in order; each item's design is described; confirm anything
> ambiguous with a quick visual, then build, gate (test + build), and **verify
> live in-sandbox** (recipe below), commit, and push. One item per commit.
>
> Two open loops to also close: re-confirm trending on the deploy (the user
> pastes `?debug=1`), and the small debug-carryovers (D3–D5) when convenient.
>
> Honor the standing rules (show-visual; gate; one-bg-image crash rule).

---

## 🏗 BUILD QUEUE (the active work, in order)

The user's running complaint list, mapped to items. **B4 + B5 shipped; Topic
Routes shipped.** Next up is **BL (Look & Frame)** — mocked + approved. Then the
remaining text-editor items B3 → B2 → B1 → B6.

### BL · Look & Frame  ← DO FIRST (mocked + approved, not yet built)
Two editor gaps the user flagged, both in **Brand → Look** (`BrandPanel.jsx`):
1. **Frame colour control (scope 1a).** Frame bars are `locked` chrome
   (`Element.jsx:112` — non-interactive so a full-bleed edge frame can't intercept
   clicks) and the colour auto-follows the accent. Add a `brand.frameColor` field
   + a colour picker under the Frame modes; thread it through `frameElements`
   (`templates.js`) and the `frame`-fill remap in `rethemeDoc`/`setFrame`
   (`store.js`). Frame STAYS locked chrome — no canvas move. Colour falls back to
   the accent when unset (so existing decks are unchanged).
2. **Layout-family switch (scope 2b).** Brand → Look only offers the 9 colour
   palettes (`EDITORIAL_PALETTES`); the layout *family* (Editorial `cover` /
   Enterprise `dossier` / News Desk `masthead`, in `styles.js` `layouts`) is baked
   in at creation and not switchable. Add a `setFamily` reducer action that
   re-flows every slide into the new family's cover/content `layouts` + applies its
   fonts, **leaving the colour palette intact** (layout-only, so a custom colour
   look isn't stomped). Reuse `reflowSlide` / `rethemeDoc`. Mock shown this session
   (the revised Brand → Look panel: Layout family row + Frame colour picker).

### B4 · Editable shape Body / Border / Text colours  ✅ SHIPPED (`02ea429`)
Done this session — Fill=body / Border / tail-follows-body, 3-renderer parity,
`setShape` clears overrides, `rethemeDoc` carries them. Live-verified.
**Why (kept for context):** the user says bubbles are "limited to fixed accent colours." **Root
cause (diagnosed):** in `shapes.js` `shapePaint(el)`, the **speech / tag / banner
/ stamp / default** variants render a *fixed dark plate* (`SHAPE_BACKING =
rgba(12,12,14,.9)`) with the accent only on the **border + tail**; **pill / cloud
/ note** fill the body with the accent. The Inspector "Fill" writes `el.shapeFill`
= that accent, so on a speech bubble it changes the outline/tail, not the body —
hence "nothing happens."
**Approach (additive, preserves every existing deck's look):**
- `shapePaint`: after the existing `switch`, apply overrides —
  `if (el.shapeBody != null) p.bg = el.shapeBody; if (el.shapeBorderC != null) p.border = el.shapeBorderC;`
  Defaults unchanged when the fields are absent.
- Tail/ear follow the body when overridden: in `ShapeBacking.jsx` (DOM speech
  tail) and `export.js` `drawShapeBacking` (speech tail uses `el.shapeFill`
  today) → use `el.shapeBody != null ? el.shapeBody : el.shapeFill`.
- Inspector `ShapeSection`: relabel so **Fill = body** (`shapePaint(el).bg`,
  writes `shapeBody`), add **Border** (`shapePaint(el).border`, writes
  `shapeBorderC`); Text colour stays in the Type section (`el.color`). The
  raw `shapeFill` stays underneath as the brand-seeded default (drives defaults +
  rethemeDoc).
- `store.js` `setShape`: clear `shapeBody`/`shapeBorderC` on variant switch /
  removal so a fresh variant uses its defaults.
- `rethemeDoc`: remap `shapeBody`/`shapeBorderC` matching `prev.accent` (like the
  existing `shapeFill` remap) so brand swaps carry them.
- Tests: `shapePaint` override cases in `test/shapes.test.mjs`.
Design was previewed in the anchor mock ("Shape colours — now fully editable:
Fill / Border / Text"). Three-renderer parity required.

### B3 · Per-span SIZE
**Why:** "select a word, change size — still resizes the whole segment." Per-span
styling currently covers colour/bold/italic/strike/bg/outline but **not size**
(size is element-wide; the bar's A−/A+ say "whole text").
**Approach:** add `size` to `RUN_STYLE_KEYS` (model.js); `styledRuns` resolves a
per-span `fontSize` (base = `el.fontSize`). Renderers: RichText sets inline
`fontSize` per span (DOM line-height handles mixed sizes); **export** is the
careful part — `wrapRuns` already measures with a per-token `fontOf`, but
`drawTokenLines` must use **per-line max fontSize** for line-height + baseline
when sizes vary. Bar A−/A+ → target the span when `textSel` active (Studio
`sizeSpan` currently does element fontSize); add a size field to the Inspector
SELECTION block. Tests for the per-char size overlay.

### B2 · Custom-hex colour popover for spans
**Why:** span colours come from a fixed 6-swatch strip ("a step down"). **Native
OS picker can't be used while editing** — it steals focus and drops the text
selection.
**Approach:** an in-app `ColorPopover` that holds focus (`onMouseDown` →
`preventDefault`): brand swatches + recents + a hex input (+ optional eyedropper).
Wire into `FormatBar` (text / bg / outline span colours) and the Inspector
SELECTION block. Mock shown: `b2-custom-colour` (brand & presets, recent, hex,
hue strip). Recents can live in component state or localStorage.

### B1 · Live styling preview WHILE editing
**Why:** today span styling renders on *commit* (click a control / click away),
not glyph-by-glyph mid-type. Mock shown: `b1-live-preview` (today=plain vs
proposed=styled live).
**Approach (the heavy one):** a rich `contentEditable` — populate it imperatively
from `styledRuns` (innerHTML) on edit start and read it back on input; keep React
OUT of the contentEditable's children so a store update never clobbers the caret.
The serialize↔deserialize was prototyped + jsdom-round-trip-verified earlier
(runsToHtml / domToContentRuns / setSelection) then trimmed for the robust v1 —
re-derive from that approach. `richedit.js` currently exports just
`selectionOffsets`. Verify live with Puppeteer before shipping.

### B6 · Element-tether anchor (bonus; "works as well")
Anchor a floating bubble/sticker/note to a text segment so it travels with it.
Model = a child element storing `anchorId` + offset; moving the parent moves the
child; a dashed tether + an ⚓ badge show the link; Re-anchor / Detach in the
Inspector. Mock shown: `b5-anchor`. Lowest priority.

---

## 🐞 OPEN DEBUG CARRYOVERS (close when convenient)

- **D1 · Trending — confirm on the deploy.** All four reported issues are FIXED
  in code (commit `4e4f16c`, see below) but the sandbox can't reach the deploy
  (proxy 403/000). Ask the user to re-open
  `…/api/trending?beat=X&debug=1` for **tea** (expect gossip only, no films),
  **nightlife** (expect non-empty), **ent_ai** (expect vetted HN + real
  extracts); **music** already verified clean. Adjust the `ENOUGH`/`points`
  thresholds if any still looks off.
- **D3 · Brand re-theme carry.** `rethemeDoc` still doesn't remap the newer
  styling: element-wide `textBg`/`textStroke` and per-run `runs[].{color,bg,stroke}`.
  Decide (recommended: extend the existing match-and-remap) and fold in — pairs
  naturally with B4's `shapeBody`/`shapeBorderC` remap.
- **D4 · Editor edge cases.** Multi-line selection offsets (Shift+Enter "\n");
  undo granularity (per-span `update{content,runs}` coalesces under tag
  `update:id`); FormatBar clamping near the viewport top; emoji/surrogate pairs.
- **D5 · Regression sweep.** Confirm the generation `highlight` marker still
  renders in all three renderers (it now folds into `styledRuns`), a normal
  no-runs deck still exports identically (uniform fast path), and text-shape
  backings still fit.

---

## 🧪 Verification recipes (how to actually check things here)

- **Env constraint:** the agent proxy returns **403 for the Vercel deploy host**
  and **000 for external news feeds**. You **cannot** reach the live deploy or any
  feed from the sandbox — don't retry policy denials. Trending is verified by the
  **user** (`?debug=1`) or reasoned from code + `test/trending.test.mjs`.
- **Live UI verification IN-SANDBOX (works, and is how B5 etc. were verified):**
  `npm run build` → `npx next start -p 3210` (background) → drive a real browser
  with `npm i --no-save puppeteer-core` using the prebuilt Chromium at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Enter the editor via
  **`/studio?demo=photos9`** (the Create screen is the default). For shapes: click
  the rail **Elements** button, then a shape tile (title `Add <Shape>`); the
  Inspector Shape section then shows Fill/Tail/vAlign etc. External images 404
  (proxy), but the UI + text/shape editing work. Kill the server when done.
- **DOM unit checks:** `npm i --no-save jsdom`; run a script with
  `node --import ./test/register.mjs <script>` (extensionless ESM, resolved by
  `test/register.mjs`). `--no-save` keeps `package.json` clean — never commit
  these.
- **Tests / build gate:** `npm test` (**193 passing**) and `npm run build`
  (Next 16 / Turbopack).
- **Mockups:** headless Chromium screenshot of a `file://` HTML
  (`--headless=new --no-sandbox --force-device-scale-factor=2 --screenshot=out.png
  --window-size=W,H`). Mocks live in the session scratchpad, not the repo.

---

## 🗺 Architecture map (the editor subsystems)

**Rich-text RUNS** — a text element keeps its plain `content` string PLUS optional
`el.runs` = `[{start,end,…style}]` character-range overrides. Element-wide effects
on the element: `textBg`, `textStroke`+`textStrokeWidth`, plus `color`,
`fontWeight`, `italic`, `strike`+`strikeColor`. Per-run + element-wide style keys:
`color, bold, italic, strike, strikeColor, bg, stroke, strokeWidth` (B3 adds
`size`). Font / line / tracking / align stay element-wide.
- `model.js` — `styledRuns(el)` → resolved render spans; `runSegments` →
  override-only segments (editor); pure `applyRunStyle`/`clearRunStyle`/`remapRuns`
  (per-char overlay); `isUniformText` (fast path); `elementBaseStyle`. Back-compat
  `highlight` folds in as a bg run. Unit-tested in `test/model.test.mjs`.
- `RichText.jsx` — renders `styledRuns` spans (live canvas + thumbnails); uniform
  → raw string.
- `export.js` — `drawRichText` (non-shaped) + `drawShapedText` (shaped, now
  run-aware) both call the shared `drawTokenLines` (per-token colour/weight/
  italic/strike/bg/outline); `drawText` for the uniform fast path;
  `wrapRuns(ctx,runs,w,fontOf)`.
- `richedit.js` — `selectionOffsets(root)`: DOM selection → char offsets.
- `store.js` — `styleText {id,start,end,patch|clear}`; `patchEl` remaps runs on
  content change. `styleText`/`update` are undoable.
- `Element.jsx` — plain-text contentEditable (uncontrolled; text never at risk);
  reports the live selection (`onTextSelect`: offsets + rect + effective style);
  `applyStyle`/`clearStyle` via `onEditApi`; `onStyleApply` dispatches an atomic
  `update{content,runs}`.
- `FormatBar.jsx` — floating bar over the selection (swatches · B I S · highlight
  · outline · A−/A+ · clear); every control `onMouseDown`→`preventDefault` to keep
  the selection.
- `Inspector.jsx` — Type panel (Character / Style / Colour & effects, element-wide
  effects + blue SELECTION mode) and `ShapeSection` (shape variant, Fill, Tail,
  **vAlign top/middle/bottom**, Fit, Remove).
- `Studio.jsx` — `textSel` state + `editApiRef` bridge; renders `FormatBar`.

**Text SHAPES** — a shape rides on a text element (`el.shape` + `el.shapeFill` +
`el.tailSide` + `el.vAlign`), not a separate type. `shapes.js`: `SHAPE_VARIANTS`
(8), `shapePaint(el)` → `{bg, border, dashed, rule}` (the **B4 target**),
`shapePad`, `shapeVAlign` (B5), geometry helpers. Rendered by `ShapeBacking.jsx`
(DOM, used by Element + StaticSlide) and `drawShapeBacking` in `export.js`.

Three-renderer invariant: **Element.jsx (live CSS), StaticSlide.jsx (thumbnail),
export.js (canvas PNG) must stay in sync** for any text/shape change.

---

## ✅ Shipped recently (newest first, all on PR #9, gated)

- `6b37ecd`,`15ef82f` **Look & Frame** — editable frame colour
  (`brand.frameColor`) + switch the layout family (Editorial/Enterprise/News
  Desk) on an existing deck (`setFamily`, keeps colour). Both live-verified.
- `da0ad63`→`28517a9` **Cloud layer (auth + storage groundwork)** — server-only
  image keys; `cloud.js` guarded config gate + serialization; Firebase **Google
  sign-in gate** (AuthGate, no-op when unconfigured) + **token-gated**
  `/api/generate`; Firestore **adapter** (`firebaseStore.js`); **`docs/CLOUD_SETUP.md`**
  provisioning guide. Both gate paths verified in-sandbox; live Firebase is
  deploy-only. Remaining: the Studio autosave/Projects **wiring** (rank #2).
- `558919b`→`1273e96` **Topic Routes (Tiers 1–3)** — the monolith's per-desk
  routing, folded in as optional framing over the live feed ($0, no preset
  topics). Desk-adaptive route dropdown (Beat/Sector/Section) carried into
  generation; News Region + Urgency; Enterprise Depth; advanced Angle/Emphasis/
  Mode. Spec + decisions in **`docs/TOPIC_ROUTES.md`**. Route plumbing in
  `buildPrompt` is additive (empty route = byte-identical). Live-verified in-app.
- `02ea429` **Editable shape Body / Border colours (B4)** — Fill=body, Border,
  tail-follows-body; 3-renderer parity; `setShape`/`rethemeDoc` carry. Live-verified.
- `03cd8cc` **Shape text vertical-align** (top/middle/bottom) — the user's
  "anchor" ask. `shapeVAlign` + Inspector toggle + 3 renderers. Live-verified.
- `4e4f16c` **Trending — the four debug-driven fixes**: Tea film-leak (rich feed
  no longer mixes most-read), Nightlife/Photo empty rail (filtered parent feeds +
  `filterFeed` flag), ent_ai HN noise (points≥50 + boilerplate strip), gossip
  thumbnails (img in content:encoded). `selectTrending(…, hasFeeds, filterFeed)`.
- `a476160` **Shaped text exports per-run styling** (drawShapedText run-aware via
  shared `drawTokenLines`).
- `dbf8e2b` HANDOVER rewrite (this file's prior version).
- `8cb5969` **Per-word text editor (B)** — select a span → FormatBar + Inspector
  SELECTION → colour/bold/italic/strike/background/outline. Puppeteer-verified.
- `5997555` **Run model + 3 renderers + element-wide effects (A)**.
- `da2b59c` segment-label `kicker` + trending `hasFeeds` + `?debug=1`.
- `500d36f` trending whole-word term match (the FIFA-under-Music fix).

---

## 🔧 Key constraints recap
- Next 16.2.7 (Turbopack), pure ESM, **extensionless imports** (resolver hook in
  `test/register.mjs`). Tests: `node:test`.
- Generation = `buildPrompt` → `/api/generate` (Opus 4.8, adaptive thinking,
  effort medium, streamed; basic `web_search_20250305`, max_uses 4 — NOT the
  code-exec variant). Live generation needs Anthropic credit (may be empty
  in-sandbox). Trending = keyless Guardian RSS + Wikipedia most-read (zero Claude
  credits).
- Artboard 1080×1350; slide = background + flat element list (FLAT-LAYERS §3).
- Theme `app/studio/theme.js` (`UI`): matte black + white accent; `UI.select`
  (#2d8cff) = blue selection (handles + SELECTION mode).
- Deploy preview:
  `https://mg-git-claude-charming-fermat-2niyvq-loathrs-projects.vercel.app/studio`.

---

## ⏭ Ranked build order (canonical next-steps)
1. ~~**Look & Frame**~~ ✅ SHIPPED (frame colour `6b37ecd`; layout-family switch `15ef82f`).
2. **Finish Cloud wiring** — autosave + Projects screen + load-on-open into
   `Studio.jsx`, gated by `isCloudEnabled` (disabled path must stay identical).
   The adapter (`firebaseStore.js`), auth gate, and `CLOUD_SETUP.md` are done;
   this is the last cloud piece. Deploy-verified only (no Firestore/auth in
   sandbox) — verify the disabled path is unchanged here.
3. **B3 · Per-span SIZE** — next text-editor item (approach in BUILD QUEUE).
4. **D3 · rethemeDoc remap** of `textBg`/`textStroke`/per-run colours (small).
5. **B2 · Custom-hex colour popover.**
6. **Cloud 11c · uploads → Cloud Storage** (Firestore 1 MB doc limit; deploy-only).
7. **B1 · Live styling preview** (the heavy one).
8. **B6 · Element-tether anchor** (bonus).
9. **D4 / D5** · editor edge cases + regression sweep.
10. **D1** · trending `?debug=1` confirm — the user's check on the deploy.

Two standing caveats (sandbox limits, not gaps): no real end-to-end **generation**
(needs Anthropic credit) and no live **external-feed**/Firestore/auth — covered by
unit tests + the user's deploy checks.
