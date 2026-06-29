import { NextResponse } from "next/server";
import { getBeat, mostReadUrl, parseRss, parseMostRead, selectTrending } from "../../studio/trending";

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

    // Refresh (fresh=1) ranks a larger pool and returns a shuffled window, so a
    // re-pull surfaces different picks. selectTrending focuses the feed +
    // most-read on the beat's terms, then broadens if that pull is thin — so a
    // sector beat stays on-topic but never returns a near-empty rail. hasFeeds
    // keeps a feed-down section beat from leaking unfiltered general most-read.
    const pool = fresh ? 30 : 6;
    const ranked = selectTrending(rssItems, wikiAll, beat.terms, pool, hasFeeds);
    const items = (fresh ? shuffle(ranked) : ranked).slice(0, 6);

    const payload = { beat: beat.key, voice: beat.voice, items };
    if (debug) {
      payload.debug = {
        hasFeeds, terms: beat.terms, configuredFeeds: beat.rss || [],
        rssParsed: rssItems.length, wikiParsed: wikiAll.length, returned: items.length,
        sources: diag,
      };
    }
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json({ beat: null, items: [], error: e && e.message ? e.message : "trending failed" }, { status: 200 });
  }
}
