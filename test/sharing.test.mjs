// Unit checks for app/studio/sharing.js — the pure share-link access core (Tier A
// live collaboration): link token + viewer role → none / view / edit.
import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeShare, linkAccess, memberAccess, effectiveAccess, canView, canEdit,
  setShare, shareUrl, resolveAccess, shareIndex, resolveShared, sharePulse,
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

test("setShare: enable mints/keeps a token; disable keeps it; rotate replaces it", () => {
  const on = setShare(null, "view", "tok1");
  assert.deepEqual(on, { link: "view", token: "tok1" });
  const keep = setShare(on, "edit");                 // change level, keep token
  assert.deepEqual(keep, { link: "edit", token: "tok1" });
  const off = setShare(keep, "none");                // disable but keep token
  assert.deepEqual(off, { link: "none", token: "tok1" });
  const back = setShare(off, "view");                // re-enable → same link
  assert.deepEqual(back, { link: "view", token: "tok1" });
  const rotated = setShare(back, "view", "tok2");    // rotate → old links die
  assert.equal(rotated.token, "tok2");
  assert.equal(linkAccess(rotated, "tok1"), "none"); // the old token no longer works
});

test("shareUrl builds a link only when the link is live", () => {
  assert.equal(shareUrl("https://app.x.com/", "DECK1", { link: "view", token: "t k/+" }),
    "https://app.x.com/studio?deck=DECK1&s=t%20k%2F%2B");  // origin trimmed, params encoded
  assert.equal(shareUrl("https://app.x.com", "DECK1", { link: "none", token: "t" }), null);
  assert.equal(shareUrl("https://app.x.com", "DECK1", { link: "view" }), null); // no token
  assert.equal(shareUrl("https://app.x.com", "", { link: "view", token: "t" }), null); // no id
});

test("shareIndex: built when shared (carries the owner); null when off", () => {
  assert.deepEqual(shareIndex({ link: "view", token: "tk" }, "ownerU", "DECK1"),
    { ownerUid: "ownerU", deckId: "DECK1", link: "view", token: "tk" });
  assert.equal(shareIndex({ link: "none", token: "tk" }, "ownerU", "DECK1"), null);
  assert.equal(shareIndex({ link: "view" }, "ownerU", "DECK1"), null);   // no token
  assert.equal(shareIndex({ link: "view", token: "tk" }, "", "DECK1"), null); // no owner
});

test("sharePulse: a token-less {updatedAt} when shared; null when off/tokenless", () => {
  assert.deepEqual(sharePulse({ link: "view", token: "tk" }, 123), { updatedAt: 123 });
  assert.deepEqual(sharePulse({ link: "edit", token: "tk" }), { updatedAt: 0 }); // no ts → 0
  assert.equal(sharePulse({ link: "none", token: "tk" }, 123), null);
  assert.equal(sharePulse({ link: "view" }, 123), null); // no token
  assert.equal(sharePulse(null, 1), null);
  // crucially carries NO token and NO deck content — safe to make world-readable
  assert.equal(sharePulse({ link: "view", token: "tk" }, 9).token, undefined);
});

test("resolveShared: server-side token check → level or none (rotation revokes)", () => {
  const idx = { ownerUid: "o", deckId: "D", link: "edit", token: "tk" };
  assert.equal(resolveShared(idx, "tk"), "edit");
  assert.equal(resolveShared(idx, "old"), "none");           // rotated/old token
  assert.equal(resolveShared(idx, undefined), "none");
  assert.equal(resolveShared({ ...idx, link: "none" }, "tk"), "none");
  assert.equal(resolveShared(null, "tk"), "none");
});

test("resolveAccess returns the access + both gates in one call", () => {
  const d = { ownerUid: "o", share: { link: "view", token: "t" } };
  assert.deepEqual(resolveAccess(d, null, "t"), { access: "view", canView: true, canEdit: false });
  assert.deepEqual(resolveAccess(d, null, "x"), { access: "none", canView: false, canEdit: false });
  assert.deepEqual(resolveAccess(d, { uid: "o", role: "viewer" }, undefined), { access: "edit", canView: true, canEdit: true });
});
