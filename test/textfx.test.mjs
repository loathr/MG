// Unit checks for app/studio/textfx.js — pure element-level text effects shared by
// the DOM renderers (CSS) and the PNG export (canvas shadow).
import test from "node:test";
import assert from "node:assert/strict";
import { TEXT_EFFECTS, effectColor, effectCss, effectShadow } from "../app/studio/textfx.js";

test("TEXT_EFFECTS lists none/shadow/glow with unique ids", () => {
  const ids = TEXT_EFFECTS.map((e) => e.id);
  assert.deepEqual(ids, ["none", "shadow", "glow"]);
  for (const e of TEXT_EFFECTS) assert.ok(e.label, e.id + " has a label");
});

test("effectColor defaults to black, honours the override", () => {
  assert.equal(effectColor({}), "#000000");
  assert.equal(effectColor({ effectColor: "#ff0000" }), "#ff0000");
});

test("effectCss: none → {}, shadow → hard, glow → blurred (uses the fx colour)", () => {
  assert.deepEqual(effectCss({}), {});
  assert.deepEqual(effectCss({ effect: "none" }), {});
  assert.deepEqual(effectCss({ effect: "shadow", effectColor: "#123456" }), { textShadow: "3px 3px 0 #123456" });
  const glow = effectCss({ effect: "glow", effectColor: "#abcdef" });
  assert.match(glow.textShadow, /#abcdef/);
  assert.match(glow.textShadow, /0 0 /); // blurred, zero offset
});

test("effectShadow: canvas params mirror the CSS (null when off)", () => {
  assert.equal(effectShadow({}), null);
  assert.deepEqual(effectShadow({ effect: "shadow", effectColor: "#111" }), { color: "#111", blur: 0, dx: 3, dy: 3 });
  const g = effectShadow({ effect: "glow", effectColor: "#222" });
  assert.equal(g.color, "#222"); assert.ok(g.blur > 0); assert.equal(g.dx, 0); assert.equal(g.dy, 0);
});
