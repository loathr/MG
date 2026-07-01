"use client";
// Uploaded (user) fonts. A font file → a deck-embedded entry, registered with the
// browser via the FontFace API so the face renders LIVE, in thumbnails, AND in the
// PNG export (export.js awaits document.fonts.ready, so a registered face stamps
// in). Entries live in `doc.fonts` and travel with the deck as a data URL, so they
// persist on reload/share. Option A: embedded in the doc with a ~1 MB per-font cap
// (no Cloud Storage dependency; works on local-only decks too).
//
// The pure bits (validation, name derivation, picker group) are unit-tested; the
// FontFace registration + FileReader are browser-only.

// Cap the raw file at 600 KB: embedded as a base64 data URL that's ~800 KB, which
// stays under Firestore's 1 MB per-document limit (with images offloaded by Cloud
// 11c) so a cloud deck still saves. Local-only decks aren't limited by this, but one
// cap keeps behaviour consistent. WOFF2 subsets are a few KB, so this fits nearly
// every real font; bigger families should be subset or offloaded (future Option B).
export const MAX_FONT_BYTES = 600 * 1024;
const FONT_EXT = /\.(ttf|otf|woff2?)$/i;

// A CSS-ident-safe, unique FontFace family name for an entry.
export function fontFaceName(id) { return "upl-" + String(id).replace(/[^a-zA-Z0-9_-]/g, ""); }
// The value stored on el.fontFamily / brand fonts: the quoted face + a safe fallback.
export function fontFamilyValue(family) { return "'" + family + "', sans-serif"; }

// Friendly validation error for a chosen file, or null when it's acceptable. Pure.
export function fontFileError(file) {
  if (!file) return "No file selected.";
  if (!FONT_EXT.test(file.name || "")) return "Use a .ttf, .otf, .woff or .woff2 font file.";
  if (file.size > MAX_FONT_BYTES) return "That font is " + Math.round(file.size / 1024) + " KB — the limit is 600 KB. Try a WOFF2 or a subset.";
  return null;
}

// A readable font name from a filename ("Bricolage_Grotesque-Bold.otf" → "Bricolage Grotesque Bold"). Pure.
export function fontNameFromFile(filename) {
  const base = String(filename || "").replace(FONT_EXT, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return base || "Uploaded font";
}

// The "Your fonts" FontSelect group from the deck's uploaded fonts (null when none),
// prepended to FONT_OPTIONS in the pickers. Pure.
export function uploadedFontGroup(fonts) {
  const list = (fonts || []).filter((f) => f && f.family && f.name);
  if (!list.length) return null;
  return { group: "Your fonts", fonts: list.map((f) => ({ label: f.name, value: fontFamilyValue(f.family), upl: f.id })) };
}

// --- browser-only ----------------------------------------------------------
// Register one entry with the browser (idempotent by family). No-op server-side or
// on a malformed entry; a font that fails to decode simply doesn't register.
const _registered = new Set();
export async function registerFont(entry) {
  if (typeof window === "undefined" || typeof FontFace === "undefined") return;
  if (!entry || !entry.family || !entry.dataUrl || _registered.has(entry.family)) return;
  try {
    const face = new FontFace(entry.family, "url(" + entry.dataUrl + ")");
    await face.load();
    document.fonts.add(face);
    _registered.add(entry.family);
  } catch (e) { /* a bad font just won't register */ }
}
export function registerDocFonts(fonts) { (fonts || []).forEach((f) => registerFont(f)); }

// Validate + read a File into a deck font entry { id, name, family, dataUrl }, or
// reject with a friendly message. `id` (a uid) is supplied so the family is stable.
export function readFontFile(file, id) {
  return new Promise((resolve, reject) => {
    const err = fontFileError(file);
    if (err) return reject(new Error(err));
    const r = new FileReader();
    r.onload = () => resolve({ id, name: fontNameFromFile(file.name), family: fontFaceName(id), dataUrl: String(r.result || "") });
    r.onerror = () => reject(new Error("Couldn't read that file."));
    r.readAsDataURL(file);
  });
}
