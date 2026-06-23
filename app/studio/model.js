// ============================================================================
// Studio document model — the Canva-style element model.
//
// A carousel is an array of SLIDES. Each slide is a fixed-aspect ARTBOARD with a
// background and a flat list of ELEMENTS. Every element is freely positioned
// (x, y, w, h, rotation) so it can be moved/resized/rotated directly on the
// canvas — unlike the old fixed-CSS-layout renderers. AI + templates produce a
// polished arrangement of these elements (the "hybrid" model); from there the
// user manipulates them like Canva.
//
// This file is PURE (no React, no DOM) so it is trivial to reason about and test.
// ============================================================================

// Instagram portrait 4:5. All element coordinates are in these artboard units;
// the Artboard scales the whole thing to fit the viewport.
export const ARTBOARD_W = 1080;
export const ARTBOARD_H = 1350;

let _idc = 0;
export function uid(prefix) {
  _idc += 1;
  return (prefix || "el") + "_" + Date.now().toString(36) + "_" + _idc;
}

export const ELEMENT_DEFAULTS = {
  text: {
    content: "Text",
    fontFamily: "Georgia, serif",
    fontSize: 64,
    fontWeight: 700,
    italic: false,
    color: "#ffffff",
    align: "left",
    lineHeight: 1.1,
    letterSpacing: 0,
    opacity: 1,
  },
  image: { src: "", fit: "cover", opacity: 1, radius: 0 },
  rect: { fill: "#e23744", stroke: "none", strokeWidth: 0, radius: 0, opacity: 1 },
  line: { fill: "#ffffff", opacity: 1 },
};

export function makeElement(type, props) {
  const base = {
    id: uid(type),
    type,
    x: 100,
    y: 100,
    w: 400,
    h: 120,
    rotation: 0,
    locked: false,
  };
  return Object.assign(base, ELEMENT_DEFAULTS[type] || {}, props || {});
}

// A representative editorial (sports) slide expressed as free elements, so the
// canvas can be developed and demoed without hitting the generation API.
export function sampleSlide() {
  return {
    id: uid("slide"),
    w: ARTBOARD_W,
    h: ARTBOARD_H,
    background: {
      type: "image",
      src: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=1080&q=70&fm=jpg",
      // scrim darkens the photo so white text reads — rendered as an overlay.
      scrim: 0.45,
      color: "#0c0c0c",
    },
    elements: [
      makeElement("rect", { id: uid("rect"), x: 80, y: 220, w: 70, h: 8, fill: "#e23744" }),
      makeElement("text", {
        id: uid("text"), x: 80, y: 250, w: 560, h: 40,
        content: "THE TURNING POINT", fontFamily: "Georgia, serif", fontSize: 26,
        fontWeight: 700, letterSpacing: 4, color: "#e23744", lineHeight: 1.2,
      }),
      makeElement("text", {
        id: uid("text"), x: 80, y: 300, w: 820, h: 320,
        content: "How one substitution rewrote the final",
        fontFamily: "Georgia, serif", fontSize: 92, fontWeight: 700,
        color: "#ffffff", lineHeight: 1.04,
      }),
      makeElement("text", {
        id: uid("text"), x: 80, y: 980, w: 820, h: 160,
        content: "The bench gamble that flipped momentum in the 71st minute — and the data that saw it coming.",
        fontFamily: "Georgia, serif", fontSize: 34, fontWeight: 400,
        color: "#f0f0f0", lineHeight: 1.4,
      }),
      makeElement("text", {
        id: uid("text"), x: 80, y: 1250, w: 920, h: 40,
        content: "Sources: Opta · The Athletic",
        fontFamily: "Helvetica, Arial, sans-serif", fontSize: 20,
        fontWeight: 400, color: "#bdbdbd", lineHeight: 1.2, letterSpacing: 1,
      }),
    ],
  };
}

export function sampleDoc() {
  return { id: uid("doc"), slides: [sampleSlide()] };
}

// A new empty slide: a single solid background, no elements. Respects §3 (one
// background, flat element list). Used by the "+" in the slide strip.
export function blankSlide(background) {
  return {
    id: uid("slide"),
    w: ARTBOARD_W,
    h: ARTBOARD_H,
    background: background || { type: "color", color: "#0c0c0c" },
    elements: [],
  };
}

// Deep-ish clone of a slide with fresh ids (background is a value object, so a
// shallow copy is enough; elements get new ids so selection stays unambiguous).
export function cloneSlide(slide) {
  return {
    id: uid("slide"),
    w: slide.w,
    h: slide.h,
    background: Object.assign({}, slide.background),
    elements: (slide.elements || []).map((e) => Object.assign({}, e, { id: uid(e.type) })),
  };
}

// --- selectors / helpers --------------------------------------------------
export function findElement(slide, id) {
  if (!slide || !id) return null;
  for (let i = 0; i < slide.elements.length; i++) {
    if (slide.elements[i].id === id) return slide.elements[i];
  }
  return null;
}
