// useSharedLive.js — the ANONYMOUS shared-editor live layer. A share-link editor
// has no Firebase auth, so it can't use the Firestore onSnapshot path (usePresence /
// useSync). Instead it SHORT-POLLS a token-authorized relay (/api/shared/live) that
// reads/writes the same presence + edits collections via the Admin SDK. One
// round-trip per tick both publishes my cursor + ops and returns the room's presence
// + new ops. Adaptive, visibility-gated cadence keeps a solo/idle guest near silent.
// A no-op (empty peers) unless enabled, so it never touches anything for a normal
// signed-in editor. Same { peers, reportCursor, reportSelection } surface as
// usePresence, so Studio renders anon peers identically.
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { uid } from "./model";
import { livePeers } from "./presence";
import { diffDocs, applyOps } from "./sync";
import { sharedIdentity, collectOps, pollDelay } from "./livesync";

const TTL = 15000;         // a peer with no heartbeat for this long is "gone"
const HEARTBEAT_MS = 4000; // force a presence write at least this often (liveness)
const ACTIVE_MS = 3000;    // "active" window after a cursor/selection change

export function useSharedLive({ deckId, token, doc, dispatch, editingId, enabled, user }) {
  const sessionId = useRef(null);
  if (!sessionId.current) sessionId.current = uid("anon");
  // A share-link editor who IS signed in shows their real name + a stable colour from
  // their uid (like any peer); only a truly anonymous visitor falls back to "Guest".
  const me = useMemo(() => sharedIdentity(user, sessionId.current), [user]);
  const on = !!(enabled && deckId && token && doc);

  const [records, setRecords] = useState({});
  const [tick, setTick] = useState(0);

  // Live pointer/selection (mutated cheaply on every event; read by the poll loop).
  const latest = useRef({ cursor: null, selection: [], slide: 0, editing: false });
  const lastPresence = useRef({ sig: "", ts: 0 });
  const lastActivity = useRef(0);

  // Op sync state (mirrors useSync): last doc peers have seen, live doc for the
  // remote-apply predictor, the held element, and my since-cursor into the stream.
  const lastSynced = useRef(null);
  const docRef = useRef(doc); docRef.current = doc;
  const editingRef = useRef(editingId); editingRef.current = editingId;
  const since = useRef(null);

  // Apply a peer batch and pre-set lastSynced to the predicted result so my next
  // poll's diff doesn't bounce it straight back.
  const applyRemote = useRef(() => {});
  applyRemote.current = (ops) => {
    const held = editingRef.current ? [editingRef.current] : [];
    lastSynced.current = applyOps(docRef.current, ops, { held });
    dispatch({ type: "applyRemote", ops, held });
  };

  // The single poll loop: adaptive setTimeout, one relay round-trip per tick.
  useEffect(() => {
    if (!on) { setRecords({}); lastSynced.current = null; since.current = null; return undefined; }
    let alive = true;
    let timer = null;

    const step = async () => {
      if (!alive) return;
      const now = Date.now();
      const hidden = typeof document !== "undefined" && document.hidden;

      // Presence: send when it changed, or every HEARTBEAT_MS for liveness.
      const l = latest.current;
      const sig = JSON.stringify([l.cursor, l.selection, l.slide, l.editing]);
      let presence = null;
      if (sig !== lastPresence.current.sig || now - lastPresence.current.ts >= HEARTBEAT_MS) {
        lastPresence.current = { sig, ts: now };
        presence = { uid: sessionId.current, name: me.name, color: me.color, anon: me.anon, cursor: l.cursor, selection: l.selection, slide: l.slide, editing: l.editing };
      }

      // Ops: everything peers haven't seen since my last publish (coalesced).
      const base = lastSynced.current;
      lastSynced.current = docRef.current;
      const ops = base ? diffDocs(base, docRef.current) : [];

      try {
        const res = await fetch("/api/shared/live?deck=" + encodeURIComponent(deckId) + "&s=" + encodeURIComponent(token), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionId.current, presence, ops, since: since.current }),
        });
        if (res.ok && alive) {
          const data = await res.json();
          if (data && data.ok) {
            setRecords(data.peers || {});
            const got = collectOps(data.batches, sessionId.current, since.current);
            since.current = data.cursor != null ? data.cursor : got.cursor;
            if (got.ops.length) applyRemote.current(got.ops);
          }
        }
      } catch (e) { /* best-effort — try again next tick */ }

      if (!alive) return;
      const active = now - lastActivity.current < ACTIVE_MS;
      const hasPeers = Object.keys(records).length > 0;
      timer = setTimeout(step, pollDelay({ hasPeers, active, hidden }));
    };
    step();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [on, deckId, token]);

  // Reap tick — age out stale peers even between polls.
  useEffect(() => {
    if (!on) return undefined;
    const iv = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(iv);
  }, [on]);

  // Drop my presence when I leave (keepalive so it flushes on tab close).
  useEffect(() => {
    if (!on) return undefined;
    const leave = () => {
      try {
        fetch("/api/shared/live?deck=" + encodeURIComponent(deckId) + "&s=" + encodeURIComponent(token), {
          method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionId.current, leave: true }),
        });
      } catch (e) { /* best-effort */ }
    };
    window.addEventListener("beforeunload", leave);
    return () => { window.removeEventListener("beforeunload", leave); leave(); };
  }, [on, deckId, token]);

  const peers = useMemo(
    () => (on ? livePeers(records, sessionId.current, Date.now(), TTL) : []),
    [on, records, tick],
  );

  const reportCursor = (pt) => { latest.current.cursor = pt; lastActivity.current = Date.now(); };
  const reportSelection = (ids, slide, editing) => { latest.current.selection = ids || []; latest.current.slide = slide; latest.current.editing = !!editing; lastActivity.current = Date.now(); };

  return { peers, reportCursor, reportSelection };
}
