// brandkits.js — saved client-brand "kits" the user can reuse across decks.
// Storage is localStorage (per browser) for now — a simple first cut; an upgrade
// to per-account (Firestore) can back the same shape later. The array operations
// are PURE + unit-tested; loadKits/saveKits are thin, guarded localStorage IO.
//
// A kit: { id, name, brand } where `brand` is a clientBrand (see clientbrand.js).

export const KITS_KEY = "loathr:brandKits";
export const KITS_CAP = 24; // keep the list bounded (newest first)

// Insert or replace a kit (by id), newest-first, capped. Pure.
export function upsertKit(kits, kit) {
  const rest = (kits || []).filter((k) => k.id !== kit.id);
  return [kit].concat(rest).slice(0, KITS_CAP);
}

// Remove a kit by id. Pure.
export function removeKit(kits, id) {
  return (kits || []).filter((k) => k.id !== id);
}

// A small summary for a kit chip: up to three accent swatches + a font name. Pure.
export function kitSummary(kit) {
  const b = (kit && kit.brand) || {};
  const colors = [b.accent1, b.accent2, b.accent3].filter(Boolean);
  return { name: (kit && kit.name) || "Brand", colors };
}

// Read the saved kits (browser). Safe [] anywhere it can't.
export function loadKits() {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(KITS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

// Persist the kits (browser). Best-effort no-op elsewhere.
export function saveKits(kits) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(KITS_KEY, JSON.stringify(kits || []));
  } catch (e) { /* ignore (quota / disabled) */ }
}
