// trending.js — the pure half of the live "Trending" panel (cued, hidden,
// category-tied, like the old monolith — but sourced from FREE keyless feeds, so
// zero Claude credits). Builds per-beat RSS + Wikipedia most-read URLs and parses
// their responses into a ranked topic list. Network fetches live in
// app/api/trending/route.js; this module is unit-tested with mock payloads.
import { upsizeWikiThumb } from "./entity";

// Each beat = a content category (label) + the writing VOICE it maps to (tie-back
// when a card is picked) + free RSS feeds (recency) + keyword TERMS used to bucket
// Wikipedia most-read into the beat. The first ten have feeds (The Tea pulls
// celebrity gossip, TMZ-style); the last three are "thin" (no reliable free RSS)
// and lean entirely on most-read.
export const BEATS = [
  { key: "film",      label: "Film & TV",     voice: "editorial", rss: ["https://www.theguardian.com/film/rss"],       terms: ["film", "movie", "cinema", "director", "actor", "series", "Netflix", "HBO", "Oscar"] },
  { key: "music",     label: "Music",         voice: "editorial", rss: ["https://www.theguardian.com/music/rss"],      terms: ["album", "singer", "band", "rapper", "song", "musician", "tour", "Grammy"] },
  { key: "sports",    label: "Sports",        voice: "editorial", rss: ["https://www.theguardian.com/sport/rss"],      terms: ["football", "basketball", "soccer", "tennis", "Olympic", "cricket", "cup", "league"] },
  { key: "fashion",   label: "Fashion",       voice: "editorial", rss: ["https://www.theguardian.com/fashion/rss"],    terms: ["fashion", "designer", "runway", "brand", "style", "couture", "model"] },
  { key: "food",      label: "Food",          voice: "editorial", rss: ["https://www.theguardian.com/food/rss"],       terms: ["restaurant", "chef", "food", "cuisine", "cocktail", "recipe", "dining"] },
  { key: "tech",      label: "Tech",          voice: "business",  rss: ["https://www.theguardian.com/technology/rss", "https://hnrss.org/frontpage"], terms: ["tech", "software", "AI", "startup", "app", "chip", "Apple", "Google"] },
  { key: "business",  label: "Business",      voice: "business",  rss: ["https://www.theguardian.com/business/rss"],   terms: ["company", "market", "CEO", "stock", "economy", "earnings", "bank"] },
  { key: "news",      label: "World News",    voice: "news",      rss: ["https://www.theguardian.com/world/rss"],      terms: ["election", "war", "government", "president", "minister", "summit"] },
  { key: "science",   label: "Science",       voice: "news",      rss: ["https://www.theguardian.com/science/rss"],    terms: ["study", "research", "space", "NASA", "discovery", "climate", "physics"] },
  // The Tea — celebrity gossip, TMZ-style: real gossip feeds (recency) drive it,
  // with the most-read fallback skewed to celebrity drama by the terms.
  { key: "tea",       label: "The Tea",       voice: "story",     rss: ["https://www.tmz.com/rss.xml", "https://pagesix.com/feed/", "https://www.justjared.com/feed/"], terms: ["celebrity", "actor", "actress", "singer", "rapper", "star", "model", "dating", "split", "divorce", "breakup", "engaged", "wedding", "baby", "feud", "scandal", "red carpet", "Kardashian", "romance", "drama"] },
  // Thin beats — no reliable free RSS, so Wikipedia most-read only.
  { key: "photo",     label: "Photography",   voice: "editorial", rss: [], terms: ["photographer", "photograph", "camera", "photo"] },
  { key: "nightlife", label: "Nightlife",     voice: "editorial", rss: [], terms: ["nightclub", "DJ", "festival", "rave", "bar"] },
  { key: "trivia",    label: "Did You Know?", voice: "editorial", rss: [], terms: [] }, // empty terms → today's general curiosities
];

export function getBeat(key) {
  return BEATS.find((b) => b.key === key) || BEATS[0];
}
export function beatVoice(key) {
  return getBeat(key).voice;
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
