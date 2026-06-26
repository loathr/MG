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

export function wikidataClaimsUrl(qid) {
  return "https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=" +
    encodeURIComponent(String(qid == null ? "" : qid)) + "&property=P18&format=json&origin=*";
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
