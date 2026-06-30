// ============================================================================
// Export (§9). Render a slide to a 1080×1350 PNG on an offscreen canvas and
// download it. Because slides are FLAT (one background + a flat list of
// elements), export is a cheap, faithful re-draw of exactly what the Artboard
// shows — no DOM rasterization needed.
//
// Browser-only: every entry point is called from a click handler, so importing
// this module is SSR/build-safe (no top-level DOM access).
// ============================================================================
import { ARTBOARD_W, ARTBOARD_H, styledRuns, isUniformText } from "./model";
import { makeZip } from "./zip";
import {
  shapePaint, shapeRadius, shapeBorderW, shapePad, tagNotch, speechTail,
  noteEar, hexA, shapeAccentColor, shapeTailColor,
  BURST_POINTS, BANNER_RULE, SHAPE_PAPER_EAR,
} from "./shapes";

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

export function wrapLines(ctx, text, maxWidth) {
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
  const fs = el.fontSize || 16;
  ctx.font = style + weight + " " + fs + "px " + (el.fontFamily || "Georgia, serif");
  ctx.fillStyle = el.color || "#ffffff";
  ctx.textBaseline = "top";
  const align = el.align || "left";
  ctx.textAlign = align;
  const supportsLS = "letterSpacing" in ctx;
  if (supportsLS) ctx.letterSpacing = (el.letterSpacing || 0) + "px";
  const lh = (el.lineHeight || 1.1) * fs;
  const x = align === "center" ? el.w / 2 : align === "right" ? el.w : 0;
  let y = 0;
  for (const line of wrapLines(ctx, el.content, el.w)) {
    ctx.fillText(line, x, y);
    // Strikethrough (e.g. the editorial cover wordmark): a manual rule through the
    // line's measured width, mirroring CSS line-through in the DOM renderers.
    if (el.strike) {
      const tw = ctx.measureText(line).width;
      const sx = align === "center" ? (el.w - tw) / 2 : align === "right" ? el.w - tw : 0;
      const th = Math.max(2, fs * 0.09);
      const prev = ctx.fillStyle;
      ctx.fillStyle = el.strikeColor || el.color || "#ffffff";
      ctx.fillRect(sx, y + fs * 0.38 - th / 2, tw, th);
      ctx.fillStyle = prev;
    }
    y += lh;
  }
  if (supportsLS) ctx.letterSpacing = "0px";
}

// Word-wrap a list of style-carrying runs into lines of tagged tokens, honoring
// explicit "\n" and trimming whitespace at line edges. Each token carries its
// run's full style (color/fontWeight/italic/strike/bg/stroke). When `fontOf` is
// given, the ctx font is set per token before measuring (a run may be bold/italic
// independently), so a mixed-weight line wraps correctly; otherwise it measures
// with the ctx's current font (the plain caller).
export function wrapRuns(ctx, runs, maxWidth, fontOf) {
  const tokens = [];
  for (const run of runs) {
    const style = {};
    for (const k in run) if (k !== "text") style[k] = run[k];
    for (const part of String(run.text).split(/(\s+)/)) {
      if (part === "") continue;
      if (part.indexOf("\n") >= 0) {
        const segs = part.split("\n");
        for (let i = 0; i < segs.length; i++) {
          if (segs[i]) tokens.push(Object.assign({ text: segs[i] }, style));
          if (i < segs.length - 1) tokens.push({ nl: true });
        }
      } else {
        tokens.push(Object.assign({ text: part }, style));
      }
    }
  }
  const lines = [];
  let line = [], width = 0;
  const flush = () => { lines.push(line); line = []; width = 0; };
  for (const tok of tokens) {
    if (tok.nl) { flush(); continue; }
    if (fontOf) ctx.font = fontOf(tok);
    const w = ctx.measureText(tok.text).width;
    const isSpace = /^\s+$/.test(tok.text);
    if (!isSpace && width + w > maxWidth && line.some((t) => t.text && t.text.trim())) flush();
    line.push(tok); width += w;
  }
  flush();
  return lines.map((ln) => {
    let a = 0, b = ln.length;
    while (a < b && /^\s+$/.test(ln[a].text)) a++;
    while (b > a && /^\s+$/.test(ln[b - 1].text)) b--;
    return ln.slice(a, b);
  });
}

// Draw pre-wrapped lines of style-carrying tokens into the box [boxLeft, boxW]
// starting at startY — per-token colour, weight, italic, strike, background
// marker, and outline (stroke). Tokens are left-positioned by measured width so
// center/right alignment works across mixed-width runs. Shared by drawRichText
// (top-aligned, full width) and drawShapedText (padded, vertically centred), so
// the PNG matches the DOM RichText render for plain AND shaped text.
// `lhFactor` is the unitless line-height (not an absolute px). Each line's height
// derives from its LARGEST token's fontSize (B3 per-span size), and smaller tokens
// are baseline-aligned within the line (mirroring the DOM, which aligns baselines,
// not tops). With a uniform size this is identical to the old behaviour.
function drawTokenLines(ctx, lines, fs, fontOf, lhFactor, align, boxLeft, boxW, startY) {
  let y = startY;
  for (const line of lines) {
    const lineFs = line.reduce((m, t) => Math.max(m, t.fontSize || fs), 0) || fs;
    const lineLH = lineFs * lhFactor;
    let lineW = 0;
    for (const t of line) { ctx.font = fontOf(t); lineW += ctx.measureText(t.text).width; }
    let x = boxLeft + (align === "center" ? (boxW - lineW) / 2 : align === "right" ? boxW - lineW : 0);
    for (const tok of line) {
      const tokFs = tok.fontSize || fs;
      const pad = Math.round(tokFs * 0.1);
      const ty = y + (lineFs - tokFs) * 0.8; // shift smaller tokens down so baselines line up
      ctx.font = fontOf(tok);
      const w = ctx.measureText(tok.text).width;
      if (tok.bg) { ctx.fillStyle = tok.bg; ctx.fillRect(x - pad, y, w + pad * 2, lineLH); }
      if (tok.stroke && tok.strokeWidth) {
        ctx.lineWidth = tok.strokeWidth;
        ctx.strokeStyle = tok.stroke;
        ctx.lineJoin = "round";
        ctx.strokeText(tok.text, x, ty);
      }
      ctx.fillStyle = tok.color || "#ffffff";
      ctx.fillText(tok.text, x, ty);
      if (tok.strike) {
        const th = Math.max(2, tokFs * 0.09);
        ctx.fillStyle = tok.strikeColor || tok.color || "#ffffff";
        ctx.fillRect(x, ty + tokFs * 0.38 - th / 2, w, th);
      }
      x += w;
    }
    y += lineLH;
  }
}

// Total height of wrapped lines, each line sized by its largest token (for shaped
// vertical centring with mixed per-span sizes).
function linesHeight(lines, fs, lhFactor) {
  return lines.reduce((sum, line) => sum + (line.reduce((m, t) => Math.max(m, t.fontSize || fs), 0) || fs) * lhFactor, 0);
}

// Draw a (non-shaped) text element as styled RUNS. The general path mirroring the
// DOM RichText render; used for any non-uniform text (runs, the highlight marker,
// or an element-wide background/outline).
export function drawRichText(ctx, el) {
  const fs = el.fontSize || 16;
  const fam = el.fontFamily || "Georgia, serif";
  const fontOf = (t) => (t.italic ? "italic " : "") + (t.fontWeight || 400) + " " + (t.fontSize || fs) + "px " + fam;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  const supportsLS = "letterSpacing" in ctx;
  if (supportsLS) ctx.letterSpacing = (el.letterSpacing || 0) + "px";
  const lhFactor = el.lineHeight || 1.1;
  const lines = wrapRuns(ctx, styledRuns(el), el.w, fontOf);
  drawTokenLines(ctx, lines, fs, fontOf, lhFactor, el.align || "left", 0, el.w, 0);
  if (supportsLS) ctx.letterSpacing = "0px";
}

function burstPath(ctx, w, h) {
  ctx.beginPath();
  for (let i = 0; i < BURST_POINTS.length; i++) {
    const x = (BURST_POINTS[i][0] / 100) * w;
    const y = (BURST_POINTS[i][1] / 100) * h;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function tagPath(ctx, w, h, notch) {
  ctx.beginPath();
  ctx.moveTo(notch, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, h);
  ctx.lineTo(notch, h);
  ctx.lineTo(0, h / 2);
  ctx.closePath();
}

// Draw a text element's SHAPE backing (local origin already at its top-left).
// Shape only — the text is drawn on top by drawShapedText. Mirrors the CSS in
// ShapeBacking.jsx off the same geometry helpers so the PNG matches the canvas.
function drawShapeBacking(ctx, el) {
  const p = shapePaint(el);
  const variant = el.shape || "speech";
  const w = el.w, h = el.h;
  const radius = shapeRadius(el);
  const bw = shapeBorderW(el);

  if (variant === "burst") {
    burstPath(ctx, w, h);
    ctx.fillStyle = p.bg;
    ctx.fill();
  } else if (variant === "tag") {
    const notch = tagNotch(el);
    tagPath(ctx, w, h, notch);
    ctx.fillStyle = p.bg;
    ctx.fill();
    if (p.border && p.border !== "none") {
      ctx.lineWidth = bw;
      ctx.strokeStyle = p.border;
      ctx.stroke();
    }
  } else {
    if (variant === "cloud") { // soft accent glow ring behind
      roundRectPath(ctx, -4, -4, w + 8, h + 8, radius + 4);
      ctx.fillStyle = hexA(shapeAccentColor(el), 0.1);
      ctx.fill();
    }
    roundRectPath(ctx, 0, 0, w, h, radius);
    if (p.bg && p.bg !== "transparent") {
      ctx.fillStyle = p.bg;
      ctx.fill();
    }
    if (p.border && p.border !== "none") {
      ctx.lineWidth = bw;
      ctx.strokeStyle = p.border;
      if (p.dashed && ctx.setLineDash) ctx.setLineDash([14, 9]);
      ctx.stroke();
      if (ctx.setLineDash) ctx.setLineDash([]);
    }
    if (variant === "banner") {
      ctx.fillStyle = p.rule || el.shapeFill || "#e23744";
      ctx.fillRect(0, 0, w, BANNER_RULE);
      ctx.fillRect(0, h - BANNER_RULE, w, BANNER_RULE);
    }
  }

  if (variant === "speech") {
    const t = speechTail(el);
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(t.x + t.w, t.y);
    ctx.lineTo(t.x + t.w / 2, t.y + t.h);
    ctx.closePath();
    ctx.fillStyle = shapeTailColor(el);
    ctx.fill();
  } else if (variant === "note") {
    const e = noteEar(el);
    ctx.beginPath();
    ctx.moveTo(w - e, h);
    ctx.lineTo(w, h);
    ctx.lineTo(w, h - e);
    ctx.closePath();
    ctx.fillStyle = SHAPE_PAPER_EAR;
    ctx.fill();
  }
}

// Draw a shaped text element's copy: styled RUNS wrapped within the shape padding
// and vertically centered in the box (mirrors the flex-centered RichText layer in
// the DOM renderers). Run-aware, so a coloured/bold/struck word inside a bubble
// exports exactly as it shows on the canvas. Used only when el.shape is set.
function drawShapedText(ctx, el) {
  const pad = shapePad(el);
  const innerW = Math.max(1, el.w - pad.left - pad.right);
  const fs = el.fontSize || 16;
  const fam = el.fontFamily || "Georgia, serif";
  const fontOf = (t) => (t.italic ? "italic " : "") + (t.fontWeight || 400) + " " + (t.fontSize || fs) + "px " + fam;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  const supportsLS = "letterSpacing" in ctx;
  if (supportsLS) ctx.letterSpacing = (el.letterSpacing || 0) + "px";
  const lhFactor = el.lineHeight || 1.12;
  const lines = wrapRuns(ctx, styledRuns(el), innerW, fontOf);
  const totalH = linesHeight(lines, fs, lhFactor);
  const innerH = el.h - pad.top - pad.bottom;
  const slack = Math.max(0, innerH - totalH);
  // Match the DOM's vertical alignment (shapeVAlign): top / middle / bottom.
  const startY = pad.top + (el.vAlign === "top" ? 0 : el.vAlign === "bottom" ? slack : slack / 2);
  drawTokenLines(ctx, lines, fs, fontOf, lhFactor, el.align || "left", pad.left, innerW, startY);
  if (supportsLS) ctx.letterSpacing = "0px";
}

export async function renderSlideToCanvas(slide) {
  const canvas = document.createElement("canvas");
  canvas.width = ARTBOARD_W;
  canvas.height = ARTBOARD_H;
  const ctx = canvas.getContext("2d");
  // Ensure web fonts (Courier Prime + the display faces) are loaded before we
  // rasterize, otherwise canvas silently falls back to a system font in the PNG.
  if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) { /* ignore */ }
  }
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
      // A "none"/absent fill is transparent (the movable frame is a stroked box) —
      // skip the fill so we don't paint a solid block with a stale colour.
      if (el.fill && el.fill !== "none") {
        ctx.fillStyle = el.fill;
        ctx.fill();
      }
      if (el.stroke && el.stroke !== "none") {
        ctx.lineWidth = el.strokeWidth || 1;
        ctx.strokeStyle = el.stroke;
        if (el.dash === "dashed") ctx.setLineDash([(el.strokeWidth || 1) * 2.5, (el.strokeWidth || 1) * 2]);
        else if (el.dash === "dotted") ctx.setLineDash([el.strokeWidth || 1, (el.strokeWidth || 1) * 1.6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (el.type === "line") {
      if (el.dash && el.dash !== "solid") {
        ctx.strokeStyle = el.fill || "#ffffff";
        ctx.lineWidth = el.h;
        ctx.lineCap = el.dash === "dotted" ? "round" : "butt";
        ctx.setLineDash(el.dash === "dotted" ? [0.1, el.h * 1.8] : [el.h * 2.4, el.h * 1.8]);
        ctx.beginPath();
        ctx.moveTo(0, el.h / 2);
        ctx.lineTo(el.w, el.h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineCap = "butt";
      } else {
        ctx.fillStyle = el.fill || "#ffffff";
        ctx.fillRect(0, 0, el.w, el.h);
      }
    } else if (el.type === "image" && el.src) {
      const img = await loadImage(el.src);
      if (img) {
        ctx.save();
        roundRectPath(ctx, 0, 0, el.w, el.h, el.radius);
        ctx.clip();
        if (el.mono) ctx.filter = "grayscale(1)";
        if (el.flipX || el.flipY) { // flip about the element box
          ctx.translate(el.flipX ? el.w : 0, el.flipY ? el.h : 0);
          ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
        }
        if ((el.fit || "cover") === "contain") drawContain(ctx, img, 0, 0, el.w, el.h);
        else drawCover(ctx, img, 0, 0, el.w, el.h);
        ctx.restore();
      }
    } else if (el.type === "text") {
      if (el.shape) { drawShapeBacking(ctx, el); drawShapedText(ctx, el); }
      else if (isUniformText(el)) drawText(ctx, el);
      else drawRichText(ctx, el);
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
export async function exportSlides(slides, name, caption) {
  const base = slug(name);
  const files = [];
  for (let i = 0; i < slides.length; i++) {
    const canvas = await renderSlideToCanvas(slides[i]);
    const bytes = await canvasToPngBytes(canvas);
    if (bytes) files.push({ name: base + "-" + (i + 1) + ".png", data: bytes });
  }
  if (files.length === 0) return 0;
  // Drop the Instagram caption beside the slides as caption.txt (UTF-8).
  if (caption && String(caption).trim()) {
    files.push({ name: base + "-caption.txt", data: new TextEncoder().encode(String(caption)) });
  }
  downloadBlob(makeZip(files), base + ".zip");
  return files.length;
}
