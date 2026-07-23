// colors.js — shared colour helpers: hex normalisation and the "recent colours"
// list (localStorage). Used by both the floating FormatBar (span colour/highlight)
// and the top Toolbar's in-app colour/highlight popover, so the two stay in sync
// and there's one source of truth for what a valid colour is and what's recent.

export const RECENT_KEY = "loathr.recentColors";

// Normalise a typed hex to "#rrggbb" (accepts "#rgb", "rrggbb", etc.) or null.
export function normalizeHex(v) {
  if (!v) return null;
  let h = String(v).trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split("").map((c) => c + c).join("");
  if (/^[0-9a-fA-F]{6}$/.test(h)) return "#" + h.toLowerCase();
  return null;
}

export function readRecents() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]").filter((c) => normalizeHex(c)); } catch (e) { return []; }
}

export function pushRecent(hex) {
  if (typeof window === "undefined" || !hex) return readRecents();
  const next = [hex, ...readRecents().filter((c) => c.toLowerCase() !== hex.toLowerCase())].slice(0, 8);
  try { window.localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
  return next;
}
