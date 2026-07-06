"use client";
import React, { useState, useEffect, useRef } from "react";
import { UI } from "./theme";
import { angleSuggestions, viralityScore, viralityTier, viralityReasons } from "./refine";
import { Sparkles, Flame, Activity, Minus, ArrowUpRight, Pencil, Check, RotateCcw } from "lucide-react";

// The Topic refiner — appears under the topic box once something's typed. Two
// states, driven by the parent's `decided` prop:
//   • CHOOSING  — sharper angle suggestions (instant, offline) + real recent
//                 coverage from the free feeds. No score yet.
//   • DECIDED   — once a topic is locked (an angle picked, a related headline
//                 chosen, "Use my topic", or a Trending card), the virality panel
//                 replaces the chips and reads the buzz for THAT topic.
// Angle suggestions are pure/deterministic; related coverage + raw signals come
// from /api/refine (same keyless feeds as Trending — zero Claude credits). The
// score is recomputed locally when the decided title changes, so switching angles
// updates it instantly with no refetch.
//
// Props: topic (the base typed topic), decided (the locked title, or null),
// scope { region, country, beat } (the create-screen Scope — flows into the feed
// pull so related-recent + virality read WITHIN scope), and the callbacks
// onPickAngle(title, angleId), onPickTopic(title), onLock(), onEdit().
export default function RefinePanel({ topic, decided, scope, onPickAngle, onPickTopic, onLock, onEdit }) {
  const base = (topic || "").trim();
  const [data, setData] = useState(null); // { items, signals, scope } from the route
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  const suggestions = angleSuggestions(base);
  const region = scope && scope.region ? scope.region : "";
  const country = scope && scope.country ? scope.country : "";
  const beat = scope && scope.beat ? scope.beat : "";

  // Pull related coverage + raw signals for the base topic, WITHIN the current
  // scope (region/country/beat), debounced; the route caches 30 min so this is
  // cheap. Signals feed the local score recompute.
  useEffect(() => {
    if (!base) { setData(null); return undefined; }
    const t = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      const params = "?topic=" + encodeURIComponent(base)
        + (region && region !== "global" ? "&region=" + encodeURIComponent(region) : "")
        + (country ? "&country=" + encodeURIComponent(country) : "")
        + (beat ? "&beat=" + encodeURIComponent(beat) : "");
      fetch("/api/refine" + params, { signal: ac.signal })
        .then((r) => r.json())
        .then((d) => { if (!ac.signal.aborted) { setData(d && d.signals ? d : { items: [], signals: null }); setLoading(false); } })
        .catch(() => { if (!ac.signal.aborted) { setData({ items: [], signals: null }); setLoading(false); } });
    }, 450);
    return () => { clearTimeout(t); if (abortRef.current) abortRef.current.abort(); };
  }, [base, region, country, beat]);

  if (!base) return null;

  const signals = data && data.signals ? data.signals : null;
  const items = (data && data.items) || [];

  // DECIDED — virality panel for the locked title. Score recomputed locally so a
  // different angle updates it instantly; falls back to headline-only shape when
  // the feeds were unreachable (sandbox) so it's never blank.
  if (decided) {
    const sig = signals ? Object.assign({}, signals, { headline: decided }) : { headline: decided };
    const res = viralityScore(sig);
    const tier = viralityTier(res.score);
    const reasons = viralityReasons(sig, res);
    const TierIcon = tier.tier === "hot" ? Flame : tier.tier === "warm" ? Activity : Minus;
    return (
      <div style={panel}>
        <div style={decidedTop}>
          <span style={lockChk}><Check size={13} /></span>
          <span style={decidedTitle} title={decided}>{decided}</span>
          <button type="button" onClick={onEdit} style={changeBtn} title="Edit the topic"><Pencil size={12} /> Change</button>
        </div>
        <div style={vlab}>Virality signal — this topic</div>
        <div style={vcard}>
          <div style={vhead}>
            <span style={vnum}>{res.score}</span>
            <span style={badge(tier.tier)}><TierIcon size={12} /> {tier.label}</span>
            <span style={vlive}>{loading ? "reading feeds…" : "from free feeds"}</span>
          </div>
          <div style={meter}><span style={fill(res.score, tier.tier)} /></div>
          <div style={reasonsWrap}>
            {reasons.map((r) => (
              <div key={r.key} style={reasonRow}><span style={dot(r.on)} /> {r.label}</div>
            ))}
          </div>
          <div style={vfoot}>Weighted 0–100 from free feed signals — a buzz heuristic, not a promise. No credits used.</div>
        </div>
      </div>
    );
  }

  // CHOOSING — sharper angles + related recent. No score shown.
  return (
    <div style={panel}>
      <div style={phead}>
        <span style={ptitle}><Sparkles size={13} /> Refine your topic</span>
        <button type="button" onClick={onLock} style={useBtn} title="Lock this topic and see its virality">Use my topic <ArrowUpRight size={13} /></button>
      </div>
      <div style={vlab}>Sharper angles <span style={opt}>— pick one to lock the topic</span></div>
      <div style={angleGrid}>
        {suggestions.map((s) => (
          <button key={s.id} type="button" onClick={() => onPickAngle(s.title, s.angleId)} style={angleChip} title={"Use: " + s.title}>
            <span style={angleName}>{s.title}</span>
            <span style={angleHint}>{s.hint}</span>
          </button>
        ))}
      </div>
      {(loading || items.length > 0) && (
        <>
          <div style={{ ...vlab, marginTop: 14 }}>Related &amp; recent <span style={opt}>— live from free feeds{data && data.scope && data.scope.place ? " · " + data.scope.place : ""}</span></div>
          {loading && !items.length ? (
            <div style={relNote}>Checking what&apos;s current…</div>
          ) : (
            <div style={relWrap}>
              {items.map((it, i) => (
                <button key={i} type="button" onClick={() => onPickTopic(it.title)} style={relItem} title={"Use: " + it.title}>
                  <span style={relTitle}>{it.title}</span>
                  <span style={relSrc}>{it.source || "feed"}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const panel = { width: "100%", marginTop: 12, border: "1px solid #232329", background: "#131316", borderRadius: 12, padding: 14, textAlign: "left" };
const phead = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 };
const ptitle = { fontSize: 12, fontWeight: 700, color: "#e8e8ee", display: "inline-flex", alignItems: "center", gap: 7 };
const useBtn = { fontSize: 11.5, color: UI.onBrand, background: UI.brand, border: "none", borderRadius: 8, padding: "6px 11px", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 };
const vlab = { fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "#7c7c84", marginBottom: 9 };
const opt = { textTransform: "none", letterSpacing: 0, color: "#5f5f66" };
const angleGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 };
const angleChip = { display: "flex", flexDirection: "column", gap: 3, textAlign: "left", cursor: "pointer", background: "#17171b", border: "1px solid #26262c", borderRadius: 10, padding: "9px 11px" };
const angleName = { fontSize: 12, fontWeight: 700, color: "#e8e8ee", lineHeight: 1.3 };
const angleHint = { fontSize: 9.5, color: "#8a8a92" };
const relWrap = { display: "flex", flexDirection: "column", gap: 7 };
const relItem = { display: "flex", alignItems: "center", gap: 10, background: "#0f0f12", border: "1px solid #232329", borderRadius: 9, padding: "8px 11px", cursor: "pointer", textAlign: "left", width: "100%" };
const relTitle = { fontSize: 12, color: "#d8d8d8", lineHeight: 1.3, flex: 1, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" };
const relSrc = { fontSize: 9.5, color: "#6f6f78", flexShrink: 0 };
const relNote = { fontSize: 12, color: "#8a8a90", padding: "8px 2px" };

// decided
const decidedTop = { display: "flex", alignItems: "center", gap: 10, background: "#101512", border: "1px solid #2b5a3c", borderRadius: 10, padding: "10px 12px", marginBottom: 12 };
const lockChk = { width: 20, height: 20, borderRadius: "50%", background: "#183a28", color: "#7be3a0", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const decidedTitle = { fontSize: 13.5, color: "#f0f0f2", fontWeight: 600, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const changeBtn = { fontSize: 11, color: "#8a8a92", background: "transparent", border: "1px solid #2a2a30", borderRadius: 7, padding: "5px 9px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 };
const vcard = { background: "#131316", border: "1px solid #232329", borderRadius: 11, padding: 14 };
const vhead = { display: "flex", alignItems: "center", gap: 9 };
const vnum = { fontSize: 32, fontWeight: 800, lineHeight: 1, color: "#f2f2f2" };
const vlive = { marginLeft: "auto", fontSize: 10.5, color: "#6f6f78" };
const meter = { height: 6, borderRadius: 99, background: "#222", overflow: "hidden", marginTop: 11 };
const reasonsWrap = { marginTop: 11, display: "flex", flexDirection: "column", gap: 6 };
const reasonRow = { display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: UI.muted };
const vfoot = { fontSize: 10, color: "#6f6f78", marginTop: 11, lineHeight: 1.5 };

const TIER_COLOR = { hot: "#ff6a5f", warm: "#e67e22", mild: "#9aa0ab" };
function badge(tier) {
  const c = TIER_COLOR[tier] || TIER_COLOR.mild;
  const bg = tier === "hot" ? "#25100e" : tier === "warm" ? "#221607" : "#16161a";
  const bd = tier === "hot" ? "#59211d" : tier === "warm" ? "#4a3117" : "#2c2c33";
  return { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 800, letterSpacing: 0.3, color: c, background: bg, border: "1px solid " + bd, borderRadius: 5, padding: "3px 7px" };
}
function fill(score, tier) {
  const grad = tier === "mild" ? "linear-gradient(90deg,#4a4a52,#8a8a92)" : "linear-gradient(90deg,#e67e22,#e2433f)";
  return { display: "block", height: "100%", borderRadius: 99, width: Math.max(4, Math.min(100, score)) + "%", background: grad };
}
function dot(on) {
  return { width: 5, height: 5, borderRadius: 99, flexShrink: 0, background: on ? "#7be3a0" : "#4a4a52" };
}
