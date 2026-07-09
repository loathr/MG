// Unit checks for app/studio/clientbrand.js — the pure self-branding core.
import test from "node:test";
import assert from "node:assert/strict";
import {
  isMember, brandModeFor, blankClientBrand, normalizeClientBrand,
  effectiveBrand, footerOnSlide, applyClientImages,
} from "../app/studio/clientbrand.js";

test("isMember: loathr.com by default, honours a custom domain list", () => {
  assert.equal(isMember("jo@loathr.com"), true);
  assert.equal(isMember("jo@gmail.com"), false);
  assert.equal(isMember("JO@LOATHR.COM"), true);       // case-insensitive
  assert.equal(isMember(""), false);
  assert.equal(isMember("x@acme.io", ["acme.io"]), true);
});

test("brandModeFor: guests forced client; members default loathr, honour their choice", () => {
  assert.equal(brandModeFor({}, false), "client");                 // guest → always client
  assert.equal(brandModeFor({ brandMode: "loathr" }, false), "client"); // guest can't opt out
  assert.equal(brandModeFor({}, true), "loathr");                  // member default
  assert.equal(brandModeFor({ brandMode: "client" }, true), "client");
});

test("normalizeClientBrand fills a partial kit from defaults", () => {
  const n = normalizeClientBrand({ name: "Meridian", accent1: "#111" });
  assert.equal(n.name, "Meridian");
  assert.equal(n.accent1, "#111");
  assert.equal(n.accent2, blankClientBrand().accent2);   // default kept
  assert.deepEqual(n.footer, { content: "off", text: "", align: "center", scope: "every" });
  assert.equal(n.closeout.on, false);
  // null-safe
  assert.deepEqual(normalizeClientBrand(null), blankClientBrand());
});

test("effectiveBrand: loathr mode returns the base brand untouched", () => {
  const base = { wordmark: "LOATHR", accent: "#e23744", headFont: "Georgia" };
  assert.equal(effectiveBrand(base, { name: "X" }, "loathr"), base); // same ref, no fold
});

test("effectiveBrand: client mode folds the client identity into the brand shape", () => {
  const base = { wordmark: "LOATHR", accent: "#e23744", secondary: "#e23744", headFont: "Georgia", labelFont: "L", bodyFont: "B" };
  const cb = { name: "Meridian", handle: "@meridian", logo: "logo.png", logoPos: "bl", logoScope: "every", pageNumbers: true, pageNumSide: "left", accent1: "#3a86ff", accent2: "#f4b740", accent3: "#e85d75", headFont: "Fraunces" };
  const e = effectiveBrand(base, cb, "client");
  assert.equal(e.wordmark, "Meridian");            // LOATHR wordmark replaced
  assert.equal(e.handle, "@meridian");
  assert.deepEqual(e.logo, { src: "logo.png", w: 160, h: 160 }); // default contain-box
  assert.equal(e.logoPos, "bl");                   // placement folds through
  assert.equal(e.logoScope, "every");
  assert.equal(e.pageNumbers, true);               // page-number options fold through
  assert.equal(e.pageNumSide, "left");
  assert.equal(e.accent, "#3a86ff");
  assert.equal(e.secondary, "#f4b740");
  assert.equal(e.accent3, "#e85d75");
  assert.equal(e.headFont, "Fraunces");            // client font overrides
  assert.equal(e.labelFont, "L");                  // untouched when client leaves it null
  assert.equal(e.clientMode, true);
  assert.notEqual(e, base, "returns a new object, never mutates the base");
  assert.equal(base.wordmark, "LOATHR", "base brand is untouched");
});

test("effectiveBrand: an empty client name yields no wordmark (LOATHR hidden)", () => {
  const e = effectiveBrand({ wordmark: "LOATHR" }, blankClientBrand(), "client");
  assert.equal(e.wordmark, "");
});

test("applyClientImages: cover/closer role images become the first/last slide backgrounds", () => {
  const doc = { slides: [{ elements: [] }, { elements: [] }, { elements: [] }] };
  const cb = { images: [
    { src: "cov.png", thumb: "cov-t.png", role: "cover" },
    { src: "clo.png", role: "closer" },
    { src: "lib.png", role: null },
  ] };
  const out = applyClientImages(doc, cb);
  assert.equal(out.slides[0].background.type, "image");
  assert.equal(out.slides[0].background.src, "cov.png");
  assert.equal(out.slides[0].background.thumb, "cov-t.png");
  assert.ok(out.slides[0].background.scrim > 0);            // auto-scrimmed for legibility
  assert.equal(out.slides[2].background.src, "clo.png");    // closer = last slide
  assert.equal(out.slides[1].background, undefined);        // content slide untouched
  assert.notEqual(out, doc, "returns a new doc");
  // No role → no change (pure no-op).
  assert.equal(applyClientImages(doc, { images: [{ src: "x", role: null }] }), doc);
  assert.equal(applyClientImages(doc, {}), doc);
  assert.equal(applyClientImages({ slides: [] }, cb).slides.length, 0);
});

test("normalizeClientBrand: sourcePhotos defaults on, honours an explicit off", () => {
  assert.equal(normalizeClientBrand({}).sourcePhotos, true);
  assert.equal(normalizeClientBrand({ sourcePhotos: false }).sourcePhotos, false);
  assert.equal(blankClientBrand().sourcePhotos, true);
});

test("footerOnSlide: scope rules (none / every / cover / coverclose)", () => {
  assert.equal(footerOnSlide("none", 0, 8, false), false);
  assert.equal(footerOnSlide("every", 3, 8, false), true);
  assert.equal(footerOnSlide("cover", 0, 8, false), true);
  assert.equal(footerOnSlide("cover", 3, 8, false), false);
  assert.equal(footerOnSlide("coverclose", 0, 8, false), true);   // cover
  assert.equal(footerOnSlide("coverclose", 7, 8, true), true);    // closer
  assert.equal(footerOnSlide("coverclose", 3, 8, false), false);  // middle
});
