"use client";
import React, { useEffect, useReducer } from "react";
import { reducer, initStudio } from "./store";
import { makeElement, ARTBOARD_W, ARTBOARD_H } from "./model";
import Artboard from "./Artboard";

const hbtn = {
  height: 30, padding: "0 12px", background: "#26262b", color: "#e8e8e8",
  border: "1px solid #36363c", borderRadius: 6, cursor: "pointer", fontSize: 12,
};

export default function Studio() {
  const [state, dispatch] = useReducer(reducer, undefined, initStudio);
  const slide = state.doc.slides[state.slideIndex];

  useEffect(() => {
    const onKey = (e) => {
      if (state.editingId) return;
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if ((e.key === "Delete" || e.key === "Backspace") && state.selectedId) {
        e.preventDefault();
        dispatch({ type: "delete", id: state.selectedId });
      } else if (e.key === "Escape") {
        dispatch({ type: "deselect" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.editingId, state.selectedId]);

  const addText = () => dispatch({ type: "add", element: makeElement("text", {
    x: Math.round((ARTBOARD_W - 600) / 2), y: Math.round((ARTBOARD_H - 120) / 2),
    w: 600, h: 120, content: "Double-click to edit", fontSize: 64, color: "#ffffff",
  }) });
  const addBox = () => dispatch({ type: "add", element: makeElement("rect", {
    x: Math.round((ARTBOARD_W - 300) / 2), y: Math.round((ARTBOARD_H - 200) / 2), w: 300, h: 200,
  }) });
  const addImage = () => {
    const url = window.prompt("Image URL:");
    if (url) dispatch({ type: "add", element: makeElement("image", {
      x: Math.round((ARTBOARD_W - 500) / 2), y: Math.round((ARTBOARD_H - 500) / 2), w: 500, h: 500, src: url,
    }) });
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#161618", color: "#eee", fontFamily: "Helvetica, Arial, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid #2a2a2f", flexShrink: 0 }}>
        <strong style={{ fontSize: 13, letterSpacing: 1 }}>LOATHR STUDIO</strong>
        <span style={{ fontSize: 10, color: "#777", border: "1px solid #333", padding: "2px 6px", borderRadius: 4 }}>Phase 0 · canvas editor</span>
        <div style={{ flex: 1 }} />
        <button style={hbtn} onClick={addText}>+ Text</button>
        <button style={hbtn} onClick={addBox}>+ Box</button>
        <button style={hbtn} onClick={addImage}>+ Image</button>
      </header>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Artboard slide={slide} selectedId={state.selectedId} editingId={state.editingId} dispatch={dispatch} />
      </div>
      <footer style={{ padding: "6px 16px", borderTop: "1px solid #2a2a2f", fontSize: 11, color: "#888", flexShrink: 0 }}>
        Click an element to select · drag to move · handles to resize/rotate · double-click text to edit · Del to delete · Esc to deselect
      </footer>
    </div>
  );
}
