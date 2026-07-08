// textfx.js — pure element-level TEXT EFFECTS (`el.effect`). A single source of
// truth shared by the DOM renderers (Element.jsx / StaticSlide.jsx → CSS) and the
// PNG export (canvas shadow), so an effect looks identical live, in the strip, and
// exported. Element-level (the whole text box), layered on top of the per-run
// styling; absent `effect` (or "none") renders exactly as before.

export const TEXT_EFFECTS = [
  { id: "none",   label: "None" },
  { id: "shadow", label: "Shadow" },   // hard drop shadow
  { id: "glow",   label: "Glow" },      // soft blurred glow
];

export function effectColor(el) { return (el && el.effectColor) || "#000000"; }

// CSS for the text node ({} when no effect). Pure.
export function effectCss(el) {
  const c = effectColor(el);
  switch (el && el.effect) {
    case "shadow": return { textShadow: "3px 3px 0 " + c };
    case "glow":   return { textShadow: "0 0 8px " + c + ", 0 0 18px " + c };
    default:       return {};
  }
}

// Canvas shadow params for the export, or null. Pure.
export function effectShadow(el) {
  const c = effectColor(el);
  switch (el && el.effect) {
    case "shadow": return { color: c, blur: 0, dx: 3, dy: 3 };
    case "glow":   return { color: c, blur: 14, dx: 0, dy: 0 };
    default:       return null;
  }
}
