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
import { getStyle, brandFromStyle } from "./styles";

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

// --- Layout registry -------------------------------------------------------
// A layout is a pure (content, style, palette) -> elements arrangement of the
// slide's text. The Templates panel re-flows a slide's content through any of
// these on explicit click; nothing auto-reflows, so manual edits persist until
// the user picks a layout. Each obeys the same palette + photo-awareness.

// Normalize any slide content (generated cover/content/closer, or derived) into
// the four fields layouts arrange.
function norm(content) {
  const c = content || {};
  return {
    kicker: c.kicker || c.role || "",
    heading: c.heading || c.title || "Untitled",
    body: c.body || c.subhead || c.cta || "",
    sources: Array.isArray(c.sources) ? c.sources : (c.sources ? [c.sources] : []),
  };
}

function centeredKicker(st, pal, content, y) {
  return content ? makeText(st.kickerFont, { x: M, y, w: ARTBOARD_W - 2 * M, h: 40, content: content.toUpperCase(), fontSize: 24, fontWeight: st.kickerWeight, color: pal.accent, letterSpacing: st.kickerSpacing, align: "center", lineHeight: 1.2 }) : null;
}

function L_classic(c, st, pal) {
  return [
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 232, w: 48, h: 6, fill: pal.accent }) : null,
    c.kicker ? kickerEl(st, pal, c.kicker, 258, 22) : null,
    makeText(st.headFont, { x: M, y: 312, w: ARTBOARD_W - 2 * M, h: 360, content: c.heading, fontSize: 60, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.08 }),
    c.body ? makeText(st.headFont, { x: M, y: 712, w: ARTBOARD_W - 2 * M, h: 470, content: c.body, fontSize: 32, fontWeight: 400, color: pal.sub, lineHeight: 1.46 }) : null,
    sourcesEl(st, pal, c.sources),
  ];
}

function L_cover(c, st, pal) {
  return [
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 232, w: 64, h: 7, fill: pal.accent }) : null,
    kickerEl(st, pal, c.kicker || "EDITORIAL", 262, 25),
    makeText(st.headFont, { x: M, y: 320, w: ARTBOARD_W - 2 * M, h: 560, content: c.heading, fontSize: 94, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.03 }),
    c.body ? makeText(st.headFont, { x: M, y: 1010, w: ARTBOARD_W - 2 * M, h: 180, content: c.body, fontSize: 33, fontWeight: 400, color: pal.sub, lineHeight: 1.4 }) : null,
    sourcesEl(st, pal, c.sources),
  ];
}

function L_centered(c, st, pal) {
  return [
    centeredKicker(st, pal, c.kicker, 430),
    makeText(st.headFont, { x: M, y: 490, w: ARTBOARD_W - 2 * M, h: 360, content: c.heading, fontSize: 78, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.05 }),
    c.body ? makeText(st.headFont, { x: M, y: 880, w: ARTBOARD_W - 2 * M, h: 260, content: c.body, fontSize: 32, fontWeight: 400, color: pal.sub, align: "center", lineHeight: 1.45 }) : null,
  ];
}

function L_statement(c, st, pal) {
  return [
    centeredKicker(st, pal, c.kicker, 300),
    makeText(st.headFont, { x: M, y: 380, w: ARTBOARD_W - 2 * M, h: 600, content: c.heading, fontSize: 118, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.0 }),
  ];
}

function L_bottom(c, st, pal) {
  return [
    c.kicker ? kickerEl(st, pal, c.kicker, 742, 22) : null,
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 720, w: 48, h: 6, fill: pal.accent }) : null,
    makeText(st.headFont, { x: M, y: 800, w: ARTBOARD_W - 2 * M, h: 300, content: c.heading, fontSize: 66, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.06 }),
    c.body ? makeText(st.headFont, { x: M, y: 1120, w: ARTBOARD_W - 2 * M, h: 150, content: c.body, fontSize: 28, fontWeight: 400, color: pal.sub, lineHeight: 1.4 }) : null,
  ];
}

const LAYOUT_FNS = { classic: L_classic, cover: L_cover, centered: L_centered, statement: L_statement, bottom: L_bottom };

export const LAYOUT_LIST = [
  { key: "cover", label: "Cover" },
  { key: "classic", label: "Classic" },
  { key: "centered", label: "Centered" },
  { key: "statement", label: "Statement" },
  { key: "bottom", label: "Bottom" },
];

// Render a slide's content through a layout -> elements. `hasImage` switches the
// text to the readable over-photo palette.
export function renderLayout(layoutKey, content, style, hasImage) {
  const st = getStyle(style);
  const pal = palette(st, !!hasImage);
  const fn = LAYOUT_FNS[layoutKey] || LAYOUT_FNS.classic;
  return fn(norm(content), st, pal).filter(Boolean);
}

// Best-effort content for a slide that wasn't generated from a template (sample,
// blank, demo, or hand-built): infer heading/body/sources from its text.
export function deriveContent(slide) {
  if (slide && slide.content) return slide.content;
  const texts = ((slide && slide.elements) || []).filter((e) => e.type === "text" && e.content);
  if (!texts.length) return { heading: "Untitled" };
  const bySize = texts.slice().sort((a, b) => (b.fontSize || 0) - (a.fontSize || 0));
  const headEl = bySize[0];
  const srcEl = texts.find((t) => /^sources:/i.test(t.content));
  const rest = texts.filter((t) => t !== headEl && t !== srcEl);
  return {
    heading: headEl ? headEl.content : "Untitled",
    body: rest.map((t) => t.content).join("\n\n"),
    sources: srcEl ? [srcEl.content.replace(/^sources:\s*/i, "")] : [],
  };
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
    let slide, layout;
    if (i === 0 || role === "COVER") { slide = coverTemplate(s, style, image); layout = "cover"; }
    else if (i === arr.length - 1 || role === "CLOSER" || role === "OUTRO") { slide = closerTemplate(s, style, image); layout = "closer"; }
    else { slide = contentTemplate(s, i, style, image); layout = "classic"; }
    // Keep the source content + style + layout so the Templates panel can re-flow
    // this slide into another layout without losing its text.
    slide.content = s;
    slide.style = style || "editorial";
    slide.layout = layout;
    return slide;
  });
  return { id: uid("doc"), brand: brandFromStyle(style), slides: out.length ? out : [coverTemplate({ heading: "Empty" }, style)] };
}
