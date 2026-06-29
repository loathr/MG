"use client";
import React from "react";
import { UI } from "./theme";

// The floating format bar that appears above a text SELECTION while editing —
// per-span colour, bold, italic, strike, background, outline (+ a quick size
// nudge). Every control uses onMouseDown→preventDefault so the contentEditable
// keeps focus and the selection survives the click (no blur, no native-picker
// focus loss), then onClick applies the run via the store. Positioned in screen
// space from the selection's bounding rect.
export default function FormatBar({ style, accent, rect, onStyle, onClear, onSize }) {
  if (!rect) return null;
  const s = style || {};
  const bold = (s.fontWeight || 400) >= 700;
  const swatches = [accent || "#ffffff", "#ffffff", "#111111", "#e2473e", "#ffd34e", "#56b3ff"];
  // center above the selection, clamped to the viewport
  const W = 372, H = 42;
  const cx = Math.max(W / 2 + 8, Math.min((rect.left + rect.right) / 2, (typeof window !== "undefined" ? window.innerWidth : 1200) - W / 2 - 8));
  const top = Math.max(8, rect.top - H - 12);
  const hold = (e) => e.preventDefault(); // keep the editor's selection
  return (
    <div style={{ ...wrap, left: cx, top, width: W }} onMouseDown={hold}>
      {/* text colour swatches */}
      {swatches.map((c, i) => (
        <button key={i} onMouseDown={hold} onClick={() => onStyle({ color: c })}
          title={"Text colour"} style={{ ...sw, background: c, outline: s.color === c ? "2px solid " + UI.select : "none" }} />
      ))}
      <span style={sep} />
      <Tog on={bold} onMouseDown={hold} onClick={() => onStyle({ bold: !bold })} title="Bold"><b>B</b></Tog>
      <Tog on={!!s.italic} onMouseDown={hold} onClick={() => onStyle({ italic: !s.italic })} title="Italic"><i>I</i></Tog>
      <Tog on={!!s.strike} onMouseDown={hold} onClick={() => onStyle({ strike: !s.strike })} title="Strikethrough"><s>S</s></Tog>
      <span style={sep} />
      <Tog on={!!s.bg} onMouseDown={hold} onClick={() => onStyle(s.bg ? { bg: null } : { bg: accent || "#ffd34e" })} title="Highlight (background)">
        <span style={{ background: s.bg || "#ffd34e", color: "#101010", borderRadius: 3, padding: "0 3px", fontSize: 11, fontWeight: 700 }}>H</span>
      </Tog>
      <Tog on={!!(s.stroke && s.strokeWidth)} onMouseDown={hold} onClick={() => onStyle((s.stroke && s.strokeWidth) ? { stroke: null, strokeWidth: 0 } : { stroke: "#ffffff", strokeWidth: 4 })} title="Outline">
        <span style={{ WebkitTextStroke: "1px #fff", color: "transparent", fontWeight: 800, fontSize: 13 }}>O</span>
      </Tog>
      <span style={sep} />
      <Tog onMouseDown={hold} onClick={() => onSize(-6)} title="Smaller (selection)">A−</Tog>
      <Tog onMouseDown={hold} onClick={() => onSize(6)} title="Larger (selection)">A+</Tog>
      <span style={sep} />
      <Tog onMouseDown={hold} onClick={onClear} title="Clear styling on selection"><span style={{ color: UI.muted }}>✕</span></Tog>
    </div>
  );
}

function Tog({ on, children, onClick, onMouseDown, title }) {
  return (
    <button onMouseDown={onMouseDown} onClick={onClick} title={title}
      style={{ ...tog, background: on ? UI.select : "transparent", color: on ? "#fff" : "#dadade" }}>
      {children}
    </button>
  );
}

const wrap = {
  position: "fixed", zIndex: 60, transform: "translateX(-50%)", height: 42,
  display: "flex", alignItems: "center", gap: 2, padding: "0 7px",
  background: "#101013", border: "1px solid #33333c", borderRadius: 11,
  boxShadow: "0 14px 32px rgba(0,0,0,0.55)", fontFamily: "Helvetica, Arial, sans-serif",
};
const tog = {
  height: 30, minWidth: 30, padding: "0 8px", borderRadius: 8, border: "none",
  cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
};
const sw = { width: 18, height: 18, borderRadius: 5, border: "1px solid #00000055", cursor: "pointer", padding: 0, flexShrink: 0 };
const sep = { width: 1, height: 20, background: "#33333c", margin: "0 4px", flexShrink: 0 };
