"use client";
import React, { useState } from "react";
import { UI } from "./theme";
import { STYLE_LIST, DEFAULT_STYLE } from "./styles";
import { getCategory } from "./categories";
import StylePreview from "./StylePreview";
import TrendingPanel from "./TrendingPanel";
import RouteSelect from "./RouteSelect";
import { routeFraming, getBeat, REGIONS, URGENCY, ANGLES, EMPHASIS, MODES, framingPrompt, countriesForRegion } from "./trending";

// Screen 1 — Create (spec §4, Option C: "segment-first + voice override"). Pick a
// DESK first — the look (Editorial / Enterprise / News Desk). Each desk implies a
// writing voice and offers a few topic ideas; type the topic (or tap an idea),
// then one primary button. A collapsed "Advanced · Writing voice" lets a power
// user decouple voice from look (e.g. a Business voice in the Editorial look)
// without adding any concept to the default one-click path.

// Each desk's implied writing voice (a content category from categories.js).
// How-to and Story are voice-only — offered under Voice & tone, never a top-level desk.
const DESK_VOICE = { editorial: "editorial", enterprise: "business", newsdesk: "news" };

// Deck length → slide count, fed to generation (cover + content + closer).
const LENGTHS = [
  { id: "brief", label: "Brief", slides: 5 },
  { id: "standard", label: "Standard", slides: 8 },
  { id: "deep", label: "Deep", slides: 10 },
];
// Optional tone overlay (second axis beyond voice); none = let voice/desk decide.
const TONES = [
  { id: "punchy", label: "Punchy" },
  { id: "analytical", label: "Analytical" },
  { id: "playful", label: "Playful" },
  { id: "authoritative", label: "Authoritative" },
];
function toneLabel(id) { const t = TONES.find((x) => x.id === id); return t ? t.label : ""; }
// Voice options grouped by family for the Voice & tone dropdown.
const VOICE_GROUPS = [
  { label: "Culture", keys: ["editorial"] },
  { label: "Business", keys: ["business"] },
  { label: "News", keys: ["news"] },
  { label: "Narrative", keys: ["howto", "story"] },
];

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
  const [length, setLength] = useState("standard"); // deck length (default Standard)
  const [tone, setTone] = useState(null);           // optional tone overlay
  // Grounding seed (R5) from a picked Trending card: { extract, source }. Cleared
  // when the topic is edited by hand, so a typed-over topic isn't grounded stale.
  const [seed, setSeed] = useState(null);
  // Topic route (TOPIC_ROUTES.md): the picked beat/sector/section, or null = Any
  // (sector-free — generation is unchanged). Beats are desk-specific, so it
  // resets when the desk changes.
  const [beat, setBeat] = useState(null);
  // Region scope (all desks): a region + optional country sub-region scope the
  // trending pull AND frame generation, paired with the sector (Finance × Europe,
  // Sport × Africa). Urgency stays News-only. Region/country reset on desk change.
  const [region, setRegion] = useState(null);
  const [country, setCountry] = useState(null);
  const [urgency, setUrgency] = useState(null);
  // White-label: remove all LOATHR branding at GENERATION time too (no marks, and
  // no "Follow @loathr…" sign-off in the generated copy). Sticky across desks.
  const [unbranded, setUnbranded] = useState(false);
  const pickRegion = (id) => { setRegion(id === "global" ? null : id); setCountry(null); };
  // Advanced framing (Tier 3): News angle + emphasis, Enterprise mode. Ids, all
  // null by default, reset on desk change — they live in the Advanced disclosure.
  const [angle, setAngle] = useState(null);
  const [emphasis, setEmphasis] = useState(null);
  const [mode, setMode] = useState(null);

  const pickDesk = (key) => {
    setDesk(key);
    setBeat(null);
    setRegion(null);
    setCountry(null);
    setUrgency(null);
    setAngle(null);
    setEmphasis(null);
    setMode(null);
    if (!voiceTouched) setVoice(DESK_VOICE[key]);
  };
  // Urgency preselects the deck length (Breaking → fast/Brief, Trending → Deep);
  // the user can still pick any length afterwards.
  const pickUrgency = (id) => {
    const next = urgency === id ? null : id;
    setUrgency(next);
    const u = next ? URGENCY.find((x) => x.id === next) : null;
    if (u) { const l = LENGTHS.find((x) => x.slides === u.slides); if (l) setLength(l.id); }
  };
  const pickVoice = (key) => { setVoice(key); setVoiceTouched(true); };
  // Tap a Trending card → fill the topic, set the matching voice (tie-back), and
  // CARRY its beat as the route so the choice keeps paying off into generation.
  const pickTrending = (t, voiceKey, ground, beatKey) => {
    setTopic(t);
    setSeed(ground && ground.extract ? ground : null);
    if (voiceKey) { setVoice(voiceKey); setVoiceTouched(true); }
    if (beatKey) setBeat(beatKey);
  };

  // Build the resolved route (TOPIC_ROUTES.md) from the beat + News region/urgency.
  // Null when nothing is set, so generation is byte-identical to the plain path.
  const buildRoute = () => {
    const base = beat ? routeFraming(beat) : {};
    const regionLabel = region && region !== "global" ? (REGIONS.find((r) => r.id === region) || {}).label : null;
    const r = Object.assign({}, base, {
      region: regionLabel || null,
      country: country || null,
      urgency: urgency || null,
      // Tier 3 framing resolves to the prompt string for buildPrompt.
      angle: framingPrompt(ANGLES, angle),
      emphasis: framingPrompt(EMPHASIS, emphasis),
      mode: framingPrompt(MODES, mode),
    });
    return (r.label || r.region || r.country || r.urgency || r.angle || r.emphasis || r.mode) ? r : null;
  };

  const submit = () => {
    const t = topic.trim();
    if (!t || generating) return;
    const slides = (LENGTHS.find((l) => l.id === length) || LENGTHS[1]).slides;
    onGenerate({ style: desk, category: voice, topic: t, quickDraft, ground: seed, slides, tone, route: buildRoute(), unbranded });
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
        <div style={{ width: "100%", marginTop: 16 }}>
          <RouteSelect desk={desk} value={beat} onChange={setBeat} />
          {beat && getBeat(beat).seeds && getBeat(beat).seeds.length > 0 && (
            <div style={seedRow}>
              <span style={seedCue}>Try</span>
              {getBeat(beat).seeds.slice(0, 3).map((s) => (
                <button key={s} type="button" onClick={() => { setTopic(s); setSeed(null); }} style={seedChip}>{s}</button>
              ))}
            </div>
          )}
          {/* Region scope (all desks): region + optional country sub-region scope
              the live pull AND frame generation, paired with the sector. Urgency
              is News-only. */}
          <div style={secBox}>
            <div style={secLab}>Region &amp; country <span style={opt}>— optional · scopes topics + sources</span></div>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={region || "global"} onChange={(e) => pickRegion(e.target.value)} style={{ ...regionSelect, flex: 1, marginBottom: 0 }} title="Region">
                {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.id === "global" ? "🌍 Global" : r.label}</option>)}
              </select>
              {region && region !== "global" && (
                <select value={country || ""} onChange={(e) => setCountry(e.target.value || null)} style={{ ...regionSelect, flex: 1, marginBottom: 0, borderColor: country ? UI.brand : "#36363c" }} title="Country (sub-region)">
                  <option value="">All of {(REGIONS.find((r) => r.id === region) || {}).label}</option>
                  {countriesForRegion(region).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
            {desk === "newsdesk" && (
              <div style={urgRow}>
                {URGENCY.map((u) => (
                  <button key={u.id} type="button" onClick={() => pickUrgency(u.id)} style={urgChip(urgency === u.id, u.id)}>
                    <span style={urgDot(u.id)} />{u.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* White-label: strip ALL LOATHR branding, including at generation time. */}
          <button type="button" onClick={() => setUnbranded((v) => !v)} title="Remove all LOATHR branding from the generated deck"
            style={wlRow(unbranded)}>
            <span style={{ textAlign: "left" }}>Remove LOATHR branding
              <small style={{ display: "block", fontSize: 10, color: unbranded ? "#b89a72" : "#7c7c84", fontWeight: 400, marginTop: 2 }}>White-label · also stops the generated “Follow @loathr…” sign-off</small></span>
            <span style={wlTog(unbranded)}><span style={wlKnob(unbranded)} /></span>
          </button>
        </div>
        <TrendingPanel onPick={pickTrending} desk={desk} beat={beat} onBeat={setBeat} region={region} country={country} urgency={urgency} />

        {/* Voice & tone — opt-in; the default path never opens it. Voice overrides
            the desk's writing category; Tone is an optional second axis. */}
        <button type="button" onClick={() => setAdvanced((v) => !v)} style={advToggle}>
          {advanced ? "▾" : "▸"} Voice &amp; tone{(voiceOverridden || tone) ? " · " + getCategory(voice).label + (tone ? " · " + toneLabel(tone) : "") : ""}
        </button>
        {advanced && (
          <div style={vtBox}>
            <div style={vRow}>
              <span style={vKey}>Voice</span>
              <select value={voice} onChange={(e) => pickVoice(e.target.value)} style={vSelect} title="Writing voice">
                {VOICE_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.keys.map((k) => <option key={k} value={k}>{getCategory(k).label}</option>)}
                  </optgroup>
                ))}
              </select>
              <span style={vFrom}>{voiceOverridden ? "your choice" : (<>from <b style={{ color: "#9ecbff" }}>desk</b></>)}</span>
            </div>
            <div style={vRow}>
              <span style={vKey}>Tone</span>
              <div style={tones}>
                {TONES.map((tn) => (
                  <button key={tn.id} type="button" onClick={() => setTone(tone === tn.id ? null : tn.id)} style={toneChip(tone === tn.id)}>{tn.label}</button>
                ))}
              </div>
            </div>
            {/* Advanced framing (Tier 3) — desk-specific: News Angle + Emphasis,
                Enterprise Mode. Optional; ported from the monolith configs. */}
            {desk === "newsdesk" && (
              <>
                <div style={vRow}>
                  <span style={vKey}>Angle</span>
                  <div style={tones}>
                    {ANGLES.map((a) => (
                      <button key={a.id} type="button" onClick={() => setAngle(angle === a.id ? null : a.id)} style={toneChip(angle === a.id)} title={a.prompt}>{a.label}</button>
                    ))}
                  </div>
                </div>
                <div style={vRow}>
                  <span style={vKey}>Emphasis</span>
                  <div style={tones}>
                    {EMPHASIS.map((em) => (
                      <button key={em.id} type="button" onClick={() => setEmphasis(emphasis === em.id ? null : em.id)} style={toneChip(emphasis === em.id)} title={em.prompt}>{em.label}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {desk === "enterprise" && (
              <div style={vRow}>
                <span style={vKey}>Mode</span>
                <div style={tones}>
                  {MODES.map((m) => (
                    <button key={m.id} type="button" onClick={() => setMode(mode === m.id ? null : m.id)} style={toneChip(mode === m.id)} title={m.prompt}>{m.label}</button>
                  ))}
                </div>
              </div>
            )}
            <div style={vHint}>Keeps the {deskLabel(desk)} look — only how it&apos;s written changes.</div>
          </div>
        )}

        <div style={lenWrap}>
          <span style={lenBadge}>NEW</span>
          {/* One slide-count control, desk-framed: "Depth" on Enterprise, else
              "Length". On News, an active urgency preselected it (still editable). */}
          <div style={lenLab}>
            {desk === "enterprise" ? "Depth" : "Length"}
            {urgency ? <span style={lenAuto}>set by {(URGENCY.find((u) => u.id === urgency) || {}).label}</span> : null}
          </div>
          <div style={lenRow}>
            {LENGTHS.map((l) => {
              const on = length === l.id;
              return (
                <button key={l.id} type="button" onClick={() => setLength(l.id)} style={lenBtn(on)}>
                  <b style={{ fontSize: 13 }}>{l.label}</b>
                  <span style={{ fontSize: 10.5, color: on ? "#444" : "#cfd0d6" }}>{l.slides} slides</span>
                </button>
              );
            })}
          </div>
        </div>

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
  background: "radial-gradient(1100px 600px at 50% -10%, #0f0f0f 0%, #070707 55%, #000 100%)",
  fontFamily: "Helvetica, Arial, sans-serif",
};
const col = { width: "100%", maxWidth: 660, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" };
// Wordmark uses the inherited Helvetica sans (the font "LOATHR STUDIO" used
// before the loathrdotcom rename), not Courier — reverted per design.
const brand = { fontSize: 13, letterSpacing: 4, color: "#cfcfcf", fontWeight: 700, marginBottom: 36 };
const label = { fontSize: 13, letterSpacing: 1, color: "#8f8f97", marginBottom: 14, textTransform: "uppercase" };
const gallery = { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" };
// Length control (default-visible, dashed "NEW" box).
const lenWrap = { width: "100%", maxWidth: 520, border: "1px dashed #3a3a42", borderRadius: 12, padding: 13, marginTop: 22, position: "relative" };
const lenBadge = { position: "absolute", top: -9, left: 14, background: UI.brand, color: UI.onBrand, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, padding: "1px 7px", borderRadius: 5 };
const lenLab = { fontSize: 10, letterSpacing: 1.2, color: "#8f8f97", textTransform: "uppercase", marginBottom: 10, textAlign: "center" };
const lenRow = { display: "flex", gap: 9 };
function lenBtn(on) {
  return {
    flex: 1, height: 50, borderRadius: 8, cursor: "pointer",
    border: "1px solid " + (on ? UI.brand : UI.border), background: on ? UI.brand : UI.surface2,
    color: on ? UI.onBrand : "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
  };
}
// Voice & tone box.
const vtBox = { width: "100%", maxWidth: 520, border: "1px solid " + UI.border, background: "#17171b", borderRadius: 12, padding: "14px 16px", marginTop: 10, textAlign: "left", display: "flex", flexDirection: "column", gap: 12 };
const vRow = { display: "flex", alignItems: "center", gap: 12 };
const vKey = { width: 46, fontSize: 11, color: UI.muted, textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0 };
const vSelect = { height: 34, minWidth: 160, borderRadius: 7, background: UI.surface2, border: "1px solid " + UI.border, color: "#fff", fontSize: 13, padding: "0 10px", cursor: "pointer" };
const vFrom = { fontSize: 11, color: UI.muted };
const tones = { display: "flex", gap: 7, flexWrap: "wrap" };
function toneChip(on) {
  return {
    height: 30, padding: "0 13px", borderRadius: 999, fontSize: 12, cursor: "pointer",
    background: on ? UI.brand : "transparent", color: on ? UI.onBrand : "#b6b6be",
    border: "1px solid " + (on ? UI.brand : "#34343c"), fontWeight: on ? 600 : 400,
  };
}
const vHint = { fontSize: 11, color: "#7f7f87" };

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
  return { fontSize: 10, letterSpacing: 0.4, fontWeight: 600, color: on ? UI.brandHi : "#6f6f78", marginTop: 3, textTransform: "uppercase" };
}

const topicInput = {
  width: "100%", height: 52, padding: "0 18px", fontSize: 17,
  background: "#1d1d21", color: "#fff", border: "1px solid #3a3a42", borderRadius: 10,
  textAlign: "center", outline: "none",
};
// Seed "Try" hints — the picked beat's curated topics, as quiet fill-the-topic
// suggestions (TOPIC_ROUTES.md: ghost hints, never inserted as a slide topic).
const seedRow = { display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginTop: 12 };
const seedCue = { fontSize: 11, color: "#6f6f78" };
const seedChip = {
  fontSize: 12, color: "#c8c8ce", padding: "6px 11px", borderRadius: 7,
  background: "#131316", border: "1px solid #232329", cursor: "pointer",
};
// News-desk secondary route (Region + Urgency).
const secBox = { marginTop: 14, borderTop: "1px solid #1c1c22", paddingTop: 14, textAlign: "left" };
const secLab = { fontSize: 10, letterSpacing: 1.2, color: "#6f6f78", textTransform: "uppercase", marginBottom: 10 };
const opt = { color: "#5c5c64", letterSpacing: 0.3, textTransform: "none" };
const regionSelect = {
  width: "100%", height: 42, borderRadius: 9, background: "#161619", color: "#f0f0f2",
  border: "1px solid #2a2a31", fontSize: 13.5, padding: "0 12px", cursor: "pointer", marginBottom: 11,
};
const urgRow = { display: "flex", gap: 8, marginTop: 9 };
// White-label create-page toggle (mirrors the Brand-panel one).
function wlRow(on) {
  return { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 10,
    marginTop: 12, padding: "11px 13px", borderRadius: 10, cursor: "pointer",
    background: on ? "#241f1a" : "#161619", border: "1px solid " + (on ? "#4a3a28" : "#2a2a31"),
    color: on ? "#f0d9b8" : "#cfcfcf", fontSize: 13, fontWeight: 600 };
}
function wlTog(on) {
  return { width: 38, height: 21, borderRadius: 11, position: "relative", flexShrink: 0, background: on ? "#e8b069" : "#3a3a42" };
}
function wlKnob(on) {
  return { position: "absolute", top: 2, left: on ? 19 : 2, width: 17, height: 17, borderRadius: "50%", background: on ? "#241a0e" : "#fff" };
}
function urgChip(on, id) {
  const c = id === "breaking" ? "#e2433f" : id === "developing" ? "#e67e22" : "#888";
  return {
    flex: 1, height: 34, borderRadius: 999, fontSize: 12, cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    background: "transparent", color: on ? "#fff" : "#b6b6be",
    border: "1px solid " + (on ? c : "#2c2c33"),
  };
}
function urgDot(id) {
  const c = id === "breaking" ? "#e2433f" : id === "developing" ? "#e67e22" : "#888";
  return { width: 7, height: 7, borderRadius: "50%", background: c };
}
const lenAuto = {
  marginLeft: 8, fontSize: 9, letterSpacing: 0.3, textTransform: "none", color: UI.onBrand,
  background: UI.brand, borderRadius: 4, padding: "1px 6px", fontWeight: 700,
};
const advToggle = {
  marginTop: 22, background: "transparent", border: "none", color: "#8f8f97",
  fontSize: 12.5, cursor: "pointer", letterSpacing: 0.3,
};

const errBox = { marginTop: 14, padding: "8px 12px", background: "#3a1f22", color: "#ff9a9a", fontSize: 13, borderRadius: 8 };
function primary(disabled) {
  return {
    marginTop: 22, height: 52, padding: "0 28px", minWidth: 260,
    fontSize: 16, fontWeight: 700, letterSpacing: 0.3,
    background: disabled ? (UI.brand + "55") : UI.brand, color: UI.onBrand,
    border: "none", borderRadius: 12, cursor: disabled ? "default" : "pointer",
    boxShadow: disabled ? "none" : "0 8px 24px rgba(255,255,255,0.12)",
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
