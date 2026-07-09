// Unit checks for app/studio/authority.js — the pure role/permission + usage-quota
// decision layer shared by the client, the server gate, and the security-rule spec.
import test from "node:test";
import assert from "node:assert/strict";
import {
  ROLES, DEFAULT_ROLE, CAPABILITIES, normalizeRole, can, isAdmin, roleFromClaims,
  usagePeriodKey, quotaCheck, DEFAULT_MONTHLY_LIMIT, GUEST_MONTHLY_LIMIT, effectiveMonthlyLimit,
} from "../app/studio/authority.js";

test("effectiveMonthlyLimit: non-admins default to the preset (75); admins unlimited", () => {
  assert.equal(DEFAULT_MONTHLY_LIMIT, 75);
  // non-admin, no stored limit → the preset default
  assert.equal(effectiveMonthlyLimit("editor", null), 75);
  assert.equal(effectiveMonthlyLimit("editor", undefined), 75);
  assert.equal(effectiveMonthlyLimit("viewer", null), 75);
  // non-admin, explicit values honored (0 = an admin granting unlimited)
  assert.equal(effectiveMonthlyLimit("editor", 120), 120);
  assert.equal(effectiveMonthlyLimit("editor", 0), 0);
  // admin → always unlimited, even with a stored number
  assert.equal(effectiveMonthlyLimit("admin", null), 0);
  assert.equal(effectiveMonthlyLimit("admin", 10), 0);
  // junk stored value falls back to the default for a non-admin
  assert.equal(effectiveMonthlyLimit("editor", "abc"), 75);
});

test("effectiveMonthlyLimit: guests default to the tighter 9/month preset", () => {
  assert.equal(GUEST_MONTHLY_LIMIT, 9);
  // guest, no stored limit → the guest preset (9), not the member 75
  assert.equal(effectiveMonthlyLimit("editor", null, true), 9);
  assert.equal(effectiveMonthlyLimit("editor", undefined, true), 9);
  assert.equal(effectiveMonthlyLimit("viewer", null, true), 9);
  // junk stored value falls back to the GUEST default for a guest
  assert.equal(effectiveMonthlyLimit("editor", "abc", true), 9);
  // an admin's explicit cap overrides the guest preset (both directions honored)
  assert.equal(effectiveMonthlyLimit("editor", 30, true), 30);
  assert.equal(effectiveMonthlyLimit("editor", 0, true), 0);
  // a guest promoted to admin is still unlimited
  assert.equal(effectiveMonthlyLimit("admin", null, true), 0);
  // isGuest omitted/false keeps the member default
  assert.equal(effectiveMonthlyLimit("editor", null, false), 75);
  assert.equal(effectiveMonthlyLimit("editor", null), 75);
});

test("effectiveMonthlyLimit feeds quotaCheck: a fresh non-admin gets 75 generations", () => {
  const q = quotaCheck(0, effectiveMonthlyLimit("editor", null));
  assert.equal(q.limit, 75);
  assert.equal(q.remaining, 75);
  assert.equal(quotaCheck(75, 75).allowed, false); // the 76th is blocked
});

test("normalizeRole: known roles pass; anything else falls to the default (editor)", () => {
  for (const r of ROLES) assert.equal(normalizeRole(r), r);
  assert.equal(normalizeRole("superuser"), DEFAULT_ROLE);
  assert.equal(normalizeRole(undefined), DEFAULT_ROLE);
  assert.equal(DEFAULT_ROLE, "editor");
});

test("can: the role/capability matrix (viewer < editor < admin)", () => {
  // viewer: read-only over shared, sees own usage; nothing else
  assert.equal(can("viewer", "viewShared"), true);
  assert.equal(can("viewer", "create"), false);
  assert.equal(can("viewer", "editShared"), false);
  assert.equal(can("viewer", "saveToDrive"), false);
  // editor: own + shared editing + Drive, but no admin powers
  assert.equal(can("editor", "create"), true);
  assert.equal(can("editor", "editShared"), true);
  assert.equal(can("editor", "saveToDrive"), true);
  assert.equal(can("editor", "viewAllDecks"), false);
  assert.equal(can("editor", "setLimits"), false);
  assert.equal(can("editor", "assignRoles"), false);
  // admin: everything
  for (const c of CAPABILITIES) assert.equal(can("admin", c), true, "admin can " + c);
  // unknown capability is always false
  assert.equal(can("admin", "launchMissiles"), false);
});

test("isAdmin + roleFromClaims read the custom claim safely", () => {
  assert.equal(isAdmin("admin"), true);
  assert.equal(isAdmin("editor"), false);
  assert.equal(roleFromClaims({ role: "admin" }), "admin");
  assert.equal(roleFromClaims({ role: "bogus" }), DEFAULT_ROLE);
  assert.equal(roleFromClaims(null), DEFAULT_ROLE);     // no claims → default
});

test("usagePeriodKey buckets a timestamp into a UTC month", () => {
  assert.equal(usagePeriodKey(Date.UTC(2026, 5, 30, 23, 0, 0)), "2026-06"); // June (0-based month 5)
  assert.equal(usagePeriodKey(Date.UTC(2026, 0, 1, 0, 0, 0)), "2026-01");
});

test("quotaCheck: unlimited when no limit; allows under, blocks at/over", () => {
  assert.deepEqual(quotaCheck(999, 0).allowed, true);          // 0 = unlimited
  assert.equal(quotaCheck(999, null).unlimited, true);
  const under = quotaCheck(3, 10);
  assert.equal(under.allowed, true); assert.equal(under.remaining, 7);
  assert.equal(quotaCheck(10, 10).allowed, false);             // at the cap → blocked
  assert.equal(quotaCheck(11, 10).allowed, false);
  assert.equal(quotaCheck(11, 10).remaining, 0);
});
