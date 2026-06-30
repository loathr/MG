// Server-side Admin-SDK store: usage metering + role assignment. Loaded LAZILY
// and only when admin credentials are configured (same gate as _auth) — an
// unconfigured deploy never pulls firebase-admin in, and every helper is a safe
// no-op. The DECISIONS (quota math, period bucketing) live in the pure, tested
// authority.js; this module only does the Firestore/Auth I/O around them, and
// fails OPEN on any error so a metering blip can never block generation.

import { adminCredentials } from "./authCore";
import { quotaCheck, usagePeriodKey } from "../studio/authority";

let _db = null;
async function db() {
  const creds = adminCredentials();
  if (!creds) return null;
  if (!_db) {
    const { getApps, initializeApp, cert } = await import("firebase-admin/app");
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(creds) });
    const { getFirestore } = await import("firebase-admin/firestore");
    _db = getFirestore(app);
  }
  return _db;
}

// The account's monthly generation limit (0 / absent = unlimited), from
// users/{uid}.limits.monthly — the value an admin sets.
async function accountLimit(d, uid) {
  try {
    const snap = await d.doc("users/" + uid).get();
    const data = snap.exists ? snap.data() : null;
    return (data && data.limits && data.limits.monthly) || 0;
  } catch (e) { return 0; }
}

// Meter ONE generation: read the account's monthly quota, and on allow, atomically
// increment the usage counter at usage/{uid}/months/{period}. Returns the
// quotaCheck result ({ allowed, remaining, … }). Fail-open on any Firestore error.
export async function meterGenerate(uid, nowMs) {
  const d = await db();
  if (!d || !uid) return { allowed: true, unlimited: true };
  try {
    const limit = await accountLimit(d, uid);
    const period = usagePeriodKey(nowMs);
    const ref = d.doc("usage/" + uid + "/months/" + period);
    const snap = await ref.get();
    const used = (snap.exists && snap.data() && snap.data().count) || 0;
    const check = quotaCheck(used, limit);
    if (!check.allowed) return check;            // at/over the cap → caller 429s
    const { FieldValue } = await import("firebase-admin/firestore");
    await ref.set({ count: FieldValue.increment(1), updatedAt: nowMs }, { merge: true });
    return check;
  } catch (e) {
    return { allowed: true, unlimited: true, error: true }; // never block on a blip
  }
}

// Admin only: set an account's `role` custom claim (the authority the token
// carries) and mirror it to users/{uid}.role so rules/queries can read it without
// decoding a token. The caller MUST have already verified it is an admin.
export async function setUserRole(targetUid, role) {
  const creds = adminCredentials();
  if (!creds || !targetUid) return false;
  const { getApps, initializeApp, cert } = await import("firebase-admin/app");
  const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(creds) });
  const { getAuth } = await import("firebase-admin/auth");
  await getAuth(app).setCustomUserClaims(targetUid, { role });
  const d = await db();
  if (d) { try { await d.doc("users/" + targetUid).set({ role }, { merge: true }); } catch (e) { /* mirror best-effort */ } }
  return true;
}
