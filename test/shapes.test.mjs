// Unit checks for app/studio/shapes.js — the pure geometry/paint truth shared by
// the text-shape renderers (Element/StaticSlide CSS via ShapeBacking, export
// canvas). A shape rides on a text element as el.shape + el.shapeFill.
import test from "node:test";
import assert from "node:assert/strict";
import {
  SHAPE_VARIANTS, SHAPE_BACKING, SHAPE_PAPER, BURST_POINTS, BANNER_RULE,
  shapeVariant, hasShape, shapeRadius, shapePaint, shapeBorderW, shapePad,
  tagNotch, speechTail, noteEar, hexA, shapeVAlign,
  shapeAccentColor, shapeTailColor,
} from "../app/studio/shapes.js";

test("shapeVAlign maps the vertical text position to a flex value (default middle)", () => {
  assert.equal(shapeVAlign({}), "center");
  assert.equal(shapeVAlign({ vAlign: "middle" }), "center");
  assert.equal(shapeVAlign({ vAlign: "top" }), "flex-start");
  assert.equal(shapeVAlign({ vAlign: "bottom" }), "flex-end");
});

test("there are 8 shapes with unique ids and drop defaults", () => {
  assert.equal(SHAPE_VARIANTS.length, 8);
  const ids = SHAPE_VARIANTS.map((v) => v.id);
  assert.deepEqual([...new Set(ids)].sort(), ["banner", "burst", "cloud", "note", "pill", "speech", "stamp", "tag"]);
  for (const v of SHAPE_VARIANTS) {
    assert.ok(v.w > 0 && v.h > 0, v.id + " has a size");
    assert.ok(v.text && v.font && v.size, v.id + " has text/font/size");
  }
});

test("shapeVariant returns the match, else the first (speech)", () => {
  assert.equal(shapeVariant("pill").id, "pill");
  assert.equal(shapeVariant("nope").id, "speech");
  assert.equal(shapeVariant().id, "speech");
});

test("hasShape only true for a text element wearing a shape", () => {
  assert.equal(hasShape({ type: "text", shape: "speech" }), true);
  assert.equal(hasShape({ type: "text" }), false);
  assert.equal(hasShape({ type: "rect", shape: "speech" }), false); // shapes ride on text only
  assert.equal(hasShape(null), false);
});

test("paint: fill shapes put the accent on the background", () => {
  for (const id of ["burst", "pill"]) {
    const p = shapePaint({ shape: id, shapeFill: "#123456" });
    assert.equal(p.bg, "#123456");
    assert.equal(p.border, "none");
  }
});

test("paint: outline shapes use the dark plate + accent border", () => {
  for (const id of ["speech", "cloud", "tag"]) {
    const p = shapePaint({ shape: id, shapeFill: "#e23744" });
    assert.equal(p.bg, SHAPE_BACKING);
    assert.equal(p.border, "#e23744");      // accent border
  }
});

test("paint: stamp is transparent + dashed; banner is ruled; note is paper", () => {
  const stamp = shapePaint({ shape: "stamp", shapeFill: "#e23744" });
  assert.equal(stamp.bg, "transparent");
  assert.equal(stamp.dashed, true);
  assert.equal(stamp.border, "#e23744");

  const banner = shapePaint({ shape: "banner", shapeFill: "#e23744" });
  assert.equal(banner.bg, SHAPE_BACKING);
  assert.equal(banner.border, "none");
  assert.equal(banner.rule, "#e23744");      // rule, not a full border

  const note = shapePaint({ shape: "note", shapeFill: SHAPE_PAPER });
  assert.equal(note.bg, SHAPE_PAPER);
});

test("paint reads shapeFill (not the text color)", () => {
  // The element's `color` is the text; only `shapeFill` paints the shape.
  const p = shapePaint({ shape: "speech", shapeFill: "#00ff00", color: "#ffffff" });
  assert.equal(p.border, "#00ff00");
});

test("B4 paint: shapeBody overrides the box, shapeBorderC overrides the outline", () => {
  // Outline variant: Fill writes the dark plate, Border writes the accent line.
  const speech = shapePaint({ shape: "speech", shapeFill: "#e23744", shapeBody: "#102030", shapeBorderC: "#00ff00" });
  assert.equal(speech.bg, "#102030");
  assert.equal(speech.border, "#00ff00");
  // Filled variant: Fill writes the body.
  const pill = shapePaint({ shape: "pill", shapeFill: "#e23744", shapeBody: "#abcdef" });
  assert.equal(pill.bg, "#abcdef");
});

test("B4 paint: absent overrides leave every variant's defaults untouched", () => {
  // Byte-for-byte the pre-B4 result when neither field is present.
  assert.deepEqual(shapePaint({ shape: "speech", shapeFill: "#e23744" }), { bg: SHAPE_BACKING, border: "#e23744" });
  assert.deepEqual(shapePaint({ shape: "pill", shapeFill: "#e23744" }), { bg: "#e23744", border: "none" });
  assert.deepEqual(shapePaint({ shape: "banner", shapeFill: "#e23744" }), { bg: SHAPE_BACKING, border: "none", rule: "#e23744" });
});

test("B4 paint: a banner Border override retints the rule, not a box border", () => {
  const banner = shapePaint({ shape: "banner", shapeFill: "#e23744", shapeBorderC: "#00ff00" });
  assert.equal(banner.rule, "#00ff00");   // the accent rule follows Border
  assert.equal(banner.border, "none");    // never an outline around the plate
});

test("B4 borderW: a filled shape gains a thin outline only once Border is picked", () => {
  assert.equal(shapeBorderW({ shape: "pill" }), 0);
  assert.ok(shapeBorderW({ shape: "pill", shapeBorderC: "#00ff00" }) > 0);
  assert.equal(shapeBorderW({ shape: "speech" }), 3); // outline variants unchanged
});

test("B4 tail/accent colours follow the override, else the brand fill", () => {
  // Default (no override) preserves the hollow-bubble look: tail = accent fill.
  assert.equal(shapeTailColor({ shapeFill: "#e23744" }), "#e23744");
  // Fill override makes the tail follow the body.
  assert.equal(shapeTailColor({ shapeFill: "#e23744", shapeBody: "#102030" }), "#102030");
  // The cloud glow follows a Border override, else the fill.
  assert.equal(shapeAccentColor({ shapeFill: "#e23744" }), "#e23744");
  assert.equal(shapeAccentColor({ shapeFill: "#e23744", shapeBorderC: "#00ff00" }), "#00ff00");
});

test("radius: pill is fully rounded, banner/burst/tag square", () => {
  assert.equal(shapeRadius({ shape: "pill", w: 200, h: 80 }), 40); // min/2
  assert.equal(shapeRadius({ shape: "banner", w: 360, h: 96 }), 0);
  assert.equal(shapeRadius({ shape: "burst", w: 160, h: 160 }), 0);
  assert.ok(shapeRadius({ shape: "cloud", w: 320, h: 130 }) > 0);
});

test("borderW: stamp/speech/tag stroked, fill/paper not", () => {
  assert.ok(shapeBorderW({ shape: "stamp" }) > 0);
  assert.ok(shapeBorderW({ shape: "speech" }) > 0);
  assert.equal(shapeBorderW({ shape: "pill" }), 0);
  assert.equal(shapeBorderW({ shape: "note" }), 0);
});

test("shapePad insets the text; tag clears the left point", () => {
  const speech = shapePad({ shape: "speech", w: 360, h: 150 });
  assert.ok(speech.top > 0 && speech.left > 0);
  const tag = shapePad({ shape: "tag", w: 240, h: 104 });
  assert.ok(tag.left > tagNotch({ shape: "tag", h: 104 }), "tag left padding clears the notch");
  const burst = shapePad({ shape: "burst", w: 200, h: 200 });
  assert.equal(burst.top, burst.left); // square inset for the star core
});

test("burst star has 16 points, all inside the 0..100 box", () => {
  assert.equal(BURST_POINTS.length, 16);
  for (const [x, y] of BURST_POINTS) {
    assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100);
  }
});

test("tagNotch is positive and clamped for big shapes", () => {
  assert.ok(tagNotch({ h: 84 }) > 0);
  assert.ok(tagNotch({ h: 2000 }) <= 30);
});

test("speechTail sits on the bottom edge and honors the chosen side", () => {
  const base = { w: 400, h: 120 };
  const left = speechTail({ ...base, tailSide: "left" });
  const right = speechTail({ ...base, tailSide: "right" });
  const center = speechTail({ ...base, tailSide: "center" });
  assert.equal(left.y, 120);                            // hangs from the bottom
  assert.ok(left.x < center.x && center.x < right.x);   // left < center < right
  assert.ok(right.x + right.w <= 400);                  // stays within the width
});

test("noteEar scales with the smaller side", () => {
  assert.ok(noteEar({ w: 232, h: 134 }) > 0);
  assert.ok(noteEar({ w: 400, h: 80 }) <= noteEar({ w: 400, h: 400 }));
});

test("hexA converts #rrggbb to rgba and falls back to brand red", () => {
  assert.equal(hexA("#000000", 0.5), "rgba(0,0,0,0.5)");
  assert.equal(hexA("#ffffff", 0.1), "rgba(255,255,255,0.1)");
  assert.equal(hexA("nope", 0.2), "rgba(226,55,68,0.2)");
});

test("BANNER_RULE is a sane positive thickness", () => {
  assert.ok(BANNER_RULE > 0 && BANNER_RULE < 20);
});
