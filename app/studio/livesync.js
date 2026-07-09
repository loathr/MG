// livesync.js — pure helpers for the ANONYMOUS shared-editor live layer. A share-
// link editor has no Firebase account, so it can't read/write the presence + edits
// collections directly (the rules require auth). Instead it short-polls a token-
// authorized relay (/api/shared/live, Admin SDK) that reads/writes the SAME
// collections the signed-in path uses. These helpers are the pure, unit-tested core;
// the useSharedLive hook wires them to the relay fetch. No React, no firebase.
import { peerColor } from "./presence";

// The identity an anonymous editor publishes: a "Guest" name + a stable colour from
// its ephemeral session id (so the same tab is the same colour), flagged anon so the
// UI can tag the cursor / avatar / strip badge. Pure.
export function guestIdentity(sessionId) {
  return { name: "Guest", color: peerColor(sessionId), anon: true };
}

// Flatten the relay's returned op batches into a single op list to apply, skipping
// my own batches, and advancing the since-cursor to the newest batch timestamp seen.
// `prevCursor` is carried so the cursor never goes backwards on an empty poll. Pure.
export function collectOps(batches, mySessionId, prevCursor) {
  const out = { ops: [], cursor: prevCursor || 0 };
  for (const b of batches || []) {
    if (!b) continue;
    if (mySessionId && b.from === mySessionId) continue;   // don't replay my own edits
    if (Array.isArray(b.ops)) out.ops.push(...b.ops);
    if ((b.ts || 0) > out.cursor) out.cursor = b.ts;
  }
  return out;
}

// Adaptive poll cadence (ms) for the anonymous side, so a solo/idle guest barely
// polls (near-zero cost) while active collaboration stays responsive:
//   • tab hidden        → very slow (just enough to keep presence alive)
//   • peers present OR I'm actively moving/editing → fast
//   • alone and still   → slow back-off
// Pure — the hook passes the current state each tick.
export function pollDelay({ hasPeers, active, hidden } = {}) {
  if (hidden) return 15000;         // backgrounded — heartbeat only
  if (hasPeers || active) return 1500;
  return 7000;                      // alone and idle
}
