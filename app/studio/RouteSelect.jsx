"use client";
import React, { useState } from "react";
import { UI } from "./theme";
import { groupsForDesk, getBeat, deskKind } from "./trending";

// The template-specific TOPIC ROUTE control (TOPIC_ROUTES.md, mock "B"): a
// grouped dropdown that collapses to one line. Its label adapts to the desk —
// Beat (Editorial) / Sector (Enterprise) / Section (News Desk) — and its options
// are that desk's beats, clustered by `group`. "Any" (value = null) is always
// first and means the deck stays sector-free (the prompt is unchanged). The
// chosen beat is carried into generation as the route, never inserted as a topic.
export default function RouteSelect({ desk, value, onChange }) {
  const [open, setOpen] = useState(false);
  const kind = deskKind(desk);
  const groups = groupsForDesk(desk);
  const current = value ? getBeat(value).label : "Any";
  const pick = (key) => { onChange(key); setOpen(false); };

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <div style={lab}>{kind} <span style={opt}>— optional</span></div>
      <button type="button" onClick={() => setOpen((o) => !o)} style={sel(open)} title={kind + " route"}>
        <span style={pre}>{kind}</span>
        <span style={{ ...cur, color: value ? "#fff" : UI.muted }}>{current}</span>
        <span style={chev}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div onClick={() => setOpen(false)} style={backdrop} />
          <div style={menu}>
            <button type="button" onClick={() => pick(null)} style={item(value == null, true)}>
              Any <span style={{ color: UI.muted }}>— {kind.toLowerCase()}-free</span>
            </button>
            <div style={grid}>
              {groups.map((g) => (
                <div key={g.group}>
                  <div style={ghead}>{g.group}</div>
                  {g.beats.map((b) => (
                    <button key={b.key} type="button" onClick={() => pick(b.key)} style={item(value === b.key, false)}>
                      {b.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const lab = { fontSize: 10, letterSpacing: 1.2, color: UI.muted, textTransform: "uppercase", marginBottom: 9, textAlign: "left" };
const opt = { color: "#5c5c64", letterSpacing: 0.3, textTransform: "none" };
function sel(open) {
  return {
    width: "100%", height: 46, borderRadius: 10, background: UI.surface2,
    border: "1px solid " + (open ? "#3a3a42" : UI.border), display: "flex", alignItems: "center",
    padding: "0 15px", gap: 10, cursor: "pointer",
  };
}
const pre = { fontSize: 10, letterSpacing: 1, color: UI.muted, textTransform: "uppercase" };
const cur = { fontSize: 14.5, fontWeight: 600 };
const chev = { marginLeft: "auto", color: "#7f7f88", fontSize: 13 };
const backdrop = { position: "fixed", inset: 0, zIndex: 40 };
const menu = {
  position: "absolute", left: 0, right: 0, top: "100%", marginTop: 8, zIndex: 41,
  border: "1px solid " + UI.border, borderRadius: 12, background: "#0d0d10",
  padding: 10, boxShadow: "0 18px 44px rgba(0,0,0,0.6)", textAlign: "left",
};
const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" };
const ghead = { fontSize: 9.5, letterSpacing: 1.3, color: "#5f5f68", textTransform: "uppercase", padding: "12px 10px 6px" };
function item(on, any) {
  return {
    display: "block", width: "100%", textAlign: "left", padding: "9px 11px", borderRadius: 8,
    fontSize: 13.5, cursor: "pointer", border: "none",
    background: on ? "#fff" : "transparent", color: on ? "#0a0a0a" : (any ? "#b6b6be" : "#d2d2d8"),
    fontWeight: on ? 600 : 400, marginBottom: any ? 4 : 0,
  };
}
