import { NextResponse } from "next/server";
import { parseBearer, adminCredentials, authGateEnabled } from "./authCore";
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
    // The `role` custom claim (set by an admin) rides in the verified token, so
    // the gate / admin routes read authority off the same source the rules do.
    return { ok: true, uid: decoded.uid, role: roleFromClaims(decoded), gated: true };
  } catch (e) {
    return { ok: false, gated: true, reason: (e && e.message) || "invalid token" };
  }
}

export function unauthorized() {
  return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
}

export function forbidden(msg) {
  return NextResponse.json({ error: msg || "You don't have access to do that." }, { status: 403 });
}

export function quotaExceeded(remaining) {
  return NextResponse.json({ error: "Monthly generation limit reached.", remaining: remaining || 0 }, { status: 429 });
}
