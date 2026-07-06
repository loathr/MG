// refine.js — the pure half of the Topic refiner (create screen). Two jobs, both
// with ZERO Claude cost: (1) turn a bare topic into a handful of sharper, angled
// TITLES via deterministic templates, and (2) score a topic's VIRALITY from the
// signals the free keyless feeds already carry (cross-source corroboration,
// Wikipedia read volume, recency, article coverage, headline shape). No model
// call anywhere — the live feed fetch happens in app/api/refine/route.js; this
// module is unit-tested with plain inputs.
//
// The refiner SHARPENS the one generation the user already pays for (a tighter
// topic → a tighter deck); it never adds a generation. The virality read is an
// honest heuristic ("buzz signal"), surfaced only AFTER a topic is decided.

// Tiny stable string hash → non-negative int (dJBb2). Kept local so refine.js has
// no imports and stays trivially pure/testable. Same family as generate.hashStr.
export function hashStr(s) {
  let h = 5381;
  const str = String(s == null ? "" : s);
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

// Normalise a typed topic for templating: collapse whitespace, drop a trailing
// full stop, and keep it verbatim otherwise (we don't title-case — the templates
// wrap it, so "weight loss drugs" reads right mid-sentence).
export function cleanTopic(topic) {
  return String(topic == null ? "" : topic).replace(/\s+/g, " ").replace(/[.\s]+$/, "").trim();
}

// A short lower-case fragment for mid-sentence insertion ("the economics of X").
// Only lower-cases a leading capital when the whole word isn't an acronym, so
// "NASA" and "GLP-1" stay intact but "Weight loss" → "weight loss".
function midCase(t) {
  const s = cleanTopic(t);
  if (!s) return s;
  const first = s.split(" ")[0];
  const isAcronym = /^[A-Z0-9][A-Z0-9-]+$/.test(first); // NASA, GLP-1, AI
  return isAcronym ? s : s.charAt(0).toLowerCase() + s.slice(1);
}

// The angle templates. Each maps to one of trending.js's ANGLE ids (so a picked
// suggestion can also seed the route angle) and carries a short hint shown under
// the title. `build(topic, n)` returns the finished title; `n` is a stable number
// for the listicle template. Order here is the display order.
export const ANGLE_TEMPLATES = [
  { id: "data",          hint: "follow the money",        build: (t) => "The hidden economics of " + midCase(t) },
  { id: "explainer",     hint: "listicle hook",           build: (t, n) => n + " things nobody tells you about " + midCase(t) },
  { id: "future",        hint: "where it's heading",      build: (t) => "Why " + midCase(t) + " is about to change" },
  { id: "human",         hint: "one person's story",      build: (t) => "One year inside " + midCase(t) },
  { id: "contrarian",    hint: "against the consensus",   build: (t) => "Everyone is wrong about " + midCase(t) },
  { id: "investigative", hint: "who really profits",      build: (t) => "Who really profits from " + midCase(t) },
];

// Turn a topic into up to `max` sharper angle suggestions. Deterministic: the
// same topic always yields the same set + order (the listicle number is seeded by
// the topic hash). Empty/blank topic → []. Pure.
export function angleSuggestions(topic, max) {
  const t = cleanTopic(topic);
  if (!t) return [];
  const seed = hashStr(t);
  const n = 5 + (seed % 3); // 5, 6 or 7 — stable per topic
  const cap = max || 6;
  return ANGLE_TEMPLATES.slice(0, cap).map((tpl) => ({
    id: tpl.id,
    angleId: tpl.id,          // ties back to trending.js ANGLES (route.angle)
    hint: tpl.hint,
    title: tpl.build(t, n),
  }));
}

// ---- Virality scoring -------------------------------------------------------
// A weighted 0-100 read over signals the free feeds already carry. All inputs are
// plain numbers/strings so this is trivially testable; the route computes them
// from GDELT + Google News + Wikipedia most-read (all keyless).

// Curiosity / emotion / stakes trigger words that tend to travel. Whole-word,
// case-insensitive. Deliberately small + generic — this is a nudge, not a model.
const TRIGGER_WORDS = [
  "secret", "hidden", "shocking", "surprising", "why", "how", "never", "always",
  "everyone", "nobody", "truth", "mistake", "warning", "banned", "crisis", "boom",
  "collapse", "surge", "record", "first", "new", "now", "finally", "revealed",
];

// Score a single headline/title's SHAREABILITY, 0-1. Deterministic, pure. Rewards
// a leading numeral (listicle), curiosity/stakes words, a question, and a
// superlative; long unpunchy titles score low.
export function scoreHeadline(title) {
  const s = String(title == null ? "" : title).trim();
  if (!s) return 0;
  const lower = s.toLowerCase();
  let score = 0;
  if (/\b\d+\b/.test(s)) score += 0.28;                        // a number anywhere
  if (/^\s*\d+\b/.test(s)) score += 0.12;                      // leads with one (listicle)
  if (/\?$/.test(s)) score += 0.12;                            // a question
  if (/\b(best|worst|most|biggest|first|only|never|always)\b/i.test(s)) score += 0.14; // superlative/absolute
  const rx = new RegExp("\\b(" + TRIGGER_WORDS.join("|") + ")\\b", "gi");
  const hits = (lower.match(rx) || []).length;
  score += Math.min(0.34, hits * 0.12);                        // curiosity/stakes words, capped
  const words = s.split(/\s+/).length;
  if (words > 14) score -= 0.1;                                // rambling headlines travel worse
  return Math.max(0, Math.min(1, score));
}

// Weights sum to 100. Exported so a test can assert the composition is intact.
export const VIRALITY_WEIGHTS = { sources: 28, views: 26, recency: 20, coverage: 16, headline: 10 };

// Clamp helper.
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

// Compute the 0-100 virality score + a per-signal breakdown from raw signals:
//   sources       — # of distinct feeds carrying the topic (0..4+)
//   views         — Wikipedia most-read views for the day (0 if not most-read)
//   articleCount  — # of GDELT/news articles matching the query
//   freshestHours — hours since the freshest matching item (Infinity if none)
//   headline      — the decided title/topic string (headline-shape signal)
// Each signal is normalised to 0-1, weighted, summed, rounded. Pure/deterministic.
export function viralityScore(signals) {
  const s = signals || {};
  const sources = clamp01((Number(s.sources) || 0) / 4);                 // 4+ sources = maxed
  const views = clamp01(Math.log10((Number(s.views) || 0) + 1) / 6);    // ~1M reads ≈ 1.0
  const coverage = clamp01((Number(s.articleCount) || 0) / 20);          // 20 articles = maxed
  const fh = s.freshestHours == null ? Infinity : Number(s.freshestHours);
  const recency = !isFinite(fh) ? 0 : clamp01(1 - fh / 168);             // decays over 7 days
  const headline = scoreHeadline(s.headline);
  const w = VIRALITY_WEIGHTS;
  const parts = {
    sources: sources * w.sources,
    views: views * w.views,
    recency: recency * w.recency,
    coverage: coverage * w.coverage,
    headline: headline * w.headline,
  };
  const total = Math.round(parts.sources + parts.views + parts.recency + parts.coverage + parts.headline);
  return { score: Math.max(0, Math.min(100, total)), parts, norm: { sources, views, coverage, recency, headline } };
}

// Tier + label for a score, driving the badge colour. hot ≥ 70, warm ≥ 40, else
// mild. Pure.
export function viralityTier(score) {
  const n = Number(score) || 0;
  if (n >= 70) return { tier: "hot", label: "Hot" };
  if (n >= 40) return { tier: "warm", label: "Warm" };
  return { tier: "mild", label: "Quiet" };
}

// Build the human-readable signal rows for the virality panel from a computed
// result + the raw signals — the "across 4/4 sources", "512k reads" lines. Pure,
// so the panel stays presentational. Returns [{ key, label, on }].
export function viralityReasons(signals, result) {
  const s = signals || {};
  const n = (result && result.norm) || {};
  const srcN = Number(s.sources) || 0;
  const views = Number(s.views) || 0;
  const arts = Number(s.articleCount) || 0;
  const fh = s.freshestHours == null ? Infinity : Number(s.freshestHours);
  const rows = [];
  rows.push({ key: "sources", on: srcN >= 2, label: "Across " + srcN + " / 4 free sources" });
  if (views > 0) rows.push({ key: "views", on: (n.views || 0) > 0.2, label: compactViews(views) + " Wikipedia reads today" });
  if (arts > 0) rows.push({ key: "coverage", on: arts >= 5, label: arts + " news article" + (arts === 1 ? "" : "s") + " covering it" });
  if (isFinite(fh)) rows.push({ key: "recency", on: fh <= 48, label: "Freshest coverage " + humanHours(fh) });
  rows.push({ key: "headline", on: (n.headline || 0) >= 0.3, label: "Headline shape: " + headlineNote(s.headline) });
  return rows;
}

// 512000 → "512k", 1200000 → "1.2M". Pure.
export function compactViews(v) {
  const n = Number(v) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return Math.round(n / 1e3) + "k";
  return String(n);
}

// Hours → a short phrase. Pure.
function humanHours(h) {
  const n = Number(h) || 0;
  if (n < 1) return "under an hour ago";
  if (n < 48) return Math.round(n) + "h ago";
  return Math.round(n / 24) + "d ago";
}

// ---- Breaking-mode ordering -------------------------------------------------
// Breaking mode wants the rail HOTTEST-first, not richness-first. Per-item heat
// blends recency (dominant for breaking) with headline shape — freshest + punchiest
// lead. nowMs is passed in so this stays pure/testable; an item with no parseable
// date falls back to a neutral recency so headline shape still ranks it.
export function itemHeat(item, nowMs) {
  const it = item || {};
  const t = it.when ? Date.parse(it.when) : NaN;
  const hours = isNaN(t) ? null : Math.max(0, (Number(nowMs) - t) / 36e5);
  const recency = hours == null ? 0.35 : clamp01(1 - hours / 48); // 48h breaking window
  const head = scoreHeadline(it.title);
  return 0.62 * recency + 0.38 * head;
}

// Stable hottest-first ordering of trending items for Breaking mode. Ties keep
// original order (recency-composed upstream). Pure — never mutates the input.
export function rankBreaking(items, nowMs) {
  return (items || [])
    .map((it, i) => ({ it, i, h: itemHeat(it, nowMs) }))
    .sort((a, b) => b.h - a.h || a.i - b.i)
    .map((x) => x.it);
}

// A tiny description of what the headline signal rewarded. Pure.
function headlineNote(title) {
  const s = String(title || "");
  const bits = [];
  if (/\b\d+\b/.test(s)) bits.push("numeral");
  if (/\?$/.test(s)) bits.push("question");
  const rx = new RegExp("\\b(" + TRIGGER_WORDS.join("|") + ")\\b", "i");
  if (rx.test(s)) bits.push("curiosity");
  return bits.length ? bits.join(" + ") : "plain";
}
