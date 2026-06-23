"use client";
import React, { useEffect, useReducer, useRef, useState } from "react";
import {
  Type, Shapes, Image as ImageIcon, LayoutTemplate, Palette,
  ArrowLeft, Undo2, Redo2, Download, Plus, Copy, Trash2,
} from "lucide-react";
import { reducer, initStudio } from "./store";
import Artboard from "./Artboard";
import SlideThumb from "./SlideThumb";
import PhotosPanel from "./PhotosPanel";
import { TextPanel, ElementsPanel, ComingSoonPanel } from "./Panels";
import { makePhotoCarouselDoc } from "./demo";
import { exportSlide, exportAll } from "./export";

const TOOLS = [
  { id: "text", label: "Text", Icon: Type },
  { id: "elements", label: "Elements", Icon: Shapes },
  { id: "photos", label: "Photos", Icon: ImageIcon },
  { id: "templates", label: "Templates", Icon: LayoutTemplate },
  { id: "brand", label: "Brand", Icon: Palette },
];

export default function Studio() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initStudio());
  const [tool, setTool] = useState("photos");
  const [menu, setMenu] = useState(null); // slide context menu: { index, x, y }
  const slide = state.doc.slides[state.slideIndex];

  // Demo seed for the crash-safety proof: /studio?demo=photos9 loads a 9-slide
  // photo carousel. Done in an effect so it runs client-side only.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "photos9") {
      dispatch({ type: "loadDoc", doc: makePhotoCarouselDoc(), name: "Photo carousel demo" });
    }
  }, []);

  // Global keys: delete selection, Esc to deselect.
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

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#161618", color: "#eee", fontFamily: "Helvetica, Arial, sans-serif" }} onClick={() => setMenu(null)}>
      <TopBar name={state.name} dispatch={dispatch} slide={slide} slides={state.doc.slides} slideIndex={state.slideIndex} />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <ToolRail tool={tool} setTool={setTool} />
        {tool && (
          <SidePanel tool={tool} onClose={() => setTool(null)} dispatch={dispatch} />
        )}
        <Artboard slide={slide} selectedId={state.selectedId} editingId={state.editingId} dispatch={dispatch} />
      </div>

      <SlideStrip
        slides={state.doc.slides}
        slideIndex={state.slideIndex}
        dispatch={dispatch}
        menu={menu}
        setMenu={setMenu}
      />
    </div>
  );
}

// --- top bar -----------------------------------------------------------------
const iconBtn = (disabled) => ({
  width: 34, height: 30, display: "grid", placeItems: "center",
  background: "transparent", color: disabled ? "#555" : "#cfcfcf",
  border: "1px solid transparent", borderRadius: 6,
  cursor: disabled ? "not-allowed" : "pointer",
});

function TopBar({ name, dispatch, slide, slides, slideIndex }) {
  const [dl, setDl] = useState(false);
  const [busy, setBusy] = useState(false);

  const doExport = async (mode) => {
    setDl(false);
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "all") await exportAll(slides);
      else await exportSlide(slide, slideIndex);
    } catch (e) {
      alert("Export failed: " + (e && e.message ? e.message : "unknown error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <header style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderBottom: "1px solid #2a2a2f", flexShrink: 0, position: "relative", zIndex: 30 }}>
      <button style={iconBtn(false)} title="Back" onClick={() => window.history.back()}><ArrowLeft size={18} /></button>
      <strong style={{ fontSize: 12, letterSpacing: 1, color: "#9a9aa0" }}>LOATHR</strong>
      <span style={{ width: 1, height: 18, background: "#2f2f35", margin: "0 2px" }} />
      <input
        value={name}
        onChange={(e) => dispatch({ type: "setName", name: e.target.value })}
        style={{ background: "transparent", border: "1px solid transparent", color: "#e8e8e8", fontSize: 13, padding: "4px 6px", borderRadius: 5, minWidth: 140, maxWidth: 280 }}
        onFocus={(e) => (e.target.style.border = "1px solid #36363c")}
        onBlur={(e) => (e.target.style.border = "1px solid transparent")}
        aria-label="Project name"
      />
      <div style={{ flex: 1 }} />
      <button style={iconBtn(true)} title="Undo (arrives in a later step)" disabled><Undo2 size={17} /></button>
      <button style={iconBtn(true)} title="Redo (arrives in a later step)" disabled><Redo2 size={17} /></button>
      <span style={{ width: 1, height: 18, background: "#2f2f35", margin: "0 4px" }} />
      <div style={{ position: "relative" }}>
        <button
          onClick={(e) => { e.stopPropagation(); setDl((v) => !v); }}
          disabled={busy}
          style={{ display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", background: "#2d8cff", color: "#fff", border: "none", borderRadius: 6, cursor: busy ? "wait" : "pointer", fontSize: 12.5 }}>
          <Download size={15} /> {busy ? "Exporting…" : "Download"}
        </button>
        {dl && (
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", right: 0, top: 36, background: "#26262b", border: "1px solid #36363c", borderRadius: 8, padding: 4, minWidth: 168, boxShadow: "0 8px 28px rgba(0,0,0,0.5)" }}>
            <MenuItem onClick={() => doExport("current")}>This slide (PNG)</MenuItem>
            <MenuItem onClick={() => doExport("all")}>All slides (PNG)</MenuItem>
          </div>
        )}
      </div>
    </header>
  );
}

function MenuItem({ children, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", background: h ? "#33333a" : "transparent", color: "#e8e8e8", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 12.5 }}>
      {children}
    </button>
  );
}

// --- left tool rail ----------------------------------------------------------
function ToolRail({ tool, setTool }) {
  return (
    <nav style={{ width: 72, flexShrink: 0, borderRight: "1px solid #2a2a2f", display: "flex", flexDirection: "column", padding: "8px 0", gap: 2, background: "#161618" }}>
      {TOOLS.map(({ id, label, Icon }) => {
        const active = tool === id;
        return (
          <button key={id} onClick={() => setTool(active ? null : id)} title={label}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "10px 4px", margin: "0 6px", borderRadius: 8, cursor: "pointer",
              background: active ? "#26262b" : "transparent",
              color: active ? "#fff" : "#9a9aa0",
              border: "1px solid " + (active ? "#34343b" : "transparent"),
            }}>
            <Icon size={20} />
            <span style={{ fontSize: 10.5 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// --- slim side panel ---------------------------------------------------------
const PANEL_TITLES = { text: "Text", elements: "Elements", photos: "Photos", templates: "Templates", brand: "Brand" };

function SidePanel({ tool, onClose, dispatch }) {
  return (
    <aside style={{ width: 288, flexShrink: 0, borderRight: "1px solid #2a2a2f", display: "flex", flexDirection: "column", minHeight: 0, background: "#19191c" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px 6px", flexShrink: 0 }}>
        <strong style={{ fontSize: 13 }}>{PANEL_TITLES[tool]}</strong>
        <button onClick={onClose} title="Close panel" style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {tool === "text" && <TextPanel dispatch={dispatch} />}
        {tool === "elements" && <ElementsPanel dispatch={dispatch} />}
        {tool === "photos" && <PhotosPanel dispatch={dispatch} />}
        {tool === "templates" && <ComingSoonPanel title="Templates" note="Swap a slide or the whole deck to another premium layout while keeping your content. Wired up in a later build step." />}
        {tool === "brand" && <ComingSoonPanel title="Brand" note="Accent colour, fonts, logo and sources style, applied deck-wide. Wired up in a later build step." />}
      </div>
    </aside>
  );
}

// --- bottom slide strip ------------------------------------------------------
function SlideStrip({ slides, slideIndex, dispatch, menu, setMenu }) {
  const stripRef = useRef(null);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderTop: "1px solid #2a2a2f", overflowX: "auto", flexShrink: 0, background: "#161618" }} ref={stripRef}>
      {slides.map((s, i) => {
        const active = i === slideIndex;
        return (
          <div key={s.id} style={{ position: "relative", flexShrink: 0 }}
            onContextMenu={(e) => { e.preventDefault(); setMenu({ index: i, x: e.clientX, y: e.clientY }); }}>
            <button
              onClick={() => dispatch({ type: "setSlide", index: i })}
              title={"Slide " + (i + 1)}
              style={{ padding: 0, border: "2px solid " + (active ? "#2d8cff" : "transparent"), borderRadius: 5, cursor: "pointer", background: "transparent", lineHeight: 0 }}>
              <SlideThumb slide={s} />
            </button>
            <span style={{ position: "absolute", left: 3, top: 1, fontSize: 9, color: active ? "#fff" : "#aaa", textShadow: "0 1px 2px #000", pointerEvents: "none" }}>{i + 1}</span>
          </div>
        );
      })}
      <button onClick={() => dispatch({ type: "addSlide" })} title="Add slide"
        style={{ flexShrink: 0, width: 40, height: 72, display: "grid", placeItems: "center", background: "#1d1d21", color: "#bbb", border: "1px dashed #3a3a40", borderRadius: 6, cursor: "pointer" }}>
        <Plus size={18} />
      </button>
      <span style={{ marginLeft: 6, fontSize: 11, color: "#6f6f76", whiteSpace: "nowrap" }}>
        {slides.length} slide{slides.length === 1 ? "" : "s"} · tap to jump · right-click to duplicate / delete
      </span>

      {menu && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: "fixed", left: menu.x, top: menu.y - 76, background: "#26262b", border: "1px solid #36363c", borderRadius: 8, padding: 4, zIndex: 50, boxShadow: "0 8px 28px rgba(0,0,0,0.5)", minWidth: 150 }}>
          <button onClick={() => { dispatch({ type: "duplicateSlide", index: menu.index }); setMenu(null); }}
            style={ctxItem}><Copy size={13} /> Duplicate</button>
          <button onClick={() => { dispatch({ type: "deleteSlide", index: menu.index }); setMenu(null); }}
            disabled={slides.length <= 1}
            style={Object.assign({}, ctxItem, { color: slides.length <= 1 ? "#666" : "#ff7a7a", cursor: slides.length <= 1 ? "not-allowed" : "pointer" })}><Trash2 size={13} /> Delete</button>
        </div>
      )}
    </div>
  );
}

const ctxItem = {
  display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
  padding: "8px 10px", background: "transparent", color: "#e8e8e8", border: "none",
  borderRadius: 5, cursor: "pointer", fontSize: 12.5,
};
