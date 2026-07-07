// presence.js — pure helpers for the live-presence layer: who's editing a deck,
// their cursor, and their selection. No React, no firebase — the usePresence hook
// and firebaseStore wire these to IO, so every rule here is a pure, unit-tested
// function. A "peer" is one open editor session; identity is the signed-in user
// (name + a stable colour), keyed by an ephemeral sessionId.

// Fixed, high-contrast peer palette. A peer's colour is derived from their uid so
// the same person is the same colour on every client and across reconnects.
export const PEER_COLORS = ["#ff5a8a", "#38d39f", "#f4b740", "#5b8cff", "#c07cff", "#ff8a3d", "#3dd6d6", "#e85d75"];

// Deterministic colour for a peer from their uid (stable, client-independent). Pure.
export function peerColor(uid) {
  const s = String(uid || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PEER_COLORS[h % PEER_COLORS.length];
}

// Up to two initials from a display name or email. "Maria Alvarez" → "MA",
// "jon@loathr.com" → "J", "" → "?". Pure.
export function initials(name) {
  // For an email, ignore the domain — only the local part names the person.
  const base = String(name || "").trim().split("@")[0];
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (!parts.length) return "?";
  const a = parts[0][0] || "";
  const b = parts.length > 1 ? (parts[1][0] || "") : "";
  return ((a + b).toUpperCase()) || "?";
}

// Shape a raw presence record (read from Firestore) into a render-ready peer,
// filling defaults. `selection` is always an array of element ids. Pure.
export function toPeer(id, raw) {
  const r = raw || {};
  const cursor = r.cursor && typeof r.cursor.x === "number" && typeof r.cursor.y === "number"
    ? { x: r.cursor.x, y: r.cursor.y } : null;
  const selection = Array.isArray(r.selection) ? r.selection.slice() : (r.selection ? [r.selection] : []);
  return {
    id,
    uid: r.uid || id,
    name: r.name || "Someone",
    color: r.color || peerColor(r.uid || id),
    cursor,
    selection,
    slide: r.slide == null ? null : r.slide,
    ts: r.ts || 0,
  };
}

// The peers to actually render: everyone except my own session whose heartbeat is
// fresh (within `ttl` ms — a closed/asleep tab ages out). Sorted stably by id so
// avatar order and colours don't jitter between renders. Pure (caller passes now).
export function livePeers(records, mySessionId, now, ttl) {
  const t = ttl || 15000;
  const out = [];
  for (const id of Object.keys(records || {})) {
    if (id === mySessionId) continue;
    const peer = toPeer(id, records[id]);
    if (now - peer.ts > t) continue;      // stale heartbeat → gone
    out.push(peer);
  }
  return out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// Throttle rule for cursor writes: send at most once per `minMs`, and only after
// the pointer has actually moved at least `minDist` artboard units since the last
// send — so a still pointer costs nothing and a fast drag is capped. Pure.
export function shouldSendCursor(last, next, now, minMs, minDist) {
  if (!last) return true;
  if (now - (last.ts || 0) < (minMs || 60)) return false;
  const dx = next.x - last.x, dy = next.y - last.y;
  const d = minDist || 3;
  return dx * dx + dy * dy >= d * d;
}
