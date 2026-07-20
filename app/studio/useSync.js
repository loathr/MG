// useSync.js — wires the pure collab sync core (sync.js) to Firestore (collab
// phase 2). It watches the local doc, publishes the minimal ops for every change,
// and applies peers' ops as they arrive. A no-op when cloud is off / nobody's
// signed in / no open deck, so solo editing is unchanged.
//
// Echo suppression: when we apply a remote batch we predict the resulting doc with
// the SAME applyOps the reducer runs and stash it as `lastSynced`, so the publish
// effect diffs the real reducer output against that prediction and finds nothing to
// re-broadcast. Local edits still diff against the last published doc as normal.
"use client";
import { useEffect, useRef } from "react";
import { uid } from "./model";
import { diffDocs, applyOps } from "./sync";
import { publishEdits, watchEdits } from "./firebaseStore";
import { breadcrumb } from "./crashlog";

export function useSync({ deckId, doc, dispatch, editingId, enabled }) {
  const sessionId = useRef(null);
  if (!sessionId.current) sessionId.current = uid("edit");
  const on = !!(enabled && deckId && doc);

  const lastSynced = useRef(null);      // last doc whose state peers have seen
  const docRef = useRef(doc);           // live doc for the remote-apply predictor
  const editingRef = useRef(editingId); // live held element id
  docRef.current = doc;
  editingRef.current = editingId;

  // Apply a peer's batch, and pre-set lastSynced to the predicted result so the
  // publish effect doesn't bounce it straight back. Held via a ref so the stream
  // subscription binds once.
  const applyRemote = useRef(() => {});
  applyRemote.current = (ops) => {
    const held = editingRef.current ? [editingRef.current] : [];
    // Predict the reducer's result AND advance docRef, so a burst of batches (one
    // onSnapshot can deliver several, all synchronously before React re-renders)
    // predicts off the running result instead of the stale doc. Without this the
    // prediction misses earlier batches, the publish effect re-broadcasts them, and
    // two editors echo the ops back and forth forever (runaway autosave → tab dies).
    const next = applyOps(docRef.current, ops, { held });
    lastSynced.current = next;
    docRef.current = next;
    breadcrumb("sync:apply n=" + ops.length);
    dispatch({ type: "applyRemote", ops, held });
  };

  // Publish local changes: diff the current doc against what peers last saw. On the
  // first run (lastSynced null) diffDocs returns [] so we don't broadcast the whole
  // initial deck — we just adopt it as the baseline.
  useEffect(() => {
    if (!on) { lastSynced.current = null; return; }
    const base = lastSynced.current;
    lastSynced.current = doc;
    const ops = base ? diffDocs(base, doc) : [];
    if (ops.length) { breadcrumb("sync:publish n=" + ops.length); publishEdits(deckId, sessionId.current, ops); }
  }, [on, doc, deckId]);

  // Subscribe to peers' batches.
  useEffect(() => {
    if (!on) return undefined;
    const unsub = watchEdits(deckId, sessionId.current, (ops) => applyRemote.current(ops));
    return () => unsub();
  }, [on, deckId]);
}
