// ============================================================================
// Export a slide to a PNG at full artboard resolution (§9). Because slides are
// flat — one background + a list of positioned elements, no stacked compositing
// — drawing to a 2D canvas is direct and faithful. Pure-ish: touches the DOM
// only via an offscreen <canvas> and Image loads.
// ============================================================================
import { ARTBOARD_W, ARTBOARD_H } from "./model";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

// Draw `img` to cover the whole artboard (object-fit: cover).
function drawCover(ctx, img, W, H) {
  const ir = img.width / img.height;
  const ar = W / H;
  let dw, dh;
  if (ir > ar) { dh = H; dw = H * ir; } else { dw = W; dh = W / ir; }
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

function wrapLines(ctx, text, maxWidth) {
  const out = [];
  String(text == null ? "" : text).split("\n").forEach((para) => {
    const words = para.split(/\s+/);
    let line = "";
    words.forEach((word) => {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    out.push(line);
  });
  return out;
}

function drawText(ctx, el) {
  ctx.save();
  ctx.globalAlpha = el.opacity == null ? 1 : el.opacity;
  const cx = el.x + el.w / 2;
  const cy = el.y + el.h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(((el.rotation || 0) * Math.PI) / 180);
  ctx.translate(-el.w / 2, -el.h / 2);
  ctx.fillStyle = el.color || "#fff";
  ctx.textBaseline = "top";
  ctx.font =
    (el.italic ? "italic " : "") +
    (el.fontWeight || 400) + " " +
    (el.fontSize || 32) + "px " + (el.fontFamily || "Georgia, serif");
  const lh = (el.fontSize || 32) * (el.lineHeight || 1.2);
  const lines = wrapLines(ctx, el.content, el.w);
  const align = el.align || "left";
  ctx.textAlign = align === "center" ? "center" : align === "right" ? "right" : "left";
  const ax = align === "center" ? el.w / 2 : align === "right" ? el.w : 0;
  lines.forEach((ln, i) => ctx.fillText(ln, ax, i * lh));
  ctx.restore();
}

function drawRect(ctx, el) {
  ctx.save();
  ctx.globalAlpha = el.opacity == null ? 1 : el.opacity;
  const cx = el.x + el.w / 2;
  const cy = el.y + el.h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(((el.rotation || 0) * Math.PI) / 180);
  ctx.fillStyle = el.fill || "#fff";
  ctx.fillRect(-el.w / 2, -el.h / 2, el.w, el.h);
  ctx.restore();
}

export async function renderSlideToCanvas(slide) {
  const W = ARTBOARD_W, H = ARTBOARD_H;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const bg = slide.background || {};

  ctx.fillStyle = bg.color || "#0c0c0c";
  ctx.fillRect(0, 0, W, H);

  if (bg.type === "image" && bg.src) {
    try {
      const img = await loadImage(bg.src);
      drawCover(ctx, img, W, H);
    } catch (_) { /* leave the solid background */ }
    if (bg.scrim) {
      ctx.fillStyle = "rgba(0,0,0," + bg.scrim + ")";
      ctx.fillRect(0, 0, W, H);
    }
  }

  for (const el of slide.elements || []) {
    if (el.type === "text") drawText(ctx, el);
    else if (el.type === "rect" || el.type === "line") drawRect(ctx, el);
    else if (el.type === "image" && el.src) {
      try {
        const img = await loadImage(el.src);
        ctx.save();
        ctx.globalAlpha = el.opacity == null ? 1 : el.opacity;
        ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
        ctx.rotate(((el.rotation || 0) * Math.PI) / 180);
        ctx.drawImage(img, -el.w / 2, -el.h / 2, el.w, el.h);
        ctx.restore();
      } catch (_) { /* skip */ }
    }
  }
  return canvas;
}

function triggerDownload(canvas, filename) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("export failed (image may be cross-origin)")); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, "image/png");
  });
}

export async function exportSlide(slide, index) {
  const canvas = await renderSlideToCanvas(slide);
  await triggerDownload(canvas, "loathr-slide-" + String((index || 0) + 1).padStart(2, "0") + ".png");
}

export async function exportAll(slides) {
  for (let i = 0; i < slides.length; i++) {
    const canvas = await renderSlideToCanvas(slides[i]);
    await triggerDownload(canvas, "loathr-slide-" + String(i + 1).padStart(2, "0") + ".png");
    await new Promise((r) => setTimeout(r, 150)); // let each download start
  }
}
