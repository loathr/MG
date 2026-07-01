// Unit checks for app/studio/imagesearch.js — the pure relevance ranking + provider
// interleave behind the Photos-panel search.
import test from "node:test";
import assert from "node:assert/strict";
import { queryTokens, scoreStockMatch, rankStock, interleave } from "../app/studio/imagesearch.js";

test("queryTokens: lowercases, drops stopwords + 1-char bits", () => {
  assert.deepEqual(queryTokens("Startup Office at Night"), ["startup", "office", "night"]);
  assert.deepEqual(queryTokens("the a of"), []); // all stopwords
  assert.deepEqual(queryTokens(""), []);
});

test("scoreStockMatch: counts distinct query tokens present in alt/credit/source", () => {
  const toks = queryTokens("startup office");
  assert.equal(scoreStockMatch({ alt: "a busy startup office" }, toks), 2);
  assert.equal(scoreStockMatch({ alt: "modern office desk" }, toks), 1);
  assert.equal(scoreStockMatch({ alt: "hot air balloon at sunset" }, toks), 0);
  assert.equal(scoreStockMatch({ credit: "Startup Weekly", source: "Pexels" }, toks), 1);
});

test("rankStock: on-topic first, stable within a score, drops zero-match noise when enough hits", () => {
  const r = (alt) => ({ url: "u:" + alt, alt });
  const results = [
    r("hot air balloon"), r("busy startup office"), r("the moon"), r("office desk"),
    r("startup team meeting"), r("office laptop"), r("startup coworking space"), r("random flower"),
  ];
  const ranked = rankStock(results, "startup office", 3);
  // the 5 matching results lead; the 3 zero-match (balloon/moon/flower) are dropped
  assert.equal(ranked.length, 5);
  assert.ok(ranked.every((x) => /office|startup/.test(x.alt)));
  assert.equal(ranked[0].alt, "busy startup office"); // score 2 leads
});

test("rankStock: keeps everything (incl. zeros) when too few genuine matches — never empties the grid", () => {
  const r = (alt) => ({ url: "u:" + alt, alt });
  const results = [r("busy office"), r("hot air balloon"), r("the moon")];
  const ranked = rankStock(results, "startup office", 6); // only 1 positive < keep=6
  assert.equal(ranked.length, 3);          // nothing dropped
  assert.equal(ranked[0].alt, "busy office"); // but the match still leads
});

test("rankStock: an empty/degenerate query returns input order unchanged", () => {
  const results = [{ url: "a" }, { url: "b" }];
  assert.deepEqual(rankStock(results, ""), results);
});

test("interleave: round-robins provider lists, skipping gaps", () => {
  assert.deepEqual(interleave([[1, 2, 3], ["a", "b"], ["x"]]), [1, "a", "x", 2, "b", 3]);
  assert.deepEqual(interleave([[], [1]]), [1]);
  assert.deepEqual(interleave([]), []);
});
