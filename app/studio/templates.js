// ============================================================================
// Editorial templates: turn a generated slide (role/heading/body/...) into a
// polished arrangement of free canvas elements (the "hybrid" model). Pure.
// Deliberately GPU-light: a single background (solid OR one photo + one scrim)
// + positioned type + a thin accent bar — no stacked gradient/filter/scrim
// layers like the old renderers (the native/GPU memory hog behind the crashes).
//
// Look is driven by a STYLE family (styles.js): the same layouts render in
// Editorial / Bold / Minimal by swapping palette + fonts. When a slide has a
// PHOTO background, text flips to the style's `onPhoto` palette (light, readable
// over a darkened photo) so even light "Minimal" stays legible. Layout-level
// family divergence is a later pass (§11 step 5).
// ============================================================================
import { ARTBOARD_W, ARTBOARD_H, uid, makeElement } from "./model";
import { getStyle } from "./styles";

const M = 80; // side margin

function makeText(font, props) {
  return makeElement("text", Object.assign({ id: uid("t"), fontFamily: font, lineHeight: 1.1 }, props));
}

// Resolve the text palette for a slide. Over-photo slides use the style's light
// `onPhoto` palette so any family stays readable on a darkened photo.
function palette(st, hasImage) {
  if (hasImage && st.onPhoto) {
    return { ink: st.onPhoto.ink, sub: st.onPhoto.sub, muted: st.onPhoto.muted, accent: st.onPhoto.accent, accentBar: st.accentBar };
  }
  return { ink: st.ink, sub: st.sub, muted: st.muted, accent: st.accent, accentBar: st.accentBar };
}

// FLAT-LAYERS §3 background: one image (capped `src` + small `thumb`) plus one
// scrim, OR a solid color. Never stacked layers.
function backgroundFor(st, image) {
  if (image && image.url) {
    return {
      type: "image",
      src: image.url,
      thumb: image.thumb || image.url,
      scrim: st.onPhoto && st.onPhoto.scrim != null ? st.onPhoto.scrim : 0.45,
      color: st.bg,
      credit: image.credit || "",
      source: image.source || "",
    };
  }
  return { type: "color", color: st.bg };
}

function kickerEl(st, pal, content, y, size) {
  return makeText(st.kickerFont, {
    x: M, y, w: ARTBOARD_W - 2 * M, h: 40,
    content: (content || "").toUpperCase(), fontSize: size, fontWeight: st.kickerWeight,
    color: pal.accent, letterSpacing: st.kickerSpacing, lineHeight: 1.2,
  });
}

function sourcesEl(st, pal, sources) {
  const s = Array.isArray(sources) ? sources.filter(Boolean).join(" · ") : (sources || "");
  if (!s) return null;
  return makeText(st.bodyFont, {
    x: M, y: 1262, w: ARTBOARD_W - 2 * M, h: 40,
    content: "Sources: " + s, fontSize: 19, fontWeight: 400, color: pal.muted, lineHeight: 1.2, letterSpacing: 0.5,
  });
}

function slideShell(st, image, elements) {
  return {
    id: uid("slide"),
    w: ARTBOARD_W, h: ARTBOARD_H,
    background: backgroundFor(st, image),
    elements: elements.filter(Boolean),
  };
}

export function coverTemplate(s, style, image) {
  const st = getStyle(style);
  const pal = palette(st, !!(image && image.url));
  return slideShell(st, image, [
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 232, w: 64, h: 7, fill: pal.accent }) : null,
    kickerEl(st, pal, s.kicker || "EDITORIAL", 262, 25),
    makeText(st.headFont, { x: M, y: 320, w: ARTBOARD_W - 2 * M, h: 560, content: s.heading || "Untitled", fontSize: 94, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.03 }),
    s.subhead ? makeText(st.headFont, { x: M, y: 1010, w: ARTBOARD_W - 2 * M, h: 180, content: s.subhead, fontSize: 33, fontWeight: 400, color: pal.sub, lineHeight: 1.4 }) : null,
    sourcesEl(st, pal, s.sources),
  ]);
}

export function contentTemplate(s, index, style, image) {
  const st = getStyle(style);
  const pal = palette(st, !!(image && image.url));
  return slideShell(st, image, [
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 232, w: 48, h: 6, fill: pal.accent }) : null,
    kickerEl(st, pal, s.role || "", 258, 22),
    makeText(st.headFont, { x: M, y: 312, w: ARTBOARD_W - 2 * M, h: 360, content: s.heading || "", fontSize: 60, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.08 }),
    s.body ? makeText(st.headFont, { x: M, y: 712, w: ARTBOARD_W - 2 * M, h: 470, content: s.body, fontSize: 32, fontWeight: 400, color: pal.sub, lineHeight: 1.46 }) : null,
    sourcesEl(st, pal, s.sources),
  ]);
}

export function closerTemplate(s, style, image) {
  const st = getStyle(style);
  const pal = palette(st, !!(image && image.url));
  const cy = 470;
  return slideShell(st, image, [
    makeText(st.bodyFont, { x: M, y: cy, w: ARTBOARD_W - 2 * M, h: 60, content: "LOATHR", fontSize: 30, fontWeight: 700, color: pal.ink, align: "center", letterSpacing: 8, lineHeight: 1 }),
    makeElement("rect", { id: uid("r"), x: ARTBOARD_W / 2 - 30, y: cy + 86, w: 60, h: 4, fill: pal.accent }),
    makeText(st.headFont, { x: M, y: cy + 130, w: ARTBOARD_W - 2 * M, h: 320, content: s.heading || s.body || "Thanks for reading.", fontSize: 52, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.15 }),
    s.cta ? makeText(st.bodyFont, { x: M, y: cy + 470, w: ARTBOARD_W - 2 * M, h: 60, content: s.cta, fontSize: 26, fontWeight: 400, color: pal.accent, align: "center", lineHeight: 1.3 }) : null,
  ]);
}

// Map a generated slides array into a full document of canvas slides in `style`.
// `imgMap` (optional) is { slideIndex: { url, thumb, credit, source } } from
// /api/images — each becomes that slide's single §3-safe photo background.
export function slidesToDoc(slides, style, imgMap) {
  const imgs = imgMap || {};
  const arr = Array.isArray(slides) ? slides.filter(Boolean) : [];
  const out = arr.map((s, i) => {
    const image = imgs[i] || null;
    const role = String(s.role || "").toUpperCase();
    if (i === 0 || role === "COVER") return coverTemplate(s, style, image);
    if (i === arr.length - 1 || role === "CLOSER" || role === "OUTRO") return closerTemplate(s, style, image);
    return contentTemplate(s, i, style, image);
  });
  return { id: uid("doc"), slides: out.length ? out : [coverTemplate({ heading: "Empty" }, style)] };
}
