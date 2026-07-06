// Unit checks for app/studio/refine.js — the pure Topic-refiner core: angle
// templating (deterministic, grammatical mid-sentence insertion) and the virality
// score (weighted 0-100 over free-feed signals + headline shape). No network here;
// the route that gathers live signals is tested by its own shape elsewhere.
import test from "node:test";
import assert from "node:assert/strict";
import {
  hashStr, cleanTopic, ANGLE_TEMPLATES, angleSuggestions,
  scoreHeadline, VIRALITY_WEIGHTS, viralityScore, viralityTier, viralityReasons, compactViews,
} from "../app/studio/refine.js";

test("cleanTopic collapses whitespace and trims trailing punctuation", () => {
  assert.equal(cleanTopic("  weight   loss  drugs. "), "weight loss drugs");
  assert.equal(cleanTopic("AI regulation"), "AI regulation");
  assert.equal(cleanTopic(""), "");
  assert.equal(cleanTopic(null), "");
});

test("angleSuggestions: deterministic, grammatical, ties to real angle ids", () => {
  const a = angleSuggestions("weight loss drugs");
  const b = angleSuggestions("weight loss drugs");
  assert.deepEqual(a, b, "same topic → same suggestions");
  assert.ok(a.length >= 5 && a.length <= 6);
  // mid-sentence lower-casing: "Weight" → "weight" inside the template
  assert.ok(a.some((s) => /the hidden economics of weight loss drugs/i.test(s.title)));
  // every suggestion ties back to a trending.js ANGLE id
  const ids = new Set(ANGLE_TEMPLATES.map((t) => t.id));
  for (const s of a) { assert.ok(ids.has(s.angleId), s.angleId); assert.ok(s.title.length > 8); assert.ok(s.hint); }
});

test("angleSuggestions keeps acronyms/model names intact", () => {
  const a = angleSuggestions("NASA budget");
  assert.ok(a.some((s) => s.title.includes("NASA budget")), "NASA stays upper-case");
  const g = angleSuggestions("GLP-1 drugs");
  assert.ok(g.some((s) => s.title.includes("GLP-1 drugs")), "GLP-1 stays intact");
});

test("angleSuggestions: blank topic → no suggestions", () => {
  assert.deepEqual(angleSuggestions(""), []);
  assert.deepEqual(angleSuggestions("   "), []);
});

test("listicle number is stable per topic", () => {
  const a = angleSuggestions("remote work");
  const listicle = a.find((s) => s.angleId === "explainer");
  assert.ok(listicle && /^\d+ things nobody tells you about remote work$/.test(listicle.title));
  // stable across calls
  assert.equal(listicle.title, angleSuggestions("remote work").find((s) => s.angleId === "explainer").title);
});

test("scoreHeadline rewards numerals, questions, curiosity words", () => {
  const plain = scoreHeadline("Quarterly report on regional agriculture output");
  const punchy = scoreHeadline("5 shocking truths nobody tells you");
  assert.ok(punchy > plain, "punchy scores higher than plain");
  assert.ok(scoreHeadline("Why this changed everything?") > scoreHeadline("A change occurred"));
  assert.equal(scoreHeadline(""), 0);
  // bounded 0..1
  for (const t of ["", "5 5 5 shocking secret hidden why how never", "a b c"]) {
    const v = scoreHeadline(t);
    assert.ok(v >= 0 && v <= 1, t);
  }
});

test("viralityScore: weights compose to 100 and score is bounded", () => {
  const sum = Object.values(VIRALITY_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.equal(sum, 100);
  // a maxed-out topic approaches 100
  const hot = viralityScore({ sources: 4, views: 2e6, articleCount: 30, freshestHours: 1, headline: "5 shocking secrets revealed" });
  assert.ok(hot.score >= 85, "hot ~ " + hot.score);
  // a dead topic near 0
  const cold = viralityScore({ sources: 0, views: 0, articleCount: 0, freshestHours: Infinity, headline: "quarterly agricultural output review report" });
  assert.ok(cold.score <= 10, "cold ~ " + cold.score);
  // monotonic in sources
  const a = viralityScore({ sources: 1, views: 0, articleCount: 0, freshestHours: Infinity, headline: "x" }).score;
  const b = viralityScore({ sources: 4, views: 0, articleCount: 0, freshestHours: Infinity, headline: "x" }).score;
  assert.ok(b > a, "more sources → higher");
});

test("viralityScore: missing signals default safely (no NaN)", () => {
  const r = viralityScore({});
  assert.ok(Number.isFinite(r.score));
  assert.equal(r.score, 0);
  const r2 = viralityScore(undefined);
  assert.ok(Number.isFinite(r2.score));
});

test("viralityTier thresholds", () => {
  assert.equal(viralityTier(83).tier, "hot");
  assert.equal(viralityTier(70).tier, "hot");
  assert.equal(viralityTier(55).tier, "warm");
  assert.equal(viralityTier(40).tier, "warm");
  assert.equal(viralityTier(12).tier, "mild");
  assert.equal(viralityTier(0).tier, "mild");
});

test("compactViews formats thousands and millions", () => {
  assert.equal(compactViews(512000), "512k");
  assert.equal(compactViews(1200000), "1.2M");
  assert.equal(compactViews(950), "950");
  assert.equal(compactViews(0), "0");
});

test("viralityReasons builds labelled rows from signals", () => {
  const sig = { sources: 4, views: 512000, articleCount: 17, freshestHours: 6, headline: "5 things nobody tells you" };
  const res = viralityScore(sig);
  const rows = viralityReasons(sig, res);
  assert.ok(rows.some((r) => r.key === "sources" && /4 \/ 4/.test(r.label)));
  assert.ok(rows.some((r) => r.key === "views" && /512k/.test(r.label)));
  assert.ok(rows.some((r) => r.key === "coverage" && /17 news articles/.test(r.label)));
  assert.ok(rows.some((r) => r.key === "recency" && r.on === true));
  assert.ok(rows.some((r) => r.key === "headline"));
  // rows with no data are omitted (no views → no views row)
  const sparse = viralityReasons({ sources: 1, headline: "x" }, viralityScore({ sources: 1, headline: "x" }));
  assert.ok(!sparse.some((r) => r.key === "views"));
});
