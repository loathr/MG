# LOATHR Motion + Relatable-Meme Discovery — Concept & Handover

A pick-it-up-cold handover for two proposed extensions to **loathrdotcom** and the
question of whether they merge. Part 1 inventories **every tool the product has
today** (so a new session knows the real surface). Part 2 is the **motion / video**
concept. Part 3 is the **relatable-meme / viral discovery** concept. Part 4 is the
**merge**. Part 5 is **cost** — build (engineering) and run (per-reel opex),
individually and merged.

> Written 2026-07-09. Grounded in the actual code (`app/`, `Network/`, `signatures/`),
> not just `docs/CAPABILITIES.md`. Standing rule from `AGENTS.md` still applies:
> **show a visual and get sign-off before writing app code.** This file is a concept
> doc, not an implementation — nothing here is built yet.

---

## The one-paragraph headline

The product is a **static Instagram-carousel studio** — but the codebase already
contains the *first half* of a video product and nobody has wired the second half.
`/api/script` turns a finished carousel into a **character-voiced video script**
(cold-open → beats-with-animation-cues → sign-off), backed by a five-character
"network" with full voice bibles and referenced ElevenLabs voice specs + animation
briefs. What's missing is only the **render layer** (audio + motion + overlays → MP4)
and the **ingest layer** (upload / link / stock video). That means "video-forward
generation" is not greenfield — it's **finishing a spine that's ~40% scaffolded**.
The meme/viral idea is a small extension of the existing **trending rail**. And the
two ideas are two halves of one loop, so they should be built as one product.

---

# Part 1 — Everything the tool can do TODAY (the handover inventory)

Grouped by subsystem. Every item below is real code in this repo.

### 1.1 Generation (topic/doc → sourced deck)
- **`/api/generate`** — the model proxy. Opus (`claude-opus-4-8`), adaptive
  thinking, `output_config.effort` medium default, **streamed**. Web-search
  grounding (`web_search_20250305`, max_uses 4). **Token-gated + usage-metered**
  (429 at quota) when cloud is configured.
- **`generate.js`** — `buildPrompt` / `runPrompt` / `generateCarousel`, plus the
  **Polish** pass (`buildRevisePrompt` / `reviseDeck`, run when `o.polish`).
- **`voices.js`** — 10 named personas (+Auto), each carrying a *structural exemplar*
  so decks diverge in shape, not just tone. 6 tones. Length Brief/Standard/Deep.
- **`coherence.js`** — the **Coherence check** (HOOK / SPINE / ARC / CONNECTIVE /
  CALLBACK / CORRELATION) with one-tap `rewrite | cut | merge` fixes.
- **`verify.js`** — **fact-check** with sourced one-tap corrections.
- **`aitext.js`** — inline **✨ Write with AI** on a selected text box (cheap lane).
- **`docsource.js`** — doc→deck sourcing with a 5-stop **source-fidelity** slider.
- **`captions.js`** — a matching Instagram caption (hook / body / cta / hashtags),
  with a no-model `fallbackCaption` safety net.
- **`presets.js` / `categories.js`** — quick-start presets, angle seeds, taxonomy.

### 1.2 The script/character pipeline (the video foothold — already built)
- **`/api/script`** — converts a carousel into a **video script**:
  `{ cold_open, beats[]{ text, animation_note }, sign_off }`. Forced tool-call,
  server-side rotation of opens/closes, retry/backoff, `maxDuration = 300`.
- **`app/lib/scriptSchema.js`** — `SCRIPT_TOOL` schema, `CHARACTER_FOR_CATEGORY`,
  `MODE_MAPPING` (deep_dive / hot_take / timeline), `extractCarouselPayload`.
- **`Network/`** — five **character bibles** (Loathr Bot, Miss Water, Mr. Coffee,
  Ash, Snow), each a drop-in `system` prompt. `00_README.md` documents that
  **voice specs (ElevenLabs voice IDs, prosody), animation design briefs, and
  script templates** are intended siblings.
- **`signatures/`** — per-character `*_opens.json` / `*_closes.json` rotation
  libraries with weights.
- **What's missing to make it *video*:** TTS render, character/motion visuals, and a
  compositor. The words + timing + voice identity already exist.

### 1.3 The canvas editor (three-renderer invariant)
`Element.jsx` (live) · `StaticSlide.jsx` (thumbnail) · `export.js` (PNG) must agree.
- **`model.js`** — rich-text run model + deck mutations (`styledRuns`, run styles,
  highlight lifecycle, fact-check + coherence apply).
- **`store.js`** — reducer store with coalesced **undo/redo**.
- **Rich text** — bold/italic/underline/strike, per-span color, highlight, outline,
  per-span size; fonts by tier; a typeable size stepper (6–400); align; text-case.
- **Text shapes** — 15 shape backings (`shapes.js` / `ShapeBacking.jsx`), border
  width + solid/dashed/dotted, paper/knockout. **Text effects** — shadow + glow
  (`textfx.js`).
- **Images** — `PhotosPanel.jsx` keyless search (entity-first people via
  Wikipedia/Wikidata/Commons *depicts* in `entity.js`; relevance-ranked stock in
  `imagesearch.js`); background or element; darken overlay; **true crop**, fit/fill,
  flip, past-edge zoom; **in-browser background removal** (`bgRemove.js`).
- **Objects/layout** — multi-select + marquee, group/ungroup (`group.js`), align,
  grid+snap, frame treatments, premium templates (`templates.js`), slide strip.

### 1.4 Branding
- **LOATHR brand system** — accent/secondary palette, tiered fonts, wordmark, logo,
  footer, page numbers, closing lockup, frame. **Copy design** (`design.js`),
  **Design prompt** (preset + AI restyle via `/api/design`).
- **Client mode / self-branding** (`clientbrand.js`, `ClientBrandForm.jsx`) — full
  white-label: logo upload + placement, brand name + @handle, up to 3 accents,
  tiered fonts, footer, page numbers, closeout CTA. Strips LOATHR marks. **Brand
  kits** save/reuse (`brandkits.js`).

### 1.5 Discovery (keyless, live-only)
- **`trending.js`** — `mergeSources` / `rankItems` (richness-first) / `rotateWindow`,
  region fan-out. Feeds: **Guardian RSS, Wikipedia most-read, GDELT, Google News**.
  Route `/api/trending`.
- **`entity.js` / `imagesearch.js`** — the relevance-ranking machinery that a meme
  rail would reuse.
- **`refine.js`** — topic refiner (angles, related headlines, virality score).
- **`flag.js`** — flag-derived deck palette.

### 1.6 Collaboration, cloud & export
- **Collab** — presence/cursors (`presence.js`), op-based live sync
  (`sync.js` diffDocs/applyOps), advisory locks, jump-to-peer + Follow, and an
  **anonymous shared-editor relay** (`livesync.js`, `/api/shared/live`).
- **Cloud** — Firebase auth (`firebaseClient.js`), Firestore decks
  (`firebaseStore.js`), roles/quota (`authority.js`), access gate + request/approve
  (`authCore.js`, `/api/access/*`), share links (`sharing.js`), Admin Console
  (`AdminConsole.jsx`, `/api/admin/*`) with accounts / requests / audit / usage /
  all-decks.
- **Export** — PNG (single/deck), **ZIP** (`zip.js`), **Google Drive**
  (`driveExport.js`).

### 1.7 The reuse map (why the extensions are cheap)
| Existing asset | Reused by Motion (Part 2) | Reused by Memes (Part 3) |
| --- | --- | --- |
| Generation spine + **`/api/script`** | ✅ the narration/beats | — |
| Character bibles + voice specs | ✅ voiceover identity | — |
| `clientbrand.js` (white-label) | ✅ brand overlay on video | ✅ brand on meme-derived scene |
| `captions.js` | ✅ burned-in captions + post caption | ✅ caption for the clip |
| Trending rail + relevance ranking | — | ✅ **this is the whole engine** |
| Export orchestration (PNG/ZIP/Drive) | ✅ add MP4 target | ✅ shared |
| Cloud / share / collab / admin | ✅ unchanged | ✅ unchanged |
| Scene/deck model (`model.js`) | ⚠️ **extend** slide→scene, add time axis | ✅ shared |

---

# Part 2 — Motion / video-forward generation ("LOATHR Motion")

Same core idea as the carousel — *topic or document in, finished branded thing out* —
but the output is a **9:16 reel**, not a static deck. **It does not have to work the
same way as the carousel**; the create screen and editor can diverge.

There are **two source pathways** with very different cost/rights profiles. Keep them
separate in the product and in the roadmap.

### 2.1 Pathway A1 — Generative motion (owned assets, low risk, already scaffolded)
Topic/doc → **script** (exists) → **voiceover** (ElevenLabs, specced) → **motion
scenes** (animated character *or* animated motion-graphic cards) + **captions** +
**branding** → **MP4**. Nothing is scraped; every asset is generated or owned. This
is the safe, on-brand path and it sits directly on top of `/api/script`.

### 2.2 Pathway A2 — Clip-based motion ("reels clipping")
User **uploads a video** or **pastes a link** (YouTube / TikTok / IG / X) → tool
ingests → **auto-picks the best clip** (hook-moment detection) → the rest of the
overlay pipeline (thumbnail, captions, brand, hook, CTA, closeout) → **MP4 reel**.
This is the "clipping for social media reels" flow. **Higher rights risk** (someone
else's footage) — ship it only with licensed sources + a rights gate (see Part 5).

### 2.3 Features (your list + the natural additions)
- **Auto thumbnail/cover frame** — score frames (faces, sharpness, motion, brightness,
  text-free area, rule-of-thirds) → pick the best → overlay the hook title on it.
- **Hook title** — AI-generated opening card/overlay (0–2s). Reuses generation.
- **Captions** — transcribe (Whisper / Deepgram) → **word-by-word animated burned-in
  captions** (the single biggest retention lever on reels). Also feeds the post
  caption, which already exists.
- **Branding** — the *entire* `clientbrand.js` model overlaid on video: logo stamp,
  accent colors, tiered fonts, footer — white-label reversible, same as decks.
- **CTA + close-out scene** — end-card lockup (follow/subscribe), reuses the closeout
  model.
- **Auto-reframe** — 16:9 → 9:16 with subject tracking (reuses the crop concept +
  subject detection).
- **Voiceover** (A1) — ElevenLabs per-character voice; the bibles already pick the
  voice identity.
- **Nice-to-haves** — silence/filler trim, beat-sync cuts to a music bed, B-roll
  suggestions from the relatable rail (that's the merge), multi-clip stitching.

### 2.4 The genuinely new engineering (the honest gap)
1. **A video compositor — the "4th renderer."** Overlays + audio + scenes → MP4.
   Three ways to build it: (a) **self-host ffmpeg** on a worker (cheap opex, more
   build); (b) **browser render** via WebCodecs/canvas (no server compute, fiddly,
   device-bound); (c) **managed API** (Shotstack / Creatomate / Mux) — fastest to
   build, highest opex. Recommendation: start managed, move hot paths to self-hosted
   ffmpeg once volume justifies it.
2. **Ingest / clip** — upload handling + link extraction + transcode (A2 only).
3. **Transcription** — an STT service (or self-host Whisper).
4. **Frame analysis** — thumbnail pick, reframe, hook detection.
5. **Async job model** — video render is slow; the request/response API pattern
   breaks. Needs a **job queue + workers** (note `/api/script` already flags the
   Vercel 300s ceiling — video will blow past it and needs Cloud Run / a container).
6. **Heavy storage + egress** — video is MB–GB vs a deck's KB. Storage lifecycle/TTL
   and CDN egress become a real line item.

---

# Part 3 — Relatable-meme / viral discovery

Extend the **trending rail** into a **culture/meme rail**. The engine is *already the
shape you need*: `trending.js` merges keyless sources and `rankItems` ranks them;
`imagesearch.js` already does relevance scoring against a query.

### 3.1 Sources (keyless-first, same fail-safe adapter pattern)
- **Giphy + Tenor** — gifs and meme clips (licensed for embed; free API).
- **Reddit** — `r/memes`, `r/dankmemes`, and topic-matched subreddits.
- **Know Your Meme**, **X/Twitter trends**, **TikTok trending sounds/hashtags**,
  **YouTube trending** — richer but heavier on keys/ToS; add behind adapters.

### 3.2 The actual idea: "**strictly relatable**" = trending ∩ relevant
The differentiator is *not* "show trending memes." It's **rank global virality by
semantic relevance to the current deck/reel topic**, reusing the existing
relevance-ranking (`scoreStockMatch`, richness-first `rankItems`). Topic = "remote
work" → surfaces remote-work memes, not random trending noise. That gate is the whole
product.

### 3.3 Outputs
- **Seed** — tap a meme/clip/tweet to start a grounded deck or reel from it.
- **Drop-in** — place a relatable meme/gif/tweet into a scene as a beat.
- **Tweets** — render a viral tweet as a branded card/scene element (embed or
  screenshot-to-card).

### 3.4 Rights note
Giphy/Tenor are built for embed and are safe. Reddit/X content and re-hosting other
people's clips are **not** automatically safe — use official embeds where possible and
gate re-export. (Same rights theme as A2.)

---

# Part 4 — Can both ideas merge? Yes — they're one loop.

**The unifying abstraction: a "slide" becomes a "scene"; a "deck" becomes a
"timeline."**
- A **static carousel** = a timeline whose scenes are all static (today, unchanged).
- A **reel** = a timeline where scenes can be motion: a video clip, a gif, an animated
  character beat, or an animated text card.
- **Same editor, same brand system, same generation spine, same discovery rail, same
  export orchestration** — you add a **time axis** and a **compositor**, and nothing
  else has to fork.

### The merged flow
> **Topic / doc →** generate the spine (script exists) **→** the discovery rail
> surfaces **strictly-relatable trending motion** (memes / gifs / clips / tweets)
> **→** drop them in *or* auto-clip the best moment **→** auto-caption + brand + hook
> + CTA + close-out **→** export as a **branded reel** (and/or a carousel, from the
> same source).

### Why merged beats two bolt-ons
Discovery (Part 3) is the **source picker** for motion's clip pathway (A2); motion
(Part 2) is the **output format** for discovery. They are two halves of the same loop.
Build the **scene/timeline model + the compositor once**, and each concept becomes a
mode of one product instead of a separate feature. ~60–70% of the merged build is
shared infrastructure that already exists.

---

# Part 5 — Cost

Two kinds: **build cost** (one-time engineering) and **run cost** (per-reel opex).
Bands are deliberately rough — they're for prioritization, not a quote.

### 5.1 Build cost (engineering effort)
| Scope | New engineering | Reuses | Rough effort |
| --- | --- | --- | --- |
| **B — Meme/viral rail** | source adapters, relevance gate, UI rail | trending + relevance + editor | **~2–4 eng-weeks** |
| **A1 — Generative motion** | TTS wiring, motion/character render, compositor, MP4 export, job queue | `/api/script`, bibles, brand, captions, export | **~6–10 eng-weeks** |
| **A2 — Clip/link motion** | ingest/link extract, transcribe, reframe, thumbnail, compositor, rights gate | overlay + brand + captions + export | **+3–5 eng-weeks on top of A1** |
| **A (A1+A2)** | all of the above | — | **~9–14 eng-weeks** |
| **Merged (A + B)** | scene/timeline model built **once**, shared compositor | everything above | **~12–16 eng-weeks** |

**The point of the merge:** A-then-B (or B-then-A) summed is ~11–18 weeks of parallel
bolt-ons; **merged is ~12–16 weeks for a coherent product**, because the clip pathway
*needs* the discovery rail and both share the timeline + compositor. You pay for the
shared spine once.

### 5.2 Run cost (per 30–60s reel — the number that's new)
A carousel today costs a few cents (LLM + KB-sized images). A reel is different because
video is MB–GB and rendering is compute-heavy.

| Cost driver | Self-hosted (ffmpeg worker) | Managed (Shotstack/Creatomate/Mux) |
| --- | --- | --- |
| LLM (script/hook/caption) | ~$0.02–0.10 | ~$0.02–0.10 |
| Voiceover (ElevenLabs, ~150 words) | ~$0.03–0.10 (or free tier) | same |
| Transcription (clip path, per min) | ~compute-only (Whisper) | ~$0.005–0.02 (Deepgram/AssemblyAI) |
| Encode / composite | a few ¢ CPU | **~$0.10–0.50+/min rendered** |
| Storage + egress | the recurring tail — needs TTL/lifecycle | same |
| Stock/gif | free tiers → paid at scale | same |
| **All-in per reel (rough)** | **~$0.10–0.40** | **~$0.30–1.00+** |

Stock/gif APIs are free at low volume (Giphy/Tenor/Pexels) and become a subscription
at scale.

### 5.3 The non-dollar costs (flag these honestly)
- **Rights / legal — the #1 risk.** Generative motion (A1) and licensed discovery
  (Giphy/Tenor/Pexels/own assets) are safe. **Scraping YouTube/TikTok/IG and
  re-exporting** (A2 with arbitrary links) and **re-hosting memes/tweets** are not.
  This shapes the roadmap: ship the owned-asset paths first.
- **Infra shift** — from request/response to an **async job queue + workers**; new
  operational surface (retries, progress, failure states).
- **Serverless ceiling** — `/api/script` already needs Vercel Pro for 300s; video
  render exceeds it → a real worker (Cloud Run / containers) is required.

### 5.4 Recommended sequencing
1. **Phase 1 — B (relatable discovery rail).** Cheapest, lowest-risk, and it improves
   the *carousel* product immediately (relatable memes/gifs as deck elements). Proves
   the relevance gate.
2. **Phase 2 — A1 (generative motion) on the existing script spine.** TTS + a
   managed-render compositor for captions/brand/motion cards. Owned assets only. This
   is "finish the video product that's already 40% scaffolded."
3. **Phase 3 — A2 (clip/link path)** with **licensed sources + a rights gate** only.
4. Build the **scene/timeline + compositor once** in Phase 2 so B's discovery feeds
   A's clips — that's where the two ideas become one product.

---

## Open questions for the owner (need a call before any code)
1. **Which output first** — reel-from-topic (A1, safe) or clip-from-link (A2, rights
   risk)?
2. **Character animation vs motion-graphics** for A1 — a rendered animated character
   (expensive, on-brand, matches the bibles) or animated typographic cards (cheap,
   fast)?
3. **Render build** — managed API (fast, higher opex) or self-hosted ffmpeg (slower to
   build, cheap opex)?
4. **Rights posture** — licensed-only (Giphy/Tenor/Pexels/own) or allow arbitrary
   link-clipping (needs legal review)?
5. **Voice** — commit to ElevenLabs (the specs assume it) or a cheaper/free TTS?

*Once these are answered, the next step under the standing rule is a rendered visual of
the chosen create-screen + reel-editor before any code.*
