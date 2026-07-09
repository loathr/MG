// Unit checks for the placement-aware chrome stampers in store.js:
// stampLogo (scope + corner) and stampPageNumbers (on/off + side).
import test from "node:test";
import assert from "node:assert/strict";
import { stampLogo, stampPageNumbers } from "../app/studio/store.js";
import { ARTBOARD_W, ARTBOARD_H } from "../app/studio/model.js";

const doc4 = () => ({ brand: { muted: "#888" }, slides: [{ elements: [] }, { elements: [] }, { elements: [] }, { elements: [] }] });
const logosOf = (d) => d.slides.map((s) => s.elements.filter((e) => e.role === "logo").length);
const pagenosOf = (d) => d.slides.map((s) => (s.elements.find((e) => e.role === "pageno") || {}).content || null);

test("stampLogo default: bookends + top-right (back-compat, no opts)", () => {
  const d = stampLogo(doc4(), { src: "x", w: 160, h: 160 });
  assert.deepEqual(logosOf(d), [1, 0, 0, 1]);                 // cover + closer only
  const cover = d.slides[0].elements.find((e) => e.role === "logo");
  assert.equal(cover.x, ARTBOARD_W - 80 - 160);              // right edge
  assert.equal(cover.y, 80);                                  // top
  assert.equal(d.brand.logoScope, "coverclose");
  assert.equal(d.brand.logoPos, "tr");
});

test("stampLogo scope=every, pos=bl: every slide, bottom-left", () => {
  const d = stampLogo(doc4(), { src: "x", w: 160, h: 160 }, { scope: "every", pos: "bl" });
  assert.deepEqual(logosOf(d), [1, 1, 1, 1]);
  const e = d.slides[2].elements.find((el) => el.role === "logo");
  assert.equal(e.x, 80);                                      // left
  assert.equal(e.y, ARTBOARD_H - 80 - 160);                   // bottom
});

test("stampLogo scope=cover: cover only", () => {
  assert.deepEqual(logosOf(stampLogo(doc4(), { src: "x", w: 160, h: 160 }, { scope: "cover", pos: "tl" })), [1, 0, 0, 0]);
});

test("stampLogo null clears every logo", () => {
  const stamped = stampLogo(doc4(), { src: "x", w: 160, h: 160 }, { scope: "every" });
  assert.deepEqual(logosOf(stampLogo(stamped, null)), [0, 0, 0, 0]);
});

test("stampPageNumbers on: content slides only, 1-based, sided", () => {
  const d = stampPageNumbers(doc4(), { on: true, side: "right" });
  assert.deepEqual(pagenosOf(d), [null, "2", "3", null]);     // not cover/closer
  const p = d.slides[1].elements.find((e) => e.role === "pageno");
  assert.equal(p.align, "right");
  assert.equal(p.x, ARTBOARD_W - 80 - 200);
  assert.equal(d.brand.pageNumbers, true);
});

test("stampPageNumbers left side + off", () => {
  const left = stampPageNumbers(doc4(), { on: true, side: "left" });
  assert.equal(left.slides[1].elements.find((e) => e.role === "pageno").x, 80);
  assert.equal(left.slides[1].elements.find((e) => e.role === "pageno").align, "left");
  // off strips them all
  const off = stampPageNumbers(left, { on: false });
  assert.deepEqual(pagenosOf(off), [null, null, null, null]);
  assert.equal(off.brand.pageNumbers, false);
});
