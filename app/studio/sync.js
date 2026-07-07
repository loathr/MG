// sync.js — the pure core of collaborative edit sync (collab phase 2). Two pure
// functions, no React / no firebase:
//
//   diffDocs(prev, next) -> ops[]     turn a local doc change into minimal, id-keyed
//                                     operations to broadcast to peers
//   applyOps(doc, ops, opts) -> doc   merge a peer's operations into the local doc
//
// Everything is keyed by the stable ids the model already assigns (doc/slide/
// element .id), NEVER by array index — so two clients whose slide/element order
// has diverged still converge. Per-element, per-field patches mean two people
// editing DIFFERENT elements (or different fields of one) don't clobber each
// other; a genuine same-field clash resolves last-writer-wins (advisory locks
// make that rare). The usePresence/useSync hooks wire these to Firestore.

const idsOf = (arr) => (arr || []).map((x) => x.id);
const sameOrder = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Shallow per-field diff of two elements (same id): { field: newValue } for every
// key whose value changed, plus removed keys mapped to null. Returns null if equal.
function elementPatch(prev, next) {
  const patch = {};
  let changed = false;
  for (const k of Object.keys(next)) {
    if (k === "id") continue;
    if (!eq(prev[k], next[k])) { patch[k] = next[k]; changed = true; }
  }
  for (const k of Object.keys(prev)) {
    if (k === "id") continue;
    if (!(k in next)) { patch[k] = null; changed = true; }   // field removed
  }
  return changed ? patch : null;
}

// Minimal id-keyed operations describing how `next` differs from `prev`. Pure.
export function diffDocs(prev, next) {
  const ops = [];
  if (!prev || !next) return ops;
  const ps = prev.slides || [], ns = next.slides || [];
  const pById = new Map(ps.map((s) => [s.id, s]));
  const nById = new Map(ns.map((s) => [s.id, s]));

  // Slides added (with the index they landed at) and removed.
  ns.forEach((s, i) => { if (!pById.has(s.id)) ops.push({ t: "slide.add", index: i, slide: s }); });
  ps.forEach((s) => { if (!nById.has(s.id)) ops.push({ t: "slide.del", id: s.id }); });

  // Slide reorder: if the shared survivors sit in a different order, send the full
  // next id order (robust and idempotent).
  const survivors = ns.filter((s) => pById.has(s.id)).map((s) => s.id);
  const prevSurv = ps.filter((s) => nById.has(s.id)).map((s) => s.id);
  if (!sameOrder(survivors, prevSurv)) ops.push({ t: "slides.order", ids: idsOf(ns) });

  // Within each surviving slide: background + element diffs.
  for (const s of ns) {
    const p = pById.get(s.id);
    if (!p) continue;                                   // freshly added → full slide already sent
    if (!eq(p.background, s.background)) ops.push({ t: "slide.bg", id: s.id, background: s.background });

    const pe = p.elements || [], ne = s.elements || [];
    const peById = new Map(pe.map((e) => [e.id, e]));
    const neById = new Map(ne.map((e) => [e.id, e]));
    ne.forEach((e, i) => {
      const prevEl = peById.get(e.id);
      if (!prevEl) { ops.push({ t: "el.add", slide: s.id, index: i, element: e }); return; }
      const patch = elementPatch(prevEl, e);
      if (patch) ops.push({ t: "el.set", slide: s.id, id: e.id, patch });
    });
    pe.forEach((e) => { if (!neById.has(e.id)) ops.push({ t: "el.del", slide: s.id, id: e.id }); });

    const eSurv = ne.filter((e) => peById.has(e.id)).map((e) => e.id);
    const ePrevSurv = pe.filter((e) => neById.has(e.id)).map((e) => e.id);
    if (!sameOrder(eSurv, ePrevSurv)) ops.push({ t: "els.order", slide: s.id, ids: idsOf(ne) });
  }
  return ops;
}

// Reorder `arr` (of {id}) to match `ids`, appending any items whose id isn't in
// `ids` (local-only additions the remote hasn't seen) in their current order.
function reorderById(arr, ids) {
  const byId = new Map(arr.map((x) => [x.id, x]));
  const out = [];
  for (const id of ids) { const x = byId.get(id); if (x) { out.push(x); byId.delete(id); } }
  for (const x of arr) if (byId.has(x.id)) out.push(x);   // keep local-only, original order
  return out;
}

// Apply a peer's operations to the local doc, returning a NEW doc (pure). opts.held
// is a set/array of element ids the local user is actively editing — remote el.set/
// el.del on those are skipped so a peer's stream can't yank an element out from
// under an in-progress local edit (advisory-lock safety). Unknown ops are ignored.
export function applyOps(doc, ops, opts) {
  if (!doc || !ops || !ops.length) return doc;
  const held = new Set((opts && opts.held) || []);
  let slides = (doc.slides || []).map((s) => s);           // shallow clone of the list
  const idx = (id) => slides.findIndex((s) => s.id === id);
  const patchSlide = (id, fn) => { const i = idx(id); if (i >= 0) slides[i] = fn(slides[i]); };

  for (const op of ops) {
    switch (op && op.t) {
      case "slide.add": {
        if (idx(op.slide.id) >= 0) break;                  // already have it
        const at = Math.max(0, Math.min(op.index == null ? slides.length : op.index, slides.length));
        slides = slides.slice(0, at).concat([op.slide], slides.slice(at));
        break;
      }
      case "slide.del":
        slides = slides.filter((s) => s.id !== op.id);
        break;
      case "slides.order":
        slides = reorderById(slides, op.ids || []);
        break;
      case "slide.bg":
        patchSlide(op.id, (s) => Object.assign({}, s, { background: op.background }));
        break;
      case "el.add":
        patchSlide(op.slide, (s) => {
          const els = s.elements || [];
          if (els.some((e) => e.id === op.element.id)) return s;
          const at = Math.max(0, Math.min(op.index == null ? els.length : op.index, els.length));
          return Object.assign({}, s, { elements: els.slice(0, at).concat([op.element], els.slice(at)) });
        });
        break;
      case "el.del":
        if (held.has(op.id)) break;
        patchSlide(op.slide, (s) => Object.assign({}, s, { elements: (s.elements || []).filter((e) => e.id !== op.id) }));
        break;
      case "el.set":
        if (held.has(op.id)) break;                        // don't yank an in-progress local edit
        patchSlide(op.slide, (s) => Object.assign({}, s, {
          elements: (s.elements || []).map((e) => {
            if (e.id !== op.id) return e;
            const merged = Object.assign({}, e, op.patch);
            for (const k of Object.keys(op.patch)) if (op.patch[k] === null) delete merged[k];
            return merged;
          }),
        }));
        break;
      case "els.order":
        patchSlide(op.slide, (s) => Object.assign({}, s, { elements: reorderById(s.elements || [], op.ids || []) }));
        break;
      default:
        break;                                             // ignore unknown ops (forward-compat)
    }
  }
  return Object.assign({}, doc, { slides });
}
