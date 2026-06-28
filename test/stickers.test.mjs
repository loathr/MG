// Unit checks for app/studio/stickers.js — the pure geometry/paint truth shared
// by the three sticker renderers (Element CSS, StaticSlide CSS, export canvas).
import test from "node:test";
import assert from "node:assert/strict";
import {
  STICKER_VARIANTS, STICKER_BACKING, STICKER_PAPER, BURST_POINTS, BANNER_RULE,
  stickerVariant, isSticker, stickerRadius, stickerPaint, stickerBorderW,
  tagNotch, speechTail, noteEar, hexA,
} from "../app/studio/stickers.js";

test("there are 8 variants with unique ids and drop defaults", () => {
  assert.equal(STICKER_VARIANTS.length, 8);
  const ids = STICKER_VARIANTS.map((v) => v.id);
  assert.deepEqual([...new Set(ids)].sort(), ["banner", "burst", "cloud", "note", "pill", "speech", "stamp", "tag"]);
  for (const v of STICKER_VARIANTS) {
    assert.ok(v.w > 0 && v.h > 0, v.id + " has a size");
    assert.ok(v.text && v.font && v.size, v.id + " has text/font/size");
  }
});

test("stickerVariant returns the match, else the first (speech)", () => {
  assert.equal(stickerVariant("pill").id, "pill");
  assert.equal(stickerVariant("nope").id, "speech");
  assert.equal(stickerVariant().id, "speech");
});

test("isSticker only true for sticker elements", () => {
  assert.equal(isSticker({ type: "sticker" }), true);
  assert.equal(isSticker({ type: "text" }), false);
  assert.equal(isSticker(null), false);
});

test("paint: fill variants put the accent on the background, text knocked out", () => {
  for (const id of ["burst", "pill"]) {
    const p = stickerPaint({ variant: id, fill: "#123456", color: "#0c0c0c" });
    assert.equal(p.bg, "#123456");
    assert.equal(p.text, "#0c0c0c");
    assert.equal(p.border, "none");
  }
});

test("paint: outline variants use the dark plate + accent border", () => {
  for (const id of ["speech", "cloud", "tag"]) {
    const p = stickerPaint({ variant: id, fill: "#e23744", color: "#ffffff" });
    assert.equal(p.bg, STICKER_BACKING);
    assert.equal(p.border, "#e23744");      // accent border
    assert.equal(p.text, "#ffffff");
  }
});

test("paint: stamp is transparent + dashed; banner is ruled; note is paper", () => {
  const stamp = stickerPaint({ variant: "stamp", fill: "#e23744" });
  assert.equal(stamp.bg, "transparent");
  assert.equal(stamp.dashed, true);
  assert.equal(stamp.border, "#e23744");

  const banner = stickerPaint({ variant: "banner", fill: "#e23744" });
  assert.equal(banner.bg, STICKER_BACKING);
  assert.equal(banner.border, "none");
  assert.equal(banner.rule, "#e23744");      // rule, not a full border

  const note = stickerPaint({ variant: "note", fill: STICKER_PAPER, color: "#1a1a1a" });
  assert.equal(note.bg, STICKER_PAPER);
  assert.equal(note.text, "#1a1a1a");
});

test("radius: pill is fully rounded, banner/burst/tag square", () => {
  assert.equal(stickerRadius({ variant: "pill", w: 200, h: 80 }), 40); // min/2
  assert.equal(stickerRadius({ variant: "banner", w: 360, h: 96 }), 0);
  assert.equal(stickerRadius({ variant: "burst", w: 160, h: 160 }), 0);
  assert.ok(stickerRadius({ variant: "cloud", w: 320, h: 130 }) > 0);
});

test("borderW: stamp/speech/tag are stroked, fill/paper variants are not", () => {
  assert.ok(stickerBorderW({ variant: "stamp" }) > 0);
  assert.ok(stickerBorderW({ variant: "speech" }) > 0);
  assert.equal(stickerBorderW({ variant: "pill" }), 0);
  assert.equal(stickerBorderW({ variant: "note" }), 0);
});

test("burst star has 16 points, all inside the 0..100 box", () => {
  assert.equal(BURST_POINTS.length, 16);
  for (const [x, y] of BURST_POINTS) {
    assert.ok(x >= 0 && x <= 100, "x in range");
    assert.ok(y >= 0 && y <= 100, "y in range");
  }
});

test("tagNotch is positive and clamped for big stickers", () => {
  assert.ok(tagNotch({ w: 200, h: 84 }) > 0);
  assert.ok(tagNotch({ w: 1000, h: 1000 }) <= 28); // clamp holds
});

test("speechTail sits on the bottom edge and honors the chosen side", () => {
  const el = { w: 400, h: 120 };
  const left = speechTail({ ...el, tailSide: "left" });
  const right = speechTail({ ...el, tailSide: "right" });
  const center = speechTail({ ...el, tailSide: "center" });
  assert.equal(left.y, 120);                      // hangs from the bottom
  assert.ok(left.x < center.x && center.x < right.x); // left < center < right
  assert.ok(right.x + right.w <= 400);            // stays within the box width
});

test("noteEar scales with the smaller side", () => {
  assert.ok(noteEar({ w: 232, h: 134 }) > 0);
  assert.ok(noteEar({ w: 400, h: 80 }) <= noteEar({ w: 400, h: 400 }));
});

test("hexA converts #rrggbb to rgba and falls back to brand red", () => {
  assert.equal(hexA("#000000", 0.5), "rgba(0,0,0,0.5)");
  assert.equal(hexA("#ffffff", 0.1), "rgba(255,255,255,0.1)");
  assert.equal(hexA("nope", 0.2), "rgba(226,55,68,0.2)"); // fallback
});

test("BANNER_RULE is a sane positive thickness", () => {
  assert.ok(BANNER_RULE > 0 && BANNER_RULE < 20);
});
