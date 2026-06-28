// ============================================================================
// Text shapes — bubble / banner / tag / burst backings a TEXT element wears.
//
// A shape is NOT its own element: it's a backing on a normal text element
// (`el.shape` = a variant id). The copy stays a real, fully-editable text box
// (double-click to edit, multi-line, every type control); the shape sits behind
// it, fits it, and themes with it. Drop a shape as fresh editable text, or wrap
// any existing text — even an AI-generated headline — in one.
//
// This module is PURE (no React, no DOM) and is the single geometry/paint truth
// shared by all three renderers — the live canvas (Element.jsx via ShapeBacking),
// the thumb/preview (StaticSlide.jsx) and the PNG export (export.js) — so a
// shape looks identical live, in the strip, and in the exported image.
//
// Fields a shaped text element carries: `shape` (variant id), `shapeFill` (the
// accent/shape color), `tailSide` (speech only), `priorColor` (the text color
// stashed when a knockout/paper variant overrode it, restored on removal).
// Vector + text only, so a shape never touches the image-decode path (§3).
// ============================================================================

// Dark plate behind outline / banner / tag shapes so light text reads on any
// background. Slightly translucent, like the old callouts.
export const SHAPE_BACKING = "rgba(12,12,14,0.9)";

// Paper-note palette (the one variant that is light, not accent-driven).
export const SHAPE_PAPER = "#f3efe2";
export const SHAPE_PAPER_INK = "#1a1a1a";
export const SHAPE_PAPER_EAR = "#d8d2c0";

// Thickness (px, artboard units) of the banner's top/bottom rules.
export const BANNER_RULE = 4;

// The 16-point seal/burst star in a 0..100 box (percentages). Shared verbatim by
// the CSS clip-path and the canvas polygon so the silhouette matches exactly.
export const BURST_POINTS = [
  [50, 0], [61, 20], [83, 12], [79, 35], [100, 50], [79, 65],
  [83, 88], [61, 80], [50, 100], [39, 80], [17, 88], [21, 65],
  [0, 50], [21, 35], [17, 12], [39, 20],
];

// The eight shapes + their drop defaults (size, font, sample text, tilt). Used
// by the Elements-panel grid (swatches) and the fresh-drop / fit-to-text paths.
// `knockout` = dark text on an accent fill; `paper` = the light note; `spacing`
// = letter-spacing.
export const SHAPE_VARIANTS = [
  { id: "speech", label: "Speech", text: "Hot take",     w: 360, h: 150, font: "Helvetica, Arial, sans-serif",        size: 38 },
  { id: "cloud",  label: "Cloud",  text: "a thought…",   w: 360, h: 160, font: "Helvetica, Arial, sans-serif",        size: 36 },
  { id: "stamp",  label: "Stamp",  text: "VERIFIED",     w: 300, h: 110, font: "'Courier Prime', 'Courier New', monospace", size: 34, spacing: 3, rotation: -4 },
  { id: "banner", label: "Banner", text: "Breaking",     w: 380, h: 110, font: "Georgia, serif",                      size: 40 },
  { id: "burst",  label: "Burst",  text: "NEW",          w: 200, h: 200, font: "'Courier Prime', 'Courier New', monospace", size: 36, knockout: true },
  { id: "tag",    label: "Tag",    text: "#1",           w: 240, h: 104, font: "'Courier Prime', 'Courier New', monospace", size: 36, spacing: 1 },
  { id: "pill",   label: "Pill",   text: "SAVE",         w: 240, h: 92,  font: "'Courier Prime', 'Courier New', monospace", size: 34, spacing: 3, knockout: true },
  { id: "note",   label: "Note",   text: "note to self", w: 280, h: 160, font: "Georgia, serif",                      size: 36, rotation: 2.5, paper: true },
];

export function shapeVariant(id) {
  return SHAPE_VARIANTS.find((v) => v.id === id) || SHAPE_VARIANTS[0];
}

// Does this element wear a shape backing?
export function hasShape(el) { return !!el && el.type === "text" && !!el.shape; }

// Corner radius (px) by shape. Pill is fully rounded; burst/tag/banner/note are
// square (their character comes from the clip / rules / ear).
export function shapeRadius(el) {
  switch (el.shape) {
    case "pill":   return Math.min(el.w, el.h) / 2;
    case "cloud":  return 22;
    case "speech": return 14;
    case "stamp":  return 8;
    default:       return 0;
  }
}

// How `shapeFill` (the accent) paints a shape. Always:
//   bg     — the box background ("transparent" / a dark plate / the fill)
//   border — outline color, or "none"
//   dashed — true for the stamp's dashed rule
//   rule   — banner top/bottom rule color (no full border)
// The TEXT color is the element's own `color`, drawn separately by the text path.
export function shapePaint(el) {
  const fill = el.shapeFill || "#e23744";
  switch (el.shape) {
    case "burst":
    case "pill":   return { bg: fill, border: "none" };
    case "note":   return { bg: fill || SHAPE_PAPER, border: "none" };
    case "banner": return { bg: SHAPE_BACKING, border: "none", rule: fill };
    case "stamp":  return { bg: "transparent", border: fill, dashed: true };
    case "tag":
    case "speech":
    case "cloud":
    default:       return { bg: SHAPE_BACKING, border: fill };
  }
}

// Border thickness (px) by shape; 0 for the filled / ruled / paper ones.
export function shapeBorderW(el) {
  switch (el.shape) {
    case "stamp":  return 3;
    case "speech": return 3;
    case "tag":    return 3;
    case "cloud":  return 2;
    default:       return 0;
  }
}

// Inner padding (px) that insets the text from the shape's edges, per shape.
// Speech/banner/etc. keep the text off the border; tag clears the left point;
// pill clears the rounded ends; burst keeps the text inside the star's safe core.
export function shapePad(el) {
  const h = el.h || 100, w = el.w || 100;
  const box = (v, hz) => ({ top: v, right: hz, bottom: v, left: hz });
  switch (el.shape) {
    case "pill":   return box(Math.round(h * 0.16), Math.round(h * 0.5));
    case "burst": { const p = Math.round(Math.min(w, h) * 0.24); return { top: p, right: p, bottom: p, left: p }; }
    case "tag":    return { top: 18, right: 26, bottom: 18, left: tagNotch(el) + 24 };
    case "banner": return box(18, 30);
    case "stamp":  return box(16, 26);
    case "note":   return box(24, 28);
    case "cloud":  return box(22, 32);
    case "speech":
    default:       return box(22, 30);
  }
}

// Tag left-notch depth (px) — how far the point juts out at mid-height.
export function tagNotch(el) {
  return Math.max(8, Math.round(Math.min(el.h * 0.34, 30)));
}

// Speech tail geometry in element-local coords: a triangle that hangs below the
// bottom edge, on the chosen side. {x,w} along the bottom, {y} = bottom edge,
// {h} = how far it drops.
export function speechTail(el) {
  const w = Math.max(22, Math.round(el.w * 0.085));
  const h = Math.round(w * 0.72);
  const side = el.tailSide || "left";
  let x;
  if (side === "right") x = el.w - w - Math.round(el.w * 0.12);
  else if (side === "center") x = Math.round((el.w - w) / 2);
  else x = Math.round(el.w * 0.12);
  return { x, y: el.h, w, h };
}

// Note dog-ear size (px) at the bottom-right corner.
export function noteEar(el) { return Math.max(8, Math.round(Math.min(el.w, el.h) * 0.16)); }

// #rrggbb -> rgba() at alpha `a` (for the cloud's soft accent glow). Falls back
// to the brand red if the input isn't a 6-digit hex.
export function hexA(hex, a) {
  if (typeof hex !== "string" || !/^#[0-9a-f]{6}$/i.test(hex)) return "rgba(226,55,68," + a + ")";
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}
