// Unit checks for app/studio/hlstyles.js — the shared highlight-style source of
// truth (DOM CSS via hlCss, canvas geometry via hlSpec).
import test from "node:test";
import assert from "node:assert/strict";
import { HL_STYLES, DEFAULT_HL_STYLE, normHlStyle, hlCss, hlSpec } from "../app/studio/hlstyles.js";

test("normHlStyle: known passes through; unknown/empty → default (pill)", () => {
  assert.equal(DEFAULT_HL_STYLE, "pill");
  for (const s of HL_STYLES) assert.equal(normHlStyle(s), s);
  assert.equal(normHlStyle("nope"), "pill");
  assert.equal(normHlStyle(undefined), "pill");
});

test("hlCss pill: filled bg, tight padding, rounded, box-decoration clone", () => {
  const c = hlCss("#f4c542", "pill", "#111");
  assert.equal(c.background, "#f4c542");
  assert.equal(c.color, "#111");
  assert.equal(c.borderRadius, "0.14em");
  assert.equal(c.boxDecorationBreak, "clone");
  assert.match(String(c.padding), /0\.02em 0\.16em/);
});

test("hlCss block: square corners", () => {
  assert.equal(hlCss("#f4c542", "block", "#111").borderRadius, 0);
});

test("hlCss marker: organic (multi-value) radius", () => {
  assert.match(String(hlCss("#f4c542", "marker", "#111").borderRadius), /em .*em/);
});

test("hlCss band: a bottom-half gradient, not a solid knockout fill", () => {
  const c = hlCss("#e23744", "band");
  assert.match(String(c.background), /linear-gradient\(transparent 50%, #e23744 50%\)/);
  assert.ok(!c.color); // band keeps the run's own text colour
});

test("hlCss outline: bordered, transparent bg, coloured text", () => {
  const c = hlCss("#e23744", "outline");
  assert.equal(c.background, "transparent");
  assert.match(String(c.border), /solid #e23744/);
  assert.equal(c.color, "#e23744");
});

test("hlSpec: pill fills a box; outline strokes; band colours only the lower part", () => {
  const pill = hlSpec("pill");
  assert.equal(pill.fill, true);
  assert.equal(pill.outline, 0);
  const outline = hlSpec("outline");
  assert.equal(outline.fill, false);
  assert.ok(outline.outline > 0);
  const band = hlSpec("band");
  assert.ok(band.boxTop >= 0.4);            // starts below the middle
  assert.ok(band.boxTop + band.boxH <= 1.05);
});
