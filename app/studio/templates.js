// ============================================================================
// Editorial templates: turn a generated slide (role/heading/body/...) into a
// polished arrangement of free canvas elements (the "hybrid" model). Pure.
// Deliberately GPU-light: flat solid background + positioned type + a thin
// accent bar — no stacked gradient/filter/scrim layers like the old renderers
// (which were the native/GPU memory hog behind the crashes).
//
// Look is driven by a STYLE family (styles.js): the same layouts render in
// Editorial / Bold / Minimal by swapping palette + fonts. Layout-level family
// divergence is a later pass (§11 step 5).
// ============================================================================
import { ARTBOARD_W, ARTBOARD_H, uid, makeElement } from "./model";
import { getStyle } from "./styles";

const M = 80; // side margin

function txt(st, props) {
  return makeElement("text", Object.assign({ id: uid("t"), fontFamily: st.headFont, color: st.ink, lineHeight: 1.1 }, props));
}

function kickerEl(st, content, y, size) {
  return makeElement("text", {
    id: uid("t"), x: M, y, w: ARTBOARD_W - 2 * M, h: 40,
    content: (content || "").toUpperCase(), fontFamily: st.kickerFont, fontSize: size,
    fontWeight: st.kickerWeight, color: st.accent, letterSpacing: st.kickerSpacing, lineHeight: 1.2,
  });
}

function sourcesEl(st, sources) {
  const s = Array.isArray(sources) ? sources.filter(Boolean).join(" · ") : (sources || "");
  if (!s) return null;
  return makeElement("text", {
    id: uid("t"), x: M, y: 1262, w: ARTBOARD_W - 2 * M, h: 40,
    content: "Sources: " + s, fontFamily: st.bodyFont, fontSize: 19, fontWeight: 400,
    color: st.muted, lineHeight: 1.2, letterSpacing: 0.5,
  });
}

function slideShell(st, elements) {
  return {
    id: uid("slide"),
    w: ARTBOARD_W, h: ARTBOARD_H,
    background: { type: "color", color: st.bg },
    elements: elements.filter(Boolean),
  };
}

export function coverTemplate(s, style) {
  const st = getStyle(style);
  return slideShell(st, [
    st.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 232, w: 64, h: 7, fill: st.accent }) : null,
    kickerEl(st, s.kicker || "EDITORIAL", 262, 25),
    txt(st, { x: M, y: 320, w: ARTBOARD_W - 2 * M, h: 560, content: s.heading || "Untitled", fontSize: 94, fontWeight: st.headWeight, lineHeight: 1.03 }),
    s.subhead ? txt(st, { x: M, y: 1010, w: ARTBOARD_W - 2 * M, h: 180, content: s.subhead, fontSize: 33, fontWeight: 400, color: st.sub, lineHeight: 1.4 }) : null,
    sourcesEl(st, s.sources),
  ]);
}

export function contentTemplate(s, index, style) {
  const st = getStyle(style);
  return slideShell(st, [
    st.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 232, w: 48, h: 6, fill: st.accent }) : null,
    kickerEl(st, s.role || "", 258, 22),
    txt(st, { x: M, y: 312, w: ARTBOARD_W - 2 * M, h: 360, content: s.heading || "", fontSize: 60, fontWeight: st.headWeight, lineHeight: 1.08 }),
    s.body ? txt(st, { x: M, y: 712, w: ARTBOARD_W - 2 * M, h: 470, content: s.body, fontFamily: st.headFont, fontSize: 32, fontWeight: 400, color: st.sub, lineHeight: 1.46 }) : null,
    sourcesEl(st, s.sources),
  ]);
}

export function closerTemplate(s, style) {
  const st = getStyle(style);
  const cy = 470;
  return slideShell(st, [
    txt(st, { x: M, y: cy, w: ARTBOARD_W - 2 * M, h: 60, content: "LOATHR", fontFamily: st.bodyFont, fontSize: 30, fontWeight: 700, color: st.ink, align: "center", letterSpacing: 8, lineHeight: 1 }),
    makeElement("rect", { id: uid("r"), x: ARTBOARD_W / 2 - 30, y: cy + 86, w: 60, h: 4, fill: st.accent }),
    txt(st, { x: M, y: cy + 130, w: ARTBOARD_W - 2 * M, h: 320, content: s.heading || s.body || "Thanks for reading.", fontSize: 52, fontWeight: st.headWeight, color: st.ink, align: "center", lineHeight: 1.15 }),
    s.cta ? txt(st, { x: M, y: cy + 470, w: ARTBOARD_W - 2 * M, h: 60, content: s.cta, fontFamily: st.bodyFont, fontSize: 26, fontWeight: 400, color: st.accent, align: "center", lineHeight: 1.3 }) : null,
  ]);
}

// Map a generated slides array into a full document of canvas slides in `style`.
export function slidesToDoc(slides, style) {
  const arr = Array.isArray(slides) ? slides.filter(Boolean) : [];
  const out = arr.map((s, i) => {
    const role = String(s.role || "").toUpperCase();
    if (i === 0 || role === "COVER") return coverTemplate(s, style);
    if (i === arr.length - 1 || role === "CLOSER" || role === "OUTRO") return closerTemplate(s, style);
    return contentTemplate(s, i, style);
  });
  return { id: uid("doc"), slides: out.length ? out : [coverTemplate({ heading: "Empty" }, style)] };
}
