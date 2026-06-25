"use client";
import React, { useState } from "react";
import { LAYOUT_LIST, reflowSlide } from "./templates";
import StaticSlide from "./StaticSlide";

// Templates panel (spec §7). Shows the current slide's content rendered through
// each layout as a live preview; click to re-flow this slide (or the whole deck)
// into that layout. Applying is always explicit — manual edits persist until you
// pick a layout, and it's undoable.

const wrap = { width: 240, flexShrink: 0, display: "flex", flexDirection: "column", background: "#1b1b1f", borderRight: "1px solid #2a2a2f", minHeight: 0, fontFamily: "Helvetica, Arial, sans-serif" };
const head = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 8px" };
const xBtn = { width: 24, height: 24, lineHeight: "22px", textAlign: "center", background: "transparent", color: "#999", border: "none", cursor: "pointer", fontSize: 18, borderRadius: 5 };
const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 12px 12px", overflowY: "auto", alignContent: "start", minHeight: 0 };

function card(active) {
  return { display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: 6, borderRadius: 8, cursor: "pointer", background: active ? "#222228" : "transparent", border: "1.5px solid " + (active ? "#2d8cff" : "#2c2c32") };
}

export default function TemplatesPanel({ slide, onApply, onApplyAll, onClose }) {
  const [all, setAll] = useState(false);
  return (
    <div style={wrap}>
      <div style={head}>
        <strong style={{ fontSize: 12, letterSpacing: 0.5 }}>Templates</strong>
        <button style={xBtn} onClick={onClose} title="Close panel">×</button>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px 10px", fontSize: 12, color: "#bbb", cursor: "pointer" }}>
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Apply to all slides
      </label>
      <div style={grid}>
        {LAYOUT_LIST.map((l) => {
          // Preview through the same re-flow the store applies, so feature previews
          // show the photo as an element on a solid panel (and the round-trip back).
          const r = reflowSlide(slide, l.key);
          const preview = Object.assign({}, slide, { elements: r.elements, background: r.background });
          const active = slide.layout === l.key;
          return (
            <button key={l.key} type="button" onClick={() => (all ? onApplyAll(l.key) : onApply(l.key))} style={card(active)}>
              <div style={{ borderRadius: 5, overflow: "hidden", lineHeight: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                <StaticSlide slide={preview} width={96} />
              </div>
              <span style={{ fontSize: 11, color: active ? "#fff" : "#bbb" }}>{l.label}</span>
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: "#777", margin: 0, padding: "0 12px 12px", lineHeight: 1.5 }}>
        Re-flows this slide&apos;s text into the chosen layout. Undoable.
      </p>
    </div>
  );
}
