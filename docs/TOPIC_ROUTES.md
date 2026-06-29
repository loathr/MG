# Studio — Template-specific Topic Routes (design spec)

> Status: **approved design.** Mockups signed off in session; this is the build
> contract. Honors the standing rules (show-a-visual done; gate on `npm test` +
> `npm run build`; one-bg-image crash rule untouched — this is content/voice
> only, §12).

## Intent

Fold the old monolith's rich per-segment routing (Sector / Desk / Region /
Urgency / Angle / Emphasis / Mode) back into the rebuild as **optional framing
over the live feed** — *without reviving a single hardcoded preset topic*. The
default one-tap path (pick desk → type topic → generate) is unchanged.

**Reconciliation with "live only":** these routes are **framing**, not canned
topic lists. They cost **$0 credits** and only sharpen the same keyless
Wikipedia/RSS pull — sector/desk *terms* filter the feed; *region* swaps/filters
it; *urgency* sets recency + slide count. The old curated `TOPICS` return only as
filter terms + ghost-text hints, never as inserted slide topics.

## Decisions (locked)

1. **Taxonomy = the monolith's.** `ENTERPRISE_SECTORS` and `NEWSDESK_DESKS`
   (`app/components/segments/*.config.js`) become the canonical per-desk lists.
   Each is re-backed with a Guardian **parent feed + terms** via `trending.js`'s
   existing `filterFeed` mechanism (entries with no dedicated feed — Supply Chain,
   Space, Labor… — ride a parent section filtered by terms). Editorial keeps its
   9 culture beats (already live).
2. **Control = grouped dropdown (mock "B").** Collapses to one line after select;
   opens to themed groups. Label adapts per desk: **Beat** (Editorial) / **Sector**
   (Enterprise) / **Section** (News Desk). `Any` is always first and means the
   prompt is **byte-identical to today**.
3. **One slide-count control, desk-framed.** Editorial shows it as **Length**,
   Enterprise as **Depth**, News folds it into **Urgency** (Breaking → fewer). No
   duplicate slide-count controls.

## Build order

### TIER 1 · the beat dropdown becomes the route  (~free, do first)
The selected beat is **carried through generation instead of dropped** (today
`CreateScreen.pickTrending` keeps only topic+voice). Built in increments:
1. **Generation plumbing** (pure, lowest-risk first): `buildPrompt(topic,
   category, { route })` and `generateCarousel` accept an optional `route`; build
   one **additive "Routing" block**; an empty route → today's exact prompt
   (guarded by a byte-identical test).
2. **Taxonomy** (`trending.js`): extend `BEATS` to the monolith taxonomy; each
   beat gains `group` (dropdown cluster) and `seeds` (old `TOPICS` → ghost hints +
   term anchors). Keep `rss`/`terms`/`filterFeed`/`voice`. Update `trending.test`.
3. **UI** (`CreateScreen.jsx` + `TrendingPanel.jsx`): the grouped dropdown holds
   the `beat` in state and carries it into `onGenerate`; picking a Trending card
   sets the matching beat (carry, don't drop). Live-verify.

### TIER 2 · one secondary route per desk  (revealed after a beat is picked)
- **Enterprise → Depth** = the single slide-count control, framed.
- **News → Region + Urgency.** Region filters pulled items by
  `NEWSDESK_REGIONS.countries` (or a region-scoped feed where one exists);
  Urgency sets recency window + nudges slide count + a "JUST IN" framing hint.
- **Editorial → none** (culture is flat).
- Files: `CreateScreen.jsx` (secondary control, shown only after a beat is
  picked), `trending.js` + `app/api/trending/route.js`, `generate.js`.

### TIER 3 · advanced framing strings  (optional, lowest priority)
- **News:** Angle (neutral/critical/investigative) + Emphasis (facts/context/
  quotes). **Enterprise:** Mode (analysis/news/tips).
- Pure prompt strings ported from `newsdesk.config.js` / `enterprise.config.js`,
  surfaced inside the existing **Voice & tone / Advanced** disclosure.

## Data model

A `route` object threads through generation, every field optional:
`{ beat, region, urgency, angle, emphasis, mode }`. `buildPrompt` builds one
**additive "Routing" block** from whatever is set; an empty route yields today's
exact prompt (guarded by a byte-identical test).

## Out of scope / deferred
- News **breaking** deck-*structure* mode (fast 5–6-slide "JUST IN" spine) is a
  category/voice change, not a route — revisit separately.

## Per-desk summary

| Desk | Primary (Tier 1) | Secondary (Tier 2) | Advanced (Tier 3) |
|---|---|---|---|
| Editorial | Beat · 9 culture beats | — | — |
| Enterprise | Sector · 13 | Depth (5/8/10) | Mode |
| News Desk | Section · 10 desks | Region (7) + Urgency | Angle + Emphasis |
