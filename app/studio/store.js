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
      const remapEl = (e) => {
        let n = e;
        if (b.accent && prev.accent) {
          if (e.type === "rect" && e.fill === prev.accent) n = Object.assign({}, n, { fill: b.accent });
          else if (e.type === "text" && e.color === prev.accent) n = Object.assign({}, n, { color: b.accent });
        }
        if (e.type === "text") {
          if (b.headFont && prev.headFont && n.fontFamily === prev.headFont) n = Object.assign({}, n, { fontFamily: b.headFont });
          else if (b.bodyFont && prev.bodyFont && n.fontFamily === prev.bodyFont) n = Object.assign({}, n, { fontFamily: b.bodyFont });
          if (b.wordmark && prev.wordmark && n.content === prev.wordmark) n = Object.assign({}, n, { content: b.wordmark });
        }
        return n;
      };
      const slides = state.doc.slides.map((s) => Object.assign({}, s, { elements: s.elements.map(remapEl) }));
      return Object.assign({}, state, { doc: Object.assign({}, state.doc, { brand: b, slides }) });
    }
    case "setSlide":
      return Object.assign({}, state, { slideIndex: a.index, selectedId: null, editingId: null });
    default:
      return state;
  }
}

// Actions that change the document (undoable) vs. interaction boundaries that
// just reset the coalescing tag so the next edit starts a fresh undo step.
const MUTATES = { add: 1, update: 1, delete: 1, setBg: 1, raise: 1, lower: 1, addSlide: 1, duplicateSlide: 1, deleteSlide: 1, moveSlide: 1, applyBrand: 1 };
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
