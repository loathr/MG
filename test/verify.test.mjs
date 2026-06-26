// Unit checks for app/studio/verify.js — the pure pieces of fact-check: pulling
// claims off a deck, building the verify prompt, and parsing the verdict.
import test from "node:test";
import assert from "node:assert/strict";
import { deckClaims, buildVerifyPrompt, parseVerdict } from "../app/studio/verify.js";

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
