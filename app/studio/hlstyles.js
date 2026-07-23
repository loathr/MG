// hlstyles.js — the single source of truth for highlight STYLES, shared by every
// renderer so they can't drift: the editor (RichText), the live text-editing view
// (richedit), and the PNG export (export.js). A highlighted run carries `bg` (the
// colour) and `bgStyle` (one of HL_STYLES); the DOM sides call hlCss(), the canvas
// side reads hlSpec(). Geometry is in EM (relative to font size) so it scales.
//
// Pure + dependency-free → unit-tested.

export const HL_STYLES = ["pill", "block", "marker", "band", "outline"];
export const DEFAULT_HL_STYLE = "pill";
export function normHlStyle(s) { return HL_STYLES.indexOf(s) >= 0 ? s : DEFAULT_HL_STYLE; }

// Canvas geometry per style. The export draws text top-aligned at the line's top Y,
// so the highlight box is given as fractions of the token font size measured DOWN
// from that top: boxTop (top edge) and boxH (height). padX: horizontal padding;
// radius: corner radius; fill/alpha/outline as expected; band>0 colours only the
// lower part (highlighter). These fractions are tuned so the canvas box hugs the
// glyphs the same way the DOM line-box does — checked by the editor-vs-export diff.
export function hlSpec(style) {
  const s = normHlStyle(style);
  const base = { padX: 0.16, radius: 0.14, fill: true, alpha: 1, outline: 0, band: 0, organic: false, boxTop: 0.13, boxH: 0.80 };
  if (s === "block")   return { ...base, radius: 0 };
  if (s === "marker")  return { ...base, padX: 0.20, radius: 0.5, alpha: 0.9, organic: true, boxTop: 0.10, boxH: 0.86 };
  if (s === "band")    return { ...base, padX: 0.06, radius: 0, alpha: 0.9, band: 1, boxTop: 0.42, boxH: 0.50 };
  if (s === "outline") return { ...base, fill: false, outline: 0.055 };
  return base; // pill
}

// DOM CSS (a React style object) for a highlighted run. RichText uses it directly;
// richedit serialises it to an inline style string — so both DOM renderers are
// byte-identical. `color` is the knockout text colour (may be undefined).
export function hlCss(bg, style, color) {
  const s = normHlStyle(style);
  const clone = { WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone" };
  if (s === "band") {
    return { ...clone, background: "linear-gradient(transparent 50%, " + bg + " 50%)", padding: "0 0.06em", lineHeight: 1.05, borderRadius: 0 };
  }
  if (s === "outline") {
    const st = { ...clone, background: "transparent", border: "0.055em solid " + bg, color: bg, padding: "0.02em 0.16em", borderRadius: "0.14em", lineHeight: 1.02 };
    return st;
  }
  const st = { ...clone, background: bg, padding: "0.02em 0.16em", borderRadius: "0.14em", lineHeight: 1.02 };
  if (color) st.color = color;
  if (s === "block")  st.borderRadius = 0;
  if (s === "marker") { st.padding = "0.04em 0.2em"; st.borderRadius = "0.6em 0.45em 0.55em 0.4em"; st.lineHeight = 1.05; }
  return st;
}
