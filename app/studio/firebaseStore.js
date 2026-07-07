"use client";
import { cloudConfig, projectRecord, docFromRecord, collectImageData, imageKey, rewriteImages } from "./cloud";
import { shareIndex, sharePulse } from "./sharing";

// Guarded Firestore adapter for deck storage. The firebase SDK loads LAZILY and
// only when cloud is configured; every call is a safe no-op (null / []) when
// disabled. Decks live per-user at users/{uid}/decks/{id} — isolation is enforced
// server-side by the Firestore security rules (CLOUD_SETUP.md), not client trust.

let _dbPromise = null;
async function db() {
  const cfg = cloudConfig();
  if (!cfg || typeof window === "undefined") return null;
  if (!_dbPromise) {
    _dbPromise = (async () => {
      const { initializeApp, getApps } = await import("firebase/app");
      const app = getApps().length ? getApps()[0] : initializeApp(cfg);
      const { getFirestore } = await import("firebase/firestore");
      return getFirestore(app);
    })();
  }
  return _dbPromise;
}

// Lazy Cloud Storage handle — only when a bucket is configured. Used to offload
// embedded images so the Firestore doc stays under the 1 MB limit (Cloud 11c).
let _storagePromise = null;
async function storage() {
  const cfg = cloudConfig();
  if (!cfg || !cfg.storageBucket || typeof window === "undefined") return null;
  if (!_storagePromise) {
    _storagePromise = (async () => {
      const { initializeApp, getApps } = await import("firebase/app");
      const app = getApps().length ? getApps()[0] : initializeApp(cfg);
      const { getStorage } = await import("firebase/storage");
      return getStorage(app);
    })();
  }
  return _storagePromise;
}

// Push every embedded `data:` image in `doc` to Storage under the deck's folder
// and return the doc rewritten to download URLs. No bucket configured (or no
// embedded images) → returns the doc unchanged (today's inline behaviour). A
// single failed upload leaves just that image inline rather than aborting save.
export async function uploadDeckImages(uid, deckId, doc) {
  const st = await storage();
  if (!st || !uid) return doc;
  const datas = collectImageData(doc);
  if (!datas.length) return doc;
  const sm = await import("firebase/storage");
  const map = {};
  for (const dataUrl of datas) {
    try {
      const r = sm.ref(st, "users/" + uid + "/decks/" + deckId + "/" + imageKey(dataUrl));
      await sm.uploadString(r, dataUrl, "data_url");
      map[dataUrl] = await sm.getDownloadURL(r);
    } catch (e) { /* leave this image inline; the rest still offload */ }
  }
  return rewriteImages(doc, map);
}

// Create or update a user's deck. Returns the deck id (a new one when `id` is
// null). `now`/`createdAt` are stamped by the caller (projectRecord shape).
// Embedded images are offloaded to Storage first (Cloud 11c); opts.onUploading
// (optional) fires once before that step so the UI can show an "uploading" beat.
export async function saveDeck(uid, id, doc, opts) {
  const d = await db(); if (!d || !uid) return null;
  const fs = await import("firebase/firestore");
  const col = fs.collection(d, "users", uid, "decks");
  const ref = id ? fs.doc(col, id) : fs.doc(col);
  const o = opts || {};
  if (o.onUploading && collectImageData(doc).length) o.onUploading();
  const stored = await uploadDeckImages(uid, ref.id, doc);
  const rec = projectRecord(stored, Object.assign({ id: ref.id }, o));
  await fs.setDoc(ref, rec, { merge: true });
  // Maintain the top-level shares/{deckId} index so a share link (deck id + token,
  // no owner uid) is resolvable by the server. Written when shared, removed when
  // off. Best-effort — a share-index hiccup never fails the save.
  try {
    const idx = shareIndex(stored.share, uid, ref.id);
    const sref = fs.doc(d, "shares", ref.id);
    if (idx) await fs.setDoc(sref, idx, { merge: true });
    else await fs.deleteDoc(sref);
    // Token-less public pulse for real-time viewers (onSnapshot): bump on every
    // save while shared, remove when unshared. Carries only a timestamp.
    const pulse = sharePulse(stored.share, rec.updatedAt);
    const pref = fs.doc(d, "sharePulse", ref.id);
    if (pulse) await fs.setDoc(pref, pulse, { merge: true });
    else await fs.deleteDoc(pref);
  } catch (e) { /* index + pulse are best-effort */ }
  return ref.id;
}

// Real-time subscription to a shared deck's token-less pulse doc: cb() fires on
// every bump the owner's save makes, so the viewer can re-fetch the validated
// deck. Returns an unsubscribe fn; a safe no-op when cloud is disabled or the
// listener errors (the viewer keeps its fallback poll). Browser-only.
export function watchSharePulse(deckId, cb) {
  let unsub = () => {};
  if (!deckId) return () => {};
  db().then((d) => {
    if (!d) return;
    import("firebase/firestore").then(({ doc, onSnapshot }) => {
      unsub = onSnapshot(
        doc(d, "sharePulse", deckId),
        () => { try { cb(); } catch (e) { /* ignore */ } },
        () => { /* permission/other error → viewer keeps polling */ },
      );
    }).catch(() => {});
  }).catch(() => {});
  return () => unsub();
}

// ---------------------------------------------------------------------------
// Live presence (collab phase 1) — who's editing a deck right now, their cursor
// and selection. Kept in an EPHEMERAL sibling collection presence/{deckId}/peers/
// {sessionId}, never in the deck doc, so it never bloats the 1 MB deck or touches
// undo/save. Every call is best-effort and a safe no-op when cloud is disabled.
// ---------------------------------------------------------------------------

// Write/refresh my presence record (heartbeat). `data` carries uid/name/color and
// the live cursor/selection/slide; ts is stamped here for the freshness reap.
export async function writePresence(deckId, sessionId, data) {
  const d = await db(); if (!d || !deckId || !sessionId) return;
  try {
    const fs = await import("firebase/firestore");
    await fs.setDoc(fs.doc(d, "presence", deckId, "peers", sessionId), Object.assign({}, data, { ts: Date.now() }), { merge: true });
  } catch (e) { /* presence is best-effort */ }
}

// Subscribe to everyone's presence on a deck: cb(records) fires with a map of
// {sessionId: record} on every change. Returns an unsubscribe fn; a safe no-op
// when cloud is off or the listener errors. Browser-only.
export function watchPresence(deckId, cb) {
  let unsub = () => {};
  if (!deckId) return () => {};
  db().then((d) => {
    if (!d) return;
    import("firebase/firestore").then(({ collection, onSnapshot }) => {
      unsub = onSnapshot(
        collection(d, "presence", deckId, "peers"),
        (snap) => { const recs = {}; snap.forEach((s) => { recs[s.id] = s.data(); }); try { cb(recs); } catch (e) { /* ignore */ } },
        () => { /* permission/other error → presence just stays empty */ },
      );
    }).catch(() => {});
  }).catch(() => {});
  return () => unsub();
}

// Drop my presence record on leave (unmount / tab close). Best-effort.
export async function clearPresence(deckId, sessionId) {
  const d = await db(); if (!d || !deckId || !sessionId) return;
  try {
    const fs = await import("firebase/firestore");
    await fs.deleteDoc(fs.doc(d, "presence", deckId, "peers", sessionId));
  } catch (e) { /* best-effort */ }
}

// The full deck doc for one project, or null.
export async function loadDeck(uid, id) {
  const d = await db(); if (!d || !uid || !id) return null;
  const fs = await import("firebase/firestore");
  const snap = await fs.getDoc(fs.doc(d, "users", uid, "decks", id));
  return snap.exists() ? docFromRecord(snap.data()) : null;
}

// A user's decks as list metadata (id + name + slideCount + updatedAt), newest
// first — never the heavy docs, so the Projects grid stays light.
export async function listDecks(uid) {
  const d = await db(); if (!d || !uid) return [];
  const fs = await import("firebase/firestore");
  const q = fs.query(fs.collection(d, "users", uid, "decks"), fs.orderBy("updatedAt", "desc"));
  const snap = await fs.getDocs(q);
  return snap.docs.map((s) => {
    const r = s.data() || {};
    return { id: s.id, name: r.name || "Untitled carousel", slideCount: r.slideCount || 0, updatedAt: r.updatedAt || 0 };
  });
}

export async function deleteDeck(uid, id) {
  const d = await db(); if (!d || !uid || !id) return;
  const fs = await import("firebase/firestore");
  await fs.deleteDoc(fs.doc(d, "users", uid, "decks", id));
}
