// ============================================================================
// Export (§9). Render a slide to a 1080×1350 PNG on an offscreen canvas and
// download it. Because slides are FLAT (one background + a flat list of
// elements), export is a cheap, faithful re-draw of exactly what the Artboard
// shows — no DOM rasterization needed.
//
// Browser-only: every entry point is called from a click handler, so importing
// this module is SSR/build-safe (no top-level DOM access).
// ============================================================================
import { ARTBOARD_W, ARTBOARD_H } from "./model";
import { makeZip } from "./zip";

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    // Needed so the photo doesn't taint the canvas (toBlob would throw).
    // Unsplash/Pexels/Pixabay/picsum all send Access-Control-Allow-Origin: *.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// object-fit: cover, into the box (x,y,w,h).
function drawCover(ctx, img, x, y, w, h) {
  if (!img || !img.width || !img.height) return;
  const ir = img.width / img.height;
  const r = w / h;
  let sx, sy, sw, sh;
  if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// object-fit: contain, centered in the box.
function drawContain(ctx, img, x, y, w, h) {
  if (!img || !img.width || !img.height) return;
  const ir = img.width / img.height;
  const r = w / h;
  let dw, dh;
  if (ir > r) { dw = w; dh = w / ir; } else { dh = h; dw = h * ir; }
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth) {
  const lines = [];
  const paragraphs = String(text == null ? "" : text).split("\n");
  for (const para of paragraphs) {
    const tokens = para.split(/(\s+)/); // keep whitespace tokens for measuring
    let line = "";
    for (const tok of tokens) {
      const test = line + tok;
      if (ctx.measureText(test).width > maxWidth && line.trim()) {
        lines.push(line.replace(/\s+$/, ""));
        line = tok.replace(/^\s+/, "");
      } else {
        line = test;
      }
    }
    lines.push(line.replace(/\s+$/, ""));
  }
  return lines;
}

function drawText(ctx, el) {
  const weight = el.fontWeight || 400;
  const style = el.italic ? "italic " : "";
  ctx.font = style + weight + " " + (el.fontSize || 16) + "px " + (el.fontFamily || "Georgia, serif");
  ctx.fillStyle = el.color || "#ffffff";
  ctx.textBaseline = "top";
  const align = el.align || "left";
  ctx.textAlign = align;
  const supportsLS = "letterSpacing" in ctx;
  if (supportsLS) ctx.letterSpacing = (el.letterSpacing || 0) + "px";
  const lh = (el.lineHeight || 1.1) * (el.fontSize || 16);
  const x = align === "center" ? el.w / 2 : align === "right" ? el.w : 0;
  let y = 0;
  for (const line of wrapLines(ctx, el.content, el.w)) {
    ctx.fillText(line, x, y);
    y += lh;
  }
  if (supportsLS) ctx.letterSpacing = "0px";
}

export async function renderSlideToCanvas(slide) {
  const canvas = document.createElement("canvas");
  canvas.width = ARTBOARD_W;
  canvas.height = ARTBOARD_H;
  const ctx = canvas.getContext("2d");
  const bg = (slide && slide.background) || {};

  // Background: solid base, then (if any) one photo + one scrim — FLAT-LAYERS §3.
  ctx.fillStyle = bg.color || "#0c0c0c";
  ctx.fillRect(0, 0, ARTBOARD_W, ARTBOARD_H);
  if (bg.type === "image" && bg.src) {
    const img = await loadImage(bg.src);
    if (img) drawCover(ctx, img, 0, 0, ARTBOARD_W, ARTBOARD_H);
    if (bg.scrim) {
      ctx.fillStyle = "rgba(0,0,0," + bg.scrim + ")";
      ctx.fillRect(0, 0, ARTBOARD_W, ARTBOARD_H);
    }
  }

  for (const el of (slide.elements || [])) {
    ctx.save();
    ctx.globalAlpha = el.opacity == null ? 1 : el.opacity;
    // rotate about the element's center (matches the Artboard's CSS transform)
    const cx = el.x + el.w / 2;
    const cy = el.y + el.h / 2;
    ctx.translate(cx, cy);
    if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
    ctx.translate(el.x, el.y); // local origin = element top-left

    if (el.type === "rect") {
      roundRectPath(ctx, 0, 0, el.w, el.h, el.radius);
      ctx.fillStyle = el.fill || "#ffffff";
      ctx.fill();
      if (el.stroke && el.stroke !== "none") {
        ctx.lineWidth = el.strokeWidth || 1;
        ctx.strokeStyle = el.stroke;
        ctx.stroke();
      }
    } else if (el.type === "line") {
      ctx.fillStyle = el.fill || "#ffffff";
      ctx.fillRect(0, 0, el.w, el.h);
    } else if (el.type === "image" && el.src) {
      const img = await loadImage(el.src);
      if (img) {
        ctx.save();
        roundRectPath(ctx, 0, 0, el.w, el.h, el.radius);
        ctx.clip();
        if ((el.fit || "cover") === "contain") drawContain(ctx, img, 0, 0, el.w, el.h);
        else drawCover(ctx, img, 0, 0, el.w, el.h);
        ctx.restore();
      }
    } else if (el.type === "text") {
      drawText(ctx, el);
    }
    ctx.restore();
  }
  return canvas;
}

// Canvas → PNG bytes. Resolves null if the canvas is tainted (a photo loaded
// without CORS makes toBlob throw SecurityError) or encoding otherwise fails.
function canvasToPngBytes(canvas) {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) { resolve(null); return; }
        blob.arrayBuffer().then(
          (buf) => resolve(new Uint8Array(buf)),
          () => resolve(null),
        );
      }, "image/png");
    } catch (e) {
      resolve(null);
    }
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadCanvas(canvas, filename) {
  const bytes = await canvasToPngBytes(canvas);
  if (!bytes) return false;
  downloadBlob(new Blob([bytes], { type: "image/png" }), filename);
  return true;
}

function slug(name) {
  return (String(name || "loathr").trim().toLowerCase().replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "")) || "loathr";
}

export async function exportSlide(slide, name, index) {
  const canvas = await renderSlideToCanvas(slide);
  return downloadCanvas(canvas, slug(name) + "-" + ((index || 0) + 1) + ".png");
}

// Render every slide to a PNG and deliver them as ONE .zip — a single download
// the browser won't throttle or drop (unlike N sequential saves). Tainted
// slides are skipped; the rest still ship. Returns the count actually zipped.
export async function exportSlides(slides, name) {
  const base = slug(name);
  const files = [];
  for (let i = 0; i < slides.length; i++) {
    const canvas = await renderSlideToCanvas(slides[i]);
    const bytes = await canvasToPngBytes(canvas);
    if (bytes) files.push({ name: base + "-" + (i + 1) + ".png", data: bytes });
  }
  if (files.length === 0) return 0;
  downloadBlob(makeZip(files), base + ".zip");
  return files.length;
}
