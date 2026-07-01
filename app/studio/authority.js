// Pure role/permission + usage-quota logic for the multi-account workspace.
// The SINGLE source of truth for "who can do what" and "is this account over its
// limit", consumed by three independent enforcers so they can't drift:
//   • the client (show/hide UI per role),
//   • the server gate /api/generate (verify role + meter usage),
//   • and as the spec the Firestore/Storage security rules must mirror.
// No firebase here — authority rides in the Google ID token's custom claims
// (`role`), set by an admin via the Admin SDK; this module just decides on it.

export const ROLES = ["viewer", "editor", "admin"];
// A newly signed-in user owns and edits their OWN carousels (but not shared
// content or admin tools) until an admin changes their role.
export const DEFAULT_ROLE = "editor";

export const CAPABILITIES = [
  "create",       // create / edit your own carousels
  "viewShared",   // view carousels in the shared workspace
  "editShared",   // edit carousels in the shared workspace
  "saveToDrive",  // export to the user's Google Drive
  "viewOwnUsage", // see your own usage
  "viewAllDecks", // admin: see every account's carousels
  "viewAllUsage", // admin: usage dashboard across all accounts
  "setLimits",    // admin: set per-account usage limits
  "assignRoles",  // admin: assign roles to accounts
];

const MATRIX = {
  viewer: ["viewShared", "viewOwnUsage"],
  editor: ["create", "viewShared", "editShared", "saveToDrive", "viewOwnUsage"],
  admin: CAPABILITIES.slice(), // everything
};

// Coerce an arbitrary/absent role to a known one (default for new accounts).
export function normalizeRole(role) {
  return ROLES.includes(role) ? role : DEFAULT_ROLE;
}

// Can a role perform a capability? Unknown role → DEFAULT_ROLE; unknown cap → false.
export function can(role, capability) {
  return (MATRIX[normalizeRole(role)] || []).includes(capability);
}

export function isAdmin(role) { return normalizeRole(role) === "admin"; }

// The effective role from a decoded Firebase ID-token claims object (custom
// claim `role`). Used identically client-side (getIdTokenResult) and server-side
// (admin.verifyIdToken), so the UI and the gate always agree.
export function roleFromClaims(claims) {
  return normalizeRole(claims && claims.role);
}

// --- usage / quota ----------------------------------------------------------
// The default monthly generation cap applied to every NON-admin account that an
// admin hasn't given an explicit limit. Admins are always unlimited.
export const DEFAULT_MONTHLY_LIMIT = 75;

// The limit actually enforced for an account, folding in the policy default:
//   • admin                      → 0 (unlimited)
//   • non-admin, no stored limit → DEFAULT_MONTHLY_LIMIT (the preset)
//   • non-admin, stored 0        → 0 (an admin explicitly granted unlimited)
//   • non-admin, stored N>0      → N (an admin's explicit cap)
// `stored` is the raw users/{uid}.limits.monthly (null/undefined when unset). Pure.
export function effectiveMonthlyLimit(role, stored) {
  if (isAdmin(role)) return 0;
  if (stored == null) return DEFAULT_MONTHLY_LIMIT;
  const n = Number(stored);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_MONTHLY_LIMIT;
}

// The metering bucket key for a timestamp (monthly, UTC). Pass the time in so
// this stays pure/deterministic and testable.
export function usagePeriodKey(ms) {
  const d = new Date(ms);
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
}

// Decide whether one more metered action is allowed. A limit that is null / 0 /
// negative means UNLIMITED. Pure — the caller reads `used` from the usage doc
// and `limit` from the account's limits, then enforces the result (e.g. 429).
export function quotaCheck(used, limit) {
  const u = Math.max(0, used | 0);
  if (!limit || limit <= 0) return { allowed: true, unlimited: true, used: u, limit: 0, remaining: Infinity };
  return { allowed: u < limit, unlimited: false, used: u, limit, remaining: Math.max(0, limit - u) };
}
