// Fit-to-text for shaped text (the toolbar's "Fit" button). Measures the copy at
// its current font with a scratch 2D canvas and returns a { w, h } that shrink-
// wraps the shape around the text + its shape padding. Browser-only (uses canvas
// measureText) — only ever called from a click handler, so importing is SSR-safe.
import { shapePad } from "./shapes";
import { wrapLines } from "./export";

let _ctx = null;
function ctx2d() {
  if (!_ctx) _ctx = document.createElement("canvas").getContext("2d");
  return _ctx;
}

// Fit a shaped text element to its content. `maxW` caps the width (defaults to the
// element's current width) so long copy wraps instead of running off the slide.
export function fitShapeBox(el, maxW) {
  const ctx = ctx2d();
  const fs = el.fontSize || 32;
  const weight = el.fontWeight || 700;
  const fstyle = el.italic ? "italic " : "";
  ctx.font = fstyle + weight + " " + fs + "px " + (el.fontFamily || "Helvetica, Arial, sans-serif");
  const supportsLS = "letterSpacing" in ctx;
  if (supportsLS) ctx.letterSpacing = (el.letterSpacing || 0) + "px";

  const pad = shapePad(el);
  const cap = Math.max(80, (maxW || el.w || 360));
  const innerMax = Math.max(40, cap - pad.left - pad.right);
  const lines = wrapLines(ctx, el.content, innerMax);
  let longest = 0;
  for (const ln of lines) longest = Math.max(longest, ctx.measureText(ln).width);
  if (supportsLS) ctx.letterSpacing = "0px";

  const lh = (el.lineHeight || 1.12) * fs;
  let w = Math.ceil(longest) + pad.left + pad.right;
  let h = Math.ceil(lines.length * lh) + pad.top + pad.bottom;
  // The burst star reads best roughly square.
  if (el.shape === "burst") { const d = Math.max(w, h); w = d; h = d; }
  return { w: Math.max(60, Math.round(w)), h: Math.max(48, Math.round(h)) };
}
