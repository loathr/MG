import { NextResponse } from "next/server";

// Image search runs server-side because doing 10-30 sequential Unsplash/Pexels
// calls from the browser kept killing the renderer process on flaky networks —
// each failed fetch leaves browser-internal cleanup state, and accumulated
// state was tipping the tab over. Server-side has a clean, stable network
// stack and never accumulates that browser-internal state.
//
// 60s is plenty here — even on a bad day the pipeline finishes in <10s.
export const maxDuration = 60;

// --- API keys (server-side ONLY). Falls back to NEXT_PUBLIC_* during migration. ---
const UNSPLASH_KEY = process.env.UNSPLASH_KEY || process.env.NEXT_PUBLIC_UNSPLASH_KEY || "";
const PEXELS_KEY = process.env.PEXELS_KEY || process.env.NEXT_PUBLIC_PEXELS_KEY || "";
const PIXABAY_KEY = process.env.PIXABAY_KEY || process.env.NEXT_PUBLIC_PIXABAY_KEY || "";

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
    return (d.results || []).map((img) => ({
      url: img.urls ? (img.urls.full || img.urls.regular) : null,
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
    return (d.photos || []).map((img) => ({
      url: img.src ? (img.src.original || img.src.large2x || img.src.large) : null,
      thumb: img.src ? img.src.medium : null,
      alt: query,
      credit: img.photographer || "",
      source: "Pexels",
    }));
  } catch (e) { return []; }
};

const searchWikiCommons = async (query) => {
  try {
    const r = await fetchWithTimeout(
      "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" + encodeURIComponent(query) + "&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1920&format=json",
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

const searchPixabay = async (query) => {
  if (!PIXABAY_KEY) return [];
  try {
    const r = await fetchWithTimeout(
      "https://pixabay.com/api/?key=" + PIXABAY_KEY + "&q=" + encodeURIComponent(query) + "&image_type=photo&orientation=vertical&per_page=8&safesearch=true",
      5000,
    );
    if (!r.ok) return [];
    const d = await r.json();
    return (d.hits || []).slice(0, 5).map((img) => ({
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
  if (slide.person) return slide.person + " " + extractKeywords(topic, 2);
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

  // 2. Place cover + closer from mainImgs (unless browser locked them)
  if (mainImgs.length > 0 && !lockedSlots[0]) imgMap[0] = mainImgs[0];
  const closerIdx = slides.length ? slides.length - 1 : 9;
  if (!lockedSlots[closerIdx]) {
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

export async function POST(request) {
  try {
    const body = await request.json();
    if (!UNSPLASH_KEY && !PEXELS_KEY && !PIXABAY_KEY) {
      return NextResponse.json(
        { error: "No image API keys configured on the server (UNSPLASH_KEY / PEXELS_KEY / PIXABAY_KEY)" },
        { status: 500 },
      );
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
