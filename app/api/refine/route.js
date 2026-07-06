import { NextResponse } from "next/server";
import { googleNewsUrl, gdeltUrl, parseRss, parseGdelt, mergeSources, mostReadUrl, parseMostRead, scopeQuery } from "../../studio/trending";
import { viralityScore, viralityTier, cleanTopic } from "../../studio/refine";

// Live signals for the Topic refiner — a topic's RELATED recent coverage + a
// VIRALITY score, from the same FREE keyless feeds as /api/trending (GDELT +
// Google News + Wikipedia most-read). Zero Claude credits. Cached 30 min. Best
// effort: any source that fails is skipped and the score is computed from what
// came back (the headline-shape signal always contributes, so an offline sandbox
// still returns a sane low score rather than an error).
export const revalidate = 1800;

const UA = "LoathrStudio/1.0 (Instagram carousel maker; topic refiner)";

async function getText(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, */*" }, next: { revalidate: 1800 } });
    return r.ok ? await r.text() : "";
  } catch { return ""; }
}
async function getJson(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, next: { revalidate: 1800 } });
    if (!r.ok) return null;
    try { return JSON.parse(await r.text()); } catch { return null; }
  } catch { return null; }
}

// Hours since the freshest dated item, or null if none carry a parseable date.
function freshestHours(items, nowMs) {
  let best = Infinity;
  for (const it of items || []) {
    const t = it && it.when ? Date.parse(it.when) : NaN;
    if (!isNaN(t)) best = Math.min(best, (nowMs - t) / 36e5);
  }
  return isFinite(best) ? Math.max(0, best) : null;
}

// Max Wikipedia most-read views among articles whose title shares a word with the
// topic (a light relevance match — the same whole-word spirit as filterByTerms).
function matchedViews(wikiItems, topic) {
  const words = cleanTopic(topic).toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (!words.length) return 0;
  let best = 0;
  for (const a of wikiItems || []) {
    const hay = (a.title + " " + (a.extract || "")).toLowerCase();
    if (words.some((w) => hay.includes(w))) best = Math.max(best, Number(a.views) || 0);
  }
  return best;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = cleanTopic(searchParams.get("topic") || "");
    // Optional decided title — drives the headline-shape signal without changing
    // the feed query (so the client can also recompute the score locally when the
    // user picks a different angle, no refetch). Defaults to the topic.
    const headline = cleanTopic(searchParams.get("headline") || "") || topic;
    if (!topic) return NextResponse.json({ topic: "", items: [], signals: null, score: 0, tier: "mild" });

    const query = scopeQuery([], topic, null); // "(topic)" — no beat terms, topic is the query
    const now = Date.now();

    // Two keyless news sources for the topic (GDELT carries images + dates; Google
    // News carries fresh coverage) + Wikipedia most-read for a popularity signal.
    const [gnText, gdeltJson, featured] = await Promise.all([
      getText(googleNewsUrl(query, null)),
      getJson(gdeltUrl(query, null)),
      getJson(mostReadUrl(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth() + 1, new Date(now).getUTCDate())),
    ]);
    const gn = parseRss(gnText, 12);
    const gd = parseGdelt(gdeltJson, 20);
    const wiki = parseMostRead(featured);

    // Related & recent — merged + deduped, newest sources first, capped small.
    const items = mergeSources([gd, gn], 5).slice(0, 4);

    // Signals: distinct feeds that returned anything, article coverage, freshest
    // dated item, matched Wikipedia read volume, and the headline shape (the topic
    // itself). Fed to the pure scorer.
    const sources = [gn.length > 0, gd.length > 0, wiki.length > 0].filter(Boolean).length;
    const signals = {
      sources,
      views: matchedViews(wiki, topic),
      articleCount: gd.length,
      freshestHours: freshestHours([...gd, ...gn], now),
      headline,
    };
    const result = viralityScore(signals);
    const tier = viralityTier(result.score).tier;

    return NextResponse.json({ topic, items, signals, score: result.score, parts: result.parts, tier });
  } catch (e) {
    return NextResponse.json({ topic: "", items: [], signals: null, score: 0, tier: "mild", error: e && e.message ? e.message : "refine failed" }, { status: 200 });
  }
}
