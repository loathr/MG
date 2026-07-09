"use client";
import React, { useEffect, useState } from "react";
import { isCloudEnabled } from "./cloud";
import { onAuthChange, signInWithGoogle, signOutCloud, fetchAccessStatus, requestAccess } from "./firebaseClient";

// Wraps the whole Studio. When the cloud layer is DISABLED (no Firebase config)
// it renders children unchanged — today's open, local-only flow. When ENABLED it
// requires Google sign-in first (CLOUD_SETUP.md), THEN checks the account's access
// status: an allow-listed (or admin-approved) account enters; anyone else lands on
// the request-access flow (request → pending → approved/denied) instead of the
// editor. The gate is structural: nothing downstream renders without an approved
// user, and every gated route re-checks server-side.
export default function AuthGate({ children }) {
  const enabled = isCloudEnabled();
  const [user, setUser] = useState(undefined); // undefined = still resolving
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [access, setAccess] = useState(null); // null = not yet checked; else { status }

  useEffect(() => {
    if (!enabled) return undefined;
    return onAuthChange((u) => { setUser(u); setAccess(null); });
  }, [enabled]);

  // Once signed in, resolve this account's server-side access status.
  useEffect(() => {
    if (!enabled || !user) return;
    let live = true;
    fetchAccessStatus().then((r) => { if (live) setAccess(r || { status: "none" }); });
    return () => { live = false; };
  }, [enabled, user]);

  if (!enabled) return children;                 // cloud off → unchanged
  if (user === undefined) return <Splash />;     // resolving auth state

  const go = async () => {
    setBusy(true); setErr("");
    try { await signInWithGoogle(); } // onAuthChange flips us forward
    catch (e) { setErr((e && e.message) || "Sign-in failed"); }
    finally { setBusy(false); }
  };
  const out = async () => { try { await signOutCloud(); } catch (e) { /* ignore */ } };

  if (!user) return <SignIn onGoogle={go} busy={busy} err={err} />;
  if (access === null) return <Splash />;        // checking access
  if (access.status === "approved") return children;
  return <AccessFlow user={user} status={access.status} note={access.note} onOut={out} onRequested={(r) => setAccess(r)} />;
}

function Splash() {
  return <div style={screen}><div style={{ color: "#7a7a82", fontSize: 13, letterSpacing: 1 }}>loading…</div></div>;
}

function SignIn({ onGoogle, busy, err }) {
  return (
    <div style={screen}>
      <div style={card}>
        <div style={brand}>loathrdotcom</div>
        <div style={tag}>Studio</div>
        <button type="button" onClick={onGoogle} disabled={busy} style={gbtn}>
          <span style={glyph} /> {busy ? "Opening Google…" : "Continue with Google"}
        </button>
        {err ? <div style={errBox}>{err}</div> : null}
        <div style={fine}>Your decks are saved to your account and visible only to you. We store the deck and any images you upload — nothing else.</div>
      </div>
    </div>
  );
}

// Everything after sign-in for a not-yet-approved account: the request form
// ("none"), the pending note, or the denied note.
function AccessFlow({ user, status, note, onOut, onRequested }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const initial = (user.displayName || user.email || "?").slice(0, 1).toUpperCase();

  const submit = async () => {
    setBusy(true);
    try { const r = await requestAccess(text); onRequested(r || { status: "pending" }); }
    finally { setBusy(false); }
  };

  return (
    <div style={screen}>
      <div style={card}>
        <div style={brand}>loathrdotcom</div>
        {status !== "denied" ? <div style={tag}>Studio</div> : null}
        <div style={who}>
          <span style={{ ...avatar, background: avColor(user.uid || user.email || "?") }}>{initial}</span>
          <span style={whoEmail}>{user.email}</span>
        </div>

        {status === "pending" && (
          <>
            <div style={{ ...banner, ...bPending }}><b>◷ </b>Request pending. We&rsquo;ll notify this address once an admin reviews it.</div>
            <button type="button" onClick={onOut} style={ghostBtn}>Sign out</button>
            <div style={fine}>Nothing to do here yet — you can close this tab.</div>
          </>
        )}

        {status === "denied" && (
          <>
            <div style={{ ...banner, ...bDenied }}><b>✕ </b>Access wasn&rsquo;t granted for this account. Contact whoever invited you if you think this is a mistake.{note ? <div style={{ marginTop: 6, opacity: 0.85 }}>{note}</div> : null}</div>
            <button type="button" onClick={onOut} style={ghostBtn}>Sign out</button>
          </>
        )}

        {status !== "pending" && status !== "denied" && (
          <>
            <div style={{ ...banner, ...bInfo }}>This account isn&rsquo;t on the access list yet. Request access and an admin will review it.</div>
            <div style={lbl}>Add a note (optional)</div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. what you're working on, who invited you" style={noteBox} />
            <button type="button" onClick={submit} disabled={busy} style={submitBtn}>{busy ? "Requesting…" : "Request access"}</button>
            <button type="button" onClick={onOut} style={{ ...ghostBtn, marginTop: 8 }}>Sign out</button>
          </>
        )}
      </div>
    </div>
  );
}

// Stable per-account avatar colour (matches AdminConsole.avColor — no randomness).
function avColor(seed) {
  const palette = ["#6d3bd1", "#2d8cff", "#e0603a", "#3aa76d", "#b07a2d", "#c0508a", "#3a9db0"];
  let h = 0; for (let i = 0; i < String(seed).length; i++) h = (h * 31 + String(seed).charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

const screen = {
  position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 24,
  background: "radial-gradient(1100px 600px at 50% -10%, #0f0f0f 0%, #070707 55%, #000 100%)",
  fontFamily: "Helvetica, Arial, sans-serif",
};
const card = { width: "100%", maxWidth: 340, background: "#0d0d10", border: "1px solid #20202a", borderRadius: 16, padding: "40px 32px", textAlign: "center" };
const brand = { fontSize: 14, letterSpacing: 4, color: "#cfcfcf", fontWeight: 700, marginBottom: 8 };
const tag = { fontSize: 12.5, color: "#82828b", marginBottom: 24 };
const gbtn = {
  width: "100%", height: 48, background: "#fff", color: "#1f1f1f", border: "none", borderRadius: 10,
  fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 11, cursor: "pointer",
};
const glyph = { width: 18, height: 18, borderRadius: "50%", background: "conic-gradient(#ea4335 0 25%, #fbbc05 25% 50%, #34a853 50% 75%, #4285f4 75% 100%)" };
const errBox = { marginTop: 14, padding: "8px 12px", background: "#3a1f22", color: "#ff9a9a", fontSize: 12.5, borderRadius: 8 };
const fine = { fontSize: 10.5, color: "#5f5f68", marginTop: 18, lineHeight: 1.5 };

const who = { display: "flex", alignItems: "center", gap: 9, justifyContent: "center", marginBottom: 16 };
const avatar = { width: 30, height: 30, borderRadius: "50%", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" };
const whoEmail = { fontSize: 12, color: "#b6b6be", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const banner = { borderRadius: 10, padding: "12px 13px", fontSize: 12, lineHeight: 1.5, textAlign: "left", marginBottom: 14 };
const bInfo = { background: "#181820", border: "1px solid #2a2a34", color: "#b6b6be" };
const bPending = { background: "#2a2410", border: "1px solid #574a1c", color: "#e6cf8a" };
const bDenied = { background: "#2a1719", border: "1px solid #5a3030", color: "#ffab9d" };
const lbl = { fontSize: 11, color: "#7d7d85", textAlign: "left", margin: "4px 0 3px" };
const noteBox = { width: "100%", boxSizing: "border-box", minHeight: 66, resize: "none", background: "#111114", border: "1px solid #2c2c32", borderRadius: 9, color: "#eaeaea", fontSize: 12.5, padding: "9px 11px", fontFamily: "inherit", outline: "none" };
const submitBtn = { width: "100%", height: 44, marginTop: 12, borderRadius: 10, border: "none", fontSize: 13.5, fontWeight: 600, background: "#6d3bd1", color: "#fff", cursor: "pointer" };
const ghostBtn = { width: "100%", height: 42, borderRadius: 10, fontSize: 13, background: "#1c1c20", color: "#cfcfd4", border: "1px solid #2c2c32", cursor: "pointer" };
