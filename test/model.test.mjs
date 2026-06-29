// Unit checks for app/studio/model.js — the pure element/slide/doc model and the
// highlight-run splitter shared by every renderer.
import test from "node:test";
import assert from "node:assert/strict";
import {
  ARTBOARD_W, ARTBOARD_H, uid, makeElement, ELEMENT_DEFAULTS,
  blankSlide, sampleSlide, cloneSlide, imageBackground,
  findElement, highlightRuns, uploadResult,
  styledRuns, applyRunStyle, clearRunStyle, remapRuns, isUniformText, elementBaseStyle, highlightOffsets,
} from "../app/studio/model.js";

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
