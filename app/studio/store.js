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
import { sampleDoc, blankSlide, cloneSlide, makeElement, uid, ARTBOARD_W, ARTBOARD_H, applyRunStyle, clearRunStyle, remapRuns } from "./model";
import { reflowSlide, cautionElement, frameElements, coverWordmark, footerElements } from "./templates";
import { brandFromStyle } from "./styles";
import { shapeVariant, SHAPE_PAPER, SHAPE_PAPER_INK } from "./shapes";

const HISTORY_CAP = 80; // bound memory: keep the most recent N undo frames

// Brand-chrome roles that are added per-slide-role by slidesToDoc (not by
// renderLayout), so they must be carried over when a slide is re-rendered by a
// layout change or a brand reset — otherwise the cover wordmark, the content
// footer + page number, and the logo vanish.
const CHROME_ROLES = { logo: 1, wordmark: 1, footer: 1, footrule: 1, pageno: 1, frame: 1 };
function carryChrome(slide, patch) {
  const chrome = (slide.elements || []).filter((e) => CHROME_ROLES[e.role]);
  return Object.assign({}, slide, patch, { elements: (patch.elements || []).concat(chrome) });
}

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
    elements: slide.elements.map((e) => {
      if (e.id !== id) return e;
      // Editing the text content re-maps any per-run styling to the new string
      // (styling on the unchanged head/tail survives), unless explicit runs are
      // supplied in the patch. Keeps a word's colour/etc. attached as you type.
      if (patch.content != null && patch.runs === undefined && Array.isArray(e.runs) && e.runs.length) {
        return Object.assign({}, e, patch, { runs: remapRuns(e.runs, e.content, patch.content) });
      }
      return Object.assign({}, e, patch);
    }),
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
      // A text-shape backing whose accent still matches the deck follows a palette
      // swap (paper/knockout shapes carry their own fixed colors, so they don't
      // match prev.accent and are left alone — same idea as the rect fills above).
      if (e.shapeFill && b.accent && p.accent && e.shapeFill === p.accent) n = Object.assign({}, n, { shapeFill: b.accent });
      // B4 Fill/Border overrides follow the accent on a palette swap the same way.
      if (e.shapeBody && b.accent && p.accent && e.shapeBody === p.accent) n = Object.assign({}, n, { shapeBody: b.accent });
      if (e.shapeBorderC && b.accent && p.accent && e.shapeBorderC === p.accent) n = Object.assign({}, n, { shapeBorderC: b.accent });
      // Fonts remap by TIER, not by matching the font string — so each tier moves
      // independently even when two share a face, and untagged brand marks (the
      // LOATHR wordmark / footer / sign-off) keep their Courier font.
      if (e.tier === "label" && b.labelFont) n = Object.assign({}, n, { fontFamily: b.labelFont });
      else if (e.tier === "heading" && b.headFont) n = Object.assign({}, n, { fontFamily: b.headFont });
      else if (e.tier === "body" && b.bodyFont) n = Object.assign({}, n, { fontFamily: b.bodyFont });
      if (b.wordmark && p.wordmark && n.content === p.wordmark) n = Object.assign({}, n, { content: b.wordmark });
      // The inline highlight marker is a DERIVED color pair — its background is the
      // accent and its knockout text is the deck bg — set only by the renderer, with
      // no manual-edit path. So a palette swap must carry it too; otherwise the
      // marker keeps the old accent/bg (the most visible "didn't update" case).
      if (n.highlightColor && b.accent) n = Object.assign({}, n, { highlightColor: b.accent });
      if (n.highlightText && b.bg) n = Object.assign({}, n, { highlightText: b.bg });
      // The cover wordmark's red strike is a derived accent — carry it on a swap.
      if (n.strikeColor && b.accent) n = Object.assign({}, n, { strikeColor: b.accent });
    }
    return n;
  };
  const slides = doc.slides.map((s) => {
    // The deck frame (R4) follows the brand: News Desk uses ink (near-black),
    // every other desk uses the accent. Recolor frame bars unconditionally so a
    // palette swap carries them — they're a derived chrome color with no manual
    // edit path, like the strike/highlight above.
    const style = s.style || "editorial";
    // An explicit deck-wide frame colour wins; else the derived family default
    // (News Desk ink, otherwise accent) — same override as templates.frameElements.
    const frameCol = b.frameColor || (style === "newsdesk" ? b.ink : b.accent);
    const elements = s.elements.map((e) => {
      const n = remapEl(e);
      if (e.role === "frame" && frameCol) return Object.assign({}, n, { fill: frameCol });
      return n;
    });
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
    // Logo wins the cover corner: when a logo is stamped, the cover wordmark steps aside.
    const els = (s.elements || []).filter((e) => e.role !== "logo" && !(lg && i === 0 && e.role === "wordmark"));
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
  const FIELDS = ["accent", "bg", "ink", "sub", "muted", "labelFont", "headFont", "bodyFont", "wordmark"];
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
    case "setShape": {
      // Apply / change / remove a shape backing on a TEXT element (shapes.js).
      // a.shape = variant id to apply, or null to remove. Switching variants
      // resets the shape color to the variant's default (brand accent, or paper
      // for the note). Knockout/paper variants need a contrasting text color, so
      // we stash the prior `color` in `priorColor` and restore it on removal /
      // when switching back to an outline variant.
      const id = a.id || state.selectedId;
      const shape = a.shape || null;
      const accent = (state.doc.brand && state.doc.brand.accent) || "#e23744";
      return withSlide(state, (s) => ({
        ...s,
        elements: s.elements.map((e) => {
          if (e.id !== id || e.type !== "text") return e;
          const n = Object.assign({}, e);
          if (!shape) {
            if (n.priorColor != null) n.color = n.priorColor;
            delete n.shape; delete n.shapeFill; delete n.tailSide; delete n.priorColor;
            delete n.shapeBody; delete n.shapeBorderC;
            return n;
          }
          const v = shapeVariant(shape);
          n.shape = shape;
          n.tailSide = e.tailSide || "left";
          n.shapeFill = v.paper ? SHAPE_PAPER : accent;
          // Drop any prior Fill/Border overrides so a fresh variant starts from
          // its own brand-seeded defaults (B4).
          delete n.shapeBody; delete n.shapeBorderC;
          if (v.paper || v.knockout) {
            if (n.priorColor == null) n.priorColor = e.color;
            n.color = v.paper ? SHAPE_PAPER_INK : "#0c0c0c";
          } else if (n.priorColor != null) {
            n.color = n.priorColor; delete n.priorColor;
          }
          return n;
        }),
      }));
    }
    case "styleText": {
      // Per-run styling: apply (or clear) a style patch over a text element's
      // character range [start, end) — the model behind selecting a word and
      // recolouring / bolding / striking / highlighting / outlining just that
      // span. Pure model helpers do the split/merge; the element keeps its plain
      // content untouched.
      const id = a.id || state.selectedId;
      return withSlide(state, (s) => ({
        ...s,
        elements: s.elements.map((e) => {
          if (e.id !== id || e.type !== "text") return e;
          const runs = a.clear
            ? clearRunStyle(e.content, e.runs, a.start, a.end)
            : applyRunStyle(e.content, e.runs, a.start, a.end, a.patch);
          return Object.assign({}, e, { runs });
        }),
      }));
    }
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
    case "setCaption":
      // The Instagram caption (doc-level post text). Deliberately NOT in MUTATES:
      // caption edits/regenerations shouldn't crowd the canvas undo history.
      return Object.assign({}, state, { doc: Object.assign({}, state.doc, { caption: a.text }) });
    case "setChrome": {
      // Brand · Elements (R2): deck-wide show/hide for the auto brand chrome —
      // the cover wordmark, the running footer (LOATHR), and page numbers. Rebuilt
      // per slide from brand.show so page numbers stay correct: strip the managed
      // roles, then re-add the ones still shown (wordmark on covers; footer rule /
      // LOATHR / page number on content slides). The footrule shows if either the
      // footer or the page number is on.
      const show = Object.assign({ wordmark: true, footer: true, pageno: true }, state.doc.brand.show || {}, { [a.key]: !!a.on });
      const brand = Object.assign({}, state.doc.brand, { show });
      const slides = state.doc.slides;
      const n = slides.length;
      const roleOf = (s) => String((s.content && s.content.role) || s.role || "").toUpperCase();
      let pageNum = 0;
      const next = slides.map((s, i) => {
        const isCover = i === 0 || roleOf(s) === "COVER";
        const isCloser = !isCover && (i === n - 1 || roleOf(s) === "CLOSER" || roleOf(s) === "OUTRO");
        let els = (s.elements || []).filter((e) => e.role !== "wordmark" && e.role !== "footer" && e.role !== "pageno" && e.role !== "footrule");
        const sStyle = s.style || "editorial";
        if (isCover) {
          if (show.wordmark) els = els.concat(coverWordmark(sStyle, brand));
        } else if (!isCloser) {
          pageNum += 1;
          const fe = footerElements(sStyle, pageNum, brand).filter((e) =>
            e.role === "footer" ? show.footer : e.role === "pageno" ? show.pageno : (show.footer || show.pageno),
          );
          els = els.concat(fe);
        }
        return Object.assign({}, s, { elements: els });
      });
      return Object.assign({}, state, { doc: Object.assign({}, state.doc, { slides: next, brand }) });
    }
    case "setFrame": {
      // Per-slide slide frame (R4). Apply to the CURRENT slide by default, or
      // every slide when a.all. Each slide records its own `frame` mode; the bars
      // are role-tagged chrome (carryChrome preserves them across reset/layout;
      // rethemeDoc recolors them on a palette swap). "All slides" also stamps a
      // deck default on the brand.
      const mode = a.frame || "off";
      const brand = state.doc.brand;
      const idx = a.index == null ? state.slideIndex : a.index;
      const applyFrame = (s) => {
        const kept = (s.elements || []).filter((e) => e.role !== "frame");
        const bars = mode === "off" ? [] : frameElements(s.style || "editorial", Object.assign({}, brand, { frame: mode }));
        return Object.assign({}, s, { frame: mode, elements: kept.concat(bars) });
      };
      const slides = state.doc.slides.map((s, i) => (a.all || i === idx ? applyFrame(s) : s));
      const nextBrand = a.all ? Object.assign({}, brand, { frame: mode }) : brand;
      return Object.assign({}, state, { doc: Object.assign({}, state.doc, { slides, brand: nextBrand }) });
    }
    case "detachPhoto": {
      // F1: convert the current slide's image BACKGROUND into a movable/resizable
      // image ELEMENT (full-bleed, behind the existing elements), preserving the
      // scrim as its own editable rect and dropping the background to solid. Keeps
      // §3 — still exactly one decoded raster, now an element instead of the bg,
      // and the element carries a thumb so the off-screen strip stays light. The
      // new photo is selected so its handles + toolbar are immediately usable.
      // No-op when the slide has no image background (e.g. a feature layout, where
      // the photo is already an element).
      const i = a.index == null ? state.slideIndex : a.index;
      const slide = state.doc.slides[i];
      const bgi = slide && slide.background;
      if (!bgi || bgi.type !== "image" || !bgi.src) return state;
      const photo = makeElement("image", {
        id: uid("photo"), role: "photo", x: 0, y: 0, w: ARTBOARD_W, h: ARTBOARD_H,
        src: bgi.src, thumb: bgi.thumb || bgi.src, fit: "cover", radius: 0,
      });
      const pre = [photo];
      if (bgi.scrim) pre.push(makeElement("rect", {
        id: uid("scrim"), role: "scrim", x: 0, y: 0, w: ARTBOARD_W, h: ARTBOARD_H, fill: "#000000", opacity: bgi.scrim,
      }));
      const slides = state.doc.slides.map((s, idx) => idx === i ? Object.assign({}, s, {
        background: { type: "color", color: bgi.color || "#0c0c0c" },
        elements: pre.concat(s.elements || []),
      }) : s);
      return Object.assign({}, state, { doc: Object.assign({}, state.doc, { slides }), selectedId: photo.id, editingId: null });
    }
    case "imageToBackground": {
      // Reverse of detachPhoto (works on any image element): make the selected
      // image the slide's full-bleed background again, re-absorbing a sibling
      // scrim layer's opacity into the background scrim, and removing the element
      // (and that scrim rect). One raster, now a background.
      const i = state.slideIndex;
      const slide = state.doc.slides[i];
      const el = slide && (slide.elements || []).find((e) => e.id === a.id);
      if (!el || el.type !== "image" || !el.src) return state;
      const scrimEl = (slide.elements || []).find((e) => e.role === "scrim");
      const scrim = scrimEl ? (scrimEl.opacity == null ? 0.4 : scrimEl.opacity) : 0.4;
      const elements = (slide.elements || []).filter((e) => e.id !== el.id && e.role !== "scrim");
      const background = { type: "image", src: el.src, thumb: el.thumb || el.src, scrim, color: (slide.background && slide.background.color) || "#0c0c0c" };
      const slides = state.doc.slides.map((s, idx) => idx === i ? Object.assign({}, s, { background, elements }) : s);
      return Object.assign({}, state, { doc: Object.assign({}, state.doc, { slides }), selectedId: null, editingId: null });
    }
    case "setLayout": {
      // Re-flow a slide's stored/derived content through a new layout. Explicit,
      // never automatic — so manual edits persist until the user picks a layout.
      // reflowSlide moves the photo between background<->feature element as needed
      // and preserves manual backgrounds for non-feature re-flows (see templates.js).
      const relayout = (s) => carryChrome(s, reflowSlide(s, a.layout, state.doc.brand));
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
      // Re-flow each slide through its own layout in the current brand (renderLayout
      // now handles "closer" too), carrying the brand chrome (logo / wordmark /
      // footer) over so it survives the reset.
      const reset = (s) => carryChrome(s, reflowSlide(s, s.layout || "classic", brand));
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
const MUTATES = { add: 1, update: 1, styleText: 1, delete: 1, setBg: 1, setShape: 1, raise: 1, lower: 1, addSlide: 1, duplicateSlide: 1, deleteSlide: 1, moveSlide: 1, applyBrand: 1, setLogo: 1, setCaution: 1, setChrome: 1, setFrame: 1, detachPhoto: 1, imageToBackground: 1, setLayout: 1, resetSlideToBrand: 1 };
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
