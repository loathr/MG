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
// desks. A beat appears under exactly one desk (keys are unique). Each also
// carries a `group` (the cluster it shows under in the create-screen dropdown)
// and, for the Enterprise sectors, `seeds` — the old monolith curated TOPICS,
// reused as ghost-text hints + framing anchors (NEVER inserted as a slide topic;
// TOPIC_ROUTES.md). The Enterprise/News taxonomy is the monolith's
// ENTERPRISE_SECTORS / NEWSDESK_DESKS (app/components/segments/*.config.js),
// re-backed here with a Guardian parent feed + terms via the filterFeed path.
const G = (p) => "https://www.theguardian.com/" + p + "/rss";
export const BEATS = [
  // ---- Editorial · 9 culture beats ----------------------------------------
  { key: "film",      desk: "editorial", group: "Screen & Sound", label: "Film & TV",     voice: "editorial", rss: [G("film")],    terms: ["film", "movie", "cinema", "director", "actor", "series", "Netflix", "HBO", "Oscar"] },
  { key: "music",     desk: "editorial", group: "Screen & Sound", label: "Music",         voice: "editorial", rss: [G("music")],   terms: ["album", "singer", "band", "rapper", "song", "musician", "tour", "Grammy"] },
  { key: "fashion",   desk: "editorial", group: "Style & Scene",  label: "Fashion",       voice: "editorial", rss: [G("fashion")], terms: ["fashion", "designer", "runway", "brand", "style", "couture", "model"] },
  // Sub-topic culture beats borrow a parent section feed and FILTER it to their
  // terms (so they're not empty like a feed-less narrow beat is): Photography
  // rides Art & Design, Nightlife rides Music.
  { key: "photo",     desk: "editorial", group: "Style & Scene",  label: "Photography",   voice: "editorial", rss: [G("artanddesign")], filterFeed: true, terms: ["photographer", "photograph", "photography", "camera", "photo", "exhibition", "portrait"] },
  { key: "nightlife", desk: "editorial", group: "Style & Scene",  label: "Nightlife",     voice: "editorial", rss: [G("music")], filterFeed: true, terms: ["nightclub", "club", "DJ", "festival", "rave", "dancefloor", "techno", "house", "electronic"] },
  { key: "food",      desk: "editorial", group: "Life & Sport",   label: "Food",          voice: "editorial", rss: [G("food")],    terms: ["restaurant", "chef", "food", "cuisine", "cocktail", "recipe", "dining"] },
  { key: "sports",    desk: "editorial", group: "Life & Sport",   label: "Sports",        voice: "editorial", rss: [G("sport")],   terms: ["football", "basketball", "soccer", "tennis", "Olympic", "cricket", "cup", "league"] },
  // The Tea — celebrity gossip, TMZ-style: real gossip feeds drive it.
  { key: "tea",       desk: "editorial", group: "Buzz",           label: "The Tea",       voice: "story",     rss: ["https://www.tmz.com/rss.xml", "https://pagesix.com/feed/", "https://www.justjared.com/feed/"], terms: ["celebrity", "actor", "actress", "singer", "rapper", "star", "model", "dating", "split", "divorce", "breakup", "engaged", "wedding", "baby", "feud", "scandal", "red carpet", "Kardashian", "romance", "drama"] },
  { key: "trivia",    desk: "editorial", group: "Buzz",           label: "Did You Know?", voice: "editorial", rss: [], terms: [] }, // empty terms → today's general curiosities

  // ---- Enterprise · 13 sectors (business voice) ---------------------------
  // The monolith's ENTERPRISE_SECTORS. They SHARE high-volume Guardian sections
  // (society / business / environment / media / money / technology / education)
  // and are focused by their TERMS (selectTrending) — niche subsection feeds were
  // too thin. `seeds` = the matching monolith ENTERPRISE_TOPICS.
  { key: "ent_healthcare",  desk: "enterprise", group: "Health & Science", label: "Healthcare & Pharma",  voice: "business", rss: [G("society")], terms: ["health", "hospital", "pharma", "biotech", "drug", "vaccine", "clinical", "NHS", "FDA"], seeds: ["Telehealth adoption", "AI drug discovery", "Hospital staffing crisis", "GLP-1 drug market", "Medical device regulation", "Mental health tech"] },
  { key: "ent_agriculture", desk: "enterprise", group: "Health & Science", label: "Agriculture & Food",   voice: "business", rss: [G("environment"), G("business")], terms: ["agriculture", "farming", "food", "crop", "harvest", "livestock", "fishery", "soil"], seeds: ["Precision agriculture ROI", "Vertical farming viability", "Food waste tech", "Plant-based protein economics", "Water scarcity technology"] },
  { key: "ent_space",       desk: "enterprise", group: "Health & Science", label: "Space & Aerospace",    voice: "business", rss: [G("science"), G("technology")], terms: ["space", "satellite", "rocket", "NASA", "SpaceX", "orbit", "aerospace", "launch"], seeds: ["Satellite internet competition", "Space tourism economics", "Orbital manufacturing", "Space debris management", "Launch cost economics"] },
  { key: "ent_energy",      desk: "enterprise", group: "Energy & Industry", label: "Energy & Climate",     voice: "business", rss: [G("environment"), G("business")], terms: ["energy", "oil", "gas", "renewable", "grid", "power", "solar", "nuclear", "emissions"], seeds: ["Grid modernization", "EV charging race", "Carbon credit market", "Nuclear energy comeback", "Green hydrogen economics"] },
  { key: "ent_supplychain", desk: "enterprise", group: "Energy & Industry", label: "Supply Chain",         voice: "business", rss: [G("business")], terms: ["supply chain", "logistics", "shipping", "port", "freight", "manufacturing", "trade", "warehouse"], seeds: ["Nearshoring acceleration", "Port automation", "Last-mile delivery economics", "Cold chain logistics", "Trade route disruptions"] },
  { key: "ent_defense",     desk: "enterprise", group: "Energy & Industry", label: "Defense & Security",   voice: "business", rss: [G("world"), G("technology")], terms: ["defense", "military", "cybersecurity", "security", "drone", "weapons", "intelligence", "surveillance"], seeds: ["Cybersecurity spending surge", "Drone warfare economics", "Defense AI procurement", "Critical infrastructure protection"] },
  { key: "ent_finance",     desk: "enterprise", group: "Markets & Money",   label: "Finance & Banking",    voice: "business", rss: [G("business")], terms: ["bank", "finance", "fund", "lending", "rate", "investment", "credit", "mortgage", "IPO"], seeds: ["Open banking disruption", "BNPL regulation wave", "Central bank digital currencies", "Private credit boom", "Neo-bank profitability"] },
  { key: "ent_realestate",  desk: "enterprise", group: "Markets & Money",   label: "Real Estate",          voice: "business", rss: [G("money"), G("business")], terms: ["property", "housing", "real estate", "mortgage", "rent", "homes", "commercial", "landlord"], seeds: ["Commercial real estate downturn", "PropTech valuation reset", "Housing affordability crisis", "Data center real estate boom", "Climate risk in property"] },
  { key: "ent_crypto",      desk: "enterprise", group: "Markets & Money",   label: "Crypto & Web3",        voice: "business", rss: [G("technology"), G("business")], terms: ["crypto", "bitcoin", "ethereum", "token", "blockchain", "stablecoin", "web3", "exchange"], seeds: ["Bitcoin ETF market impact", "Stablecoin regulation", "DeFi institutional adoption", "NFT market evolution"] },
  { key: "ent_media",       desk: "enterprise", group: "Society & Media",   label: "Media & Entertainment", voice: "business", rss: [G("media")], terms: ["media", "streaming", "studio", "publisher", "platform", "subscription", "podcast", "creator"], seeds: ["Streaming profitability crisis", "AI-generated content", "Local news collapse", "Podcast monetization", "Creator economy maturation"] },
  { key: "ent_education",   desk: "enterprise", group: "Society & Media",   label: "Education",            voice: "business", rss: [G("education")], terms: ["education", "school", "university", "student", "edtech", "tuition", "learning", "enrollment"], seeds: ["EdTech post-pandemic reality", "AI tutoring disruption", "Student debt solutions", "Corporate upskilling", "Micro-credential adoption"] },
  { key: "ent_labor",       desk: "enterprise", group: "Society & Media",   label: "Labor & Workforce",    voice: "business", rss: [G("business"), G("society")], terms: ["labor", "jobs", "workforce", "union", "hiring", "layoff", "wages", "remote work"], seeds: ["Remote work policy shifts", "Gig economy regulation", "AI job displacement", "Union resurgence", "Four-day work week"] },
  { key: "ent_lifestyle",   desk: "enterprise", group: "Society & Media",   label: "Lifestyle & Consumer", voice: "business", rss: [G("business"), G("lifeandstyle")], terms: ["consumer", "retail", "brand", "luxury", "wellness", "travel", "subscription", "shopping"], seeds: ["Wellness industry consolidation", "Luxury resale growth", "Travel industry recovery", "Subscription fatigue", "Longevity economy"] },

  // ---- News Desk · 10 desks (news voice) ----------------------------------
  // The monolith's NEWSDESK_DESKS. Most are their own high-volume Guardian
  // section (broad, no terms); crime/health/conflict ride a parent section and
  // are focused by terms (filterFeed).
  { key: "news_politics",    desk: "newsdesk", group: "World & Politics", label: "Politics",          voice: "news", rss: [G("politics")],   terms: [] },
  { key: "news_conflict",    desk: "newsdesk", group: "World & Politics", label: "Conflict & Defense", voice: "news", rss: [G("world")], filterFeed: true, terms: ["war", "military", "conflict", "troops", "refugee", "ceasefire", "missile", "invasion", "strike"] },
  { key: "news_crime",       desk: "newsdesk", group: "Law & Society",    label: "Crime & Justice",   voice: "news", rss: [G("law")], filterFeed: true, terms: ["crime", "police", "court", "trial", "prison", "justice", "investigation", "charges"] },
  { key: "news_education",   desk: "newsdesk", group: "Law & Society",    label: "Education",         voice: "news", rss: [G("education")],  terms: [] },
  { key: "news_business",    desk: "newsdesk", group: "Business & Tech",  label: "Business",          voice: "news", rss: [G("business")],   terms: [] },
  { key: "news_tech",        desk: "newsdesk", group: "Business & Tech",  label: "Technology",        voice: "news", rss: [G("technology")], terms: [] },
  { key: "news_health",      desk: "newsdesk", group: "Science & Planet", label: "Health & Science",  voice: "news", rss: [G("society"), G("science")], filterFeed: true, terms: ["health", "disease", "NHS", "research", "study", "hospital", "scientist", "outbreak"] },
  { key: "news_environment", desk: "newsdesk", group: "Science & Planet", label: "Environment",       voice: "news", rss: [G("environment")], terms: [] },
  { key: "news_culture",     desk: "newsdesk", group: "Culture & Sport",  label: "Arts & Culture",    voice: "news", rss: [G("culture")],    terms: [] },
  { key: "news_sports",      desk: "newsdesk", group: "Culture & Sport",  label: "Sports",            voice: "news", rss: [G("sport")],      terms: [] },
];

// Enterprise sectors SHARE high-volume feeds (society / business / …), so their
// feed is term-FILTERED down to the sector. Dedicated single-section feeds
// (Editorial culture, the broad News desks) use the whole feed — every item is
// already on-topic, so filtering only drops good cards.
for (const b of BEATS) if (b.desk === "enterprise") b.filterFeed = true;

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
// The desk's beats clustered into ordered groups for the create-screen dropdown:
// [{ group, beats: [...] }], groups in first-seen order, beats in their list
// order. Drives the grouped dropdown (TOPIC_ROUTES.md, mock "B").
export function groupsForDesk(desk) {
  const out = [];
  for (const b of beatsForDesk(desk)) {
    const name = b.group || "More";
    let g = out.find((x) => x.group === name);
    if (!g) { g = { group: name, beats: [] }; out.push(g); }
    g.beats.push(b);
  }
  return out;
}
// The framing a picked beat contributes to generation (TOPIC_ROUTES.md): the
// desk-adaptive KIND label + the beat's own label + its terms (anchors). Pure —
// generate.js stays decoupled from this module; the create screen passes the
// resolved object straight into buildPrompt's `route`.
const DESK_KIND = { editorial: "Beat", enterprise: "Sector", newsdesk: "Section" };
// The desk-adaptive name for the route control / dropdown label.
export function deskKind(desk) {
  return DESK_KIND[desk] || "Beat";
}
export function routeFraming(key) {
  const b = getBeat(key);
  return { kind: deskKind(b.desk), label: b.label, terms: (b.terms || []).slice() };
}

// ---- News Desk secondary route (Tier 2): Region + Urgency -------------------
// The monolith's NEWSDESK_REGIONS / NEWSDESK_URGENCY. Region scopes the live
// pull (its `countries` filter the feed, Tier 2b) and frames generation; urgency
// sets the recency window + a smart slide-count default + a framing hint.
export const REGIONS = [
  { id: "global",     label: "Global",      countries: [] },
  { id: "americas",   label: "Americas",    countries: ["United States", "Canada", "Mexico", "Brazil", "Argentina", "Colombia", "Chile", "Peru", "Cuba", "Jamaica", "Trinidad"] },
  { id: "europe",     label: "Europe",      countries: ["United Kingdom", "France", "Germany", "Spain", "Italy", "Netherlands", "Sweden", "Poland", "Ukraine", "Ireland", "Switzerland", "Belgium", "Portugal", "Greece", "Turkey"] },
  { id: "africa",     label: "Africa",      countries: ["Nigeria", "South Africa", "Kenya", "Ghana", "Ethiopia", "Egypt", "Tanzania", "Rwanda", "Senegal", "Morocco", "Algeria", "Uganda", "Cameroon", "Ivory Coast", "DR Congo"] },
  { id: "asia",       label: "Asia",        countries: ["China", "Japan", "India", "South Korea", "Indonesia", "Philippines", "Vietnam", "Thailand", "Singapore", "Malaysia", "Pakistan", "Bangladesh", "Taiwan", "Hong Kong"] },
  { id: "middleeast", label: "Middle East", countries: ["Saudi Arabia", "UAE", "Israel", "Iran", "Iraq", "Qatar", "Kuwait", "Jordan", "Lebanon", "Bahrain", "Oman"] },
  { id: "oceania",    label: "Oceania",     countries: ["Australia", "New Zealand", "Fiji", "Papua New Guinea"] },
];
// Urgency: id + label + the slide-count it preselects + the recency window (days)
// the live pull leans toward. `slides` is a smart default the user can override.
export const URGENCY = [
  { id: "breaking",   label: "Breaking",   slides: 5,  days: 2 },
  { id: "developing", label: "Developing", slides: 8,  days: 7 },
  { id: "trending",   label: "Trending",   slides: 10, days: 30 },
];
export function regionById(id) { return REGIONS.find((r) => r.id === id) || REGIONS[0]; }
export function urgencyById(id) { return URGENCY.find((u) => u.id === id) || null; }

// ---- Advanced framing (Tier 3) ---------------------------------------------
// News Angle + Emphasis (from the monolith's NEWSDESK_ANGLES / NEWSDESK_EMPHASIS)
// and Enterprise Mode (distilled from its three prompt builders). {id, label,
// prompt}; the prompt is appended verbatim to the route block (generate.js).
// Surfaced inside the create screen's Advanced disclosure — lowest priority.
export const ANGLES = [
  { id: "neutral", label: "Neutral", prompt: "Report objectively — present all sides without editorial judgment." },
  { id: "critical", label: "Critical", prompt: "Take a critical stance — question official narratives and examine the power dynamics." },
  { id: "investigative", label: "Investigative", prompt: "Dig deeper — follow the money, the connections, and the motivations behind the story." },
];
export const EMPHASIS = [
  { id: "facts", label: "Facts-first", prompt: "Lead every slide with verified facts — maximise reporting, minimise analysis." },
  { id: "context", label: "Context-heavy", prompt: "Give deep context for every claim — connect the story to the larger pattern." },
  { id: "quotes", label: "Quote-driven", prompt: "Build it around direct quotes from key figures — every slide should carry a voice." },
];
export const MODES = [
  { id: "analysis", label: "Analysis", prompt: "Write a full analysis arc: the landscape, the force reshaping it, who wins and loses, the data, and the playbook." },
  { id: "news", label: "Business News", prompt: "Frame it as business news — what happened, who's affected, the numbers, and what to do about it." },
  { id: "tips", label: "Industry Tips", prompt: "Make it an actionable tips deck — each slide one specific, tactical move a business could run this week." },
];
export function framingPrompt(list, id) { const x = (list || []).find((y) => y.id === id); return x ? x.prompt : null; }

// Tier 2b: region-scope the live pull — keep items mentioning a country in the
// region (title or extract). Global / unknown → unchanged. Heuristic, so if the
// filter would gut the rail (< 3 left), keep the original rather than show empty.
export function filterByRegion(items, regionId) {
  const r = REGIONS.find((x) => x.id === regionId);
  if (!r || !r.countries.length) return (items || []).slice();
  const rx = new RegExp("\\b(" + r.countries.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b", "i");
  const hit = (items || []).filter((it) => rx.test(it.title || "") || rx.test(it.extract || ""));
  return hit.length >= 3 ? hit : (items || []).slice();
}

// Tier 2b: urgency recency — keep feed items dated within `days` of nowMs. Items
// without a parseable date (Wikipedia most-read has none) are kept. Broadens
// (returns all) if the window would leave too few. nowMs is passed in so this
// stays pure/testable.
export function filterByRecency(items, days, nowMs) {
  if (!days || !nowMs) return (items || []).slice();
  const cutoff = nowMs - days * 864e5;
  const within = (items || []).filter((it) => {
    const t = it && it.when ? Date.parse(it.when) : NaN;
    return isNaN(t) ? true : t >= cutoff;
  });
  return within.length >= 3 ? within : (items || []).slice();
}

// Wikipedia "featured" feed for a day carries the most-read articles. Keyless.
export function mostReadUrl(y, m, d) {
  const p2 = (n) => String(n).padStart(2, "0");
  return "https://en.wikipedia.org/api/rest_v1/feed/featured/" + y + "/" + p2(m) + "/" + p2(d);
}

function decodeEntities(s) {
  return String(s == null ? "" : s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")        // strip literal HTML tags
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    // Guardian entity-encodes its description HTML (&lt;p&gt;…), so the tags only
    // become real after the decode above — strip once more so the grounding seed
    // is clean prose, not "<p>…</p>". Letter-led so "a < b" comparisons survive.
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    .trim();
}

// Strip the trailing " | Site" / " - Site" suffix RSS titles often carry.
export function cleanTitle(s) {
  return decodeEntities(s).replace(/\s*[|–-]\s*(The Guardian|BBC|Variety|IndieWire|Pitchfork|Reuters)\s*$/i, "").trim();
}

// Condense a feed item's description/summary into a short factual seed (R5
// grounding): strip tags/entities and clamp to ~300 chars on a word boundary.
function trimExtract(s) {
  const t = decodeEntities(s)
    // Hacker News (hnrss) descriptions are boilerplate, not a summary — strip the
    // "Article URL: … Comments URL: … Points: N # Comments: N" scaffolding so the
    // R5 grounding seed is real prose (or empty), never link noise.
    .replace(/Article URL:\s*\S+/gi, "")
    .replace(/Comments URL:\s*\S+/gi, "")
    .replace(/Points:\s*\d+/gi, "")
    .replace(/#\s*Comments:\s*\d+/gi, "")
    .replace(/\s+/g, " ").trim();
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
  if (!best) {
    // Gossip feeds (JustJared / Page Six) carry the image as an <img> inside
    // content:encoded rather than media:content — grab the first one so the card
    // has a photo instead of a grey tile.
    const im = block.match(/<img[^>]*\bsrc=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
    if (im) best = im[1];
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
//
// WHOLE-WORD match (+ optional plural): the term must END on a word boundary, so
// a short term can't prefix-match a longer, unrelated word. Without the trailing
// boundary "tour" matched "tournament" — which dragged the FIFA World Cup into
// Music — and "AI" matched "air"/"aid". The leading \b + trailing (?:s|es)?\b
// still allows plurals ("albums", "bands") and possessives ("rapper's").
export function filterByTerms(items, terms) {
  if (!terms || !terms.length) return (items || []).slice();
  const rx = new RegExp("\\b(" + terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")(?:s|es)?\\b", "i");
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
//
// `hasFeeds` = whether the beat is CONFIGURED with RSS feeds (not whether any
// came back). It's the key to the off-topic bug: when a section beat's feed
// FAILS on the server (empty fetch), we must still know it's a section beat so
// we DON'T fall back to unfiltered general most-read — that's what put the World
// Cup under Music/Science. Without it, a feed-down section beat is
// indistinguishable from a genuinely feed-less curiosity beat.
const ENOUGH = 6; // a feed at least this rich stands alone — no most-read mixed in

export function selectTrending(rssItems, wikiItems, terms, max, hasFeeds, filterFeed) {
  const rss = rssItems || [], wiki = wikiItems || [];
  const hasTerms = !!(terms && terms.length);
  if (rss.length) {
    // Shared / sub-topic feeds (Enterprise sectors, Photography, Nightlife) are
    // term-FILTERED down to the beat; dedicated single-section feeds use the whole
    // feed (every item is already on-topic).
    const base = (filterFeed && hasTerms) ? filterByTerms(rss, terms) : rss;
    // A rich feed is the on-topic source on its own — do NOT mix general most-read
    // in, even term-matched. That mix is how 2026 films matching gossip terms
    // ("star"/"drama"/"romance") leaked into The Tea. Only a THIN feed borrows
    // term-matched most-read, then broadens to the full feed before giving up.
    if (base.length >= ENOUGH) return rankItems(base, [], max);
    const wikiF = hasTerms ? filterByTerms(wiki, terms) : [];
    let ranked = rankItems(base, wikiF, max);
    // Thin pull → broaden to the FULL feed, but only for a DEDICATED feed (every
    // item on-topic). A shared/filtered feed must NOT broaden back to the whole
    // section — that would re-admit the off-sector items the filter removed.
    if (ranked.length < 4 && !filterFeed) ranked = rankItems(rss, wikiF, max);
    return ranked;
  }
  // No feed items came back.
  if (hasFeeds) {
    // A SECTION beat whose feed failed or returned empty: stay on-topic via
    // term-matched most-read ONLY; NEVER leak unfiltered viral most-read. A
    // no-terms section beat returns empty (honest) rather than wrong — the panel
    // shows "type your own topic", and debug=1 surfaces the dead feed to fix.
    return hasTerms ? rankItems([], filterByTerms(wiki, terms), max) : [];
  }
  // A genuinely feed-less beat (Photography / Nightlife / Did You Know?):
  // most-read is the intended source — term-matched for the focused ones,
  // general curiosities for trivia (empty terms).
  return rankItems([], hasTerms ? filterByTerms(wiki, terms) : wiki, max);
}
