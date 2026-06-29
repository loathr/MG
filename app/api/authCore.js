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
