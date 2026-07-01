// Unit checks for app/studio/verify.js — the pure pieces of fact-check: pulling
// claims off a deck, building the verify prompt, and parsing the verdict.
import test from "node:test";
import assert from "node:assert/strict";
import { deckClaims, buildVerifyPrompt, parseVerdict, correctionReady } from "../app/studio/verify.js";

const DECK = {
  category: "news",
  slides: [
    { content: { role: "COVER", heading: "Big Claim", sources: ["Reuters"] } },
    { content: { heading: "A Fact", body: "Two sentences of proof.", stat: "42", statLabel: "percent" } },
    { content: { role: "CLOSER", heading: "Thanks", cta: "Follow" } },
  ],
};

test("deckClaims pulls heading/body/stat/sources per slide with its index", () => {
  const claims = deckClaims(DECK);
  assert.equal(claims.length, 3);
  assert.equal(claims[0].slide, 0);
  assert.equal(claims[0].heading, "Big Claim");
  assert.deepEqual(claims[0].sources, ["Reuters"]);
  assert.equal(claims[1].stat, "42 percent");   // stat + label folded together
  assert.equal(claims[1].body, "Two sentences of proof.");
});

test("buildVerifyPrompt threads the claims, date, web-search rule, and JSON shape", () => {
  const p = buildVerifyPrompt(DECK, { today: "2026-06-26" });
  assert.match(p, /fact-checker/);
  assert.match(p, /Today's date is 2026-06-26/);
  assert.match(p, /Use web search/);
  assert.match(p, /"verdict": "supported\|unsupported\|misleading\|unverifiable"/);
  assert.match(p, /Big Claim/);                  // the deck's own text is embedded
});

test("parseVerdict reads score/summary/claims and clamps the score", () => {
  const v = parseVerdict('{"score":7,"summary":"mostly solid","claims":[{"slide":1,"claim":"c","verdict":"unsupported","note":"n","source":"http://x"}]}');
  assert.equal(v.score, 7);
  assert.equal(v.summary, "mostly solid");
  assert.equal(v.claims.length, 1);
  assert.equal(v.claims[0].verdict, "unsupported");
  assert.equal(v.claims[0].slide, 1);
  assert.equal(parseVerdict('{"score":99,"claims":[]}').score, 10);  // clamped high
  assert.equal(parseVerdict('{"score":-4,"claims":[]}').score, 0);   // clamped low
  assert.equal(parseVerdict('{"claims":[]}').score, null);           // missing score
});

test("parseVerdict normalizes an unknown verdict and tolerates fences + trailing commas", () => {
  const v = parseVerdict('```json\n{"score":5,"claims":[{"slide":0,"claim":"a","verdict":"weird","note":"","source":""},]}\n```');
  assert.equal(v.claims[0].verdict, "unverifiable"); // unknown → unverifiable
  assert.equal(v.score, 5);
});

test("parseVerdict throws on empty or shapeless responses", () => {
  assert.throws(() => parseVerdict(""));
  assert.throws(() => parseVerdict("not json at all"));
});

test("parseVerdict reads the wrong/correction fields (empty when absent)", () => {
  const v = parseVerdict('{"score":6,"claims":[{"slide":2,"claim":"cap","verdict":"misleading","wrong":"$570 billion","correction":"$633 billion","note":"n","source":"Reuters"}]}');
  assert.equal(v.claims[0].wrong, "$570 billion");
  assert.equal(v.claims[0].correction, "$633 billion");
  const v2 = parseVerdict('{"score":8,"claims":[{"slide":0,"claim":"x","verdict":"supported","note":"","source":"AP"}]}');
  assert.equal(v2.claims[0].wrong, "");
  assert.equal(v2.claims[0].correction, "");
});

test("correctionReady: a problem verdict WITH source + wrong + correction is appliable; else not", () => {
  const base = { verdict: "misleading", wrong: "$570 billion", correction: "$633 billion", source: "Reuters" };
  assert.equal(correctionReady(base), true);
  assert.equal(correctionReady(Object.assign({}, base, { verdict: "supported" })), false); // not a problem
  assert.equal(correctionReady(Object.assign({}, base, { source: "" })), false);           // unsourced
  assert.equal(correctionReady(Object.assign({}, base, { correction: "" })), false);       // no fix
  assert.equal(correctionReady(Object.assign({}, base, { correction: "$570 billion" })), false); // fix == wrong
  assert.equal(correctionReady(Object.assign({}, base, { verdict: "unverifiable" })), false);
  assert.equal(correctionReady(null), false);
});
