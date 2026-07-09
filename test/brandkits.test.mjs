// Unit checks for app/studio/brandkits.js — the pure saved-kit array ops.
import test from "node:test";
import assert from "node:assert/strict";
import { upsertKit, removeKit, kitSummary, KITS_CAP, loadKits, saveKits } from "../app/studio/brandkits.js";

const kit = (id, name, brand) => ({ id, name, brand: brand || {} });

test("upsertKit inserts newest-first and replaces by id", () => {
  let kits = [];
  kits = upsertKit(kits, kit("a", "Acme"));
  kits = upsertKit(kits, kit("b", "Beta"));
  assert.deepEqual(kits.map((k) => k.id), ["b", "a"]); // newest first
  // replacing "a" moves it to the front and updates it
  kits = upsertKit(kits, kit("a", "Acme 2"));
  assert.deepEqual(kits.map((k) => k.id), ["a", "b"]);
  assert.equal(kits[0].name, "Acme 2");
});

test("upsertKit caps the list at KITS_CAP", () => {
  let kits = [];
  for (let i = 0; i < KITS_CAP + 5; i++) kits = upsertKit(kits, kit("k" + i, "K" + i));
  assert.equal(kits.length, KITS_CAP);
  assert.equal(kits[0].id, "k" + (KITS_CAP + 4), "newest kept");
});

test("removeKit drops by id, leaves the rest", () => {
  const kits = [kit("a"), kit("b"), kit("c")];
  assert.deepEqual(removeKit(kits, "b").map((k) => k.id), ["a", "c"]);
  assert.deepEqual(removeKit(kits, "zzz").map((k) => k.id), ["a", "b", "c"]);
});

test("kitSummary pulls the name + present accent swatches", () => {
  const s = kitSummary(kit("a", "Meridian", { accent1: "#111", accent2: "#222", accent3: null }));
  assert.equal(s.name, "Meridian");
  assert.deepEqual(s.colors, ["#111", "#222"]);
});

test("loadKits/saveKits are safe no-ops without localStorage", () => {
  assert.deepEqual(loadKits(), []);   // node has no localStorage
  assert.doesNotThrow(() => saveKits([kit("a")]));
});
