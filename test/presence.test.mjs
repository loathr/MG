// Unit checks for app/studio/presence.js — the pure live-presence helpers.
import test from "node:test";
import assert from "node:assert/strict";
import { peerColor, initials, toPeer, livePeers, shouldSendCursor, PEER_COLORS } from "../app/studio/presence.js";

test("peerColor is deterministic, stable, and in-palette", () => {
  const c = peerColor("uid-123");
  assert.equal(c, peerColor("uid-123"));            // stable
  assert.ok(PEER_COLORS.includes(c));               // from the palette
  assert.equal(peerColor(""), PEER_COLORS[0]);      // empty hashes to 0
});

test("initials: name, email, and empty fallbacks", () => {
  assert.equal(initials("Maria Alvarez"), "MA");
  assert.equal(initials("jon@loathr.com"), "J");
  assert.equal(initials("cher"), "C");
  assert.equal(initials("  "), "?");
  assert.equal(initials(null), "?");
});

test("toPeer shapes a raw record with defaults and array selection", () => {
  const p = toPeer("s1", { uid: "u1", name: "Jo", cursor: { x: 10, y: 20 }, selection: "e1", slide: 2, ts: 5 });
  assert.equal(p.id, "s1"); assert.equal(p.uid, "u1"); assert.equal(p.name, "Jo");
  assert.deepEqual(p.cursor, { x: 10, y: 20 });
  assert.deepEqual(p.selection, ["e1"]);            // scalar coerced to array
  assert.equal(p.slide, 2);
  // missing/garbage cursor → null; missing selection → []
  const q = toPeer("s2", { uid: "u2", cursor: { x: "nope" } });
  assert.equal(q.cursor, null);
  assert.deepEqual(q.selection, []);
  assert.equal(q.name, "Someone");
});

test("livePeers drops my own session and stale heartbeats, sorts by id", () => {
  const now = 1000000;
  const records = {
    me: { uid: "me", ts: now },
    b: { uid: "b", ts: now - 2000 },              // fresh
    a: { uid: "a", ts: now - 1000 },              // fresh
    z: { uid: "z", ts: now - 999999 },            // stale → dropped
  };
  const peers = livePeers(records, "me", now, 15000);
  assert.deepEqual(peers.map((p) => p.id), ["a", "b"]);   // no me, no z, sorted
});

test("shouldSendCursor throttles by time then distance", () => {
  const last = { x: 0, y: 0, ts: 1000 };
  assert.equal(shouldSendCursor(null, { x: 0, y: 0 }, 1000, 60, 3), true);   // first ever
  assert.equal(shouldSendCursor(last, { x: 100, y: 0 }, 1030, 60, 3), false); // too soon (<60ms)
  assert.equal(shouldSendCursor(last, { x: 1, y: 0 }, 1100, 60, 3), false);   // enough time, too small a move
  assert.equal(shouldSendCursor(last, { x: 10, y: 0 }, 1100, 60, 3), true);   // enough time AND moved
});
