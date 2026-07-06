import { NextResponse } from "next/server";
import { getBeat, mostReadUrl, parseRss, parseMostRead, selectTrending, filterByRegion, filterByCountry, filterByRecency, urgencyById, regionById, scopedPlan, googleNewsUrl, gdeltUrl, parseGdelt, mergeSources, backfillSeeds } from "../../studio/trending";
import { rankBreaking } from "../../studio/refine";

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

    // Scoped sources (GDELT + Google News), paired — scoped AT THE SOURCE instead
    // of post-filtering sparse generic feeds. scopedPlan turns beat + region +
    // country into one or more geo-scoped pulls: a country → its hub; a region →
    // a FAN-OUT across its top member-country hubs (real in-region depth); terms
    // only → a single query. GDELT carries images; Google News carries fresh
    // coverage; all pulls merged + deduped.
    const regionLabel = region && region !== "global" ? regionById(region).label : null;
    // Rotate the region hub window on a genuine refresh so a region isn't always
    // the same three countries (#4); a normal cached load uses offset 0 (stable).
    const rotOffset = fresh ? Math.floor(Math.random() * 997) : 0;
    const plan = scopedPlan(beat, region, country, 3, rotOffset);
    let scopedItems = [];
    if (plan.length) {
      const lists = await Promise.all(plan.flatMap((pl) => [
        getText(googleNewsUrl(pl.query, pl.hint), fresh, diag).then((t) => parseRss(t, 12)),
        getJson(gdeltUrl(pl.query, pl.hint), fresh, diag).then((j) => parseGdelt(j, 12)),
      ]));
      scopedItems = mergeSources(lists, 40);
    }

    // Compose by DEPTH & RICHNESS, not pictures: scoped in-region items lead (they
    // come first, recency-ordered), then the base pull fills, then curated seeds
    // backfill so the rail is never empty. mergeSources preserves this order — a
    // thumbnail no longer reorders anything — so a scoped region rail genuinely
    // leads with its in-region content even when those items carry no image.
    const merged = mergeSources([scopedItems, baseRanked], pool);
    const composed = backfillSeeds(merged, beat.seeds, pool);
    // Breaking mode reorders the rail HOTTEST-first (recency + headline shape),
    // overriding the usual richness/shuffle order — the freshest, punchiest news
    // leads. Other urgencies keep the composed order (fresh=shuffle for variety).
    const ordered = urg && urg.id === "breaking"
      ? rankBreaking(composed, now.getTime())
      : (fresh ? shuffle(composed) : composed);
    const items = ordered.slice(0, 6);

    // Honest scope label (#5): say what actually produced the rail — the place, how
    // many in-region hubs it fanned across, and, if the scoped sources came back
    // empty, that it fell back to the global pool. hubs is 0 for a single-country
    // pick (no fan-out) so the panel only shows a hub count for a real region fan.
    const requested = country || regionLabel || null;
    const sourced = scopedItems.length > 0;
    const hubs = !country && region && region !== "global" ? plan.filter((p) => p.hint).length : 0;
    const scope = requested
      ? { requested, sourced, hubs, fallback: sourced ? null : "global",
          label: sourced ? requested : requested + " — no live results, showing global" }
      : null;

    const payload = { beat: beat.key, voice: beat.voice, items, scope };
    if (debug) {
      payload.debug = {
        hasFeeds, terms: beat.terms, configuredFeeds: beat.rss || [], scope,
        plan: plan.map((pl) => ({ label: pl.label, query: pl.query, gdelt: pl.hint && pl.hint.gdelt })),
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
