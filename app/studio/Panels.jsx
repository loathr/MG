"use client";
import React from "react";
import { makeElement, ARTBOARD_W, ARTBOARD_H } from "./model";

const SERIF = "Georgia, serif";
const SANS = "Helvetica, Arial, sans-serif";
const M = 80;

const pBtn = {
  display: "block", width: "100%", textAlign: "left", padding: "12px 14px",
  background: "#1d1d21", color: "#e8e8e8", border: "1px solid #2f2f35",
  borderRadius: 8, cursor: "pointer", marginBottom: 8,
};

function PanelScroll({ children }) {
  return <div style={{ padding: 12, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>{children}</div>;
}

// --- Text: drop pre-styled text presets (§7) ---
export function TextPanel({ dispatch }) {
  const add = (props) => dispatch({ type: "add", element: makeElement("text", props) });
  return (
    <PanelScroll>
      <button style={pBtn} onClick={() => add({ x: M, y: 300, w: ARTBOARD_W - 2 * M, h: 220, content: "Add a heading", fontFamily: SERIF, fontSize: 92, fontWeight: 700, color: "#fff", lineHeight: 1.05 })}>
        <span style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700 }}>Add a heading</span>
      </button>
      <button style={pBtn} onClick={() => add({ x: M, y: 540, w: ARTBOARD_W - 2 * M, h: 120, content: "Add a subheading", fontFamily: SERIF, fontSize: 44, fontWeight: 400, color: "#eaeaea", lineHeight: 1.2 })}>
        <span style={{ fontFamily: SERIF, fontSize: 18 }}>Add a subheading</span>
      </button>
      <button style={pBtn} onClick={() => add({ x: M, y: 700, w: ARTBOARD_W - 2 * M, h: 200, content: "Add a little body text", fontFamily: SANS, fontSize: 30, fontWeight: 400, color: "#e8e8e8", lineHeight: 1.45 })}>
        <span style={{ fontFamily: SANS, fontSize: 13 }}>Add a little body text</span>
      </button>
    </PanelScroll>
  );
}

// --- Elements: flat fills only — no heavy effects (§7) ---
export function ElementsPanel({ dispatch }) {
  const add = (type, props) => dispatch({ type: "add", element: makeElement(type, props) });
  const swatch = (style, onClick, label) => (
    <button style={Object.assign({}, pBtn, { display: "flex", alignItems: "center", gap: 12 })} onClick={onClick}>
      <span style={style} /> <span style={{ fontSize: 13 }}>{label}</span>
    </button>
  );
  return (
    <PanelScroll>
      {swatch(
        { width: 44, height: 30, background: "#e23744", borderRadius: 3, flexShrink: 0 },
        () => add("rect", { x: (ARTBOARD_W - 360) / 2, y: (ARTBOARD_H - 240) / 2, w: 360, h: 240, fill: "#e23744" }),
        "Rectangle",
      )}
      {swatch(
        { width: 44, height: 30, background: "#fff", borderRadius: 3, flexShrink: 0 },
        () => add("rect", { x: (ARTBOARD_W - 360) / 2, y: (ARTBOARD_H - 240) / 2, w: 360, h: 240, fill: "#ffffff" }),
        "White block",
      )}
      {swatch(
        { width: 44, height: 6, background: "#fff", alignSelf: "center", flexShrink: 0 },
        () => add("line", { x: M, y: ARTBOARD_H / 2, w: ARTBOARD_W - 2 * M, h: 6, fill: "#ffffff" }),
        "Divider line",
      )}
      {swatch(
        { width: 44, height: 8, background: "#e23744", alignSelf: "center", flexShrink: 0 },
        () => add("rect", { x: M, y: 232, w: 64, h: 8, fill: "#e23744" }),
        "Accent bar",
      )}
    </PanelScroll>
  );
}

// --- Templates / Brand: framed now, wired in later build steps (§11.3, §11.5) ---
export function ComingSoonPanel({ title, note }) {
  return (
    <PanelScroll>
      <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>
        <strong style={{ color: "#ddd" }}>{title}</strong>
        <p style={{ marginTop: 8 }}>{note}</p>
      </div>
    </PanelScroll>
  );
}
