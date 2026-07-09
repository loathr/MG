// Unit checks for app/studio/livesync.js — the pure core of the anonymous
// shared-editor live layer (guest identity, op collection, adaptive poll cadence).
import test from "node:test";
import assert from "node:assert/strict";
import { guestIdentity, collectOps, pollDelay } from "../app/studio/livesync.js";
import { peerColor } from "../app/studio/presence.js";

test("guestIdentity: Guest name, stable color from the session id, anon flag", () => {
  const g = guestIdentity("anon_abc");
  assert.equal(g.name, "Guest");
  assert.equal(g.anon, true);
  assert.equal(g.color, peerColor("anon_abc"));           // deterministic
  assert.equal(guestIdentity("anon_abc").color, g.color); // same session → same colour
});

test("collectOps: flattens peer batches, skips my own, advances the cursor", () => {
  const batches = [
    { from: "other", ops: [{ t: "a" }, { t: "b" }], ts: 100 },
    { from: "me", ops: [{ t: "mine" }], ts: 150 },        // my own — skipped
    { from: "other2", ops: [{ t: "c" }], ts: 200 },
  ];
  const r = collectOps(batches, "me", 50);
  assert.deepEqual(r.ops, [{ t: "a" }, { t: "b" }, { t: "c" }]);
  assert.equal(r.cursor, 200);                            // newest ts seen
});

test("collectOps: empty/degenerate input keeps the previous cursor", () => {
  assert.deepEqual(collectOps([], "me", 42), { ops: [], cursor: 42 });
  assert.deepEqual(collectOps(null, "me", 7), { ops: [], cursor: 7 });
  // a batch with no ops array still advances the cursor but adds no ops
  assert.deepEqual(collectOps([{ from: "x", ts: 9 }], "me", 0), { ops: [], cursor: 9 });
  // cursor never goes backwards below prevCursor
  assert.equal(collectOps([{ from: "x", ops: [{}], ts: 5 }], "me", 100).cursor, 100);
});

test("pollDelay: fast when peers/active, slow when alone, slowest when hidden", () => {
  assert.equal(pollDelay({ hasPeers: true, active: false, hidden: false }), 1500);
  assert.equal(pollDelay({ hasPeers: false, active: true, hidden: false }), 1500);
  assert.equal(pollDelay({ hasPeers: false, active: false, hidden: false }), 7000); // alone + idle → back off
  assert.equal(pollDelay({ hasPeers: true, active: true, hidden: true }), 15000);   // hidden wins → heartbeat only
  assert.equal(pollDelay({}), 7000);                                                // defaults → idle
});
