// Unit checks for app/studio/sync.js — the pure collab edit-sync core: diffDocs
// (local change -> ops) and applyOps (peer ops -> merged doc). The load-bearing
// property is round-trip convergence: applyOps(prev, diffDocs(prev, next)) deep-
// equals next, plus that concurrent edits to different elements don't clobber.
import test from "node:test";
import assert from "node:assert/strict";
import { diffDocs, applyOps } from "../app/studio/sync.js";

const el = (id, x) => ({ id, type: "text", x, y: 0, w: 100, h: 40, content: id });
const slide = (id, els) => ({ id, w: 1080, h: 1350, background: { type: "color", color: "#000" }, elements: els });
const doc = (slides) => ({ id: "d1", slides });

// The canonical guarantee: replaying a doc's own diff reproduces it exactly.
function roundTrip(prev, next) {
  return applyOps(prev, diffDocs(prev, next));
}

test("no change → no ops → identical doc", () => {
  const d = doc([slide("s1", [el("a", 0)])]);
  assert.deepEqual(diffDocs(d, d), []);
  assert.deepEqual(roundTrip(d, d), d);
});

test("element field edit → one el.set patch, round-trips", () => {
  const a = doc([slide("s1", [el("a", 0), el("b", 200)])]);
  const b = doc([slide("s1", [Object.assign({}, el("a", 0), { x: 55, content: "hi" }), el("b", 200)])]);
  const ops = diffDocs(a, b);
  assert.equal(ops.length, 1);
  assert.equal(ops[0].t, "el.set");
  assert.deepEqual(ops[0].patch, { x: 55, content: "hi" });
  assert.deepEqual(roundTrip(a, b), b);
});

test("removed field is patched to null and deleted on apply", () => {
  const a = doc([slide("s1", [{ id: "a", x: 0, y: 0, rotation: 30 }])]);
  const b = doc([slide("s1", [{ id: "a", x: 0, y: 0 }])]);
  const ops = diffDocs(a, b);
  assert.deepEqual(ops, [{ t: "el.set", slide: "s1", id: "a", patch: { rotation: null } }]);
  const out = roundTrip(a, b);
  assert.ok(!("rotation" in out.slides[0].elements[0]));
});

test("add / delete element round-trip, add keeps z-index position", () => {
  const a = doc([slide("s1", [el("a", 0), el("c", 300)])]);
  const b = doc([slide("s1", [el("a", 0), el("b", 150), el("c", 300)])]);  // b inserted in the middle
  const ops = diffDocs(a, b);
  assert.ok(ops.some((o) => o.t === "el.add" && o.element.id === "b" && o.index === 1));
  assert.deepEqual(roundTrip(a, b), b);
  // and the reverse (delete)
  assert.deepEqual(roundTrip(b, a), a);
});

test("element reorder (raise/lower) round-trips via els.order", () => {
  const a = doc([slide("s1", [el("a", 0), el("b", 1), el("c", 2)])]);
  const b = doc([slide("s1", [el("c", 2), el("a", 0), el("b", 1)])]);
  assert.ok(diffDocs(a, b).some((o) => o.t === "els.order"));
  assert.deepEqual(roundTrip(a, b), b);
});

test("background change round-trips", () => {
  const a = doc([slide("s1", [el("a", 0)])]);
  const b = doc([Object.assign({}, slide("s1", [el("a", 0)]), { background: { type: "color", color: "#fff" } })]);
  assert.deepEqual(diffDocs(a, b), [{ t: "slide.bg", id: "s1", background: { type: "color", color: "#fff" } }]);
  assert.deepEqual(roundTrip(a, b), b);
});

test("slide add / delete / reorder round-trip by id", () => {
  const a = doc([slide("s1", [el("a", 0)])]);
  const withS2 = doc([slide("s1", [el("a", 0)]), slide("s2", [el("z", 0)])]);
  assert.deepEqual(roundTrip(a, withS2), withS2);                 // add
  assert.deepEqual(roundTrip(withS2, a), a);                      // delete
  const swapped = doc([slide("s2", [el("z", 0)]), slide("s1", [el("a", 0)])]);
  assert.deepEqual(roundTrip(withS2, swapped), swapped);          // reorder
});

test("concurrent edits to DIFFERENT elements both survive (no clobber)", () => {
  const base = doc([slide("s1", [el("a", 0), el("b", 200)])]);
  // Peer 1 moves a; peer 2 (me) moved b locally. Apply peer 1's op onto my doc.
  const myDoc = doc([slide("s1", [el("a", 0), Object.assign({}, el("b", 200), { x: 222 })])]);
  const peer1Ops = diffDocs(base, doc([slide("s1", [Object.assign({}, el("a", 0), { x: 44 }), el("b", 200)])]));
  const merged = applyOps(myDoc, peer1Ops);
  assert.equal(merged.slides[0].elements[0].x, 44, "peer's move to a applied");
  assert.equal(merged.slides[0].elements[1].x, 222, "my local move to b preserved");
});

test("held element is shielded from a remote el.set / el.del", () => {
  const a = doc([slide("s1", [el("a", 0), el("b", 200)])]);
  const b = doc([slide("s1", [Object.assign({}, el("a", 0), { x: 99 }), el("b", 200)])]);
  const ops = diffDocs(a, b);
  // I'm actively editing "a" → the remote patch must be skipped.
  const out = applyOps(a, ops, { held: ["a"] });
  assert.equal(out.slides[0].elements[0].x, 0, "held element untouched");
  // …but with no hold it applies.
  assert.equal(applyOps(a, ops).slides[0].elements[0].x, 99);
});

test("applyOps ignores unknown op types (forward-compat) and empty ops", () => {
  const d = doc([slide("s1", [el("a", 0)])]);
  assert.deepEqual(applyOps(d, [{ t: "future.thing", foo: 1 }]).slides, d.slides);
  assert.equal(applyOps(d, []), d);
});

// --- echo-suppression convergence (the multi-batch loop fix) ---------------
// The runaway that killed the owner tab when a second editor connected: a burst
// of remote batches predicted off a stale doc, so the publish effect re-broadcast
// them and the two peers echoed forever. These guard the property the fix relies on.

test("no echo: applying a peer diff then re-diffing against the target yields []", () => {
  const a = doc([slide("s1", [el("e1", 0)])]);
  const b = doc([slide("s1", [{ ...el("e1", 0), content: "edited" }])]);
  const ops = diffDocs(a, b);
  const applied = applyOps(a, ops, {});
  assert.deepEqual(applied.slides, b.slides);        // peer converged to b
  assert.deepEqual(diffDocs(applied, b), []);         // ...and has nothing to re-broadcast
});

test("no echo: back-to-back batches predicted off the RUNNING doc match the reducer (no re-broadcast)", () => {
  const base = doc([slide("s1", [el("e1", 0)])]);
  const d1 = doc([slide("s1", [{ ...el("e1", 0), content: "b" }])]);
  const d2 = doc([slide("s1", [{ ...el("e1", 0), content: "b" }, el("e2", 50)])]);
  const ops1 = diffDocs(base, d1);
  const ops2 = diffDocs(d1, d2);
  // The fix advances the predictor as each batch applies: applyOps(applyOps(base,ops1),ops2).
  const predicted = applyOps(applyOps(base, ops1, {}), ops2, {});
  assert.deepEqual(predicted.slides, d2.slides);
  assert.deepEqual(diffDocs(predicted, d2), []);      // matches target → publish effect broadcasts nothing
});

test("stale-predictor reproduction: predicting off the BASE (old bug) leaves a spurious diff", () => {
  // Demonstrates why the bug echoed: predicting only the LAST batch off the stale
  // base misses ops1, so a diff against the real result is non-empty (a re-broadcast).
  const base = doc([slide("s1", [el("e1", 0)])]);
  const d1 = doc([slide("s1", [{ ...el("e1", 0), content: "b" }])]);
  const d2 = doc([slide("s1", [{ ...el("e1", 0), content: "b" }, el("e2", 50)])]);
  const ops1 = diffDocs(base, d1);
  const ops2 = diffDocs(d1, d2);
  const realResult = applyOps(applyOps(base, ops1, {}), ops2, {});
  const stalePrediction = applyOps(base, ops2, {});   // old bug: only last batch, off stale base
  assert.notDeepEqual(diffDocs(stalePrediction, realResult), []); // <-- the spurious re-broadcast
});
