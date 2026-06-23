// ============================================================================
// Studio reducer. Pure. Immutable updates that touch ONLY the changed element
// (and the slim path to it), so a memoized <Element> re-renders solely when its
// own object identity changes — i.e. dragging one element never re-renders the
// others. This isolation is the whole fix for the old monolith's re-render OOM.
// ============================================================================
import { sampleDoc, blankSlide, cloneSlide } from "./model";

export function initStudio(initial) {
  const doc = (initial && initial.doc) || sampleDoc();
  return {
    doc,
    name: (initial && initial.name) || "Untitled carousel",
    slideIndex: 0,
    selectedId: null,
    editingId: null,
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

export function reducer(state, a) {
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
    case "loadDoc":
      return Object.assign({}, state, {
        doc: a.doc,
        name: a.name || state.name,
        slideIndex: 0,
        selectedId: null,
        editingId: null,
      });
    case "setSlide": {
      const n = state.doc.slides.length;
      const index = Math.max(0, Math.min(n - 1, a.index));
      return Object.assign({}, state, { slideIndex: index, selectedId: null, editingId: null });
    }
    case "setName":
      return Object.assign({}, state, { name: a.name });
    case "addSlide": {
      // Insert a fresh blank slide after the current one and jump to it.
      const slides = state.doc.slides.slice();
      const at = state.slideIndex + 1;
      slides.splice(at, 0, blankSlide());
      return Object.assign({}, state, {
        doc: Object.assign({}, state.doc, { slides }),
        slideIndex: at, selectedId: null, editingId: null,
      });
    }
    case "duplicateSlide": {
      const i = a.index == null ? state.slideIndex : a.index;
      const src = state.doc.slides[i];
      if (!src) return state;
      const slides = state.doc.slides.slice();
      slides.splice(i + 1, 0, cloneSlide(src));
      return Object.assign({}, state, {
        doc: Object.assign({}, state.doc, { slides }),
        slideIndex: i + 1, selectedId: null, editingId: null,
      });
    }
    case "deleteSlide": {
      if (state.doc.slides.length <= 1) return state; // never leave an empty deck
      const i = a.index == null ? state.slideIndex : a.index;
      const slides = state.doc.slides.filter((_, idx) => idx !== i);
      const slideIndex = Math.max(0, Math.min(slides.length - 1, state.slideIndex > i ? state.slideIndex - 1 : state.slideIndex));
      return Object.assign({}, state, {
        doc: Object.assign({}, state.doc, { slides }),
        slideIndex, selectedId: null, editingId: null,
      });
    }
    default:
      return state;
  }
}
