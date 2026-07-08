// Unit checks for app/studio/design.js — pure copy-design (look only).
import test from "node:test";
import assert from "node:assert/strict";
import { captureLook, applyLook } from "../app/studio/design.js";

const source = {
  style: "newsdesk", frame: "edge",
  background: { type: "color", color: "#101010", scrim: 0.3 },
  elements: [
    { id: "h1", role: "heading", type: "text", content: "Source head", x: 20, y: 20, w: 500, h: 100, color: "#ff0000", fontFamily: "Georgia", effect: "shadow", effectColor: "#000" },
    { id: "l1", role: "label", type: "text", content: "KICKER", x: 20, y: 5, w: 300, h: 30, color: "#00ff00", shape: "banner", shapeFill: "#00ff00" },
    { id: "r1", role: "rule", type: "rect", x: 20, y: 130, w: 60, h: 6, fill: "#00ff00" },
  ],
};

test("captureLook grabs style/frame/background + per-role styling (no content/pos)", () => {
  const look = captureLook(source);
  assert.equal(look.style, "newsdesk");
  assert.equal(look.frame, "edge");
  assert.deepEqual(look.background, { color: "#101010", scrim: 0.3 });
  assert.equal(look.roles.heading.style.color, "#ff0000");
  assert.equal(look.roles.heading.style.effect, "shadow");
  assert.equal(look.roles.label.style.shape, "banner");
  assert.equal(look.roles.rule.style.fill, "#00ff00");
  // content/position are NOT captured
  assert.equal("content" in look.roles.heading.style, false);
  assert.equal("x" in look.roles.heading.style, false);
});

test("applyLook paints the look onto a target, keeping its text + geometry", () => {
  const target = {
    style: "editorial", frame: "off",
    background: { type: "color", color: "#ffffff" },
    elements: [
      { id: "h2", role: "heading", type: "text", content: "TARGET WORDS", x: 80, y: 200, w: 400, h: 120, color: "#111111", fontFamily: "Helvetica" },
      { id: "b2", role: "body", type: "text", content: "body", x: 80, y: 340, w: 400, h: 200, color: "#222" }, // role not in source → untouched
    ],
  };
  const out = applyLook(target, captureLook(source));
  const h = out.elements[0];
  assert.equal(h.content, "TARGET WORDS", "text kept");
  assert.equal(h.x, 80, "position kept");
  assert.equal(h.color, "#ff0000", "heading colour adopted");
  assert.equal(h.fontFamily, "Georgia", "heading font adopted");
  assert.equal(h.effect, "shadow", "effect adopted");
  assert.equal(out.elements[1].color, "#222", "unmatched role untouched");
  assert.equal(out.style, "newsdesk");
  assert.equal(out.frame, "edge");
  assert.equal(out.background.color, "#101010", "solid background colour adopted");
  assert.notEqual(out, target, "returns a new slide");
});

test("applyLook on an image-background target keeps the photo, adopts only the scrim", () => {
  const target = { background: { type: "image", src: "photo.jpg", scrim: 0 }, elements: [] };
  const out = applyLook(target, captureLook(source));
  assert.equal(out.background.src, "photo.jpg", "photo kept");
  assert.equal(out.background.scrim, 0.3, "scrim adopted");
  assert.equal(out.background.type, "image");
});

test("applyLook is a no-op with no look", () => {
  const t = { elements: [] };
  assert.equal(applyLook(t, null), t);
});

// --- Design prompt: designBrand + chips ------------------------------------
import { designBrand, DESIGN_CHIPS } from "../app/studio/design.js";

test("designBrand folds a spec onto the brand, ignoring empty fields", () => {
  const prev = { accent: "#e23744", secondary: "#e23744", headFont: "Georgia", bg: "#0c0c0c" };
  const next = designBrand(prev, { accent: "#3a86ff", headFont: "Fraunces", bogus: "x", empty: "" });
  assert.equal(next.accent, "#3a86ff");
  assert.equal(next.headFont, "Fraunces");
  assert.equal(next.secondary, "#e23744", "untouched field kept");
  assert.equal(next.bg, "#0c0c0c");
  assert.equal("bogus" in next, false, "unknown keys ignored");
  assert.notEqual(next, prev, "new object");
});

test("DESIGN_CHIPS are well-formed preset specs", () => {
  assert.ok(DESIGN_CHIPS.length >= 3);
  for (const c of DESIGN_CHIPS) {
    assert.ok(c.id && c.label && c.spec, c.id + " complete");
    if (c.spec.accent) assert.match(c.spec.accent, /^#[0-9a-f]{6}$/i);
  }
});
