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
  { key: "news_crime",       desk: "newsdesk", group: "Law & Society",    label: "Crime & Justice",   voice: "news", rss: [G("law"), G("uk-news"), G("us-news")], filterFeed: true, terms: ["crime", "police", "court", "trial", "prison", "justice", "investigation", "charges", "murder", "homicide", "shooting", "assault", "fraud", "arrest", "verdict", "sentencing", "lawsuit", "gang", "trafficking", "corruption", "prosecutor", "convicted", "indictment"] },
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
// The 8 angle-seeds — a story angle that steers generation, available for EVERY
// desk (surfaced in the create screen's Quick-start section). Resolves to a prompt
// string appended to the route block, same as Voice/Tone.
export const ANGLES = [
  { id: "neutral", label: "Neutral", hint: "report objectively, all sides", prompt: "Report objectively — present all sides without editorial judgment." },
  { id: "critical", label: "Critical", hint: "question the official narrative", prompt: "Take a critical stance — question official narratives and examine the power dynamics." },
  { id: "investigative", label: "Investigative", hint: "follow the money & motives", prompt: "Dig deeper — follow the money, the connections, and the motivations behind the story." },
  { id: "contrarian", label: "Contrarian", hint: "argue against the consensus", prompt: "Argue against the consensus — take the position most people won't, and defend it with evidence." },
  { id: "explainer", label: "Explainer", hint: "break it down, plainly", prompt: "Explain it plainly — break the topic into clear, simple steps a newcomer can follow." },
  { id: "data", label: "Data-driven", hint: "lead every slide with numbers", prompt: "Lead every slide with a number or hard datapoint — let the evidence carry the argument." },
  { id: "human", label: "Human story", hint: "through one person's eyes", prompt: "Tell it through one person's experience — a single human story that stands for the whole." },
  { id: "future", label: "Future-forward", hint: "where this is heading next", prompt: "Look ahead — where this is going next, and what it means for what comes after." },
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
  // Scope to the region whenever ANYTHING matches — only broaden to the full pool
  // when nothing does. (Was 3+, which made region a no-op on sparse feeds, so a
  // picked region appeared to do nothing; selectTrending's seed/most-read backfill
  // keeps the rail from going empty.)
  return hit.length ? hit : (items || []).slice();
}

// Sub-region drill-down: narrow the pull to a single COUNTRY (title or extract).
// Same rule — scope when anything matches, broaden only when nothing does.
export function filterByCountry(items, country) {
  if (!country) return (items || []).slice();
  const rx = new RegExp("\\b" + String(country).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
  const hit = (items || []).filter((it) => rx.test(it.title || "") || rx.test(it.extract || ""));
  return hit.length ? hit : (items || []).slice();
}

// The country list for a region id (the sub-region dropdown options).
export function countriesForRegion(regionId) {
  const r = REGIONS.find((x) => x.id === regionId);
  return r ? r.countries.slice() : [];
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

// Rank a beat's items by DEPTH & RICHNESS, not pictures: the freshest FEED items
// (recency) lead, then Wikipedia most-read (popularity) — and within that, items
// carrying a real summary/extract (richer, better generation grounding) come
// before bare-title ones. A thumbnail is NOT a ranking factor anymore (it's shown
// when present, but a placeholder-tile topic is no longer demoted below a thinner
// pictured one). Dedupe by normalized title; return the top `max`.
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
  const rich = (it) => it && it.extract && String(it.extract).trim().length > 0;
  (rssItems || []).filter(rich).forEach(push);   // freshest feed, with a summary
  (rssItems || []).forEach(push);                // remaining feed items
  (wikiItems || []).filter(rich).forEach(push);  // most-read, with a summary
  (wikiItems || []).forEach(push);               // remaining most-read
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

// Curated seeds (Enterprise sectors carry a `seeds: [...]` list) backfill a thin
// pull so a sector rail is never near-empty and generation always has concrete,
// on-sector topics to ground on. Seed cards carry no photo (source "seed") and are
// appended only to reach `max` after the live pull, deduped by title. Pure.
export function backfillSeeds(items, seeds, max) {
  const out = (items || []).slice();
  if (!seeds || !seeds.length) return out;
  const seen = new Set(out.map((it) => String(it.title || "").toLowerCase()));
  for (const s of seeds) {
    if (out.length >= (max || 6)) break;
    const k = String(s || "").toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push({ title: s, thumb: null, extract: "", source: "seed" });
  }
  return out;
}

export function selectTrending(rssItems, wikiItems, terms, max, hasFeeds, filterFeed, seeds) {
  const rss = rssItems || [], wiki = wikiItems || [];
  const hasTerms = !!(terms && terms.length);
  let out;
  if (rss.length) {
    // Shared / sub-topic feeds (Enterprise sectors, Photography, Nightlife) are
    // term-FILTERED down to the beat; dedicated single-section feeds use the whole
    // feed (every item is already on-topic).
    const base = (filterFeed && hasTerms) ? filterByTerms(rss, terms) : rss;
    if (base.length >= ENOUGH) {
      // A rich feed is the on-topic source on its own — do NOT mix general most-read
      // in, even term-matched (that mix leaked gossip-term films into The Tea).
      out = rankItems(base, [], max);
    } else {
      const wikiF = hasTerms ? filterByTerms(wiki, terms) : [];
      out = rankItems(base, wikiF, max);
      // Thin pull → broaden to the FULL feed, but only for a DEDICATED feed (every
      // item on-topic). A shared/filtered feed must NOT broaden back to the whole
      // section — that would re-admit the off-sector items the filter removed.
      if (out.length < 4 && !filterFeed) out = rankItems(rss, wikiF, max);
    }
  } else if (hasFeeds) {
    // A SECTION beat whose feed failed or returned empty: stay on-topic via
    // term-matched most-read ONLY; NEVER leak unfiltered viral most-read.
    out = hasTerms ? rankItems([], filterByTerms(wiki, terms), max) : [];
  } else {
    // A genuinely feed-less beat (Photography / Nightlife / Did You Know?):
    // most-read is the intended source — term-matched for the focused ones,
    // general curiosities for trivia (empty terms).
    out = rankItems([], hasTerms ? filterByTerms(wiki, terms) : wiki, max);
  }
  // Backfill from the beat's curated seeds when the live pull is thin (Enterprise).
  return backfillSeeds(out, seeds, max);
}

// ---------------------------------------------------------------------------
// Scoped sources — GDELT + Google News, paired, for narrow beat×region×country
// pulls. The Guardian/Wikipedia feeds can't be scoped at the source, so a narrow
// combo (e.g. Music × US) post-filters to noise. These two query-scope at the
// source instead: GDELT brings images (socialimage), Google News brings fresh
// in-region coverage; merged + deduped they cover each other's gaps.
// ---------------------------------------------------------------------------

// Geo hints for the major countries: gl/lang for Google News, FIPS for GDELT's
// sourcecountry. Unmapped countries still scope via the country-name KEYWORD in
// the query (geoHint → null), so every country works, just less precisely.
export const GEO_HINTS = {
  "United States": { gl: "US", lang: "en", gdelt: "US" },
  "United Kingdom": { gl: "GB", lang: "en", gdelt: "UK" },
  "Canada": { gl: "CA", lang: "en", gdelt: "CA" },
  "Australia": { gl: "AU", lang: "en", gdelt: "AS" },
  "New Zealand": { gl: "NZ", lang: "en", gdelt: "NZ" },
  "Ireland": { gl: "IE", lang: "en", gdelt: "EI" },
  "France": { gl: "FR", lang: "fr", gdelt: "FR" },
  "Germany": { gl: "DE", lang: "de", gdelt: "GM" },
  "Spain": { gl: "ES", lang: "es", gdelt: "SP" },
  "Italy": { gl: "IT", lang: "it", gdelt: "IT" },
  "Netherlands": { gl: "NL", lang: "nl", gdelt: "NL" },
  "India": { gl: "IN", lang: "en", gdelt: "IN" },
  "Japan": { gl: "JP", lang: "ja", gdelt: "JA" },
  "China": { gl: "CN", lang: "zh", gdelt: "CH" },
  "South Korea": { gl: "KR", lang: "ko", gdelt: "KS" },
  "Singapore": { gl: "SG", lang: "en", gdelt: "SN" },
  "Brazil": { gl: "BR", lang: "pt", gdelt: "BR" },
  "Mexico": { gl: "MX", lang: "es", gdelt: "MX" },
  "Nigeria": { gl: "NG", lang: "en", gdelt: "NI" },
  "South Africa": { gl: "ZA", lang: "en", gdelt: "SF" },
  "Kenya": { gl: "KE", lang: "en", gdelt: "KE" },
  "Egypt": { gl: "EG", lang: "en", gdelt: "EG" },
  "Saudi Arabia": { gl: "SA", lang: "en", gdelt: "SA" },
  "United Arab Emirates": { gl: "AE", lang: "en", gdelt: "AE" },
  "UAE": { gl: "AE", lang: "en", gdelt: "AE" },
  "Israel": { gl: "IL", lang: "en", gdelt: "IS" },
  // Widened so a region fan-out has more than three hinted hubs to rotate through
  // (Tier 2b #4) — every REGIONS member that has a Google-News edition + a GDELT
  // FIPS code. Unmapped countries still scope via the country-name keyword.
  "Argentina": { gl: "AR", lang: "es", gdelt: "AR" },
  "Colombia": { gl: "CO", lang: "es", gdelt: "CO" },
  "Chile": { gl: "CL", lang: "es", gdelt: "CI" },
  "Sweden": { gl: "SE", lang: "sv", gdelt: "SW" },
  "Poland": { gl: "PL", lang: "pl", gdelt: "PL" },
  "Ukraine": { gl: "UA", lang: "uk", gdelt: "UP" },
  "Switzerland": { gl: "CH", lang: "de", gdelt: "SZ" },
  "Belgium": { gl: "BE", lang: "nl", gdelt: "BE" },
  "Portugal": { gl: "PT", lang: "pt", gdelt: "PO" },
  "Greece": { gl: "GR", lang: "el", gdelt: "GR" },
  "Turkey": { gl: "TR", lang: "tr", gdelt: "TU" },
  "Ghana": { gl: "GH", lang: "en", gdelt: "GH" },
  "Ethiopia": { gl: "ET", lang: "en", gdelt: "ET" },
  "Morocco": { gl: "MA", lang: "fr", gdelt: "MO" },
  "Tanzania": { gl: "TZ", lang: "en", gdelt: "TZ" },
  "Indonesia": { gl: "ID", lang: "id", gdelt: "ID" },
  "Philippines": { gl: "PH", lang: "en", gdelt: "RP" },
  "Vietnam": { gl: "VN", lang: "vi", gdelt: "VM" },
  "Thailand": { gl: "TH", lang: "th", gdelt: "TH" },
  "Malaysia": { gl: "MY", lang: "en", gdelt: "MY" },
  "Pakistan": { gl: "PK", lang: "en", gdelt: "PK" },
  "Bangladesh": { gl: "BD", lang: "bn", gdelt: "BG" },
  "Taiwan": { gl: "TW", lang: "zh", gdelt: "TW" },
  "Hong Kong": { gl: "HK", lang: "zh", gdelt: "HK" },
  "Iran": { gl: "IR", lang: "fa", gdelt: "IR" },
  "Iraq": { gl: "IQ", lang: "ar", gdelt: "IZ" },
  "Qatar": { gl: "QA", lang: "ar", gdelt: "QA" },
  "Kuwait": { gl: "KW", lang: "ar", gdelt: "KU" },
  "Jordan": { gl: "JO", lang: "ar", gdelt: "JO" },
  "Lebanon": { gl: "LB", lang: "ar", gdelt: "LE" },
  "Bahrain": { gl: "BH", lang: "ar", gdelt: "BA" },
  "Oman": { gl: "OM", lang: "ar", gdelt: "MU" },
  "Fiji": { gl: "FJ", lang: "en", gdelt: "FJ" },
  "Papua New Guinea": { gl: "PG", lang: "en", gdelt: "PP" },
};
export function geoHint(country) { return (country && GEO_HINTS[country]) || null; }

// Reject obvious NON-photo images — site logos, sprites, favicons, blank/1x1
// placeholder OG images — so a card never shows a logo instead of a real photo
// (Tier 2b #6). GDELT's socialimage is an og:image, which is often exactly that.
// Heuristic on the URL; anything not clearly junk is kept. Pure.
export function isJunkImage(url) {
  if (!url || !/^https?:\/\//i.test(url)) return true;
  return /(logo|sprite|favicon|placeholder|default[-_.]?(img|image|thumb|avatar)?|blank|no[-_]?(image|photo|thumb)|avatar|1x1|pixel|spacer|missing)/i.test(url);
}

// The search query for the scoped sources: the beat's terms (OR-joined) or its
// label, plus the place (country or region name) as a keyword. Pure.
export function scopeQuery(terms, label, place) {
  const core = (terms && terms.length) ? terms.slice(0, 6).join(" OR ") : (label || "");
  const q = core ? "(" + core + ")" : "";
  return [q, place ? "\"" + place + "\"" : ""].filter(Boolean).join(" ").trim();
}

// Build the scoped-fetch PLAN for the paired sources (GDELT + Google News): a
// list of { label, query, hint } pulls. A COUNTRY → one geo-scoped pull with
// the country's hint and TERMS ONLY (the hint already scopes the place, so we
// don't also AND the country keyword and over-narrow). A REGION → fan OUT across
// its hinted member-country hubs for genuine in-region depth (capped to `max`,
// default 3). With more hinted hubs than the cap, a ROTATING window (offset)
// surfaces different countries across refreshes so a region isn't always the
// same three (Tier 2b #4). Unknown region / no hinted country → keyword-scope
// the region label. Neither place → a single terms/label query. Pure/testable.
export function scopedPlan(beat, regionId, country, max, offset) {
  const terms = (beat && beat.terms) || [];
  const label = (beat && beat.label) || "";
  const core = terms.length ? "(" + terms.slice(0, 6).join(" OR ") + ")" : label;
  const withPlace = (place) => [core, place ? "\"" + place + "\"" : ""].filter(Boolean).join(" ").trim();
  if (country) {
    const hint = geoHint(country);
    return [{ label: country, query: hint ? core : withPlace(country), hint }];
  }
  if (regionId && regionId !== "global") {
    const all = countriesForRegion(regionId).filter((c) => GEO_HINTS[c]);
    const hubs = rotateWindow(all, max || 3, offset);
    if (hubs.length) return hubs.map((c) => ({ label: c, query: core, hint: GEO_HINTS[c] }));
    const r = regionById(regionId);
    return [{ label: r.label, query: withPlace(r.label), hint: null }];
  }
  return core ? [{ label: "", query: core, hint: null }] : [];
}

// A window of up to `size` items from `arr`, starting at `offset` and wrapping —
// so successive offsets rotate which items are chosen. When the array fits in the
// window it's returned whole (order preserved). offset defaults to 0 (stable, so
// a normal cached load always picks the same hubs). Pure.
export function rotateWindow(arr, size, offset) {
  const a = arr || [];
  const n = a.length;
  const cap = Math.max(1, size | 0);
  if (n <= cap) return a.slice();
  const off = (((offset | 0) % n) + n) % n;
  const out = [];
  for (let i = 0; i < cap; i++) out.push(a[(off + i) % n]);
  return out;
}

export function googleNewsUrl(query, hint) {
  const gl = (hint && hint.gl) || "US";
  const lang = (hint && hint.lang) || "en";
  return "https://news.google.com/rss/search?q=" + encodeURIComponent(query)
    + "&hl=" + lang + "-" + gl + "&gl=" + gl + "&ceid=" + encodeURIComponent(gl + ":" + lang);
}

export function gdeltUrl(query, hint) {
  const q = query + (hint && hint.gdelt ? " sourcecountry:" + hint.gdelt : "");
  return "https://api.gdeltproject.org/api/v2/doc/doc?query=" + encodeURIComponent(q)
    + "&mode=ArtList&maxrecords=20&sort=DateDesc&format=json";
}

// GDELT seendate "20260629T123000Z" → ISO (for recency filtering/parity).
function gdeltDate(s) {
  const m = String(s || "").match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  return m ? m[1] + "-" + m[2] + "-" + m[3] + "T" + m[4] + ":" + m[5] + ":" + m[6] + "Z" : "";
}

// GDELT DOC ArtList JSON → items in the shared shape. Keeps only http(s) images.
export function parseGdelt(json, max) {
  const arts = (json && json.articles) || [];
  const out = [];
  for (const a of arts) {
    const title = cleanTitle(a.title || "");
    if (!title) continue;
    // Drop logo/placeholder og:images so a card shows a real photo or nothing (#6).
    const thumb = a.socialimage && !isJunkImage(a.socialimage) ? a.socialimage : null;
    out.push({ title, thumb, when: gdeltDate(a.seendate), extract: "", source: a.domain || "GDELT" });
    if (max && out.length >= max) break;
  }
  return out;
}

// Merge several item lists into one, deduped by normalized title, filling a missing
// thumb from a duplicate that has one. Depth/richness over pictures: INSERTION
// ORDER is preserved (the caller passes lists in priority order — scoped/in-region
// then base, feed-recency within each), so a thumbnail no longer reorders the rail.
// This is why a scoped region rail now leads with its in-region items even though
// Google News RSS carries no images. Pure.
export function mergeSources(lists, max) {
  const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const order = [];
  const byKey = new Map();
  for (const list of lists) {
    for (const it of (list || [])) {
      const k = norm(it.title);
      if (!k) continue;
      const prev = byKey.get(k);
      if (!prev) { byKey.set(k, Object.assign({}, it)); order.push(k); }
      else if (!prev.thumb && it.thumb) prev.thumb = it.thumb;
    }
  }
  return (max ? order.slice(0, max) : order).map((k) => byKey.get(k));
}
