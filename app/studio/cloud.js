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
  const e = (typeof process !== "undefined" && process.env) ? process.env : {};
  const cfg = {
    apiKey: e.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: e.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: e.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: e.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: e.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: e.NEXT_PUBLIC_FIREBASE_APP_ID || "",
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
