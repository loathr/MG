// Unit checks for app/studio/geometry.js snapping — snapMove (position snap to
// artboard + sibling lines) and snapResize (edge snap while resizing, opposite
// edge fixed, never below the minimum). Artboard-coordinate space; pure.
import test from "node:test";
import assert from "node:assert/strict";
import { snapMove, snapResize, scaleTextResize } from "../app/studio/geometry.js";

const ART = { w: 1080, h: 1350 };

test("snapMove: box near artboard center snaps and reports a guide", () => {
  // a 200x100 box whose center is 5px off the artboard centerX (540)
  const box = { x: 540 - 100 - 5, y: 300, w: 200, h: 100 }; // centerX = 535
  const r = snapMove(box, ART, [], 8);
  assert.equal(r.x + box.w / 2, 540);                         // centered exactly
  assert.ok(r.guides.some((g) => g.axis === "x" && g.pos === 540));
});

test("snapMove: snaps a left edge to a sibling's left edge", () => {
  const sib = { x: 300, y: 0, w: 100, h: 100 };
  const box = { x: 304, y: 500, w: 120, h: 60 };              // left edge 4px from 300
  const r = snapMove(box, ART, [sib], 8);
  assert.equal(r.x, 300);
  assert.ok(r.guides.some((g) => g.axis === "x" && g.pos === 300));
});

test("snapMove: nothing within threshold → unchanged, no guides", () => {
  const box = { x: 123, y: 456, w: 100, h: 80 };
  const r = snapMove(box, ART, [], 3);
  assert.equal(r.x, 123);
  assert.equal(r.y, 456);
  assert.deepEqual(r.guides, []);
});

test("snapResize: right handle snaps right edge to artboard edge, left fixed", () => {
  // box right edge at 1074, 6px shy of 1080; dragging the right handle (sx:1)
  const box = { x: 200, y: 100, w: 874, h: 200 }; // right = 1074
  const r = snapResize(box, 1, 0, ART, [], 8, 16);
  assert.equal(r.x, 200);          // left edge fixed
  assert.equal(r.x + r.w, 1080);   // right edge snapped to the artboard edge
  assert.ok(r.guides.some((g) => g.axis === "x" && g.pos === 1080));
});

test("snapResize: left handle snaps left edge, right edge stays put", () => {
  const box = { x: 6, y: 100, w: 300, h: 200 }; // left = 6, right = 306
  const r = snapResize(box, -1, 0, ART, [], 8, 16);
  assert.equal(r.x, 0);            // left snapped to artboard left
  assert.equal(r.x + r.w, 306);    // right edge unchanged
});

test("snapResize: bottom handle snaps to a sibling's top edge", () => {
  const sib = { x: 0, y: 800, w: 100, h: 100 }; // top at 800
  const box = { x: 0, y: 400, w: 200, h: 396 }; // bottom = 796, 4px from 800
  const r = snapResize(box, 0, 1, ART, [sib], 8, 16);
  assert.equal(r.y + r.h, 800);
  assert.ok(r.guides.some((g) => g.axis === "y" && g.pos === 800));
});

test("snapResize: never snaps below the minimum size", () => {
  // right edge close to a line that would make width < 16
  const box = { x: 100, y: 0, w: 20, h: 100 };  // right = 120; a target at 110 → w=10
  const r = snapResize(box, 1, 0, ART, [{ x: 110, y: 0, w: 4, h: 4 }], 12, 16);
  assert.equal(r.w, 20);          // rejected — would drop below min
  assert.deepEqual(r.guides, []);
});

test("snapResize: sx:0 handle leaves x/w untouched", () => {
  const box = { x: 5, y: 300, w: 200, h: 100 }; // left near 0 but sx is 0
  const r = snapResize(box, 0, 1, ART, [], 8, 16);
  assert.equal(r.x, 5);
  assert.equal(r.w, 200);
});

test("scaleTextResize: a corner scales the font with the box, opposite corner fixed", () => {
  const el = { type: "text", x: 100, y: 100, w: 200, h: 80, fontSize: 40 };
  // drag the bottom-right corner out to double the width → font scales up, anchor
  // (top-left) stays at 100,100
  const box = { x: 100, y: 100, w: 400, h: 160 };       // 2x
  const r = scaleTextResize(el, 1, 1, box);
  assert.equal(r.fontSize, 80, "font doubled");
  assert.equal(r.x, 100); assert.equal(r.y, 100);        // top-left anchor fixed
  assert.equal(r.w, 400); assert.equal(r.h, 160);
});

test("scaleTextResize: dragging the top-left corner keeps the bottom-right fixed", () => {
  const el = { type: "text", x: 100, y: 100, w: 200, h: 80, fontSize: 40 };
  // shrink toward the bottom-right (handle sx:-1, sy:-1) to half size
  const box = { x: 200, y: 140, w: 100, h: 40 };         // 0.5x
  const r = scaleTextResize(el, -1, -1, box);
  assert.equal(r.fontSize, 20, "font halved");
  // bottom-right corner (300,180) stays put
  assert.equal(r.x + r.w, 300);
  assert.equal(r.y + r.h, 180);
});

test("scaleTextResize: font clamps to 6..400 and tracking scales with it", () => {
  const el = { type: "text", x: 0, y: 0, w: 100, h: 40, fontSize: 40, letterSpacing: 2 };
  const huge = scaleTextResize(el, 1, 1, { x: 0, y: 0, w: 2000, h: 800 });
  assert.equal(huge.fontSize, 400, "clamped to max");
  const tiny = scaleTextResize(el, 1, 1, { x: 0, y: 0, w: 5, h: 2 });
  assert.equal(tiny.fontSize, 6, "clamped to min");
  // tracking scales with the effective font ratio (2x → letterSpacing 4)
  const dbl = scaleTextResize(el, 1, 1, { x: 0, y: 0, w: 200, h: 80 });
  assert.equal(dbl.letterSpacing, 4);
});
