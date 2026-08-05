# OTE — otes.me

A single-candidate portfolio built as a full-bleed **live media wall**: an
edge-to-edge, continuously interchanging mosaic. Click a panel to enter a
discipline; each discipline has its own wall.

Standalone Next.js app (App Router, React 19, TypeScript). No 3D libraries — the
wall is hand-rolled Canvas 2D, so the bundle stays tiny.

## Run locally

```bash
cd ote
npm install
npm run dev      # http://localhost:3000
```

## Add real work

Edit **`lib/content.ts`** — the only file you touch to add disciplines or pieces.
Works are **id-based**; the app derives media URLs from the id, so you just list
what exists:

```ts
{ id: "ph-01", title: "Morning, Kitchen", type: "image", year: 2025 }
```

The wall then loads `<MEDIA_BASE>/<discipline>/<id>/wall.webp`. A work whose media
isn't in R2 yet renders generative placeholder art in its discipline's palette —
so the site stays complete while you fill the bucket piece by piece. You can still
hard-code a one-off `src`/`poster` on a work to override the derived URL.

## Media pipeline (Cloudflare R2)

Masters live on your drive; we optimize once and serve lightweight variants from
R2. The wall pulls a small `wall.webp` per panel; the detail view pulls `full.webp`.

**Key convention:** `<discipline>/<id>/<variant>.webp` — variants: `wall` (720px),
`full` (2200px), `poster` (video still), plus `clip.mp4` and a `blur.txt` LQIP.

### One-time R2 setup

1. Cloudflare → **R2** → **Create bucket** → `otes-media`.
2. Create an **R2 API token** (Object Read & Write); note Account ID, Access Key,
   Secret.
3. Bucket → **Settings → Public access** → allow → copy the `https://pub-….r2.dev`
   URL. Set it as `NEXT_PUBLIC_MEDIA_BASE` locally (`.env`) **and** in Vercel →
   Settings → Environment Variables (Production), then redeploy.
4. Bucket → **Settings → CORS** → add:

   ```json
   [{ "AllowedOrigins": ["https://otes.me", "http://localhost:3000"],
      "AllowedMethods": ["GET"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
   ```

### Pull masters from your drive

Use [`rclone`](https://rclone.org) (free) to sync a Google Drive / cloud folder
into `drive-in/`, arranged as `drive-in/<discipline>/<id>.<ext>`:

```bash
rclone config                       # add a "drive" remote once
rclone copy drive:OTE/photography ./drive-in/photography
```

### Optimize + upload

Requires **ffmpeg** on PATH for video. Then:

```bash
cd scripts
npm install
cp ../.env.example ../.env          # fill in R2_* + NEXT_PUBLIC_MEDIA_BASE
node optimize.mjs                   # optimize all + upload to R2
#   --no-upload      write ./media-out only
#   --only=film      one discipline
#   --dry            list what would happen
```

Upgrade to a branded `cdn.otes.me` later by moving otes.me DNS to Cloudflare and
changing the one `NEXT_PUBLIC_MEDIA_BASE` value — no code changes.

## Structure

| Path | What |
|------|------|
| `app/page.tsx` | Landing — the full wall (all disciplines interspersed) |
| `app/[discipline]/page.tsx` | One discipline's wall |
| `app/about/page.tsx` | Bio + contact |
| `components/MediaWall.tsx` | The canvas engine (packing · morph · bursts · takeovers) |
| `lib/content.ts` | Content source of truth |
| `lib/packing.ts` | Gapless grid tiler |
| `lib/media.ts` | Frame loading + placeholder art |

## Deploy (free, to Vercel)

1. Push the repo. In Vercel, import it with **Root Directory = `ote`**.
2. It builds and serves at `ote-*.vercel.app`.
3. Add **otes.me** in Project → Settings → Domains and set the DNS records Vercel
   shows (A `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`).
4. Flip DNS off Base44 **last** — zero downtime.

Vercel Hobby is free and fine for a personal portfolio.
