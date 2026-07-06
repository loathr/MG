"use client";
import React, { useState, useEffect } from "react";
import { UI } from "./theme";
import { STYLE_LIST, DEFAULT_STYLE } from "./styles";
import { getCategory } from "./categories";
import StylePreview from "./StylePreview";
import TrendingPanel from "./TrendingPanel";
import RouteSelect from "./RouteSelect";
import { routeFraming, getBeat, REGIONS, URGENCY, ANGLES, EMPHASIS, MODES, framingPrompt, countriesForRegion, classifyTopicScope, beatsForDesk } from "./trending";
import { VOICES as PERSONAS, TONES as RICH_TONES } from "./voices";
import { readDocFile } from "./docsource";
import StickLoader from "./StickLoader";
import RefinePanel from "./RefinePanel";
import { PRESETS, activePreset } from "./presets";
import {
  PenLine, FileText, X, ChevronDown, ChevronRight, Sparkles, Zap, ArrowLeft, RefreshCw,
  Scroll, Swords, KeyRound, Clapperboard, BarChart3, MessageCircle, Headphones, Shirt, Mic, Gem,
  ArrowRightLeft, MapPin,
} from "lucide-react";

// Voice-id → lucide icon (voices.js stores the name; this maps it to a component
// so the data module stays JSX-free). Rendered in the Voice picker.
const VOICE_ICONS = { Sparkles, Scroll, Swords, KeyRound, Clapperboard, BarChart3, MessageCircle, Headphones, Shirt, Mic, Gem };
function VoiceIcon({ name, size = 14 }) { const I = VOICE_ICONS[name] || Sparkles; return <I size={size} />; }

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
// Optional tone overlay (the 6 rich tones from voices.js); none = let voice/desk decide.
const TONES = RICH_TONES;
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

export default function CreateScreen({ onGenerate, onBlank, generating, phase, onCancel, error, onBack }) {
  const [desk, setDesk] = useState(DEFAULT_STYLE);
  // Voice follows the desk until the user overrides it under Advanced; after that
  // it's theirs and switching desk leaves it alone.
  const [voice, setVoice] = useState(() => DESK_VOICE[DEFAULT_STYLE]);
  const [voiceTouched, setVoiceTouched] = useState(false);
  const [topic, setTopic] = useState("");
  const [quickDraft, setQuickDraft] = useState(false);
  const [polish, setPolish] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [length, setLength] = useState("standard"); // deck length (default Standard)
  const [tone, setTone] = useState(null);           // optional tone overlay (6 rich tones)
  // Named-persona VOICE (who's telling it) — a distinct axis from the desk's
  // writing category; "auto" keeps the seeded default. Threaded as `voice`.
  const [persona, setPersona] = useState("auto");
  // Source mode: a short "topic" or a full "document" the deck is built from.
  const [srcMode, setSrcMode] = useState("topic");   // "topic" | "doc"
  const [docSrc, setDocSrc] = useState(null);        // { name, text, words } from a file
  const [pasteText, setPasteText] = useState("");    // pasted material
  const [docErr, setDocErr] = useState("");
  const [docBusy, setDocBusy] = useState(false);
  const [ddOpen, setDdOpen] = useState(null);        // open picker: "voice" | "tone" | null
  const docFileRef = React.useRef(null);
  // Grounding seed (R5) from a picked Trending card: { extract, source }. Cleared
  // when the topic is edited by hand, so a typed-over topic isn't grounded stale.
  const [seed, setSeed] = useState(null);
  // Rotating "Try" suggestions: an index into the beat's seed list; the shown trio
  // window is (seedRot*3 .. +3) mod length, so it cycles through ALL of a beat's
  // curated topics instead of always showing the first three.
  const [seedRot, setSeedRot] = useState(0);
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
  // Quick-start: curated presets + the 8 angle-seeds, folded away by default so the
  // create screen stays clean (opens on demand).
  const [qsOpen, setQsOpen] = useState(false);
  // Topic refiner: the DECIDED title (null while still choosing). Set when the user
  // picks a refined angle / related headline / Trending card, or taps "Use my
  // topic"; cleared the moment the topic is edited by hand. Once set, the refiner
  // shows the virality score for that topic (post-decision, R: cost-free feeds).
  const [refineDecided, setRefineDecided] = useState(null);
  // Scope precedence: once the user acts on (or dismisses) the off-sector prompt,
  // suppress it until the topic / sector / desk changes, so it never nags.
  const [scopeDismissed, setScopeDismissed] = useState(false);

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
    setRefineDecided(t); // a picked Trending card is a decided topic → show its virality
  };
  // Refiner handlers. Picking a sharper angle also seeds the route angle; any
  // decision locks the topic (reveals the virality score). Editing the topic box
  // clears the decision so the score hides until the topic is decided again.
  const pickAngle = (title, angleId) => { setTopic(title); setSeed(null); if (angleId) setAngle(angleId); setRefineDecided(title); };
  const pickRefinedTopic = (title) => { setTopic(title); setSeed(null); setRefineDecided(title); };
  const lockTopic = () => { const t = topic.trim(); if (t) setRefineDecided(t); };
  const editTopic = () => setRefineDecided(null);

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

  // The document material (a loaded file's text, else the pasted text) when in doc mode.
  const sourceDoc = srcMode === "doc" ? ((docSrc && docSrc.text) || pasteText.trim()) : "";
  const canGenerate = !generating && (srcMode === "doc" ? !!sourceDoc : !!topic.trim());

  const submit = () => {
    if (!canGenerate) return;
    const slides = (LENGTHS.find((l) => l.id === length) || LENGTHS[1]).slides;
    // In doc mode the deck is built from the material; a short label (the file name
    // or a stub) still fills the prompt's Topic slot + names the project.
    const t = srcMode === "doc"
      ? ((docSrc && docSrc.name.replace(/\.[^.]+$/, "")) || "Your document")
      : topic.trim();
    onGenerate({ style: desk, category: voice, topic: t, quickDraft, polish, ground: seed, slides, tone, voice: persona, sourceDoc, route: buildRoute(), unbranded });
  };

  // Load a dropped/picked document → extract its text (txt/md/pdf).
  const loadDoc = async (file) => {
    if (!file) return;
    setDocErr(""); setDocBusy(true);
    try { setDocSrc(await readDocFile(file)); }
    catch (e) { setDocErr((e && e.message) || "Couldn't read that document."); setDocSrc(null); }
    finally { setDocBusy(false); }
  };

  // Coarse progress label while generating (the call streams searching -> writing
  // -> polishing when the Polish pass is on).
  const genLabel = phase === "searching" ? "Researching the web…"
    : phase === "writing" ? "Writing your carousel…"
    : phase === "polishing" ? "Polishing the arc & flow…"
    : quickDraft ? "Drafting…" : "Starting…";

  const voiceOverridden = voice !== DESK_VOICE[desk];
  const personaObj = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];

  // Quick-start presets: apply seeds the four controls; the active chip is DERIVED
  // (matches all four), so tweaking any field un-lights it. Clear resets to defaults.
  const curPreset = activePreset(persona, tone, angle, length);
  const applyPreset = (p) => { setPersona(p.voice); setTone(p.tone); setAngle(p.angle); setLength(p.length); };
  const clearQuickStart = () => { setPersona("auto"); setTone(null); setAngle(null); setLength("standard"); };
  const lblV = (id) => (PERSONAS.find((v) => v.id === id) || {}).label || id;
  const lblT = (id) => (TONES.find((t) => t.id === id) || {}).label || id;
  const lblA = (id) => (ANGLES.find((a) => a.id === id) || {}).label || id;
  const lblL = (id) => (LENGTHS.find((l) => l.id === id) || {}).label || id;
  const presetSub = (p) => [lblV(p.voice), lblT(p.tone), lblA(p.angle), lblL(p.length)].join(" · ");

  // The picked beat's curated topics, and the rotating window of three shown.
  const allSeeds = beat ? (getBeat(beat).seeds || []) : [];
  const shownSeeds = allSeeds.length <= 3
    ? allSeeds
    : [0, 1, 2].map((i) => allSeeds[(seedRot * 3 + i) % allSeeds.length]);
  // Fresh beat → start its rotation from the top.
  useEffect(() => { setSeedRot(0); }, [beat]);
  // Auto-rotate the suggestions every 6s so they cycle through the beat's full
  // list — paused once you've started typing a topic (so it never shifts under you)
  // or when the beat has three or fewer seeds (nothing to rotate).
  useEffect(() => {
    if (allSeeds.length <= 3 || topic.trim()) return undefined;
    const id = setInterval(() => setSeedRot((r) => r + 1), 6000);
    return () => clearInterval(id);
  }, [beat, topic, allSeeds.length]);
  // Un-dismiss the off-sector prompt whenever the topic / sector / desk changes.
  useEffect(() => { setScopeDismissed(false); }, [topic, beat, desk]);

  // Cross-beat scope precedence: while choosing a topic with a sector selected,
  // check whether the topic fits it; if not, offer to switch (pure/offline —
  // classifyTopicScope, zero cost). Kept to the current desk's beats so a switch
  // stays in-desk. Silent when there's no sector, no topic, or it's on-sector.
  const deskBeats = beatsForDesk(desk);
  const scopeClass = (srcMode === "topic" && topic.trim() && beat && !refineDecided)
    ? classifyTopicScope(topic, beat, deskBeats) : null;
  const showScopePrompt = !!(scopeClass && scopeClass.decidable && !scopeClass.onSector && !scopeDismissed);
  const switchSector = (key) => { setBeat(key); setScopeDismissed(true); };
  const keepRegionOnly = () => { setBeat(null); setScopeDismissed(true); };
  const forceSector = () => setScopeDismissed(true);

  return (
    <div style={screen}>
      {/* Route back to the dashboard without generating — cloud-only (there's no
          dashboard in the local flow, so Studio passes onBack only when signed in). */}
      {onBack && (
        <button type="button" onClick={onBack} style={backBtn} title="Back to your projects">
          <ArrowLeft size={14} /> Your projects
        </button>
      )}
      <div style={col}>
        <div style={brand}>loathrdotcom</div>

        <div style={label}>Desk</div>
        <div style={gallery}>
          {STYLE_LIST.map((s) => {
            const on = desk === s.key;
            return (
              <button key={s.key} type="button" onClick={() => pickDesk(s.key)} style={card(on)} title={s.blurb}>
                <div style={{ borderRadius: 5, overflow: "hidden", lineHeight: 0, width: 150, height: 92 }}>
                  <StylePreview style={s} width={150} />
                </div>
                <div style={cardLabel(on)}>{s.label}</div>
                <div style={voiceLine(on)}>{getCategory(DESK_VOICE[s.key]).label}</div>
              </button>
            );
          })}
        </div>

        <div style={{ ...label, marginTop: 18 }}>What&apos;s it about?</div>
        {/* Source mode — a short topic, or a full document the deck is built from */}
        <div style={modeRow}>
          <button type="button" onClick={() => setSrcMode("topic")} style={modeBtn(srcMode === "topic")}><PenLine size={14} /> Topic</button>
          <button type="button" onClick={() => setSrcMode("doc")} style={modeBtn(srcMode === "doc")}><FileText size={14} /> From a document</button>
        </div>
        {srcMode === "topic" ? (
          <>
            <input
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setSeed(null); setRefineDecided(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="Type a topic — or open Trending below"
              autoFocus
              style={topicInput}
            />
            {showScopePrompt && (
              <div style={scopePrompt}>
                <div style={scopePromptTop}>
                  <ArrowRightLeft size={14} style={{ flexShrink: 0, marginTop: 1, color: "#e0b98a" }} />
                  {scopeClass.suggestSwitch ? (
                    <span>Reads like <b style={{ color: "#f0d3a8" }}>{scopeClass.best.label}</b>, not <b style={{ color: "#f0d3a8" }}>{scopeClass.current.label}</b>.</span>
                  ) : (
                    <span>This topic looks off-sector for <b style={{ color: "#f0d3a8" }}>{scopeClass.current.label}</b>.</span>
                  )}
                </div>
                <div style={scopePromptBtns}>
                  {scopeClass.suggestSwitch && (
                    <button type="button" onClick={() => switchSector(scopeClass.best.key)} style={scopeBtnPrimary}>Switch to {scopeClass.best.label}</button>
                  )}
                  <button type="button" onClick={keepRegionOnly} style={scopeBtn}><MapPin size={12} /> Keep region only</button>
                  <button type="button" onClick={forceSector} style={scopeBtnGhost}>Keep {scopeClass.current.label}</button>
                </div>
              </div>
            )}
            <RefinePanel
              topic={topic}
              decided={refineDecided}
              scope={{ region, country, beat }}
              onPickAngle={pickAngle}
              onPickTopic={pickRefinedTopic}
              onLock={lockTopic}
              onEdit={editTopic}
            />
          </>
        ) : (
          <div style={docZone} onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) loadDoc(f); }}>
            <div style={docTop}>
              <span style={{ fontSize: 12.5, color: "#8a8a90", flex: 1 }}>{docBusy ? "Reading…" : "Drop a .txt · .md · .pdf, or paste your material below"}</span>
              <button type="button" style={docBrowse} onClick={() => docFileRef.current && docFileRef.current.click()}>Browse…</button>
              <input ref={docFileRef} type="file" accept=".txt,.md,.markdown,.pdf" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) loadDoc(f); }} />
            </div>
            <textarea value={pasteText} onChange={(e) => { setPasteText(e.target.value); setDocSrc(null); }}
              placeholder="…or paste your script, article, transcript, or notes here" style={docPaste} />
            {docSrc ? (
              <div style={docChip}><FileText size={13} />{docSrc.name} · {docSrc.words.toLocaleString()} words · loaded
                <button type="button" style={docX} onClick={() => setDocSrc(null)} title="Remove"><X size={13} /></button></div>
            ) : null}
            {docErr ? <div style={docErrBox}>{docErr}</div> : null}
          </div>
        )}
        {/* Quick start — curated presets + the 8 angle-seeds, collapsed by default. */}
        <button type="button" onClick={() => setQsOpen((v) => !v)} style={qsToggle}>
          {qsOpen ? <ChevronDown size={14} style={{ verticalAlign: "-2px" }} /> : <ChevronRight size={14} style={{ verticalAlign: "-2px" }} />} Quick start
          <span style={qsToggleSub}>{curPreset ? " · " + curPreset.name : " · presets & angle"}</span>
        </button>
        {qsOpen && (
          <div style={qsBox}>
            <div style={qsLab}>Presets <span style={qsOpt}>— one tap sets voice · tone · angle · length</span></div>
            <div style={qsGrid}>
              {PRESETS.map((p) => {
                const on = curPreset && curPreset.id === p.id;
                return (
                  <button key={p.id} type="button" onClick={() => applyPreset(p)} style={qsChip(on)}>
                    <span style={qsChipName}>{p.name}</span>
                    <span style={qsChipSub(on)}>{presetSub(p)}</span>
                  </button>
                );
              })}
            </div>
            {curPreset && (
              <div style={qsApplied}>
                <span style={{ color: "#8a8a92" }}>“{curPreset.name}” applied</span>
                <button type="button" onClick={clearQuickStart} style={qsClear}>Clear</button>
              </div>
            )}
            <div style={{ ...qsLab, marginTop: 14 }}>Angle <span style={qsOpt}>— the story&rsquo;s slant (any desk)</span></div>
            <div style={qsAngles}>
              {ANGLES.map((a) => (
                <button key={a.id} type="button" title={a.prompt} onClick={() => setAngle(angle === a.id ? null : a.id)} style={qsChip(angle === a.id)}>
                  <span style={qsChipName}>{a.label}</span>
                  <span style={qsChipSub(angle === a.id)}>{a.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Voice (persona) + Tone — compact pickers, applied to BOTH modes */}
        <div style={vtRow}>
          <div style={{ position: "relative", flex: 1 }}>
            <button type="button" onClick={() => setDdOpen(ddOpen === "voice" ? null : "voice")} style={vtBtn(true)}>
              <span style={vtL}><span style={vtK}>Voice</span><span style={vtV}><VoiceIcon name={personaObj.icon} /> {personaObj.label}</span></span>
              <span style={vtCar}><ChevronDown size={14} /></span>
            </button>
            {ddOpen === "voice" && (
              <div style={vtMenu}>
                {PERSONAS.map((p) => (
                  <button key={p.id} type="button" onClick={() => { setPersona(p.id); setDdOpen(null); }} style={vtOpt(p.id === persona)}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><VoiceIcon name={p.icon} /> {p.label}</span><span style={vtPhrase}>{p.phrase}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: "relative", flex: 1 }}>
            <button type="button" onClick={() => setDdOpen(ddOpen === "tone" ? null : "tone")} style={vtBtn(false)}>
              <span style={vtL}><span style={vtK}>Tone</span><span style={vtV}>{tone ? toneLabel(tone) : "Auto"}</span></span>
              <span style={vtCar}><ChevronDown size={14} /></span>
            </button>
            {ddOpen === "tone" && (
              <div style={vtMenu}>
                <button type="button" onClick={() => { setTone(null); setDdOpen(null); }} style={vtOpt(!tone)}>Auto</button>
                {TONES.map((t) => (
                  <button key={t.id} type="button" onClick={() => { setTone(t.id); setDdOpen(null); }} style={vtOpt(t.id === tone)}>{t.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Scope (all desks): sector + region + country on ONE line — scope the
            live pull AND frame generation, paired with the sector. Urgency is
            News-only. */}
        <div style={{ width: "100%", marginTop: 14, textAlign: "left" }}>
          <div style={scopeLab}>Scope <span style={opt}>— optional · sector · region · country</span></div>
          <div style={scopeRow}>
            <div style={{ flex: 1.2, minWidth: 0 }}><RouteSelect desk={desk} value={beat} onChange={setBeat} hideLabel /></div>
            <select value={region || "global"} onChange={(e) => pickRegion(e.target.value)} style={scopeSel(false)} title="Region">
              {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.id === "global" ? "Global" : r.label}</option>)}
            </select>
            {region && region !== "global" && (
              <select value={country || ""} onChange={(e) => setCountry(e.target.value || null)} style={scopeSel(!!country)} title="Country (sub-region)">
                <option value="">All of {(REGIONS.find((r) => r.id === region) || {}).label}</option>
                {countriesForRegion(region).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
          {shownSeeds.length > 0 && (
            <div style={seedRow}>
              <span style={seedCue}>Try</span>
              {shownSeeds.map((s) => (
                <button key={s} type="button" onClick={() => { setTopic(s); setSeed(null); }} style={seedChip}>{s}</button>
              ))}
              {allSeeds.length > 3 && (
                <button type="button" onClick={() => setSeedRot((r) => r + 1)} style={seedRefresh} title="More suggestions">
                  <RefreshCw size={12} />
                </button>
              )}
            </div>
          )}
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
        <TrendingPanel onPick={pickTrending} desk={desk} beat={beat} onBeat={setBeat} region={region} country={country} urgency={urgency} />

        {/* Options — opt-in; the default path never opens it. Holds voice/tone (+
            desk framing), the white-label toggle, and quick-draft. */}
        <button type="button" onClick={() => setAdvanced((v) => !v)} style={advToggle}>
          {advanced ? <ChevronDown size={14} style={{ verticalAlign: "-2px" }} /> : <ChevronRight size={14} style={{ verticalAlign: "-2px" }} />} Options{(unbranded ? " · white-label" : "") + (quickDraft ? " · quick draft" : "") + (polish ? " · polish" : "")}
        </button>
        {advanced && (
          <div style={vtBox}>
            {/* White-label — strip ALL LOATHR branding, incl. at generation time. */}
            <button type="button" onClick={() => setUnbranded((v) => !v)} title="Remove all LOATHR branding from the generated deck" style={wlRow(unbranded)}>
              <span style={{ textAlign: "left" }}>Remove LOATHR branding
                <small style={{ display: "block", fontSize: 10, color: unbranded ? "#b89a72" : "#7c7c84", fontWeight: 400, marginTop: 2 }}>White-label · also stops the generated “Follow @loathr…” sign-off</small></span>
              <span style={wlTog(unbranded)}><span style={wlKnob(unbranded)} /></span>
            </button>
            <label style={quickRow} title="Skip the live web search — faster, but it won't pull in the very latest facts.">
              <input type="checkbox" checked={quickDraft} disabled={generating} onChange={(e) => setQuickDraft(e.target.checked)} style={{ accentColor: UI.brand, width: 15, height: 15 }} />
              <span>Quick draft — skip web search (faster, less current)</span>
            </label>
            <label style={quickRow} title="After the draft, a second editor pass tightens the spine, arc, and transitions. Adds ~15-30s.">
              <input type="checkbox" checked={polish} disabled={generating} onChange={(e) => setPolish(e.target.checked)} style={{ accentColor: UI.brand, width: 15, height: 15 }} />
              <span>Polish pass — a second editor tightens the spine &amp; flow (slower)</span>
            </label>
            {/* Voice + Tone live in the top compact pickers (and Quick start); they
                used to be duplicated here — removed to end the double "Voice"/"Tone". */}
            {(desk === "newsdesk" || desk === "enterprise") && <div style={{ height: 1, background: "#26262c" }} />}
            {/* Advanced framing (Tier 3) — desk-specific: News Emphasis,
                Enterprise Mode. Optional; ported from the monolith configs. */}
            {desk === "newsdesk" && (
              <div style={vRow}>
                <span style={vKey}>Emphasis</span>
                <div style={tones}>
                  {EMPHASIS.map((em) => (
                    <button key={em.id} type="button" onClick={() => setEmphasis(emphasis === em.id ? null : em.id)} style={toneChip(emphasis === em.id)} title={em.prompt}>{em.label}</button>
                  ))}
                </div>
              </div>
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

        {error && <div style={errBox}>{error}</div>}

        {generating ? (
          <>
            {/* The stick-man walk/run loader replaces the button while generating. */}
            <StickLoader label={genLabel} />
            <button type="button" onClick={onCancel} style={cancelBtn}><X size={14} /> Cancel generation</button>
          </>
        ) : (
          <>
            <button onClick={submit} disabled={!canGenerate} style={primary(!canGenerate)}>
              {srcMode === "doc" ? <><Sparkles size={16} /> Make a carousel from this document</> : (quickDraft ? <><Zap size={16} /> Make a quick draft</> : <><Sparkles size={16} /> Make my carousel</>)}
            </button>
            <button type="button" onClick={onBlank} style={blankLink}>Start from a blank canvas</button>
          </>
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
// Back-to-dashboard pill, pinned top-left of the create screen (cloud only).
const backBtn = { position: "absolute", left: 18, top: 16, zIndex: 5, display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 13px", background: "#1b1b1f", color: "#b6b6be", border: "1px solid #2a2a30", borderRadius: 8, fontSize: 12.5, cursor: "pointer" };
// Wordmark uses the inherited Helvetica sans (the font "LOATHR STUDIO" used
// before the loathrdotcom rename), not Courier — reverted per design.
const brand = { fontSize: 13, letterSpacing: 4, color: "#cfcfcf", fontWeight: 700, marginBottom: 36 };
const label = { fontSize: 13, letterSpacing: 1, color: "#8f8f97", marginBottom: 14, textTransform: "uppercase" };
const gallery = { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" };
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
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: 7, width: 164, borderRadius: 9, cursor: "pointer",
    background: on ? "#222228" : "transparent",
    border: "1.5px solid " + (on ? UI.brand : "#2c2c32"),
    transition: "border-color 120ms, background 120ms",
  };
}
function cardLabel(on) {
  return { fontSize: 13, fontWeight: 600, color: on ? "#fff" : "#d8d8d8", marginTop: 1 };
}
function voiceLine(on) {
  return { fontSize: 9.5, letterSpacing: 0.4, fontWeight: 600, color: on ? UI.brandHi : "#6f6f78", textTransform: "uppercase" };
}

const topicInput = {
  width: "100%", height: 52, padding: "0 18px", fontSize: 17,
  background: "#1d1d21", color: "#fff", border: "1px solid #3a3a42", borderRadius: 10,
  textAlign: "center", outline: "none",
};
// --- source mode (Topic / Document) + Voice/Tone pickers ---
const modeRow = { display: "flex", gap: 6, background: "#141417", border: "1px solid #26262c", borderRadius: 11, padding: 5, margin: "0 auto 12px", width: "max-content" };
const modeBtn = (on) => ({ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: on ? "#26262e" : "transparent", color: on ? "#fff" : "#8a8a90", display: "inline-flex", alignItems: "center", gap: 6 });
const docZone = { width: "100%", background: "#141417", border: "1.5px dashed #3a3a44", borderRadius: 12, padding: 14, textAlign: "left" };
const docTop = { display: "flex", alignItems: "center", gap: 10, marginBottom: 11 };
const docBrowse = { background: "#26262b", border: "1px solid #36363c", color: "#dcdce2", borderRadius: 8, fontSize: 12, fontWeight: 600, padding: "8px 13px", cursor: "pointer", flexShrink: 0 };
const docPaste = { width: "100%", boxSizing: "border-box", minHeight: 100, background: "#0f0f12", border: "1px solid #2a2a30", borderRadius: 9, padding: "11px 12px", fontSize: 13, color: "#dcdce2", lineHeight: 1.5, resize: "vertical", outline: "none", fontFamily: "inherit" };
const docChip = { display: "inline-flex", alignItems: "center", gap: 8, background: "#1c1c22", border: "1px solid #34343c", borderRadius: 9, padding: "8px 12px", marginTop: 11, fontSize: 12.5, color: "#cdbcff" };
const docX = { background: "transparent", border: "none", color: "#8a8a90", cursor: "pointer", fontSize: 12, marginLeft: 4 };
const docErrBox = { fontSize: 11.5, color: "#ffb3a6", marginTop: 9, lineHeight: 1.4 };
const vtRow = { display: "flex", gap: 11, width: "100%", marginTop: 12, position: "relative", zIndex: 5 };
const vtBtn = (accent) => ({ width: "100%", height: 54, background: accent ? "#16121f" : "#141417", border: "1px solid " + (accent ? "#3a2f5e" : "#26262c"), borderRadius: 11, display: "flex", alignItems: "center", padding: "0 15px", justifyContent: "space-between", cursor: "pointer" });
const vtL = { display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start", minWidth: 0 };
const vtK = { fontSize: 9.5, color: "#7c7c84", letterSpacing: 1, textTransform: "uppercase" };
const vtV = { fontSize: 14, color: "#eaeaea", fontWeight: 600, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 };
const vtCar = { color: "#7c7c84", flexShrink: 0, marginLeft: 8, display: "inline-flex", alignItems: "center" };
const vtMenu = { position: "absolute", top: 58, left: 0, right: 0, zIndex: 20, background: "#17131f", border: "1px solid #3a2f5e", borderRadius: 11, padding: 6, maxHeight: 300, overflowY: "auto", boxShadow: "0 16px 40px rgba(0,0,0,0.6)" };
const vtOpt = (on) => ({ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1, width: "100%", textAlign: "left", padding: "8px 11px", borderRadius: 7, border: "none", cursor: "pointer", background: on ? "#2a2150" : "transparent", color: on ? "#cdbcff" : "#dadade", fontSize: 13 });
const vtPhrase = { fontSize: 10.5, color: "#7c7c84", fontStyle: "italic" };
// Seed "Try" hints — the picked beat's curated topics, as quiet fill-the-topic
// suggestions (TOPIC_ROUTES.md: ghost hints, never inserted as a slide topic).
const seedRow = { display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginTop: 12 };
const seedCue = { fontSize: 11, color: "#6f6f78" };
const seedChip = {
  fontSize: 12, color: "#c8c8ce", padding: "6px 11px", borderRadius: 7,
  background: "#131316", border: "1px solid #232329", cursor: "pointer",
};
const seedRefresh = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 28, height: 28, borderRadius: 7, color: "#8a8a92",
  background: "#131316", border: "1px solid #232329", cursor: "pointer",
};
// Off-sector precedence prompt (cross-beat): amber, sits between the topic box
// and the refiner. Offers Switch / Keep region only / Keep sector.
const scopePrompt = { width: "100%", marginTop: 10, background: "#1a1206", border: "1px solid #4a3117", borderRadius: 11, padding: "11px 13px", textAlign: "left" };
const scopePromptTop = { display: "flex", alignItems: "flex-start", gap: 9, fontSize: 12.5, color: "#e0b98a", lineHeight: 1.4 };
const scopePromptBtns = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 };
const scopeBtnPrimary = { fontSize: 11.5, fontWeight: 700, color: "#0a0a0a", background: "#e0b98a", border: "none", borderRadius: 7, padding: "6px 12px", cursor: "pointer" };
const scopeBtn = { fontSize: 11.5, color: "#dcdce2", background: "#26262e", border: "1px solid #3a3a42", borderRadius: 7, padding: "6px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 };
const scopeBtnGhost = { fontSize: 11.5, color: "#9aa0ab", background: "transparent", border: "1px solid #33333c", borderRadius: 7, padding: "6px 12px", cursor: "pointer" };
// News-desk secondary route (Region + Urgency).
const secBox = { marginTop: 14, borderTop: "1px solid #1c1c22", paddingTop: 14, textAlign: "left" };
const secLab = { fontSize: 10, letterSpacing: 1.2, color: "#6f6f78", textTransform: "uppercase", marginBottom: 10 };
const opt = { color: "#5c5c64", letterSpacing: 0.3, textTransform: "none" };
const regionSelect = {
  width: "100%", height: 42, borderRadius: 9, background: "#161619", color: "#f0f0f2",
  border: "1px solid #2a2a31", fontSize: 13.5, padding: "0 12px", cursor: "pointer", marginBottom: 11,
};
// Compact one-line scope row: sector (RouteSelect) · region · country.
const scopeLab = { fontSize: 10, letterSpacing: 1.2, color: "#6f6f78", textTransform: "uppercase", marginBottom: 9 };
const scopeRow = { display: "flex", gap: 8, alignItems: "flex-start" };
function scopeSel(active) {
  return { flex: 1, minWidth: 0, height: 46, borderRadius: 10, background: UI.surface2,
    border: "1px solid " + (active ? UI.brand : "#2c2c32"), color: "#f0f0f2", fontSize: 13, padding: "0 10px", cursor: "pointer" };
}
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
// Quick-start (presets + angle) collapsible.
const qsToggle = {
  marginTop: 14, background: "transparent", border: "none", color: "#c8c8ce",
  fontSize: 12.5, fontWeight: 600, cursor: "pointer", letterSpacing: 0.2, textAlign: "left", width: "100%",
};
const qsToggleSub = { color: "#7c7c84", fontWeight: 400 };
const qsBox = { width: "100%", marginTop: 10, border: "1px solid #232329", background: "#131316", borderRadius: 12, padding: 14, textAlign: "left" };
const qsLab = { fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "#7c7c84", marginBottom: 9 };
const qsOpt = { textTransform: "none", letterSpacing: 0, color: "#5f5f66" };
const qsGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 };
const qsAngles = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 };
const qsChip = (on) => ({
  display: "flex", flexDirection: "column", gap: 3, textAlign: "left", cursor: "pointer",
  background: on ? "#1c1630" : "#17171b", border: "1px solid " + (on ? "#7d54e0" : "#26262c"),
  boxShadow: on ? "0 0 0 1px #7d54e0" : "none", borderRadius: 10, padding: "9px 11px",
});
const qsChipName = { fontSize: 12.5, fontWeight: 700, color: "#e8e8ee" };
const qsChipSub = (on) => ({ fontSize: 9.5, lineHeight: 1.3, color: on ? "#b9a8e8" : "#8a8a92" });
const qsApplied = { display: "flex", alignItems: "center", gap: 10, marginTop: 11, fontSize: 12 };
const qsClear = { marginLeft: "auto", fontSize: 11, color: "#8a8a92", background: "transparent", border: "1px solid #2a2a30", borderRadius: 7, padding: "5px 10px", cursor: "pointer" };

const errBox = { marginTop: 14, padding: "8px 12px", background: "#3a1f22", color: "#ff9a9a", fontSize: 13, borderRadius: 8 };
function primary(disabled) {
  return {
    marginTop: 22, height: 52, padding: "0 28px", minWidth: 260,
    fontSize: 16, fontWeight: 700, letterSpacing: 0.3,
    background: disabled ? (UI.brand + "55") : UI.brand, color: UI.onBrand,
    border: "none", borderRadius: 12, cursor: disabled ? "default" : "pointer",
    boxShadow: disabled ? "none" : "0 8px 24px rgba(255,255,255,0.12)",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9,
  };
}
const blankLink = {
  marginTop: 16, background: "transparent", border: "none", color: "#8f8f97",
  fontSize: 13, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3,
};
// A prominent, unmistakable cancel button while generating (was a faint red text
// link that read as "no cancel button" against the big progress button above it).
const cancelBtn = {
  marginTop: 14, padding: "11px 22px", borderRadius: 10,
  background: "rgba(255,80,80,0.12)", border: "1px solid rgba(255,120,120,0.55)",
  color: "#ff9a9a", fontSize: 14, fontWeight: 600, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 7,
};
const quickRow = {
  display: "flex", alignItems: "center", gap: 8, marginTop: 20,
  color: "#9a9a9a", fontSize: 12.5, cursor: "pointer", userSelect: "none",
};
