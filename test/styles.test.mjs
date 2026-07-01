// Unit checks for app/studio/styles.js — the three premium families, the brand
// defaults, and the 9 editorial palettes.
import test from "node:test";
import assert from "node:assert/strict";
import {
  STYLES, STYLE_LIST, DEFAULT_STYLE, getStyle, brandFromStyle,
  EDITORIAL_PALETTES, paletteBrand, effectiveStyle, BRAND_FONT,
  FONT_PRESETS, FONT_OPTIONS, activePresetId,
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

test("paletteBrand tethers the secondary (kicker) colour to the palette", () => {
  // No palette defines its own secondary → it follows the accent, so picking a
  // palette moves the kicker colour with it (previously secondary was omitted).
  for (const p of EDITORIAL_PALETTES) {
    assert.equal(paletteBrand(p).secondary, p.secondary || p.accent);
  }
  // An explicit palette secondary wins over the accent.
  assert.equal(paletteBrand({ bg: "#000", ink: "#fff", accent: "#f00", secondary: "#0f0" }).secondary, "#0f0");
});

test("effectiveStyle is a strict no-op for a family's own default brand", () => {
  const st = getStyle("editorial");
  const eff = effectiveStyle("editorial", brandFromStyle("editorial"));
  for (const k of ["accent", "bg", "ink", "sub", "muted", "headFont", "bodyFont"]) {
    assert.equal(eff[k], st[k]);
  }
  assert.equal(eff.onPhoto.accent, st.onPhoto.accent); // over-photo accent untouched
  // News Desk's onPhoto accent differs from its base accent — must NOT be clobbered
  // by its own default brand.
  assert.equal(effectiveStyle("newsdesk", brandFromStyle("newsdesk")).onPhoto.accent, getStyle("newsdesk").onPhoto.accent);
  assert.equal(effectiveStyle("editorial", null), st); // null brand → identity
});

test("effectiveStyle applies brand overrides, accent reaching the over-photo palette", () => {
  const eff = effectiveStyle("editorial", Object.assign({}, brandFromStyle("editorial"), { accent: "#00ff00", headFont: "Impact" }));
  assert.equal(eff.accent, "#00ff00");
  assert.equal(eff.onPhoto.accent, "#00ff00");          // accent follows the brand on photo slides
  assert.equal(eff.headFont, "Impact");
  assert.equal(eff.onPhoto.ink, getStyle("editorial").onPhoto.ink); // light ink kept for legibility
});

test("BRAND_FONT is the Courier face and the default Label-tier font on every desk", () => {
  assert.match(BRAND_FONT, /Courier Prime/);
  for (const st of STYLE_LIST) assert.equal(st.kickerFont, BRAND_FONT);
});

test("brandFromStyle carries the label-tier font; effectiveStyle remaps it onto the kicker", () => {
  const b = brandFromStyle("editorial");
  assert.equal(b.labelFont, getStyle("editorial").kickerFont);
  const eff = effectiveStyle("editorial", Object.assign({}, b, { labelFont: "Impact" }));
  assert.equal(eff.kickerFont, "Impact");
});

test("FONT_PRESETS: four presets, Label always Courier, monolith heads", () => {
  assert.equal(FONT_PRESETS.length, 4);
  for (const p of FONT_PRESETS) {
    assert.equal(p.labelFont, BRAND_FONT);
    assert.ok(p.id && p.label && p.headFont && p.bodyFont);
  }
  const ent = FONT_PRESETS.find((p) => p.id === "enterprise");
  assert.match(ent.headFont, /Otilito/);
  assert.match(ent.bodyFont, /Qogee/);
  assert.match(FONT_PRESETS.find((p) => p.id === "newsdesk").headFont, /CrownHeritage/);
});

test("FONT_OPTIONS groups Standard + the unique loathr library", () => {
  const labels = FONT_OPTIONS.flatMap((g) => g.fonts.map((f) => f.label));
  for (const u of ["Courier Prime", "Otilito", "Qogee", "Foun", "CrownHeritage", "VintageTypist"]) {
    assert.ok(labels.includes(u), `missing ${u}`);
  }
});

test("activePresetId matches a preset's exact tiers, else null (Custom)", () => {
  const p = FONT_PRESETS.find((x) => x.id === "editorial");
  assert.equal(activePresetId({ labelFont: p.labelFont, headFont: p.headFont, bodyFont: p.bodyFont }), "editorial");
  assert.equal(activePresetId({ labelFont: BRAND_FONT, headFont: "Impact", bodyFont: "Arial" }), null);
});
