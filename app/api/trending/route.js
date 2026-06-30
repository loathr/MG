import { NextResponse } from "next/server";
import { getBeat, mostReadUrl, parseRss, parseMostRead, selectTrending, filterByRegion, filterByCountry, filterByRecency, urgencyById, regionById, geoHint, scopeQuery, googleNewsUrl, gdeltUrl, parseGdelt, mergeSources, backfillSeeds } from "../../studio/trending";

// Live "Trending" for a beat, from FREE keyless feeds only — per-beat RSS
// (recency) + Wikipedia most-read (popularity + photos + a never-empty fallback).
// Zero Claude credits. Cached 30 min via per-fetch revalidate so taps don't
// hammer the feeds. Best-effort: any source that fails is simply skipped.
export const revalidate = 1800;

const UA = "LoathrStudio/1.0 (Instagram carousel maker; trending suggestions)";

// Fisher-Yates — used only on a refresh, to surface a different window of picks.
function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

// `fresh` (the refresh button) bypasses the 30-min data cache for a genuine
// re-pull; normal loads use the cache so taps don't hammer the feeds.
const cacheOpt = (fresh) => (fresh ? { cache: "no-store" } : { next: { revalidate: 1800 } });

// `diag` (present only in debug mode) collects per-source {url, ok, status,
// bytes/error} so /api/trending?beat=X&debug=1 reveals exactly which feeds are
// reachable from the SERVER — the one thing that can't be checked from a browser
// or the sandbox. Best-effort fetches otherwise: a failed source is skipped.
async function getText(url, fresh, diag) {
  try {
    const r = await fetch(url, Object.assign({
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" },
    }, cacheOpt(fresh)));
    const text = r.ok ? await r.text() : "";
    if (diag) diag.push({ url, ok: r.ok, status: r.status, bytes: text.length });
    return text;
  } catch (e) {
    if (diag) diag.push({ url, ok: false, status: 0, error: (e && e.message) || "fetch failed" });
    return "";
  }
}

async function getJson(url, fresh, diag) {
  try {
    const r = await fetch(url, Object.assign({
      headers: { "User-Agent": UA, Accept: "application/json" },
    }, cacheOpt(fresh)));
    const text = r.ok ? await r.text() : "";
    if (diag) diag.push({ url, ok: r.ok, status: r.status, bytes: text.length });
    try { return r.ok ? JSON.parse(text) : null; } catch (e) { return null; }
  } catch (e) {
    if (diag) diag.push({ url, ok: false, status: 0, error: (e && e.message) || "fetch failed" });
    return null;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const beat = getBeat(searchParams.get("beat") || "film");
    const debug = searchParams.get("debug") === "1";
    // Debug always pulls live (no-store) so the diagnostic reflects reality, not a
    // cached empty. The diag array collects per-source fetch results when debugging.
    const fresh = searchParams.get("fresh") === "1" || debug;
    const diag = debug ? [] : null;

    // Most-read: try TODAY (UTC) for the freshest list; the featured feed for the
    // current day isn't published until partway through it, so fall back to
    // yesterday (a completed day is always available).
    const now = new Date();
    let featured = await getJson(mostReadUrl(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate()), fresh, diag);
    if (!featured || !featured.mostread) {
      const y = new Date(now.getTime() - 24 * 3600 * 1000);
      featured = await getJson(mostReadUrl(y.getUTCFullYear(), y.getUTCMonth() + 1, y.getUTCDate()), fresh, diag);
    }
    const wikiAll = parseMostRead(featured);

    const hasFeeds = !!(beat.rss && beat.rss.length);
    let rssItems = [];
    if (hasFeeds) {
      const texts = await Promise.all(beat.rss.map((u) => getText(u, fresh, diag)));
      rssItems = texts.flatMap((t) => parseRss(t, 12));
    }

    // Tier 2b — News-desk secondary route: urgency tightens the recency window
    // (feed dates) and region scopes the pull to its countries. Both broaden
    // rather than gut the rail if they'd leave too few. Absent → no-ops.
    let wikiPool = wikiAll;
    const urg = urgencyById(searchParams.get("urgency"));
    if (urg) rssItems = filterByRecency(rssItems, urg.days, now.getTime());
    const region = searchParams.get("region");
    if (region && region !== "global") {
      rssItems = filterByRegion(rssItems, region);
      wikiPool = filterByRegion(wikiAll, region);
    }
    // Sub-region: narrow further to a single country when one is picked.
    const country = searchParams.get("country");
    if (country) {
      rssItems = filterByCountry(rssItems, country);
      wikiPool = filterByCountry(wikiPool, country);
    }

    const pool = fresh ? 30 : 6;
    // Enterprise sectors share broad section feeds, so always term-FILTER them to
    // the sector (then seed-backfill keeps the rail full); News/editorial keep
    // their own per-beat filterFeed flag.
    const filterFeed = !!beat.filterFeed || beat.desk === "enterprise";
    // Base (Guardian + Wikipedia) pull — the default/unscoped path & fallback.
    const baseRanked = selectTrending(rssItems, wikiPool, beat.terms, pool, hasFeeds, filterFeed);

    // Scoped sources (GDELT + Google News), paired — fired whenever a place
    // (country/region) is set OR the beat has terms, so a narrow combo is scoped
    // AT THE SOURCE instead of post-filtering sparse generic feeds. GDELT carries
    // images; Google News carries fresh in-region coverage; merged + deduped.
    const regionLabel = region && region !== "global" ? regionById(region).label : null;
    const place = country || regionLabel || "";
    const hasTerms = !!(beat.terms && beat.terms.length);
    let scopedItems = [];
    if (place || hasTerms) {
      const hint = geoHint(country);
      const q = scopeQuery(beat.terms, beat.label, place);
      const [gnText, gdJson] = await Promise.all([
        getText(googleNewsUrl(q, hint), fresh, diag),
        getJson(gdeltUrl(q, hint), fresh, diag),
      ]);
      scopedItems = mergeSources([parseGdelt(gdJson, 20), parseRss(gnText, 20)], 30);
    }

    // Compose: scoped items lead (on-topic, in-region, often pictured), then the
    // base pull fills, then curated seeds backfill so the rail is never empty.
    const merged = mergeSources([scopedItems, baseRanked], pool);
    const composed = backfillSeeds(merged, beat.seeds, pool);
    const items = (fresh ? shuffle(composed) : composed).slice(0, 6);

    // Honest scope label: say what actually produced the rail. If a place was
    // requested but the scoped sources came back empty, flag that it broadened.
    const requested = country || regionLabel || null;
    const scope = requested
      ? { requested, sourced: scopedItems.length > 0, label: scopedItems.length > 0 ? requested : requested + " — few live results, broadened" }
      : null;

    const payload = { beat: beat.key, voice: beat.voice, items, scope };
    if (debug) {
      payload.debug = {
        hasFeeds, terms: beat.terms, configuredFeeds: beat.rss || [], place, scope,
        scopedCount: scopedItems.length, baseCount: baseRanked.length,
        rssParsed: rssItems.length, wikiParsed: wikiAll.length, returned: items.length,
        sources: diag,
      };
    }
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json({ beat: null, items: [], error: e && e.message ? e.message : "trending failed" }, { status: 200 });
  }
}
