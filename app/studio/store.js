// ============================================================================
// Studio reducer. Pure. Immutable updates that touch ONLY the changed element
// (and the slim path to it), so a memoized <Element> re-renders solely when its
// own object identity changes — i.e. dragging one element never re-renders the
// others. This isolation is the whole fix for the old monolith's re-render OOM.
//
// History (undo/redo) wraps the pure doc reducer: every mutation snapshots the
// previous doc onto `past`. A continuous drag/resize fires many "update" actions
// — those coalesce into ONE undo step via `lastTag` + a `commit` boundary the
// Artboard dispatches when a drag ends. Selection/navigation are not undoable.
// ============================================================================
import { sampleDoc, blankSlide, cloneSlide, makeElement, uid, ARTBOARD_W } from "./model";
import { reflowSlide, cautionElement, closerTemplate, deriveContent } from "./templates";
import { brandFromStyle } from "./styles";

const HISTORY_CAP = 80; // bound memory: keep the most recent N undo frames

export function initStudio() {
  return {
    doc: sampleDoc(),
    slideIndex: 0,
    selectedId: null,
    editingId: null,
    past: [],
    future: [],
    lastTag: null,
  };
}

function withSlide(state, fn) {
  const slides = state.doc.slides.map((s, i) => (i === state.slideIndex ? fn(s) : s));
  return Object.assign({}, state, { doc: Object.assign({}, state.doc, { slides }) });
}

function patchEl(slide, id, patch) {
  return Object.assign({}, slide, {
    elements: slide.elements.map((e) => (e.id === id ? Object.assign({}, e, patch) : e)),
  });
}

function withDoc(state, slides, slideIndex) {
  return Object.assign({}, state, {
    doc: Object.assign({}, state.doc, { slides }),
    slideIndex: slideIndex == null ? state.slideIndex : slideIndex,
    selectedId: null,
    editingId: null,
  });
}

// --- Brand helpers (pure, doc-level) ---------------------------------------
// Re-theme a doc by remapping every element whose look still matches brand
// `prev` over to brand `next`: accent rect fills, text colors (ink-first, so a
// monochrome family like Enterprise sends body text to ink not accent), fonts,
// the wordmark text, and the solid background color. Elements the user pushed
// off-brand don't match `prev`, so they're left alone. Shared by the applyBrand
// action and the regenerate brand-carry.
export function rethemeDoc(doc, prev, next) {
  const b = next || {}, p = prev || {};
  const COLORS = ["ink", "sub", "muted", "accent"];
  const remapEl = (e) => {
    let n = e;
    if (e.type === "rect" && b.accent && p.accent && e.fill === p.accent) n = Object.assign({}, n, { fill: b.accent });
    if (e.type === "text") {
      for (const k of COLORS) {
        if (b[k] && p[k] && e.color === p[k]) { n = Object.assign({}, n, { color: b[k] }); break; }
      }
      if (b.headFont && p.headFont && n.fontFamily === p.headFont) n = Object.assign({}, n, { fontFamily: b.headFont });
      else if (b.bodyFont && p.bodyFont && n.fontFamily === p.bodyFont) n = Object.assign({}, n, { fontFamily: b.bodyFont });
      if (b.wordmark && p.wordmark && n.content === p.wordmark) n = Object.assign({}, n, { content: b.wordmark });
    }
    return n;
  };
  const slides = doc.slides.map((s) => {
    const elements = s.elements.map(remapEl);
    let background = s.background;
    if (b.bg && p.bg && background && background.color === p.bg) background = Object.assign({}, background, { color: b.bg });
    return Object.assign({}, s, { elements, background });
  });
  return Object.assign({}, doc, { brand: b, slides });
}

// Stamp/replace/remove the brand logo on a doc's bookend slides (cover = first,
// closer = last). Strips any prior logo from EVERY slide first, then re-adds it
// to the bookends as a draggable, role-tagged image. `null`/empty clears it.
export function stampLogo(doc, logo) {
  const lg = logo && logo.src ? logo : null;
  const n = doc.slides.length;
  const onBookend = (i) => i === 0 || i === n - 1;
  const slides = doc.slides.map((s, i) => {
    const els = (s.elements || []).filter((e) => e.role !== "logo");
    if (lg && onBookend(i)) {
      els.push(makeElement("image", {
        id: uid("logo"), role: "logo", src: lg.src, thumb: lg.src,
        x: ARTBOARD_W - 80 - lg.w, y: 60, w: lg.w, h: lg.h, fit: "contain", radius: 0,
      }));
    }
    return Object.assign({}, s, { elements: els });
  });
  return Object.assign({}, doc, { slides, brand: Object.assign({}, doc.brand, { logo: lg }) });
}

// Carry a user's brand kit from the previous deck onto a freshly generated one.
// Only brand fields the user changed FROM the previous style's defaults are
// carried, so choosing a NEW style still adopts that style's look — just the
// deliberate overrides (a custom palette, fonts, wordmark) ride along. The logo
// always carries, since it's never a style default. Pure; returns newDoc
// unchanged when there's nothing to carry (first generation, or an untouched
// previous brand), so the common path is a no-op.
export function carryBrandKit(newDoc, prevDoc) {
  const prevBrand = prevDoc && prevDoc.brand;
  if (!prevBrand) return newDoc;
  const prevStyle = (prevDoc.slides && prevDoc.slides[0] && prevDoc.slides[0].style) || "editorial";
  const defaults = brandFromStyle(prevStyle);
  const FIELDS = ["accent", "bg", "ink", "sub", "muted", "headFont", "bodyFont", "wordmark"];
  const custom = {};
  for (const k of FIELDS) {
    if (prevBrand[k] != null && prevBrand[k] !== defaults[k]) custom[k] = prevBrand[k];
  }
  const logo = prevBrand.logo && prevBrand.logo.src ? prevBrand.logo : null;
  if (!Object.keys(custom).length && !logo) return newDoc;
  let out = newDoc;
  if (Object.keys(custom).length) out = rethemeDoc(out, newDoc.brand, Object.assign({}, newDoc.brand, custom));
  if (logo) out = stampLogo(out, logo);
  return out;
}

// Pure doc/selection transitions. No history bookkeeping — the wrapper adds it.
function docReducer(state, a) {
  switch (a.type) {
    case "select":
      return Object.assign({}, state, {
        selectedId: a.id,
        editingId: state.editingId === a.id ? state.editingId : null,
      });
    case "deselect":
      return Object.assign({}, state, { selectedId: null, editingId: null });
    case "edit":
      return Object.assign({}, state, { selectedId: a.id, editingId: a.id });
    case "endEdit":
      return Object.assign({}, state, { editingId: null });
    case "update":
      return withSlide(state, (s) => patchEl(s, a.id, a.patch));
    case "delete":
      return Object.assign({}, withSlide(state, (s) => ({
        ...s,
        elements: s.elements.filter((e) => e.id !== a.id),
      })), { selectedId: null, editingId: null });
    case "add":
      return Object.assign({}, withSlide(state, (s) => ({
        ...s,
        elements: s.elements.concat([a.element]),
      })), { selectedId: a.element.id });
    case "raise":
    case "lower": {
      return withSlide(state, (s) => {
        const idx = s.elements.findIndex((e) => e.id === a.id);
        if (idx < 0) return s;
        const arr = s.elements.slice();
        const to = a.type === "raise" ? Math.min(arr.length - 1, idx + 1) : Math.max(0, idx - 1);
        const [el] = arr.splice(idx, 1);
        arr.splice(to, 0, el);
        return Object.assign({}, s, { elements: arr });
      });
    }
    case "setBg":
      return withSlide(state, (s) => Object.assign({}, s, {
        background: Object.assign({}, s.background, a.patch),
      }));
    case "addSlide": {
      const slides = state.doc.slides.concat([a.slide || blankSlide()]);
      return withDoc(state, slides, slides.length - 1);
    }
    case "duplicateSlide": {
      const i = a.index == null ? state.slideIndex : a.index;
      const src = state.doc.slides[i];
      if (!src) return state;
      const slides = state.doc.slides.slice();
      slides.splice(i + 1, 0, cloneSlide(src));
      return withDoc(state, slides, i + 1);
    }
    case "deleteSlide": {
      if (state.doc.slides.length <= 1) return state; // always keep at least one
      const i = a.index == null ? state.slideIndex : a.index;
      if (i < 0 || i >= state.doc.slides.length) return state;
      const slides = state.doc.slides.filter((_, idx) => idx !== i);
      return withDoc(state, slides, Math.max(0, Math.min(i, slides.length - 1)));
    }
    case "moveSlide": {
      const { from, to } = a;
      const n = state.doc.slides.length;
      if (from == null || to == null || from === to || from < 0 || from >= n || to < 0 || to >= n) return state;
      const slides = state.doc.slides.slice();
      const [s] = slides.splice(from, 1);
      slides.splice(to, 0, s);
      return withDoc(state, slides, to);
    }
    case "applyBrand":
      // Deck-wide re-theme: remap elements matching the previous brand to the new
      // one (see rethemeDoc). Elements the user edited off-brand are left alone.
      return Object.assign({}, state, { doc: rethemeDoc(state.doc, a.prev || {}, a.brand || {}) });
    case "setLogo":
      // Brand bookend: stamp the logo on the cover + closing slides only (see
      // stampLogo). After placement it's a normal, draggable element.
      return Object.assign({}, state, { doc: stampLogo(state.doc, a.logo) });
    case "setCaution": {
      // Caution label lives on the closing slide (last). Replace/clear the
      // role-tagged element; empty text removes it. Records the text on the brand
      // so the panel reads it and it survives unrelated edits.
      const text = (a.text || "").trim();
      const last = state.doc.slides.length - 1;
      const slides = state.doc.slides.map((s, i) => {
        if (i !== last) return s;
        const els = (s.elements || []).filter((e) => e.role !== "caution");
        if (text) {
          const hasImage = !!(s.background && s.background.type === "image");
          els.push(cautionElement(s.style || "editorial", text, hasImage, state.doc.brand));
        }
        return Object.assign({}, s, { elements: els });
      });
      const brand = Object.assign({}, state.doc.brand, { caution: text });
      return Object.assign({}, state, { doc: Object.assign({}, state.doc, { slides, brand }) });
    }
    case "setLayout": {
      // Re-flow a slide's stored/derived content through a new layout. Explicit,
      // never automatic — so manual edits persist until the user picks a layout.
      // reflowSlide moves the photo between background<->feature element as needed
      // and preserves manual backgrounds for non-feature re-flows (see templates.js).
      const relayout = (s) => Object.assign({}, s, reflowSlide(s, a.layout, state.doc.brand));
      const slides = a.all
        ? state.doc.slides.map(relayout)
        : state.doc.slides.map((s, idx) => (idx === (a.index == null ? state.slideIndex : a.index) ? relayout(s) : s));
      return Object.assign({}, state, { doc: Object.assign({}, state.doc, { slides }), selectedId: null, editingId: null });
    }
    case "resetSlideToBrand": {
      // Re-skin a slide (or all) to the deck's current brand by re-rendering it
      // from its own content + layout — the explicit, undoable escape hatch for a
      // slide that drifted off-brand. Manual element tweaks on that slide are
      // discarded (that's the point), but the brand logo is carried through.
      const brand = state.doc.brand;
      const reset = (s) => {
        const logos = (s.elements || []).filter((e) => e.role === "logo");
        let r;
        if ((s.layout || "") === "closer") {
          const content = s.content || deriveContent(s);
          const image = s.background && s.background.type === "image"
            ? { url: s.background.src, thumb: s.background.thumb, credit: s.background.credit, source: s.background.source }
            : null;
          const rebuilt = closerTemplate(content, s.style || "editorial", image, (brand && brand.caution) || "", brand);
          r = { elements: rebuilt.elements, background: rebuilt.background };
        } else {
          r = reflowSlide(s, s.layout || "classic", brand);
        }
        return Object.assign({}, s, r, { elements: r.elements.concat(logos) });
      };
      const slides = a.all
        ? state.doc.slides.map(reset)
        : state.doc.slides.map((s, idx) => (idx === (a.index == null ? state.slideIndex : a.index) ? reset(s) : s));
      return Object.assign({}, state, { doc: Object.assign({}, state.doc, { slides }), selectedId: null, editingId: null });
    }
    case "setSlide":
      return Object.assign({}, state, { slideIndex: a.index, selectedId: null, editingId: null });
    default:
      return state;
  }
}

// Actions that change the document (undoable) vs. interaction boundaries that
// just reset the coalescing tag so the next edit starts a fresh undo step.
const MUTATES = { add: 1, update: 1, delete: 1, setBg: 1, raise: 1, lower: 1, addSlide: 1, duplicateSlide: 1, deleteSlide: 1, moveSlide: 1, applyBrand: 1, setLogo: 1, setCaution: 1, setLayout: 1, resetSlideToBrand: 1 };
const BOUNDARY = { select: 1, deselect: 1, edit: 1, endEdit: 1, setSlide: 1 };

function snap(state) {
  return { doc: state.doc, slideIndex: state.slideIndex };
}

export function reducer(state, a) {
  switch (a.type) {
    case "undo": {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return Object.assign({}, state, {
        doc: prev.doc,
        slideIndex: Math.max(0, Math.min(prev.slideIndex, prev.doc.slides.length - 1)),
        past: state.past.slice(0, -1),
        future: [snap(state)].concat(state.future),
        selectedId: null, editingId: null, lastTag: null,
      });
    }
    case "redo": {
      if (!state.future.length) return state;
      const nxt = state.future[0];
      return Object.assign({}, state, {
        doc: nxt.doc,
        slideIndex: Math.max(0, Math.min(nxt.slideIndex, nxt.doc.slides.length - 1)),
        past: state.past.concat([snap(state)]),
        future: state.future.slice(1),
        selectedId: null, editingId: null, lastTag: null,
      });
    }
    case "loadDoc":
      // A new document is a fresh history.
      return { doc: a.doc, slideIndex: 0, selectedId: null, editingId: null, past: [], future: [], lastTag: null };
    case "commit":
      return state.lastTag == null ? state : Object.assign({}, state, { lastTag: null });
    default:
      break;
  }

  const next = docReducer(state, a);
  if (next === state) return state;

  if (MUTATES[a.type]) {
    const tag = a.type === "update" ? "update:" + a.id : null;
    if (tag && state.lastTag === tag) {
      // coalesce a continuous drag/resize of one element into a single undo step
      return Object.assign({}, next, { future: [], lastTag: tag });
    }
    let past = state.past.concat([snap(state)]);
    if (past.length > HISTORY_CAP) past = past.slice(past.length - HISTORY_CAP);
    return Object.assign({}, next, { past, future: [], lastTag: tag });
  }

  if (BOUNDARY[a.type]) {
    return state.lastTag == null ? next : Object.assign({}, next, { lastTag: null });
  }
  return next;
}
