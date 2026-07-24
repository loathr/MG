// Unit checks for app/studio/geometry.js snapping — snapMove (position snap to
// artboard + sibling lines) and snapResize (edge snap while resizing, opposite
// edge fixed, never below the minimum). Artboard-coordinate space; pure.
import test from "node:test";
import assert from "node:assert/strict";
import { snapMove, snapResize, scaleTextResize, imageCornerResize, wheelZoom, canvasFitScale, zoomPanToCursor, clampCanvasPan, distributionSnap } from "../app/studio/geometry.js";

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

test("imageCornerResize: within the canvas just resizes the frame (no zoom)", () => {
  const el = { type: "image", x: 100, y: 100, w: 300, h: 200, crop: { zoom: 1, x: 0.5, y: 0.5 } };
  // bottom-right handle dragged to a frame still inside 1080x1350
  const r = imageCornerResize(el, 1, 1, { x: 100, y: 100, w: 500, h: 300 }, ART);
  assert.equal(r.w, 500); assert.equal(r.h, 300);
  assert.equal(r.crop, undefined, "no zoom while inside the canvas");
});

test("imageCornerResize: past the edge clamps the frame and folds overflow into zoom", () => {
  const el = { type: "image", x: 200, y: 200, w: 400, h: 300, crop: { zoom: 1, x: 0.5, y: 0.5 } };
  // drag the bottom-right corner way past the right/bottom edge
  const r = imageCornerResize(el, 1, 1, { x: 200, y: 200, w: 1600, h: 1600 }, ART);
  assert.equal(r.x + r.w, ART.w, "right edge clamped to the canvas");
  assert.equal(r.y + r.h, ART.h, "bottom edge clamped to the canvas");
  assert.ok(r.crop && r.crop.zoom > 1, "overflow became zoom (" + (r.crop && r.crop.zoom) + ")");
  assert.equal(r.crop.x, 0.5); // focal preserved
});

test("imageCornerResize: top-left handle keeps the bottom-right corner fixed", () => {
  const el = { type: "image", x: 300, y: 300, w: 200, h: 200 };
  const r = imageCornerResize(el, -1, -1, { x: 100, y: 100, w: 400, h: 400 }, ART);
  assert.equal(r.x + r.w, 500); // bottom-right (500,500) fixed
  assert.equal(r.y + r.h, 500);
});

test("wheelZoom: scroll up zooms in, down zooms out, clamped 1..8, focal kept", () => {
  const el = { type: "image", crop: { zoom: 2, x: 0.3, y: 0.7 } };
  assert.ok(wheelZoom(el, -100).zoom > 2, "scroll up (negative deltaY) zooms in");
  assert.ok(wheelZoom(el, 100).zoom < 2, "scroll down zooms out");
  assert.equal(wheelZoom(el, -100).x, 0.3); // focal preserved
  assert.equal(wheelZoom({ crop: { zoom: 1 } }, 10000).zoom, 1, "never below 1");
  assert.equal(wheelZoom({ crop: { zoom: 7.9 } }, -100000).zoom, 8, "clamped to 8");
});

// --- canvas zoom + pan (7a) ------------------------------------------------

const BOARD = { w: 1080, h: 1350 };
const VP = { w: 1200, h: 800 };

test("canvasFitScale: fits the board inside the viewport minus padding", () => {
  const s = canvasFitScale(VP, BOARD, 48);
  assert.equal(s, Math.min((1200 - 48) / 1080, (800 - 48) / 1350));
  assert.ok(BOARD.h * s <= VP.h && BOARD.w * s <= VP.w);
  // never collapses below the floor
  assert.equal(canvasFitScale({ w: 1, h: 1 }, BOARD, 48, 0.05), 0.05);
});

test("zoomPanToCursor: the artboard point under the cursor stays put across a zoom", () => {
  const scale = 0.5, pan = { x: 0, y: 0 };
  const cursor = { x: 300, y: 220 };
  // artboard point under the cursor BEFORE the zoom (board centred, pan 0)
  const tlx0 = VP.w / 2 - (BOARD.w * scale) / 2, tly0 = VP.h / 2 - (BOARD.h * scale) / 2;
  const wx = (cursor.x - tlx0) / scale, wy = (cursor.y - tly0) / scale;
  const ns = 1.4;
  const np = zoomPanToCursor(scale, pan, ns, cursor, VP, BOARD);
  // AFTER: same artboard point must map back to the same screen pixel
  const tlx1 = VP.w / 2 + np.x - (BOARD.w * ns) / 2, tly1 = VP.h / 2 + np.y - (BOARD.h * ns) / 2;
  assert.ok(Math.abs((tlx1 + wx * ns) - cursor.x) < 1e-6);
  assert.ok(Math.abs((tly1 + wy * ns) - cursor.y) < 1e-6);
});

test("zoomPanToCursor: zooming exactly at the viewport centre leaves a centred board centred", () => {
  const np = zoomPanToCursor(0.5, { x: 0, y: 0 }, 2, { x: VP.w / 2, y: VP.h / 2 }, VP, BOARD);
  assert.ok(Math.abs(np.x) < 1e-6 && Math.abs(np.y) < 1e-6);
});

test("clampCanvasPan: keeps at least `margin` px of the board on screen", () => {
  const scale = 1, margin = 60;
  const maxX = (BOARD.w * scale) / 2 + VP.w / 2 - margin;
  const clamped = clampCanvasPan(scale, { x: 99999, y: -99999 }, VP, BOARD, margin);
  assert.equal(clamped.x, maxX);
  assert.equal(clamped.y, -((BOARD.h * scale) / 2 + VP.h / 2 - margin));
  // a small pan is untouched
  assert.deepEqual(clampCanvasPan(scale, { x: 10, y: -20 }, VP, BOARD, margin), { x: 10, y: -20 });
});

// --- equal-spacing distribution (7b) ---------------------------------------

test("distributionSnap: box between two X-overlapping siblings snaps to equal gaps", () => {
  const above = { x: 100, y: 0, w: 200, h: 100 };   // bottom = 100
  const below = { x: 100, y: 500, w: 200, h: 100 };  // top = 500
  // span = 400, box h = 80 → equal top = 100 + (400-80)/2 = 260. Start 6px off.
  const box = { x: 100, y: 254, w: 200, h: 80 };
  const r = distributionSnap(box, [above, below], 8);
  assert.equal(r.y, 260, "snapped to the even position");
  const gapTop = r.y - 100, gapBot = 500 - (r.y + 80);
  assert.equal(gapTop, gapBot, "gaps equal");
  assert.equal(r.badges.length, 2);
  assert.ok(r.badges.every((b) => b.equal), "both badges flagged equal");
  assert.equal(r.badges[0].gap, 160);
});

test("distributionSnap: too far from even → measured but not snapped, badges not equal", () => {
  const above = { x: 100, y: 0, w: 200, h: 100 };
  const below = { x: 100, y: 500, w: 200, h: 100 };
  const box = { x: 100, y: 130, w: 200, h: 80 };     // gapTop=30, gapBot=290
  const r = distributionSnap(box, [above, below], 8);
  assert.equal(r.y, 130, "left where it was");
  assert.equal(r.badges.length, 2);
  assert.ok(!r.badges[0].equal && !r.badges[1].equal);
  assert.equal(r.badges[0].gap, 30);
  assert.equal(r.badges[1].gap, 290);
});

test("distributionSnap: horizontal distribution between left/right siblings", () => {
  const left = { x: 0, y: 100, w: 100, h: 200 };     // right = 100
  const right = { x: 600, y: 100, w: 100, h: 200 };   // left = 600
  // span = 500, box w = 100 → equal left = 100 + (500-100)/2 = 300. Start 5px off.
  const box = { x: 295, y: 150, w: 100, h: 100 };
  const r = distributionSnap(box, [left, right], 8);
  assert.equal(r.x, 300);
  assert.ok(r.badges.length === 2 && r.badges.every((b) => b.equal));
  // horizontal badges are drawn at the row through the box centre
  assert.ok(r.badges.every((b) => b.y0 === b.y1));
});

test("distributionSnap: no vertical overlap → no badges, no snap", () => {
  const off = { x: 900, y: 0, w: 100, h: 100 };       // doesn't overlap box on X
  const below = { x: 900, y: 500, w: 100, h: 100 };
  const box = { x: 100, y: 254, w: 200, h: 80 };
  const r = distributionSnap(box, [off, below], 8);
  assert.equal(r.y, 254);
  assert.deepEqual(r.badges, []);
});

test("distributionSnap: a locked axis is measured but never re-snapped", () => {
  const above = { x: 100, y: 0, w: 200, h: 100 };
  const below = { x: 100, y: 500, w: 200, h: 100 };
  const box = { x: 100, y: 254, w: 200, h: 80 };      // would snap to 260 if free
  const r = distributionSnap(box, [above, below], 8, { lockY: true });
  assert.equal(r.y, 254, "lockY keeps the edge-snap position");
  assert.equal(r.badges.length, 2, "still shows the measurement");
});

test("snapMove: returns badges when between two aligned siblings", () => {
  const above = { x: 100, y: 0, w: 200, h: 100 };
  const below = { x: 100, y: 500, w: 200, h: 100 };
  const r = snapMove({ x: 100, y: 254, w: 200, h: 80 }, { w: 1080, h: 1350 }, [above, below], 8);
  assert.ok(Array.isArray(r.badges) && r.badges.length === 2);
  assert.equal(r.y, 260);
});
