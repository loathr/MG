// Unit checks for app/studio/coherence.js — the pure half of the structure check:
// the deck outline, the prompt builder, and the verdict parser.
import test from "node:test";
import assert from "node:assert/strict";
import { deckOutline, buildCoherencePrompt, parseCoherence } from "../app/studio/coherence.js";

const DECK = { slides: [
  { content: { role: "COVER", heading: "The Skinny Shot", subhead: "one pen, one empire" } },
  { content: { role: "THE TURN", heading: "Bigger Than Denmark", body: "market cap passed GDP" } },
  { content: { role: "CLOSER", heading: "The bill changes hands", cta: "follow" } },
] };

test("deckOutline: role + heading + body per slide, in order", () => {
  const o = deckOutline(DECK);
  assert.equal(o.length, 3);
  assert.deepEqual(o[0], { slide: 0, role: "COVER", heading: "The Skinny Shot", body: "one pen, one empire" });
  assert.equal(o[1].body, "market cap passed GDP");
  assert.equal(o[2].body, "follow"); // falls back to cta
});

test("buildCoherencePrompt threads the outline + the structure rubric + JSON shape", () => {
  const p = buildCoherencePrompt(DECK);
  assert.match(p, /reads as ONE coherent piece/i);
  assert.match(p, /HOOK/); assert.match(p, /COVER header/i); // explicit cover-hook critique
  assert.match(p, /SPINE/); assert.match(p, /ARC/); assert.match(p, /CONNECTIVE TISSUE/); assert.match(p, /CALLBACK/);
  assert.match(p, /"score"/); assert.match(p, /"spine"/); assert.match(p, /"issues"/);
  assert.ok(p.includes("The Skinny Shot")); // the actual deck is embedded
});

test("parseCoherence reads score/spine/issues, clamps the score, normalises unknown kinds", () => {
  const v = parseCoherence('{"score":6,"spine":"a drug became a wealth transfer","summary":"mostly holds","issues":[{"slide":2,"kind":"callback","note":"closer misses the cover"},{"slide":1,"kind":"weird","note":"x"}]}');
  assert.equal(v.score, 6);
  assert.equal(v.spine, "a drug became a wealth transfer");
  assert.equal(v.issues.length, 2);
  assert.equal(v.issues[0].kind, "callback");
  assert.equal(v.issues[1].kind, "spine"); // unknown kind → spine
  assert.equal(parseCoherence('{"score":99,"issues":[]}').score, 10);  // clamped
  assert.equal(parseCoherence('{"issues":[]}').score, null);           // missing score
});

test("parseCoherence reads the fix (rewrite/cut/merge); drops malformed fixes + fixes on strengths", () => {
  const v = parseCoherence(JSON.stringify({ score: 6, spine: "s", issues: [
    { slide: 0, kind: "hook", note: "generic cover", fix: { action: "rewrite", heading: "Who Actually Pays For The Skinny Shot?" } },
    { slide: 6, kind: "callback", note: "n", fix: { action: "rewrite", heading: "New closer", body: "pays off the hook" } },
    { slide: 5, kind: "repeat", note: "n", fix: { action: "cut" } },
    { slide: 4, kind: "arc", note: "n", fix: { action: "merge", into: 3, heading: "H", body: "B" } },
    { slide: 2, kind: "transition", note: "n", fix: { action: "rewrite" } },   // no text → fix dropped
    { slide: 1, kind: "strength", note: "works", fix: { action: "cut" } },      // strengths never get a fix
  ] }));
  assert.equal(v.issues[0].kind, "hook"); // the cover-hook issue parses
  assert.deepEqual(v.issues[0].fix, { action: "rewrite", slide: 0, heading: "Who Actually Pays For The Skinny Shot?", body: "" });
  assert.deepEqual(v.issues[1].fix, { action: "rewrite", slide: 6, heading: "New closer", body: "pays off the hook" });
  assert.deepEqual(v.issues[2].fix, { action: "cut", slide: 5 });
  assert.deepEqual(v.issues[3].fix, { action: "merge", slide: 4, into: 3, heading: "H", body: "B" });
  assert.equal(v.issues[4].fix, undefined); // rewrite with no text → no fix
  assert.equal(v.issues[5].fix, undefined); // strength → no fix
});

test("parseCoherence tolerates fences + trailing commas; throws on empty", () => {
  const v = parseCoherence('```json\n{"score":8,"spine":"s","issues":[{"slide":0,"kind":"repeat","note":"n"},]}\n```');
  assert.equal(v.score, 8);
  assert.equal(v.issues[0].kind, "repeat");
  assert.throws(() => parseCoherence(""));
});
