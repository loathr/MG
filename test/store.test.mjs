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
import { brandFromStyle } from "../app/studio/styles.js";

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

test("a continuous drag (update same id) coalesces into one undo frame", () => {
  let s = initStudio();
  s = reducer(s, { type: "add", element: makeElement("rect", { id: "R" }) });
  s = reducer(s, { type: "add", element: makeElement("rect", { id: "R2" }) });
  const afterAdds = s.past.length;
  s = reducer(s, { type: "update", id: "R", patch: { x: 10 } });
  const afterFirstUpdate = s.past.length;
  assert.ok(afterFirstUpdate > afterAdds);
  s = reducer(s, { type: "update", id: "R", patch: { x: 20 } });   // same id → coalesced
  assert.equal(s.past.length, afterFirstUpdate);                   // no new frame
  s = reducer(s, { type: "update", id: "R2", patch: { x: 5 } });   // different id → new frame
  assert.equal(s.past.length, afterFirstUpdate + 1);
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

test("rethemeDoc carries the inline highlight marker to the new accent + bg", () => {
  const doc = slidesToDoc(
    [{ role: "COVER", heading: "A" },
     { heading: "H", body: "the quick brown fox", highlight: "quick brown" },
     { role: "CLOSER", heading: "Z" }],
    "editorial",
  );
  const findHL = (d) => d.slides.flatMap((s) => s.elements).find((e) => e.highlightColor);
  const before = findHL(doc);
  assert.ok(before, "expected a highlighted element from generation");
  assert.equal(before.highlightColor, "#e23744"); // editorial accent
  const prev = doc.brand;
  const next = Object.assign({}, prev, { accent: "#00ff00", bg: "#111111" });
  const after = findHL(rethemeDoc(doc, prev, next));
  assert.equal(after.highlightColor, "#00ff00"); // marker background follows the new accent
  assert.equal(after.highlightText, "#111111");  // knockout text follows the new deck bg
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
