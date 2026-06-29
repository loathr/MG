// trending.js — the pure half of the live "Trending" panel (cued, hidden,
// category-tied, like the old monolith — but sourced from FREE keyless feeds, so
// zero Claude credits). Builds per-beat RSS + Wikipedia most-read URLs and parses
// their responses into a ranked topic list. Network fetches live in
// app/api/trending/route.js; this module is unit-tested with mock payloads.
import { upsizeWikiThumb } from "./entity";

// Each beat = a label + the DESK it belongs to (the create screen shows only the
// selected desk's beats, in a dropdown) + the writing VOICE it maps to (tie-back
// when a card is picked) + free RSS feeds (recency) + keyword TERMS used to bucket
// Wikipedia most-read into the beat. Feeds are Guardian section RSS (and HN for
// dev-heavy sectors) where one exists; beats with rss:[] are "thin" and lean on
// most-read + terms. Any feed that 404s is skipped — the route never returns empty.
//
// Routes: Editorial = 9 culture beats · Enterprise = 13 sectors · News Desk = 10
// desks. A beat appears under exactly one desk (keys are unique).
const G = (p) => "https://www.theguardian.com/" + p + "/rss";
export const BEATS = [
  // ---- Editorial · 9 culture beats ----------------------------------------
  { key: "film",      desk: "editorial", label: "Film & TV",     voice: "editorial", rss: [G("film")],    terms: ["film", "movie", "cinema", "director", "actor", "series", "Netflix", "HBO", "Oscar"] },
  { key: "music",     desk: "editorial", label: "Music",         voice: "editorial", rss: [G("music")],   terms: ["album", "singer", "band", "rapper", "song", "musician", "tour", "Grammy"] },
  { key: "fashion",   desk: "editorial", label: "Fashion",       voice: "editorial", rss: [G("fashion")], terms: ["fashion", "designer", "runway", "brand", "style", "couture", "model"] },
  { key: "sports",    desk: "editorial", label: "Sports",        voice: "editorial", rss: [G("sport")],   terms: ["football", "basketball", "soccer", "tennis", "Olympic", "cricket", "cup", "league"] },
  { key: "food",      desk: "editorial", label: "Food",          voice: "editorial", rss: [G("food")],    terms: ["restaurant", "chef", "food", "cuisine", "cocktail", "recipe", "dining"] },
  // The Tea — celebrity gossip, TMZ-style: real gossip feeds drive it.
  { key: "tea",       desk: "editorial", label: "The Tea",       voice: "story",     rss: ["https://www.tmz.com/rss.xml", "https://pagesix.com/feed/", "https://www.justjared.com/feed/"], terms: ["celebrity", "actor", "actress", "singer", "rapper", "star", "model", "dating", "split", "divorce", "breakup", "engaged", "wedding", "baby", "feud", "scandal", "red carpet", "Kardashian", "romance", "drama"] },
  { key: "photo",     desk: "editorial", label: "Photography",   voice: "editorial", rss: [], terms: ["photographer", "photograph", "camera", "photo"] },
  { key: "nightlife", desk: "editorial", label: "Nightlife",     voice: "editorial", rss: [], terms: ["nightclub", "DJ", "festival", "rave", "bar"] },
  { key: "trivia",    desk: "editorial", label: "Did You Know?", voice: "editorial", rss: [], terms: [] }, // empty terms → today's general curiosities

  // ---- Enterprise · 13 sectors (business voice) ---------------------------
  // Enterprise sectors share a few HIGH-VOLUME Guardian sections (technology /
  // business / media / society / money / environment) and are focused by their
  // TERMS in the route (selectTrending) — niche subsection feeds were too thin.
  { key: "ent_tech",       desk: "enterprise", label: "Tech",        voice: "business", rss: [G("technology"), "https://hnrss.org/frontpage"], terms: ["tech", "software", "app", "chip", "cloud", "Apple", "Google", "Microsoft", "Meta"] },
  { key: "ent_ai",         desk: "enterprise", label: "AI",          voice: "business", rss: [G("technology"), "https://hnrss.org/newest?q=AI"], terms: ["AI", "artificial intelligence", "model", "OpenAI", "LLM", "machine learning", "chatbot", "Nvidia", "Anthropic"] },
  { key: "ent_startups",   desk: "enterprise", label: "Startups",    voice: "business", rss: [G("technology"), "https://hnrss.org/frontpage"], terms: ["startup", "founder", "venture", "funding", "seed", "raise", "valuation", "IPO"] },
  { key: "ent_markets",    desk: "enterprise", label: "Markets",     voice: "business", rss: [G("business")], terms: ["market", "stocks", "index", "S&P", "Nasdaq", "Dow", "bond", "shares", "rally"] },
  { key: "ent_finance",    desk: "enterprise", label: "Finance",     voice: "business", rss: [G("business")], terms: ["bank", "finance", "fund", "lending", "rate", "investment", "credit"] },
  { key: "ent_crypto",     desk: "enterprise", label: "Crypto",      voice: "business", rss: [G("technology"), G("business")], terms: ["crypto", "bitcoin", "ethereum", "token", "blockchain", "stablecoin", "exchange"] },
  { key: "ent_economy",    desk: "enterprise", label: "Economy",     voice: "business", rss: [G("business")], terms: ["economy", "GDP", "inflation", "jobs", "rate", "recession", "Fed", "growth"] },
  { key: "ent_marketing",  desk: "enterprise", label: "Marketing",   voice: "business", rss: [G("media")], terms: ["marketing", "advertising", "brand", "campaign", "agency"] },
  { key: "ent_media",      desk: "enterprise", label: "Media",       voice: "business", rss: [G("media")], terms: ["media", "streaming", "publisher", "platform", "press", "subscription"] },
  { key: "ent_retail",     desk: "enterprise", label: "Retail",      voice: "business", rss: [G("business")], terms: ["retail", "store", "sales", "consumer", "shopping", "ecommerce"] },
  { key: "ent_energy",     desk: "enterprise", label: "Energy",      voice: "business", rss: [G("environment"), G("business")], terms: ["energy", "oil", "gas", "renewable", "grid", "power", "solar"] },
  { key: "ent_health",     desk: "enterprise", label: "Healthcare",  voice: "business", rss: [G("society")], terms: ["health", "hospital", "pharma", "biotech", "drug", "vaccine", "trial"] },
  { key: "ent_realestate", desk: "enterprise", label: "Real Estate", voice: "business", rss: [G("money"), G("business")], terms: ["property", "housing", "real estate", "mortgage", "rent", "homes"] },

  // ---- News Desk · 10 desks (news voice) ----------------------------------
  // Each is its own high-volume Guardian section, so most are broad (no terms);
  // climate/health ride a parent section and are focused by terms.
  { key: "news_world",     desk: "newsdesk", label: "World",        voice: "news", rss: [G("world")],      terms: [] },
  { key: "news_politics",  desk: "newsdesk", label: "Politics",     voice: "news", rss: [G("politics")],   terms: [] },
  { key: "news_business",  desk: "newsdesk", label: "Business",     voice: "news", rss: [G("business")],   terms: [] },
  { key: "news_science",   desk: "newsdesk", label: "Science",      voice: "news", rss: [G("science")],    terms: [] },
  { key: "news_climate",   desk: "newsdesk", label: "Climate",      voice: "news", rss: [G("environment")], terms: ["climate", "emissions", "warming", "carbon", "COP", "heat", "flood", "wildfire"] },
  { key: "news_health",    desk: "newsdesk", label: "Health",       voice: "news", rss: [G("society")],    terms: ["health", "disease", "NHS", "outbreak", "hospital", "virus", "care"] },
  { key: "news_tech",      desk: "newsdesk", label: "Technology",   voice: "news", rss: [G("technology")], terms: [] },
  { key: "news_law",       desk: "newsdesk", label: "Law & Justice",voice: "news", rss: [G("law")],        terms: [] },
  { key: "news_education", desk: "newsdesk", label: "Education",    voice: "news", rss: [G("education")],  terms: [] },
  { key: "news_media",     desk: "newsdesk", label: "Media",        voice: "news", rss: [G("media")],      terms: [] },
];

export function getBeat(key) {
  return BEATS.find((b) => b.key === key) || BEATS[0];
}
export function beatVoice(key) {
  return getBeat(key).voice;
}
// The beats for a desk (Editorial / Enterprise / News Desk), in order. Falls back
// to all beats if the desk is unknown.
export function beatsForDesk(desk) {
  const list = BEATS.filter((b) => b.desk === desk);
  return list.length ? list : BEATS.slice();
}
// The default (first) beat key for a desk — what the dropdown opens on.
export function defaultBeat(desk) {
  return beatsForDesk(desk)[0].key;
}

// Wikipedia "featured" feed for a day carries the most-read articles. Keyless.
export function mostReadUrl(y, m, d) {
  const p2 = (n) => String(n).padStart(2, "0");
  return "https://en.wikipedia.org/api/rest_v1/feed/featured/" + y + "/" + p2(m) + "/" + p2(d);
}

function decodeEntities(s) {
  return String(s == null ? "" : s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .trim();
}

// Strip the trailing " | Site" / " - Site" suffix RSS titles often carry.
export function cleanTitle(s) {
  return decodeEntities(s).replace(/\s*[|–-]\s*(The Guardian|BBC|Variety|IndieWire|Pitchfork|Reuters)\s*$/i, "").trim();
}

// Condense a feed item's description/summary into a short factual seed (R5
// grounding): strip tags/entities and clamp to ~300 chars on a word boundary.
function trimExtract(s) {
  const t = decodeEntities(s).replace(/\s+/g, " ").trim();
  return t.length > 300 ? t.slice(0, 300).replace(/\s+\S*$/, "") + "…" : t;
}

// Pick the best image URL out of one feed item. Feeds (Guardian especially)
// carry SEVERAL <media:content width=.. url=..> at different sizes — take the
// largest, and DECODE the URL (&amp; -> &): the raw XML url has entity-escaped
// query separators, and passing those into a CSS url() silently breaks the
// image (the "no pictures, grey tiles" bug). Falls back to an image enclosure.
export function pickThumb(block) {
  let best = null, bestW = -1;
  const tags = block.match(/<media:(?:content|thumbnail)\b[^>]*>/gi) || [];
  for (const t of tags) {
    const u = t.match(/\burl="([^"]+)"/i);
    if (!u) continue;
    const wm = t.match(/\bwidth="(\d+)"/i);
    const w = wm ? +wm[1] : 1;
    if (w > bestW) { bestW = w; best = u[1]; }
  }
  if (!best) {
    const e = block.match(/<enclosure[^>]*\burl="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
    if (e) best = e[1];
  }
  return best ? best.replace(/&amp;/g, "&").replace(/&#0?38;/g, "&") : null;
}

// Parse an RSS/Atom feed string into items. Regex-based (no XML dependency):
// tolerant of CDATA + entities; pulls the largest available thumbnail.
export function parseRss(xml, max) {
  const out = [];
  if (!xml || typeof xml !== "string") return out;
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) || [];
  for (const b of blocks) {
    const tm = b.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = tm ? cleanTitle(tm[1]) : "";
    if (!title) continue;
    const dm = b.match(/<(?:pubDate|published|updated)[^>]*>([\s\S]*?)<\//i);
    const xm = b.match(/<(?:description|summary|content)[^>]*>([\s\S]*?)<\/(?:description|summary|content)>/i);
    out.push({ title, thumb: pickThumb(b), when: dm ? dm[1].trim() : "", extract: xm ? trimExtract(xm[1]) : "", source: "feed" });
    if (max && out.length >= max) break;
  }
  return out;
}

// Pull usable most-read articles out of the featured feed: real article titles
// with thumbnails, dropping Main Page / Special: / portal / list noise.
export function parseMostRead(json) {
  const arts = (json && json.mostread && json.mostread.articles) || [];
  const out = [];
  for (const a of arts) {
    const title = (a.titles && (a.titles.normalized || a.titles.display))
      || (a.title ? String(a.title).replace(/_/g, " ") : "");
    if (!title) continue;
    if (/^(Main Page|Special:|Wikipedia:|Portal:|List of |Deaths in )/i.test(title)) continue;
    const thumb = a.thumbnail && a.thumbnail.source ? (upsizeWikiThumb(a.thumbnail.source, 480) || a.thumbnail.source) : null;
    out.push({ title, thumb, views: a.views || 0, extract: a.extract || a.description || "", source: "Wikipedia" });
  }
  return out;
}

// Keep most-read items matching any of the beat's terms (title or extract).
// Empty terms → keep all (the "Did You Know?" beat = today's general curiosities).
export function filterByTerms(items, terms) {
  if (!terms || !terms.length) return (items || []).slice();
  const rx = new RegExp("\\b(" + terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "i");
  return (items || []).filter((it) => rx.test(it.title) || rx.test(it.extract || ""));
}

// Merge feed items (recency) ahead of filtered most-read (popularity), dedupe by
// a normalized title, prefer items that carry a thumbnail (it's a photo rail),
// and return the top `max`.
export function rankItems(rssItems, wikiItems, max) {
  const seen = {};
  const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const pick = [];
  const push = (it) => {
    const k = norm(it.title);
    if (!k || seen[k]) return;
    seen[k] = 1;
    pick.push(it);
  };
  (rssItems || []).filter((it) => it.thumb).forEach(push); // feed items with art first
  (wikiItems || []).filter((it) => it.thumb).forEach(push); // then most-read with photos
  (rssItems || []).forEach(push);                            // then remaining feed items
  (wikiItems || []).forEach(push);                           // then remaining most-read
  return pick.slice(0, max || 6).map((it) => ({ title: it.title, thumb: it.thumb || null, extract: it.extract || "", source: it.source || "feed" }));
}

// Pick a beat's trending set: FOCUS the feed + most-read on the beat's terms,
// then BROADEN if that pull is thin — so a beat stays on-topic but never runs
// dry (the fix for sector beats that over-filtered into 1-2 generic cards).
// Terms now filter the FEED too (not just most-read), so several sectors can
// share one high-volume section feed and still come back focused.
export function selectTrending(rssItems, wikiItems, terms, max) {
  const hasTerms = !!(terms && terms.length);
  const rss = rssItems || [], wiki = wikiItems || [];
  if (!hasTerms) return rankItems(rss, wiki, max);
  const rssF = filterByTerms(rss, terms);
  const wikiF = filterByTerms(wiki, terms);
  let ranked = rankItems(rssF, wikiF, max);
  // Thin focused pull → keep the on-topic feed, widen the popularity source.
  if (ranked.length < 4) ranked = rankItems(rss, wikiF.length ? wikiF : wiki, max);
  // Still thin (niche beat / quiet day) → fall back to the unfiltered feed.
  if (ranked.length < 3) ranked = rankItems(rss, wiki, max);
  return ranked;
}
