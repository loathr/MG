import { NextResponse } from "next/server";
import { parseBearer, adminCredentials, authGateEnabled, emailAllowed, allowedEmailDomains, isMemberEmail } from "./authCore";
import { roleFromClaims } from "../studio/authority";

// Route-level auth verifier. firebase-admin is loaded LAZILY and only when the
// admin credentials are configured, so an unconfigured deploy never pulls it in
// and every request passes (the current open behaviour).

let _adminAuth = null;
async function adminAuth() {
  const creds = adminCredentials();
  if (!creds) return null;
  if (!_adminAuth) {
    const { getApps, initializeApp, cert } = await import("firebase-admin/app");
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(creds) });
    const { getAuth } = await import("firebase-admin/auth");
    _adminAuth = getAuth(app);
  }
  return _adminAuth;
}

// Verify a request. Returns { ok, uid, gated }. Gate OFF (no creds) →
// { ok:true, uid:null, gated:false } (open). Gate ON → a valid Firebase ID token
// (Bearer) is required; { ok:false } means the caller should respond 401.
export async function verifyRequest(request) {
  if (!authGateEnabled()) return { ok: true, uid: null, gated: false };
  const token = parseBearer(request.headers.get("authorization"));
  if (!token) return { ok: false, gated: true, reason: "no token" };
  try {
    const auth = await adminAuth();
    const decoded = await auth.verifyIdToken(token);
    // Domain allow-list (default @loathr.com): a verified token from an outside
    // domain is rejected here, so even a valid Google session can't reach any gated
    // route. `forbidden` → the caller responds 403 (authenticated but not allowed).
    if (!emailAllowed(decoded.email)) {
      return { ok: false, gated: true, forbidden: true, reason: "Only " + allowedEmailDomains().map((d) => "@" + d).join(" / ") + " accounts may use this app." };
    }
    // The `role` custom claim (set by an admin) rides in the verified token, so
    // the gate / admin routes read authority off the same source the rules do.
    // `isGuest` marks an allowed non-member (external) account — the metering uses
    // it to apply the tighter guest monthly cap.
    return { ok: true, uid: decoded.uid, role: roleFromClaims(decoded), isGuest: !isMemberEmail(decoded.email), gated: true };
  } catch (e) {
    return { ok: false, gated: true, reason: (e && e.message) || "invalid token" };
  }
}

// 401. `reason` (from verifyRequest — "no token" / "invalid token: …") is echoed
// back so the client can surface WHY the gate rejected the call (session not sent
// vs token verification failed, e.g. a service-account/web-config project
// mismatch). The reason carries no secrets — project ids are public config.
export function unauthorized(reason) {
  return NextResponse.json({ error: "Please sign in to continue.", reason: reason || undefined }, { status: 401 });
}

export function forbidden(msg) {
  return NextResponse.json({ error: msg || "You don't have access to do that." }, { status: 403 });
}

export function quotaExceeded(remaining) {
  return NextResponse.json({ error: "Monthly generation limit reached.", remaining: remaining || 0 }, { status: 429 });
}
