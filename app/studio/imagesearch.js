// Pure helpers for the Photos-panel search (app/api/images/route.js): relevance
// ranking of stock results and provider interleave. Kept here (not in the route)
// so they're unit-testable without pulling next/server. No network, no keys.

const STOP = {
  the: 1, a: 1, an: 1, of: 1, in: 1, on: 1, at: 1, to: 1, for: 1, and: 1, or: 1,
  with: 1, from: 1, by: 1, as: 1, is: 1, are: 1, "&": 1,
};

// The meaningful lowercase word tokens of a query (drop stopwords + very short
// bits), used to score how on-topic a stock result is. Pure.
export function queryTokens(q) {
  return String(q == null ? "" : q)
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP[w]);
}

// How well one stock result matches the query: the number of DISTINCT query tokens
// that appear in its alt / credit / source text. A whole-word-ish substring match
// (so "office" hits "office", "offices"). Pure.
export function scoreStockMatch(img, tokens) {
  if (!img || !tokens || !tokens.length) return 0;
  const hay = ((img.alt || "") + " " + (img.credit || "") + " " + (img.source || "")).toLowerCase();
  let n = 0;
  for (const t of tokens) if (hay.indexOf(t) >= 0) n++;
  return n;
}

// Rank stock results by relevance (on-topic first), stable within a score so the
// provider interleave order is preserved for ties. When there are enough genuinely
// matching results (>= keep), the zero-match noise (the unrelated "moon/balloons")
// is dropped; otherwise everything is kept so a thin query still fills the grid.
// An empty/degenerate query returns the input order unchanged. Pure.
export function rankStock(results, query, keep) {
  const list = Array.isArray(results) ? results : [];
  const tokens = queryTokens(query);
  if (!tokens.length) return list.slice();
  const scored = list.map((img, i) => ({ img, i, s: scoreStockMatch(img, tokens) }));
  scored.sort((a, b) => (b.s - a.s) || (a.i - b.i));
  const positive = scored.filter((x) => x.s > 0);
  const chosen = positive.length >= (keep || 6) ? positive : scored;
  return chosen.map((x) => x.img);
}

// Round-robin interleave several result lists into one (provider mix), so the pool
// isn't all of one source before the next. Pure; dedupe happens downstream.
export function interleave(groups) {
  const gs = (groups || []).map((g) => (Array.isArray(g) ? g : []));
  const max = gs.reduce((m, g) => Math.max(m, g.length), 0);
  const out = [];
  for (let i = 0; i < max; i++) {
    for (const g of gs) if (g[i]) out.push(g[i]);
  }
  return out;
}
