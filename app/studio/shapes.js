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
// accent/shape color — the brand-seeded default that drives variant defaults and
// rethemeDoc), optional `shapeBody`/`shapeBorderC` (per-element Fill/Border
// overrides, B4), `tailSide` (speech only), `priorColor` (the text color
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
// Thickness of the quote block's accent left rule.
export const QUOTE_RULE = 8;

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
  { id: "triangle", label: "Triangle", text: "!",   w: 210, h: 185, font: "Georgia, serif",                          size: 46, knockout: true },
  { id: "diamond",  label: "Diamond",  text: "NEW", w: 200, h: 200, font: "'Courier Prime', 'Courier New', monospace", size: 30, spacing: 1, knockout: true },
  { id: "hexagon",  label: "Hexagon",  text: "TIP", w: 220, h: 190, font: "'Courier Prime', 'Courier New', monospace", size: 34, spacing: 1, knockout: true },
  { id: "ribbon",   label: "Ribbon",   text: "FEATURED", w: 380, h: 96,  font: "Georgia, serif",                      size: 34, knockout: true },
  { id: "bookmark", label: "Bookmark", text: "SAVE", w: 150, h: 200, font: "'Courier Prime', 'Courier New', monospace", size: 28, spacing: 1, knockout: true },
  { id: "arrowR",   label: "Callout",  text: "NEXT", w: 260, h: 120, font: "'Courier Prime', 'Courier New', monospace", size: 32, spacing: 1, knockout: true },
  { id: "quote",    label: "Quote",    text: "A sharp line worth pulling.", w: 420, h: 176, font: "Georgia, serif", size: 34 },
  { id: "star5",    label: "Star",     text: "TOP",  w: 210, h: 200, font: "'Courier Prime', 'Courier New', monospace", size: 32, spacing: 1, knockout: true },
  { id: "pentagon", label: "Pentagon", text: "NEW",  w: 210, h: 190, font: "'Courier Prime', 'Courier New', monospace", size: 30, spacing: 1, knockout: true },
  { id: "octagon",  label: "Octagon",  text: "STOP", w: 200, h: 200, font: "'Courier Prime', 'Courier New', monospace", size: 30, spacing: 1, knockout: true },
  { id: "chevron",  label: "Chevron",  text: "MORE", w: 280, h: 120, font: "'Courier Prime', 'Courier New', monospace", size: 32, spacing: 1, knockout: true },
  { id: "arrowL",   label: "Back",     text: "PREV", w: 260, h: 120, font: "'Courier Prime', 'Courier New', monospace", size: 32, spacing: 1, knockout: true },
  { id: "arrowU",   label: "Up",       text: "UP",   w: 190, h: 210, font: "'Courier Prime', 'Courier New', monospace", size: 32, spacing: 1, knockout: true },
  { id: "paral",    label: "Slant",    text: "SALE", w: 280, h: 110, font: "Georgia, serif", size: 38, knockout: true },
  { id: "plus",     label: "Plus",     text: "+",    w: 200, h: 200, font: "'Courier Prime', 'Courier New', monospace", size: 54, knockout: true },
];

// Simple convex silhouettes (percent points in a 0..100 box), shared VERBATIM by
// the CSS clip-path (ShapeBacking) and the canvas polygon (export) — like
// BURST_POINTS — so a polygon shape looks identical live, in the strip, and in
// the exported PNG. Filled, knockout-text shapes (no border, matching burst).
export const POLY_POINTS = {
  triangle: [[50, 0], [100, 100], [0, 100]],
  diamond:  [[50, 0], [100, 50], [50, 100], [0, 50]],
  hexagon:  [[25, 0], [75, 0], [100, 50], [75, 100], [25, 100], [0, 50]],
  ribbon:   [[0, 0], [100, 0], [88, 50], [100, 100], [0, 100], [12, 50]], // banner with forked ends
  bookmark: [[0, 0], [100, 0], [100, 100], [50, 82], [0, 100]],           // pennant / bookmark notch
  arrowR:   [[0, 0], [75, 0], [100, 50], [75, 100], [0, 100]],            // right-pointing callout
  star5:    [[50, 2], [63, 35], [98, 35], [70, 57], [80, 92], [50, 71], [20, 92], [30, 57], [2, 35], [37, 35]], // 5-point star
  pentagon: [[50, 2], [98, 38], [80, 98], [20, 98], [2, 38]],             // upright pentagon
  octagon:  [[30, 2], [70, 2], [98, 30], [98, 70], [70, 98], [30, 98], [2, 70], [2, 30]], // stop-sign octagon
  chevron:  [[0, 0], [75, 0], [100, 50], [75, 100], [0, 100], [25, 50]],  // right chevron (notched tail)
  arrowL:   [[25, 0], [100, 0], [100, 100], [25, 100], [0, 50]],          // left-pointing callout
  arrowU:   [[50, 0], [100, 45], [72, 45], [72, 100], [28, 100], [28, 45], [0, 45]], // up arrow
  paral:    [[22, 0], [100, 0], [78, 100], [0, 100]],                     // slanted parallelogram
  plus:     [[36, 0], [64, 0], [64, 36], [100, 36], [100, 64], [64, 64], [64, 100], [36, 100], [36, 64], [0, 64], [0, 36], [36, 36]], // plus / cross
};
// The polygon points for a shape, or null when it isn't a polygon silhouette.
export function shapePolygon(el) { return (el && POLY_POINTS[el.shape]) || null; }

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

// How a shape paints. Always:
//   bg     — the box background ("transparent" / a dark plate / the fill)
//   border — outline color, or "none"
//   dashed — true for the stamp's dashed rule
//   rule   — banner top/bottom rule color (no full border)
// The TEXT color is the element's own `color`, drawn separately by the text path.
//
// `shapeFill` seeds the brand-default look (the accent on the body or the
// border/tail). B4 layers per-element overrides on top: `shapeBody` retints the
// box (the Inspector "Fill"), `shapeBorderC` retints the outline (the Inspector
// "Border"). Both are absent by default, so every existing deck renders byte-for-
// byte unchanged. The banner's accent is its rule rather than a box border, so a
// Border override retints that rule instead of adding an outline to the plate.
export function shapePaint(el) {
  const fill = el.shapeFill || "#e23744";
  let p;
  switch (el.shape) {
    case "triangle":
    case "diamond":
    case "hexagon":
    case "ribbon":
    case "bookmark":
    case "arrowR":
    case "star5":
    case "pentagon":
    case "octagon":
    case "chevron":
    case "arrowL":
    case "arrowU":
    case "paral":
    case "plus":
    case "burst":
    case "pill":   p = { bg: fill, border: "none" }; break;
    case "note":   p = { bg: fill || SHAPE_PAPER, border: "none" }; break;
    case "banner": p = { bg: SHAPE_BACKING, border: "none", rule: fill }; break;
    case "quote":  p = { bg: SHAPE_BACKING, border: "none", leftRule: fill }; break;
    case "stamp":  p = { bg: "transparent", border: fill, dashed: true }; break;
    case "tag":
    case "speech":
    case "cloud":
    default:       p = { bg: SHAPE_BACKING, border: fill }; break;
  }
  if (el.shapeBody != null) p.bg = el.shapeBody;
  if (el.shapeBorderC != null) {
    if (p.rule != null) p.rule = el.shapeBorderC;          // banner: the rule is the accent
    else if (p.leftRule != null) p.leftRule = el.shapeBorderC; // quote: the left bar is the accent
    else p.border = el.shapeBorderC;
  }
  // Border STYLE: an explicit el.shapeDash ("solid"|"dashed"|"dotted") wins, else
  // the stamp's long-standing dashed default. `dash` is a literal CSS border-style
  // (ShapeBacking) and drives the canvas line-dash (export).
  p.dash = el.shapeDash || (p.dashed ? "dashed" : "solid");
  return p;
}

// The accent used by the soft cloud glow — follows a Border override, else the
// brand-seeded fill (so an un-overridden cloud glows exactly as before).
export function shapeAccentColor(el) {
  return el && el.shapeBorderC != null ? el.shapeBorderC : ((el && el.shapeFill) || "#e23744");
}

// The speech tail / paper ear read the body when the user overrides Fill, else
// the brand accent — preserving the long-standing hollow-bubble look (dark plate,
// accent outline + tail) for every deck that never touched the new field.
export function shapeTailColor(el) {
  return el && el.shapeBody != null ? el.shapeBody : ((el && el.shapeFill) || "#e23744");
}

// Border thickness (px) by shape; 0 for the filled / ruled / paper ones — but a
// filled shape gains a thin outline once the user picks an explicit Border colour
// (so the new control is visible there too; defaults stay 0 without it).
export function shapeBorderW(el) {
  if (el && el.shapeBorderWidth != null) return Math.max(0, Math.round(el.shapeBorderWidth)); // explicit override
  switch (el.shape) {
    case "stamp":  return 3;
    case "speech": return 3;
    case "tag":    return 3;
    case "cloud":  return 2;
    default:       return el && el.shapeBorderC != null ? 3 : 0;
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
    // Polygon silhouettes: keep the copy inside the shape's safe core. The
    // triangle's core sits low (wide base), so it gets a tall top inset.
    case "triangle": return { top: Math.round(h * 0.42), right: Math.round(w * 0.18), bottom: Math.round(h * 0.08), left: Math.round(w * 0.18) };
    case "diamond": { const p = Math.round(Math.min(w, h) * 0.26); return { top: p, right: p, bottom: p, left: p }; }
    case "hexagon":  return box(Math.round(h * 0.16), Math.round(w * 0.2));
    case "ribbon":   return box(18, Math.round(w * 0.13));                 // clear the forked ends
    case "bookmark": return { top: 22, right: 20, bottom: Math.round(h * 0.24), left: 20 }; // clear the bottom notch
    case "arrowR":   return { top: 18, right: Math.round(w * 0.28), bottom: 18, left: 26 };  // clear the point
    case "star5":    return { top: Math.round(h * 0.34), right: Math.round(w * 0.26), bottom: Math.round(h * 0.30), left: Math.round(w * 0.26) }; // central band of the star
    case "pentagon": return { top: Math.round(h * 0.28), right: Math.round(w * 0.16), bottom: Math.round(h * 0.10), left: Math.round(w * 0.16) }; // clear the top apex
    case "octagon":  return box(Math.round(h * 0.18), Math.round(w * 0.18));
    case "chevron":  return { top: 18, right: Math.round(w * 0.24), bottom: 18, left: Math.round(w * 0.22) }; // clear point + tail notch
    case "arrowL":   return { top: 18, right: 26, bottom: 18, left: Math.round(w * 0.28) };  // clear the left point
    case "arrowU":   return { top: Math.round(h * 0.42), right: Math.round(w * 0.20), bottom: Math.round(h * 0.08), left: Math.round(w * 0.20) }; // sit below the top point
    case "paral":    return box(18, Math.round(w * 0.2));                  // clear the slanted sides
    case "plus":     return { top: Math.round(h * 0.34), right: Math.round(w * 0.08), bottom: Math.round(h * 0.34), left: Math.round(w * 0.08) }; // the horizontal bar
    case "quote":    return { top: 22, right: 28, bottom: 22, left: 34 };  // clear the left rule
    case "tag":    return { top: 18, right: 26, bottom: 18, left: tagNotch(el) + 24 };
    case "banner": return box(18, 30);
    case "stamp":  return box(16, 26);
    case "note":   return box(24, 28);
    case "cloud":  return box(22, 32);
    case "speech":
    default:       return box(22, 30);
  }
}

// Pointed / tapered silhouettes whose usable core is much smaller than their
// bounding box — text overflows the point unless it shrinks to fit. "Fit text"
// defaults ON for these when a shape is applied (store.setShape).
const POINTED = {
  triangle: 1, diamond: 1, hexagon: 1, burst: 1, bookmark: 1, arrowR: 1, ribbon: 1,
  star5: 1, pentagon: 1, chevron: 1, arrowL: 1, arrowU: 1, paral: 1, plus: 1,
};
export function pointedShape(id) { return !!POINTED[id]; }

// Fit-text-to-SHAPE (the inverse of fitShapeBox, which grows the box to the
// text): when `el.fitText` is on, shrink the font so the copy stays inside the
// shape's safe inner box (shapePad-inset) instead of spilling past a pointed
// edge. PURE + deterministic — a light average-glyph-advance model, no DOM /
// canvas — so the three renderers (live, thumb, PNG export) all compute the SAME
// size and stay in lockstep. Returns the element's own fontSize when off / unset.
export function fitTextSize(el) {
  const base = (el && el.fontSize) || 32;
  if (!el || !el.fitText || !el.shape) return base;
  const text = String(el.content || "");
  if (!text.trim()) return base;
  const pad = shapePad(el);
  const innerW = Math.max(8, (el.w || 100) - pad.left - pad.right);
  const innerH = Math.max(8, (el.h || 100) - pad.top - pad.bottom);
  const lh = el.lineHeight || 1.12;
  const ls = el.letterSpacing || 0;
  const paras = text.split("\n");
  // Average glyph advance as a fraction of the font size (empirical for the
  // sans / serif / mono faces the shapes use); bold copy reads a touch wider.
  const k = el.fontWeight && el.fontWeight >= 600 ? 0.56 : 0.52;
  // Greedy word-wrap line count for a given characters-per-line budget.
  const countLines = (perLine) => {
    let lines = 0;
    for (const para of paras) {
      const words = para.split(/\s+/).filter(Boolean);
      if (!words.length) { lines += 1; continue; }   // a blank paragraph = one line
      let cur = 0;
      for (const w of words) {
        const need = w.length;
        if (need > perLine) {                         // a token longer than the line breaks (break-word)
          if (cur > 0) { lines += 1; cur = 0; }
          lines += Math.ceil(need / perLine) - 1;
          cur = need % perLine || perLine;
          continue;
        }
        if (cur === 0) cur = need;
        else if (cur + 1 + need <= perLine) cur += 1 + need;
        else { lines += 1; cur = need; }
      }
      lines += 1;                                     // the paragraph's last open line
    }
    return Math.max(1, lines);
  };
  const fits = (fs) => {
    const perLine = Math.max(1, Math.floor(innerW / (fs * k + ls)));
    return countLines(perLine) * lh * fs <= innerH;
  };
  let fs = Math.round(base);
  const MIN = 12;
  while (fs > MIN && !fits(fs)) fs -= 1;
  return Math.max(MIN, fs);
}

// Vertical placement of a shaped element's copy within its box. Default middle
// (the long-standing behaviour); top/bottom let the text sit against an edge.
// CSS flex value for the DOM renderers; the export computes the same from vAlign.
export function shapeVAlign(el) {
  return el && el.vAlign === "top" ? "flex-start" : el && el.vAlign === "bottom" ? "flex-end" : "center";
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
