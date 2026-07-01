"use client";
import React, { useState, useEffect, useRef } from "react";
import { UI } from "./theme";
import { beatsForDesk, defaultBeat, beatVoice } from "./trending";
import { TrendingUp, ChevronDown, ChevronRight, RefreshCw, MapPin } from "lucide-react";

// The cued, hidden "Trending" panel on the create screen. Closed by default —
// just the pill. Opening it fetches live topics for the selected beat from the
// keyless /api/trending route (per-beat RSS + Wikipedia most-read). Tapping a
// card fills the topic and sets the matching voice (tie-back). Reskins lightly
// to the current desk: monochrome thumbnails for Enterprise, serif titles for
// News Desk. Zero Claude credits.
export default function TrendingPanel({ onPick, desk, beat: routeBeat, onBeat, region, country, urgency }) {
  const [open, setOpen] = useState(false);
  // The beat is owned by the create screen's route dropdown (shared state). When
  // the route is "Any" (null) we still browse the desk's first beat so the rail
  // has something to show; changing it here sets the route too.
  const beat = routeBeat || defaultBeat(desk);
  const [items, setItems] = useState([]);
  const [scope, setScope] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  // Load the beat's trending. `fresh` appends &fresh=1 so the route bypasses its
  // 30-min cache for a genuine re-pull (the refresh button); the normal open/beat
  // loads use the cache.
  const load = (fresh) => {
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true); setError("");
    // Region + urgency (News-desk secondary route, Tier 2b) scope/recency-filter
    // the live pull server-side; omitted when unset (other desks).
    const params = "?beat=" + encodeURIComponent(beat)
      + (region ? "&region=" + encodeURIComponent(region) : "")
      + (country ? "&country=" + encodeURIComponent(country) : "")
      + (urgency ? "&urgency=" + encodeURIComponent(urgency) : "")
      + (fresh ? "&fresh=1" : "");
    fetch("/api/trending" + params, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => {
        if (ac.signal.aborted) return;
        setItems(Array.isArray(d.items) ? d.items : []);
        setScope(d.scope || null);
        if (d.error) setError(d.error);
        setLoading(false);
      })
      .catch(() => { if (!ac.signal.aborted) { setError("Couldn't reach the trending feeds."); setLoading(false); } });
  };

  useEffect(() => {
    if (!open) return undefined;
    load(false);
    return () => { if (abortRef.current) abortRef.current.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, beat, region, country, urgency]);

  // Carry the card's summary + source as a grounding seed (R5) so generation is
  // built on the actual story, not just its title — plus the beat itself as the
  // route, so a picked card keeps paying off into generation.
  const pick = (it) => { onPick(it.title, beatVoice(beat), { extract: it.extract || "", source: it.source || "" }, beat); setOpen(false); };

  const mono = desk === "enterprise";
  const serif = desk === "newsdesk";

  return (
    <div style={{ width: "100%", marginTop: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={cue} title="Live trending topics — free sources, no credits used">
        <TrendingUp size={14} style={{ color: "#5aa6ff" }} /> Trending {open ? <ChevronDown size={13} style={{ color: "#6a6a73" }} /> : <ChevronRight size={13} style={{ color: "#6a6a73" }} />}
      </button>

      {open && (
        <div style={panel}>
          <div style={phead}>
            <span style={ptitle}><TrendingUp size={14} style={{ color: "#5aa6ff" }} /> Trending now</span>
            <button type="button" onClick={() => load(true)} style={refreshBtn} disabled={loading} title="Pull the latest"><RefreshCw size={13} /> Refresh</button>
          </div>
          <div style={ddRow}>
            <span style={ddLabel}>Trending in</span>
            <select value={beat} onChange={(e) => onBeat(e.target.value)} style={ddSelect} title="Pick a beat">
              {beatsForDesk(desk).map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>

          {scope && scope.requested && !loading ? (
            <div style={scopeNote(scope.sourced)} title="What scope produced these results">
              <MapPin size={13} style={{ flexShrink: 0 }} />{" "}
              {scope.sourced
                ? "Scoped to " + scope.requested + (scope.hubs > 1 ? " · " + scope.hubs + " hubs" : "")
                : "No live " + scope.requested + " results — showing global"}
            </div>
          ) : null}

          {loading ? (
            <div style={note}>Loading what&apos;s trending…</div>
          ) : items.length ? (
            <div style={cards}>
              {items.map((it, i) => (
                <button key={i} type="button" onClick={() => pick(it)} style={card} title={"Use: " + it.title}>
                  {it.thumb ? (
                    <span style={Object.assign({}, thumb, { backgroundImage: "url(" + it.thumb + ")", filter: mono ? "grayscale(1) contrast(1.05)" : "none" })} />
                  ) : it.source === "seed" ? (
                    <span style={seedTile}><span style={seedBadge}>IDEA</span></span>
                  ) : (
                    <span style={noimg}><span style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#5a5a64" }}>{(it.title[0] || "?").toUpperCase()}</span></span>
                  )}
                  <span style={Object.assign({}, title, { fontFamily: serif ? "Georgia, serif" : "Helvetica, Arial, sans-serif" })}>{it.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={note}>{error || "Nothing trending right now — type your own topic above."}</div>
          )}

          <div style={foot}>Live from free sources (Wikipedia + news feeds) · no credits used</div>
        </div>
      )}
    </div>
  );
}

const cue = {
  display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: "#9aa0ab",
  cursor: "pointer", padding: "7px 14px", borderRadius: 999, border: "1px solid #2f2f37",
  background: "rgba(255,255,255,0.015)",
};
const panel = {
  width: "100%", marginTop: 14, border: "1px solid #2a2a2f", background: "#19191d",
  borderRadius: 14, padding: "14px 14px 12px", textAlign: "left",
};
const phead = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 };
const ptitle = { fontSize: 11.5, letterSpacing: 1, textTransform: "uppercase", color: "#b9bdc6", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 7 };
const refreshBtn = { fontSize: 11.5, color: "#9aa0ab", background: "transparent", border: "1px solid #2f2f37", borderRadius: 999, padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 };
const ddRow = { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 };
const ddLabel = { fontSize: 12, color: UI.muted, flexShrink: 0 };
const ddSelect = { flex: 1, height: 38, borderRadius: 8, background: UI.surface2, color: "#fff", border: "1px solid " + UI.border, fontSize: 13, padding: "0 11px", cursor: "pointer" };
const scopeNote = (sourced) => ({
  display: "flex", alignItems: "center", gap: 6, fontSize: 11, marginBottom: 12, padding: "6px 10px",
  borderRadius: 7, background: sourced ? "#142019" : "#221c16",
  border: "1px solid " + (sourced ? "#264a36" : "#43381f"), color: sourced ? "#8fd3a8" : "#d9b88a",
});
const cards = { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" };
// Seed (curated topic) card tile — a clean "idea" placeholder, not a broken image.
const seedTile = { display: "flex", height: 120, borderRadius: 10, alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#20202a,#191921)", border: "1px dashed #3a3a46" };
const seedBadge = { fontSize: 8.5, fontWeight: 700, letterSpacing: 1, color: "#8a8ad0", border: "1px solid #3a3a5a", borderRadius: 4, padding: "2px 5px" };
const card = { width: 96, cursor: "pointer", background: "transparent", border: "none", padding: 0, textAlign: "left", display: "block" };
const thumb = {
  display: "block", height: 120, borderRadius: 10, backgroundSize: "cover",
  backgroundPosition: "center", backgroundColor: "#202026", boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
};
const noimg = {
  display: "flex", alignItems: "center", justifyContent: "center", height: 120,
  borderRadius: 10, backgroundColor: "#202026", border: "1px solid #303038",
};
// Clamp to two lines so long article headlines stay uniform — the key to a tidy
// rail rather than a ragged grid of 5-6-line cards.
const title = {
  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
  marginTop: 8, fontSize: 11.5, color: "#d8d8d8", lineHeight: 1.25, height: 29,
};
const note = { color: "#8a8a8a", fontSize: 13, padding: "16px 4px", textAlign: "center" };
const foot = { fontSize: 10.5, color: "#5f5f68", marginTop: 12, textAlign: "center" };
