"use client";
import React, { useState } from "react";

// Caption panel — the ready-to-post Instagram caption for the deck. The caption
// is generated WITH the deck (folded into the same Opus call, so it shares the
// spine) and stored on doc.caption as plain text. Here the user edits it, copies
// it, or regenerates a fresh variation via a cheap Haiku call (onRegenerate).
// Pure presentational + clipboard; all generation lives in generate.js.

const wrap = {
  width: 300, flexShrink: 0, display: "flex", flexDirection: "column",
  background: "#1b1b1f", borderRight: "1px solid #2a2a2f", minHeight: 0,
  fontFamily: "Helvetica, Arial, sans-serif",
};
const head = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 8px" };
const xBtn = { width: 24, height: 24, lineHeight: "22px", textAlign: "center", background: "transparent", color: "#999", border: "none", cursor: "pointer", fontSize: 18, borderRadius: 5 };
const bar = { display: "flex", gap: 7, padding: "0 12px 10px" };
const prime = { flex: 1, height: 32, background: "#2d8cff", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 };
const ghost = { height: 32, padding: "0 11px", background: "#26262b", color: "#dcdcdc", border: "1px solid #36363c", borderRadius: 6, cursor: "pointer", fontSize: 12 };
const ta = { flex: 1, margin: "0 12px", minHeight: 0, background: "#202024", border: "1px solid #34343c", borderRadius: 8, padding: "11px 12px", color: "#e3e3e6", fontSize: 12.5, lineHeight: 1.5, resize: "none", fontFamily: "inherit", outline: "none" };
const meta = { display: "flex", justifyContent: "space-between", padding: "9px 14px 13px", fontSize: 11, color: "#7a7a82" };
const hint = { margin: "4px 12px", color: "#7a7a7a", fontSize: 12.5, lineHeight: 1.5, padding: "16px 4px", textAlign: "center" };

const LIMIT = 2200; // Instagram caption character cap

export default function CaptionPanel({ caption, onChange, onRegenerate, onClose }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = caption || "";
  const tags = (text.match(/#[\w]+/g) || []).length;
  const over = text.length > LIMIT;

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) {}
  };
  const regen = async () => {
    if (busy || !onRegenerate) return;
    setBusy(true);
    try { await onRegenerate(); } finally { setBusy(false); }
  };

  return (
    <div style={wrap}>
      <div style={head}>
        <strong style={{ fontSize: 12, letterSpacing: 0.5 }}>Caption</strong>
        <button style={xBtn} onClick={onClose} title="Close panel">×</button>
      </div>

      <div style={bar}>
        <button style={{ ...prime, opacity: text ? 1 : 0.5 }} onClick={copy} disabled={!text}>{copied ? "✓ Copied" : "📋 Copy caption"}</button>
        <button style={ghost} onClick={regen} disabled={busy} title="Rewrite the caption with a fresh angle">{busy ? "…" : "↻ Regenerate"}</button>
      </div>

      {text || busy ? (
        <>
          <textarea
            style={ta}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            placeholder={busy ? "Writing a caption…" : ""}
            spellCheck
          />
          <div style={meta}>
            <span style={{ color: over ? "#ff8a8a" : undefined }}>{text.length.toLocaleString()} / {LIMIT.toLocaleString()} characters</span>
            <span>{tags} hashtag{tags === 1 ? "" : "s"}</span>
          </div>
        </>
      ) : (
        <div style={hint}>No caption yet. Generate a deck and one is written automatically — or tap <b style={{ color: "#cfcfcf" }}>↻ Regenerate</b> to write one from this deck.</div>
      )}
    </div>
  );
}
