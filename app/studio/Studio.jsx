"use client";
import React, { useEffect, useReducer, useState } from "react";
import { reducer, initStudio } from "./store";
import { makeElement, ARTBOARD_W, ARTBOARD_H } from "./model";
import { generateCarousel } from "./generate";
import Artboard from "./Artboard";

const hbtn = {
  height: 32, padding: "0 12px", background: "#26262b", color: "#e8e8e8",
  border: "1px solid #36363c", borderRadius: 6, cursor: "pointer", fontSize: 12,
};

export default function Studio() {
  const [state, dispatch] = useReducer(reducer, undefined, initStudio);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
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

  const generate = async () => {
    if (!topic.trim() || generating) return;
    setGenerating(true); setGenError("");
    try {
      const doc = await generateCarousel(topic.trim());
      dispatch({ type: "loadDoc", doc });
    } catch (e) {
      setGenError(e && e.message ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

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
      <header style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid #2a2a2f", flexShrink: 0 }}>
        <strong style={{ fontSize: 13, letterSpacing: 1 }}>LOATHR STUDIO</strong>
        <span style={{ fontSize: 10, color: "#777", border: "1px solid #333", padding: "2px 6px", borderRadius: 4 }}>Editorial</span>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") generate(); }}
          placeholder="Enter a topic, e.g. FIFA World Cup recap…"
          style={{ flex: 1, maxWidth: 460, height: 32, padding: "0 12px", background: "#1d1d21", color: "#fff", border: "1px solid #36363c", borderRadius: 6, fontSize: 13 }}
        />
        <button style={{ ...hbtn, background: generating ? "#2d8cff55" : "#2d8cff", color: "#fff", border: "none", minWidth: 96 }} onClick={generate} disabled={generating}>
          {generating ? "Generating…" : "Generate"}
        </button>
        <div style={{ flex: 1 }} />
        <button style={hbtn} onClick={addText}>+ Text</button>
        <button style={hbtn} onClick={addBox}>+ Box</button>
        <button style={hbtn} onClick={addImage}>+ Image</button>
      </header>

      {genError && (
        <div style={{ padding: "6px 16px", background: "#3a1f22", color: "#ff9a9a", fontSize: 12, flexShrink: 0 }}>
          {genError}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Artboard slide={slide} selectedId={state.selectedId} editingId={state.editingId} dispatch={dispatch} />
      </div>

      {/* slide navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderTop: "1px solid #2a2a2f", overflowX: "auto", flexShrink: 0 }}>
        {state.doc.slides.map((s, i) => (
          <button key={s.id} onClick={() => dispatch({ type: "setSlide", index: i })}
            style={{
              minWidth: 30, height: 30, borderRadius: 6, cursor: "pointer", fontSize: 12,
              background: i === state.slideIndex ? "#2d8cff" : "#26262b",
              color: i === state.slideIndex ? "#fff" : "#bbb",
              border: "1px solid " + (i === state.slideIndex ? "#2d8cff" : "#36363c"),
            }}>{i + 1}</button>
        ))}
        <span style={{ marginLeft: 8, fontSize: 11, color: "#777" }}>
          {state.doc.slides.length} slide{state.doc.slides.length === 1 ? "" : "s"} · drag to move · handles resize/rotate · double-click text · Del / Esc
        </span>
      </div>
    </div>
  );
}
