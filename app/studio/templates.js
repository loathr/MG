// ============================================================================
// Editorial templates: turn a generated slide (role/heading/body/...) into a
// polished arrangement of free canvas elements (the "hybrid" model). Pure.
// Deliberately GPU-light: flat solid background + positioned type + a thin
// accent bar — no stacked gradient/filter/scrim layers like the old renderers
// (which were the native/GPU memory hog behind the crashes).
// ============================================================================
import { ARTBOARD_W, ARTBOARD_H, uid, makeElement } from "./model";

const M = 80; // side margin
const ACCENT = "#e23744";
const BG = "#0c0c0c";
const SERIF = "Georgia, serif";
const SANS = "Helvetica, Arial, sans-serif";

function txt(props) {
  return makeElement("text", Object.assign({ id: uid("t"), fontFamily: SERIF, color: "#ffffff", lineHeight: 1.1 }, props));
}
function sourcesEl(sources) {
  const s = Array.isArray(sources) ? sources.filter(Boolean).join(" · ") : (sources || "");
  if (!s) return null;
  return txt({ x: M, y: 1262, w: ARTBOARD_W - 2 * M, h: 40, content: "Sources: " + s, fontFamily: SANS, fontSize: 19, fontWeight: 400, color: "#9a9a9a", lineHeight: 1.2, letterSpacing: 0.5 });
}

function slideShell(elements) {
  return {
    id: uid("slide"),
    w: ARTBOARD_W, h: ARTBOARD_H,
    background: { type: "color", color: BG },
    elements: elements.filter(Boolean),
  };
}

export function coverTemplate(s) {
  return slideShell([
    makeElement("rect", { id: uid("r"), x: M, y: 232, w: 64, h: 7, fill: ACCENT }),
    txt({ x: M, y: 262, w: ARTBOARD_W - 2 * M, h: 40, content: (s.kicker || "EDITORIAL").toUpperCase(), fontSize: 25, fontWeight: 700, color: ACCENT, letterSpacing: 4, lineHeight: 1.2 }),
    txt({ x: M, y: 320, w: ARTBOARD_W - 2 * M, h: 560, content: s.heading || "Untitled", fontSize: 94, fontWeight: 700, lineHeight: 1.03 }),
    s.subhead ? txt({ x: M, y: 1010, w: ARTBOARD_W - 2 * M, h: 180, content: s.subhead, fontSize: 33, fontWeight: 400, color: "#eaeaea", lineHeight: 1.4 }) : null,
    sourcesEl(s.sources),
  ]);
}

export function contentTemplate(s, index) {
  return slideShell([
    makeElement("rect", { id: uid("r"), x: M, y: 232, w: 48, h: 6, fill: ACCENT }),
    txt({ x: M, y: 258, w: ARTBOARD_W - 2 * M, h: 36, content: (s.role || "").toUpperCase(), fontSize: 22, fontWeight: 700, color: ACCENT, letterSpacing: 3, lineHeight: 1.2 }),
    txt({ x: M, y: 312, w: ARTBOARD_W - 2 * M, h: 360, content: s.heading || "", fontSize: 60, fontWeight: 700, lineHeight: 1.08 }),
    s.body ? txt({ x: M, y: 712, w: ARTBOARD_W - 2 * M, h: 470, content: s.body, fontSize: 32, fontWeight: 400, color: "#e8e8e8", lineHeight: 1.46 }) : null,
    sourcesEl(s.sources),
  ]);
}

export function closerTemplate(s) {
  const cy = 470;
  return slideShell([
    txt({ x: M, y: cy, w: ARTBOARD_W - 2 * M, h: 60, content: "LOATHR", fontFamily: SANS, fontSize: 30, fontWeight: 700, color: "#ffffff", align: "center", letterSpacing: 8, lineHeight: 1 }),
    makeElement("rect", { id: uid("r"), x: ARTBOARD_W / 2 - 30, y: cy + 86, w: 60, h: 4, fill: ACCENT }),
    txt({ x: M, y: cy + 130, w: ARTBOARD_W - 2 * M, h: 320, content: s.heading || s.body || "Thanks for reading.", fontSize: 52, fontWeight: 700, color: "#ffffff", align: "center", lineHeight: 1.15 }),
    s.cta ? txt({ x: M, y: cy + 470, w: ARTBOARD_W - 2 * M, h: 60, content: s.cta, fontFamily: SANS, fontSize: 26, fontWeight: 400, color: ACCENT, align: "center", lineHeight: 1.3 }) : null,
  ]);
}

// Map a generated slides array into a full document of canvas slides.
export function slidesToDoc(slides) {
  const arr = Array.isArray(slides) ? slides.filter(Boolean) : [];
  const out = arr.map((s, i) => {
    const role = String(s.role || "").toUpperCase();
    if (i === 0 || role === "COVER") return coverTemplate(s);
    if (i === arr.length - 1 || role === "CLOSER" || role === "OUTRO") return closerTemplate(s);
    return contentTemplate(s, i);
  });
  return { id: uid("doc"), slides: out.length ? out : [coverTemplate({ heading: "Empty" })] };
}
