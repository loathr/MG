"use client";
import React, { useEffect, useReducer, useRef, useState } from "react";
import { reducer, initStudio } from "./store";
import { makeElement, imageBackground, blankDoc, ARTBOARD_W, ARTBOARD_H } from "./model";
import { generateCarousel } from "./generate";
import { photosDemoDoc } from "./demo";
import Artboard from "./Artboard";
import SlideThumb from "./SlideThumb";
import PhotosPanel from "./PhotosPanel";
import BrandPanel from "./BrandPanel";
import TemplatesPanel from "./TemplatesPanel";
import CreateScreen from "./CreateScreen";
import { exportSlide, exportSlides } from "./export";

const hbtn = {
  height: 32, padding: "0 12px", background: "#26262b", color: "#e8e8e8",
  border: "1px solid #36363c", borderRadius: 6, cursor: "pointer", fontSize: 12,
};
const iconBtn = (enabled) => ({
  ...hbtn, minWidth: 34, padding: "0 9px", fontSize: 15, lineHeight: 1,
  opacity: enabled ? 1 : 0.4, cursor: enabled ? "pointer" : "default",
});

// Left tool rail (spec §5). Photos is wired; Text/Elements drop pre-styled
// content; Templates/Brand are placeholders for later passes.
const TOOLS = [
  { key: "text", label: "Text", glyph: "T" },
  { key: "elements", label: "Elements", glyph: "▢" },
  { key: "photos", label: "Photos", glyph: "⛰" },
  { key: "templates", label: "Templates", glyph: "▤" },
  { key: "brand", label: "Brand", glyph: "✦" },
];

// Pre-styled text presets for the Text panel (centered when dropped).
const TEXT_PRESETS = {
  heading: { w: ARTBOARD_W - 2 * 80, h: 240, content: "Your heading", fontSize: 84, fontWeight: 700, fontFamily: "Georgia, serif", color: "#ffffff", lineHeight: 1.05 },
  subheading: { w: ARTBOARD_W - 2 * 80, h: 120, content: "A supporting subheading", fontSize: 40, fontWeight: 400, fontFamily: "Georgia, serif", color: "#eaeaea", lineHeight: 1.3 },
  body: { w: ARTBOARD_W - 2 * 80, h: 220, content: "Body text — double-click to edit.", fontSize: 30, fontWeight: 400, fontFamily: "Helvetica, Arial, sans-serif", color: "#e8e8e8", lineHeight: 1.45 },
};

export default function Studio() {
  const [state, dispatch] = useReducer(reducer, undefined, initStudio);
  const [screen, setScreen] = useState("create"); // "create" | "editor"
  const [projectName, setProjectName] = useState("Untitled");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [activePanel, setActivePanel] = useState("photos");
  const [dlOpen, setDlOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const booted = useRef(false);
  const dragFrom = useRef(null); // slide index being drag-reordered in the strip
  const slide = state.doc.slides[state.slideIndex];

  // Optional demo deck for the FLAT-LAYERS image-path proof: ?demo=photos9 jumps
  // straight into the editor. Client-only (avoids SSR mismatch) and runs once.
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "photos9") {
      dispatch({ type: "loadDoc", doc: photosDemoDoc() });
      setProjectName("Photo demo");
      setScreen("editor");
    }
  }, []);

  useEffect(() => {
    if (screen !== "editor") return;
    const onKey = (e) => {
      if (state.editingId) return;
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" });
        return;
      }
      if (meta && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        dispatch({ type: "redo" });
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && state.selectedId) {
        e.preventDefault();
        dispatch({ type: "delete", id: state.selectedId });
      } else if (e.key === "Escape") {
        dispatch({ type: "deselect" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, state.editingId, state.selectedId]);

  // Create screen → generate in the chosen style → land in the editor.
  const handleGenerate = async ({ style, category, topic }) => {
    if (generating) return;
    setGenerating(true); setGenError("");
    try {
      const doc = await generateCarousel(topic, { style, category });
      dispatch({ type: "loadDoc", doc });
      setProjectName(topic);
      setScreen("editor");
    } catch (e) {
      setGenError(e && e.message ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const startBlank = () => {
    dispatch({ type: "loadDoc", doc: blankDoc() });
    setProjectName("Untitled");
    setGenError("");
    setScreen("editor");
  };

  const addText = (kind) => {
    const preset = TEXT_PRESETS[kind] || TEXT_PRESETS.heading;
    dispatch({ type: "add", element: makeElement("text", Object.assign({
      x: Math.round((ARTBOARD_W - preset.w) / 2),
      y: Math.round((ARTBOARD_H - preset.h) / 2),
    }, preset)) });
  };
  const addRect = () => dispatch({ type: "add", element: makeElement("rect", {
    x: Math.round((ARTBOARD_W - 300) / 2), y: Math.round((ARTBOARD_H - 200) / 2), w: 300, h: 200,
  }) });
  const addLine = () => dispatch({ type: "add", element: makeElement("line", {
    x: Math.round((ARTBOARD_W - 360) / 2), y: Math.round(ARTBOARD_H / 2), w: 360, h: 6, fill: "#ffffff",
  }) });

  // Photos panel actions. "Pick, never paste" — no URL entry anywhere.
  const setPhotoBackground = (img) => dispatch({ type: "setBg", patch: imageBackground(img, 0.4) });
  const addPhotoElement = (img) => dispatch({ type: "add", element: makeElement("image", {
    x: Math.round((ARTBOARD_W - 560) / 2), y: Math.round((ARTBOARD_H - 700) / 2),
    w: 560, h: 700, src: img.url, thumb: img.thumb || img.url, fit: "cover",
  }) });

  const exportCurrent = async () => {
    setDlOpen(false); setExporting(true);
    try { await exportSlide(slide, projectName, state.slideIndex); } finally { setExporting(false); }
  };
  const exportDeck = async () => {
    setDlOpen(false); setExporting(true);
    try { await exportSlides(state.doc.slides, projectName); } finally { setExporting(false); }
  };

  const toggle = (key) => setActivePanel((p) => (p === key ? null : key));

  if (screen === "create") {
    return <CreateScreen onGenerate={handleGenerate} onBlank={startBlank} generating={generating} error={genError} />;
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#161618", color: "#eee", fontFamily: "Helvetica, Arial, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid #2a2a2f", flexShrink: 0 }}>
        <button style={hbtn} onClick={() => setScreen("create")} title="Back to start">‹ New</button>
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          title="Project name"
          style={{ width: 260, height: 32, padding: "0 10px", background: "transparent", color: "#fff", border: "1px solid transparent", borderRadius: 6, fontSize: 14, fontWeight: 600 }}
          onFocus={(e) => { e.target.style.border = "1px solid #36363c"; e.target.style.background = "#1d1d21"; }}
          onBlur={(e) => { e.target.style.border = "1px solid transparent"; e.target.style.background = "transparent"; }}
        />
        <button style={iconBtn(state.past.length > 0)} disabled={state.past.length === 0} onClick={() => dispatch({ type: "undo" })} title="Undo (Ctrl/Cmd+Z)">↶</button>
        <button style={iconBtn(state.future.length > 0)} disabled={state.future.length === 0} onClick={() => dispatch({ type: "redo" })} title="Redo (Ctrl/Cmd+Shift+Z)">↷</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "#777", marginRight: 4 }}>
          {state.doc.slides.length} slide{state.doc.slides.length === 1 ? "" : "s"}
        </span>
        <div style={{ position: "relative" }}>
          <button
            style={{ ...hbtn, background: "#2d8cff", color: "#fff", border: "none", fontWeight: 600 }}
            disabled={exporting}
            onClick={() => setDlOpen((o) => !o)}
            title="Download as PNG"
          >
            {exporting ? "Exporting…" : "⬇ Download ▾"}
          </button>
          {dlOpen && (
            <>
              <div onClick={() => setDlOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
              <div style={{ position: "absolute", right: 0, top: 38, minWidth: 176, background: "#26262b", border: "1px solid #36363c", borderRadius: 8, padding: 4, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.45)" }}>
                <button style={menuItem} onClick={exportCurrent}>This slide (PNG)</button>
                <button style={menuItem} onClick={exportDeck}>All {state.doc.slides.length} slides (.zip)</button>
              </div>
            </>
          )}
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Left tool rail */}
        <nav style={{ width: 72, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, padding: "8px 6px", background: "#121214", borderRight: "1px solid #2a2a2f" }}>
          {TOOLS.map((t) => {
            const active = activePanel === t.key;
            return (
              <button key={t.key} onClick={() => toggle(t.key)} title={t.label}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                  height: 58, borderRadius: 8, cursor: "pointer", fontSize: 10,
                  background: active ? "#26262b" : "transparent",
                  color: active ? "#fff" : "#9a9a9a",
                  border: "1px solid " + (active ? "#36363c" : "transparent"),
                }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{t.glyph}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active panel beside the rail */}
        {activePanel === "photos" && (
          <PhotosPanel onSetBackground={setPhotoBackground} onAddImage={addPhotoElement} onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "text" && (
          <SidePanel title="Text" onClose={() => setActivePanel(null)}>
            <PanelButton onClick={() => addText("heading")}>Add heading</PanelButton>
            <PanelButton onClick={() => addText("subheading")}>Add subheading</PanelButton>
            <PanelButton onClick={() => addText("body")}>Add body text</PanelButton>
          </SidePanel>
        )}
        {activePanel === "elements" && (
          <SidePanel title="Elements" onClose={() => setActivePanel(null)}>
            <PanelButton onClick={addRect}>Rectangle</PanelButton>
            <PanelButton onClick={addLine}>Line / divider</PanelButton>
          </SidePanel>
        )}
        {activePanel === "templates" && (
          <TemplatesPanel
            slide={slide}
            onApply={(layout) => dispatch({ type: "setLayout", layout })}
            onApplyAll={(layout) => dispatch({ type: "setLayout", layout, all: true })}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "brand" && (
          <BrandPanel
            brand={state.doc.brand}
            onApply={(prev, next) => dispatch({ type: "applyBrand", prev, brand: next })}
            onLogo={(logo) => dispatch({ type: "setLogo", logo })}
            onClose={() => setActivePanel(null)}
          />
        )}

        <Artboard slide={slide} selectedId={state.selectedId} editingId={state.editingId} dispatch={dispatch} />
      </div>

      {/* Slide strip — lightweight thumbnails (FLAT-LAYERS §3) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderTop: "1px solid #2a2a2f", overflowX: "auto", flexShrink: 0 }}>
        {state.doc.slides.map((s, i) => (
          <SlideStripItem
            key={s.id}
            slide={s}
            index={i}
            active={i === state.slideIndex}
            canDelete={state.doc.slides.length > 1}
            dragFrom={dragFrom}
            onSelect={() => dispatch({ type: "setSlide", index: i })}
            onReorder={(from, to) => dispatch({ type: "moveSlide", from, to })}
            onDuplicate={() => dispatch({ type: "duplicateSlide", index: i })}
            onDelete={() => dispatch({ type: "deleteSlide", index: i })}
          />
        ))}
        <button onClick={() => dispatch({ type: "addSlide" })} title="Add slide"
          style={{ width: 60, height: 75, flexShrink: 0, borderRadius: 5, border: "1.5px dashed #3a3a40", background: "transparent", color: "#888", cursor: "pointer", fontSize: 22 }}>
          +
        </button>
        <span style={{ marginLeft: 6, fontSize: 11, color: "#777", whiteSpace: "nowrap" }}>
          drag thumbnails to reorder · hover for ⧉ duplicate / × delete · ⌘/Ctrl+Z undo
        </span>
      </div>
    </div>
  );
}

const panelNote = { color: "#8a8a8a", fontSize: 12, lineHeight: 1.5, margin: 0 };
const menuItem = {
  display: "block", width: "100%", textAlign: "left", height: 32, padding: "0 10px",
  background: "transparent", color: "#e8e8e8", border: "none", borderRadius: 6,
  cursor: "pointer", fontSize: 13,
};

function SidePanel({ title, onClose, children }) {
  return (
    <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, padding: 12, background: "#1b1b1f", borderRight: "1px solid #2a2a2f", fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 12, letterSpacing: 0.5 }}>{title}</strong>
        <button onClick={onClose} title="Close panel"
          style={{ width: 24, height: 24, background: "transparent", color: "#999", border: "none", cursor: "pointer", fontSize: 18, borderRadius: 5 }}>×</button>
      </div>
      {children}
    </div>
  );
}

function PanelButton({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ height: 36, padding: "0 12px", textAlign: "left", background: "#26262b", color: "#e8e8e8", border: "1px solid #36363c", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
      {children}
    </button>
  );
}

const miniBtn = {
  width: 18, height: 18, lineHeight: "15px", textAlign: "center", fontSize: 12, padding: 0,
  background: "rgba(18,18,20,0.9)", color: "#fff", border: "1px solid #444", borderRadius: 4,
  cursor: "pointer", pointerEvents: "auto",
};

// A slide thumbnail in the strip, wrapped with drag-to-reorder + hover
// duplicate/delete controls (spec §5). Keeps SlideThumb itself presentational.
function SlideStripItem({ slide, index, active, canDelete, dragFrom, onSelect, onReorder, onDuplicate, onDelete }) {
  const [hover, setHover] = useState(false);
  const [over, setOver] = useState(false);
  return (
    <div
      draggable
      onDragStart={(e) => { dragFrom.current = index; e.dataTransfer.effectAllowed = "move"; }}
      onDragOver={(e) => { e.preventDefault(); if (!over) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const from = dragFrom.current;
        dragFrom.current = null;
        if (from != null && from !== index) onReorder(from, index);
      }}
      onDragEnd={() => { dragFrom.current = null; setOver(false); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative", flexShrink: 0, borderRadius: 6, outline: over ? "2px solid #2d8cff" : "none", outlineOffset: 1 }}
    >
      <SlideThumb slide={slide} index={index} active={active} onClick={onSelect} />
      {hover && (
        <div style={{ position: "absolute", top: 2, left: 2, right: 2, display: "flex", justifyContent: "space-between", pointerEvents: "none" }}>
          <button title="Duplicate slide" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} style={miniBtn}>⧉</button>
          {canDelete && (
            <button title="Delete slide" onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ ...miniBtn, color: "#ff8a8a" }}>×</button>
          )}
        </div>
      )}
    </div>
  );
}
