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
  // `thumb` is a small (<=~400px) variant of `src`. Off-screen slide thumbnails
  // render `thumb` so navigating a deck never decodes a second full-res image
  // (FLAT-LAYERS §3). Empty `thumb` falls back to a neutral placeholder there.
  image: { src: "", thumb: "", fit: "cover", opacity: 1, radius: 0 },
  rect: { fill: "#e23744", stroke: "none", strokeWidth: 0, radius: 0, opacity: 1 },
  line: { fill: "#ffffff", opacity: 1 },
  // A text element may also wear a SHAPE backing (bubble / banner / tag / burst /
  // …) — see shapes.js. The shape lives on the text element as `shape` (variant
  // id) + `shapeFill` + `tailSide`; it is not a separate element type.
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

// An empty slide on a solid background, ready for elements.
export function blankSlide() {
  return {
    id: uid("slide"),
    w: ARTBOARD_W,
    h: ARTBOARD_H,
    background: { type: "color", color: "#0c0c0c" },
    elements: [],
  };
}

// A fresh single-slide document for "start from blank".
export function blankDoc() {
  return { id: uid("doc"), slides: [blankSlide()] };
}

// Deep-ish copy of a slide with fresh ids (slide + every element), for the
// strip's "duplicate". Background is a shallow copy (its fields are primitives).
export function cloneSlide(slide) {
  return {
    id: uid("slide"),
    w: slide.w,
    h: slide.h,
    background: Object.assign({}, slide.background),
    elements: (slide.elements || []).map((e) => Object.assign({}, e, { id: uid(e.type || "el") })),
  };
}

// Build a FLAT-LAYERS-safe image background from a Photos-panel search result.
// One decoded image (`src`, pre-capped server-side) + at most one scrim overlay
// (a single rgba layer baked in Artboard) + a small `thumb` for the strip. No
// stacked compositing — this is the only shape a photo background may take (§3).
export function imageBackground(img, scrim) {
  return {
    type: "image",
    src: img.url || "",
    thumb: img.thumb || img.url || "",
    scrim: scrim == null ? 0.4 : scrim,
    color: "#0c0c0c",
    credit: img.credit || "",
    source: img.source || "",
  };
}

// A Photos-panel result built from a user UPLOAD (vs. a web search). Same shape
// a search result has — `url` (full) + `thumb` (small) as same-origin dataURLs —
// so it flows through the exact same set-background / add-to-slide handlers and
// keeps the FLAT-LAYERS invariant (one capped image + a thumb; see PhotosPanel's
// readUploadFile, which downscales before calling this). `uploaded` flags the
// card badge; no credit line for own uploads.
export function uploadResult(src, thumb, name) {
  return { url: src, thumb: thumb || src, uploaded: true, source: "Upload", credit: "", alt: name || "" };
}

// Non-destructive image crop → the source rectangle {sx,sy,sw,sh} of the natural
// image to draw into the element box. crop = { zoom>=1, x, y } where x/y are the
// focal point 0..1 (0.5 = centred). Mirrors the CSS object-fit:cover +
// object-position + scale used by the live/thumbnail renderers, so the PNG export
// matches. Pure.
export function cropRect(natW, natH, boxW, boxH, crop) {
  const z = Math.max(1, (crop && crop.zoom) || 1);
  const fx = crop && crop.x != null ? crop.x : 0.5;
  const fy = crop && crop.y != null ? crop.y : 0.5;
  const coverScale = Math.max(boxW / natW, boxH / natH);
  let sw = Math.min(natW, boxW / coverScale);
  let sh = Math.min(natH, boxH / coverScale);
  const sw2 = sw / z, sh2 = sh / z;                 // zoom shrinks the source window
  const sx = (natW - sw) * fx + (sw - sw2) * fx;    // object-position pan + zoom focal
  const sy = (natH - sh) * fy + (sh - sh2) * fy;
  return { sx, sy, sw: sw2, sh: sh2 };
}

// CSS transform/filter for an image element (crop zoom+focal · flip · mono),
// shared by the live editor and the thumbnail so they match the export. Pure.
export function imageTransform(el) {
  const z = Math.max(1, (el.crop && el.crop.zoom) || 1);
  const fx = el.crop && el.crop.x != null ? el.crop.x : 0.5;
  const fy = el.crop && el.crop.y != null ? el.crop.y : 0.5;
  const out = {};
  if (z !== 1 || el.flipX || el.flipY) {
    out.transform = "scaleX(" + (el.flipX ? -z : z) + ") scaleY(" + (el.flipY ? -z : z) + ")";
    out.transformOrigin = (fx * 100) + "% " + (fy * 100) + "%";
  }
  if (el.crop) out.objectPosition = (fx * 100) + "% " + (fy * 100) + "%";
  if (el.mono) out.filter = "grayscale(1)";
  return out;
}

// --- selectors / helpers --------------------------------------------------
export function findElement(slide, id) {
  if (!slide || !id) return null;
  for (let i = 0; i < slide.elements.length; i++) {
    if (slide.elements[i].id === id) return slide.elements[i];
  }
  return null;
}

// Split a text element's content around the FIRST (case-insensitive) occurrence
// of `highlight`, preserving the original casing. Returns [{text, hl}] runs — one
// run when there's no match, so callers can render plain. Pure; shared by the
// live canvas, the static/preview renderer, and the PNG export so the emphasis
// looks identical everywhere.
export function highlightRuns(content, highlight) {
  const text = content == null ? "" : String(content);
  const hl = highlight == null ? "" : String(highlight);
  if (!hl) return [{ text, hl: false }];
  const i = text.toLowerCase().indexOf(hl.toLowerCase());
  if (i < 0) return [{ text, hl: false }];
  const runs = [];
  if (i > 0) runs.push({ text: text.slice(0, i), hl: false });
  runs.push({ text: text.slice(i, i + hl.length), hl: true });
  if (i + hl.length < text.length) runs.push({ text: text.slice(i + hl.length), hl: false });
  return runs;
}

// ============================================================================
// Rich text RUNS — per-character styling within one text element.
//
// A text element keeps its plain `content` string (so every existing reader,
// the AI output, captions, search, etc. are untouched) PLUS an optional
// `el.runs` = sorted character-range overrides: [{ start, end, ...style }].
// Each run carries only the keys it overrides; everything else inherits the
// element-level style. This is the model behind selecting a word and recolouring
// / bolding / striking / highlighting / outlining just that span — and it is the
// generalisation of the single `highlight` marker (which is folded in here for
// back-compat). Pure + unit-tested; the three renderers consume `styledRuns`.
// ============================================================================

// The style keys a run (or the element base) may carry. Booleans (bold/italic/
// strike) are tri-state in a run: true / false / absent(inherit).
export const RUN_STYLE_KEYS = ["color", "bold", "italic", "strike", "strikeColor", "bg", "stroke", "strokeWidth", "size"];

// Offsets of the first case-insensitive occurrence of `hl` in `text`, or null.
export function highlightOffsets(text, hl) {
  const t = text == null ? "" : String(text);
  const h = hl == null ? "" : String(hl);
  if (!h) return null;
  const i = t.toLowerCase().indexOf(h.toLowerCase());
  return i < 0 ? null : { start: i, end: i + h.length };
}

// The element's base (no-override) style, resolved to concrete render values.
export function elementBaseStyle(el) {
  const e = el || {};
  return {
    color: e.color || "#ffffff",
    fontWeight: e.fontWeight || 400,
    italic: !!e.italic,
    strike: !!e.strike,
    strikeColor: e.strikeColor || null,
    bg: e.textBg || null,
    stroke: e.textStroke || null,
    strokeWidth: e.textStrokeWidth || 0,
    fontSize: e.fontSize || 64,
  };
}

// Copy a run's defined style keys onto an accumulator (per-char overlay merge).
function mergeStyle(prev, run) {
  const out = Object.assign({}, prev || null);
  for (const k of RUN_STYLE_KEYS) if (run[k] != null) out[k] = run[k];
  return out;
}

// Resolve a per-char override (or null) against the element base → render style.
function resolveStyle(base, ov) {
  const o = ov || {};
  const color = o.color != null ? o.color : base.color;
  return {
    color,
    fontWeight: o.bold != null ? (o.bold ? 700 : 400) : base.fontWeight,
    italic: o.italic != null ? !!o.italic : base.italic,
    strike: o.strike != null ? !!o.strike : base.strike,
    strikeColor: o.strikeColor != null ? o.strikeColor : (base.strikeColor || color),
    bg: o.bg != null ? o.bg : base.bg,
    stroke: o.stroke != null ? o.stroke : base.stroke,
    strokeWidth: o.strokeWidth != null ? o.strokeWidth : base.strokeWidth,
    fontSize: o.size != null ? o.size : base.fontSize,
  };
}

const styleKey = (s) => s.color + "|" + s.fontWeight + "|" + s.italic + "|" + s.strike + "|" + (s.strikeColor || "") + "|" + (s.bg || "") + "|" + (s.stroke || "") + "|" + s.strokeWidth + "|" + s.fontSize;

// Build the per-character override overlay for a text element: an array (length
// = content length) of override objects (or null). Folds in the back-compat
// `highlight` marker first (lowest precedence) then `el.runs` (so an explicit
// run wins over the derived marker on overlap).
function charOverrides(el) {
  const content = el && el.content != null ? String(el.content) : "";
  const n = content.length;
  const ov = new Array(n).fill(null);
  const sources = [];
  if (el && el.highlight && el.highlightColor) {
    const h = highlightOffsets(content, el.highlight);
    if (h) sources.push({ start: h.start, end: h.end, bg: el.highlightColor, color: el.highlightText || undefined });
  }
  if (el && Array.isArray(el.runs)) for (const r of el.runs) sources.push(r);
  for (const r of sources) {
    const s = Math.max(0, Math.min(n, r.start | 0));
    const e = Math.max(0, Math.min(n, r.end | 0));
    for (let i = s; i < e; i++) ov[i] = mergeStyle(ov[i], r);
  }
  return { content, ov };
}

// Group a per-char override overlay into contiguous {start, end, ...style} runs,
// dropping ranges whose overlay is empty/null. Normalises overlapping/adjacent
// input into the canonical stored form.
function overlayToRuns(ov) {
  const runs = [];
  let i = 0;
  const key = (o) => (o ? RUN_STYLE_KEYS.map((k) => (o[k] == null ? "" : o[k])).join("") : "");
  while (i < ov.length) {
    if (!ov[i] || !Object.keys(ov[i]).length) { i++; continue; }
    const k = key(ov[i]);
    let j = i + 1;
    while (j < ov.length && key(ov[j]) === k) j++;
    runs.push(Object.assign({ start: i, end: j }, ov[i]));
    i = j;
  }
  return runs;
}

// The element's content split into contiguous, fully-resolved style spans that
// cover the WHOLE string — what the renderers draw. One span when there are no
// runs/marker. Each span: { text, color, fontWeight, italic, strike, strikeColor,
// bg, stroke, strokeWidth }.
export function styledRuns(el) {
  const base = elementBaseStyle(el);
  const { content, ov } = charOverrides(el);
  if (!content.length) return [];
  const spans = [];
  let i = 0;
  while (i < content.length) {
    const eff = resolveStyle(base, ov[i]);
    const k = styleKey(eff);
    let j = i + 1;
    while (j < content.length && styleKey(resolveStyle(base, ov[j])) === k) j++;
    spans.push(Object.assign({ text: content.slice(i, j) }, eff));
    i = j;
  }
  return spans;
}

// The content split into contiguous segments carrying their OVERRIDE style only
// (the run's own keys, not merged with the base) — what the contentEditable
// serializes to spans so reading the DOM back recovers the runs exactly. A
// segment with an empty style is plain (a bare text node). Pure.
export function runSegments(content, runs) {
  const text = content == null ? "" : String(content);
  const n = text.length;
  const ov = new Array(n).fill(null);
  for (const r of (runs || [])) {
    const s = Math.max(0, Math.min(n, r.start | 0));
    const e = Math.max(0, Math.min(n, r.end | 0));
    for (let i = s; i < e; i++) ov[i] = mergeStyle(ov[i], r);
  }
  const segs = [];
  const key = (o) => (o ? RUN_STYLE_KEYS.map((k) => (o[k] == null ? "" : o[k])).join("|") : "");
  let i = 0;
  while (i < n) {
    const k = key(ov[i]);
    let j = i + 1;
    while (j < n && key(ov[j]) === k) j++;
    const style = {};
    if (ov[i]) for (const kk of RUN_STYLE_KEYS) if (ov[i][kk] != null) style[kk] = ov[i][kk];
    segs.push({ text: text.slice(i, j), style });
    i = j;
  }
  return segs;
}

// Group a per-character overlay array (override objects or null) into normalised
// {start,end,...style} runs — exposed so the DOM reader can rebuild clean runs.
export function overlayToRunsPublic(ov) { return overlayToRuns(ov); }

// True when the element renders as one uniform span carrying no inline-only
// decoration (background / outline) — i.e. the container's own CSS fully covers
// it, so the renderer can fast-path to the raw string (current behaviour).
export function isUniformText(el) {
  if ((el && Array.isArray(el.runs) && el.runs.length) || (el && el.highlight && el.highlightColor)) return false;
  const b = elementBaseStyle(el);
  return !b.bg && !b.stroke;
}

// Apply a style `patch` to the character range [start, end) of a text element,
// returning the new normalised runs array. A patch value of null CLEARS that key
// in the range (so toggling bold off, or clearing a colour, works). Pure.
export function applyRunStyle(content, runs, start, end, patch) {
  const text = content == null ? "" : String(content);
  const n = text.length;
  const ov = new Array(n).fill(null);
  for (const r of (runs || [])) {
    const s = Math.max(0, Math.min(n, r.start | 0));
    const e = Math.max(0, Math.min(n, r.end | 0));
    for (let i = s; i < e; i++) ov[i] = mergeStyle(ov[i], r);
  }
  const a = Math.max(0, Math.min(n, start | 0));
  const b = Math.max(a, Math.min(n, end | 0));
  for (let i = a; i < b; i++) {
    const cur = Object.assign({}, ov[i] || null);
    for (const k of Object.keys(patch || {})) {
      if (patch[k] == null) delete cur[k];
      else cur[k] = patch[k];
    }
    ov[i] = Object.keys(cur).length ? cur : null;
  }
  return overlayToRuns(ov);
}

// Remove ALL run styling in [start, end). Pure.
export function clearRunStyle(content, runs, start, end) {
  const text = content == null ? "" : String(content);
  const n = text.length;
  const ov = new Array(n).fill(null);
  for (const r of (runs || [])) {
    const s = Math.max(0, Math.min(n, r.start | 0));
    const e = Math.max(0, Math.min(n, r.end | 0));
    for (let i = s; i < e; i++) ov[i] = mergeStyle(ov[i], r);
  }
  const a = Math.max(0, Math.min(n, start | 0));
  const b = Math.max(a, Math.min(n, end | 0));
  for (let i = a; i < b; i++) ov[i] = null;
  return overlayToRuns(ov);
}

// Re-map runs after the content text changed (an edit), keeping styling attached
// to the letters that survived. Uses a common prefix/suffix diff: styling on the
// unchanged head and tail is preserved; the changed middle (and any inserted
// text) comes back unstyled. Pure — the robust-enough remap so styling "sticks"
// through typing without a full DOM diff.
export function remapRuns(runs, oldContent, newContent) {
  if (!runs || !runs.length) return [];
  const oldT = oldContent == null ? "" : String(oldContent);
  const newT = newContent == null ? "" : String(newContent);
  if (oldT === newT) return runs.slice();
  const oldN = oldT.length, newN = newT.length;
  let p = 0;
  while (p < oldN && p < newN && oldT[p] === newT[p]) p++;
  let s = 0;
  while (s < (oldN - p) && s < (newN - p) && oldT[oldN - 1 - s] === newT[newN - 1 - s]) s++;
  // old overlay
  const oldOv = new Array(oldN).fill(null);
  for (const r of runs) {
    const a = Math.max(0, Math.min(oldN, r.start | 0));
    const b = Math.max(0, Math.min(oldN, r.end | 0));
    for (let i = a; i < b; i++) oldOv[i] = mergeStyle(oldOv[i], r);
  }
  const newOv = new Array(newN).fill(null);
  for (let i = 0; i < p && i < newN; i++) newOv[i] = oldOv[i];                       // preserved head
  for (let i = 0; i < s; i++) newOv[newN - 1 - i] = oldOv[oldN - 1 - i];             // preserved tail
  return overlayToRuns(newOv);
}
