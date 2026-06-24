"use client";
import React, { useState } from "react";
import { STYLE_LIST, DEFAULT_STYLE } from "./styles";
import StylePreview from "./StylePreview";

// Screen 1 — Create (spec §4). Pick a look first, then type the topic, then one
// primary button. Nothing else competes for attention. A quiet secondary link
// opens a blank canvas without crowding the first screen.

export default function CreateScreen({ onGenerate, onBlank, generating, error }) {
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [topic, setTopic] = useState("");

  const submit = () => {
    const t = topic.trim();
    if (!t || generating) return;
    onGenerate({ style, topic: t });
  };

  return (
    <div style={screen}>
      <div style={col}>
        <div style={brand}>LOATHR STUDIO</div>

        <div style={label}>Choose a look</div>
        <div style={gallery}>
          {STYLE_LIST.map((s) => {
            const on = style === s.key;
            return (
              <button key={s.key} type="button" onClick={() => setStyle(s.key)} style={card(on)}>
                <div style={{ borderRadius: 6, overflow: "hidden", lineHeight: 0, boxShadow: "0 6px 18px rgba(0,0,0,0.45)" }}>
                  <StylePreview style={s} width={150} />
                </div>
                <div style={cardLabel(on)}>{s.label}</div>
                <div style={cardBlurb}>{s.blurb}</div>
              </button>
            );
          })}
        </div>

        <div style={{ ...label, marginTop: 30 }}>What&apos;s it about?</div>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="e.g. the rise of women&apos;s football"
          autoFocus
          style={topicInput}
        />

        {error && <div style={errBox}>{error}</div>}

        <button onClick={submit} disabled={generating || !topic.trim()} style={primary(generating || !topic.trim())}>
          {generating ? "Making your carousel…" : "✨  Make my carousel"}
        </button>

        <button type="button" onClick={onBlank} style={blankLink}>Start from a blank canvas</button>
      </div>
    </div>
  );
}

const screen = {
  position: "absolute", inset: 0, display: "grid", placeItems: "center",
  overflow: "auto", padding: 24,
  background: "radial-gradient(1100px 600px at 50% -10%, #232329 0%, #161618 55%, #121214 100%)",
  fontFamily: "Helvetica, Arial, sans-serif",
};
const col = { width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" };
const brand = { fontSize: 13, letterSpacing: 4, color: "#cfcfcf", fontWeight: 700, marginBottom: 36 };
const label = { fontSize: 13, letterSpacing: 1, color: "#8f8f97", marginBottom: 14, textTransform: "uppercase" };
const gallery = { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" };

function card(on) {
  return {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    padding: 10, width: 174, borderRadius: 10, cursor: "pointer",
    background: on ? "#222228" : "transparent",
    border: "1.5px solid " + (on ? "#2d8cff" : "#2c2c32"),
    transition: "border-color 120ms, background 120ms",
  };
}
function cardLabel(on) {
  return { fontSize: 14, fontWeight: 600, color: on ? "#fff" : "#d8d8d8", marginTop: 2 };
}
const cardBlurb = { fontSize: 11, color: "#7f7f87", lineHeight: 1.3 };

const topicInput = {
  width: "100%", height: 52, padding: "0 18px", fontSize: 17,
  background: "#1d1d21", color: "#fff", border: "1px solid #3a3a42", borderRadius: 10,
  textAlign: "center", outline: "none",
};
const errBox = { marginTop: 14, padding: "8px 12px", background: "#3a1f22", color: "#ff9a9a", fontSize: 13, borderRadius: 8 };
function primary(disabled) {
  return {
    marginTop: 22, height: 52, padding: "0 28px", minWidth: 260,
    fontSize: 16, fontWeight: 700, letterSpacing: 0.3,
    background: disabled ? "#2d8cff55" : "#2d8cff", color: "#fff",
    border: "none", borderRadius: 12, cursor: disabled ? "default" : "pointer",
    boxShadow: disabled ? "none" : "0 8px 24px rgba(45,140,255,0.35)",
  };
}
const blankLink = {
  marginTop: 16, background: "transparent", border: "none", color: "#8f8f97",
  fontSize: 13, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3,
};
