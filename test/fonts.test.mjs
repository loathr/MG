// Unit checks for app/studio/fonts.js — the pure helpers behind uploaded custom
// fonts (validation, name derivation, family naming, the picker group). The
// FontFace registration + FileReader are browser-only and not exercised here.
import test from "node:test";
import assert from "node:assert/strict";
import { MAX_FONT_BYTES, fontFaceName, fontFamilyValue, fontFileError, fontNameFromFile, uploadedFontGroup } from "../app/studio/fonts.js";

test("fontFaceName is CSS-ident-safe and stable per id", () => {
  assert.equal(fontFaceName("abc123"), "upl-abc123");
  assert.equal(fontFaceName("a b/c.d"), "upl-abcd"); // strips non-ident chars
});

test("fontFamilyValue quotes the face and adds a safe fallback", () => {
  assert.equal(fontFamilyValue("upl-x"), "'upl-x', sans-serif");
});

test("fontFileError: accepts real font extensions, rejects others / oversize / missing", () => {
  assert.equal(fontFileError({ name: "Bricolage.ttf", size: 50000 }), null);
  assert.equal(fontFileError({ name: "x.otf", size: 1 }), null);
  assert.equal(fontFileError({ name: "x.woff2", size: 1 }), null);
  assert.match(fontFileError({ name: "logo.png", size: 10 }), /\.ttf, \.otf/);
  assert.match(fontFileError({ name: "big.ttf", size: MAX_FONT_BYTES + 1 }), /600 KB/);
  assert.equal(fontFileError(null), "No file selected.");
});

test("MAX_FONT_BYTES keeps the base64-encoded font under Firestore's 1 MB doc limit", () => {
  assert.ok(MAX_FONT_BYTES * 1.37 < 1024 * 1024, "encoded font must fit a Firestore doc");
});

test("fontNameFromFile strips the extension and tidies separators", () => {
  assert.equal(fontNameFromFile("Bricolage_Grotesque-Bold.otf"), "Bricolage Grotesque Bold");
  assert.equal(fontNameFromFile("MyFont.woff2"), "MyFont");
  assert.equal(fontNameFromFile(""), "Uploaded font");
  assert.equal(fontNameFromFile(".ttf"), "Uploaded font");
});

test("uploadedFontGroup builds the 'Your fonts' picker group (null when none)", () => {
  assert.equal(uploadedFontGroup([]), null);
  assert.equal(uploadedFontGroup(null), null);
  const g = uploadedFontGroup([{ id: "1", name: "Acme", family: "upl-1", dataUrl: "data:x" }]);
  assert.equal(g.group, "Your fonts");
  assert.deepEqual(g.fonts, [{ label: "Acme", value: "'upl-1', sans-serif", upl: "1" }]);
  // malformed entries are dropped
  assert.equal(uploadedFontGroup([{ id: "2" }]), null);
});
