// Unit checks for app/studio/flag.js — country detection + flag-derived palette.
// Pure/offline; no feeds, no model.
import test from "node:test";
import assert from "node:assert/strict";
import { FLAG_PALETTES, detectCountry, isVivid, flagBrand, effectiveCountry } from "../app/studio/flag.js";

test("FLAG_PALETTES: every entry has usable hex colours", () => {
  const keys = Object.keys(FLAG_PALETTES);
  assert.ok(keys.length >= 40);
  for (const [c, pal] of Object.entries(FLAG_PALETTES)) {
    assert.ok(Array.isArray(pal) && pal.length >= 1, c);
    for (const hex of pal) assert.match(hex, /^#[0-9a-f]{6}$/i, c + " " + hex);
  }
});

test("detectCountry: plain country names", () => {
  assert.equal(detectCountry("France's pension reforms"), "France");
  assert.equal(detectCountry("the housing market in Germany right now"), "Germany");
  assert.equal(detectCountry("South Korea chip exports"), "South Korea"); // multi-word
  assert.equal(detectCountry("nothing geographic here"), null);
  assert.equal(detectCountry(""), null);
  assert.equal(detectCountry(null), null);
});

test("detectCountry: demonyms resolve to the country", () => {
  assert.equal(detectCountry("French pension reform"), "France");
  assert.equal(detectCountry("Nigerian fintech boom"), "Nigeria");
  assert.equal(detectCountry("the Japanese yen"), "Japan");
  assert.equal(detectCountry("South Korean semiconductors"), "South Korea");
});

test("detectCountry: earliest/longest match wins, ambiguous 'us' ignored", () => {
  // "United States" (longer) should win over a bare token at the same spot
  assert.equal(detectCountry("United States trade policy"), "United States");
  // the pronoun "us" must NOT trigger United States
  assert.equal(detectCountry("let us look at inflation"), null);
  // "USA" abbreviation still works
  assert.equal(detectCountry("USA rate cuts"), "United States");
});

test("isVivid: rejects near-white/near-black, accepts saturated colours", () => {
  assert.equal(isVivid("#ffffff"), false);
  assert.equal(isVivid("#000000"), false);
  assert.equal(isVivid("#ed2939"), true);  // France red
  assert.equal(isVivid("#002395"), true);  // France blue
  assert.equal(isVivid("#ffce00"), true);  // gold
});

test("flagBrand: derives accent + secondary from vivid flag colours, keeps bg/ink", () => {
  const base = { accent: "#e23744", secondary: "#e23744", bg: "#0c0c0c", ink: "#ffffff" };
  const fr = flagBrand("France", base);
  assert.ok(isVivid(fr.accent) && isVivid(fr.secondary));
  assert.notEqual(fr.accent, fr.secondary, "accent and secondary differ in hue");
  assert.equal(fr.bg, "#0c0c0c", "background left dark (readability guard)");
  assert.equal(fr.ink, "#ffffff", "ink left light");
  assert.equal(fr.flagCountry, "France");
});

test("flagBrand: a pure black/white-ish flag falls back to the base brand", () => {
  const base = { accent: "#e23744", secondary: "#111", bg: "#0c0c0c" };
  // fabricate a country with no vivid colour
  FLAG_PALETTES.__test_bw = ["#ffffff", "#000000"];
  const out = flagBrand("__test_bw", base);
  assert.equal(out.accent, base.accent, "kept base accent");
  assert.equal(out.flagCountry, undefined);
  delete FLAG_PALETTES.__test_bw;
});

test("flagBrand: unknown country returns base unchanged", () => {
  const base = { accent: "#abc123" };
  assert.equal(flagBrand("Atlantis", base).accent, "#abc123");
});

test("effectiveCountry: explicit scope wins, else detected in topic", () => {
  assert.equal(effectiveCountry("Germany", "France pension reform"), "Germany"); // explicit wins
  assert.equal(effectiveCountry(null, "French pension reform"), "France");       // detected fallback
  assert.equal(effectiveCountry("", "nothing here"), null);
  assert.equal(effectiveCountry(null, ""), null);
});
