"use client";
import React from "react";
import { brandFromStyle, EDITORIAL_PALETTES, paletteBrand } from "./styles";

// Brand panel (spec §7). Deck-wide accent color, heading/body fonts, and the
// closing wordmark — applied across every slide and undoable. Re-themes by
// matching the current brand values, so anything you've hand-edited off-brand is
// left untouched.

const FONTS = [
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "Times (serif)", value: "'Times New Roman', serif" },
  { label: "Helvetica (sans)", value: "Helvetica, Arial, sans-serif" },
  { label: "Arial Black", value: "'Arial Black', Impact, sans-serif" },
  { label: "Trebuchet (sans)", value: "'Trebuchet MS', sans-serif" },
  { label: "Courier (mono)", value: "'Courier New', monospace" },
];

const wrap = {
  width: 240, flexShrink: 0, display: "flex", flexDirection: "column",
  background: "#1b1b1f", borderRight: "1px solid #2a2a2f", minHeight: 0,
  fontFamily: "Helvetica, Arial, sans-serif",
};
const head = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 8px" };
const xBtn = { width: 24, height: 24, lineHeight: "22px", textAlign: "center", background: "transparent", color: "#999", border: "none", cursor: "pointer", fontSize: 18, borderRadius: 5 };
const sel = { width: "100%", height: 34, background: "#26262b", color: "#e8e8e8", border: "1px solid #36363c", borderRadius: 6, fontSize: 13, padding: "0 8px" };
const inp = { width: "100%", height: 34, background: "#26262b", color: "#fff", border: "1px solid #36363c", borderRadius: 6, fontSize: 13, padding: "0 10px" };
const lbl = { fontSize: 11, color: "#9a9a9a", marginBottom: 6, display: "block" };

function hex(c) {
  return typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c) ? c : "#000000";
}

function Field({ label, children }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

export default function BrandPanel({ brand, onApply, onClose }) {
  // Fill any missing color fields from the editorial defaults so a palette swap
  // always has a known "previous" to remap from.
  const cur = Object.assign({}, brandFromStyle("editorial"), brand);
  const set = (patch) => onApply(cur, Object.assign({}, cur, patch));
  return (
    <div style={wrap}>
      <div style={head}>
        <strong style={{ fontSize: 12, letterSpacing: 0.5 }}>Brand</strong>
        <button style={xBtn} onClick={onClose} title="Close panel">×</button>
      </div>
      <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Palette">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {EDITORIAL_PALETTES.map((p) => {
              const active = cur.accent === p.accent && cur.bg === p.bg;
              return (
                <button key={p.id} title={p.label} onClick={() => set(paletteBrand(p))}
                  style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                  <span style={{ display: "block", height: 36, borderRadius: 6, background: p.bg, position: "relative",
                    boxShadow: active ? "0 0 0 2px #ffffff" : "inset 0 0 0 1px #ffffff22" }}>
                    <span style={{ position: "absolute", left: 6, bottom: 6, width: 14, height: 14, borderRadius: 7, background: p.accent }} />
                    <span style={{ position: "absolute", right: 7, top: 5, fontSize: 12, fontWeight: 700, fontFamily: "Georgia, serif", color: p.ink }}>Aa</span>
                  </span>
                  <span style={{ display: "block", marginTop: 4, fontSize: 9.5, lineHeight: 1.2, color: active ? "#e8e8e8" : "#8a8a8a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Accent color">
          <label style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", height: 34, padding: "0 8px", background: "#26262b", border: "1px solid #36363c", borderRadius: 6, cursor: "pointer" }}>
            <span style={{ width: 20, height: 20, borderRadius: 4, background: cur.accent, border: "1px solid #555" }} />
            <span style={{ fontSize: 12, color: "#bbb" }}>{cur.accent}</span>
            <input type="color" value={hex(cur.accent)} onChange={(e) => set({ accent: e.target.value })} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
          </label>
        </Field>
        <Field label="Heading font">
          <select value={cur.headFont} onChange={(e) => set({ headFont: e.target.value })} style={sel}>
            {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>
        <Field label="Body font">
          <select value={cur.bodyFont} onChange={(e) => set({ bodyFont: e.target.value })} style={sel}>
            {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>
        <Field label="Wordmark (closing slide)">
          <input value={cur.wordmark || ""} onChange={(e) => set({ wordmark: e.target.value })} style={inp} placeholder="LOATHR" />
        </Field>
        <p style={{ fontSize: 11, color: "#777", margin: 0, lineHeight: 1.5 }}>
          Applies across every slide. Undoable (⌘/Ctrl+Z).
        </p>
      </div>
    </div>
  );
}
