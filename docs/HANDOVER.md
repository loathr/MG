# Studio — Session Handover

A pick-it-up-cold snapshot of the Studio rebuild on branch `claude/charming-fermat-2niyvq`.
For the full architecture and as-built rationale, read **`docs/STUDIO_REBUILD.md`** first —
this file is the working state on top of it.

---

## ⚠️ Standing workflow rules (carry into every future handover)

1. **Show a visual before implementing.** Every build/feature change → render a mockup /
   diagram / rendered screen and get sign-off *before* writing code. (Also in `AGENTS.md`.)
2. **Push only when the user explicitly says "push."**
3. **No raw model id in committed artifacts** (commit msgs, comments, PR text). Chat replies only.
4. **The crash guardrail:** the historical crash was *stacked raster background images*
   (FLAT-LAYERS §3: one bg image + one scrim, never more). **Add solid color & vector
   (borders/outlines/strokes) freely; never reintroduce stacked background images.**

---

## 📍 PHASE — where we are

- The **Trending & Generation build** (per-desk route dropdowns, universal Length, Option B
  grounding, beat→Look color) is **fully designed and signed off, but NOT yet coded.**
- A **new Brand & Design agenda** just opened (per-desk cover wordmarks, Courier Prime,
  UI-color parity, borders, outlining) — design ideas captured as visuals, not yet specced
  to file level.
- **Nothing from these two tracks is implemented yet.** Both are deferred to a **new session**,
  which should begin with the Brand & Design track.
- Per-desk color decision is settled: **B** (identity-true accent color-code on all three desks).

---

## ▶️ PROMPT FOR THE NEW SESSION (start here)

> You are continuing the LOATHR Studio rebuild on branch `claude/charming-fermat-2niyvq`.
> Read this handover end-to-end first. Then, **before writing any code** (standing rule):
> 1. **Confirm the phase** — restate what's designed-but-unbuilt vs. open, so we're aligned.
> 2. **Break down the remaining work to file level and rank it** (use the Ranked Backlog below
>    as a start; refine it and confirm the order with the user — the user wants to *begin with
>    the Brand & Design track*).
> 3. **Provide visual samples** for each item you're about to build, and get sign-off.
> Honor: show-visual-before-implementing, push-only-on-"push", and the one-bg-image crash rule.

---

## 🗂 RANKED BACKLOG (recommended; new session to confirm with user)

The user's stated starting point is **Track A (Brand & Design)**. Track B (Trending) is the
most shovel-ready (fully specced) and slots in whenever the user wants.

### Track A — Brand & Design (begin here)

**R1 · Per-desk cover wordmarks** *(a brand element, not a generation output)*
- **Editorial:** struck-out `LOATHR` wordmark on the cover (red strikethrough), top-left.
- **Enterprise:** `Enterprise` with `by Loathr` underneath, **both left-aligned**.
- **News Desk:** **masthead only** — its own nameplate, **no Loathr on the cover**; Loathr
  appears on the **closing page** (and signs off every deck).
- **All "loathr" brand text → Courier Prime** (add the Google font to the stack).
- Crash-safety: text/vector — safe.

**R2 · Brand · Elements edit subsection** *(architecture — the user's idea)*
- A dedicated Brand-panel subsection to **edit the per-desk wordmark/lockup directly**,
  decoupled from generation. Houses R1's controls; a clean home to share/iterate brand ideas.
  Likely a new component + brand-state fields (extend `store.js` brand helpers).

**R3 · UI color parity with the original build**
- Port the monolith's per-desk **UI theming** (page/panel/button/input colors, optional subtle
  CSS textures) from `ENTERPRISE_THEME` / `NEWSDESK_THEME` / `NEWSDESK_UI_TEXTURE` into the
  Studio chrome.
- Crash-safety: UI theming is **solid color / gradient**, not image compositing — safe under
  the one-bg-image rule.

**R4 · Borders & outlining design elements**
- Frames, corner brackets, outlined headlines (`-webkit-text-stroke`), outlined numerals,
  stroked shapes/lines/badges, hairline rules — as slide design options. (Borders were the
  old "bubbles/borders" item.)
- Crash-safety: all **vector** (CSS `border`/`outline`/`text-stroke`, SVG `stroke`) — safe.
- Note: `export.js` draws text to canvas manually — any new text stroke/outline must be
  mirrored there (as `highlight` is), or it won't appear in the PNG export.

### Track B — Trending & Generation (fully specced, shovel-ready)

| Part | What | Files |
|---|---|---|
| 5a | **Per-desk route dropdowns** — `BEATS` → `DESK_BEATS` (Editorial 9 / Enterprise 13 sectors / News 10 desks); beat selector becomes a styled **dropdown**; old Enterprise `ENTERPRISE_TOPICS` + News `NEWSDESK_DESKS` descs → filter `terms`. | `trending.js`, `api/trending/route.js`, `TrendingPanel.jsx` |
| 5b | **Universal Length** — `Brief·5 / Standard·8 / Deep·10` by the Make button; replaces the hardcoded "7 to 9 slides total" line in `buildPrompt`. Default Standard. | `CreateScreen.jsx`, `generate.js`, `Studio.jsx` |
| 5c | **Option B grounding** — carry the trending item's `extract`+`source` (dropped today in `rankItems`) into the prompt as a "Context — trending now" anchor ("verify & update via search; don't paraphrase"). Editing the topic clears the grounding. | `trending.js`, `route.js`, `TrendingPanel.jsx`, `CreateScreen.jsx`, `generate.js` |
| 5d | **Beat → Look color** — Editorial: full-palette Look via `paletteBrand` (9 beats↔9 Looks). **B per-desk color:** Enterprise per-sector **accent only** (stays B&W); News per-desk **section-flag color** (stays newsprint). Non-destructive (Brand panel can still swap). | `trending.js`, `TrendingPanel.jsx`, `CreateScreen.jsx`, `Studio.jsx` |
| 5e | **Tests** — `getBeat(desk,key)` signature + `DESK_BEATS` + beat→Look map. | `test/trending.test.mjs` |

- **Depth → counts:** brief = 5 (cover+3+closer); standard = 7–9 (unchanged); deep = 10–11
  (allow 1–2 extra analytical beats — the 6-role sets run short otherwise).
- **Beat→Look (Editorial):** film→film · music→art · sports→sports · fashion→fashion ·
  food→food · tea→gossip · photo→photo · nightlife→nightlife · trivia→trivia
  (`EDITORIAL_PALETTES` in `styles.js`).

---

## ✅ Decisions log (this arc)

- Trending = **live-only, cued, hidden, desk-specific**; FREE keyless feeds (Wikipedia
  most-read + per-beat RSS) → **zero Claude credits**.
- Theme control = **lean dropdown** (not a chip wall).
- **Desk = design**; content = topic × desk-voice × seeded angle/tone × research × length;
  Trending only supplies the topic (+ B grounding). The **only** place Trending touches the
  look = the new beat→color tie-in.
- **Depth is universal** (not Enterprise-only) — doubles as the cost + Vercel-timeout lever.
- Per-desk color = **B** (Editorial full palette; Enterprise per-sector accent; News per-desk flag).
- Brand wordmarks = **brand element**, edited in a Brand·Elements subsection — not generated.

---

## Snapshot / how to work here

- **Branch:** `claude/charming-fermat-2niyvq` (develop + push here only).
- **Preview:** `https://mg-git-claude-charming-fermat-2niyvq-loathrs-projects.vercel.app/studio`
  (append `?v=<sha>` to pin a build).
- **Build (the real gate):** `npm run build` before every commit — catches JSX/import errors
  across the whole module graph.
- **Unit tests:** `npm test` (committed) — `node:test` over `test/*.test.mjs` with an
  extensionless-import resolver (`test/register.mjs` → `test/resolver.mjs`). ~89 checks. Add a
  `test/<module>.test.mjs` per new pure module.
- **Commits:** conventional, imperative subject; end with the `Co-Authored-By` / `Claude-Session`
  trailers (see `git log`). Commits are SSH-signed (a local "Unverified" from the stop-hook is a
  false-positive — no `allowedSignersFile`; GitHub verifies fine).

---

## Shipped recently (newest first)

- `e34d8c7` `AGENTS.md`: show-a-visual-before-implementing workflow rule.
- `53d044d` Trending — fix missing photos + clean card layout.
- `7d16212` **live Trending panel** — cued, category-tied, free feeds (no credits).
- `e9efbce` **entity photos (#6)** — Wikipedia/Wikidata before stock search.
- `fd9d1e1` text editing: **Enter commits, Esc cancels, Shift+Enter newline**.
- `dc0834e` **landing redesign (Option C)** + "Looks" relabel.
- `f09eefc` fix text edits reverting on click-away.
- `6b4a352` fix "Empty model response" — **basic web search**, not the code-exec variant.
- `57bad8c` web search **ON by default**, cancellable, progress + Quick draft.
- `25923f7` draft fast, source via fact-check.
- `fabf939` **fact-check** verify pass (rank 2).
- `20cc20d` web-search sourcing, voice variety, date anchor.
- (earlier: `a5d4d60` feature split layout · `d90bb04` feature image+text family · `bff9b08`
  stat/versus role-tie · `3c4cedb` per-category caution · `4f7235d` highlight emphasis ·
  `d565cea` Enterprise family · `2d190da` News Desk family — see prior handover history.)

---

## Key files

- `styles.js` — the 3 style families (Editorial / Enterprise / News Desk): palette + fonts +
  per-family `layouts`. `brandFromStyle`, the 9 `EDITORIAL_PALETTES`, `paletteBrand`.
- `templates.js` — pure layout registry, `renderLayout` (+ `highlight` post-process),
  `reflowSlide`, `slidesToDoc` (generation → doc; routing incl. stat/versus + caution).
- `store.js` — reducer + history; brand helpers `rethemeDoc`, `stampLogo`, `carryBrandKit`;
  actions `applyBrand`, `setLogo`, `setCaution`, `setLayout`. **(R2 brand-elements extends here.)**
- `categories.js` — content kinds (voice + roles + `defaultStyle` + `caution`). `cautionFor`.
- `generate.js` — `buildPrompt` (+ `ANGLES`/`VOICES` seeded by topic hash) + `generateCarousel`
  (calls `/api/generate`, `/api/images`, then `slidesToDoc`). `MODEL`, `WEB_SEARCH_TOOL` (basic).
- `trending.js` + `api/trending/route.js` — pure feed parsing + keyless route. **(5a–5d edit here.)**
- `entity.js` + `api/images/route.js` — Wikipedia/Wikidata entity-photo resolution.
- `verify.js` + `FactCheckPanel.jsx` — fact-check verify pass.
- Renderers: `Element.jsx` (live), `StaticSlide.jsx` (thumb/preview), `export.js` (canvas → PNG),
  `RichText.jsx` (highlight). Panels: `CreateScreen.jsx`, `BrandPanel.jsx`, `TrendingPanel.jsx`,
  `TemplatesPanel.jsx`, `PhotosPanel.jsx`.

---

## 🔧 Critical technical constraints

- **Web search:** basic `web_search_20250305` (max_uses 4). NOT `web_search_20260209`
  (code-exec dynamic-filtering spirals past Vercel's cap → "Empty model response").
- **Streaming does NOT exempt Vercel `maxDuration`** (60s Hobby / 300s Pro).
- **Modified Next.js** 16.2.7 (Turbopack): read `node_modules/next/dist/docs/` before touching
  Next APIs (`AGENTS.md`).
- **Pure ESM, extensionless imports.** Pure modules importable headless for tests.
- **Model:** Claude Opus 4.8 (`MODEL` in `generate.js`); adaptive thinking; `effort: "medium"`.
- **Proxy blocks** Wikipedia/Wikidata/Guardian/RSS/vercel.app in-sandbox — do not retry/route
  around. Live feeds + entity photos verify only on deployed preview; pure logic unit-tested
  with mocks.
- **Anthropic credit balance empty** → live generation/fact-check can't run in-sandbox until
  topped up.

---

## Gotchas

- **Export draws text to canvas manually** (`export.js`), not via DOM rasterization — any new
  text styling (e.g. R4 outlines) must be added there too (cf. `highlight`'s
  `drawHighlightText`/`wrapRuns`).
- **History resets on `loadDoc`** (generation/blank) — a fresh deck is a fresh undo stack;
  brand carries via `carryBrandKit`, not via undo.
- **`carryBrandKit` carries only deliberate overrides** (fields differing from the previous
  style's defaults) + the logo. `caution` is category-seeded, not carried.
- **Monochrome families** (Enterprise: accent === ink): `applyBrand` remap is ink-first;
  `highlight` uses a knockout marker — both so emphasis stays visible. (R5d Enterprise accent
  tint must respect this.)

---

## Deferred items (from STUDIO_REBUILD.md + prior handover)

- **Feature-layout auto-routing** — generation still emits full-bleed photo backgrounds;
  `feature` is opt-in. Lift: small (a `slidesToDoc` route rule).
- **Caution carry-through-regen** — an *edited* caution is re-seeded, not carried. Lift: small.
- **"Assets" beyond the logo** — no reusable upload shelf/icon set. Lift: medium. (R2 may touch this.)
- **Custom display fonts dropped** (Otilito/Qogee/Foun/Maheni…) → Georgia/Helvetica/Courier stacks.
  Note R1 reintroduces **Courier Prime** specifically for brand wordmarks.
- **Orphaned panel layouts** (`statement`/`centered`/`bottom`) remain manual; no family default.
- **Recent-projects shelf** + **grid snapping** — not built (low priority).
- **Voice/taste pass** — subjective dial-turning against real generated decks (needs credits).

---

## Visual samples (shared in session chat; not committed)

`build.png` (route dropdown + Length) · `optionb.png` (B grounding flow) · `design.png`
(Desk = design matrix) · `content.png` (text = topic × voice × angle × research × length) ·
`beatlook.png` (Editorial beat→Look) · `perdesk.png` (per-desk color A/B → B) ·
`branding.png` (R1 cover wordmarks + Courier Prime) · `borders.png` (R4 borders/outlining +
crash-safety). The textual specs above are sufficient to rebuild these.

---

## ⏭ Immediate next step (new session)

Start **Track A**: present file-level plan + visual samples for **R1 (cover wordmarks +
Courier Prime)**, get sign-off, build, `npm run build` + `npm test`, report. Then R2→R4, then
Track B (R5). **No push until told.**
