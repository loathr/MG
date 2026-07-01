// ============================================================================
// Cloud layer — real storage (Firestore) + Google auth (Firebase Auth), behind a
// GUARDED boundary. This module is intentionally PURE: config detection + deck
// (de)serialization, with NO firebase import. The firebase-backed adapter
// (auth / firestore / storage) loads only when `isCloudEnabled()` (added in later
// increments), so with no config the app runs exactly as today — in-memory,
// download-only, no sign-in gate.
//
// Firebase WEB config is PUBLIC by design (the apiKey is an identifier, not a
// secret; access is enforced by Firestore security rules), so it rides
// NEXT_PUBLIC_* safely — unlike the provider/Anthropic keys, which stay
// server-only. See docs/CLOUD_SETUP.md for provisioning.
// ============================================================================

// Read the public Firebase web config at call-time (so tests can set env, and so
// a missing value flips the feature off rather than throwing at import).
export function cloudConfig() {
  // IMPORTANT: reference each NEXT_PUBLIC_* var DIRECTLY as
  // `process.env.NEXT_PUBLIC_…`. Next.js inlines these into the client bundle at
  // build time ONLY for literal, direct references — reading them through an alias
  // (`const e = process.env; e.NEXT_PUBLIC_X`) or by destructuring is NOT replaced,
  // so in the browser the values come back empty and the whole cloud layer stays
  // dark even when the vars are set. Direct access is inlined in the browser and is
  // a normal runtime read under Node (tests), so it works in both.
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };
  // Enabled only when the load-bearing fields are all present.
  return (cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId) ? cfg : null;
}

// Is the cloud layer configured? When false, every cloud call is a no-op and the
// editor stays purely local (the current behaviour).
export function isCloudEnabled() { return !!cloudConfig(); }

// A project record for Firestore: small list-metadata + the full deck `doc`.
// `nowMs` is passed in (pure/testable — the caller stamps the time, since
// Date.now() is unavailable here and would break determinism).
export function projectRecord(doc, opts) {
  const o = opts || {};
  const slides = (doc && doc.slides) || [];
  return {
    id: o.id || null,
    name: ((o.name != null ? o.name : "") || "").trim() || "Untitled carousel",
    slideCount: slides.length,
    createdAt: o.createdAt || o.now || 0,
    updatedAt: o.now || o.createdAt || 0,
    doc,
  };
}

// The deck doc back out of a stored record (or null if absent/malformed).
export function docFromRecord(rec) { return rec && rec.doc ? rec.doc : null; }

// ---- Cloud 11c: embedded-image offload to Cloud Storage --------------------
// Firestore caps a document at 1 MB, but uploaded photos ride in the doc as
// base64 `data:` URLs (imageFile.js) — a couple of photos blow the limit. On
// save we push each embedded image to Storage and swap the data URL for its
// download URL, keeping the persisted doc tiny. These helpers are PURE (no
// firebase) so they're unit-tested; firebaseStore wires them to the SDK.

const IMG_FIELDS = ["src", "thumb", "origSrc"]; // per-element image-bearing keys
function isDataUrl(u) { return typeof u === "string" && u.indexOf("data:") === 0; }

// Every distinct embedded `data:` image in a deck (slide backgrounds, image
// elements + their BG-remover original, and the brand logo).
export function collectImageData(doc) {
  const set = new Set();
  const add = (u) => { if (isDataUrl(u)) set.add(u); };
  for (const s of (doc && doc.slides) || []) {
    if (s.background) { add(s.background.src); add(s.background.thumb); }
    for (const e of s.elements || []) for (const f of IMG_FIELDS) add(e[f]);
  }
  if (doc && doc.brand && doc.brand.logo) add(doc.brand.logo.src);
  return [...set];
}

// A stable, content-addressed storage key for a data URL (FNV-1a, so the same
// image dedupes to one upload across slides and re-saves). Pure/deterministic.
export function imageKey(dataUrl) {
  let h = 0x811c9dc5;
  const str = String(dataUrl);
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  const hex = (h >>> 0).toString(16).padStart(8, "0") + (str.length % 0xffff).toString(16).padStart(4, "0");
  return "img_" + hex + (/^data:image\/png/i.test(str) ? ".png" : ".jpg");
}

// Return a new doc with every `data:` image replaced by map[dataUrl] when
// present (missing entries — e.g. an upload that failed — are left inline).
export function rewriteImages(doc, map) {
  if (!doc || !map) return doc;
  const sub = (u) => (isDataUrl(u) && map[u]) ? map[u] : u;
  const slides = (doc.slides || []).map((s) => {
    const background = s.background ? Object.assign({}, s.background, { src: sub(s.background.src), thumb: sub(s.background.thumb) }) : s.background;
    const elements = (s.elements || []).map((e) => {
      let n = e;
      for (const f of IMG_FIELDS) if (isDataUrl(e[f]) && map[e[f]]) { if (n === e) n = Object.assign({}, e); n[f] = map[e[f]]; }
      return n;
    });
    return Object.assign({}, s, { background, elements });
  });
  let brand = doc.brand;
  if (brand && brand.logo && isDataUrl(brand.logo.src) && map[brand.logo.src]) {
    brand = Object.assign({}, brand, { logo: Object.assign({}, brand.logo, { src: map[brand.logo.src] }) });
  }
  return Object.assign({}, doc, { slides, brand });
}

// "2h ago" relative label for the Projects list. Pure — nowMs is passed in.
export function relativeTime(ms, nowMs) {
  if (!ms || !nowMs || nowMs < ms) return "just now";
  const s = Math.floor((nowMs - ms) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24); if (d < 7) return d + (d === 1 ? " day ago" : " days ago");
  const w = Math.floor(d / 7); if (w < 5) return w + (w === 1 ? " week ago" : " weeks ago");
  const mo = Math.floor(d / 30); return mo + (mo === 1 ? " month ago" : " months ago");
}
