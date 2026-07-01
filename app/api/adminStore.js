// Server-side Admin-SDK store: usage metering + role assignment. Loaded LAZILY
// and only when admin credentials are configured (same gate as _auth) — an
// unconfigured deploy never pulls firebase-admin in, and every helper is a safe
// no-op. The DECISIONS (quota math, period bucketing) live in the pure, tested
// authority.js; this module only does the Firestore/Auth I/O around them, and
// fails OPEN on any error so a metering blip can never block generation.

import { adminCredentials } from "./authCore";
import { quotaCheck, usagePeriodKey, normalizeRole, effectiveMonthlyLimit } from "../studio/authority";
import { resolveShared } from "../studio/sharing";

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

// The RAW stored monthly limit from users/{uid}.limits.monthly, or null when unset
// (so the caller can apply the policy default via effectiveMonthlyLimit).
async function accountLimit(d, uid) {
  try {
    const snap = await d.doc("users/" + uid).get();
    const data = snap.exists ? snap.data() : null;
    const v = data && data.limits ? data.limits.monthly : null;
    return v == null ? null : v;
  } catch (e) { return null; }
}

// Meter ONE generation: read the account's monthly quota, and on allow, atomically
// increment the usage counter at usage/{uid}/months/{period}. Returns the
// quotaCheck result ({ allowed, remaining, … }). Fail-open on any Firestore error.
// `role` folds in the policy default: non-admins with no explicit limit get the
// preset (DEFAULT_MONTHLY_LIMIT); admins are unlimited.
export async function meterGenerate(uid, nowMs, role) {
  const d = await db();
  if (!d || !uid) return { allowed: true, unlimited: true };
  try {
    const limit = effectiveMonthlyLimit(role, await accountLimit(d, uid));
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

// Resolve a share link (deckId + token) to the deck, SERVER-SIDE: read the
// shares/{deckId} index (which carries the owner uid the link doesn't), verify
// the token, then read the owner's deck. The Admin SDK bypasses rules, so a
// viewer never needs Firestore access and a rotated token truly revokes — the
// token check is here, not in the rules. Returns { access, doc, name }.
export async function readShared(deckId, presentedToken) {
  const d = await db();
  if (!d || !deckId) return { access: "none" };
  try {
    const idxSnap = await d.doc("shares/" + deckId).get();
    if (!idxSnap.exists) return { access: "none" };
    const idx = idxSnap.data();
    const access = resolveShared(idx, presentedToken);
    if (access === "none") return { access: "none" };
    const deckSnap = await d.doc("users/" + idx.ownerUid + "/decks/" + deckId).get();
    if (!deckSnap.exists) return { access: "none" };
    const rec = deckSnap.data() || {};
    return { access, doc: rec.doc || null, name: rec.name || "Shared carousel" };
  } catch (e) {
    return { access: "none", error: true };
  }
}

// --- Admin console readers/writers (admin-only; the CALLER verifies admin) ----

// Every account for the console: merges Firebase Auth (email, display name, the
// `role` custom claim, last sign-in) with Firestore (monthly limit + this month's
// generation count). Fail-open to [] so the console degrades gracefully. Reads are
// bounded to 1000 accounts (a workspace, not a public app).
export async function listAccounts(nowMs) {
  const creds = adminCredentials();
  if (!creds) return [];
  try {
    const { getApps, initializeApp, cert } = await import("firebase-admin/app");
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(creds) });
    const { getAuth } = await import("firebase-admin/auth");
    const d = await db();
    const period = usagePeriodKey(nowMs);
    const res = await getAuth(app).listUsers(1000);
    const rows = [];
    for (const u of res.users) {
      let stored = null, used = 0;
      if (d) {
        try {
          const uSnap = await d.doc("users/" + u.uid).get();
          const ud = uSnap.exists ? uSnap.data() : null;
          stored = ud && ud.limits ? ud.limits.monthly : null;
        } catch (e) { /* unset → policy default below */ }
        try {
          const gSnap = await d.doc("usage/" + u.uid + "/months/" + period).get();
          used = (gSnap.exists && gSnap.data() && gSnap.data().count) || 0;
        } catch (e) { /* default 0 */ }
      }
      const role = normalizeRole(u.customClaims && u.customClaims.role);
      rows.push({
        uid: u.uid,
        email: u.email || "",
        name: u.displayName || (u.email ? u.email.split("@")[0] : "Account"),
        role,
        // The EFFECTIVE cap the console shows + enforces: policy default (75) for a
        // non-admin with no explicit limit, unlimited for admins, else the set value.
        limit: effectiveMonthlyLimit(role, stored),
        used,
        lastActive: (u.metadata && (u.metadata.lastSignInTime || u.metadata.lastRefreshTime)) || null,
      });
    }
    return rows;
  } catch (e) { return []; }
}

// Every account's decks (metadata only) for the admin All-decks view, via a
// collection-group query over all users' `decks` subcollections. The owner uid is
// recovered from the doc path. Fail-open to []. Never returns the heavy `doc`.
export async function listAllDecks() {
  const d = await db();
  if (!d) return [];
  try {
    const snap = await d.collectionGroup("decks").get();
    const decks = [];
    snap.forEach((doc) => {
      const r = doc.data() || {};
      const ownerUid = doc.ref.parent && doc.ref.parent.parent ? doc.ref.parent.parent.id : "";
      decks.push({ id: doc.id, ownerUid, name: r.name || "Untitled carousel", slideCount: r.slideCount || 0, updatedAt: r.updatedAt || 0 });
    });
    decks.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return decks;
  } catch (e) { return []; }
}

// Admin only: set an account's monthly generation cap at users/{uid}.limits.monthly
// (0 = unlimited). The caller MUST have already verified it is an admin.
export async function setUserLimit(targetUid, monthly) {
  const d = await db();
  if (!d || !targetUid) return false;
  try {
    const n = Math.max(0, Math.floor(Number(monthly) || 0));
    await d.doc("users/" + targetUid).set({ limits: { monthly: n } }, { merge: true });
    return true;
  } catch (e) { return false; }
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
