// Unit checks for app/studio/styles.js — the three premium families, the brand
// defaults, and the 9 editorial palettes.
import test from "node:test";
import assert from "node:assert/strict";
import {
  STYLES, STYLE_LIST, DEFAULT_STYLE, getStyle, brandFromStyle,
  EDITORIAL_PALETTES, paletteBrand,
} from "../app/studio/styles.js";

const HEX = /^#[0-9a-fA-F]{6}$/;

test("three premium families, editorial default", () => {
  assert.equal(STYLE_LIST.length, 3);
  assert.equal(DEFAULT_STYLE, "editorial");
  assert.deepEqual(Object.keys(STYLES).sort(), ["editorial", "enterprise", "newsdesk"]);
});

test("getStyle falls back to editorial for unknown keys", () => {
  assert.equal(getStyle("newsdesk").key, "newsdesk");
  assert.equal(getStyle("does-not-exist").key, "editorial");
});

test("every family carries the full render parameter set", () => {
  for (const st of STYLE_LIST) {
    for (const k of ["bg", "accent", "ink", "sub", "muted", "headFont", "bodyFont", "kickerFont"]) {
      assert.ok(st[k], `${st.key} missing ${k}`);
    }
    assert.ok(st.layouts.cover && st.layouts.content, `${st.key} missing layouts`);
    assert.ok(st.onPhoto, `${st.key} missing onPhoto palette`);
  }
});

test("brandFromStyle yields the deck defaults incl. the wordmark", () => {
  const b = brandFromStyle("editorial");
  assert.equal(b.accent, "#e23744");
  assert.equal(b.bg, "#0c0c0c");
  assert.equal(b.wordmark, "LOATHR");
  assert.ok(b.headFont && b.bodyFont);
});

test("Enterprise is monochrome (accent === ink) — the knockout-emphasis case", () => {
  assert.equal(STYLES.enterprise.accent, STYLES.enterprise.ink);
});

test("nine editorial palettes, each a full id/label/bg/accent/ink", () => {
  assert.equal(EDITORIAL_PALETTES.length, 9);
  for (const p of EDITORIAL_PALETTES) {
    assert.ok(p.id && p.label);
    assert.match(p.bg, HEX);
    assert.match(p.accent, HEX);
    assert.match(p.ink, HEX);
  }
});

test("paletteBrand passes bg/accent/ink through and tints sub/muted between them", () => {
  const p = EDITORIAL_PALETTES[0];
  const b = paletteBrand(p);
  assert.equal(b.bg, p.bg);
  assert.equal(b.accent, p.accent);
  assert.equal(b.ink, p.ink);
  assert.match(b.sub, HEX);
  assert.match(b.muted, HEX);
  assert.notEqual(b.sub, p.ink);   // tints sit between ink and bg, so they differ
  assert.notEqual(b.muted, p.bg);  // from both endpoints
});
