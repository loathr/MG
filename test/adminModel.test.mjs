// Unit checks for app/studio/adminModel.js — the pure admin-console view-model
// (usage state, workspace totals, stable sort). The Firestore/Auth I/O in
// adminStore is deploy-only and not exercised here.
import test from "node:test";
import assert from "node:assert/strict";
import { accountUsageState, workspaceTotals, sortAccounts } from "../app/studio/adminModel.js";

test("accountUsageState: within a limit → ratio, not over", () => {
  const s = accountUsageState(41, 50);
  assert.equal(s.used, 41);
  assert.equal(s.limit, 50);
  assert.equal(s.over, false);
  assert.equal(s.unlimited, false);
  assert.ok(Math.abs(s.ratio - 0.82) < 1e-9);
});

test("accountUsageState: at/over the cap → over=true, ratio clamps to 1", () => {
  const at = accountUsageState(30, 30);
  assert.equal(at.over, true);
  assert.equal(at.ratio, 1);
  const past = accountUsageState(45, 30);
  assert.equal(past.over, true);
  assert.equal(past.ratio, 1); // clamped
});

test("accountUsageState: limit 0/absent = unlimited, never over", () => {
  const u = accountUsageState(999, 0);
  assert.equal(u.unlimited, true);
  assert.equal(u.over, false);
  assert.equal(u.limit, 0);
  assert.equal(u.ratio, 0);
});

test("workspaceTotals: counts accounts, admins, generations, over-limit", () => {
  const accounts = [
    { role: "admin", used: 32, limit: 0 },
    { role: "editor", used: 41, limit: 50 },
    { role: "editor", used: 30, limit: 30 },   // over
    { role: "viewer", used: 0, limit: 0 },
    { role: "editor", used: 28, limit: 50 },
  ];
  const t = workspaceTotals(accounts);
  assert.equal(t.accounts, 5);
  assert.equal(t.admins, 1);
  assert.equal(t.generationsThisMonth, 131);
  assert.equal(t.overLimit, 1);
});

test("workspaceTotals: an unlimited account over a huge count is never 'over'", () => {
  const t = workspaceTotals([{ role: "admin", used: 5000, limit: 0 }]);
  assert.equal(t.overLimit, 0);
  assert.equal(t.generationsThisMonth, 5000);
});

test("workspaceTotals: tolerates junk input", () => {
  assert.deepEqual(workspaceTotals(null), { accounts: 0, admins: 0, generationsThisMonth: 0, overLimit: 0 });
  const t = workspaceTotals([{}, { role: "bogus", used: -3 }]);
  assert.equal(t.accounts, 2);
  assert.equal(t.admins, 0);               // unknown role → editor, not admin
  assert.equal(t.generationsThisMonth, 0); // negative usage floored to 0
});

test("sortAccounts: admins first, then editors, then viewers; alpha within a tier", () => {
  const out = sortAccounts([
    { role: "viewer", name: "Zoe" },
    { role: "editor", name: "Marco" },
    { role: "admin", name: "Loathr" },
    { role: "editor", name: "Ada" },
    { role: "viewer", name: "Amy" },
  ]);
  assert.deepEqual(out.map((a) => a.name), ["Loathr", "Ada", "Marco", "Amy", "Zoe"]);
});

test("sortAccounts: unknown role sorts as editor; email is the name fallback", () => {
  const out = sortAccounts([
    { role: "admin", name: "A" },
    { email: "zoe@x.co" },      // unknown → editor tier, sorts by email
    { role: "editor", name: "Bob" },
  ]);
  assert.deepEqual(out.map((a) => a.name || a.email), ["A", "Bob", "zoe@x.co"]);
});
