# Source & Rights Spec — memes, tweets, clips & motion media

The concrete companion to `docs/MOTION_MEME_CONCEPT.md`. It answers one question for
every source the relatable rail could pull from: **can the tool source it
automatically, in what form is it rights-safe, and does that form survive an MP4
export?** It also specifies the **rights gate** and the **"regenerate original for
video"** fallback that makes an automated meme/tweet feature shippable for
commercial/agency use.

> Not legal advice — jurisdictions vary; confirm the whitelist + attestation wording
> with counsel before a commercial launch. This spec is designed to make that a fast,
> bounded conversation. Standing rule (`AGENTS.md`) still applies: a rendered visual
> ships with this spec (`scratchpad/source_rights_mock.html`).

---

## The two principles everything derives from

1. **Two permissions, not one.** Clip-and-rehost needs a **copyright license** to the
   content *and* the right to **fetch it** from where it lives (platform ToS). A
   "Creative Commons" YouTube video passes the first and fails the second. Both must
   be green.
2. **Embed protection dies on flatten.** A live embed (Giphy player, X blockquote) is
   rights-safe *while it stays a web widget*. An MP4 export rasterizes it — the embed
   is gone and you are re-hosting the underlying copyrighted asset again. So safety is
   decided by **output format**, not just source.

Corollary — the shippable move: **discover the trend, then generate an *original* for
video** rather than rehost the specific asset. The tool is a generator; play to that.

---

## Separate the two operations for every source

- **Discovery** — automated search that finds *relevant, viral* candidates
  (topic → relevance gate → virality rank; see `MOTION_MEME_CONCEPT.md` §3 and the
  refiner). This is "sourced by the tool."
- **Delivery** — how the chosen item actually appears to the audience: a **live
  embed**, a **licensed video clip**, or an **originally generated** asset.

A source can be green for discovery and still be red for a given delivery form.

---

## Source matrix

| Source | Discover (auto)? | API / endpoint | Cost | Rights-safe delivery | Survives MP4 export? |
| --- | --- | --- | --- | --- | --- |
| **Your / client uploads** | n/a (user provides) | direct upload | — | owned asset | ✅ |
| **Giphy** | ✅ search | Giphy API (`/v1/gifs/search`) | free key, rate-limited | Giphy **player embed** + attribution | ⚠️ embed-only; content is often movie/TV clips (double copyright) |
| **Tenor** | ✅ search | Tenor API (`/v2/search`) | free key | Tenor **embed** + attribution | ⚠️ same as Giphy |
| **Tweets / X** | ⚠️ render-by-URL free; **search is paid** | oEmbed (`publish.twitter.com/oembed`) to render; X API v2 search to discover | oEmbed free; **X API search paid/gated** | official **X embed** (blockquote + widgets.js) | ❌ live embed can't live in a frame |
| **Reddit / Know Your Meme** | ✅ as a **trend signal** | Reddit API (OAuth), KYM (scrape/none) | Reddit free tier; tightened at scale | — no rehost license on the poster's image | ❌ |
| **Imgflip / meme templates** | ✅ template list | Imgflip API (`/get_memes`, `/caption_image`) | free tier | **generate an original** on a licensed template | ✅ (it's your asset) |
| **Licensed stock video** | ✅ search | Pexels, Pixabay (free); Storyblocks, Envato, Adobe/Getty (paid) | free → subscription | licensed clip, edit permitted | ✅ |
| **Public domain / CC0 / CC BY(-SA)** | ✅ search | Wikimedia Commons, Internet Archive, NASA | free | download + edit (BY → attribute; SA → share-alike) | ✅ |
| **Arbitrary YT / TikTok / IG links** | ❌ (ToS) | — | — | — (creator copyright + anti-download ToS) | ❌ |

Filters that always apply to CC results: **drop CC-NC** (blocks commercial/agency
use) and **CC-ND** (forbids clipping), auto-attribute **CC-BY**, propagate
share-alike on **BY-SA**.

---

## The output-format split (the load-bearing rule)

Route every sourced item by where it will end up:

### Lane 1 — Carousel / web share (stays a live web widget)
Tweets and memes are ✅ here, delivered as **official embeds**, sourced automatically
by the rail. Nothing is rasterized, so embed protection holds.

### Lane 2 — Reel / MP4 (gets flattened)
Only **video-clean** sources may bake in:
- Licensed stock clips (Pexels/Pixabay/paid).
- Public-domain / CC-BY(-SA) clips (with attribution/share-alike).
- Giphy/Tenor **only within their terms** (default: keep them in Lane 1, not baked).
- **Originally generated** meme/tweet-style cards — the regenerate fallback below.
- The user's own uploads.

A found tweet/meme is **never** rasterized into the video. Instead:

### The "regenerate original for video" fallback
1. Rail discovers a hot item (e.g. a viral tweet, a trending meme format).
2. The item becomes a **brief**, not an asset: extract the *format/angle*, not the
   pixels.
3. The tool **composes an on-brand original** — its own caption card, a licensed
   clip, or a template meme — carrying the same cultural beat without the rights
   exposure.

This keeps relevance while staying inside owned/licensed assets, and it leans on the
product's existing strength (generation).

---

## The rights gate (where it sits in the flow)

A **whitelisted source picker, not a "paste any link" box.**

1. **Uploads** → always allowed.
2. **Licensed stock + PD/CC** → allowed; NC/ND filtered, BY auto-attributed.
3. **Giphy / Tenor / tweets** → allowed in **Lane 1 (embed)**; blocked from Lane 2
   bake unless regenerated.
4. **Arbitrary platform link** → gated. Default **refuse to rehost**; optionally route
   through an **ownership-attestation** step ("I own or have licensed this") that
   shifts — not erases — liability, and prefer embed-only where the platform supports
   it.
5. **Music** → separate layer. Safe audio = user VO (the ElevenLabs path), licensed
   production music, or the platform's native music added *after* upload. Never bake
   trending/commercial tracks into the export.

Secondary clearances still apply even on green sources: **model release** (right of
publicity for identifiable people), **trademarks/logos**, **recognizable private
property**. Stock "editorial use only" flags exist for exactly this — surface them.

---

## Cost notes
- Giphy / Tenor / Imgflip / Pexels / Pixabay keys — **free at low volume**.
- **X API search is the one real cost/gating pain** — tweet *rendering* by URL is
  free (oEmbed), tweet *discovery* needs a paid tier. Consider launching tweets as
  **render-a-URL-you-paste** (free, Lane 1) before automated tweet discovery.
- Paid stock (Storyblocks/Envato/Adobe/Getty) — subscription, only if the free tier's
  library is too thin.

---

## Implementation shape (matches the codebase pattern)
- **Adapters, fail-safe** — one thin adapter per source (Giphy/Tenor/Reddit/oEmbed/
  stock), same as the existing trending feeds; any source that errors is skipped, the
  rail never returns empty.
- **Pure logic, tested** — the relevance gate + virality rank + the Lane-1/Lane-2
  router are pure functions (extend `scoreItemTopic`, `viralityScore`); the
  license-filter + rights-gate decisions are pure and unit-tested.
- **A `license`/`lane` field on every sourced item** — carries `{ source, license,
  attribution, lane: "web" | "video", regenerable: bool }` so the editor and the MP4
  compositor can enforce the split at render time, not just in the UI.
