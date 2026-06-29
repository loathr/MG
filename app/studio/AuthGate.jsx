"use client";
import React, { useEffect, useState } from "react";
import { isCloudEnabled } from "./cloud";
import { onAuthChange, signInWithGoogle } from "./firebaseClient";

// Wraps the whole Studio. When the cloud layer is DISABLED (no Firebase config)
// it renders children unchanged — today's open, local-only flow. When ENABLED it
// requires Google sign-in first (CLOUD_SETUP.md). The gate is structural: nothing
// downstream renders until there's a user, so unsigned visitors can't reach the
// editor or the (token-gated) generate route.
export default function AuthGate({ children }) {
  const enabled = isCloudEnabled();
  const [user, setUser] = useState(undefined); // undefined = still resolving
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!enabled) return undefined;
    return onAuthChange(setUser);
  }, [enabled]);

  if (!enabled) return children;                 // cloud off → unchanged
  if (user === undefined) return <Splash />;     // resolving auth state
  if (user) return children;                     // signed in

  const go = async () => {
    setBusy(true); setErr("");
    try { await signInWithGoogle(); } // onAuthChange flips us into the app
    catch (e) { setErr((e && e.message) || "Sign-in failed"); setBusy(false); }
  };
  return <SignIn onGoogle={go} busy={busy} err={err} />;
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

const screen = {
  position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 24,
  background: "radial-gradient(1100px 600px at 50% -10%, #0f0f0f 0%, #070707 55%, #000 100%)",
  fontFamily: "Helvetica, Arial, sans-serif",
};
const card = { width: "100%", maxWidth: 340, background: "#0d0d10", border: "1px solid #20202a", borderRadius: 16, padding: "40px 32px", textAlign: "center" };
const brand = { fontSize: 14, letterSpacing: 4, color: "#cfcfcf", fontWeight: 700, marginBottom: 8 };
const tag = { fontSize: 12.5, color: "#82828b", marginBottom: 30 };
const gbtn = {
  width: "100%", height: 48, background: "#fff", color: "#1f1f1f", border: "none", borderRadius: 10,
  fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 11, cursor: "pointer",
};
const glyph = { width: 18, height: 18, borderRadius: "50%", background: "conic-gradient(#ea4335 0 25%, #fbbc05 25% 50%, #34a853 50% 75%, #4285f4 75% 100%)" };
const errBox = { marginTop: 14, padding: "8px 12px", background: "#3a1f22", color: "#ff9a9a", fontSize: 12.5, borderRadius: 8 };
const fine = { fontSize: 10.5, color: "#5f5f68", marginTop: 18, lineHeight: 1.5 };
