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
> **Phase 1 — DEBUG FIRST.** Work the "Debug-first backlog" below in order.
> Reproduce, fix, gate (test + build), and verify each (see "Verification
> recipes" — you can run the app locally and drive a real browser in-sandbox; you
> **cannot** reach the Vercel deploy or external feeds from here). Re-confirm
> trending on the deploy with the user via `?debug=1`.
>
> **Phase 2 — CONTINUE THE BUILD.** Then pick up the "Unfinished / follow-up
> build backlog," confirming order and showing a visual for each before coding.
>
> Honor the standing rules (show-visual-before-implementing; gate every change;
> the one-bg-image crash rule).

---

## 🐞 PART 1 — DEBUG-FIRST BACKLOG (do these first, in order)

Everything the user explicitly asked for is **shipped + gated + pushed**
(per-word text editor, the missing text effects, trending fixes, segment-header
kickers). These are the **known gaps / risks** a debugging pass should close.

### D1 · Trending — re-verify on the live deploy (HIGH; user-reported twice)
Fixes shipped but **not re-verified post-fix** (sandbox can't reach the deploy or
feeds — proxy returns 403/000). Root causes found & fixed:
- `"tour"` prefix-matched `"tournament"` → pulled the FIFA World Cup into Music.
  Now whole-word matching: `\b(term)(?:s|es)?\b` in `filterByTerms`.
- A section beat whose feed **failed** fell back to unfiltered general most-read
  (the leak). Now `selectTrending(…, hasFeeds)` keeps a feed-down section beat
  on-topic or empty, never general.
- Guardian entity-encoded HTML (`&lt;p&gt;`) leaked literal `<p>` into the R5
  grounding seed → fixed in `decodeEntities` (strip again after entity-decode).
- Added **`/api/trending?beat=X&debug=1`** → per-source `{url, ok, status, bytes}`
  + parsed counts. Use it.

**To verify** (ask the user to open these on the deploy, or reason from `debug`):
`/api/trending?beat=music&debug=1`, then `ent_ai`, `ent_tech`, `news_science`,
`tea`, `nightlife`, `trivia`. Confirm `sources` are `ok:200` with bytes, items
**on-topic and non-empty**. **Watch for:** TMZ/PageSix/JustJared (The Tea) and
`hnrss.org` (tech/ai/startups) may 403/fail from Vercel — swap dead feeds;
feed-less beats (photo/nightlife) lean on term-filtered general most-read and can
be thin; the whole-word match must not over-filter (section feeds broaden, but a
feed-less *term* beat can legitimately return empty). The confirmed-good signal:
the user's last `music&debug=1` showed Guardian `ok:200, 12 items` — feeds work;
it was purely the term match.

### D2 · Shaped-text + per-run styling — EXPORT parity gap (real WYSIWYG bug)
DOM renderers (`Element`/`StaticSlide` via `RichText`) draw per-run styling inside
a shape-backed text element, but `export.js` `drawShapedText` draws shaped text in
the **element base style only** — so a shape-backed text with a coloured/bold word
exports without it. **Fix:** generalize `drawShapedText` to draw runs (reuse the
`drawRichText` token loop inside the padded, vertically-centred box). Rare combo,
but a correctness gap. (Non-shaped text is already fully run-aware in export.)
Self-contained; screenshot-verifiable in-sandbox.

### D3 · Brand re-theme doesn't carry the new effects
`rethemeDoc` remaps `color` / `highlightColor` / `strikeColor` / `shapeFill` on a
palette swap, but **not** the new element-wide `textBg` / `textStroke`, nor
per-run `runs[].{color,bg,stroke}`. So a brand swap leaves styled spans/effects on
the old accent. Decide intended behaviour; if spans should follow the accent,
remap `runs[]` colours matching `prev.accent → next.accent` (+ `textBg`/`textStroke`).

### D4 · Per-word editor — edge cases to harden
- **Multi-line text** (Shift+Enter "\n"): verify a selection spanning lines styles
  the right range. Our model uses real `\n` chars (white-space: pre-wrap); some
  browsers may still inject `<div>`/`<br>` — `richedit.pointToIndex` tolerates
  `<br>`, but confirm on the deploy browser.
- **Undo granularity:** `applyStyle` dispatches `update{content,runs}` (tag
  `update:id`), which **coalesces** with adjacent updates; a burst of style clicks
  + typing may collapse into one undo step. If it feels wrong, give styling its own
  undo boundary.
- **FormatBar position** near the viewport top / on scroll (clamped to 8px — confirm
  it never clips).
- **Emoji / surrogate pairs:** offsets are JS code units; splitting a pair could
  mis-slice. Low priority.

### D5 · Regression sweep after the text-model change
Confirm: (a) a generated deck's `highlight` marker still renders on canvas +
thumbnail + **export** (it now folds into runs via `styledRuns`); (b) a normal
no-runs deck still exports identically (uniform fast-path → raw string / `drawText`);
(c) text-shape backings still render + "fit to text"; (d) old saved decks load
(no `runs` = fine).

---

## 🏗 PART 2 — UNFINISHED / FOLLOW-UP BUILD BACKLOG (after debugging)

Enhancements the user was told about (not half-built code in the tree). Confirm
scope + show a visual before each.

- **B1 · Live glyph preview while typing.** Today span styling renders on *commit*
  (click a control / click away), not glyph-by-glyph mid-type. Upgrade = a rich
  `contentEditable` (imperative `innerHTML` from runs + read-back). That approach
  was prototyped & jsdom-round-trip-verified, then trimmed for the robust v1 — see
  git history of `richedit.js` for `runsToHtml` / `domToContentRuns` /
  `setSelection`. Keep editing uncontrolled to avoid caret clobber.
- **B2 · Custom hex colour for spans.** The bar uses a brand-aware swatch strip (a
  native OS picker steals focus and drops the selection). Add an in-app
  swatch+hex popover that uses `mousedown→preventDefault`, or capture offsets then
  apply.
- **B3 · Trending resilience.** Per-beat fallback feeds; surface dead-feed state in
  the panel; a sturdier source for feed-less beats.
- **B4 · Parked.** Fate of the `/` monolith (redirect→`/studio`, `/legacy`, or
  retire); cloud history (DB + accounts); de-templating the Enterprise role
  fallbacks (model now writes `kicker`, but the categorical `role` fallback in
  `templates.js` `norm()` remains as a safety net).

---

## 🧪 Verification recipes (how to actually check things here)

- **Env constraint:** the agent proxy returns **403 for the Vercel deploy host**
  and **000 for external news feeds** (Guardian/HN/Wikipedia/TMZ…). You **cannot**
  reach the live deploy or any feed from the sandbox. Don't retry policy denials —
  report them. Trending must be verified by the **user** (open `?debug=1`) or
  reasoned from code + the pure `test/trending.test.mjs`.
- **Live UI verification IN-SANDBOX (works):** `npm run build` → `npx next start -p
  3210` (background) → drive a real browser with `npm i --no-save puppeteer-core`
  using the prebuilt Chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
  Enter the editor via **`/studio?demo=photos9`** (the Create screen is the
  default). External images 404 (proxy), but the UI + text editing work. This is
  how the per-word editor was verified (double-click heading → select word →
  FormatBar + apply colour).
- **DOM unit checks:** `npm i --no-save jsdom`; run a script with
  `node --import ./test/register.mjs <script>` (the project uses **extensionless
  ESM**, resolved by `test/register.mjs` + `test/resolver.mjs`; raw `node` can't
  resolve `./model`). `--no-save` keeps `package.json` clean — don't commit these.
- **Tests / build gate:** `npm test` → `node --import ./test/register.mjs --test
  test/*.test.mjs` (**167 passing**). `npm run build` (Next 16 / Turbopack).
- **Mockups:** headless Chromium screenshot of a `file://` HTML, e.g.
  `…/chrome --headless=new --no-sandbox --force-device-scale-factor=2
  --screenshot=out.png --window-size=W,H file://…`.

---

## 🗺 Architecture map — rich-text RUNS (the newest subsystem)

A text element keeps its plain `content` **string** (every existing reader, the AI
output, captions, search untouched) **plus** optional `el.runs` =
`[{start,end,…style}]` character-range overrides. Element-wide effects live on the
element: `textBg`, `textStroke`+`textStrokeWidth`, plus existing `color`,
`fontWeight`, `italic`, `strike`+`strikeColor`. The **per-run + element-wide** style
keys: `color, bold, italic, strike, strikeColor, bg, stroke, strokeWidth`.
(Font / size / line / tracking / align stay **element-wide** — can't vary
mid-paragraph.)

- **`model.js`** — `styledRuns(el)` → resolved contiguous spans (the renderers);
  `runSegments(content,runs)` → override-only segments (the editor); pure
  `applyRunStyle` / `clearRunStyle` / `remapRuns` (per-char overlay; remap keeps
  styling on the unchanged head/tail through edits); `isUniformText` (fast path);
  `elementBaseStyle`; the back-compat `highlight` marker folds in as a `bg` run.
  Unit-tested in `test/model.test.mjs`.
- **`RichText.jsx`** — renders `styledRuns` spans (live canvas + thumbnails);
  uniform text → raw string (byte-identical common case).
- **`export.js`** — `drawRichText` (per-token canvas: colour/weight/italic/strike/
  bg/outline) for non-uniform; `drawText` for uniform; `wrapRuns(ctx,runs,w,fontOf)`
  measures per-token font. **`drawShapedText` is NOT yet run-aware → D2.**
- **`richedit.js`** — `selectionOffsets(root)`: DOM selection → `{start,end}` char
  offsets (round-trip jsdom-verified). Plain-text editing only; styling goes
  through the store.
- **`store.js`** — `styleText {id,start,end,patch|clear}` (offset-based, pure
  helpers); `patchEl` **remaps runs** when `content` changes (unless explicit runs
  in the patch). `styleText` + `update` are in `MUTATES` (undoable).
- **`Element.jsx`** — plain-text contentEditable (uncontrolled, text never at
  risk); reports the live selection via `onTextSelect` (offsets + screen rect +
  effective style); exposes `applyStyle/clearStyle` via `onEditApi`; `onStyleApply`
  dispatches an **atomic** `update{content,runs}` (no commit/apply race).
- **`FormatBar.jsx`** — floating bar above the selection (brand swatches · B I S ·
  highlight · outline · A−/A+ · clear). Every control uses
  `onMouseDown→preventDefault` so the selection survives the click.
- **`Inspector.jsx`** — Type panel: grouped Character / Style / Colour & effects;
  element-wide strike/background/outline; blue **SELECTION** mode (toggles target
  the span; span colours deferred to the bar's swatches).
- **`Studio.jsx`** — `textSel` state + `editApiRef` bridge; renders `FormatBar`;
  passes `textSel` + handlers to `Inspector`; clears `textSel` on
  selection/slide change.

Three-renderer invariant (unchanged rule): **Element.jsx (live CSS),
StaticSlide.jsx (thumbnail), export.js (canvas PNG) must stay in sync** for any
text styling.

---

## ✅ Shipped recently (newest first, all on PR #9, gated)

- **Per-word text editor (B):** select a word/letters while editing → FormatBar +
  Inspector SELECTION → style just that span (colour/bold/italic/strike/background/
  outline). Live-verified with Puppeteer. (`8cb5969`)
- **Rich-text run model + 3 renderers + element-wide effects (A):** the run model;
  strikethrough / background / outline added to the Inspector element-wide.
  (`5997555`)
- **Trending whole-word term match** — killed `tour→tournament` (FIFA-under-Music).
  (`500d36f`)
- **Segment-header kicker** — the prompt now writes a slide-specific `kicker`
  (renderer already prefers it over the recycled role tag); trending `hasFeeds`
  hardening + `?debug=1`. (`da2b59c`)
- Earlier this arc: Create-screen redesign (Length / per-desk Trending / Voice &
  tone), matte-black + white-accent theme, R3 right-Inspector, text-shapes,
  generation quality rules (quotes attributed, specific headlines,
  stakes/human/evidence). The old "Track A/B backlog" in prior handovers is **done
  or superseded** — disregard it.

---

## 🔧 Key constraints recap
- Next 16.2.7 (Turbopack), pure ESM, **extensionless imports** (resolver hook in
  `test/register.mjs`). Tests: `node:test`.
- **Web search:** basic `web_search_20250305` (max_uses 4), NOT the code-exec
  dynamic-filtering variant (spirals past Vercel's cap → "Empty model response").
  Streaming does **not** exempt Vercel's `maxDuration`.
- Generation = `buildPrompt` → `/api/generate` (Opus 4.8, adaptive thinking,
  effort medium, streamed). Trending = keyless Guardian RSS + Wikipedia most-read,
  **zero Claude credits**. Live generation needs Anthropic credit (may be empty
  in-sandbox).
- Artboard 1080×1350; slide = background + flat element list (FLAT-LAYERS §3).
- Theme tokens in `app/studio/theme.js` (`UI`): matte black + white accent;
  `UI.select` (#2d8cff) is the blue selection colour (handles + SELECTION mode).
- Deploy preview: `https://mg-git-claude-charming-fermat-2niyvq-loathrs-projects.vercel.app/studio`.

---

## ⏭ Immediate next step (new session)
Start at **D1** (trending re-verify — ask the user for the deploy `?debug=1`
output for a few beats) and **D2** (shaped-text export run parity — self-contained,
screenshot-verifiable in-sandbox). Gate each; then proceed through D3–D5, then
Part 2.
