"use client";
import React, { useState } from "react";
import { UI } from "./theme";
import { STYLE_LIST, DEFAULT_STYLE, BRAND_FONT } from "./styles";
import { CATEGORY_LIST, getCategory } from "./categories";
import StylePreview from "./StylePreview";
import TrendingPanel from "./TrendingPanel";

// Screen 1 — Create (spec §4, Option C: "segment-first + voice override"). Pick a
// DESK first — the look (Editorial / Enterprise / News Desk). Each desk implies a
// writing voice and offers a few topic ideas; type the topic (or tap an idea),
// then one primary button. A collapsed "Advanced · Writing voice" lets a power
// user decouple voice from look (e.g. a Business voice in the Editorial look)
// without adding any concept to the default one-click path.

// Each desk's implied writing voice (a content category from categories.js).
// How-to and Story are voice-only — offered under Advanced, never a top-level desk.
const DESK_VOICE = { editorial: "editorial", enterprise: "business", newsdesk: "news" };

function deskLabel(key) {
  const s = STYLE_LIST.find((x) => x.key === key);
  return s ? s.label : key;
}

export default function CreateScreen({ onGenerate, onBlank, generating, phase, onCancel, error }) {
  const [desk, setDesk] = useState(DEFAULT_STYLE);
  // Voice follows the desk until the user overrides it under Advanced; after that
  // it's theirs and switching desk leaves it alone.
  const [voice, setVoice] = useState(() => DESK_VOICE[DEFAULT_STYLE]);
  const [voiceTouched, setVoiceTouched] = useState(false);
  const [topic, setTopic] = useState("");
  const [quickDraft, setQuickDraft] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  // Grounding seed (R5) from a picked Trending card: { extract, source }. Cleared
  // when the topic is edited by hand, so a typed-over topic isn't grounded stale.
  const [seed, setSeed] = useState(null);

  const pickDesk = (key) => {
    setDesk(key);
    if (!voiceTouched) setVoice(DESK_VOICE[key]);
  };
  const pickVoice = (key) => { setVoice(key); setVoiceTouched(true); };
  // Tap a Trending card → fill the topic and set the matching voice (tie-back).
  const pickTrending = (t, voiceKey, ground) => {
    setTopic(t);
    setSeed(ground && ground.extract ? ground : null);
    if (voiceKey) { setVoice(voiceKey); setVoiceTouched(true); }
  };

  const submit = () => {
    const t = topic.trim();
    if (!t || generating) return;
    onGenerate({ style: desk, category: voice, topic: t, quickDraft, ground: seed });
  };

  // Coarse progress label while generating (the call streams searching -> writing).
  const genLabel = phase === "searching" ? "Researching the web…"
    : phase === "writing" ? "Writing your carousel…"
    : quickDraft ? "Drafting…" : "Starting…";

  const voiceOverridden = voice !== DESK_VOICE[desk];

  return (
    <div style={screen}>
      <div style={col}>
        <div style={brand}>loathrdotcom</div>

        <div style={label}>Pick a desk</div>
        <div style={gallery}>
          {STYLE_LIST.map((s) => {
            const on = desk === s.key;
            return (
              <button key={s.key} type="button" onClick={() => pickDesk(s.key)} style={card(on)}>
                <div style={{ borderRadius: 6, overflow: "hidden", lineHeight: 0, boxShadow: "0 6px 18px rgba(0,0,0,0.45)" }}>
                  <StylePreview style={s} width={170} />
                </div>
                <div style={cardLabel(on)}>{s.label}</div>
                <div style={cardBlurb}>{s.blurb}</div>
                <div style={voiceLine(on)}>Voice · {getCategory(DESK_VOICE[s.key]).label}</div>
              </button>
            );
          })}
        </div>

        <div style={{ ...label, marginTop: 26 }}>What&apos;s it about?</div>
        <input
          value={topic}
          onChange={(e) => { setTopic(e.target.value); setSeed(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="Type a topic — or open Trending below"
          autoFocus
          style={topicInput}
        />
        <TrendingPanel onPick={pickTrending} desk={desk} />

        {/* Advanced · Writing voice — opt-in override; the default path never sees it. */}
        <button type="button" onClick={() => setAdvanced((v) => !v)} style={advToggle}>
          {advanced ? "▾" : "▸"} Advanced · Writing voice{voiceOverridden ? " · " + getCategory(voice).label : ""}
        </button>
        {advanced && (
          <div style={advBox}>
            <div style={advHint}>Keeps the {deskLabel(desk)} look — only the writing voice changes.</div>
            <div style={chips}>
              {CATEGORY_LIST.map((c) => {
                const on = voice === c.key;
                return (
                  <button key={c.key} type="button" onClick={() => pickVoice(c.key)} style={chip(on)} title={c.blurb}>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <label style={quickRow} title="Skip the live web search — faster, but it won't pull in the very latest facts.">
          <input type="checkbox" checked={quickDraft} disabled={generating} onChange={(e) => setQuickDraft(e.target.checked)} style={{ accentColor: UI.brand, width: 15, height: 15 }} />
          <span>Quick draft — skip web search (faster, less current)</span>
        </label>

        {error && <div style={errBox}>{error}</div>}

        <button onClick={submit} disabled={generating || !topic.trim()} style={primary(generating || !topic.trim())}>
          {generating ? genLabel : (quickDraft ? "⚡  Make a quick draft" : "✨  Make my carousel")}
        </button>

        {generating ? (
          <button type="button" onClick={onCancel} style={cancelLink}>Cancel</button>
        ) : (
          <button type="button" onClick={onBlank} style={blankLink}>Start from a blank canvas</button>
        )}
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
const col = { width: "100%", maxWidth: 660, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" };
const brand = { fontSize: 13, letterSpacing: 4, color: "#cfcfcf", fontWeight: 700, marginBottom: 36, fontFamily: BRAND_FONT };
const label = { fontSize: 13, letterSpacing: 1, color: "#8f8f97", marginBottom: 14, textTransform: "uppercase" };
const gallery = { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" };
const chips = { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" };
function chip(on) {
  return {
    height: 34, padding: "0 16px", borderRadius: 999, cursor: "pointer", fontSize: 13,
    background: on ? UI.brand : "transparent",
    color: on ? "#fff" : "#bdbdbd",
    border: "1.5px solid " + (on ? UI.brand : "#3a3a42"),
    fontWeight: on ? 600 : 400,
  };
}

function card(on) {
  return {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
    padding: 10, width: 192, borderRadius: 10, cursor: "pointer",
    background: on ? "#222228" : "transparent",
    border: "1.5px solid " + (on ? UI.brand : "#2c2c32"),
    transition: "border-color 120ms, background 120ms",
  };
}
function cardLabel(on) {
  return { fontSize: 14, fontWeight: 600, color: on ? "#fff" : "#d8d8d8", marginTop: 2 };
}
const cardBlurb = { fontSize: 11, color: "#7f7f87", lineHeight: 1.3 };
function voiceLine(on) {
  return { fontSize: 10, letterSpacing: 0.4, fontWeight: 600, color: on ? "#9ecbff" : "#6f6f78", marginTop: 3, textTransform: "uppercase" };
}

const topicInput = {
  width: "100%", height: 52, padding: "0 18px", fontSize: 17,
  background: "#1d1d21", color: "#fff", border: "1px solid #3a3a42", borderRadius: 10,
  textAlign: "center", outline: "none",
};
const advToggle = {
  marginTop: 22, background: "transparent", border: "none", color: "#8f8f97",
  fontSize: 12.5, cursor: "pointer", letterSpacing: 0.3,
};
const advBox = { marginTop: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 };
const advHint = { fontSize: 11.5, color: "#7f7f87", marginBottom: 10, maxWidth: 460, lineHeight: 1.4 };

const errBox = { marginTop: 14, padding: "8px 12px", background: "#3a1f22", color: "#ff9a9a", fontSize: 13, borderRadius: 8 };
function primary(disabled) {
  return {
    marginTop: 22, height: 52, padding: "0 28px", minWidth: 260,
    fontSize: 16, fontWeight: 700, letterSpacing: 0.3,
    background: disabled ? (UI.brand + "55") : UI.brand, color: "#fff",
    border: "none", borderRadius: 12, cursor: disabled ? "default" : "pointer",
    boxShadow: disabled ? "none" : "0 8px 24px rgba(45,140,255,0.35)",
  };
}
const blankLink = {
  marginTop: 16, background: "transparent", border: "none", color: "#8f8f97",
  fontSize: 13, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3,
};
const cancelLink = {
  marginTop: 16, background: "transparent", border: "none", color: "#ff9a9a",
  fontSize: 13, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3,
};
const quickRow = {
  display: "flex", alignItems: "center", gap: 8, marginTop: 20,
  color: "#9a9a9a", fontSize: 12.5, cursor: "pointer", userSelect: "none",
};
