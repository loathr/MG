// Entity → real photo resolution (#6). When a generated slide names a specific
// person / place / org / work, generation emits an `entity` (+ `entityType`);
// the image route resolves it to a genuine, globally-sourced, openly-licensed
// photo from Wikipedia / Wikidata BEFORE falling back to keyword stock search.
// That's the fix for non-Western and celebrity accuracy that stock catalogs miss.
//
// Keyless and global — Wikipedia REST + Wikidata need no API key. This module is
// the PURE half (URL builders + response parsers), unit-tested with mock
// payloads; the network fetches live in app/api/images/route.js. Every returned
// image is sized to ~1280px wide via the MediaWiki thumbnailer, so an entity
// background carries the same FLAT-LAYERS §3 decode budget as a stock photo —
// never a multi-thousand-pixel original.

const THUMB_W = 1280;

// Wikipedia REST summary endpoint for a title. Follows redirects to the primary
// article, so a bare proper name usually lands on the right entity.
export function summaryUrl(name) {
  return "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(String(name == null ? "" : name).trim());
}

export function wikidataSearchUrl(name) {
  return "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" +
    encodeURIComponent(String(name == null ? "" : name).trim()) +
    "&language=en&format=json&limit=1&origin=*";
}

// ALL claims for the entity in one call. We deliberately DON'T filter by property:
// wbgetclaims' `property` param takes a single id, so "P18|P373" is invalid and
// returned nothing (the people-gallery regression). Fetching all claims returns
// them keyed by property at `json.claims`, so imageFromClaims (P18) and
// commonsCategoryFromClaims (P373) both read what they need. A claim set is small.
export function wikidataClaimsUrl(qid) {
  return "https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=" +
    encodeURIComponent(String(qid == null ? "" : qid)) + "&format=json&origin=*";
}

// The P373 (Commons category) claim → the category title (e.g. "Serena Williams"),
// or null. That category is a curated gallery of real, openly-licensed photos of
// the subject — the fix for a person search returning only generic stock. Pure.
export function commonsCategoryFromClaims(json) {
  const p373 = json && json.claims && json.claims.P373;
  const snak = p373 && p373[0] && p373[0].mainsnak;
  const cat = snak && snak.datavalue && snak.datavalue.value;
  return cat && typeof cat === "string" ? cat.trim() : null;
}

// MediaWiki API URL listing the FILE members of a Commons category, each with a
// ~400px thumb (grid-light; upsized to 1280 for the picked url). Keyless.
export function commonsCategoryMembersUrl(category, limit) {
  const cat = String(category == null ? "" : category).replace(/^Category:/i, "").trim();
  return "https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=" +
    encodeURIComponent("Category:" + cat) +
    "&gcmtype=file&gcmlimit=" + (limit || 24) +
    "&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=400&format=json&origin=*";
}

// Parse a categorymembers imageinfo response into gallery items {url, thumb, alt,
// credit, source:"Commons"}. Keeps only real raster photos (jpg/png/webp) — drops
// SVG logos, PDFs, and audio the category may also contain. Pure.
export function parseCommonsCategoryMembers(json, max) {
  const pages = json && json.query && json.query.pages ? json.query.pages : {};
  const out = [];
  for (const page of Object.values(pages)) {
    const info = page && page.imageinfo && page.imageinfo[0];
    const thumb = info && info.thumburl;
    if (!thumb || !/\.(jpg|jpeg|png|webp)(\?|$)/i.test(thumb)) continue;
    const meta = (info && info.extmetadata) || {};
    out.push({
      url: upsizeWikiThumb(thumb, THUMB_W) || thumb,
      thumb,
      alt: (page.title || "").replace(/^File:/i, "").replace(/\.[a-z]+$/i, ""),
      credit: meta.Artist ? String(meta.Artist.value).replace(/<[^>]*>/g, "").slice(0, 40) : "Wikimedia Commons",
      source: "Commons",
    });
    if (max && out.length >= max) break;
  }
  return out;
}

// The Wikipedia REST media-list for an article title — every image used ON the
// page (beyond the single lead portrait), so a person returns a fuller gallery of
// genuine photos. Keyless.
export function mediaListUrl(title) {
  return "https://en.wikipedia.org/api/rest_v1/page/media-list/" +
    encodeURIComponent(String(title == null ? "" : title).trim());
}

// Parse a media-list response into gallery items {url, thumb, alt, credit,
// source:"Commons"}. Keeps only raster IMAGE items (drops icons/audio/video/svg),
// takes the largest srcset entry, and normalises the protocol-relative URL. Pure.
export function parseMediaList(json, max) {
  const items = (json && json.items) || [];
  const out = [];
  for (const it of items) {
    if (!it || it.type !== "image") continue;
    const set = (it.srcset || []);
    let src = set.length ? set[set.length - 1].src : null; // srcset ascends 1x→2x
    if (!src) continue;
    if (src.indexOf("//") === 0) src = "https:" + src;
    if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(src)) continue; // skip svg/icons
    out.push({
      url: upsizeWikiThumb(src, THUMB_W) || src,
      thumb: src,
      alt: String(it.title || "").replace(/^File:/i, "").replace(/\.[a-z]+$/i, ""),
      credit: "Wikimedia Commons",
      source: "Commons",
    });
    if (max && out.length >= max) break;
  }
  return out;
}

// Commons "depicts" (P180) search: files STRUCTURALLY TAGGED as depicting the
// Wikidata QID — real photos of the subject beyond their own category (a photo
// filed elsewhere but tagged "depicts Serena Williams" still surfaces). Keyless
// CirrusSearch over the file namespace, with imageinfo for a ~400px thumb.
export function commonsDepictsUrl(qid, limit) {
  const id = String(qid == null ? "" : qid).trim();
  return "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    "&gsrsearch=" + encodeURIComponent("haswbstatement:P180=" + id) +
    "&gsrnamespace=6&gsrlimit=" + (limit || 20) +
    "&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=400&format=json&origin=*";
}

// Parse a Commons generator=search imageinfo response into gallery items {url,
// thumb, alt, credit, source:"Commons"}. Same shape/filters as the category
// parser (raster photos only). Pure.
export function parseCommonsSearch(json, max) {
  const pages = json && json.query && json.query.pages ? json.query.pages : {};
  const out = [];
  for (const page of Object.values(pages)) {
    const info = page && page.imageinfo && page.imageinfo[0];
    const thumb = info && info.thumburl;
    if (!thumb || !/\.(jpg|jpeg|png|webp)(\?|$)/i.test(thumb)) continue;
    const meta = (info && info.extmetadata) || {};
    out.push({
      url: upsizeWikiThumb(thumb, THUMB_W) || thumb,
      thumb,
      alt: String(page.title || "").replace(/^File:/i, "").replace(/\.[a-z]+$/i, ""),
      credit: meta.Artist ? String(meta.Artist.value).replace(/<[^>]*>/g, "").slice(0, 40) : "Wikimedia Commons",
      source: "Commons",
    });
    if (max && out.length >= max) break;
  }
  return out;
}

// Sources that are GENUINE photos of the subject (real people/places) vs generic
// stock. Drives result ranking (real first) and the panel's source badge. Pure.
const REAL_SOURCES = { Wikipedia: "wiki", Wikidata: "wiki", Commons: "commons" };
export function sourceKind(source) {
  return REAL_SOURCES[source] || "stock";
}

// Heuristic: does the query look like a proper noun (a named person/place/org) —
// so it's worth the keyless Wikipedia/Wikidata round-trip? Capitalised, 1-4 words,
// not an obviously lowercase common-noun search ("sunset", "city skyline"). Errs
// toward trying entity resolution for any capitalised query. Pure.
export function looksLikeProperNoun(query) {
  const s = String(query == null ? "" : query).trim();
  if (!s || s.length > 60) return false;
  const words = s.split(/\s+/);
  if (words.length < 1 || words.length > 4) return false;
  const caps = words.filter((w) => /^[A-Z]/.test(w)).length;
  return caps >= 1 && caps >= Math.ceil(words.length / 2);
}

// Whether a query is worth a Wikipedia lookup — CASE-INSENSITIVE, because search
// boxes are usually typed lowercase ("serena williams", "trump"), which the
// capitalised looksLikeProperNoun missed (people search only returned stock). Any
// short 1-4 word query qualifies; the resolver then cheaply short-circuits when the
// summary doesn't resolve to a real article, so a generic "startup office" pays
// only one fast fetch. Pure.
export function entityCandidate(query) {
  const s = String(query == null ? "" : query).trim();
  if (!s || s.length > 50) return false;
  if (/^\d+$/.test(s)) return false; // pure numbers aren't entities
  const words = s.split(/\s+/);
  return words.length >= 1 && words.length <= 4;
}

// A MediaWiki/Commons thumbnail URL embeds its rendered width as "/NNNpx-".
// Rewriting that requests a different size from the same thumbnailer. Returns
// null when the URL isn't a thumb form (caller falls back to FilePath).
export function upsizeWikiThumb(url, width) {
  if (!url) return null;
  return /\/\d+px-/.test(url) ? url.replace(/\/\d+px-/, "/" + (width || THUMB_W) + "px-") : null;
}

// Special:FilePath?width=N returns a width-capped thumbnail of a Commons file —
// the §3-safe way to size a raw P18 filename or a full-res original.
export function commonsFilePathUrl(filename, width) {
  if (!filename) return null;
  const f = String(filename).replace(/^File:/i, "").trim().replace(/\s+/g, "_");
  if (!f) return null;
  return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(f) + "?width=" + (width || THUMB_W);
}

// Pull a ~1280px image URL out of a Wikipedia REST summary response, or null.
// Disambiguation pages (and imageless articles) yield null so the caller can try
// Wikidata next.
export function imageFromSummary(json) {
  if (!json || json.type === "disambiguation") return null;
  const thumb = json.thumbnail && json.thumbnail.source;
  if (thumb) return upsizeWikiThumb(thumb, THUMB_W) || thumb;
  const orig = json.originalimage && json.originalimage.source;
  if (orig) {
    const fname = orig.split("?")[0].split("/").pop();
    return commonsFilePathUrl(decodeURIComponent(fname), THUMB_W) || orig;
  }
  return null;
}

// The top Wikidata search hit's Q-id, or null.
export function wikidataId(json) {
  const s = json && json.search;
  return s && s[0] && s[0].id ? s[0].id : null;
}

// The P18 (image) claim of a Wikidata entity → a width-capped Commons URL, or null.
export function imageFromClaims(json) {
  const p18 = json && json.claims && json.claims.P18;
  const snak = p18 && p18[0] && p18[0].mainsnak;
  const fname = snak && snak.datavalue && snak.datavalue.value;
  return commonsFilePathUrl(fname, THUMB_W);
}

// Normalize a slide's entity fields into { name, type } or null. Tolerates the
// legacy `person` field and trims/levels the type to the four we resolve.
const ENTITY_TYPES = { person: 1, place: 1, org: 1, work: 1 };
export function slideEntity(slide) {
  const name = slide && (slide.entity || slide.person);
  if (!name || typeof name !== "string" || !name.trim()) return null;
  let type = slide && typeof slide.entityType === "string" ? slide.entityType.toLowerCase().trim() : "";
  if (!ENTITY_TYPES[type]) type = "";
  return { name: name.trim(), type };
}
