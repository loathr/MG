"use client";
import React from "react";

const FONTS = [
  "Georgia, serif",
  "Helvetica, Arial, sans-serif",
  "'Times New Roman', serif",
  "Impact, sans-serif",
  "'Courier New', monospace",
  "'Trebuchet MS', sans-serif",
];

const btn = (active) => ({
  height: 26, minWidth: 26, padding: "0 7px",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  background: active ? "#2d8cff" : "transparent",
  color: active ? "#fff" : "#e8e8e8",
  border: "none", borderRadius: 5, cursor: "pointer", fontSize: 12,
});
const sep = { width: 1, height: 18, background: "#3a3a40", margin: "0 3px" };

export default function Toolbar({ el, dispatch }) {
  const up = (patch) => dispatch({ type: "update", id: el.id, patch });
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        display: "flex", alignItems: "center", gap: 2,
        background: "#26262b", border: "1px solid #36363c", borderRadius: 8,
        padding: "4px 6px", boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
        fontFamily: "Helvetica, Arial, sans-serif", whiteSpace: "nowrap",
      }}
    >
      {el.type === "text" && (
        <>
          <select value={el.fontFamily} onChange={(e) => up({ fontFamily: e.target.value })}
            style={{ height: 26, background: "#1d1d21", color: "#e8e8e8", border: "1px solid #3a3a40", borderRadius: 5, fontSize: 11, maxWidth: 120 }}>
            {FONTS.map((f) => <option key={f} value={f}>{f.split(",")[0].replace(/'/g, "")}</option>)}
          </select>
          <input type="number" value={Math.round(el.fontSize)} min={6} max={400}
            onChange={(e) => up({ fontSize: Math.max(6, +e.target.value || 6) })}
            style={{ width: 48, height: 26, background: "#1d1d21", color: "#e8e8e8", border: "1px solid #3a3a40", borderRadius: 5, fontSize: 12, textAlign: "center" }} />
          <button style={btn(el.fontWeight >= 700)} onClick={() => up({ fontWeight: el.fontWeight >= 700 ? 400 : 700 })}><b>B</b></button>
          <button style={btn(el.italic)} onClick={() => up({ italic: !el.italic })}><i>I</i></button>
          <button style={btn(false)} title="Align"
            onClick={() => up({ align: el.align === "left" ? "center" : el.align === "center" ? "right" : "left" })}>
            {el.align === "center" ? "≡" : el.align === "right" ? "≖" : "≣"}
          </button>
          <label style={{ ...btn(false), padding: 0, position: "relative", overflow: "hidden" }}>
            <span style={{ width: 16, height: 16, borderRadius: 3, background: el.color, border: "1px solid #555" }} />
            <input type="color" value={hexish(el.color)} onChange={(e) => up({ color: e.target.value })}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
          </label>
        </>
      )}

      {(el.type === "rect" || el.type === "line") && (
        <>
          <label style={{ ...btn(false), padding: 0, position: "relative", overflow: "hidden" }}>
            <span style={{ width: 16, height: 16, borderRadius: 3, background: el.fill, border: "1px solid #555" }} />
            <input type="color" value={hexish(el.fill)} onChange={(e) => up({ fill: e.target.value })}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
          </label>
          {el.type === "rect" && (
            <input type="number" value={el.radius || 0} min={0} max={400} title="Corner radius"
              onChange={(e) => up({ radius: Math.max(0, +e.target.value || 0) })}
              style={{ width: 48, height: 26, background: "#1d1d21", color: "#e8e8e8", border: "1px solid #3a3a40", borderRadius: 5, fontSize: 12, textAlign: "center" }} />
          )}
        </>
      )}

      {el.type === "image" && (
        <select value={el.fit || "cover"} onChange={(e) => up({ fit: e.target.value })}
          style={{ height: 26, background: "#1d1d21", color: "#e8e8e8", border: "1px solid #3a3a40", borderRadius: 5, fontSize: 11 }}>
          <option value="cover">Fill</option>
          <option value="contain">Fit</option>
        </select>
      )}

      <div style={sep} />
      <button style={btn(false)} title="Bring forward" onClick={() => dispatch({ type: "raise", id: el.id })}>↑</button>
      <button style={btn(false)} title="Send backward" onClick={() => dispatch({ type: "lower", id: el.id })}>↓</button>
      <button style={{ ...btn(false), color: "#ff6b6b" }} title="Delete" onClick={() => dispatch({ type: "delete", id: el.id })}>🗑</button>
    </div>
  );
}

function hexish(c) {
  if (typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c)) return c;
  return "#ffffff";
}
