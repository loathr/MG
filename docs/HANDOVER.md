# Handover — LOATHR (MG): Google Auth Wall + Studio Rebuild

> Working handover for a fresh Claude Code session. The container is ephemeral and
> context gets summarized, so this file is the source of truth. **Read this in full,
> then read the two docs in §1 before writing any code.**

Branch: `claude/quirky-edison-2x373z` · PR: **#8** (https://github.com/loathr/MG/pull/8)

---

## 0. TL;DR — how to resume

Two workstreams are scoped but **not started** (PR #8 currently only adds `app/api/health`):

- **A. Google "password wall"** for the new build — *net-new*, no code or spec exists yet. Needs 3 owner decisions (§4). 
- **B. Finish the Studio rebuild** — foundation done, ~steps 1–6 of `docs/STUDIO_REBUILD.md` remain; the image-path stress test (step 2) is the crux and is unproven (§5).

Pick one, do it end-to-end, push to this branch (updates PR #8). Don't start both at once.

---

## 1. Read FIRST (non-negotiable)

1. **`AGENTS.md`** — this is a *modified* Next.js 16. **Read the relevant guide under
   `node_modules/next/dist/docs/` before writing code** (run `npm install` first or the
   dir won't exist). Heed deprecations. Notable: **middleware is renamed `proxy`**
   (`proxy.ts` convention; see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`).
2. **`docs/STUDIO_REBUILD.md`** — the rebuild spec. §3 "**FLAT LAYERS**" is the
   architectural law (the old app crashed from GPU-compositor memory; one bg image +
   one scrim per slide, only the current slide renders heavy children). Don't violate it.

---

## 2. Project shape

- `/` → **old monolith** `app/components/LoathrMediaGenerator.jsx` (~8k lines), gated by an
  **invite code**. Being **abandoned**, not extended — reference for *content/voice* only.
- `/studio` → the **rebuild** (`app/studio/*`). Crash-safe canvas foundation works.
  **Currently ungated** (`app/studio/page.jsx` just renders `<Studio/>`).
- API routes (`app/api/<name>/route.js`): `images`, `generate`, `verify`, `script`,
  `health` (new, this PR). The invite gate is **client-side only** — `/api/verify` checks a
  code but the API routes themselves are not server-gated.

---

## 3. Environment / setup (ephemeral container)

```bash
npm install                 # node_modules starts empty; also makes the next docs appear
nohup npm run dev > /tmp/dev.log 2>&1 &   # plain `npm run dev &` does NOT survive
curl localhost:3000/api/health            # expect {"status":"ok"}
```
- You **cannot** reach `localhost:3000` from a browser (remote sandbox). For browser
  testing use the **Vercel preview** on PR #8.
- The sandbox **network policy blocks `vercel.app`** (curl → 403 via proxy), so you can't
  drive the deployed app from here — only the local dev server.

**Env vars the code actually reads** (⚠️ `.env.local.example` is STALE — it lists only
`ANTHROPIC_API_KEY` + two `NEXT_PUBLIC_*` image keys; the real set is below). "Container"
= what's set in this sandbox; for the deployed app these must be set in **Vercel → project
`mg` (loathrs-projects) → Settings → Environment Variables**, then redeploy.

| Var | Purpose | Container |
|---|---|---|
| `ANTHROPIC_API_KEY` | generation (`/api/generate`,`/api/script`) | ✅ set |
| `ADMIN_CODES`, `INVITE_CODES` | invite gate (`/api/verify`); comma-separated | ❌ unset → no login locally |
| `UNSPLASH_KEY` / `PEXELS_KEY` / `PIXABAY_KEY` | server image search (`/api/images`) | ✅ set |
| `NEXT_PUBLIC_TMDB_KEY` / `NEXT_PUBLIC_EUROPEANA_KEY` | optional image providers | ❌ unset |

- **Vercel:** repo is already connected (GitHub integration auto-deploys previews). Plan is
  **Pro**, so `maxDuration = 300` on `generate`/`script` is fine (Hobby caps at 60s).

---

## 4. Workstream A — Google password wall (net-new)

There is **no existing Google auth** anywhere (every "google" in the repo is `next/font/google`).
Today's only access control is the monolith's invite code; `/studio` is wide open.

**Owner decisions needed before building:**
- (a) **Who's allowed in:** any Google account, or an allowlist (`ALLOWED_GOOGLE_EMAILS`) / a
  Workspace domain (`ALLOWED_GOOGLE_DOMAIN`)?
- (b) **Replace or layer:** does Google sign-in replace the invite code, or sit alongside it?
  (Role — admin vs limited — could come from the email allowlist instead of codes.)
- (c) **Scope:** gate only `/studio`, or the whole app?

**Recommended approach (lightweight, fewest deps — fits the repo's env-driven gate style):**
1. `app/components/SignIn.jsx` — Google Identity Services button → client gets an ID token.
2. `app/api/auth/google/route.js` (POST) — verify the ID token (audience = `GOOGLE_CLIENT_ID`,
   check email vs allowlist), set a **signed httpOnly session cookie**. Mirrors `/api/verify`.
3. `app/api/auth/logout/route.js` — clear the cookie.
4. **`proxy.ts`** (repo root) — redirect unauthenticated requests for protected routes to the
   sign-in screen. (Read the Next 16 `proxy.md` + `cookies()` + route-handler docs first.)
5. **Config:** Google Cloud OAuth Client ID (Web) with authorized origins/redirects for
   `localhost:3000` and the `*.vercel.app` domains; env `GOOGLE_CLIENT_ID`,
   `ALLOWED_GOOGLE_EMAILS`/`_DOMAIN`, `SESSION_SECRET` → set in **Vercel** + locally.

**Alternative:** Auth.js v5 (NextAuth) Google provider — less code, but **verify it works on
this modified Next 16 / React 19 before committing** (higher risk; AGENTS.md warning applies).

---

## 5. Workstream B — finish the Studio rebuild

State vs `docs/STUDIO_REBUILD.md` §10–11 (the studio is ~995 lines across 10 files):

**Done — crash-safe foundation (§10 "keep"):** `model.js`, `store.js` (isolated reducer),
`Artboard.jsx`/`Element.jsx`/`geometry.js`/`Toolbar.jsx` (select, drag, resize, rotate, inline
text edit), `generate.js`/`templates.js`. `Studio.jsx` is deliberately-minimal placeholder chrome.

**Remaining (spec build order §11):**
1. **Editor shell** — left tool rail (Text/Elements/Photos/Templates/Brand), right *contextual*
   toolbar, real **thumbnail** strip. (Today: one top header + numbered slide buttons.)
2. **Photos panel** — search grid off `/api/images`, set-as-background w/ scrim, and
   **remove `window.prompt("Image URL:")` in `Studio.jsx`** (spec §7/§12 forbid URL entry).
   ⚠️ This is **"the crux the old app failed"**: generate a 9-slide photo carousel and confirm
   navigating every slide stays light under §3. **Not yet proven — do this early.**
3. **Create screen** — "pick a look" style gallery → topic (currently just a header input;
   "Editorial" badge is hardcoded).
4. **Undo/redo** (absent from `store.js`), **snapping guides** UI, **slide reorder/duplicate**.
5. **Bold/Minimal style families** + **Brand panel**.
6. **Editorial prompt/voice quality** pass.

**Suggested first task:** step 2 (Photos panel + the §3 image-path proof) — it retires the
banned URL prompt *and* de-risks the one thing that killed the old app.

---

## 6. Testing / verification

- No `npm test` (no suite). Testing = exercise the running app.
- **Local backend smoke tests** (routes aren't server-gated): `POST /api/images` (free, keys
  present), `POST /api/verify` (set a temp `INVITE_CODES` to demo the gate). `POST /api/generate`
  / `/api/script` **spend Anthropic tokens** — only with explicit go-ahead.
- **Browser/deployed** testing → Vercel preview URL on PR #8 (needs Vercel env vars + a valid
  invite code, or the Google wall once built).

---

## 7. PR + watch status

- **PR #8** currently adds only `app/api/health` (a liveness route). CI (Vercel preview) is
  **green**; `mergeable_state: clean`.
- A PR **watch** was running in the *previous* session (webhook subscription for CI/comments +
  a 30-min `Monitor` poll loop, re-armed on each timeout, for push/merge-conflict/close). That
  watch and its scratchpad poller are **session-bound and do not transfer** — if you want it,
  re-subscribe via `subscribe_pr_activity` for loathr/MG#8.

---

## 8. Gotchas

- **Don't print secrets** (`ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, etc.) into the transcript.
- **Don't port the monolith renderer.** Reference it only for content/voice.
- **No image-URL input** in the studio (remove the existing `window.prompt`).
- **FLAT LAYERS (§3)** is law — no stacked compositing / backdrop-filter / blend modes.
- Output stays **premium editorial**; "kid-simple" describes the controls, not the look.
- Commit only intended files — `npm install` may re-churn `package-lock.json` (drops some
  `libc` metadata); revert that with `git restore package-lock.json` before committing.
