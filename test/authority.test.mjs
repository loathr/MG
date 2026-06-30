// Unit checks for app/studio/authority.js — the pure role/permission + usage-quota
// decision layer shared by the client, the server gate, and the security-rule spec.
import test from "node:test";
import assert from "node:assert/strict";
import {
  ROLES, DEFAULT_ROLE, CAPABILITIES, normalizeRole, can, isAdmin, roleFromClaims,
  usagePeriodKey, quotaCheck,
} from "../app/studio/authority.js";

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
