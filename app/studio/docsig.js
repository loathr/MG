// docsig.js — a stable, canonical signature for a deck doc. Used to tell whether
// two docs are the SAME content regardless of object key order.
//
// Why this exists: the owner live-refresh (Studio.jsx) subscribes to its OWN deck's
// sharePulse, which its OWN autosave bumps on every save. To avoid reacting to that
// self-echo it must recognise "this is the state I just saved". A raw
// JSON.stringify compare fails for two reasons that make equal content look
// different — (1) Firestore returns map keys in its own order, and JSON.stringify is
// order-sensitive; (2) image offload rewrites inline data-URLs to Storage URLs, so
// the in-memory doc and the saved doc never match byte-for-byte. Comparing the
// server doc against the offloaded doc we actually SAVED (both server-shaped),
// through a key-sorted signature, is stable. Left the crash it prevents: an
// infinite pull → loadDoc → save → pulse → pull loop that pegged the tab until the
// browser killed it ("This page couldn't load").
//
// Pure + dependency-free so it's unit-tested headless.

// Recursively sort object keys so the serialisation is order-independent. Arrays
// keep their order (order is meaningful for slides/elements); objects are sorted.
function sortDeep(v) {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortDeep(v[k]);
    return out;
  }
  return v;
}

// A canonical string signature of a doc. `undefined` in → "" (a value that no real
// doc signature equals, so a missing baseline never matches a fetched doc).
export function docSig(doc) {
  if (doc == null) return "";
  try {
    return JSON.stringify(sortDeep(doc));
  } catch (e) {
    return "";
  }
}

// True when two docs are the same content ignoring key order. Two nullish docs are
// NOT considered equal (an absent baseline must not match anything).
export function sameDoc(a, b) {
  if (a == null || b == null) return false;
  return docSig(a) === docSig(b);
}
