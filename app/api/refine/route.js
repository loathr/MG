import { NextResponse } from "next/server";
import { googleNewsUrl, gdeltUrl, parseRss, parseGdelt, mergeSources, mostReadUrl, parseMostRead, scopeQuery, geoHint, regionById, countriesForRegion, getBeat } from "../../studio/trending";
import { viralityScore, viralityTier, cleanTopic } from "../../studio/refine";

// Live signals for the Topic refiner — a topic's RELATED recent coverage + a
// VIRALITY score, from the same FREE keyless feeds as /api/trending (GDELT +
// Google News + Wikipedia most-read). Zero Claude credits. Cached 30 min. Best
// effort: any source that fails is skipped and the score is computed from what
// came back (the headline-shape signal always contributes, so an offline sandbox
// still returns a sane low score rather than an error).
//
// SCOPE-AWARE: the same Scope the Trending panel uses (region / country / beat)
// now flows in, so the refiner's related-recent + virality are read WITHIN scope
// instead of globally. Region/country geo-scope the pull (Google News hl/gl +
// GDELT sourcecountry); when a beat is set we also count how much of the topic's
// coverage sits IN that sector vs overall — the feed-count confirmation of the
// client's instant cross-beat classification.
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

// Resolve the Scope into a place keyword + a geo hint for the topic pull. A
// country uses its own hint; a region uses its first hinted member hub (and its
// label as the place keyword) so a topic reads as "in-region"; global → neither.
function resolveScope(region, country) {
  if (country) return { place: country, hint: geoHint(country) };
  if (region && region !== "global") {
    const hub = (countriesForRegion(region) || []).find((c) => geoHint(c));
    return { place: regionById(region).label, hint: hub ? geoHint(hub) : null };
  }
  return { place: null, hint: null };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = cleanTopic(searchParams.get("topic") || "");
    // Optional decided title — drives the headline-shape signal without changing
    // the feed query (so the client can also recompute the score locally when the
    // user picks a different angle, no refetch). Defaults to the topic.
    const headline = cleanTopic(searchParams.get("headline") || "") || topic;
    if (!topic) return NextResponse.json({ topic: "", items: [], signals: null, score: 0, tier: "mild", scope: null });

    // Scope in (all optional): region / country geo-scope the pull; a beat drives
    // the in-sector coverage count.
    const region = searchParams.get("region");
    const country = searchParams.get("country");
    const beatKey = searchParams.get("beat");
    const { place, hint } = resolveScope(region, country);
    const scoped = !!(place || hint);

    // Topic query, scoped to the place when one is set ("(topic) \"Europe\"").
    const query = scopeQuery([], topic, place);
    const now = Date.now();

    const [gnText, gdeltJson, featured] = await Promise.all([
      getText(googleNewsUrl(query, hint)),
      getJson(gdeltUrl(query, hint)),
      getJson(mostReadUrl(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth() + 1, new Date(now).getUTCDate())),
    ]);
    const gn = parseRss(gnText, 12);
    const gd = parseGdelt(gdeltJson, 20);
    const wiki = parseMostRead(featured);

    // Related & recent — merged + deduped, newest sources first, capped small.
    const items = mergeSources([gd, gn], 5).slice(0, 4);

    // Feed-count confirmation of off-sector: when a beat is set, count how much of
    // the topic's coverage appears IN that sector's terms vs overall. One extra
    // GDELT call, best-effort. The client's instant cross-beat classifier decides;
    // this confirms it with live data (topic covered, but not in-sector → off).
    let sectorCoverage = null;
    if (beatKey) {
      const beat = getBeat(beatKey);
      const terms = (beat.terms || []).slice(0, 6);
      if (terms.length) {
        const sectorQ = "(" + terms.join(" OR ") + ") (" + topic + ")";
        const sgd = parseGdelt(await getJson(gdeltUrl(sectorQ, hint)), 20);
        sectorCoverage = { sector: beat.key, inSector: sgd.length, overall: gd.length };
      }
    }

    // Signals (scoped): distinct feeds that returned anything, article coverage,
    // freshest dated item, matched Wikipedia read volume, and the headline shape.
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
    const scope = scoped ? { place: place || null, inRegion: !!hint } : null;

    return NextResponse.json({ topic, items, signals, score: result.score, parts: result.parts, tier, scope, sectorCoverage });
  } catch (e) {
    return NextResponse.json({ topic: "", items: [], signals: null, score: 0, tier: "mild", scope: null, error: e && e.message ? e.message : "refine failed" }, { status: 200 });
  }
}
