import { NextResponse } from "next/server";
import { getBeat, mostReadUrl, parseRss, parseMostRead, filterByTerms, rankItems } from "../../studio/trending";

// Live "Trending" for a beat, from FREE keyless feeds only — per-beat RSS
// (recency) + Wikipedia most-read (popularity + photos + a never-empty fallback).
// Zero Claude credits. Cached 30 min via per-fetch revalidate so taps don't
// hammer the feeds. Best-effort: any source that fails is simply skipped.
export const revalidate = 1800;

const UA = "LoathrStudio/1.0 (Instagram carousel maker; trending suggestions)";

// `fresh` (the refresh button) bypasses the 30-min data cache for a genuine
// re-pull; normal loads use the cache so taps don't hammer the feeds.
const cacheOpt = (fresh) => (fresh ? { cache: "no-store" } : { next: { revalidate: 1800 } });

async function getText(url, fresh) {
  try {
    const r = await fetch(url, Object.assign({
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" },
    }, cacheOpt(fresh)));
    return r.ok ? await r.text() : "";
  } catch (e) { return ""; }
}

async function getJson(url, fresh) {
  try {
    const r = await fetch(url, Object.assign({
      headers: { "User-Agent": UA, Accept: "application/json" },
    }, cacheOpt(fresh)));
    return r.ok ? await r.json() : null;
  } catch (e) { return null; }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const beat = getBeat(searchParams.get("beat") || "film");
    const fresh = searchParams.get("fresh") === "1";

    // Most-read: try TODAY (UTC) for the freshest list; the featured feed for the
    // current day isn't published until partway through it, so fall back to
    // yesterday (a completed day is always available).
    const now = new Date();
    let featured = await getJson(mostReadUrl(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate()), fresh);
    if (!featured || !featured.mostread) {
      const y = new Date(now.getTime() - 24 * 3600 * 1000);
      featured = await getJson(mostReadUrl(y.getUTCFullYear(), y.getUTCMonth() + 1, y.getUTCDate()), fresh);
    }
    const wikiAll = parseMostRead(featured);
    const wiki = filterByTerms(wikiAll, beat.terms);

    let rssItems = [];
    if (beat.rss && beat.rss.length) {
      const texts = await Promise.all(beat.rss.map((u) => getText(u, fresh)));
      rssItems = texts.flatMap((t) => parseRss(t, 12));
    }

    let items = rankItems(rssItems, wiki, 6);
    // Never empty: if a thin beat's keyword filter starved the list, fall back to
    // the unfiltered most-read (today's general top articles).
    if (items.length < 3) items = rankItems(rssItems, wikiAll, 6);

    return NextResponse.json({ beat: beat.key, voice: beat.voice, items });
  } catch (e) {
    return NextResponse.json({ beat: null, items: [], error: e && e.message ? e.message : "trending failed" }, { status: 200 });
  }
}
