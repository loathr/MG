// Unit checks for app/studio/voices.js — the named-persona Voice + rich Tone
// library ported from the monolith, and the resolvers buildPrompt uses.
import test from "node:test";
import assert from "node:assert/strict";
import { VOICES, TONES, voiceById, toneById, voicePrompt, tonePrompt, voiceShape } from "../app/studio/voices.js";

test("VOICES: Auto first + the 10 named personas, each with label/phrase/prompt", () => {
  assert.equal(VOICES[0].id, "auto");
  assert.equal(VOICES.length, 11); // auto + 10
  for (const v of VOICES) { assert.ok(v.id && v.label && v.icon, v.id); }
  for (const v of VOICES.slice(1)) { assert.ok(v.phrase && v.prompt.length > 20, v.id); }
  // a couple of the signature personas are present
  assert.ok(VOICES.some((v) => v.id === "historian"));
  assert.ok(VOICES.some((v) => v.id === "oracle"));
});

test("TONES: the 6 rich tones, each a real instruction", () => {
  assert.deepEqual(TONES.map((t) => t.id), ["editorial", "casual", "hype", "dark", "academic", "playful"]);
  for (const t of TONES) assert.ok(t.prompt.length > 15, t.id);
});

test("voicePrompt: a named persona returns its prompt; auto/unknown returns ''", () => {
  assert.match(voicePrompt("historian"), /Historian/);
  assert.equal(voicePrompt("auto"), "");        // auto keeps the caller's seeded default
  assert.equal(voicePrompt("nope"), "");
  assert.equal(voicePrompt(null), "");
});

test("tonePrompt: a tone id returns its prompt; unknown returns ''", () => {
  assert.match(tonePrompt("hype"), /energy/i);
  assert.equal(tonePrompt("nope"), "");
  assert.equal(tonePrompt(null), "");
});

test("every named persona carries a structural shape; auto does not", () => {
  assert.equal(VOICES[0].shape, "");                 // auto: no shape
  for (const v of VOICES.slice(1)) assert.ok(v.shape && v.shape.length > 30, v.id);
});

test("voiceShape: a named persona returns its shape; auto/unknown returns ''", () => {
  assert.match(voiceShape("gossip"), /scene|whisper|reveal/i);
  assert.match(voiceShape("researcher"), /number|stat/i);
  assert.equal(voiceShape("auto"), "");
  assert.equal(voiceShape("nope"), "");
  assert.equal(voiceShape(null), "");
});

test("voiceById / toneById resolve or null", () => {
  assert.equal(voiceById("critic").label, "Critic");
  assert.equal(voiceById("xxx"), null);
  assert.equal(toneById("dark").label, "Dark / Moody");
  assert.equal(toneById("xxx"), null);
});
