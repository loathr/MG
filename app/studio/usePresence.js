// usePresence.js — the live-presence layer (collab phase 1) wired to Firestore.
// Publishes my cursor / selection / slide + a heartbeat to presence/{deckId}/peers/
// {sessionId}, subscribes to everyone else's, and reaps stale peers. A no-op that
// returns an empty peer list when cloud is disabled or there's no signed-in user /
// open deck — so solo, offline editing is completely unchanged.
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { uid } from "./model";
import { livePeers, peerColor } from "./presence";
import { writePresence, watchPresence, clearPresence } from "./firebaseStore";

const TTL = 15000;        // a peer with no heartbeat for this long is "gone"
const FLUSH_MS = 150;     // how often we may push a changed cursor/selection
const HEARTBEAT_MS = 4000; // force a write at least this often (liveness)
const REAP_MS = 3000;     // recompute live peers on this tick (age out the stale)

export function usePresence({ deckId, user, enabled }) {
  const sessionId = useRef(null);
  if (!sessionId.current) sessionId.current = uid("sess");

  const me = useMemo(() => user ? {
    uid: user.uid,
    name: user.displayName || user.email || "Someone",
    color: peerColor(user.uid),
  } : null, [user]);

  const on = !!(enabled && deckId && me);

  const [records, setRecords] = useState({});
  const [tick, setTick] = useState(0);
  // Live pointer/selection, mutated cheaply on every event; flushed on an interval.
  const latest = useRef({ cursor: null, selection: [], slide: 0 });
  const lastWrite = useRef({ sig: "", ts: 0 });

  // Subscribe to the deck's presence collection.
  useEffect(() => {
    if (!on) { setRecords({}); return undefined; }
    const unsub = watchPresence(deckId, (recs) => setRecords(recs || {}));
    return () => unsub();
  }, [on, deckId]);

  // Publish my presence: push whenever cursor/selection/slide changed, or every
  // HEARTBEAT_MS regardless, so others see me as live and my stale record reaps
  // itself if I drop. Reads the live values from a ref so it binds once.
  useEffect(() => {
    if (!on) return undefined;
    const flush = () => {
      const l = latest.current;
      const sig = JSON.stringify([l.cursor, l.selection, l.slide]);
      const now = Date.now();
      if (sig === lastWrite.current.sig && now - lastWrite.current.ts < HEARTBEAT_MS) return;
      lastWrite.current = { sig, ts: now };
      writePresence(deckId, sessionId.current, { uid: me.uid, name: me.name, color: me.color, cursor: l.cursor, selection: l.selection, slide: l.slide });
    };
    flush();
    const iv = setInterval(flush, FLUSH_MS);
    return () => clearInterval(iv);
  }, [on, deckId, me]);

  // Reap tick — bump so the memo below re-filters stale peers even with no snapshot.
  useEffect(() => {
    if (!on) return undefined;
    const iv = setInterval(() => setTick((t) => t + 1), REAP_MS);
    return () => clearInterval(iv);
  }, [on]);

  // Clear my record when I leave (unmount or tab close).
  useEffect(() => {
    if (!on) return undefined;
    const leave = () => clearPresence(deckId, sessionId.current);
    window.addEventListener("beforeunload", leave);
    return () => { window.removeEventListener("beforeunload", leave); leave(); };
  }, [on, deckId]);

  const peers = useMemo(
    () => (on ? livePeers(records, sessionId.current, Date.now(), TTL) : []),
    [on, records, tick],
  );

  // Reporters the editor calls; they only touch the ref (the interval flushes).
  const reportCursor = (pt) => { latest.current.cursor = pt; };
  const reportSelection = (ids, slide) => { latest.current.selection = ids || []; latest.current.slide = slide; };

  return { peers, reportCursor, reportSelection, me };
}
