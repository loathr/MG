"use client";
import { cloudConfig, projectRecord, docFromRecord } from "./cloud";

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

// Create or update a user's deck. Returns the deck id (a new one when `id` is
// null). `now`/`createdAt` are stamped by the caller (projectRecord shape).
export async function saveDeck(uid, id, doc, opts) {
  const d = await db(); if (!d || !uid) return null;
  const fs = await import("firebase/firestore");
  const col = fs.collection(d, "users", uid, "decks");
  const ref = id ? fs.doc(col, id) : fs.doc(col);
  const rec = projectRecord(doc, Object.assign({ id: ref.id }, opts || {}));
  await fs.setDoc(ref, rec, { merge: true });
  return ref.id;
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
