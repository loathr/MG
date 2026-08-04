# Loathr — Session Handover

A pick-it-up-cold snapshot of the **`loathr/mg`** repo. It is now **two apps in
one Next.js 16 project**, sharing a build, a deploy, and the standing rules below:

1. **The Loathr marketing site** (route group `app/(marketing)`) — the agency
   site (Home, Our Work + project detail pages, What We Do, Insights, Contact,
   Newsletter, a virtual Gallery), content-managed by **Sanity** with an embedded
   Studio at `/cms` and live visual editing. Degrades to hardcoded copy when
   Sanity is unconfigured. See `docs/SANITY_SETUP.md`.
2. **LOATHR Studio** (`app/studio`, `/studio`) — the Instagram-carousel maker: a
   generation pipeline, a full canvas editor, keyless trending + image search, and
   a Firebase cloud workspace. `docs/STUDIO_REBUILD.md` is its deeper as-built
   reference; the Studio sections below are the *current* working state on top.

Read this end-to-end before touching code.

- **Dev branch:** `claude/handover-docs-review-h9qhlp`
- **Promotion:** every shipped change is promoted to production `main` with
  `git push origin claude/handover-docs-review-h9qhlp:main` (there is **no PR** in
  this flow — main is updated directly after the gate passes). If the branch has
  fallen behind `main` (it is fully merged each session), restart it first:
  `git fetch origin main && git checkout -B claude/handover-docs-review-h9qhlp origin/main`.
- **HEAD at this writing:** `e4f8e9d` · **Tests:** 569 passing · **Build:** clean
  (Next 16 / Turbopack).

> **Branch note:** the task harness may name a *different* dev branch. Ignore it —
> all work lives on `claude/handover-docs-review-h9qhlp` and is mirrored to `main`.

---

## ⚠️ Standing workflow rules (carry into EVERY future handover)

1. **Show a visual before implementing.** Every build/feature change → render a
   mockup / diagram / rendered screen and get sign-off *before* writing code
   (this is also in `AGENTS.md`, and it OVERRIDES default behaviour). Pure
   bug-fixes / backend / logic with no visual surface are exempt — just say so.
   The house pattern: write a `.cjs` that emits an HTML mock into the session
   scratchpad → `SendUserFile` it (`display:"render"`) → get sign-off → build.
2. **Gate every change:** `npm test` **and** `npm run build` must both pass
   before you commit. One coherent logical change per commit.
3. **No raw model id in committed artifacts.** The configured model id
   (`claude-opus-4-8`) must never appear in commit messages, PR/commit text, code
   comments, or anything pushed to the repo. Chat replies only.
4. **Commit signing + footer.** Commits are SSH-signed. Every commit message ends
   with:
   ```
   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01Cqsoj6QNUx4DHPUzMT7YnP
   ```
   Local `%G?` shows `N` (no `allowedSignersFile` configured in the sandbox) —
   verify signing by checking the raw `gpgsig` header
   (`git cat-file -p HEAD | grep gpgsig`), not `%G?`.
5. **The crash guardrail (FLAT-LAYERS §3):** the historical crash was *stacked
   raster background images* — one bg image + one scrim, never more. Solid colour
   and vector chrome (borders/outlines/strokes/text) are free; never reintroduce
   stacked background images.
6. **GitHub scope** is `loathr/mg` only. Do not create a PR unless explicitly
   asked.

---

## ▶️ PROMPT FOR THE NEW SESSION (start here)

> You are continuing the **`loathr/mg`** project on branch
> `claude/handover-docs-review-h9qhlp`, promoting each shipped change to `main`.
> Read this handover first. The repo holds two apps: the **Loathr marketing site**
> (`app/(marketing)`, Sanity-backed, Studio at `/cms`) and the **LOATHR Studio**
> carousel maker (`/studio`) described next.
>
> The Studio is a mature Next.js 16 carousel maker: a generation pipeline (Opus 4.8
> via `/api/generate`), a full canvas editor (top contextual Toolbar, rich-text
> runs, text shapes, free-form crop, background remover), keyless trending +
> entity image search, and a multi-account **cloud workspace** (Firebase auth
> restricted to `@loathr.com`, Firestore decks, roles/quota, share links, Drive
> export, an admin console with account lifecycle + a read-only deck viewer).
>
> **The sandbox blocks all outbound network except the Anthropic API proxy.** So
> every *live* feature — Firebase auth/Firestore, Google OAuth/Drive, Wikimedia
> and stock image feeds, trending news feeds — returns `000`/`403` here and is
> **deploy-verified only**. Build them structurally-complete + tested, and record
> what the user must confirm on their deploy. Real generation also needs Anthropic
> credit that may be absent in-sandbox.
>
> Honor the standing rules above (show-visual FIRST; gate; signed commits with the
> footer; no model id in artifacts; one-bg-image crash rule).

---

## 🗺 Where the project is NOW (architecture map)

**Pattern throughout: pure logic in tested modules, network/IO in thin adapters.**
Decisions live in unit-tested pure functions; routes and Firebase/Wikimedia
adapters just wire them to IO and fail *open/safe*. The same fail-open discipline
governs the marketing site: **every Sanity read has a hardcoded fallback**, so an
unconfigured or erroring CMS renders the built-in copy instead of blanking.

### Marketing site (`app/(marketing)`) + Sanity CMS
The agency site, a Next 16 route group. Same fail-open rule as the Studio: no
Sanity project → hardcoded copy, and `/cms` shows a "not configured" notice.
- **Routes:** `page.tsx` (Home) · `work` + `work/[slug]` (Our Work grid + editorial
  project detail pages, SSG via `generateStaticParams`) · `what-we-do` · `insights`
  (wired to the `post` schema) · `contact` (+ `ContactForm.jsx`) · `newsletter` ·
  `gallery` (a preview "virtual gallery"). `site/SiteChrome.jsx` is the shared
  nav/footer; `layout.tsx` reads the footer from `siteSettings` and mounts
  `VisualEditing` only in draft mode.
- **Sanity read path (`sanity/lib/`):** `env.ts` gates everything on
  `isSanityConfigured` (a `NEXT_PUBLIC_SANITY_PROJECT_ID`). `client.ts` is the
  server read client — `perspective: "published"` so Studio drafts never leak
  live; an optional server-only `SANITY_API_READ_TOKEN` lets it read authenticated
  (never `NEXT_PUBLIC_`). `fetch.ts` exposes **`sanityFetch(query, fallback,
  params)`** — the one helper every page uses: returns `fallback` when
  unconfigured, on error, **or on empty result**; in Presentation/draft mode it
  swaps to a token'd `drafts`-perspective client with **stega** enabled.
- **Stega guardrail:** stega encodes invisible source-map chars into DISPLAY TEXT
  only. The `fetch.ts` filter excludes `category`, `slug`, and any `*url`/`http…`
  value — encoding those would break filter-button matching and media URLs (fixed
  in `8dbb6cf`; do not reintroduce).
- **Embedded Studio + schema (`sanity/`):** `sanity.config.ts` mounts the Studio at
  **`/cms`** (`app/cms/[[...tool]]`). Schema (`schemaTypes/`): `siteSettings`
  (singleton), `project`, `post`, and per-page singletons under `pages/`
  (`aboutPage`, `whatWeDoPage`, `workPage`, `insightsPage`, `contactPage`,
  `newsletterPage`) — **all page copy is now editable**, each with a hardcoded
  fallback. `structure.ts` shapes the desk.
- **Seeding (`sanity/seed/`, Node scripts, need a write token):** `seed-projects.mjs`
  (R2 media manifest → `project` docs, idempotent, `--dry`/`--html`/`--replace`),
  `seed-pages.mjs` (page singletons from current copy), `seed-posters.mjs`,
  `seed-videos.mjs`, and `diagnose.mjs` (read-path check). See `sanity/seed/README.md`
  and `docs/SANITY_SETUP.md`.
- **Video:** a transcode → Cloudflare **R2** pipeline (Colab) feeds project covers /
  gallery media as R2 CDN URLs rather than uploaded Sanity assets (`2c1ae94`).

---

*The remaining sections describe **LOATHR Studio** (`app/studio`, `/studio`).*

### Generation
- `app/api/generate/route.js` — the model proxy. Opus 4.8 (`claude-opus-4-8`),
  adaptive thinking, `output_config.effort` medium default, streamed. Web search
  uses the **basic** `web_search_20250305` (max_uses 4), NOT the code-exec variant.
  Token-gated + usage-metered (429 on quota) when cloud is configured.
- `app/studio/generate.js` — orchestrates a generation: `buildPrompt`, the shared
  `runPrompt` helper, `voiceShape` wiring, `buildRevisePrompt`/`reviseDeck` (the
  **Polish** pass), and `generateCarousel` (`o.polish` runs the revise pass).
- `app/studio/voices.js` — 10 personas, each with a structural `shape` exemplar
  (few-shot deck-shape divergence, not just tone words).
- `app/studio/coherence.js` — the **Coherence check**: `buildCoherencePrompt`
  (HOOK / SPINE / ARC / CONNECTIVE / CALLBACK / CORRELATION), `parseCoherence`
  (issues carry a `fix` = `{action: rewrite|cut|merge, into, heading, body}`),
  `checkCoherence` (no web search, effort high). `KINDS` includes `hook` (it
  critiques the cover header too).
- `app/studio/aitext.js` — inline **✨ Write** on a selected text box
  (`buildWritePrompt`/`cleanWritten`), cheap lane, no web search.
- `app/studio/presets.js`, `categories.js`, `captions.js`, `docsource.js` —
  quick-start presets/angles, taxonomy, caption gen, and doc→deck sourcing.

### Editor (the three-renderer invariant)
**Element.jsx (live CSS) · StaticSlide.jsx (thumbnail) · export.js (canvas PNG)
must agree** for any text/shape change, via `styledRuns`.
- `app/studio/model.js` — the rich-text run model + deck mutations:
  `styledRuns`/`runSegments`, `applyRunStyle`/`clearRunStyle`/`remapRuns`,
  `isUniformText`; highlight lifecycle (`bakeHighlight`/`bakeDocHighlights`/
  `clearHighlightRuns`); fact-check (`correctionSite`/`applyCorrectionToDoc`);
  coherence apply (`applyRewriteToDoc`/`applyCoherenceFix` with a
  `MIN_COHERENCE_SLIDES=3` floor / `coherenceFixApplicable`).
  `RUN_STYLE_KEYS = [color, bold, italic, strike, underline, strikeColor, bg,
  stroke, strokeWidth, size]`; `resolveStyle` maps run `size`→`fontSize`,
  `bold`→`fontWeight`.
- `store.js` — React reducer store with undo/redo (the `MUTATES` map marks
  undoable actions); `styleText`, `patchEl`, `setSlide`, `loadDoc`, etc.
- `Toolbar.jsx` — the top contextual toolbar. The font-size **Stepper** is a
  typeable numeric input (clamps 6–400, Enter/blur commit, Esc revert, arrows
  nudge). Highlight set/clear goes through `clearHighlightRuns` (clears bg+color
  so removed highlights re-integrate).
- `richedit.js` (`selectionOffsets`), `shapes.js` (text-shape variants +
  `shapePaint`), `barlayout.js`, `textfit.js`, `geometry.js`, `fonts.js`,
  `styles.js`, `templates.js`, `theme.js` (the `UI` palette).
- Media: `imageFile.js`, `bgRemove.js`, `export.js`, `zip.js`, `driveExport.js`.

### Trending + image search (keyless, all deploy-only for live data)
- `app/studio/trending.js` — `mergeSources` (with `preserveOrder`), `rankItems`
  (richness-first, NOT thumbnail-first), `rotateWindow`, region fan-out. Feeds:
  Guardian RSS, Wikipedia most-read, GDELT, Google News RSS.
- `app/studio/entity.js` — entity-first **people** search: Wikipedia REST +
  Wikidata (P18 image, P373 Commons category, **P180 depicts**) + Commons
  category members / CirrusSearch. `entityCandidate` is case-insensitive;
  `wikidataClaimsUrl` fetches ALL claims (the old `property=P18|P373` pipe was
  invalid and returned nothing — do not reintroduce it).
- `app/studio/imagesearch.js` — `rankStock`/`scoreStockMatch`/`interleave`
  (relevance-ranked deeper stock, 2-page depth, media-list gallery).
- `app/api/trending`, `app/api/images` — the adapters.

### Cloud workspace (all deploy-only; pure cores are tested)
- `app/studio/authority.js` — roles (viewer/editor/admin), quota math
  (`quotaCheck`, `usagePeriodKey`, `effectiveMonthlyLimit`, `DEFAULT_MONTHLY_LIMIT`
  = 75, admins unlimited), `normalizeRole`.
- `app/studio/authCore.js` — `allowedEmailDomains(env)` (default `loathr.com`;
  `*` = no restriction) + `emailAllowed`; `adminCredentials`; `isBootstrapAdmin`.
- `app/studio/sharing.js` — share-link access decisions (`linkAccess`,
  `resolveShared`, `shareIndex`, `sharePulse`, `shareUrl`).
- `app/studio/firebaseClient.js` — guarded client SDK: `signInWithGoogle`
  (checks domain, signs out + throws if not allowed), `onAuthChange`,
  `getIdToken`, `getUserRole`, `bootstrapAdmin`, `getDriveAccessToken`
  (`drive.file` scope). No-op when unconfigured.
- `app/studio/firebaseStore.js` — Firestore adapter: `saveDeck`, `loadDeck`,
  `listDecks`, image→Storage offload (`uploadDeckImages`, Cloud 11c), real-time
  `watchSharePulse`.
- `app/studio/cloud.js` — `projectRecord`/`docFromRecord` (the stored deck shape
  is `{ id, name, slideCount, createdAt, updatedAt, doc }` — **no separate saved
  prompt field**), image-data collection helpers.
- `app/api/adminStore.js` (Admin SDK, lazy, no-op when unconfigured) —
  `meterGenerate`, `readShared`, `readAnyDeck` (**new**, admin deck viewer),
  `listAccounts` (now surfaces `disabled`), `listAllDecks`, `setUserLimit`,
  `setUserDisabled` (**new**), `deleteAccount` (**new**), `setUserRole`.
- `app/api/_auth.js` — `verifyRequest` (rejects non-allowed email domain →
  `{ok:false, gated:true, forbidden:true}`), `unauthorized`, `forbidden`.
- `app/studio/AdminConsole.jsx` — Accounts (role + limit + **Suspend/Reactivate/
  Remove**), Usage, and **All decks** (rows open the read-only viewer). Mounted
  only for admins; every `/api/admin/*` route re-checks admin server-side.
- API routes: `/api/admin/{accounts,role,limit,bootstrap,account,deck}`,
  `/api/shared`, `/api/generate`, `/api/verify`, `/api/script`.

### Studio.jsx (the shell)
Routes screens (create / projects / editor / admin), owns `sharedView` (share
link) and `adminView` (admin opened a deck read-only) state, the autosave effect
(gated on `screen === "editor"` so viewers never write back), Coherence/fact-check
panels, Drive toast, and the `SharedViewer` (reused for both share links and the
admin deck viewer via `onBack`/`admin` props).

---

## 🧾 What happened (recent sessions → work → commits)

Grouped by cluster. All gated (`npm test` + `npm run build`), signed, and promoted
to `main`. The Studio product name shown to users is **loathrdotcom**. The most
recent arc (marketing site + Sanity) is first; the Studio log follows.

### Latest arc — the marketing site + Sanity CMS (and Studio hardening)

The big pivot since the previous snapshot (`b7aca2c`): a full agency site was built
alongside the Studio, and Studio crash/collab bugs were fixed. HEAD is now `e4f8e9d`.

- **Marketing site, Phase 1** — routing, Home, shared chrome (`3799eab`); "Get
  Started" nav accent (`97b08f2`); real Spotify playlist pill (`ddb4bb6`).
- **Sanity CMS** — schema + embedded Studio at `/cms`, Home copy wired (`d6b9fbe`);
  Our Work → `project` schema (`96a3682`), Home "Selected work" → `featured`
  (`942c8ed`); setup guide (`edb8410`); R2 → Sanity seeding prep + Photography
  category (`67b3b2a`); merged (`9c6fb29`). Read-token support + seed diagnostics
  (`ab5dfeb`, `52af2ef`, `5e8d35d`, `72b9992`).
- **Everything editable (fallback-guarded):** Insights → `post` (`3fea3e1`); About +
  What We Do (`0550f56`); Contact + Newsletter (`27a0002`); Home/Work/Insights heroes
  + footer (`cb16be7`) — all pages now CMS-editable; page-content seed (`3176137`).
- **Live visual editing** — Sanity Presentation (`31c0820`); **stega leak fix** —
  don't encode `category`/URLs (`8dbb6cf`).
- **Virtual gallery** at `/gallery` (`2e03968`); **project detail pages** at
  `/work/[slug]` with `story`/`gallery`/`credits` on the schema (`67363a4`,
  `fea9273`); Commercial/Social categories + video seed (`2337a4e`); poster-frame
  cover seed for video projects (`bd9bcec`).
- **Video** transcode → R2 Colab pipeline (`2c1ae94`).
- **Copy** — brand language + em-dash removal, "your company" value-prop voice
  (`ed82ef4`, `e4f8e9d`).
- **Studio hardening (same arc):** share-link AuthGate bypass fix (`fffe28b`);
  tab-crash / owner self-refresh loop fixes + crash-capture diagnostic (`6f16aba`,
  `2e1705e`, `661d3f4`, `23cf345`, `d918f89`); collab echo-loop + deck-field sync +
  cross-origin PNG-export fixes (`16d04c8`, `8d7dbc6`, `00bb641`); font drag-drop
  upload (`076bbcf`); highlight style picker + live formatting preview + in-app
  colour popover (`b986842`, `6444825`, `c65f75b`); canvas zoom/pan + equal-spacing
  badges + selection polish (`e3e1410`, `0eddced`, `aa3ee00`).

### Studio arc (previous session — the carousel maker)

**Editor / create-screen polish (earlier in the arc):** create-screen reflow to the
topic pipeline + merged rail (`96f2e29`, `0d0f6a7`, `e5c6d44`); flag-derived deck
palette (`7e678ef`); text-case toggle + Enter-inserts-newline (`cfe3ae1`);
font-aware resize — corners scale type, edges reflow (`20d8813`); unified image
transform, past-edge + scroll zoom (`180b1c7`); slide-reset toast + the two reset
buttons differentiated (`0f1291e`, `e7ce000`); **picture-disappearance fix** —
offload `slide.content.image` too (`8f1e5f0`).

1. **Element grouping** — multi-select, marquee, group/ungroup, align, group-drag
   (`a59ad62`; `group.js` pure core).
2. **Real-time collaboration** — presence (cursors/selection/name+initials,
   `presence.js`/`usePresence`, `cbddc61`); edit-sync core `diffDocs`/`applyOps`
   (`025b648`) wired with advisory locks (`c794968`); jump-to-peer + Follow +
   slide-strip badges (`b79a8a5`).
3. **Share-as-edit** — edit links open the real editor and save back through the
   token (server write-back `writeShared`, image offload; was view-only) (`779e4c0`);
   hardened: body cap + documented collab Firestore rules (`d6db912`).
4. **Selection handles** slimmed (`c641f5d`); shapes can shrink to a hairline
   (`f681f15`).
5. **Recently deleted** — 24h soft-delete recycle bin on the dashboard (`c98e025`).
6. **Shapes + effects** — triangle/diamond/hexagon (`22f0afc`), border width +
   solid/dashed/dotted (`ea9c25e`), ribbon/bookmark/callout/quote (`0556076`),
   element drop-shadow & glow (`a083727`, `textfx.js`). All three renderers
   (Element/StaticSlide/export) kept in sync via `ShapeBacking` + `export.js`.
7. **Self-branding / Client mode** — the big cluster:
   - Core model `clientBrand` + `brandMode` (`d7d4008`, `clientbrand.js`), store
     `setBrandMode`/`setClientBrand` re-theme via `effectiveBrand` (`034cd87`),
     Brand-panel toggle + form (`e6bc368`), footer/closeout (`853d57d`).
   - **Copy design** (paint one page's look onto this/all pages — `762b9ee`,
     `design.js`), **Design prompt** (preset restyles + AI restyle via
     `/api/design` — `a6aa8cd`), **Brand kits** (save/reuse — `b00bdf6`,
     `brandkits.js`).
   - **Guest create screen** — document-first, Editorial-locked, collapsed, with
     self-branding on the create screen; members reach the same via a **Client-mode
     toggle** (`06d03f0`, `55a3c9c`; shared `ClientBrandForm.jsx`).
   - **Logo upload + placement** (corner + which slides) and **page-number options**
     (`55a3c9c`, `54be218`; `stampLogo` placement-aware + new `stampPageNumbers`).
8. **Source fidelity** — verbatim ↔ reworded slider for document uploads
   (`de6d085`, `FIDELITY_LEVELS`).
9. **Access gate (external / non-team accounts)** — the whole cluster:
   - **Individual-account allowlist** on top of the domain lock, Gmail dot/plus-safe
     (`3db3ab3`, `ALLOWED_EMAILS` + `normalizeEmail`).
   - **Guest monthly cap** — `GUEST_MONTHLY_LIMIT = 9`; `effectiveMonthlyLimit(role,
     stored, isGuest)`; `isGuest` threaded through `verifyRequest`→`meterGenerate`
     (`0349fd2`; member-vs-guest = email domain, `isMemberEmail`).
   - **Request-access + admin approval** — external sign-ins hit a request screen
     (not a hard wall); `accessRequests/{uid}` queue; admin **Requests** tab
     approve/deny; approval adds to a runtime allowlist (`config/allowlist`) +
     sets role (`f5db0e1`; `/api/access/*`, `/api/admin/requests`, `verifyIdentity`).
10. **Anonymous shared-editor live sync** — a token-authorized relay
    (`/api/shared/live`, `relayLive`) lets share-link editors (no account)
    broadcast cursor + ops and see peers, sharing one room with signed-in members;
    adaptive, visibility-gated short-poll (`livesync.js`, `useSharedLive`) keeps a
    solo guest near-silent (`9b867fe`).
11. **Per-generation audit log** — every metered generation writes `auditLog/{id}`
    (metadata + truncated topic ONLY — never doc text/prompt); admin **Audit** tab
    (filter + search); `logGeneration`/`listAuditLog`, `/api/admin/audit` (`b7aca2c`).

---

## ⏭ Open / offered-but-unbuilt

- **Sanity content is live but empty until seeded.** The schema + fallbacks ship,
  but a fresh Sanity project shows the hardcoded copy until the seed scripts run
  with a write token (see the marketing-site map above and `sanity/seed/README.md`).
- **`docs/SANITY_SETUP.md` "editable surfaces" table is behind the code** — it lists
  only Home + Work, but every page is now editable (`3176137`). Worth refreshing.
- **Marketing polish (open):** the `/gallery` "virtual gallery" is a preview;
  project detail pages (`/work/[slug]`) render `story`/`gallery`/`credits` only when
  seeded.
- **Admin deck viewer — write scope** (Studio; offered, awaiting a call): the viewer
  is **read-only**. Could add **duplicate into the admin's own account** and/or
  **edit-in-place**. (The per-generation audit log this once listed is now built —
  `b7aca2c`.)
- Deferred-by-design (low): more premium Studio layouts, recent-projects shelf.

(The client-mode white-label footer gap this once listed is now closed —
`rebuildContentFooter` strips the LOATHR running footer entering client mode and
restores it on the way back; see the store's `setBrandMode`/`setClientBrand` paths.)

## 🚀 Deploy-side actions owed by the user (NOT code — can't be done in-sandbox)

The sandbox blocks outbound network, so these are verified only on the real
deploy. Track them in `docs/VERIFY.md` and `docs/CLOUD_SETUP.md`:

1. **Redeploy from `main`** to pick up this session's features (several screenshot
   diagnoses traced to a stale deploy, not a code bug).
2. **Sanity env + seed (marketing site)** — set `NEXT_PUBLIC_SANITY_PROJECT_ID`
   (+ optional `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, and a
   server-only `SANITY_API_READ_TOKEN` for authenticated reads / live editing), then
   run the `sanity/seed/*` scripts with a **write token** to populate projects +
   page copy. Until then the site serves hardcoded fallbacks. Confirm `/cms` loads,
   Presentation live-editing works, and no stega chars leak into filters/URLs. See
   `docs/SANITY_SETUP.md`.
3. **Firebase Admin credentials** must be configured on the deploy, or the admin /
   gate / access-request / live-relay routes safely no-op.
3. **Firestore security rules** — add every collection now documented in
   `CLOUD_SETUP.md`: `sharePulse`, `presence`, `edits` (+ the anon-relay note),
   `accessRequests` (self-create only), `config` (server-only), `auditLog`
   (server-only). Recommended TTLs: `edits/{deckId}/stream` on `ts`, `auditLog` on
   `ts` (~90 days).
4. **Access gate env** — `ALLOWED_EMAILS` (individual accounts seed) and, if the
   team domain differs, `MEMBER_EMAIL_DOMAINS`; confirm the **request-access** flow
   (external Google account → request screen → admin **Requests** tab → approve →
   entry as a guest).
5. Confirm the **`@loathr.com`** sign-in behaviour and the **guest 9/month cap**.
6. Confirm **people image search** returns real photos (Wikimedia reachable).
7. **Enable the Drive API + consent the `drive.file` scope** (the 403 was config,
   not code).

---

## 🧪 Verification recipes & constraints

- **Network:** only the Anthropic API proxy is reachable. Firebase, Google OAuth/
  Drive, Wikimedia, stock, and news feeds all return `000`/`403` in-sandbox — do
  not retry policy denials; reason from code + unit tests instead.
- **Gate:** `npm test` (**569 passing**) — `node --import ./test/register.mjs
  --test test/*.test.mjs` (node:test, extensionless ESM). Plus `npm run build`
  (Next 16 / Turbopack).
- **Sanity in-sandbox:** the CMS is network-gated like Firebase — with no
  `NEXT_PUBLIC_SANITY_PROJECT_ID`, `isSanityConfigured` is false, `sanityFetch`
  returns fallbacks, and the marketing pages render hardcoded copy (that IS the
  testable path). Seed scripts and live editing are **deploy-only**. Verify the
  fallback logic from `sanity/lib/fetch.ts` + unit tests, not a live query.
- **Mocks:** a `.cjs` writes an HTML file into the session scratchpad; send it
  with `SendUserFile` (`display:"render"`). Mocks never go in the repo.
- **Live UI in-sandbox:** `npm run build` → `npx next start` → drive Chromium at
  `/opt/pw-browsers/chromium` with `puppeteer-core` (`--no-save`). External
  images 404 (proxy) but the UI + text/shape editing work. The marketing pages
  (`/`, `/work`, `/gallery`, …) render on their fallback copy.
- **Signing check:** `git cat-file -p HEAD | grep gpgsig` (not `%G?`).

## 🔧 Key constraints recap
- Next 16 (Turbopack), pure ESM, **extensionless imports** (resolver in
  `test/register.mjs`). Two apps share the build: marketing (`app/(marketing)`, TS)
  and Studio (`app/studio`, JS).
- **Sanity is optional and fail-open:** gated on `isSanityConfigured`; every read
  goes through `sanityFetch(query, fallback, params)` and falls back on
  unconfigured/error/empty. Server-only token is never `NEXT_PUBLIC_`. Never encode
  stega into `category`/`slug`/URL fields. Studio owns `/studio`; Sanity owns `/cms`.
- Artboard 1080×1350; slide = background + flat element list (FLAT-LAYERS §3).
- Roles: viewer/editor/admin (Firebase custom claims); Firestore `users/{uid}/
  decks`; `shares/{deckId}` + `sharePulse/{deckId}` for share links; `presence/` +
  `edits/` (collab), `accessRequests/` + `config/allowlist` (access gate),
  `auditLog/` (audit). Member vs guest = email domain (`isMemberEmail`); guests get
  client branding + a 9/month cap.
- Today's date reference in-session: **2026-08-04**. User email:
  `loathr@loathr.com`.
