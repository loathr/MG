// Unit checks for app/studio/model.js — the pure element/slide/doc model and the
// highlight-run splitter shared by every renderer.
import test from "node:test";
import assert from "node:assert/strict";
import {
  ARTBOARD_W, ARTBOARD_H, uid, makeElement, ELEMENT_DEFAULTS,
  blankSlide, sampleSlide, cloneSlide, imageBackground,
  findElement, highlightRuns,
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
