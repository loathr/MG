# LOATHR Studio — Session Handover

A pick-it-up-cold snapshot of **LOATHR Studio** (a Next.js Instagram-carousel
maker). Read this end-to-end before touching code. For the original as-built
architecture and rationale, `docs/STUDIO_REBUILD.md` is the deeper reference;
this file is the *current* working state on top of it.

- **Dev branch:** `claude/handover-docs-lxchp0`
- **Promotion:** every shipped change is promoted to production `main` with
  `git push origin claude/handover-docs-lxchp0:main` (there is **no PR** in this
  flow — main is updated directly after the gate passes).
- **HEAD at this writing:** `05129e8` · **Tests:** 367 passing · **Build:** clean
  (Next 16 / Turbopack).

> **Branch note:** the task harness may name a *different* dev branch. Ignore it —
> all work lives on `claude/handover-docs-lxchp0` and is mirrored to `main`.

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
   Claude-Session: https://claude.ai/code/session_01JmXpnbwNLB8gBbvhx82a2Y
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

> You are continuing **LOATHR Studio** on branch `claude/handover-docs-lxchp0`,
> promoting each shipped change to `main`. Read this handover first.
>
> The app is a mature Next.js 16 carousel maker: a generation pipeline (Opus 4.8
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
adapters just wire them to IO and fail *open/safe*.

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

## 🧾 What happened THIS SESSION (conversation → work → commits)

Chronological, mapping each user request to what shipped. All gated, signed, and
promoted to `main`.

1. **Voice/tone richness** — "run that comparison": A/B of two personas; then a
   per-persona **structural `shape` exemplar** for all 10 voices so decks diverge
   in shape, not just wording. `1e447f8`; Create screen de-duplicated Voice/Tone
   `54ea561`.
2. **Trending + region** — chose fan-out + honest scope note + image guard
   (`c0deb70`); later "remove pictures / prioritize depth" reversed the
   thumbnail-first sort → `rankItems` richness-first (`caa79e8`); region scope now
   truly leads with in-region items (`09029b0`, `preserveOrder`).
3. **Highlight editability** — bake the generated marker into a real run so it's
   editable/removable (`effb53d`); removing it clears the knockout colour so text
   re-integrates (`8d137f2`).
4. **Fact-check** — sourced one-tap corrections, Apply / Apply-all-verified
   (`7e30267`).
5. **Stick-man loader** — replaced walk/run with 6 "working" tasks
   (Painter/Typist/Builder/Digger/Sweeper/Dancer) (`4a608d4`).
6. **Photos tile stacking** — absolute-position img + grid `alignItems:start`
   (`50ffcef`).
7. **People image search** — entity-first (Wikipedia/Wikidata/Commons, badges)
   (`65048a8`); deeper relevance-ranked stock + fuller gallery (`5bafd76`); fixed
   two regressions — lowercase queries + the invalid Wikidata pipe (`7ef701f`);
   added Commons **depicts** P180 (`8f07f7c`).
8. **Google Drive export + live onSnapshot viewer** — both deploy-only (`735c8af`);
   Drive error decoding surfaces the real 403 fix (`988dbb3`).
9. **Coherence + Polish** — the **Polish (revise) pass** + **Coherence check**
   tool (`453b8f4`); one-tap **rewrite / cut / merge** fixes (`12fae8c`); the
   check also critiques the **cover hook** (`6186cb4`).
10. **Domain lock** — sign-in restricted to `@loathr.com` (three layers: client
    sign-in, server `verifyRequest`, `authCore` policy) (`1a0779c`).
11. **Text-edit font size** — per-span nudge accumulates on the span not the
    element base (`40cddf1`, `sizeSpan` reads `.fontSize`); the toolbar size box
    is now typeable (`754bd06`).
12. **Admin account decisions** — **Suspend/Reactivate** (reversible Firebase Auth
    `disabled` flag) + **Remove** (permanent `deleteUser` + optional Firestore
    purge), self-target refused, type-the-email confirm, admin-gated
    `/api/admin/account` (`94b8c9a`).
13. **Admin can see other generations** — the All-decks rows open a **read-only
    viewer** of any user's deck via admin-gated `/api/admin/deck` (Admin SDK
    bypasses rules); reuses `SharedViewer` with an "Admin view · read-only" badge;
    stays on the admin screen so autosave never mirrors the deck into the admin's
    own account (`05129e8`). **Built read-only** — duplicate / edit-in-place and a
    per-generation audit log were offered but not built (see below).

Earlier in the same session arc (UI/editor polish): lucide icon sweep, brand
accordion, copy/paste elements, rotating topic suggestions, true crop, uniform
photo tiles, create→dashboard routing.

---

## ⏭ Open / offered-but-unbuilt

- **Admin deck viewer — scope options** (offered, awaiting a call): currently
  **read-only**. Could add **duplicate into the admin's own account** and/or
  **edit-in-place**; and a **per-generation audit log** (prompt + timestamp on
  every generate — a new Firestore write path + a privacy decision).
- **"Copied!" confirmation** on the Share-link Copy button (offered, not built).
- Deferred-by-design (low): more premium layouts, recent-projects shelf, grid
  snapping, News "breaking" deck mode.

## 🚀 Deploy-side actions owed by the user (NOT code — can't be done in-sandbox)

The sandbox blocks outbound network, so these are verified only on the real
deploy. Track them in `docs/VERIFY.md` and `docs/CLOUD_SETUP.md`:

1. **Redeploy from `main`** to pick up this session's features (several screenshot
   diagnoses traced to a stale deploy, not a code bug).
2. **Firebase Admin credentials** must be configured on the deploy, or the admin
   lifecycle/viewer routes safely no-op.
3. Confirm the **`@loathr.com`** sign-in bounce (a non-loathr Google account is
   signed out + rejected).
4. Confirm **people image search** returns real photos (Wikimedia reachable).
5. **Enable the Drive API + consent the `drive.file` scope** (the 403 was config,
   not code).
6. Add the **`sharePulse` Firestore rule** (documented in `CLOUD_SETUP.md`).

---

## 🧪 Verification recipes & constraints

- **Network:** only the Anthropic API proxy is reachable. Firebase, Google OAuth/
  Drive, Wikimedia, stock, and news feeds all return `000`/`403` in-sandbox — do
  not retry policy denials; reason from code + unit tests instead.
- **Gate:** `npm test` (**367 passing**) — `node --import ./test/register.mjs
  --test test/*.test.mjs` (node:test, extensionless ESM). Plus `npm run build`
  (Next 16 / Turbopack).
- **Mocks:** a `.cjs` writes an HTML file into the session scratchpad; send it
  with `SendUserFile` (`display:"render"`). Mocks never go in the repo.
- **Live UI in-sandbox:** `npm run build` → `npx next start` → drive Chromium at
  `/opt/pw-browsers/chromium` with `puppeteer-core` (`--no-save`). External
  images 404 (proxy) but the UI + text/shape editing work.
- **Signing check:** `git cat-file -p HEAD | grep gpgsig` (not `%G?`).

## 🔧 Key constraints recap
- Next 16 (Turbopack), pure ESM, **extensionless imports** (resolver in
  `test/register.mjs`).
- Artboard 1080×1350; slide = background + flat element list (FLAT-LAYERS §3).
- Roles: viewer/editor/admin (Firebase custom claims); Firestore `users/{uid}/
  decks`; `shares/{deckId}` + `sharePulse/{deckId}` for share links.
- Today's date reference in-session: **2026-07-06**. User email:
  `loathr@loathr.com`.
