import { NextResponse } from "next/server";
import { summaryUrl, wikidataSearchUrl, wikidataClaimsUrl, imageFromSummary, wikidataId, imageFromClaims, slideEntity, commonsCategoryFromClaims, commonsCategoryMembersUrl, parseCommonsCategoryMembers, looksLikeProperNoun, mediaListUrl, parseMediaList } from "../../studio/entity";
import { rankStock, interleave } from "../../studio/imagesearch";

// Image search runs server-side because doing 10-30 sequential Unsplash/Pexels
// calls from the browser kept killing the renderer process on flaky networks —
// each failed fetch leaves browser-internal cleanup state, and accumulated
// state was tipping the tab over. Server-side has a clean, stable network
// stack and never accumulates that browser-internal state.
//
// 60s is plenty here — even on a bad day the pipeline finishes in <10s.
export const maxDuration = 60;

// --- API keys (server-side ONLY) ---
// Non-public env names only: NEXT_PUBLIC_* vars are inlined into the client
// bundle by Next, which would leak these provider keys to the browser. This route
// runs only on the server, so the keys never need to be public. (Deploy must set
// UNSPLASH_KEY / PEXELS_KEY / PIXABAY_KEY — see the deploy guide.)
const UNSPLASH_KEY = process.env.UNSPLASH_KEY || "";
const PEXELS_KEY = process.env.PEXELS_KEY || "";
const PIXABAY_KEY = process.env.PIXABAY_KEY || "";

// --- fetch helper with AbortController-backed timeout ---
const fetchWithTimeout = (url, opts, ms) => {
  if (typeof opts === "number") { ms = opts; opts = undefined; }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms || 5000);
  const finalOpts = Object.assign({}, opts || {}, { signal: controller.signal });
  return fetch(url, finalOpts)
    .then((r) => { clearTimeout(timer); return r; })
    .catch((e) => { clearTimeout(timer); throw e; });
};

// --- search functions ---

// Cap an Unsplash image to <=1280x1600 (FLAT-LAYERS §3). Unsplash serves imgix
// URLs; `urls.raw` is the param-less base we append sizing to (`full`/`regular`
// already embed a width, so prefer `raw`). A 1280x1600 JPEG decodes to ~8MB of
// native bitmap; an uncapped `full` (often 4000px+) decodes to ~90MB — the exact
// native/GPU cost that killed the old app. Capping here makes the route's stated
// "<=1280x1600" guarantee true for Unsplash too, not just Pexels.
const capUnsplash = (urls) => {
  const base = urls && (urls.raw || urls.full || urls.regular);
  if (!base) return null;
  const sep = base.indexOf("?") >= 0 ? "&" : "?";
  return base + sep + "w=1280&h=1600&fit=crop&q=70&fm=jpg";
};

const searchUnsplash = async (query, page) => {
  if (!UNSPLASH_KEY) return [];
  try {
    const r = await fetchWithTimeout(
      "https://api.unsplash.com/search/photos?query=" + encodeURIComponent(query) + "&per_page=10&page=" + (page || 1) + "&orientation=portrait",
      { headers: { Authorization: "Client-ID " + UNSPLASH_KEY } },
      8000,
    );
    if (!r.ok) return [];
    const d = await r.json();
    return (d.results || []).filter(Boolean).map((img) => ({
      url: capUnsplash(img.urls),
      thumb: img.urls ? img.urls.small : null,
      alt: img.alt_description || query,
      credit: img.user ? img.user.name : "",
      source: "Unsplash",
    }));
  } catch (e) { return []; }
};

const searchPexels = async (query, page) => {
  if (!PEXELS_KEY) return [];
  try {
    const r = await fetchWithTimeout(
      "https://api.pexels.com/v1/search?query=" + encodeURIComponent(query) + "&per_page=10&page=" + (page || 1) + "&orientation=portrait",
      { headers: { Authorization: PEXELS_KEY } },
      8000,
    );
    if (!r.ok) return [];
    const d = await r.json();
    return (d.photos || []).filter(Boolean).map((img) => {
      // Cap the served image to slide-ish dimensions. Pexels supports on-the-fly
      // resizing via query params, so we never hand the browser a multi-thousand-
      // pixel `original`. That original was the real crash cause: a 4000x6000 JPEG
      // decodes to ~96MB of *native/GPU* bitmap memory (invisible to the JS heap,
      // which stayed flat at ~5MB in the crash traces); 9 of them on a carousel
      // blew past the device's compositor budget and the OS killed the tab. At
      // 1280x1600 each image decodes to ~8MB — and 1280px still meets the export
      // pipeline's stated "~1280px" sharpness target, so quality is unaffected.
      const raw = img.src ? (img.src.original || img.src.large2x || img.src.large) : null;
      const url = raw ? raw.split("?")[0] + "?auto=compress&cs=tinysrgb&fit=crop&w=1280&h=1600" : null;
      return {
      url,
      thumb: img.src ? img.src.medium : null,
      alt: query,
      credit: img.photographer || "",
      source: "Pexels",
      };
    });
  } catch (e) { return []; }
};

const searchWikiCommons = async (query) => {
  try {
    const r = await fetchWithTimeout(
      "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" + encodeURIComponent(query) + "&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1280&format=json",
      6000,
    );
    if (!r.ok) return [];
    const d = await r.json();
    const pages = d.query && d.query.pages ? d.query.pages : {};
    const results = [];
    Object.values(pages).forEach((page) => {
      const info = page.imageinfo && page.imageinfo[0];
      if (info && info.thumburl && /\.(jpg|jpeg|png|webp)/i.test(info.thumburl)) {
        const meta = info.extmetadata || {};
        results.push({
          url: info.thumburl,
          thumb: info.thumburl,
          alt: meta.ObjectName ? meta.ObjectName.value : query,
          credit: meta.Artist ? meta.Artist.value.replace(/<[^>]*>/g, "").slice(0, 40) : "Wikimedia Commons",
          source: "Commons",
        });
      }
    });
    return results.slice(0, 5);
  } catch (e) { return []; }
};

// Entity-first resolution (#6): a genuine, openly-licensed photo of a SPECIFIC
// named person/place/org/work from Wikipedia, then Wikidata P18 — keyless and
// global, so it covers the names stock catalogs return generic or Western-skewed
// results for. Every URL is width-capped to ~1280px by the MediaWiki thumbnailer
// (FLAT-LAYERS §3). Best-effort: any miss returns null and the caller falls back
// to keyword stock search. Pure URL building + parsing live in studio/entity.js.
const resolveEntity = async (name) => {
  if (!name) return null;
  try {
    const r = await fetchWithTimeout(summaryUrl(name), { headers: { Accept: "application/json" } }, 6000);
    if (r.ok) {
      const url = imageFromSummary(await r.json());
      if (url) return { url, thumb: url, alt: name, credit: "Wikipedia", source: "Wikipedia" };
    }
  } catch (e) { /* fall through to Wikidata */ }
  try {
    const sr = await fetchWithTimeout(wikidataSearchUrl(name), 6000);
    if (sr.ok) {
      const qid = wikidataId(await sr.json());
      if (qid) {
        const cr = await fetchWithTimeout(wikidataClaimsUrl(qid), 6000);
        if (cr.ok) {
          const url = imageFromClaims(await cr.json());
          if (url) return { url, thumb: url, alt: name, credit: "Wikimedia Commons", source: "Wikidata" };
        }
      }
    }
  } catch (e) { /* give up; keyword search covers it */ }
  return null;
};

const searchPixabay = async (query, page) => {
  if (!PIXABAY_KEY) return [];
  try {
    const r = await fetchWithTimeout(
      "https://pixabay.com/api/?key=" + PIXABAY_KEY + "&q=" + encodeURIComponent(query) + "&image_type=photo&orientation=vertical&per_page=10&page=" + (page || 1) + "&safesearch=true",
      5000,
    );
    if (!r.ok) return [];
    const d = await r.json();
    return (d.hits || []).filter(Boolean).slice(0, 5).map((img) => ({
      url: img.largeImageURL || img.webformatURL,
      thumb: img.previewURL || img.webformatURL,
      alt: img.tags || query,
      credit: img.user || "Pixabay",
      source: "Pixabay",
    }));
  } catch (e) { return []; }
};

// --- helpers (mirrored from LoathrMediaGenerator.jsx) ---
const STOP_WORDS = {
  the: 1, a: 1, an: 1, of: 1, in: 1, on: 1, at: 1, to: 1, for: 1, and: 1, or: 1, but: 1,
  is: 1, are: 1, was: 1, were: 1, be: 1, been: 1, being: 1, this: 1, that: 1, these: 1, those: 1,
  with: 1, from: 1, by: 1, as: 1, it: 1, its: 1, they: 1, them: 1, their: 1, what: 1, which: 1,
  how: 1, why: 1, when: 1, where: 1, who: 1, all: 1, any: 1, more: 1, most: 1, some: 1, such: 1,
};

const extractKeywords = (text, max) => {
  if (!text) return "";
  return text.replace(/[^\w\s'-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS[w.toLowerCase()])
    .slice(0, max || 3)
    .join(" ");
};

const getSlideImageQuery = (slide, categoryLabel, topic) => {
  const ent = slideEntity(slide);
  if (ent) return ent.name + " " + extractKeywords(topic, 2);
  const heading = slide.heading || slide.title || slide.name || slide.headline || "";
  const body = slide.body || slide.leadParagraph || "";
  const headKw = heading.length > 3 ? extractKeywords(heading, 3) : "";
  const bodyKw = body.length > 10 ? extractKeywords(body, 2) : "";
  const topicKw = extractKeywords(topic, 2);
  const combined = (topicKw + " " + headKw + " " + bodyKw).trim().split(/\s+/).slice(0, 4).join(" ");
  if (combined.length > 5) return combined;
  return (topicKw + " " + extractKeywords(heading || categoryLabel, 2)).trim();
};

const normalizeImgUrl = (url) => {
  if (!url) return "";
  const u = url.split("?")[0].split("#")[0];
  const wikiThumb = u.match(/\/thumb\/(.+?)\/\d+px-/);
  if (wikiThumb) return wikiThumb[1];
  const unsplashId = u.match(/unsplash\.com\/photos?\/([\w-]+)/);
  if (unsplashId) return "unsplash:" + unsplashId[1];
  return u;
};

// --- main pipeline ---
async function runImagePipeline(body) {
  const slides = Array.isArray(body.slides) ? body.slides : [];
  const topic = (body.topic || "").trim();
  const category = body.category || "";
  const categoryLabel = body.categoryLabel || "";
  const coverPrefix = body.coverPrefix || "";
  const lockedSlots = body.lockedSlots || {}; // { slideIndex: true } — skip these, browser placed them
  const wantMosaic = body.wantMosaic !== false;

  const imgMap = {};
  const trace = [];
  const tr = (msg) => trace.push(msg);

  // 0. Entity-first pass (#6): resolve any slide that names a specific
  // person/place/org/work to a real Wikipedia/Wikidata photo before keyword
  // stock search. Populating imgMap here means the markUsed sweep (below)
  // dedupes them and the keyword steps skip slots already filled.
  for (let ei = 0; ei < slides.length; ei++) {
    if (lockedSlots[ei]) continue;
    const ent = slideEntity(slides[ei]);
    if (!ent) continue;
    const eimg = await resolveEntity(ent.name);
    if (eimg) { imgMap[ei] = eimg; tr("slide " + ei + ": entity '" + ent.name + "' -> " + eimg.source); }
  }

  // 1. Main topic search for cover + closer
  const shortTopic = topic.length > 80 ? topic.slice(0, 80) : topic;
  const topicTokens = shortTopic.split(/\s+/).filter(Boolean);
  const coverContext = (coverPrefix + (categoryLabel ? categoryLabel + " " : "")).trim();
  const coverTopic = topicTokens.join(" ") || topic;
  const mainQuery = (coverContext + " " + coverTopic).trim();
  tr("main query: " + mainQuery);

  let mainImgs = [];
  if (mainQuery) mainImgs = await searchUnsplash(mainQuery);
  if (mainImgs.length === 0 && topicTokens.length > 1) {
    const fallbackQuery = (coverContext + " " + topicTokens.slice(0, -1).join(" ")).trim();
    mainImgs = await searchUnsplash(fallbackQuery);
    tr("main fallback (dropped last token): " + mainImgs.length + " results");
  }
  if (mainImgs.length === 0 && coverContext) {
    mainImgs = await searchUnsplash(coverContext);
    tr("main fallback (category only): " + mainImgs.length + " results");
  }
  if (mainImgs.length === 0 && mainQuery) {
    mainImgs = await searchPexels(mainQuery);
    tr("main fallback (pexels): " + mainImgs.length + " results");
  }
  tr("mainImgs total: " + mainImgs.length);

  // 2. Place cover + closer from mainImgs (unless browser-locked or already
  // filled by the entity pass).
  if (mainImgs.length > 0 && !lockedSlots[0] && !imgMap[0]) imgMap[0] = mainImgs[0];
  const closerIdx = slides.length ? slides.length - 1 : 9;
  if (!lockedSlots[closerIdx] && !imgMap[closerIdx]) {
    if (mainImgs.length > 2) imgMap[closerIdx] = mainImgs[2];
    else if (mainImgs.length > 1) imgMap[closerIdx] = mainImgs[1];
  }

  // 3. Used-URL tracker
  const usedUrls = {};
  const markUsed = (img) => {
    if (!img) return;
    if (img.url) { usedUrls[img.url] = true; usedUrls[normalizeImgUrl(img.url)] = true; }
    if (img.thumb) { usedUrls[img.thumb] = true; usedUrls[normalizeImgUrl(img.thumb)] = true; }
  };
  Object.values(imgMap).forEach(markUsed);

  const pickUnique = (results) => {
    if (!Array.isArray(results)) return null;
    for (const img of results) {
      if (!img || !img.url) continue;
      const norm = normalizeImgUrl(img.url);
      const normThumb = img.thumb ? normalizeImgUrl(img.thumb) : "";
      if (usedUrls[img.url] || usedUrls[norm] || (img.thumb && usedUrls[img.thumb]) || (normThumb && usedUrls[normThumb])) continue;
      markUsed(img);
      return img;
    }
    return null;
  };

  // 4. Per-slide loop. Server-side is reliable enough that we don't need the
  // circuit breaker — even if some fetches fail, they don't accumulate state
  // that takes down the process. Each iteration is independent.
  for (let ps = 1; ps < Math.min(slides.length - 1, 12); ps++) {
    if (lockedSlots[ps]) { tr("slide " + ps + ": locked by browser, skipping"); continue; }
    if (imgMap[ps]) continue; // already placed by the entity pass
    const slideData = slides[ps] || {};
    const sq = getSlideImageQuery(slideData, categoryLabel, topic);
    let sr = await searchUnsplash(sq);
    if (sr.length === 0 && sq !== topic) {
      // Soft-query retry with just topic
      sr = await searchUnsplash(topic);
      tr("slide " + ps + ": soft retry " + sr.length + " results");
    }
    const sPick = pickUnique(sr);
    if (sPick) { imgMap[ps] = sPick; tr("slide " + ps + ": got own image"); }
    else {
      const mPick = pickUnique(mainImgs);
      if (mPick) { imgMap[ps] = mPick; tr("slide " + ps + ": fell back to main"); }
      else { tr("slide " + ps + ": NO IMAGE"); }
    }
  }

  // 5. Mosaic extras
  const mosaicSlides = {};
  let mosaicExtras = [];
  const mosaicFlagged = slides.filter((s) => s && s.mosaic).length;
  const totalLoaded = Object.keys(imgMap).length;

  if (wantMosaic && (mosaicFlagged > 0 || totalLoaded >= 3)) {
    const mosaicNeed = Math.max(mosaicFlagged, 2) * 3;
    const extraUsed = {};
    Object.values(imgMap).forEach((img) => {
      if (img && img.url) { extraUsed[img.url] = true; extraUsed[normalizeImgUrl(img.url)] = true; }
    });

    const mosaicBase = shortTopic + " " + categoryLabel;
    let mExtra = [];
    mExtra = mExtra.concat(await searchUnsplash(mosaicBase + " abstract editorial"));
    mExtra = mExtra.concat(await searchPexels(shortTopic + " industry workplace"));
    mExtra = mExtra.concat(await searchWikiCommons(shortTopic + " business"));
    mExtra = mExtra.concat(await searchPixabay(mosaicBase));
    if (mExtra.length < mosaicNeed) {
      mExtra = mExtra.concat(await searchUnsplash(shortTopic + " technology modern"));
      mExtra = mExtra.concat(await searchWikiCommons(mosaicBase + " industry"));
    }

    mExtra.forEach((img) => {
      if (img && img.url && !extraUsed[img.url] && !extraUsed[normalizeImgUrl(img.url)] && mosaicExtras.length < mosaicNeed) {
        mosaicExtras.push(img.url);
        extraUsed[img.url] = true;
        extraUsed[normalizeImgUrl(img.url)] = true;
      }
    });
    tr("mosaic extras: " + mosaicExtras.length + " unique");

    if (totalLoaded >= 3) {
      const mosaicGlobalUsed = {};
      Object.values(imgMap).forEach((img) => {
        if (img && img.url) { mosaicGlobalUsed[img.url] = true; mosaicGlobalUsed[normalizeImgUrl(img.url)] = true; }
      });
      slides.forEach((s, si) => {
        if (s && s.mosaic && si > 0 && si < slides.length - 1) {
          const mUrls = [];
          const mUsed = Object.assign({}, mosaicGlobalUsed);
          if (imgMap[si] && imgMap[si].url && !mUsed[imgMap[si].url]) {
            mUrls.push(imgMap[si].url);
            mUsed[imgMap[si].url] = true;
          }
          for (let me = 0; me < mosaicExtras.length && mUrls.length < 4; me++) {
            const eu = mosaicExtras[me];
            if (eu && !mUsed[eu] && !mUsed[normalizeImgUrl(eu)]) {
              mUrls.push(eu);
              mUsed[eu] = true;
              mUsed[normalizeImgUrl(eu)] = true;
            }
          }
          if (mUrls.length < 4) {
            const keys = Object.keys(imgMap);
            for (let mk = 0; mk < keys.length && mUrls.length < 4; mk++) {
              const mimg = imgMap[keys[mk]];
              if (mimg && mimg.url && !mUsed[mimg.url] && !mUsed[normalizeImgUrl(mimg.url)] && Math.abs(parseInt(keys[mk]) - si) > 2) {
                mUrls.push(mimg.url);
                mUsed[mimg.url] = true;
              }
            }
          }
          if (mUrls.length >= 2) {
            mosaicSlides[si] = mUrls;
            mUrls.forEach((u) => { mosaicGlobalUsed[u] = true; mosaicGlobalUsed[normalizeImgUrl(u)] = true; });
          }
        }
      });
    }

    // Auto-assign mosaic for Enterprise (B&W layouts benefit from collage variety)
    if (category === "enterprise") {
      const contentSlideCount = Math.max(slides.length - 2, 1);
      const targetMosaic = Math.max(Math.round(contentSlideCount * 0.3), 1);
      const currentMosaic = Object.keys(mosaicSlides).length;
      if (currentMosaic < targetMosaic && totalLoaded >= 3) {
        slides.forEach((s, si) => {
          if (Object.keys(mosaicSlides).length >= targetMosaic) return;
          if (si <= 0 || si >= slides.length - 1) return;
          if (mosaicSlides[si]) return;
          if (s.statFormat || s.stat || s.stats || s.before || s.leftStat || s.quote) return;
          // Inline getMosaicImgs equivalent — pick 2 non-adjacent images
          const mUrls = [];
          if (imgMap[si] && imgMap[si].url) mUrls.push(imgMap[si].url);
          const keys = Object.keys(imgMap);
          for (let i = 0; i < keys.length && mUrls.length < 2; i++) {
            const ki = parseInt(keys[i]);
            const img = imgMap[ki];
            if (img && img.url && Math.abs(ki - si) > 2 && mUrls.indexOf(img.url) === -1) mUrls.push(img.url);
          }
          if (mUrls.length >= 2) mosaicSlides[si] = mUrls;
        });
      }
    }
  }

  return {
    imgMap,
    mosaicSlides,
    mosaicExtras,
    summary: {
      totalImages: Object.keys(imgMap).length,
      mosaicCount: Object.keys(mosaicSlides).length,
      mainImgsCount: mainImgs.length,
      keysConfigured: {
        unsplash: !!UNSPLASH_KEY,
        pexels: !!PEXELS_KEY,
        pixabay: !!PIXABAY_KEY,
      },
    },
    trace,
  };
}

// --- flat free-text search for the Studio Photos panel ---
// Returns a deduped, source-mixed list of portrait photos. Every `url` is
// pre-capped to <=1280x1600 (FLAT-LAYERS §3) so setting one as a slide
// background can never reintroduce the multi-thousand-pixel decode that took the
// old app down. `thumb` is a small image used by the search grid itself, so the
// panel stays light even with 30 results on screen.
// Entity-first gallery for a PERSON/place query: the real Wikipedia portrait, the
// Wikidata P18 image, and the subject's Commons category (P373) — a set of genuine,
// openly-licensed photos of the actual subject. Keyless. Best-effort: any miss just
// yields fewer real photos and the caller falls back to stock. Order = portrait
// first, then the gallery.
async function resolveEntityGallery(name) {
  const out = [];
  let title = name; // canonical article title (summary redirects a bare name to it)
  try {
    const r = await fetchWithTimeout(summaryUrl(name), { headers: { Accept: "application/json" } }, 6000);
    if (r.ok) {
      const j = await r.json();
      if (j && j.title) title = j.title;
      const url = imageFromSummary(j);
      if (url) out.push({ url, thumb: url, alt: name, credit: "Wikipedia", source: "Wikipedia" });
    }
  } catch (e) { /* fall through */ }
  try {
    const sr = await fetchWithTimeout(wikidataSearchUrl(name), 6000);
    if (sr.ok) {
      const qid = wikidataId(await sr.json());
      if (qid) {
        const cr = await fetchWithTimeout(wikidataClaimsUrl(qid), 6000);
        if (cr.ok) {
          const cj = await cr.json();
          const p18 = imageFromClaims(cj);
          if (p18) out.push({ url: p18, thumb: p18, alt: name, credit: "Wikimedia Commons", source: "Wikidata" });
          const cat = commonsCategoryFromClaims(cj);
          if (cat) {
            const mr = await fetchWithTimeout(commonsCategoryMembersUrl(cat, 30), 6000);
            if (mr.ok) out.push(...parseCommonsCategoryMembers(await mr.json(), 24));
          }
        }
      }
    }
  } catch (e) { /* give up; stock covers it */ }
  // Fuller gallery + name fallback: the Wikipedia article's OWN photos (media-list)
  // — extra genuine images beyond the lead portrait, and a real-photo source even
  // when the subject has no Wikidata Commons category. Deduped downstream by URL.
  try {
    const ml = await fetchWithTimeout(mediaListUrl(title), { headers: { Accept: "application/json" } }, 6000);
    if (ml.ok) out.push(...parseMediaList(await ml.json(), 18));
  } catch (e) { /* media-list is best-effort */ }
  return out;
}

async function runSearch(rawQuery) {
  const query = (rawQuery || "").trim().slice(0, 80);
  if (!query) return [];
  const seen = {};
  const out = [];
  const push = (img) => {
    if (!img || !img.url || !img.thumb || out.length >= 30) return;
    const key = normalizeImgUrl(img.url);
    if (seen[key]) return;
    seen[key] = true;
    out.push(img);
  };
  // A proper-noun query gets real photos of the subject FIRST (entity-first),
  // then stock fills below. Object/scene queries skip this and go straight to
  // stock (where stock is strong), so ordinary searches pay no extra round-trip.
  if (looksLikeProperNoun(query)) {
    (await resolveEntityGallery(query)).forEach(push);
  }
  // Deeper pull: fetch TWO pages per keyed provider (~2× the pool) so there's more
  // to rank from and the grid fills. WikiCommons is a single keyless search.
  const paged = (fn) => Promise.all([fn(query, 1), fn(query, 2)]).then((ps) => ps.flat());
  const groups = await Promise.all([
    paged(searchUnsplash),
    paged(searchPexels),
    paged(searchPixabay),
    searchWikiCommons(query),
  ]);
  // Interleave the providers into one pool, then RANK by relevance to the query
  // (on-topic first; the zero-match noise drops when there are enough good hits),
  // and push the ranked stock below any real-photo results.
  rankStock(interleave(groups), query).forEach(push);
  return out;
}

export async function POST(request) {
  try {
    const body = await request.json();
    // No hard fail when stock keys are absent: entity resolution (Wikipedia /
    // Wikidata) and Wikimedia Commons are keyless, so #6 entity photos and a
    // Commons-only Photos search still work. Missing keys just narrow the stock
    // providers (reported in the pipeline summary's keysConfigured).
    // Studio Photos panel sends { q } for a flat free-text search -> { results }.
    // Carousel-pipeline callers send { slides, topic, ... } and are unaffected.
    if (typeof body.q === "string") {
      const results = await runSearch(body.q);
      return NextResponse.json({ results });
    }
    const result = await runImagePipeline(body);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e && e.message ? e.message : "Image pipeline failed" },
      { status: 500 },
    );
  }
}
