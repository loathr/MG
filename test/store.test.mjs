// Unit checks for app/studio/store.js — the history-wrapped reducer (add/update
// coalescing, undo/redo, slide ops) and the pure brand helpers (rethemeDoc,
// stampLogo, carryBrandKit).
import test from "node:test";
import assert from "node:assert/strict";
import {
  reducer, initStudio, rethemeDoc, stampLogo, carryBrandKit,
} from "../app/studio/store.js";
import { makeElement } from "../app/studio/model.js";
import { slidesToDoc } from "../app/studio/templates.js";
import { brandFromStyle, getStyle } from "../app/studio/styles.js";

const cur = (s) => s.doc.slides[s.slideIndex];

test("initStudio starts on slide 0 with an empty history", () => {
  const s = initStudio();
  assert.equal(s.slideIndex, 0);
  assert.equal(s.doc.slides.length, 1);
  assert.deepEqual(s.past, []);
  assert.deepEqual(s.future, []);
});

test("add selects the new element and pushes one undo frame", () => {
  let s = initStudio();
  const before = cur(s).elements.length;
  s = reducer(s, { type: "add", element: makeElement("text", { id: "E1", content: "x" }) });
  assert.equal(cur(s).elements.length, before + 1);
  assert.equal(s.selectedId, "E1");
  assert.equal(s.past.length, 1);
});

test("crop toggles free-form crop mode and clears on leaving the element", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("image", { id: "IMG", src: "p.jpg" }) });
  s = reducer(s, { type: "add", element: makeElement("text", { id: "T", content: "x" }) });
  // enter crop on the image
  s = reducer(s, { type: "crop", id: "IMG" });
  assert.equal(s.croppingId, "IMG");
  assert.equal(s.selectedId, "IMG");
  // toggling the same id again exits crop mode (the Done button)
  s = reducer(s, { type: "crop", id: "IMG" });
  assert.equal(s.croppingId, null);
  // re-enter, then selecting a DIFFERENT element clears crop mode
  s = reducer(s, { type: "crop", id: "IMG" });
  s = reducer(s, { type: "select", id: "T" });
  assert.equal(s.croppingId, null, "leaving the cropped image exits crop mode");
  // re-selecting the SAME cropped element keeps crop mode
  s = reducer(s, { type: "crop", id: "IMG" });
  s = reducer(s, { type: "select", id: "IMG" });
  assert.equal(s.croppingId, "IMG", "re-selecting the cropped image keeps crop mode");
  // deselect / edit / slide change all exit crop mode
  assert.equal(reducer(s, { type: "deselect" }).croppingId, null);
  assert.equal(reducer(s, { type: "edit", id: "IMG" }).croppingId, null);
});

test("tether (B6): moving a parent drags its children by the same delta; delete untethers", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("image", { id: "P", x: 100, y: 100, w: 400, h: 400 }) });
  s = reducer(s, { type: "add", element: makeElement("text", { id: "C", x: 120, y: 130, content: "badge", tetherTo: "P" }) });
  s = reducer(s, { type: "move", id: "P", x: 150, y: 130 });   // +50, +30
  const child = () => cur(s).elements.find((e) => e.id === "C");
  assert.equal(child().x, 170); assert.equal(child().y, 160);  // followed the parent
  // moving the child alone does NOT move the parent
  s = reducer(s, { type: "move", id: "C", x: 300, y: 300 });
  assert.equal(cur(s).elements.find((e) => e.id === "P").x, 150);
  // deleting the parent untethers the child (kept, not orphaned)
  s = reducer(s, { type: "delete", id: "P" });
  const c2 = cur(s).elements.find((e) => e.id === "C");
  assert.ok(c2, "child survives the parent's deletion");
  assert.equal(c2.tetherTo, undefined, "child is untethered");
});

test("a continuous gesture (coalesce:true, same id) collapses into one undo frame", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("rect", { id: "R" }) });
  s = reducer(s, { type: "add", element: makeElement("rect", { id: "R2" }) });
  const afterAdds = s.past.length;
  s = reducer(s, { type: "update", id: "R", patch: { x: 10 }, coalesce: true });
  const afterFirstUpdate = s.past.length;
  assert.ok(afterFirstUpdate > afterAdds);
  s = reducer(s, { type: "update", id: "R", patch: { x: 20 }, coalesce: true });   // same gesture → coalesced
  assert.equal(s.past.length, afterFirstUpdate);                                   // no new frame
  s = reducer(s, { type: "update", id: "R2", patch: { x: 5 }, coalesce: true });   // different id → new frame
  assert.equal(s.past.length, afterFirstUpdate + 1);
});

test("a drag-move (coalesce) collapses to one frame; plain toolbar updates do NOT coalesce", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("rect", { id: "R" }) });
  const base = s.past.length;
  // Simulate a drag: many `move`s with coalesce → a single frame (the pre-drag state).
  s = reducer(s, { type: "move", id: "R", x: 10, y: 10, coalesce: true });
  s = reducer(s, { type: "move", id: "R", x: 20, y: 20, coalesce: true });
  s = reducer(s, { type: "move", id: "R", x: 30, y: 30, coalesce: true });
  assert.equal(s.past.length, base + 1, "the whole drag is ONE undo frame");
  // Discrete toolbar edits (no coalesce) each push their own frame, even same id.
  s = reducer(s, { type: "update", id: "R", patch: { fill: "#111" } });
  s = reducer(s, { type: "update", id: "R", patch: { fill: "#222" } });
  assert.equal(s.past.length, base + 3, "two separate toolbar edits → two frames");
  // And one undo steps back exactly one toolbar edit (not the whole batch).
  s = reducer(s, { type: "undo" });
  assert.equal(cur(s).elements.find((e) => e.id === "R").fill, "#111");
});

test("styleText applies per-run styling to a text element's range (undoable)", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("text", { id: "T", content: "One two three", color: "#fff", fontWeight: 400 }) });
  s = reducer(s, { type: "styleText", id: "T", start: 4, end: 7, patch: { color: "#e23744", bold: true } });
  const el = cur(s).elements.find((e) => e.id === "T");
  assert.deepEqual(el.runs, [{ start: 4, end: 7, color: "#e23744", bold: true }]);
  assert.equal(el.content, "One two three"); // content untouched
  // a clear removes styling in the range
  s = reducer(s, { type: "styleText", id: "T", start: 4, end: 7, clear: true });
  assert.deepEqual(cur(s).elements.find((e) => e.id === "T").runs, []);
  // it's undoable
  s = reducer(s, { type: "undo" });
  assert.deepEqual(cur(s).elements.find((e) => e.id === "T").runs, [{ start: 4, end: 7, color: "#e23744", bold: true }]);
});

test("editing a styled element's content re-maps its runs (styling sticks to letters)", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("text", { id: "T", content: "One two", runs: [{ start: 4, end: 7, bold: true }] }) });
  // append text → the bold "two" run is preserved (tail unchanged)
  s = reducer(s, { type: "update", id: "T", patch: { content: "One two three" } });
  assert.deepEqual(cur(s).elements.find((e) => e.id === "T").runs, [{ start: 4, end: 7, bold: true }]);
  // explicit runs in a patch are used verbatim (the per-span apply path)
  s = reducer(s, { type: "update", id: "T", patch: { content: "One two three", runs: [{ start: 0, end: 3, italic: true }] } });
  assert.deepEqual(cur(s).elements.find((e) => e.id === "T").runs, [{ start: 0, end: 3, italic: true }]);
});

test("undo/redo restore the document around an edit", () => {
  let s = initStudio();
  const base = cur(s).elements.length;
  s = reducer(s, { type: "add", element: makeElement("text", { id: "U" }) });
  assert.equal(cur(s).elements.length, base + 1);
  s = reducer(s, { type: "undo" });
  assert.equal(cur(s).elements.length, base);
  s = reducer(s, { type: "redo" });
  assert.equal(cur(s).elements.length, base + 1);
});

test("loadDoc installs a fresh document and clears history", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("text", { id: "Z" }) });
  const doc = slidesToDoc([{ heading: "New" }], "editorial");
  s = reducer(s, { type: "loadDoc", doc });
  assert.equal(s.doc, doc);
  assert.equal(s.slideIndex, 0);
  assert.deepEqual(s.past, []);
  assert.deepEqual(s.future, []);
});

test("setChrome white-label strips every LOATHR mark incl. the closer; page numbers stay; toggling off restores", () => {
  const doc = {
    brand: { show: {} },
    slides: [
      { id: "c", style: "editorial", elements: [
        { id: "w", type: "text", role: "wordmark", content: "LOATHR" },
        { id: "h", type: "text", content: "Cover" },
      ] },
      { id: "m", style: "editorial", elements: [
        { id: "b", type: "text", content: "Body" },
        { id: "f", type: "text", role: "footer", content: "LOATHR" },
        { id: "p", type: "text", role: "pageno", content: "1" },
        { id: "fr", type: "rect", role: "footrule" },
      ] },
      { id: "z", style: "editorial", elements: [
        { id: "zw", type: "text", role: "wordmark", content: "LOATHR" },
        { id: "zr", type: "rect", role: "closerrule" },
        { id: "zh", type: "text", content: "Thanks" },
      ] },
    ],
  };
  let s = initStudio();
  s = reducer(s, { type: "loadDoc", doc });
  const roles = (i) => s.doc.slides[i].elements.map((e) => e.role).filter(Boolean);

  s = reducer(s, { type: "setChrome", key: "brandless", on: true });
  assert.ok(!roles(0).includes("wordmark"), "cover wordmark stripped");
  assert.ok(!roles(1).includes("footer"), "running footer stripped");
  assert.ok(roles(1).includes("pageno"), "page numbers kept (not a LOATHR mark)");
  assert.ok(!roles(2).includes("wordmark") && !roles(2).includes("closerrule"), "closer lockup stripped");
  assert.ok(s.doc.slides[2].elements.some((e) => e.content === "Thanks"), "closer content survives");

  s = reducer(s, { type: "setChrome", key: "brandless", on: false });
  assert.ok(roles(0).includes("wordmark"), "cover wordmark restored");
  assert.ok(roles(1).includes("footer"), "running footer restored");
  assert.ok(roles(2).includes("wordmark") && roles(2).includes("closerrule"), "closer lockup restored");
});

test("duplicate clones an element with a fresh id, offset, and selects the copy", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("rect", { id: "R", x: 100, y: 100, fill: "#abccde" }) });
  const before = s.doc.slides[s.slideIndex].elements.length;
  s = reducer(s, { type: "duplicate", id: "R" });
  const els = s.doc.slides[s.slideIndex].elements;
  assert.equal(els.length, before + 1);
  const copy = els.find((e) => e.fill === "#abccde" && e.id !== "R");
  assert.ok(copy, "a clone exists");
  assert.equal(copy.x, 124);
  assert.equal(copy.y, 124);
  assert.equal(s.selectedId, copy.id);
});

test("slide ops: add / duplicate / delete-keeps-one / move", () => {
  let s = initStudio();
  s = reducer(s, { type: "addSlide" });
  assert.equal(s.doc.slides.length, 2);
  assert.equal(s.slideIndex, 1);
  s = reducer(s, { type: "duplicateSlide", index: 0 });
  assert.equal(s.doc.slides.length, 3);
  assert.notEqual(s.doc.slides[1].id, s.doc.slides[0].id);   // a true copy
  s = reducer(s, { type: "moveSlide", from: 0, to: 2 });
  assert.equal(s.doc.slides.length, 3);
  // deleting down to the last remaining slide is refused
  let one = initStudio();
  one = reducer(one, { type: "deleteSlide", index: 0 });
  assert.equal(one.doc.slides.length, 1);
});

test("rethemeDoc remaps on-brand elements and leaves off-brand ones", () => {
  const prev = brandFromStyle("editorial");                 // accent #e23744, bg #0c0c0c
  const next = Object.assign({}, prev, { accent: "#00ff00", bg: "#111111" });
  const doc = {
    brand: prev,
    slides: [{
      background: { type: "color", color: prev.bg },
      elements: [
        makeElement("rect", { fill: prev.accent }),         // on-brand → remapped
        makeElement("rect", { fill: "#abcdef" }),           // off-brand → kept
      ],
    }],
  };
  const out = rethemeDoc(doc, prev, next);
  assert.equal(out.slides[0].elements[0].fill, "#00ff00");
  assert.equal(out.slides[0].elements[1].fill, "#abcdef");
  assert.equal(out.slides[0].background.color, "#111111");
});

test("rethemeDoc retitles the wordmark on a brand wordmark change (incl. first edit)", () => {
  const doc = {
    brand: brandFromStyle("editorial"),
    slides: [{
      background: { type: "color", color: "#000" },
      elements: [
        makeElement("text", { role: "wordmark", content: "LOATHR" }),
        makeElement("text", { role: "heading", content: "LOATHR" }), // not a wordmark → left alone
      ],
    }],
  };
  // First edit: previous brand carried NO explicit wordmark (undefined) — must
  // still retitle the default "LOATHR" mark.
  const out1 = rethemeDoc(doc, {}, { wordmark: "ACME" });
  assert.equal(out1.slides[0].elements[0].content, "ACME", "wordmark retitled from default");
  assert.equal(out1.slides[0].elements[1].content, "LOATHR", "non-wordmark text untouched");
  // Subsequent edit: prev wordmark set explicitly.
  const doc2 = Object.assign({}, doc, { slides: [Object.assign({}, doc.slides[0], { elements: [makeElement("text", { role: "wordmark", content: "ACME" })] })] });
  const out2 = rethemeDoc(doc2, { wordmark: "ACME" }, { wordmark: "BETA" });
  assert.equal(out2.slides[0].elements[0].content, "BETA");
});

test("D3 · rethemeDoc remaps element textBg/textStroke + per-run colours on a palette swap", () => {
  const prev = brandFromStyle("editorial");                 // accent #e23744, ink, bg #0c0c0c
  const next = Object.assign({}, prev, { accent: "#00ff00" });
  const doc = {
    brand: prev,
    slides: [{
      background: { type: "color", color: prev.bg },
      elements: [
        makeElement("text", {
          content: "Hot take here", color: "#ffffff",
          textBg: prev.accent,            // on-brand element highlight → remapped
          textStroke: "#abcdef",          // off-brand outline → kept
          runs: [
            { start: 0, end: 3, bg: prev.accent },      // on-brand run highlight → remapped
            { start: 4, end: 8, color: prev.ink },       // on-brand run colour → remapped
            { start: 9, end: 13, color: "#123456" },     // off-brand → kept
          ],
        }),
      ],
    }],
  };
  const el = rethemeDoc(doc, prev, next).slides[0].elements[0];
  assert.equal(el.textBg, "#00ff00", "element textBg follows the accent");
  assert.equal(el.textStroke, "#abcdef", "off-brand outline untouched");
  assert.equal(el.runs[0].bg, "#00ff00", "run highlight follows the accent");
  assert.equal(el.runs[1].color, next.ink, "run colour follows ink");
  assert.equal(el.runs[2].color, "#123456", "off-brand run colour untouched");
});

test("setShape wears a shape on a text element (accent fill, undoable)", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("text", { id: "T", content: "Hot take", color: "#ffffff" }) });
  const frames = s.past.length;
  s = reducer(s, { type: "setShape", id: "T", shape: "speech" });
  const el = cur(s).elements.find((e) => e.id === "T");
  assert.equal(el.shape, "speech");
  assert.ok(el.shapeFill);                 // gets the deck accent
  assert.equal(el.tailSide, "left");
  assert.equal(el.color, "#ffffff");       // outline shape keeps the text color
  assert.equal(s.past.length, frames + 1); // undoable
});

test("setShape clears prior B4 Fill/Border overrides on switch and removal", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("text", { id: "S", content: "Hi", shape: "speech", shapeBody: "#102030", shapeBorderC: "#00ff00" }) });
  s = reducer(s, { type: "setShape", id: "S", shape: "banner" });   // switch variant
  let el = cur(s).elements.find((e) => e.id === "S");
  assert.equal(el.shapeBody, undefined);     // fresh variant starts from its defaults
  assert.equal(el.shapeBorderC, undefined);
  s = reducer(s, { type: "update", id: "S", patch: { shapeBody: "#abcdef" } });
  s = reducer(s, { type: "setShape", id: "S", shape: null });        // remove
  el = cur(s).elements.find((e) => e.id === "S");
  assert.equal(el.shapeBody, undefined);     // cleared with the shape
});

test("setShape on a fill shape knocks out the text, stashing + restoring the prior color", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("text", { id: "P", content: "SAVE", color: "#ffffff" }) });
  s = reducer(s, { type: "setShape", id: "P", shape: "pill" });
  let el = cur(s).elements.find((e) => e.id === "P");
  assert.equal(el.color, "#0c0c0c");       // dark knockout on the accent fill
  assert.equal(el.priorColor, "#ffffff");  // prior text color stashed
  s = reducer(s, { type: "setShape", id: "P", shape: null });   // remove
  el = cur(s).elements.find((e) => e.id === "P");
  assert.equal(el.shape, undefined);
  assert.equal(el.shapeFill, undefined);
  assert.equal(el.color, "#ffffff");       // restored
  assert.equal(el.priorColor, undefined);
});

test("switching from a knockout shape to an outline shape restores the text color", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("text", { id: "X", content: "Hi", color: "#ffffff" }) });
  s = reducer(s, { type: "setShape", id: "X", shape: "burst" });   // knockout
  s = reducer(s, { type: "setShape", id: "X", shape: "speech" });  // outline
  const el = cur(s).elements.find((e) => e.id === "X");
  assert.equal(el.shape, "speech");
  assert.equal(el.color, "#ffffff");
  assert.equal(el.priorColor, undefined);
});

test("setShape ignores non-text elements", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("rect", { id: "R" }) });
  s = reducer(s, { type: "setShape", id: "R", shape: "pill" });
  assert.equal(cur(s).elements.find((e) => e.id === "R").shape, undefined);
});

test("rethemeDoc carries a shaped text's accent, leaving paper notes alone", () => {
  const prev = brandFromStyle("editorial");
  const next = Object.assign({}, prev, { accent: "#00ff00" });
  const doc = {
    brand: prev,
    slides: [{
      background: { type: "color", color: prev.bg },
      elements: [
        makeElement("text", { content: "A", shape: "speech", shapeFill: prev.accent, color: "#ffffff" }),
        makeElement("text", { content: "B", shape: "note", shapeFill: "#f3efe2", color: "#1a1a1a" }),
        makeElement("text", { content: "C", shape: "speech", shapeFill: prev.accent, shapeBody: prev.accent, shapeBorderC: prev.accent, color: "#ffffff" }),
      ],
    }],
  };
  const out = rethemeDoc(doc, prev, next);
  assert.equal(out.slides[0].elements[0].shapeFill, "#00ff00");  // accent shape follows the swap
  assert.equal(out.slides[0].elements[1].shapeFill, "#f3efe2");  // paper note untouched
  assert.equal(out.slides[0].elements[2].shapeBody, "#00ff00");   // B4 Fill override follows the swap
  assert.equal(out.slides[0].elements[2].shapeBorderC, "#00ff00"); // B4 Border override follows the swap
});

test("stampLogo lands on the bookend slides only, and clears cleanly", () => {
  const doc = slidesToDoc(
    [{ role: "COVER", heading: "C" }, { heading: "M" }, { role: "CLOSER", heading: "E" }],
    "editorial",
  );
  const hasLogo = (s) => s.elements.some((e) => e.role === "logo");
  const out = stampLogo(doc, { src: "data:logo", w: 120, h: 60 });
  assert.ok(hasLogo(out.slides[0]));        // cover
  assert.ok(!hasLogo(out.slides[1]));       // middle untouched
  assert.ok(hasLogo(out.slides[2]));        // closer
  const cleared = stampLogo(out, null);
  assert.ok(cleared.slides.every((s) => !hasLogo(s)));
  assert.equal(cleared.brand.logo, null);
});

test("carryBrandKit is a no-op for an untouched previous brand", () => {
  const newDoc = slidesToDoc([{ heading: "A" }, { heading: "B" }], "editorial");
  const prevDoc = slidesToDoc([{ heading: "X" }], "editorial"); // brand === defaults
  assert.equal(carryBrandKit(newDoc, prevDoc), newDoc);
  assert.equal(carryBrandKit(newDoc, {}), newDoc);
  assert.equal(carryBrandKit(newDoc, null), newDoc);
});

test("carryBrandKit carries a deliberate accent override onto the new deck", () => {
  const newDoc = slidesToDoc([{ role: "COVER", heading: "A" }], "editorial");
  const prevDoc = slidesToDoc([{ heading: "X" }], "editorial");
  prevDoc.brand = Object.assign({}, prevDoc.brand, { accent: "#abcdef" });
  const out = carryBrandKit(newDoc, prevDoc);
  assert.notEqual(out, newDoc);
  assert.ok(out.slides[0].elements.some((e) => e.type === "rect" && e.fill === "#abcdef"));
});

test("carryBrandKit always carries the logo", () => {
  const newDoc = slidesToDoc([{ role: "COVER", heading: "A" }, { role: "CLOSER", heading: "Z" }], "editorial");
  const prevDoc = slidesToDoc([{ heading: "X" }], "editorial");
  prevDoc.brand = Object.assign({}, prevDoc.brand, { logo: { src: "data:l", w: 100, h: 50 } });
  const out = carryBrandKit(newDoc, prevDoc);
  assert.ok(out.slides[0].elements.some((e) => e.role === "logo"));
});

test("setLayout reflows the current slide and drops the selection", () => {
  let s = initStudio();
  s = reducer(s, { type: "select", id: cur(s).elements[0].id });
  s = reducer(s, { type: "setLayout", layout: "centered" });
  assert.equal(cur(s).layout, "centered");
  assert.equal(s.selectedId, null);
});

// --- #4 brand coherence: a layout change stays on-brand, and a drifted slide is
// recoverable via resetSlideToBrand (per-slide + all). ----------------------
function branded(accent) {
  const doc = slidesToDoc(
    [{ role: "COVER", heading: "A" }, { heading: "B", body: "x" }, { role: "CLOSER", heading: "Z" }],
    "editorial",
  );
  doc.brand = Object.assign({}, doc.brand, { accent });
  return { doc, slideIndex: 1, selectedId: null, editingId: null, past: [], future: [], lastTag: null };
}

test("setLayout reflows in the deck's brand, so a layout change stays on-brand (#4)", () => {
  let s = branded("#00ff00");
  s = reducer(s, { type: "setLayout", layout: "split", index: 1 });
  assert.equal(s.doc.slides[1].layout, "split");
  assert.ok(s.doc.slides[1].elements.some((e) => e.type === "rect" && e.fill === "#00ff00"));
});

test("resetSlideToBrand snaps a drifted slide back to the deck look (#4)", () => {
  let s = branded("#00ff00");
  // simulate a slide that drifted off-brand (e.g. a pre-fix reflow left the family accent)
  s.doc.slides[1] = Object.assign({}, s.doc.slides[1], {
    elements: s.doc.slides[1].elements.map((e) => (e.type === "rect" ? Object.assign({}, e, { fill: "#e23744" }) : e)),
  });
  s = reducer(s, { type: "resetSlideToBrand", index: 1 });
  assert.ok(s.doc.slides[1].elements.some((e) => e.type === "rect" && e.fill === "#00ff00")); // back on brand
  assert.equal(s.selectedId, null);
});

test("resetSlideToBrand all re-skins the whole deck and keeps the logo (#4)", () => {
  let s = branded("#00ff00");
  s.doc = stampLogo(s.doc, { src: "data:l", w: 100, h: 50 }); // logo on the bookends
  s = reducer(s, { type: "resetSlideToBrand", all: true });
  assert.ok(s.doc.slides[0].elements.some((e) => e.type === "rect" && e.fill === "#00ff00")); // cover on brand
  assert.ok(s.doc.slides[0].elements.some((e) => e.role === "logo"));                          // logo survived
});

test("setCaution adds then removes the closing caution and records it on the brand", () => {
  let s = initStudio();
  s = reducer(s, { type: "setCaution", text: "Careful" });
  let last = s.doc.slides[s.doc.slides.length - 1];
  assert.ok(last.elements.some((e) => e.role === "caution" && e.content === "Careful"));
  assert.equal(s.doc.brand.caution, "Careful");
  s = reducer(s, { type: "setCaution", text: "" });
  last = s.doc.slides[s.doc.slides.length - 1];
  assert.ok(!last.elements.some((e) => e.role === "caution"));
  assert.equal(s.doc.brand.caution, "");
});

test("applyBrand re-themes the live document", () => {
  let s = initStudio();
  const prev = brandFromStyle("editorial");
  const next = Object.assign({}, prev, { accent: "#00ff00" });
  s = reducer(s, { type: "applyBrand", prev, brand: next });
  assert.ok(cur(s).elements.some((e) => e.type === "rect" && e.fill === "#00ff00"));
});

test("rethemeDoc carries the baked highlight run to the new accent + bg", () => {
  const doc = slidesToDoc(
    [{ role: "COVER", heading: "A" },
     { heading: "H", body: "the quick brown fox", highlight: "quick brown" },
     { role: "CLOSER", heading: "Z" }],
    "editorial",
  );
  // The highlight is now a real bg run (bakeHighlight), not the legacy marker — so
  // a palette swap must recolour the RUN (store.js remaps runs[].{color,bg}).
  const findHL = (d) => d.slides.flatMap((s) => s.elements).find((e) => Array.isArray(e.runs) && e.runs.some((r) => r.bg));
  const before = findHL(doc);
  assert.ok(before, "expected a highlighted element from generation");
  const beforeRun = before.runs.find((r) => r.bg);
  assert.equal(beforeRun.bg, "#e23744"); // editorial accent
  const prev = doc.brand;
  const next = Object.assign({}, prev, { accent: "#00ff00", bg: "#111111" });
  const afterRun = findHL(rethemeDoc(doc, prev, next)).runs.find((r) => r.bg);
  assert.equal(afterRun.bg, "#00ff00");   // run background follows the new accent
  assert.equal(afterRun.color, "#111111"); // knockout text follows the new deck bg
});

test("rethemeDoc swaps fonts by TIER; other tiers + LOATHR marks stay put", () => {
  const doc = slidesToDoc(
    [{ role: "COVER", heading: "C" },
     { kicker: "K", heading: "Head", body: "body copy", sources: ["S"] },
     { role: "CLOSER", heading: "Bye" }],
    "editorial",
  );
  const prev = brandFromStyle("editorial");                      // label Courier, head Georgia, body Helvetica
  const next = Object.assign({}, prev, { headFont: "Impact" });  // change ONLY the heading tier
  const out = rethemeDoc(doc, prev, next);
  const content = out.slides[1];
  assert.equal(content.elements.find((e) => e.tier === "heading").fontFamily, "Impact");
  assert.equal(content.elements.find((e) => e.tier === "body" && /body copy/.test(e.content)).fontFamily, prev.bodyFont);
  assert.equal(content.elements.find((e) => e.role === "footer").fontFamily, prev.labelFont); // LOATHR mark untouched
  assert.match(out.slides[0].elements.find((e) => e.role === "wordmark").fontFamily, /Courier Prime/);
});

test("rethemeDoc: changing a shared font moves only its tier (News head=body serif)", () => {
  // News Desk defaults head + body to the same serif — the old string-match welded them.
  const doc = slidesToDoc(
    [{ role: "COVER", heading: "C" },
     { kicker: "K", heading: "Head", body: "body copy" },
     { role: "CLOSER", heading: "E" }],
    "newsdesk",
  );
  const prev = brandFromStyle("newsdesk");
  const next = Object.assign({}, prev, { headFont: "Impact" });
  const out = rethemeDoc(doc, prev, next);
  const content = out.slides[1];
  assert.equal(content.elements.find((e) => e.tier === "heading").fontFamily, "Impact");      // heading moved
  assert.equal(content.elements.find((e) => e.tier === "body" && /body copy/.test(e.content)).fontFamily, prev.bodyFont); // body NOT welded
});

test("resetSlideToBrand keeps the cover wordmark, content footer + page number", () => {
  let s = initStudio();
  const doc = slidesToDoc([{ role: "COVER", heading: "C" }, { kicker: "K", heading: "H", body: "b" }, { role: "CLOSER", heading: "Z" }], "editorial");
  s = reducer(s, { type: "loadDoc", doc });
  s = reducer(s, { type: "resetSlideToBrand", all: true });
  const [cover, content, closer] = s.doc.slides;
  assert.ok(cover.elements.some((e) => e.role === "wordmark"), "cover wordmark survives reset");
  assert.ok(content.elements.some((e) => e.role === "footer"), "footer survives reset");
  assert.ok(content.elements.some((e) => e.role === "pageno"), "page number survives reset");
  assert.ok(closer.elements.some((e) => e.content === "LOATHR"), "closer sign-off rebuilt");
});

test("setLayout preserves brand chrome (cover wordmark survives a layout change)", () => {
  let s = initStudio();
  const doc = slidesToDoc([{ role: "COVER", heading: "C" }, { kicker: "K", heading: "H", body: "b" }, { role: "CLOSER", heading: "Z" }], "editorial");
  s = reducer(s, { type: "loadDoc", doc });
  s = reducer(s, { type: "setLayout", layout: "classic", index: 0 });
  assert.ok(s.doc.slides[0].elements.some((e) => e.role === "wordmark"), "wordmark survives a layout change");
});

test("setFrame all:true frames every slide + records the deck default; off clears it (R4)", () => {
  let s = initStudio();
  const doc = slidesToDoc([{ role: "COVER", heading: "C" }, { kicker: "K", heading: "H", body: "b" }, { role: "CLOSER", heading: "Z" }], "editorial");
  s = reducer(s, { type: "loadDoc", doc });
  s = reducer(s, { type: "setFrame", frame: "inset", all: true });
  assert.equal(s.doc.brand.frame, "inset");
  assert.ok(s.doc.slides.every((sl) => sl.elements.some((e) => e.role === "frame")));
  // re-applying a different style replaces, never duplicates (edge/inset = 1 element)
  s = reducer(s, { type: "setFrame", frame: "edge", all: true });
  assert.ok(s.doc.slides.every((sl) => sl.elements.filter((e) => e.role === "frame").length === 1));
  s = reducer(s, { type: "setFrame", frame: "off", all: true });
  assert.equal(s.doc.brand.frame, "off");
  assert.ok(s.doc.slides.every((sl) => !sl.elements.some((e) => e.role === "frame")));
});

test("setFrame is per-slide: frames only the current slide by default, independently (R4)", () => {
  let s = initStudio();
  const doc = slidesToDoc([{ role: "COVER", heading: "C" }, { kicker: "K", heading: "H", body: "b" }, { role: "CLOSER", heading: "Z" }], "editorial");
  s = reducer(s, { type: "loadDoc", doc });   // lands on slide 0
  s = reducer(s, { type: "setFrame", frame: "inset" });
  assert.equal(s.doc.slides[0].frame, "inset");
  assert.ok(s.doc.slides[0].elements.some((e) => e.role === "frame"));
  assert.ok(!s.doc.slides[1].elements.some((e) => e.role === "frame"), "other slides untouched");
  assert.equal(s.doc.brand.frame, "off", "a single-slide apply doesn't change the deck default");
  // another slide, independently, by index
  s = reducer(s, { type: "setFrame", frame: "corners", index: 1 });
  assert.equal(s.doc.slides[1].frame, "corners");
  assert.equal(s.doc.slides[1].elements.filter((e) => e.role === "frame").length, 8);
  assert.equal(s.doc.slides[0].frame, "inset", "slide 0 keeps its own frame");
});

test("setCaption stores the caption text on the doc and is NOT an undo frame", () => {
  let s = initStudio();
  const past = s.past.length;
  s = reducer(s, { type: "setCaption", text: "Hook\n\nBody\n\n#tag" });
  assert.equal(s.doc.caption, "Hook\n\nBody\n\n#tag");
  assert.equal(s.past.length, past); // caption edits don't crowd the undo history
});

test("setChrome toggles deck-wide chrome; page numbers renumber correctly on re-show (R2)", () => {
  let s = initStudio();
  const doc = slidesToDoc([
    { role: "COVER", heading: "C" },
    { kicker: "K", heading: "H", body: "b" },
    { kicker: "K2", heading: "H2", body: "b2" },
    { role: "CLOSER", heading: "Z" },
  ], "editorial");
  s = reducer(s, { type: "loadDoc", doc });
  // baseline: cover wordmark + content footer + page numbers all present
  assert.ok(s.doc.slides[0].elements.some((e) => e.role === "wordmark"));
  assert.ok(s.doc.slides[1].elements.some((e) => e.role === "footer"));
  assert.ok(s.doc.slides[1].elements.some((e) => e.role === "pageno"));
  // hide page numbers deck-wide; footer stays
  s = reducer(s, { type: "setChrome", key: "pageno", on: false });
  assert.equal(s.doc.brand.show.pageno, false);
  assert.ok(s.doc.slides.every((sl) => !sl.elements.some((e) => e.role === "pageno")));
  assert.ok(s.doc.slides[1].elements.some((e) => e.role === "footer"), "footer kept");
  // hide footer too → the hairline (footrule) goes with it
  s = reducer(s, { type: "setChrome", key: "footer", on: false });
  assert.ok(s.doc.slides.every((sl) => !sl.elements.some((e) => e.role === "footer" || e.role === "footrule")));
  // hide the cover wordmark
  s = reducer(s, { type: "setChrome", key: "wordmark", on: false });
  assert.ok(!s.doc.slides[0].elements.some((e) => e.role === "wordmark"));
  // re-show page numbers → 1-based numbering restored across content slides
  s = reducer(s, { type: "setChrome", key: "pageno", on: true });
  const pagenos = s.doc.slides.flatMap((sl) => sl.elements.filter((e) => e.role === "pageno").map((e) => e.content));
  assert.deepEqual(pagenos, ["1", "2"]);
});

test("the deck frame survives reset + a layout change (carried chrome) (R4)", () => {
  let s = initStudio();
  const doc = slidesToDoc([{ role: "COVER", heading: "C" }, { kicker: "K", heading: "H", body: "b" }], "editorial");
  s = reducer(s, { type: "loadDoc", doc });
  s = reducer(s, { type: "setFrame", frame: "inset", all: true });
  s = reducer(s, { type: "setLayout", layout: "classic", index: 1 });
  assert.ok(s.doc.slides[1].elements.some((e) => e.role === "frame"), "frame survives a layout change");
  // The frame must stay at the BACK after a layout change — else the near-full-bleed
  // frame rect lands on top and swallows every content click (selection bug).
  const els = s.doc.slides[1].elements;
  assert.equal(els.findIndex((e) => e.role === "frame"), 0, "frame stays at the back of the stack");
  assert.ok(els[els.length - 1].role !== "frame", "frame is never the top layer");
  s = reducer(s, { type: "resetSlideToBrand", all: true });
  assert.ok(s.doc.slides.every((sl) => sl.elements.some((e) => e.role === "frame")), "frame survives reset");
});

test("rethemeDoc recolors the deck frame to the new look — accent, but News Desk ink (R4)", () => {
  // editorial: frame follows the accent
  let s = initStudio();
  s = reducer(s, { type: "loadDoc", doc: slidesToDoc([{ role: "COVER", heading: "C" }, { kicker: "K", heading: "H", body: "b" }], "editorial") });
  s = reducer(s, { type: "setFrame", frame: "inset", all: true });
  let out = rethemeDoc(s.doc, s.doc.brand, Object.assign({}, s.doc.brand, { accent: "#00ccff" }));
  assert.equal(out.slides[1].elements.find((e) => e.role === "frame").stroke, "#00ccff"); // edge/inset → stroke

  // newsdesk: frame follows ink, NOT the accent
  let s2 = initStudio();
  s2 = reducer(s2, { type: "loadDoc", doc: slidesToDoc([{ role: "COVER", heading: "C" }, { kicker: "K", heading: "H", body: "b" }], "newsdesk") });
  s2 = reducer(s2, { type: "setFrame", frame: "edge", all: true });
  let out2 = rethemeDoc(s2.doc, s2.doc.brand, Object.assign({}, s2.doc.brand, { ink: "#222233", accent: "#ff0000" }));
  assert.equal(out2.slides[1].elements.find((e) => e.role === "frame").stroke, "#222233");
});

test("rethemeDoc remaps a kicker coloured with the old secondary to the new one", () => {
  let s = initStudio();
  s = reducer(s, { type: "loadDoc", doc: slidesToDoc([{ role: "COVER", heading: "C" }, { kicker: "WAGE", heading: "H", body: "b" }], "editorial") });
  const out = rethemeDoc(s.doc, s.doc.brand, Object.assign({}, s.doc.brand, { secondary: "#123456" }));
  const kicker = out.slides.flatMap((sl) => sl.elements).find((e) => e.tier === "label" && e.color === "#123456");
  assert.ok(kicker, "a segment header coloured with the old secondary moved to the new secondary");
});

test("rethemeDoc recolours the feature colour-panel box on a bg swap", () => {
  let s = initStudio();
  s = reducer(s, { type: "loadDoc", doc: slidesToDoc([{ role: "COVER", heading: "C" }, { kicker: "K", heading: "H", body: "b" }], "editorial") });
  // put slide 1 on the side-by-side split so it carries a colour-panel box
  s = reducer(s, { type: "setLayout", layout: "featureSplit", index: 1 });
  const panelBefore = s.doc.slides[1].elements.find((e) => e.role === "panel");
  assert.ok(panelBefore, "split slide has a panel box");
  assert.equal(panelBefore.fill, s.doc.brand.bg, "panel filled with the deck bg");
  const out = rethemeDoc(s.doc, s.doc.brand, Object.assign({}, s.doc.brand, { bg: "#101820" }));
  assert.equal(out.slides[1].elements.find((e) => e.role === "panel").fill, "#101820", "panel follows the new bg");
});

test("setFamily switches the layout family + fonts but keeps the colour palette", () => {
  let s = initStudio();
  s = reducer(s, { type: "loadDoc", doc: slidesToDoc([{ role: "COVER", heading: "C" }, { kicker: "K", heading: "H", body: "b" }], "editorial") });
  const accentBefore = s.doc.brand.accent;
  s = reducer(s, { type: "setFamily", family: "newsdesk" });
  // every slide's family flips; the cover takes the News Desk cover layout
  assert.ok(s.doc.slides.every((sl) => sl.style === "newsdesk"), "all slides on the new family");
  assert.equal(s.doc.slides[0].layout, "masthead");          // News Desk cover layout
  // type follows the family — the UNIQUE loathr fonts (FONT_PRESET), not generic
  assert.match(s.doc.brand.bodyFont, /CarbonText/); // News Desk preset body font
  assert.match(s.doc.brand.headFont, /CrownHeritage/);
  assert.equal(s.doc.brand.accent, accentBefore, "colour palette kept (no stomp)");
  // undoable
  s = reducer(s, { type: "undo" });
  assert.ok(s.doc.slides.every((sl) => sl.style === "editorial"), "undo restores the family");
});

test("an explicit frame colour overrides the accent default, and clears back to it", () => {
  let s = initStudio();
  s = reducer(s, { type: "loadDoc", doc: slidesToDoc([{ role: "COVER", heading: "C" }, { kicker: "K", heading: "H", body: "b" }], "editorial") });
  s = reducer(s, { type: "setFrame", frame: "inset", all: true });
  const frameCol = (d) => d.slides[1].elements.find((e) => e.role === "frame").stroke; // edge/inset → stroke
  // override wins over the accent
  let out = rethemeDoc(s.doc, s.doc.brand, Object.assign({}, s.doc.brand, { frameColor: "#7ed09a", accent: "#00ccff" }));
  assert.equal(frameCol(out), "#7ed09a");
  // clearing it (null) falls back to the accent default
  let cleared = rethemeDoc(out, out.brand, Object.assign({}, out.brand, { frameColor: null }));
  assert.equal(frameCol(cleared), cleared.brand.accent);
});

test("detachPhoto turns the bg photo into an editable element, scrim folded onto it, bg→solid (F1)", () => {
  let s = initStudio();                          // sample slide 0 has an image background + scrim
  const before = cur(s).background;
  assert.equal(before.type, "image");
  s = reducer(s, { type: "detachPhoto" });
  const sl = cur(s);
  assert.equal(sl.background.type, "color");     // background dropped to solid
  const photo = sl.elements.find((e) => e.role === "photo");
  assert.ok(photo && photo.type === "image" && photo.src === before.src);
  assert.ok(photo.thumb, "photo carries a thumb so the off-screen strip stays light");
  assert.equal(photo.w, 1080); assert.equal(photo.h, 1350);     // full-bleed
  // The scrim is now a PROPERTY of the photo (non-blocking overlay), not a rect.
  assert.equal(photo.scrim, before.scrim, "scrim folded onto the photo element");
  assert.ok(!sl.elements.some((e) => e.role === "scrim"), "no separate scrim rect to block clicks");
  assert.equal(s.selectedId, photo.id, "new photo is selected for immediate editing");
  // §3: still exactly ONE decoded raster (one image element, solid background)
  const rasters = (sl.background.type === "image" ? 1 : 0) + sl.elements.filter((e) => e.type === "image").length;
  assert.equal(rasters, 1);
});

test("detachPhoto is a no-op on a solid-background slide (F1)", () => {
  let s = initStudio();
  s = reducer(s, { type: "setBg", patch: { type: "color", color: "#101010", src: "", scrim: 0 } });
  assert.equal(reducer(s, { type: "detachPhoto" }), s); // unchanged → no history frame
});

test("imageToBackground flattens a photo element back to the bg, re-absorbing the scrim (F1)", () => {
  let s = initStudio();
  s = reducer(s, { type: "detachPhoto" });
  const photo = cur(s).elements.find((e) => e.role === "photo");
  const scrim = photo.scrim;                                      // scrim now lives on the photo
  s = reducer(s, { type: "imageToBackground", id: photo.id });
  const sl = cur(s);
  assert.equal(sl.background.type, "image");
  assert.equal(sl.background.src, photo.src);
  assert.equal(sl.background.scrim, scrim);                       // scrim recovered from the element
  assert.ok(!sl.elements.some((e) => e.role === "photo" || e.role === "scrim")); // gone
});

test("copy/paste: copyEl stashes without a history frame; paste adds an offset clone, selected", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("text", { id: "A", x: 100, y: 100, w: 200, h: 60, content: "hi" }) });
  const framesBefore = s.past.length;
  s = reducer(s, { type: "copyEl", id: "A" });
  assert.ok(s.clipboard && s.clipboard.content === "hi", "clipboard holds the element");
  assert.equal(s.past.length, framesBefore, "copy adds NO undo frame");
  const nEls = cur(s).elements.length;
  s = reducer(s, { type: "paste" });
  const els = cur(s).elements;
  assert.equal(els.length, nEls + 1, "paste added one element");
  const pasted = els.find((e) => e.id === s.selectedId);
  assert.ok(pasted && pasted.id !== "A", "pasted copy has a fresh id and is selected");
  assert.equal(pasted.x, 120); assert.equal(pasted.y, 120);       // offset +20 on the same slide
  assert.equal(pasted.content, "hi");
  assert.equal(s.past.length, framesBefore + 1, "paste is one undo frame");
});

test("copy/paste: paste is a no-op with an empty clipboard; cut copies then removes (undoable)", () => {
  let s = initStudio();
  const n0 = cur(s).elements.length;
  s = reducer(s, { type: "paste" });                              // nothing copied yet
  assert.equal(cur(s).elements.length, n0, "empty paste does nothing");
  s = reducer(s, { type: "add", element: makeElement("rect", { id: "R", x: 40, y: 40 }) });
  const withR = cur(s).elements.length;
  s = reducer(s, { type: "cut", id: "R" });
  assert.ok(s.clipboard && s.clipboard.id === "R", "cut stashed the element");
  assert.ok(!cur(s).elements.some((e) => e.id === "R"), "cut removed it");
  assert.equal(s.selectedId, null);
  s = reducer(s, { type: "undo" });                               // cut is undoable
  assert.ok(cur(s).elements.some((e) => e.id === "R"), "undo restores the cut element");
});

// --- multi-select + grouping (group.js wired through the store) ------------
function threeEls() {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("rect", { id: "A", x: 0, y: 0, w: 100, h: 40 }) });
  s = reducer(s, { type: "add", element: makeElement("rect", { id: "B", x: 200, y: 20, w: 80, h: 60 }) });
  s = reducer(s, { type: "add", element: makeElement("rect", { id: "C", x: 50, y: 300, w: 120, h: 30 }) });
  return s;
}
const byId = (s, id) => cur(s).elements.find((e) => e.id === id);

test("select is single by default; ⇧-click (additive) accumulates a multi-selection", () => {
  let s = threeEls();
  s = reducer(s, { type: "select", id: "A" });
  assert.deepEqual(s.selectedIds, ["A"]);
  assert.equal(s.selectedId, "A");
  s = reducer(s, { type: "select", id: "C", additive: true });
  assert.deepEqual(s.selectedIds.slice().sort(), ["A", "C"]);
  // plain (non-additive) select collapses back to one
  s = reducer(s, { type: "select", id: "B" });
  assert.deepEqual(s.selectedIds, ["B"]);
});

test("group binds the selection, and selecting one member re-selects the whole group", () => {
  let s = threeEls();
  s = reducer(s, { type: "select", id: "A" });
  s = reducer(s, { type: "select", id: "B", additive: true });
  s = reducer(s, { type: "group" });
  const gid = byId(s, "A").groupId;
  assert.ok(gid && byId(s, "B").groupId === gid, "A and B share a fresh groupId");
  assert.equal(byId(s, "C").groupId, undefined, "C is untouched");
  assert.equal(s.past.length > 0, true, "group is undoable");
  // clicking A alone pulls B back in
  s = reducer(s, { type: "select", id: "A" });
  assert.deepEqual(s.selectedIds.slice().sort(), ["A", "B"]);
  // ungroup dissolves it
  s = reducer(s, { type: "ungroup" });
  assert.equal(byId(s, "A").groupId, undefined);
});

test("group is a no-op with fewer than two selected", () => {
  let s = threeEls();
  s = reducer(s, { type: "select", id: "A" });
  const before = s;
  s = reducer(s, { type: "group" });
  assert.equal(byId(s, "A").groupId, undefined);
});

test("moveMany shifts every selected id by the delta (undoable in one frame)", () => {
  let s = threeEls();
  const p = s.past.length;
  s = reducer(s, { type: "moveMany", ids: ["A", "B"], dx: 10, dy: -5 });
  assert.equal(byId(s, "A").x, 10); assert.equal(byId(s, "A").y, -5);
  assert.equal(byId(s, "B").x, 210); assert.equal(byId(s, "B").y, 15);
  assert.equal(byId(s, "C").x, 50, "unselected C stays put");
  assert.equal(s.past.length, p + 1);
});

test("selectMarquee expands to whole groups; deleteMany removes the selection", () => {
  let s = threeEls();
  s = reducer(s, { type: "select", id: "A" });
  s = reducer(s, { type: "select", id: "B", additive: true });
  s = reducer(s, { type: "group" });
  // marquee hitting only A brings in its group-mate B
  s = reducer(s, { type: "selectMarquee", ids: ["A"] });
  assert.deepEqual(s.selectedIds.slice().sort(), ["A", "B"]);
  s = reducer(s, { type: "deleteMany", ids: s.selectedIds });
  assert.ok(!cur(s).elements.some((e) => e.id === "A" || e.id === "B"), "both removed");
  assert.ok(cur(s).elements.some((e) => e.id === "C"), "C survives");
  assert.deepEqual(s.selectedIds, []);
});

test("align left snaps selected elements to their shared box edge", () => {
  let s = threeEls();
  s = reducer(s, { type: "select", id: "A" });
  s = reducer(s, { type: "select", id: "B", additive: true });
  s = reducer(s, { type: "align", mode: "left" });
  assert.equal(byId(s, "A").x, 0);
  assert.equal(byId(s, "B").x, 0);
});

// --- collab: applyRemote merges peer ops without polluting undo/selection ----
test("applyRemote merges a peer's el.set without adding an undo frame", () => {
  let s = threeEls();
  s = reducer(s, { type: "select", id: "C" });
  const past = s.past.length;
  const sid = cur(s).id;
  s = reducer(s, { type: "applyRemote", ops: [{ t: "el.set", slide: sid, id: "A", patch: { x: 77 } }] });
  assert.equal(byId(s, "A").x, 77, "peer edit applied to the doc");
  assert.equal(s.past.length, past, "remote edit is NOT undoable");
  assert.equal(s.selectedId, "C", "my selection is untouched");
});

test("applyRemote shields the element I'm editing (advisory lock)", () => {
  let s = threeEls();
  const sid = cur(s).id;
  s = reducer(s, { type: "applyRemote", ops: [{ t: "el.set", slide: sid, id: "A", patch: { x: 500 } }], held: ["A"] });
  assert.equal(byId(s, "A").x, 0, "held element ignores the remote patch");
});

test("applyRemote clamps the slide index when a peer deletes slides", () => {
  let s = initStudio();
  s = reducer(s, { type: "addSlide" });
  s = reducer(s, { type: "setSlide", index: 1 });
  assert.equal(s.slideIndex, 1);
  const goneId = s.doc.slides[1].id;
  s = reducer(s, { type: "applyRemote", ops: [{ t: "slide.del", id: goneId }] });
  assert.equal(s.doc.slides.length, 1);
  assert.equal(s.slideIndex, 0, "index clamped after the peer removed my slide");
});
