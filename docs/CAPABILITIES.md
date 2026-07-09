# loathrdotcom — Capabilities & Feature Catalog

A complete, current-state inventory of **loathrdotcom** (internal build name *LOATHR
Studio*): an AI-assisted Instagram-carousel studio — generate a sourced editorial
deck from a topic or a document, edit it on a full design canvas, brand it (yours or
a client's), collaborate live, and export to PNG / ZIP / Google Drive.

- **Stack:** Next.js 16 (Turbopack), React, pure-ESM. Generation via Claude
  (Opus 4.8) through a server proxy. Optional Firebase cloud (auth, Firestore,
  Storage) — the app runs fully local when cloud is unconfigured.
- **Canvas:** fixed 1080×1350 artboard; a slide = one background + a flat list of
  elements. Three renderers kept in lock-step: **live** (Element.jsx), **thumbnail**
  (StaticSlide.jsx), **PNG export** (export.js).
- **Tests:** 505 unit tests (pure logic). Live/cloud features are deploy-verified.

---

## 1. Who it's for — segments & access tiers

| Segment | How they get in | What they get |
| --- | --- | --- |
| **Local / no-cloud** | App with no Firebase config | Full editor + generation, single-user, nothing gated. |
| **Team member** (loathr.com) | Google sign-in on the allowed domain | Everything: all 3 desks, LOATHR branding, trending/scope, unlimited (admin-set) quota, **Client mode** for agency work. |
| **Guest** (external, approved) | Google sign-in → request access → admin approval | Full tool but a **leaner create screen**, **Editorial desk only**, **self-branding** (their own identity, no LOATHR marks), and a **9 carousels/month** cap. Never sees the word "guest." |
| **Admin** | `role=admin` custom claim (first via bootstrap) | The Admin Console (accounts, requests, audit, usage, all decks). |
| **Share-link recipient** | A link (no account needed) | **View** links: live read-only. **Edit** links: the real editor, saves back to the owner, and **live cursor/op collaboration** via the relay. |

Roles: **viewer / editor / admin** (Firebase custom claims), enforced client-side
(UI) and server-side (every gated route re-checks).

---

## 2. The journey (end to end)

**Create → Generate → Edit → Brand → Collaborate → Export/Share.** Each stage below
lists its capabilities.

---

## 3. Generation — the create screen

Turn a topic *or* an uploaded document into a finished, sourced deck.

### Source
- **Topic** — type it, or pick from the Trending rail / suggestions.
- **Document** — drop or paste a `.txt` / `.md` / `.pdf`; the deck is built from the
  material (no web search — the doc is the source). **Source fidelity** slider (5
  stops: *verbatim ↔ mostly-verbatim ↔ balanced ↔ mostly-reworded ↔ reworded*)
  controls how closely the copy follows the original wording.
- (Guests default to **document-first**; members default to topic.)

### Desk (look + implied voice)
- **Editorial** (Culture) · **Enterprise** (Business) · **News Desk** (News).
  Guests are locked to Editorial (a quiet badge, no picker).
- Editorial palette family: Film & TV, Photography, Sports × Culture, Did You Know?,
  Art & Music, Fashion, Food & Drink, Nightlife, The Tea.

### Voice, tone & structure
- **10 named personas** (+ Auto): Historian, Critic, Insider, Storyteller,
  Researcher, Gossip, Street, Fashion Ed, Commentator, Tech Oracle — each carries a
  *structural exemplar* so decks diverge in **shape**, not just wording.
- **6 tones**: Editorial, Casual, Hype, Dark/Moody, Academic, Playful.
- **Length**: Brief (5) · Standard (8) · Deep (10 slides).

### Scope & discovery (members)
- **Scope row**: sector/beat · region · country (and News-only **urgency**:
  Breaking / Developing / Trending, which pre-sets deck length).
- **Trending rail** — keyless live feeds (Guardian RSS, Wikipedia most-read, GDELT,
  Google News), richness-ranked, region fan-out; tap a card to seed a grounded topic.
- **Topic refiner** — sharper angles, related headlines, and a post-decision
  **virality score**.
- **Quick start** — curated presets (voice·tone·angle·length in one tap) + 8 angle
  seeds.
- **Flag palette** — tint the deck from a country's flag (picked in Scope or detected
  in the topic).

### Generation quality passes
- **Web search grounding** (on by default; "Quick draft" skips it for speed).
- **Polish pass** — a second editor pass tightens spine, arc, and transitions.
- **Coherence check** — flags HOOK / SPINE / ARC / CONNECTIVE / CALLBACK /
  CORRELATION issues with one-tap **rewrite / cut / merge** fixes.
- **Fact-check** — sourced one-tap corrections (Apply / Apply-all-verified).
- **White-label** — strip every LOATHR mark (including the generated "Follow
  @loathr…" sign-off) at generation time.
- A matching **Instagram caption** (hook / body / CTA / hashtags) is produced with
  the deck; regenerate it anytime.

---

## 4. The canvas editor

A full design surface. Every text/shape change stays identical across the live,
thumbnail, and PNG renderers.

### Text
- **Rich-text runs**: bold, italic, underline, strikethrough, per-span color,
  highlight (with editable/removable marker), text outline (stroke + width), per-span
  font size.
- **Fonts by tier** (label / heading / body); a typeable size stepper (6–400);
  align left/center/right; text-case toggle; multi-line.
- **Text shapes** — wrap any text box in one of **15 shape backings** (rectangle,
  rounded, pill, badge, burst, triangle, diamond, hexagon, ribbon, bookmark, callout,
  quote, etc.) with fill, **border width + solid/dashed/dotted** style, and paper /
  knockout variants.
- **Text effects** — drop shadow & glow.
- **✨ Write with AI** — rewrite a selected text box in place (cheap lane, no search).
- **Font-aware resize** — corner handles scale the type, edge handles reflow.

### Images & photos
- **Photos panel** — keyless image search: entity-first **people** search
  (Wikipedia / Wikidata / Commons *depicts*), plus relevance-ranked stock with a
  deeper gallery.
- Set as slide **background** or place as an **element**; **darken overlay**.
- **True crop** (free-form), **fit/fill**, flip H/V, past-edge + scroll-to-zoom.
- **Background remover** — in-browser, no API key.
- Replace / restore original / black-&-white.

### Objects & layout
- Add text, rectangles, lines, shapes, images.
- **Multi-select + marquee**, **group / ungroup**, **align** (left/center/right…),
  group-drag, tethering.
- Grid + snapping; slide **frame** treatments (edge / inset / corners / off).
- **Undo / redo** (coalesced history), copy/paste, duplicate, reorder slides
  (drag the strip), per-slide reset.
- Premium layout templates; a slide-strip with live thumbnails.

---

## 5. Branding

### LOATHR brand system (members)
- Deck **brand**: accent + secondary palette, label/heading/body fonts, wordmark,
  logo, running footer, page numbers, closing lockup, deck frame.
- **Copy design** — paint one page's look onto this page or all pages.
- **Design prompt** — restyle from a short description (AI palette+type) or a preset
  chip (Bold magazine / Minimal / Newspaper / High-contrast).
- Re-theming is deck-wide and undoable; hand-edited off-brand elements are left alone.

### Client mode / self-branding (members via a toggle; guests always on)
The same **client brand** model powers agency work (members flip **Client mode**) and
guest self-branding (built into their create screen):
- **Logo** upload (PNG/SVG) with **placement**: corner (tl/tr/bl/br) × which slides
  (cover / cover+close / every).
- **Brand name** + **@handle**; up to **3 accent colours**; label/heading/body fonts.
- **Footer** placement (none/left/center/right × every/cover+close/cover).
- **Page numbers** on/off + side (left/right).
- **Closeout slide** on/off + custom CTA.
- Applying client mode is fully white-label: it folds the client identity into every
  renderer, stamps the logo, **strips the LOATHR running footer**, and re-themes —
  all reversible.
- **Brand kits** — save a client brand and reuse it on future decks.

---

## 6. Collaboration & sharing

- **Share links** — view (live read-only, follows owner edits in real time) or edit
  (the recipient gets the real editor and saves back through the token; no account
  needed).
- **Live presence** — see other editors' cursors, selections, current slide, and
  name/initials; advisory locks on the element someone's editing.
- **Live edit sync** — changes stream as minimal ops and apply to peers instantly.
- **Jump-to-peer + Follow** + slide-strip peer badges.
- **Anonymous shared-editor live sync** — share-link editors (no account) collaborate
  live too, via a token-authorized relay that shares one room with signed-in members;
  adaptive, visibility-gated polling keeps a solo guest near-silent.

---

## 7. Export & delivery

- **PNG** — one slide or the whole deck (canvas-rendered at full 1080×1350).
- **ZIP** — the full deck as a numbered image set.
- **Google Drive** — render + upload the deck into a named folder (needs the Drive
  API + `drive.file` scope on the deploy).
- **Caption** — copy the generated Instagram caption.

---

## 8. Cloud workspace & dashboard

- **Projects dashboard** — your saved decks (Firestore), thumbnails, open/duplicate.
- **Recently deleted** — a 24-hour soft-delete recycle bin.
- Autosave to your account while editing; image offload to Storage for large decks.

### Admin Console (admins only; every route re-checks server-side)
- **Accounts** — role (viewer/editor/admin), monthly limit, this-month usage,
  Suspend/Reactivate, permanent Remove (type-the-email confirm). Guest rows flagged.
- **Requests** — the access-request queue: approve (adds to allowlist + sets role) or
  deny, with audit history.
- **Audit** — the per-generation log (who · when · topic label · style · slides ·
  model · mode), filter + search. **Metadata + a truncated topic only** — never the
  document text or full prompt.
- **Usage** — per-account generation bars.
- **All decks** — every account's decks; rows open a read-only viewer.

---

## 9. Access gate (external accounts)

- **Domain lock** — sign-in restricted to `loathr.com` by default
  (`ALLOWED_EMAIL_DOMAINS`, `*` disables).
- **Individual allowlist** — approve specific outside addresses on top of the domain
  lock (`ALLOWED_EMAILS`), Gmail dot/plus-canonical so aliases can't dodge it.
- **Request access + approval** — an outside Google account isn't hard-walled; it
  lands on a **request screen**, an admin approves/denies, and approval adds the
  address to a runtime allowlist and sets a role. States: none / pending / approved /
  denied.
- **Member vs guest** = email domain. Guests get the tighter **9/month** cap
  (`GUEST_MONTHLY_LIMIT`); members get the default preset (75); admins unlimited.
- Server-enforced metering (429 at the cap); the client mirror only shows/hides UI.

---

## 10. Architecture (for engineers)

**Pattern: pure logic in tested modules; network/IO in thin, fail-safe adapters.**

- **Generation:** `generate.js` (buildPrompt / runPrompt / generateCarousel /
  Polish), `voices.js`, `coherence.js`, `verify.js` (fact-check), `refine.js`,
  `aitext.js`, `docsource.js`, `captions.js`. Route: `/api/generate` (streamed,
  token-gated + metered), `/api/design`, `/api/refine`, `/api/verify`, `/api/script`.
- **Editor core:** `model.js` (rich-text run model + deck mutations), `store.js`
  (reducer + undo/redo), `templates.js`, `styles.js`, `shapes.js` / `ShapeBacking`,
  `textfx.js`, `richedit.js`, `barlayout.js`, `textfit.js`, `geometry.js`,
  `group.js`, `fonts.js`, `theme.js`. Renderers: `Element.jsx`, `StaticSlide.jsx`,
  `export.js`.
- **Branding:** `clientbrand.js` (client brand + `effectiveBrand`), `ClientBrandForm`
  (shared editor + create-screen form), `design.js`, `brandkits.js`; store
  `setBrandMode` / `setClientBrand` / `stampLogo` / `stampPageNumbers` /
  `rebuildContentFooter`.
- **Trending & images:** `trending.js`, `entity.js`, `imagesearch.js`, `flag.js`;
  routes `/api/trending`, `/api/images`.
- **Cloud & access:** `authority.js` (roles + quota), `authCore.js` (allow-list,
  member check, credentials), `_auth.js` (`verifyRequest` / `verifyIdentity`),
  `sharing.js`, `firebaseClient.js`, `firebaseStore.js`, `cloud.js`, `adminStore.js`
  (Admin SDK). Routes `/api/access/*`, `/api/admin/*`, `/api/shared`.
- **Collaboration:** `presence.js` / `usePresence.js`, `sync.js` / `useSync.js`
  (diffDocs / applyOps), `livesync.js` / `useSharedLive.js` + `/api/shared/live`
  (anon relay).
- **Export:** `export.js`, `zip.js`, `driveExport.js`.

### Firestore collections
`users/{uid}/decks`, `shares/{deckId}` + `sharePulse/{deckId}`, `presence/` +
`edits/` (collab), `accessRequests/` + `config/allowlist` (access gate),
`usage/{uid}/months`, `auditLog/` (audit). Rules + recommended TTLs are in
`docs/CLOUD_SETUP.md`.

---

## 11. Deploy dependencies (owner actions, not code)

The sandbox blocks outbound network, so live features are verified only on deploy:
1. Firebase Admin credentials configured (else admin/gate/relay routes safely no-op).
2. Firestore security rules for every collection above (+ TTLs on `edits` and
   `auditLog`) — see `CLOUD_SETUP.md`.
3. Access-gate env: `ALLOWED_EMAILS`, and `MEMBER_EMAIL_DOMAINS` if the team domain
   differs from `loathr.com`.
4. Drive API enabled + `drive.file` scope consented.
5. `ANTHROPIC_API_KEY` for generation.

---

*For the developer pick-up-cold snapshot (branch, commit history, session workflow
rules), see `docs/HANDOVER.md`. For the original as-built architecture, see
`docs/STUDIO_REBUILD.md`.*
