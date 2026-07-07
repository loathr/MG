// Unit checks for app/studio/group.js — the pure multi-select + grouping helpers.
import test from "node:test";
import assert from "node:assert/strict";
import { groupmates, expandGroups, toggleSelection, selectionBox, marqueeHits, alignPatches, newGroupId } from "../app/studio/group.js";

const els = [
  { id: "a", x: 0, y: 0, w: 100, h: 40, groupId: "g1" },
  { id: "b", x: 200, y: 20, w: 80, h: 60, groupId: "g1" },
  { id: "c", x: 50, y: 300, w: 120, h: 30 },            // ungrouped
  { id: "d", x: 400, y: 400, w: 60, h: 60, locked: true },
];

test("groupmates: grouped element returns all mates; ungrouped returns itself", () => {
  assert.deepEqual(groupmates(els, "a").sort(), ["a", "b"]);
  assert.deepEqual(groupmates(els, "b").sort(), ["a", "b"]);
  assert.deepEqual(groupmates(els, "c"), ["c"]);
  assert.deepEqual(groupmates(els, "gone"), []);
});

test("expandGroups: selecting one member pulls in the whole group", () => {
  assert.deepEqual(expandGroups(els, ["a"]).sort(), ["a", "b"]);
  assert.deepEqual(expandGroups(els, ["c"]).sort(), ["c"]);
  assert.deepEqual(expandGroups(els, ["a", "c"]).sort(), ["a", "b", "c"]);
});

test("toggleSelection: ⇧-click adds a group, ⇧-click again removes it", () => {
  let sel = toggleSelection(els, [], "c");          // add c
  assert.deepEqual(sel.sort(), ["c"]);
  sel = toggleSelection(els, sel, "a");             // add group g1 (a+b)
  assert.deepEqual(sel.sort(), ["a", "b", "c"]);
  sel = toggleSelection(els, sel, "b");             // toggle group off (a+b)
  assert.deepEqual(sel.sort(), ["c"]);
});

test("selectionBox: tight bounds over the selected elements", () => {
  const box = selectionBox(els, ["a", "b"]);
  assert.deepEqual(box, { x: 0, y: 0, w: 280, h: 80 }); // a(0..100) b(200..280); y 0..80
  assert.equal(selectionBox(els, []), null);
});

test("marqueeHits: intersecting unlocked elements, tolerant of negative w/h", () => {
  // a rect over the top-left cluster (a) but not c/d
  assert.deepEqual(marqueeHits(els, { x: -10, y: -10, w: 130, h: 70 }), ["a"]);
  // up-left drag (negative extents) normalises
  assert.deepEqual(marqueeHits(els, { x: 120, y: 70, w: -130, h: -80 }), ["a"]);
  // a big rect grabs everything unlocked (d is locked → excluded)
  assert.deepEqual(marqueeHits(els, { x: -50, y: -50, w: 600, h: 600 }).sort(), ["a", "b", "c"]);
});

test("alignPatches: left/right/centerX/top and skips locked", () => {
  const left = alignPatches(els, ["a", "b"], "left");
  assert.equal(left.a.x, 0); assert.equal(left.b.x, 0);      // both to box left (0)
  const right = alignPatches(els, ["a", "b"], "right");
  assert.equal(right.a.x, 180); assert.equal(right.b.x, 200); // box right = 280; a.w100→180, b.w80→200
  const cx = alignPatches(els, ["a", "b"], "centerX");
  assert.equal(cx.a.x, 90); assert.equal(cx.b.x, 100);        // center of 280 box
  const top = alignPatches(els, ["a", "b"], "top");
  assert.equal(top.a.y, 0); assert.equal(top.b.y, 0);
  // a locked element is never moved
  assert.deepEqual(alignPatches(els, ["c", "d"], "left").d, undefined);
});

test("newGroupId is unique and prefixed", () => {
  const a = newGroupId(), b = newGroupId();
  assert.notEqual(a, b);
  assert.match(a, /^grp_/);
});
