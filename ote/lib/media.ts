"use client";
import { rng, hashSeed } from "./rng";
import type { Work } from "./content";

export type Frame = CanvasImageSource & { width: number; height: number };
export type Variant = "wall" | "full" | "poster";

// Public base URL for media (R2 public r2.dev URL now, cdn.otes.me later).
// Set NEXT_PUBLIC_MEDIA_BASE in .env / Vercel. Empty → everything is placeholder.
const BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE || "").replace(/\/+$/, "");

// Build the R2/CDN URL for a work variant. "" when no base is configured.
// Key convention: <discipline>/<id>/<variant>.webp
export function mediaUrl(discipline: string, id: string, variant: Variant): string {
  if (!BASE) return "";
  return `${BASE}/${discipline}/${id}/${variant}.webp`;
}

// Generative placeholder "photograph" in a discipline's palette — stands in for
// real media so every panel is filled from day one.
export function placeholder(
  seed: number,
  pal: [string, string],
  w = 260,
  h = 260
): HTMLCanvasElement {
  const r = rng(seed * 127 + 3);
  const [da, db] = pal;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, w * (0.3 + r()), h);
  gr.addColorStop(0, db);
  gr.addColorStop(1, da);
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
  const lx = w * (0.2 + r() * 0.6),
    ly = h * (0.2 + r() * 0.5);
  const rg = g.createRadialGradient(lx, ly, 0, lx, ly, Math.max(w, h) * (0.3 + r() * 0.35));
  rg.addColorStop(0, `rgba(255,246,228,${0.35 + r() * 0.4})`);
  rg.addColorStop(1, "rgba(255,246,228,0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = `rgba(0,0,0,${0.16 + r() * 0.2})`;
  if (r() > 0.5) {
    const hy = h * (0.55 + r() * 0.3);
    g.fillRect(0, hy, w, h - hy);
  } else {
    const n = 1 + ((r() * 3) | 0);
    for (let k = 0; k < n; k++) {
      g.beginPath();
      g.ellipse(w * (0.2 + r() * 0.6), h * (0.6 + r() * 0.25), w * 0.12, h * 0.22, 0, 0, 7);
      g.fill();
    }
  }
  const id = g.getImageData(0, 0, w, h),
    d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const nz = (r() - 0.5) * 22;
    d[i] += nz;
    d[i + 1] += nz;
    d[i + 2] += nz;
  }
  g.putImageData(id, 0, 0);
  return cv;
}

// Resolve a Work into a drawable frame.
// Priority: explicit work.src/poster override → R2 variant → generative placeholder.
// Never rejects: a missing/failed image falls back to placeholder so the wall
// stays complete while the bucket is filled piece by piece.
export function loadWork(
  work: Work,
  discipline: string,
  pal: [string, string],
  variant: Variant = "wall"
): Promise<Frame> {
  const seed = hashSeed(work.id);
  const explicit = work.type === "video" ? work.poster : work.src;
  const url =
    explicit ||
    mediaUrl(discipline, work.id, work.type === "video" ? "poster" : variant);
  if (!url) return Promise.resolve(placeholder(seed, pal) as Frame);
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    // R2 must send CORS headers allowing https://otes.me (see README) so the
    // canvas stays untainted; if they're missing the image simply falls back.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img as Frame);
    img.onerror = () => resolve(placeholder(seed, pal) as Frame);
    img.src = url;
  });
}
