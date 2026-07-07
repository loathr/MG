// Server-side Admin-SDK store: usage metering + role assignment. Loaded LAZILY
// and only when admin credentials are configured (same gate as _auth) — an
// unconfigured deploy never pulls firebase-admin in, and every helper is a safe
// no-op. The DECISIONS (quota math, period bucketing) live in the pure, tested
// authority.js; this module only does the Firestore/Auth I/O around them, and
// fails OPEN on any error so a metering blip can never block generation.

import { adminCredentials } from "./authCore";
import { quotaCheck, usagePeriodKey, normalizeRole, effectiveMonthlyLimit } from "../studio/authority";
import { resolveShared } from "../studio/sharing";
import { collectImageData, imageKey, rewriteImages } from "../studio/cloud";

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

// The Admin Storage bucket for server-side image offload (shared-edit write-back).
// Bucket name from the public config, or the project's default. null when Storage
// isn't configured → images stay inline (small decks only), matching the client.
let _bucket = null;
async function bucket() {
  const creds = adminCredentials();
  if (!creds) return null;
  const name = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || (creds.projectId ? creds.projectId + ".appspot.com" : null);
  if (!name) return null;
  if (!_bucket) {
    const { getApps, initializeApp, cert } = await import("firebase-admin/app");
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(creds) });
    const { getStorage } = await import("firebase-admin/storage");
    _bucket = getStorage(app).bucket(name);
  }
  return _bucket;
}

// Server-side twin of firebaseStore.uploadDeckImages: push every embedded data:
// image to the owner's deck folder (same content-hashed path the client uses, so
// they dedupe) and rewrite the doc to tokened download URLs. A failed upload leaves
// that one image inline rather than aborting. Used when a shared EDITOR (who has no
// Firebase auth of their own) saves back through the token.
async function offloadImagesAdmin(ownerUid, deckId, doc) {
  const datas = collectImageData(doc);
  if (!datas.length) return doc;
  const b = await bucket();
  if (!b) return doc;
  const { randomUUID } = await import("crypto");
  const map = {};
  for (const dataUrl of datas) {
    try {
      const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
      if (!m) continue;
      const contentType = m[1];
      const buf = Buffer.from(m[2], "base64");
      const path = "users/" + ownerUid + "/decks/" + deckId + "/" + imageKey(dataUrl);
      const token = randomUUID();
      await b.file(path).save(buf, { contentType, resumable: false, metadata: { metadata: { firebaseStorageDownloadTokens: token } } });
      map[dataUrl] = "https://firebasestorage.googleapis.com/v0/b/" + b.name + "/o/" + encodeURIComponent(path) + "?alt=media&token=" + token;
    } catch (e) { /* leave this image inline; the rest still offload */ }
  }
  return rewriteImages(doc, map);
}

// Persist a shared EDITOR's changes back to the owner's deck, authorised by the
// share token (not a user session — the token IS the capability, matching readShared).
// Verifies the token grants EDIT, offloads embedded images, writes the doc, and
// bumps the pulse so live viewers/owner refetch. Whole-doc, last-writer-wins.
// Returns { ok, access }; { ok:false } when the token doesn't grant edit.
export async function writeShared(deckId, presentedToken, doc) {
  const d = await db();
  if (!d || !deckId || !doc) return { ok: false, access: "none" };
  try {
    const idxSnap = await d.doc("shares/" + deckId).get();
    if (!idxSnap.exists) return { ok: false, access: "none" };
    const access = resolveShared(idxSnap.data(), presentedToken);
    if (access !== "edit") return { ok: false, access };   // view / none can't write
    const ownerUid = idxSnap.data().ownerUid;
    const offloaded = await offloadImagesAdmin(ownerUid, deckId, doc);
    const now = Date.now();
    await d.doc("users/" + ownerUid + "/decks/" + deckId).set(
      { doc: offloaded, updatedAt: now, slideCount: (offloaded.slides || []).length }, { merge: true });
    try { await d.doc("sharePulse/" + deckId).set({ updatedAt: now }, { merge: true }); } catch (e) { /* pulse best-effort */ }
    return { ok: true, access: "edit" };
  } catch (e) {
    return { ok: false, access: "none", error: true };
  }
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

// Admin only: read ANY user's deck by owner uid + deck id, bypassing rules via
// the Admin SDK (an admin has no Firestore path to another user's decks
// otherwise). Returns { name, doc } or { doc:null } when absent. Read-only — the
// console never writes back through this. The CALLER MUST have verified admin.
export async function readAnyDeck(ownerUid, deckId) {
  const d = await db();
  if (!d || !ownerUid || !deckId) return { doc: null };
  try {
    const snap = await d.doc("users/" + ownerUid + "/decks/" + deckId).get();
    if (!snap.exists) return { doc: null };
    const rec = snap.data() || {};
    return { doc: rec.doc || null, name: rec.name || "Carousel" };
  } catch (e) {
    return { doc: null, error: true };
  }
}

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
        disabled: !!u.disabled, // suspended accounts can't sign in
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

// Admin only: enable/disable an account (REVERSIBLE). Disabling flips the Firebase
// Auth `disabled` flag, which blocks sign-in and revokes tokens immediately. The
// caller MUST have already verified it is an admin (and that it isn't self).
export async function setUserDisabled(targetUid, disabled) {
  const creds = adminCredentials();
  if (!creds || !targetUid) return false;
  const { getApps, initializeApp, cert } = await import("firebase-admin/app");
  const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(creds) });
  const { getAuth } = await import("firebase-admin/auth");
  await getAuth(app).updateUser(targetUid, { disabled: !!disabled });
  return true;
}

// Admin only: PERMANENTLY delete an account — the Firebase Auth user, and (when
// deleteDecks, the default) all their Firestore data: decks + each deck's share
// index/pulse + the usage counters + the user doc. Irreversible. Best-effort on
// the data purge (fail-open) but the Auth user deletion is awaited. The caller
// MUST have verified admin + not-self.
export async function deleteAccount(targetUid, deleteDecks) {
  const creds = adminCredentials();
  if (!creds || !targetUid) return false;
  if (deleteDecks !== false) {
    const d = await db();
    if (d) {
      try {
        const decks = await d.collection("users/" + targetUid + "/decks").get();
        for (const doc of decks.docs) {
          try { await doc.ref.delete(); } catch (e) { /* skip */ }
          try { await d.doc("shares/" + doc.id).delete(); } catch (e) { /* skip */ }
          try { await d.doc("sharePulse/" + doc.id).delete(); } catch (e) { /* skip */ }
        }
        const months = await d.collection("usage/" + targetUid + "/months").get();
        for (const m of months.docs) { try { await m.ref.delete(); } catch (e) { /* skip */ } }
        try { await d.doc("users/" + targetUid).delete(); } catch (e) { /* skip */ }
      } catch (e) { /* best-effort purge — still delete the Auth user below */ }
    }
  }
  const { getApps, initializeApp, cert } = await import("firebase-admin/app");
  const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(creds) });
  const { getAuth } = await import("firebase-admin/auth");
  await getAuth(app).deleteUser(targetUid);
  return true;
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
