// Pure server-auth helpers (no next/firebase imports, so they're unit-testable).
// The route-level verifier lives in _auth.js. Gating is OFF unless the Firebase
// Admin credentials are configured — so an unconfigured deploy stays open (the
// current behaviour), and only a configured one requires a signed-in user.

// Pull a Bearer token out of an Authorization header. Pure.
export function parseBearer(header) {
  if (!header || typeof header !== "string") return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

// The Firebase Admin service-account credentials from env, or null when not
// configured (gate off). Accepts a JSON blob (FIREBASE_SERVICE_ACCOUNT) or the
// split FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY trio.
export function adminCredentials(env) {
  const e = env || (typeof process !== "undefined" ? process.env : {}) || {};
  if (e.FIREBASE_SERVICE_ACCOUNT) {
    try { return JSON.parse(e.FIREBASE_SERVICE_ACCOUNT); } catch (x) { return null; }
  }
  if (e.FIREBASE_PROJECT_ID && e.FIREBASE_CLIENT_EMAIL && e.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: e.FIREBASE_PROJECT_ID,
      clientEmail: e.FIREBASE_CLIENT_EMAIL,
      // Vercel stores multi-line secrets with literal "\n" — restore real newlines.
      privateKey: String(e.FIREBASE_PRIVATE_KEY).replace(/\\n/g, "\n"),
    };
  }
  return null;
}

// Is the server-side auth gate active? (i.e. are admin creds configured?)
export function authGateEnabled(env) { return !!adminCredentials(env); }

// The email domains allowed to sign in. Comma-separated ALLOWED_EMAIL_DOMAINS (or
// the single ALLOWED_EMAIL_DOMAIN), defaulting to "loathr.com" — so a configured
// deploy is locked to @loathr.com out of the box. Lowercased, leading "@" stripped.
// Pure.
export function allowedEmailDomains(env) {
  const e = env || (typeof process !== "undefined" ? process.env : {}) || {};
  const raw = e.ALLOWED_EMAIL_DOMAINS || e.ALLOWED_EMAIL_DOMAIN || "loathr.com";
  if (String(raw).trim() === "*") return []; // explicit wildcard → no restriction
  return String(raw).split(",").map((d) => d.trim().toLowerCase().replace(/^@/, "")).filter(Boolean);
}

// Normalise an email for allow-list comparison: lowercased + trimmed, and — for
// Gmail — the dot-insensitive, plus-suffix-stripped canonical form (so
// "jane.doe+news@gmail.com" and "janedoe@gmail.com" are the same mailbox and can't
// be used to sneak past or duplicate an allow-listed account). Pure.
export function normalizeEmail(email) {
  const s = String(email || "").trim().toLowerCase();
  const at = s.lastIndexOf("@");
  if (at < 0) return s;
  let local = s.slice(0, at), domain = s.slice(at + 1);
  local = local.split("+")[0];
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return local + "@" + domain;
}

// Individually allow-listed email addresses (the "select Gmail accounts" escape
// hatch on top of the domain lock): comma-separated ALLOWED_EMAILS, normalised.
// Empty by default. Pure.
export function allowedEmails(env) {
  const e = env || (typeof process !== "undefined" ? process.env : {}) || {};
  return String(e.ALLOWED_EMAILS || "").split(",").map((x) => normalizeEmail(x)).filter((x) => x.includes("@"));
}

// Is this verified email allowed to use the app? Allowed when the exact (normalised)
// address is individually allow-listed, OR its domain is in the domain list. An
// empty domain list (ALLOWED_EMAIL_DOMAINS="*" or "") means no domain restriction;
// a missing/malformed email is rejected when a restriction is set. Pure.
export function emailAllowed(email, env) {
  const norm = normalizeEmail(email);
  if (allowedEmails(env).includes(norm)) return true;   // select individual accounts
  const doms = allowedEmailDomains(env);
  if (!doms.length) return true;
  const at = norm.lastIndexOf("@");
  if (at < 0) return false;
  return doms.includes(norm.slice(at + 1));
}

// Is this (verified) uid the one-time bootstrap admin — the escape hatch that lets
// the FIRST admin self-promote before any admin exists to assign roles? Gated only
// by the server-only BOOTSTRAP_ADMIN_UID env var. Pure → unit-tested; shared by the
// admin routes and the auto-bootstrap route so the rule can't drift.
export function isBootstrapAdmin(uid, env) {
  const e = env || (typeof process !== "undefined" ? process.env : {}) || {};
  return !!(uid && e.BOOTSTRAP_ADMIN_UID && uid === e.BOOTSTRAP_ADMIN_UID);
}
