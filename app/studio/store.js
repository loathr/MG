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
import { sampleDoc, blankSlide, cloneSlide } from "./model";
import { renderLayout, deriveContent } from "./templates";

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
    case "applyBrand": {
      // Deck-wide re-theme: swap elements whose look matches the previous brand
      // (accent / fonts / wordmark) to the new brand. Elements the user edited to
      // something off-brand are left alone. Records the new brand on the doc.
      const prev = a.prev || {};
      const b = a.brand || {};
      // Text color remap, ink-first. For families with distinct ink/accent
      // (editorial, bold) order is irrelevant; for the monochrome minimal family
      // (accent === ink) ink-first sends body text to the new ink rather than the
      // accent, so a palette swap stays readable instead of going all-accent.
      const COLORS = ["ink", "sub", "muted", "accent"];
      const remapEl = (e) => {
        let n = e;
        if (e.type === "rect" && b.accent && prev.accent && e.fill === prev.accent) {
          n = Object.assign({}, n, { fill: b.accent });
        }
        if (e.type === "text") {
          for (const k of COLORS) {
            if (b[k] && prev[k] && e.color === prev[k]) { n = Object.assign({}, n, { color: b[k] }); break; }
          }
          if (b.headFont && prev.headFont && n.fontFamily === prev.headFont) n = Object.assign({}, n, { fontFamily: b.headFont });
          else if (b.bodyFont && prev.bodyFont && n.fontFamily === prev.bodyFont) n = Object.assign({}, n, { fontFamily: b.bodyFont });
          if (b.wordmark && prev.wordmark && n.content === prev.wordmark) n = Object.assign({}, n, { content: b.wordmark });
        }
        return n;
      };
      const slides = state.doc.slides.map((s) => {
        const elements = s.elements.map(remapEl);
        // Re-theme the solid background too (the color behind photos as well), so
        // a palette's background follows the deck. Leaves custom backgrounds alone.
        let background = s.background;
        if (b.bg && prev.bg && background && background.color === prev.bg) {
          background = Object.assign({}, background, { color: b.bg });
        }
        return Object.assign({}, s, { elements, background });
      });
      return Object.assign({}, state, { doc: Object.assign({}, state.doc, { brand: b, slides }) });
    }
    case "setLayout": {
      // Re-flow a slide's stored/derived content through a new layout. Explicit,
      // never automatic — so manual edits persist until the user picks a layout.
      const relayout = (s) => {
        const content = s.content || deriveContent(s);
        const style = s.style || "editorial";
        const hasImage = !!(s.background && s.background.type === "image");
        return Object.assign({}, s, {
          elements: renderLayout(a.layout, content, style, hasImage),
          layout: a.layout,
          content,
        });
      };
      const slides = a.all
        ? state.doc.slides.map(relayout)
        : state.doc.slides.map((s, idx) => (idx === (a.index == null ? state.slideIndex : a.index) ? relayout(s) : s));
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
const MUTATES = { add: 1, update: 1, delete: 1, setBg: 1, raise: 1, lower: 1, addSlide: 1, duplicateSlide: 1, deleteSlide: 1, moveSlide: 1, applyBrand: 1, setLayout: 1 };
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
