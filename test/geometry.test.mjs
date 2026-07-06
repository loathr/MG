// Unit checks for app/studio/geometry.js snapping — snapMove (position snap to
// artboard + sibling lines) and snapResize (edge snap while resizing, opposite
// edge fixed, never below the minimum). Artboard-coordinate space; pure.
import test from "node:test";
import assert from "node:assert/strict";
import { snapMove, snapResize } from "../app/studio/geometry.js";

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
