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

Edit **`lib/content.ts`** — the only file you touch to add disciplines or pieces:

```ts
{
  id: "ph-01", title: "Morning, Kitchen", type: "image",
  src: "/media/photo/ph-01.jpg", w: 1600, h: 2000, year: 2025,
}
```

- Put files in `public/media/…` and reference them via `src` (`poster` for video).
- A work with **no `src`** renders generative placeholder art in its discipline's
  palette, so the site looks complete before real media exists.

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
