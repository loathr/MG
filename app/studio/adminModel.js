// Pure view-model helpers for the admin console — headline stats, per-account
// usage state, and a stable sort. No firebase: the route feeds these the account
// rows it read, and the client re-runs the same functions so an optimistic role /
// limit edit updates the stat cards without a refetch. Tested in adminModel.test.
import { normalizeRole, isAdmin, quotaCheck } from "./authority";

// One account's usage state for the row: fill ratio (0..1) + an over-limit flag.
// Unlimited (limit 0/absent) never counts as over and shows an empty ratio.
export function accountUsageState(used, limit) {
  const q = quotaCheck(used, limit);
  const ratio = q.unlimited || !q.limit ? 0 : Math.min(1, q.used / q.limit);
  return { used: q.used, limit: q.unlimited ? 0 : q.limit, unlimited: q.unlimited, over: !q.allowed && !q.unlimited, remaining: q.remaining, ratio };
}

// Workspace headline stats from the account rows (drives the stat cards).
export function workspaceTotals(accounts) {
  const list = Array.isArray(accounts) ? accounts : [];
  let admins = 0, generations = 0, over = 0;
  for (const a of list) {
    if (isAdmin(a && a.role)) admins++;
    generations += Math.max(0, (a && a.used) | 0);
    if (accountUsageState(a && a.used, a && a.limit).over) over++;
  }
  return { accounts: list.length, admins, generationsThisMonth: generations, overLimit: over };
}

// Stable display order: admins first, then editors, then viewers; within a tier,
// alphabetical by name (email fallback). Deterministic → testable and jitter-free.
export function sortAccounts(accounts) {
  const rank = { admin: 0, editor: 1, viewer: 2 };
  const label = (a) => String((a && (a.name || a.email)) || "").toLowerCase();
  return (Array.isArray(accounts) ? accounts.slice() : []).sort((a, b) => {
    const ra = rank[normalizeRole(a && a.role)], rb = rank[normalizeRole(b && b.role)];
    if (ra !== rb) return ra - rb;
    return label(a) < label(b) ? -1 : label(a) > label(b) ? 1 : 0;
  });
}
