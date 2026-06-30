import test from "node:test";
import assert from "node:assert/strict";
import { barTop } from "../app/studio/barlayout";

const H = 42, VH = 900;

test("barTop: floats above the selection when there is room", () => {
  const { top, below } = barTop({ top: 600, bottom: 640 }, H, VH);
  assert.equal(below, false);
  assert.equal(top, 600 - H - 12); // 546
});

test("barTop: flips BELOW when the line is too near the viewport top", () => {
  const { top, below } = barTop({ top: 30, bottom: 70 }, H, VH);
  assert.equal(below, true);
  assert.equal(top, 70 + 12); // below the selection, never over it
});

test("barTop: the flip threshold is rect.top < 62 (= H + 12 + 8)", () => {
  assert.equal(barTop({ top: 62, bottom: 100 }, H, VH).below, false); // just enough room
  assert.equal(barTop({ top: 61, bottom: 100 }, H, VH).below, true);  // one px short → flip
});

test("barTop: never positioned off the bottom of the viewport", () => {
  const { top } = barTop({ top: 2000, bottom: 2040 }, H, VH);
  assert.ok(top <= VH - H - 8);
});

test("barTop: a below-placement is also clamped to the viewport bottom", () => {
  const { top } = barTop({ top: 5, bottom: VH + 50 }, H, VH);
  assert.ok(top <= VH - H - 8);
});
