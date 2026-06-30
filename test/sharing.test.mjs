// Unit checks for app/studio/sharing.js — the pure share-link access core (Tier A
// live collaboration): link token + viewer role → none / view / edit.
import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeShare, linkAccess, memberAccess, effectiveAccess, canView, canEdit,
} from "../app/studio/sharing.js";

const deck = (share, ownerUid) => ({ ownerUid, share });

test("normalizeShare clamps to a known level", () => {
  assert.equal(normalizeShare("edit"), "edit");
  assert.equal(normalizeShare("bogus"), "none");
  assert.equal(normalizeShare(undefined), "none");
});

test("linkAccess: matching token grants the link level; wrong/absent → none", () => {
  const share = { link: "view", token: "abc123" };
  assert.equal(linkAccess(share, "abc123"), "view");      // right token
  assert.equal(linkAccess(share, "nope"), "none");        // wrong token
  assert.equal(linkAccess(share, undefined), "none");     // no token presented
  assert.equal(linkAccess({ link: "none", token: "abc123" }, "abc123"), "none"); // link off
  assert.equal(linkAccess({ link: "edit" }, "abc123"), "none");  // no token configured
});

test("memberAccess: owner edits; role decides for the rest", () => {
  assert.equal(memberAccess({ uid: "U", role: "viewer" }, deck({}, "U")), "edit"); // owner
  assert.equal(memberAccess({ uid: "X", role: "viewer" }, deck({}, "U")), "view"); // viewer role
  assert.equal(memberAccess({ uid: "X", role: "editor" }, deck({}, "U")), "edit"); // editor role
  assert.equal(memberAccess(null, deck({}, "U")), "none");                          // anonymous
});

test("effectiveAccess = most permissive of link + member", () => {
  const d = deck({ link: "view", token: "t" }, "owner");
  // anonymous visitor with the view link → view
  assert.equal(effectiveAccess(d, null, "t"), "view");
  // anonymous with a wrong token → none
  assert.equal(effectiveAccess(d, null, "x"), "none");
  // editor teammate beats a view link → edit (link is for outsiders)
  assert.equal(effectiveAccess(d, { uid: "e", role: "editor" }, "t"), "edit");
  // viewer teammate with no token still gets their role's view
  assert.equal(effectiveAccess(d, { uid: "v", role: "viewer" }, undefined), "view");
  // owner always edits
  assert.equal(effectiveAccess(d, { uid: "owner", role: "viewer" }, undefined), "edit");
});

test("canView / canEdit gates", () => {
  assert.equal(canView("view"), true);
  assert.equal(canView("edit"), true);
  assert.equal(canView("none"), false);
  assert.equal(canEdit("edit"), true);
  assert.equal(canEdit("view"), false);
});
