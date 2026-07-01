// Checks the curated Quick-start presets + the 8 angle-seeds: every preset field
// must resolve to a real id in the Voice / Tone / Angle / Length lists, and the
// active-preset matcher must round-trip.
import test from "node:test";
import assert from "node:assert/strict";
import { PRESETS, activePreset } from "../app/studio/presets.js";
import { VOICES, TONES } from "../app/studio/voices.js";
import { ANGLES } from "../app/studio/trending.js";

const LENGTHS = ["brief", "standard", "deep"];

test("ANGLES: the 8 angle-seeds, each with a label, hint and prompt", () => {
  assert.equal(ANGLES.length, 8);
  for (const a of ANGLES) { assert.ok(a.id && a.label && a.hint && a.prompt.length > 15, a.id); }
  assert.ok(ANGLES.some((a) => a.id === "contrarian") && ANGLES.some((a) => a.id === "future"));
});

test("PRESETS: 8 recipes, every field a real id", () => {
  assert.equal(PRESETS.length, 8);
  const vids = new Set(VOICES.map((v) => v.id));
  const tids = new Set(TONES.map((t) => t.id));
  const aids = new Set(ANGLES.map((a) => a.id));
  for (const p of PRESETS) {
    assert.ok(p.id && p.name, p.id);
    assert.ok(vids.has(p.voice), "voice " + p.voice + " in " + p.id);
    assert.ok(tids.has(p.tone), "tone " + p.tone + " in " + p.id);
    assert.ok(aids.has(p.angle), "angle " + p.angle + " in " + p.id);
    assert.ok(LENGTHS.includes(p.length), "length " + p.length + " in " + p.id);
  }
});

test("activePreset matches only when all four fields line up", () => {
  const p = PRESETS[0];
  assert.equal(activePreset(p.voice, p.tone, p.angle, p.length), p);
  assert.equal(activePreset(p.voice, p.tone, p.angle, "deep"), null); // one field off → no match
  assert.equal(activePreset("auto", null, null, "standard"), null);   // defaults → nothing active
});
