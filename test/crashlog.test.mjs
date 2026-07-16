// Unit checks for app/studio/crashlog.js — the pure ring/report/format helpers of
// the persistent crash capture. The localStorage + hooks are browser-only and
// excluded here.
import test from "node:test";
import assert from "node:assert/strict";
import { pushRing, buildReport, formatReport } from "../app/studio/crashlog.js";

test("pushRing: appends and keeps only the last `cap`", () => {
  assert.deepEqual(pushRing([], "a", 3), ["a"]);
  assert.deepEqual(pushRing(["a", "b"], "c", 3), ["a", "b", "c"]);
  assert.deepEqual(pushRing(["a", "b", "c"], "d", 3), ["b", "c", "d"]);
  assert.deepEqual(pushRing(undefined, "x", 2), ["x"]);
});

test("buildReport: no prior alive-record → null (clean previous exit)", () => {
  assert.equal(buildReport(null, [{ t: 1, name: "x" }], []), null);
});

test("buildReport: unclean exit but only the session:start crumb and no logs → null (nothing useful)", () => {
  assert.equal(buildReport({ startedAt: 1, lastBeat: 2 }, [{ t: 1, name: "session:start" }], []), null);
});

test("buildReport: unclean exit with real activity → a report with timeline + heap", () => {
  const alive = { startedAt: 100, lastBeat: 1500, heapStart: 50 * 1048576, heapPeak: 1900 * 1048576 };
  const crumbs = [{ t: 100, name: "session:start" }, { t: 300, name: "share:enable edit" }, { t: 1500, name: "owner-pull:loadDoc" }];
  const r = buildReport(alive, crumbs, [{ t: 1400, level: "warn", msg: "slow" }]);
  assert.ok(r);
  assert.equal(r.diedAt, 1500);
  assert.equal(r.heapPeak, 1900 * 1048576);
  assert.equal(r.crumbs.length, 3);
  assert.equal(r.console.length, 1);
});

test("buildReport: console output alone (no crumbs) still qualifies", () => {
  const r = buildReport({ startedAt: 1, lastBeat: 9 }, [], [{ t: 5, level: "error", msg: "boom" }]);
  assert.ok(r);
  assert.equal(r.console[0].msg, "boom");
});

test("formatReport: includes timeline deltas, heap, and console", () => {
  const r = {
    diedAt: 1500, startedAt: 100, heapStart: 50 * 1048576, heapPeak: 1900 * 1048576,
    crumbs: [{ t: 100, name: "share:enable edit" }, { t: 300, name: "saveDeck:pulse-bump" }, { t: 1500, name: "owner-pull:loadDoc" }],
    console: [{ t: 1400, level: "warn", msg: "setInterval handler took 1832ms" }],
  };
  const out = formatReport(r);
  assert.match(out, /crash capture/i);
  assert.match(out, /50MB -> 1900MB peak/);
  assert.match(out, /\+0ms {2}share:enable edit/);
  assert.match(out, /\+200ms {2}saveDeck:pulse-bump/);
  assert.match(out, /\+1200ms {2}owner-pull:loadDoc/);
  assert.match(out, /\[warn\] setInterval handler took 1832ms/);
});

test("formatReport: null → empty string", () => {
  assert.equal(formatReport(null), "");
});
