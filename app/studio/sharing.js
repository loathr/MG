// Share-link access decisions for live collaboration (Tier A: share a link →
// instant live view; signed-in members edit by role, taking turns). PURE — no
// firebase, no randomness: token *generation* happens at the call site; this
// only DECIDES access given a deck's share config + who is asking. Composes with
// authority.js so the link grant and the role grant agree on one access scale.

import { can } from "./authority";

export const SHARE_LEVELS = ["none", "view", "edit"];
const RANK = { none: 0, view: 1, edit: 2 };

// A deck's share config lives on the doc: { link: "none"|"view"|"edit", token }.
// `link` is the access granted to ANYONE holding the link's opaque token; "none"
// turns the link off (members only). The token is an unguessable id minted when
// sharing is switched on (caller-side), rotated to revoke a link.
export function normalizeShare(level) { return SHARE_LEVELS.includes(level) ? level : "none"; }

// What a LINK grants: the deck's link level if the presented token matches the
// deck's token, else "none" (wrong/absent token, or link off).
export function linkAccess(share, presentedToken) {
  const s = share || {};
  if (!s.token || normalizeShare(s.link) === "none") return "none";
  return presentedToken && presentedToken === s.token ? normalizeShare(s.link) : "none";
}

// What a signed-in MEMBER gets from role + ownership (workspace model): the deck
// owner always edits; otherwise editShared → edit, viewShared → view, else none.
export function memberAccess(viewer, deck) {
  if (!viewer) return "none";
  if (viewer.uid && deck && deck.ownerUid && viewer.uid === deck.ownerUid) return "edit";
  if (can(viewer.role, "editShared")) return "edit";
  if (can(viewer.role, "viewShared")) return "view";
  return "none";
}

// Effective access = the MOST permissive of the link grant and the member grant.
// So an anonymous visitor with a view link gets "view"; a teammate with an editor
// role gets "edit" regardless of the link level (the link is for outsiders).
export function effectiveAccess(deck, viewer, presentedToken) {
  const a = linkAccess(deck && deck.share, presentedToken);
  const b = memberAccess(viewer, deck);
  return RANK[a] >= RANK[b] ? a : b;
}

export function canView(access) { return RANK[normalizeShare(access)] >= 1; }
export function canEdit(access) { return normalizeShare(access) === "edit"; }

// --- share-config mutations + URL (pure; randomness injected by the caller) ---
// Set the link level, optionally rotating the token. The caller owns the
// randomness: pass a fresh `newToken` to mint/rotate (revoking old links); omit
// it to keep the current token. Turning to "none" disables the link but KEEPS
// the token, so re-enabling restores the same link unless the caller rotates.
export function setShare(share, level, newToken) {
  const cur = share || {};
  const lvl = normalizeShare(level);
  if (lvl === "none") return { link: "none", token: cur.token || null };
  return { link: lvl, token: newToken || cur.token || null };
}

// The shareable URL for a deck, or null when the link is off / has no token.
// `origin` is the deploy origin (e.g. https://app.example.com); the share token
// rides as ?s= so the open route can resolve access before rendering.
export function shareUrl(origin, deckId, share) {
  const s = share || {};
  if (!s.token || normalizeShare(s.link) === "none" || !deckId) return null;
  return String(origin || "").replace(/\/+$/, "") + "/studio/" + encodeURIComponent(deckId) + "?s=" + encodeURIComponent(s.token);
}

// One-call resolution for the open route / UI: the effective access plus the
// boolean gates. 403 when !canView; render read-only when canView && !canEdit.
export function resolveAccess(deck, viewer, presentedToken) {
  const access = effectiveAccess(deck, viewer, presentedToken);
  return { access, canView: canView(access), canEdit: canEdit(access) };
}
