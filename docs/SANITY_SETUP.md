# Sanity CMS — setup & operation

The marketing site reads editable content from Sanity, but **degrades gracefully**:
with no Sanity project configured it runs entirely on built-in copy, and `/cms`
shows a "not configured" notice. Nothing below is required for the site to build
or deploy — it's required only to turn on editing.

Editable surfaces today:

| Surface | Sanity type | Falls back to |
|---|---|---|
| Home hero, marquee, closing band | `siteSettings` (singleton) | current hardcoded copy |
| Our Work grid | `project` | current 14-card grid |
| Home "Selected work" strip | `project` where `featured == true` | current 4 cards |

The Studio (editor) is embedded at **`/cms`** (the loathrdotcom carousel app owns
`/studio`).

---

## 1. Create the Sanity project (~2 min)

1. Go to **https://sanity.io/manage** → log in → **Create new project**.
2. Name it `Loathr`. Use the default dataset name **`production`** and set its
   visibility to **Public**.
   - *Why public:* the site reads published content with no token. A private
     dataset would require a server token; public only ever exposes what you
     **Publish**.
3. Copy the **Project ID** (e.g. `9x8k2abc`) from the project overview.

## 2. Environment variables

Names (defaults in parentheses — only the Project ID is truly required):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | *(your Project ID)* |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `2025-01-01` |

- **Vercel:** Project → Settings → Environment Variables → add all three for
  every environment. Env changes need a fresh build — redeploy after.
- **Local:** put the same three lines in `.env.local` (git-ignored). See
  `.env.local.example`.

## 3. CORS origins (so the Studio can reach Sanity)

sanity.io/manage → project → **API → CORS origins → Add origin**, each with
**"Allow credentials" checked**:

- `http://localhost:3000`
- your **stable** production URL — `https://mg-loathrs-projects.vercel.app`
- your custom domain when live — `https://loathr.com`

### Don't add per-deployment preview URLs

Vercel's per-commit URL (`mg-`**`<hash>`**`-loathrs-projects.vercel.app`) is unique
to each build and changes on every push. Use the **stable** URLs instead:

| URL | Stable? |
|---|---|
| `mg-<hash>-loathrs-projects.vercel.app` | ❌ changes every push |
| `mg-git-<branch>-loathrs-projects.vercel.app` | ✅ latest build of that branch |
| `mg-loathrs-projects.vercel.app` (production) | ✅ |
| custom domain | ✅ |

**Recommended:** edit content only at the **production `/cms`** (or custom
domain). Preview deploys are for testing code, not editing content, so they
don't need `/cms` access. If you *do* want every preview covered, Sanity CORS
accepts a wildcard — add `https://*-loathrs-projects.vercel.app` once.

## 4. Redeploy / restart

- **Vercel:** redeploy (Deployments → ⋯ → Redeploy, or push any commit).
- **Local:** restart `npm run dev`.

## 5. Verify end-to-end

1. Open **`/cms`** → you now get the Studio login instead of the notice → sign in.
2. **Site Settings** → change the hero eyebrow → **Publish** → reload Home; the
   edit appears within ~60s (the revalidate window).
3. Create one **Project** → name + category, toggle **Feature on Home**, paste an
   image URL into **Cover URL** → **Publish**. It appears on `/work` and Home's
   Selected strip.

---

## Operating notes

- **Publish, not draft.** The public site reads only *published* documents.
  Drafts are invisible until you hit Publish.
- **~60s to appear.** Reads revalidate on a 60-second interval, so edits aren't
  instant.
- **Images.** Each `project` takes either an uploaded **Cover image** or a direct
  **Cover URL** (paste an R2 CDN link). The URL wins when both are set. Real
  covers fill the card and zoom on hover; the placeholder tag shows only when no
  image is set.
- **Ordering.** `order` (lower = first) controls placement in both Our Work and
  the Home strip. `featured` decides whether a project also shows on Home.
- **Filters.** Our Work filter buttons appear only for categories that have at
  least one project.
