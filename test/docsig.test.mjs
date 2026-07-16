// Unit checks for app/studio/docsig.js — the canonical doc signature that lets the
// owner live-refresh recognise its own save-echo (and not infinite-loop on it).
import test from "node:test";
import assert from "node:assert/strict";
import { docSig, sameDoc } from "../app/studio/docsig.js";

test("docSig: key order does not change the signature", () => {
  // Firestore returns map keys in its own order; the signature must ignore that.
  assert.equal(docSig({ a: 1, b: 2, c: 3 }), docSig({ c: 3, b: 2, a: 1 }));
  assert.equal(
    docSig({ share: { link: "edit", token: "t" }, slides: [{ id: "s1", x: 0 }] }),
    docSig({ slides: [{ x: 0, id: "s1" }], share: { token: "t", link: "edit" } }),
  );
});

test("docSig: array order IS significant (slides/elements are ordered)", () => {
  assert.notEqual(docSig({ slides: [{ id: "a" }, { id: "b" }] }), docSig({ slides: [{ id: "b" }, { id: "a" }] }));
});

test("docSig: different content differs", () => {
  assert.notEqual(docSig({ a: 1 }), docSig({ a: 2 }));
  assert.notEqual(docSig({ slides: [{ id: "s1", text: "x" }] }), docSig({ slides: [{ id: "s1", text: "y" }] }));
});

test("docSig: nullish input is the empty signature that equals no real doc", () => {
  assert.equal(docSig(undefined), "");
  assert.equal(docSig(null), "");
  assert.notEqual(docSig({ slides: [] }), "");
});

test("sameDoc: same content (any key order) is equal; nullish is never equal", () => {
  assert.equal(sameDoc({ a: 1, b: [{ x: 1, y: 2 }] }, { b: [{ y: 2, x: 1 }], a: 1 }), true);
  assert.equal(sameDoc({ a: 1 }, { a: 2 }), false);
  assert.equal(sameDoc(null, null), false);   // an absent baseline must not match anything
  assert.equal(sameDoc({ a: 1 }, null), false);
});

test("sameDoc models the save-echo case: same deck, different key order → recognised", () => {
  // The offloaded doc we saved vs the same doc read back from Firestore (reordered).
  const saved = { brand: { accent: "#e23744" }, slides: [{ id: "s1", bg: { thumb: "https://s/x" } }], share: { link: "edit", token: "t" } };
  const fetched = { slides: [{ bg: { thumb: "https://s/x" }, id: "s1" }], share: { token: "t", link: "edit" }, brand: { accent: "#e23744" } };
  assert.equal(sameDoc(saved, fetched), true);
});

test("sameDoc models a real remote edit: genuinely different → NOT skipped", () => {
  const mine = { slides: [{ id: "s1", text: "Draft" }] };
  const remote = { slides: [{ id: "s1", text: "Edited by teammate" }] };
  assert.equal(sameDoc(mine, remote), false);
});
