# Deploy verification checklist

Everything below is **deploy-only** — it couldn't be exercised from the build
sandbox (no Anthropic credit, external feeds blocked, no Firebase project). Run
these on the Vercel deploy once the env is wired (see `docs/CLOUD_SETUP.md`).
Items shipped this session, gated by `npm test` + `npm run build` throughout.

Deploy: `https://mg-git-claude-charming-fermat-2niyvq-loathrs-projects.vercel.app/studio`
PR: `https://github.com/loathr/MG/pull/9`

---

## 1. Topic Routes
- [ ] **Tier 2b — region + urgency shape the live feed.** Open, with `?debug=1`:
  - `…/api/trending?beat=news_conflict&region=europe&urgency=breaking&debug=1`
    → items skew European + recent; `debug.sources` show which feeds returned.
  - Try `region=asia`, `urgency=trending` (wider recency). Confirm it never
    returns an empty rail (it broadens rather than gutting).
  - **Depth (scopedPlan fan-out):** for a region, `debug.plan` should list the
    fanned-out member-country hubs (e.g. `europe` → UK/FR/GM) each with a `gdelt`
    code; for a subregion (e.g. `&country=France`) `plan` is a single France pull
    with terms only (no `"France"` keyword) and `scopedCount` should be healthy
    (not 1–2). Confirms region/subregion pulls are now genuinely in-depth.
- [ ] **A routed generation** (needs Anthropic credit). Pick a Sector/Section,
  set Region/Urgency and an Angle/Emphasis/Mode, generate — confirm the deck is
  scoped to the beat + framed (breaking lead, region focus, etc.). `Any` with no
  route should read like the pre-routes deck.

## 2. Cloud — auth + storage (needs the Firebase project from CLOUD_SETUP.md)
- [ ] **Google sign-in** — `/studio` shows "Continue with Google" → sign in →
  lands on "Your projects". (Authorized domains include the Vercel host.)
- [ ] **Autosave + reload** — create/edit a deck → header shows "Saved to cloud"
  → refresh → the deck reloads from the account.
- [ ] **Projects screen** — list shows saved decks; Open loads into the editor;
  New starts a fresh deck; Delete removes one.
- [ ] **Per-user isolation** (security rules) — sign in as a second Google
  account → you must NOT see the first account's decks.
- [ ] **Generate token-gate** — signed-out `POST /api/generate` → 401; signed-in
  generation succeeds (valid ID token verified server-side).
- [ ] **Image search after the key rename** — set `UNSPLASH_KEY` / `PEXELS_KEY` /
  `PIXABAY_KEY` (non-`NEXT_PUBLIC_`); confirm Photos search still returns results
  and no provider key appears in the client bundle.

## 3. B3 · Per-span size (in-editor)
- [ ] Double-click a text box, **select one word**, hit the bar's **A+ / A−** →
  only that word resizes (the rest stays). Confirm the **PNG export** matches —
  the sized word sits on the same baseline as the line (mixed-size alignment).
  *(Model + render + export are unit-tested; the live select→resize couldn't be
  driven headlessly — it rides the per-span-colour pipeline already verified.)*

## 4. Look & Frame (already live-verified in-sandbox — optional re-check)
- [ ] Brand → Look → **Frame colour** recolours the frame; ↺ resets to accent.
- [ ] Brand → Look → **Layout** switches Editorial/Enterprise/News Desk (cover
  re-flows, fonts change, colour palette kept).

## 5. General
- [ ] **Cloud 11c — image upload to Storage** (needs a Firebase project with
  Cloud Storage + `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`): add a photo, save a
  deck, confirm the indicator shows "Uploading images…" then "Saved", the
  Firestore doc holds Storage download URLs (not `data:` base64), the images
  live under `users/{uid}/decks/{id}/img_*`, reload restores them, and a
  photo-heavy deck (previously >1 MB) now saves. Sandbox blocks the bucket.
- [ ] **End-to-end generation** of any deck (Anthropic credit) — the core path
  the sandbox can't exercise.
- [ ] **D1 (carryover)** — re-confirm trending beats on the deploy via `?debug=1`
  (tea = gossip only; nightlife non-empty; ent_* vetted) per HANDOVER.
