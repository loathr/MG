// Unit checks for app/studio/model.js — the pure element/slide/doc model and the
// highlight-run splitter shared by every renderer.
import test from "node:test";
import assert from "node:assert/strict";
import {
  ARTBOARD_W, ARTBOARD_H, uid, makeElement, ELEMENT_DEFAULTS,
  blankSlide, sampleSlide, cloneSlide, imageBackground,
  findElement, highlightRuns, uploadResult,
  styledRuns, applyRunStyle, clearRunStyle, remapRuns, isUniformText, elementBaseStyle, highlightOffsets,
  bakeHighlight, bakeDocHighlights, clearHighlightRuns, correctionSite, applyCorrectionToDoc,
  cropRect, imageTransform, cropAnchor, reframeCrop,
} from "../app/studio/model.js";

test("cropRect: no crop = centred cover band; zoom shrinks the source window", () => {
  // a 1000x1000 image into a 100x50 (2:1) box → cover keeps the middle horizontal band
  const base = cropRect(1000, 1000, 100, 50, null);
  assert.deepEqual(base, { sx: 0, sy: 250, sw: 1000, sh: 500 });
  // zoom 2 (centred) halves the source window, still centred on the cover band
  const z = cropRect(1000, 1000, 100, 50, { zoom: 2, x: 0.5, y: 0.5 });
  assert.equal(z.sw, 500);
  assert.equal(z.sh, 250);
  assert.equal(z.sx, 250);   // centred horizontally
  // focal x=1 pushes the window to the right edge under zoom
  assert.equal(cropRect(1000, 1000, 100, 50, { zoom: 2, x: 1, y: 0.5 }).sx, 500);
  // zoom is clamped to >= 1 (no zoom-out)
  assert.deepEqual(cropRect(1000, 1000, 100, 50, { zoom: 0.3 }), base);
});

test("imageTransform: crop focal + flip + mono compose into CSS", () => {
  assert.deepEqual(imageTransform({}), {});                              // plain image → no overrides
  assert.equal(imageTransform({ flipX: true }).transform, "scaleX(-1) scaleY(1)"); // plain flip = centre mirror
  assert.equal(imageTransform({ flipX: true }).transformOrigin, "50% 50%");
  assert.equal(imageTransform({ mono: true }).filter, "grayscale(1)");
  const c = imageTransform({ crop: { zoom: 2, x: 0.25, y: 0.75 } });
  assert.equal(c.transform, "scaleX(2) scaleY(2)");
  assert.equal(c.transformOrigin, "25% 75%");
  assert.equal(c.objectPosition, "25% 75%");
});

test("imageTransform: a flipped + zoomed + panned crop mirrors about the box centre (export parity)", () => {
  // The export canvas centre-mirrors the crop window; the live CSS must do the
  // same. A bare scaleX(-z) about the focal point would diverge (and leave a blank
  // wedge), so the cropped-flip path is the explicit mirror∘zoom chain at origin 0 0.
  const f = imageTransform({ crop: { zoom: 2, x: 0.25, y: 0.4 }, flipX: true });
  assert.equal(f.transformOrigin, "0 0");
  assert.equal(f.objectPosition, "25% 40%");
  // X axis: mirror-about-centre then zoom-about-focal; Y axis: zoom only (no flip).
  assert.equal(
    f.transform,
    "translateX(50%) scaleX(-1) translateX(-50%) translateX(25%) scaleX(2) translateX(-25%) translateY(40%) scaleY(2) translateY(-40%)",
  );
  // flipY mirrors the Y axis instead.
  const g = imageTransform({ crop: { zoom: 1, x: 0.5, y: 0.3 }, flipY: true });
  assert.equal(g.transformOrigin, "0 0");
  assert.equal(
    g.transform,
    "translateX(50%) scaleX(1) translateX(-50%) translateY(50%) scaleY(-1) translateY(-50%) translateY(30%) scaleY(1) translateY(-30%)",
  );
  // No-flip zoomed crop is unchanged (the simple scale about the focal point).
  assert.equal(imageTransform({ crop: { zoom: 2, x: 0.25, y: 0.75 } }).transformOrigin, "25% 75%");
});

test("artboard is Instagram portrait 1080x1350", () => {
  assert.equal(ARTBOARD_W, 1080);
  assert.equal(ARTBOARD_H, 1350);
});

test("uid is unique and carries its prefix", () => {
  const a = uid("slide"), b = uid("slide");
  assert.notEqual(a, b);
  assert.match(a, /^slide_/);
});

test("makeElement merges type defaults with overrides", () => {
  const t = makeElement("text", { content: "Hi", fontSize: 40 });
  assert.equal(t.type, "text");
  assert.equal(t.content, "Hi");
  assert.equal(t.fontSize, 40);
  assert.equal(t.fontFamily, ELEMENT_DEFAULTS.text.fontFamily); // default kept
  assert.equal(t.locked, false);
  assert.equal(makeElement("rect", {}).fill, ELEMENT_DEFAULTS.rect.fill);
});

test("a text element can carry shape fields (the text-shape backing)", () => {
  // Shapes aren't their own type — they ride on a text element.
  const t = makeElement("text", { content: "Hot take", shape: "speech", shapeFill: "#e23744", tailSide: "left" });
  assert.equal(t.type, "text");
  assert.equal(t.shape, "speech");
  assert.equal(t.shapeFill, "#e23744");
  assert.equal(makeElement("text", {}).shape, undefined); // plain text has no shape
});

test("blankSlide is a solid background with no elements", () => {
  const s = blankSlide();
  assert.equal(s.background.type, "color");
  assert.deepEqual(s.elements, []);
});

test("cloneSlide gives fresh ids and is independent of the source", () => {
  const src = sampleSlide();
  const dup = cloneSlide(src);
  assert.notEqual(dup.id, src.id);
  assert.equal(dup.elements.length, src.elements.length);
  for (let i = 0; i < dup.elements.length; i++) {
    assert.notEqual(dup.elements[i].id, src.elements[i].id);
  }
  dup.elements[0].x = 999;
  assert.notEqual(src.elements[0].x, 999); // mutation isolated
});

test("cloneSlide remaps tetherTo to the cloned element ids (B6)", () => {
  const src = { id: "s1", w: 1080, h: 1350, background: { type: "color" }, elements: [
    makeElement("image", { id: "PARENT", x: 0, y: 0 }),
    makeElement("text", { id: "CHILD", x: 10, y: 10, content: "badge", tetherTo: "PARENT" }),
  ] };
  const dup = cloneSlide(src);
  const newParent = dup.elements[0], newChild = dup.elements[1];
  assert.notEqual(newParent.id, "PARENT");
  assert.equal(newChild.tetherTo, newParent.id, "child re-points at the CLONED parent, not the original id");
  // a dangling tether (parent not on the slide) is dropped, not carried stale
  const orphan = { id: "s2", w: 1080, h: 1350, background: {}, elements: [makeElement("text", { id: "C", tetherTo: "GONE" })] };
  assert.equal(cloneSlide(orphan).elements[0].tetherTo, null);
});

test("imageBackground is a single image + one scrim (FLAT-LAYERS §3)", () => {
  const bg = imageBackground({ url: "u", thumb: "t", credit: "c", source: "s" });
  assert.equal(bg.type, "image");
  assert.equal(bg.src, "u");
  assert.equal(bg.thumb, "t");
  assert.equal(bg.scrim, 0.4);                       // default scrim
  assert.equal(imageBackground({ url: "u" }, 0.7).scrim, 0.7); // override respected
  assert.equal(imageBackground({ url: "u" }).thumb, "u");      // thumb falls back to url
});

test("findElement locates by id, null when absent", () => {
  const s = sampleSlide();
  const first = s.elements[0];
  assert.equal(findElement(s, first.id), first);
  assert.equal(findElement(s, "nope"), null);
  assert.equal(findElement(null, "x"), null);
});

test("highlightRuns: no needle yields one plain run", () => {
  assert.deepEqual(highlightRuns("hello world", ""), [{ text: "hello world", hl: false }]);
  assert.deepEqual(highlightRuns("hello world", "xyz"), [{ text: "hello world", hl: false }]);
});

test("highlightRuns: splits around the first match, preserving case", () => {
  assert.deepEqual(highlightRuns("The Quick brown fox", "quick"), [
    { text: "The ", hl: false },
    { text: "Quick", hl: true },        // original casing preserved
    { text: " brown fox", hl: false },
  ]);
});

test("highlightRuns: match at the start or end gives two runs", () => {
  assert.deepEqual(highlightRuns("quick fox", "quick"), [
    { text: "quick", hl: true },
    { text: " fox", hl: false },
  ]);
  assert.deepEqual(highlightRuns("the fox", "fox"), [
    { text: "the ", hl: false },
    { text: "fox", hl: true },
  ]);
});

// --- rich-text runs --------------------------------------------------------

test("styledRuns: plain text is one span carrying the element base style", () => {
  const el = makeElement("text", { content: "Hello", color: "#fff", fontSize: 40 });
  const spans = styledRuns(el);
  assert.equal(spans.length, 1);
  assert.equal(spans[0].text, "Hello");
  assert.equal(spans[0].color, "#fff");
  assert.equal(spans[0].fontWeight, 700);   // text default weight
  assert.equal(isUniformText(el), true);    // container CSS covers it → fast path
});

test("styledRuns: a run recolours/bolds just its range, rest inherits base", () => {
  const el = makeElement("text", { content: "One two three", color: "#fff", fontWeight: 400,
    runs: [{ start: 4, end: 7, color: "#e23744", bold: true }] });
  const spans = styledRuns(el);
  assert.deepEqual(spans.map((s) => s.text), ["One ", "two", " three"]);
  assert.equal(spans[0].color, "#fff");
  assert.equal(spans[1].color, "#e23744");
  assert.equal(spans[1].fontWeight, 700);   // bold:true → 700
  assert.equal(spans[0].fontWeight, 400);   // inherits element 400
  assert.equal(spans[2].color, "#fff");
  assert.equal(isUniformText(el), false);
});

test("applyRunStyle never splits a surrogate pair (emoji-safe boundaries) — D4", () => {
  const text = "Big win 🎉";            // "Big win " = 8 units; 🎉 = units 8,9; length 10
  assert.equal(text.length, 10);
  // end lands mid-emoji (9) → snaps UP to 10 so the 🎉 is fully styled, never halved
  let runs = applyRunStyle(text, [], 0, 9, { bold: true });
  assert.ok(runs.every((r) => r.start !== 9 && r.end !== 9), "no run boundary inside the pair");
  assert.equal(runs[0].end, 10);
  // start lands mid-emoji (9) → snaps DOWN to 8 so the 🎉 isn't half-styled
  runs = applyRunStyle(text, [], 9, 10, { bold: true });
  assert.equal(runs[0].start, 8);
  // clearRunStyle snaps the same way
  const styled = applyRunStyle(text, [], 0, 10, { bold: true });
  const cleared = clearRunStyle(text, styled, 0, 9);
  assert.ok(cleared.every((r) => r.start !== 9 && r.end !== 9));
  // no resulting run slice ends on a lone high surrogate (a split emoji)
  for (const r of runs) {
    const last = text.slice(r.start, r.end).charCodeAt(text.slice(r.start, r.end).length - 1);
    assert.ok(!(last >= 0xd800 && last <= 0xdbff), "no run ends on a lone high surrogate");
  }
});

test("underline: element-wide and per-run, independent of strike", () => {
  // whole-box underline
  const el = makeElement("text", { content: "abc", underline: true });
  assert.equal(styledRuns(el)[0].underline, true);
  assert.equal(styledRuns(el)[0].strike, false);
  // a run underlines just its range
  const r = makeElement("text", { content: "One two", underline: false,
    runs: [{ start: 4, end: 7, underline: true }] });
  const spans = styledRuns(r);
  assert.equal(spans.find((s) => s.text === "two").underline, true);
  assert.equal(spans.find((s) => s.text === "One ").underline, false);
});

test("styledRuns: a per-span SIZE run resizes just its range; rest keeps the element size", () => {
  const el = makeElement("text", { content: "big small", fontSize: 40, runs: [{ start: 0, end: 3, size: 96 }] });
  const spans = styledRuns(el);
  assert.deepEqual(spans.map((s) => s.text), ["big", " small"]);
  assert.equal(spans[0].fontSize, 96);   // the sized run
  assert.equal(spans[1].fontSize, 40);   // inherits the element fontSize
  assert.equal(isUniformText(el), false); // a run → not the uniform fast path
  // applyRunStyle writes the size key over a range
  const runs = applyRunStyle("hello world", [], 6, 11, { size: 72 });
  assert.equal(runs[0].size, 72);
  assert.deepEqual([runs[0].start, runs[0].end], [6, 11]);
});

test("styledRuns: element-wide background/outline force inline spans (not uniform)", () => {
  const bgEl = makeElement("text", { content: "Hi", textBg: "#ffd34e" });
  assert.equal(isUniformText(bgEl), false);
  assert.equal(styledRuns(bgEl)[0].bg, "#ffd34e");
  const strokeEl = makeElement("text", { content: "Hi", textStroke: "#fff", textStrokeWidth: 2 });
  assert.equal(isUniformText(strokeEl), false);
  assert.equal(styledRuns(strokeEl)[0].stroke, "#fff");
  assert.equal(styledRuns(strokeEl)[0].strokeWidth, 2);
});

test("styledRuns: the back-compat highlight marker becomes a bg run", () => {
  const el = makeElement("text", { content: "the big win", color: "#fff", highlight: "big", highlightColor: "#e23744", highlightText: "#000" });
  const spans = styledRuns(el);
  const mark = spans.find((s) => s.text === "big");
  assert.equal(mark.bg, "#e23744");
  assert.equal(mark.color, "#000");
});

test("bakeHighlight: folds the marker into a real run and drops the marker fields", () => {
  const el = makeElement("text", { content: "the big win", color: "#fff", highlight: "big", highlightColor: "#e23744", highlightText: "#000" });
  const baked = bakeHighlight(el);
  assert.equal(baked.highlight, undefined);
  assert.equal(baked.highlightColor, undefined);
  assert.equal(baked.highlightText, undefined);
  assert.deepEqual(baked.runs, [{ start: 4, end: 7, bg: "#e23744", color: "#000" }]);
  // and it renders identically to the pre-bake derived marker
  const mark = styledRuns(baked).find((s) => s.text === "big");
  assert.equal(mark.bg, "#e23744");
  assert.equal(mark.color, "#000");
});

test("bakeHighlight: no marker is a no-op (same reference); dead phrase just drops the marker", () => {
  const plain = makeElement("text", { content: "hello", color: "#fff" });
  assert.equal(bakeHighlight(plain), plain);
  const dead = makeElement("text", { content: "hello", highlight: "zzz", highlightColor: "#e23744" });
  const baked = bakeHighlight(dead);
  assert.equal(baked.highlight, undefined);
  assert.equal(baked.runs, undefined); // phrase absent → no run, marker cleared
});

test("bakeHighlight: an explicit run wins over the marker on overlap (precedence preserved)", () => {
  const el = makeElement("text", { content: "the big win", highlight: "big", highlightColor: "#e23744", runs: [{ start: 4, end: 7, bg: "#00ff00" }] });
  const baked = bakeHighlight(el);
  const mark = styledRuns(baked).find((s) => s.text === "big");
  assert.equal(mark.bg, "#00ff00"); // explicit run's bg, not the marker's
});

test("clearHighlightRuns: drops the highlight bg + its knockout colour, keeps other runs, drops empties", () => {
  // a baked highlight run (bg + knockout color) → removed entirely so text re-merges
  assert.deepEqual(clearHighlightRuns([{ start: 4, end: 7, bg: "#e23744", color: "#000" }]), []);
  // a highlight run that ALSO carries bold → keeps bold, loses bg + knockout color
  assert.deepEqual(clearHighlightRuns([{ start: 0, end: 3, bg: "#e23744", color: "#000", bold: true }]),
    [{ start: 0, end: 3, bold: true }]);
  // a plain colour run (no bg) is untouched
  assert.deepEqual(clearHighlightRuns([{ start: 1, end: 2, color: "#f00" }]), [{ start: 1, end: 2, color: "#f00" }]);
  assert.deepEqual(clearHighlightRuns([]), []);
  assert.deepEqual(clearHighlightRuns(undefined), []);
});

test("bakeDocHighlights: bakes every text element and no-ops an already-clean doc", () => {
  const doc = { slides: [{ elements: [
    makeElement("text", { content: "the big win", highlight: "big", highlightColor: "#e23744" }),
    makeElement("text", { content: "plain", color: "#fff" }),
  ] }] };
  const out = bakeDocHighlights(doc);
  assert.notEqual(out, doc); // changed → new ref
  assert.deepEqual(out.slides[0].elements[0].runs, [{ start: 4, end: 7, bg: "#e23744" }]);
  assert.equal(out.slides[0].elements[0].highlight, undefined);
  // a clean doc round-trips to the SAME reference (no needless state update)
  assert.equal(bakeDocHighlights(out), out);
});

test("correctionSite: true only when `wrong` is an exact substring of a text element on the slide", () => {
  const doc = { slides: [{ elements: [
    makeElement("text", { content: "Novo Nordisk hit $570 billion in 2023" }),
    makeElement("image", { src: "x" }),
  ] }] };
  assert.equal(correctionSite(doc, 0, "$570 billion"), true);
  assert.equal(correctionSite(doc, 0, "$999 billion"), false); // not present
  assert.equal(correctionSite(doc, 0, ""), false);             // empty
  assert.equal(correctionSite(doc, 5, "$570 billion"), false); // no such slide
});

test("applyCorrectionToDoc: replaces the phrase in the element (+ remaps runs) and the canonical content", () => {
  const doc = { slides: [{
    content: { body: "Novo Nordisk hit $570 billion in 2023" },
    elements: [makeElement("text", { content: "Novo Nordisk hit $570 billion in 2023", runs: [{ start: 0, end: 12, bold: true }] })],
  }] };
  const out = applyCorrectionToDoc(doc, 0, "$570 billion", "$633 billion");
  assert.notEqual(out, doc);
  assert.equal(out.slides[0].elements[0].content, "Novo Nordisk hit $633 billion in 2023");
  assert.equal(out.slides[0].content.body, "Novo Nordisk hit $633 billion in 2023");
  // "Novo Nordisk" (0..12) is before the edit, so its bold run survives intact
  assert.deepEqual(out.slides[0].elements[0].runs, [{ start: 0, end: 12, bold: true }]);
});

test("applyCorrectionToDoc: a no-op (same ref) when the phrase isn't found or is unchanged", () => {
  const doc = { slides: [{ content: { body: "hello" }, elements: [makeElement("text", { content: "hello" })] }] };
  assert.equal(applyCorrectionToDoc(doc, 0, "zzz", "yyy"), doc);   // absent
  assert.equal(applyCorrectionToDoc(doc, 0, "hello", "hello"), doc); // unchanged
  assert.equal(applyCorrectionToDoc(doc, 0, "", "x"), doc);        // empty wrong
});

test("applyRunStyle: sets a key over a range and merges adjacent equal runs", () => {
  let runs = applyRunStyle("abcdef", [], 1, 3, { color: "#f00" });
  assert.deepEqual(runs, [{ start: 1, end: 3, color: "#f00" }]);
  // extend the same colour to an adjacent range → coalesces into one run
  runs = applyRunStyle("abcdef", runs, 3, 5, { color: "#f00" });
  assert.deepEqual(runs, [{ start: 1, end: 5, color: "#f00" }]);
  // a different key layered on a sub-range splits correctly
  runs = applyRunStyle("abcdef", runs, 2, 4, { bold: true });
  assert.equal(runs.length, 3);
  assert.deepEqual(runs[1], { start: 2, end: 4, color: "#f00", bold: true });
});

test("applyRunStyle: a null value clears that key (toggle off)", () => {
  const runs = applyRunStyle("abcdef", [{ start: 0, end: 6, bold: true }], 2, 4, { bold: null });
  // bold cleared in the middle → two bold runs remain around the gap
  assert.deepEqual(runs, [{ start: 0, end: 2, bold: true }, { start: 4, end: 6, bold: true }]);
});

test("clearRunStyle: strips all styling in a range", () => {
  const runs = clearRunStyle("abcdef", [{ start: 0, end: 6, color: "#f00", bold: true }], 0, 3);
  assert.deepEqual(runs, [{ start: 3, end: 6, color: "#f00", bold: true }]);
});

test("remapRuns: styling on the unchanged head/tail survives an edit; insertion is unstyled", () => {
  // "One two" → bold "two" (4..7); user types " more" at the end
  const out = remapRuns([{ start: 4, end: 7, bold: true }], "One two", "One two more");
  assert.deepEqual(out, [{ start: 4, end: 7, bold: true }]); // tail preserved, new text plain
  // delete the whole styled middle: bold "XYZ" (2..5) in "abXYZcd", edited to "abcd"
  const out2 = remapRuns([{ start: 2, end: 5, bold: true }], "abXYZcd", "abcd");
  assert.deepEqual(out2, []); // prefix "ab" + suffix "cd" survive; the styled middle is gone
});

test("remapRuns: no change returns the runs; empty runs stay empty", () => {
  assert.deepEqual(remapRuns([{ start: 0, end: 1, bold: true }], "ab", "ab"), [{ start: 0, end: 1, bold: true }]);
  assert.deepEqual(remapRuns([], "a", "abc"), []);
});

test("highlightOffsets finds the first case-insensitive match or null", () => {
  assert.deepEqual(highlightOffsets("The Big Win", "big"), { start: 4, end: 7 });
  assert.equal(highlightOffsets("nope", "zzz"), null);
  assert.equal(highlightOffsets("x", ""), null);
});

test("elementBaseStyle reads the element fields with sane defaults", () => {
  const b = elementBaseStyle(makeElement("text", { content: "x", color: "#abc", fontWeight: 700, italic: true, strike: true, textBg: "#111", textStroke: "#222", textStrokeWidth: 3 }));
  assert.equal(b.color, "#abc");
  assert.equal(b.fontWeight, 700);
  assert.equal(b.italic, true);
  assert.equal(b.strike, true);
  assert.equal(b.bg, "#111");
  assert.equal(b.stroke, "#222");
  assert.equal(b.strokeWidth, 3);
});

test("uploadResult mirrors a search-result shape (url+thumb, flagged uploaded)", () => {
  const r = uploadResult("data:src", "data:thumb", "beach.jpg");
  assert.equal(r.url, "data:src");
  assert.equal(r.thumb, "data:thumb");
  assert.equal(r.uploaded, true);
  assert.equal(r.source, "Upload");
  assert.equal(r.credit, "");                 // own uploads show a badge, not a credit strip
  assert.equal(r.alt, "beach.jpg");
  assert.equal(uploadResult("data:only").thumb, "data:only"); // thumb falls back to full src
});

test("reframe crop: shrinking the frame keeps the image fixed (not a minimizer)", () => {
  const nat = { w: 1000, h: 1000 };
  // 500-square box, no zoom, centred over a 1000-square image at cover → whole
  // image fills the box at scale 0.5.
  const el = { x: 0, y: 0, w: 500, h: 500, crop: { zoom: 1, x: 0.5, y: 0.5 } };
  const anchor = cropAnchor(el, nat);
  // Reframe by pulling the bottom-right corner in to a 250 square (top-left fixed).
  const c = reframeCrop(nat, anchor, { x: 0, y: 0, w: 250, h: 250 });
  // The kept window is the top-left quarter, at the SAME on-screen scale (zoom
  // doubles so the source window halves; focal pins to the top-left corner).
  assert.ok(Math.abs(c.zoom - 2) < 1e-6, "zoom compensates so the image doesn't shrink");
  assert.ok(Math.abs(c.x - 0) < 1e-6 && Math.abs(c.y - 0) < 1e-6, "focal pins the anchored corner");
});

test("reframe crop: same box round-trips to the original crop; grow past image clamps zoom>=1", () => {
  const nat = { w: 1200, h: 800 };
  const el = { x: 40, y: 60, w: 400, h: 300, crop: { zoom: 1.5, x: 0.3, y: 0.7 } };
  const anchor = cropAnchor(el, nat);
  const same = reframeCrop(nat, anchor, { x: 40, y: 60, w: 400, h: 300 });
  assert.ok(Math.abs(same.zoom - 1.5) < 1e-6, "identity reframe keeps zoom");
  assert.ok(Math.abs(same.x - 0.3) < 1e-6 && Math.abs(same.y - 0.7) < 1e-6, "identity reframe keeps focal");
  // Growing the frame far beyond what the image can cover at scale k clamps to 1.
  const big = reframeCrop(nat, anchor, { x: 40, y: 60, w: 4000, h: 3000 });
  assert.ok(big.zoom >= 1, "zoom never drops below 1");
});
