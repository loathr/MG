// ============================================================================
// Bubbles & stickers — a callout element type ported from the old monolith, but
// restyled RESTRAINED & ON-BRAND (thin accent rules, brand fonts) rather than
// clip-art. A sticker is a normal element: drag / resize / rotate / recolor /
// set the tail side. Only its SHAPE and how `fill`/`color` paint it vary by
// `variant`. Vector + text only, so it stacks freely and never touches the
// image-decode path (FLAT-LAYERS §3).
//
// This module is PURE (no React, no DOM) and is the single geometry/paint truth
// shared by all three renderers — the live canvas (Element.jsx), the thumb/
// preview (StaticSlide.jsx) and the PNG export (export.js) — so a sticker looks
// identical live, in the strip, and in the exported image.
// ============================================================================

// Dark plate behind outline / banner / tag text so light text reads on any
// background. Slightly translucent, like the old callouts.
export const STICKER_BACKING = "rgba(12,12,14,0.9)";

// Paper-note palette (the one variant that is light, not accent-driven).
export const STICKER_PAPER = "#f3efe2";
export const STICKER_PAPER_INK = "#1a1a1a";
export const STICKER_PAPER_EAR = "#d8d2c0";

// Thickness (px, artboard units) of the banner's top/bottom rules.
export const BANNER_RULE = 4;

// The 16-point seal/burst star in a 0..100 box (percentages). Shared verbatim by
// the CSS clip-path and the canvas polygon so the silhouette matches exactly.
export const BURST_POINTS = [
  [50, 0], [61, 20], [83, 12], [79, 35], [100, 50], [79, 65],
  [83, 88], [61, 80], [50, 100], [39, 80], [17, 88], [21, 65],
  [0, 50], [21, 35], [17, 12], [39, 20],
];

// The eight variants + their drop defaults (size, font, sample text, tilt). Used
// by the Elements-panel grid (swatches) and addSticker. `knockout` = dark text
// on an accent fill; `paper` = the light note; `spacing` = letter-spacing.
export const STICKER_VARIANTS = [
  { id: "speech", label: "Speech", text: "Hot take",     w: 320, h: 124, font: "Helvetica, Arial, sans-serif",        size: 34 },
  { id: "cloud",  label: "Cloud",  text: "a thought…",   w: 320, h: 134, font: "Helvetica, Arial, sans-serif",        size: 32 },
  { id: "stamp",  label: "Stamp",  text: "VERIFIED",     w: 252, h: 98,  font: "'Courier Prime', 'Courier New', monospace", size: 30, spacing: 3, rotation: -4 },
  { id: "banner", label: "Banner", text: "Breaking",     w: 360, h: 96,  font: "Georgia, serif",                      size: 36 },
  { id: "burst",  label: "Burst",  text: "NEW",          w: 168, h: 168, font: "'Courier Prime', 'Courier New', monospace", size: 32, knockout: true },
  { id: "tag",    label: "Tag",    text: "#1",           w: 204, h: 88,  font: "'Courier Prime', 'Courier New', monospace", size: 32, spacing: 1 },
  { id: "pill",   label: "Pill",   text: "SAVE",         w: 204, h: 76,  font: "'Courier Prime', 'Courier New', monospace", size: 30, spacing: 3, knockout: true },
  { id: "note",   label: "Note",   text: "note to self", w: 232, h: 134, font: "Georgia, serif",                      size: 32, rotation: 2.5, paper: true },
];

export function stickerVariant(id) {
  return STICKER_VARIANTS.find((v) => v.id === id) || STICKER_VARIANTS[0];
}

export function isSticker(el) { return !!el && el.type === "sticker"; }

// Corner radius (px) by variant. Pill is fully rounded; burst/tag/banner/note
// are square (their character comes from the clip / rules / ear).
export function stickerRadius(el) {
  switch (el.variant) {
    case "pill":   return Math.min(el.w, el.h) / 2;
    case "cloud":  return 20;
    case "speech": return 12;
    case "stamp":  return 7;
    default:       return 0;
  }
}

// How `fill` (the accent) and `color` (the text) paint a variant. Always:
//   bg     — the box background ("transparent" / a dark plate / the fill)
//   text   — text color (= el.color)
//   border — outline color, or "none"
//   dashed — true for the stamp's dashed rule
//   rule   — banner top/bottom rule color (no full border)
// el.fill and el.color keep ONE meaning across variants — "shape color" and
// "text color" — so the toolbar's two color chips behave the same everywhere.
export function stickerPaint(el) {
  const fill = el.fill || "#e23744";
  const text = el.color || "#ffffff";
  switch (el.variant) {
    case "burst":
    case "pill":   return { bg: fill, text, border: "none" };
    case "note":   return { bg: fill || STICKER_PAPER, text, border: "none" };
    case "banner": return { bg: STICKER_BACKING, text, border: "none", rule: fill };
    case "stamp":  return { bg: "transparent", text, border: fill, dashed: true };
    case "tag":
    case "speech":
    case "cloud":
    default:       return { bg: STICKER_BACKING, text, border: fill };
  }
}

// Border thickness (px) by variant; 0 for the filled / ruled / paper ones.
export function stickerBorderW(el) {
  switch (el.variant) {
    case "stamp":  return 3;
    case "speech": return 3;
    case "tag":    return 3;
    case "cloud":  return 2;
    default:       return 0;
  }
}

// Tag left-notch depth (px) — how far the point juts out at mid-height.
export function tagNotch(el) {
  return Math.max(8, Math.round(Math.min(el.h * 0.34, 28)));
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
