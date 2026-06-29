"use client";
import React, { useEffect, useReducer, useRef, useState } from "react";
import { reducer, initStudio, carryBrandKit } from "./store";
import { makeElement, imageBackground, blankDoc, ARTBOARD_W, ARTBOARD_H } from "./model";
import { generateCarousel, regenerateCaption } from "./generate";
import { photosDemoDoc } from "./demo";
import Artboard from "./Artboard";
import Inspector from "./Inspector";
import FormatBar from "./FormatBar";
import SlideThumb from "./SlideThumb";
import ShapeBacking from "./ShapeBacking";
import { UI } from "./theme";
import { SHAPE_VARIANTS, shapeVariant, SHAPE_PAPER, SHAPE_PAPER_INK } from "./shapes";
import PhotosPanel from "./PhotosPanel";
import BrandPanel from "./BrandPanel";
import CaptionPanel from "./CaptionPanel";
import TemplatesPanel from "./TemplatesPanel";
import CreateScreen from "./CreateScreen";
import { exportSlide, exportSlides } from "./export";
import { verifyDeck } from "./verify";
import FactCheckPanel from "./FactCheckPanel";

const hbtn = {
  height: 32, padding: "0 12px", background: UI.surface2, color: UI.text,
  border: "1px solid " + UI.border, borderRadius: 7, cursor: "pointer", fontSize: 12,
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
  { key: "caption", label: "Caption", glyph: "✍" },
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
  const [fc, setFc] = useState(null); // fact check: null | { loading, error, result, phase }
  const [genPhase, setGenPhase] = useState(null); // generation progress: null | "searching" | "writing"
  const [textSel, setTextSel] = useState(null); // active text-span selection for per-run styling
  const editApiRef = useRef(null); // imperative style API from the element being edited
  const booted = useRef(false);
  const genAbort = useRef(null); // AbortController for the in-flight generation
  const fcAbort = useRef(null);  // AbortController for the in-flight fact-check
  const dragFrom = useRef(null); // slide index being drag-reordered in the strip
  const slide = state.doc.slides[state.slideIndex];
  const selectedEl = slide && (slide.elements || []).find((e) => e.id === state.selectedId);
  const selectedIsText = !!(selectedEl && selectedEl.type === "text");

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

  // The text-span selection is scoped to one element on one slide — drop it when
  // either changes (clicking away, selecting another element, switching slides).
  useEffect(() => { setTextSel(null); }, [state.selectedId, state.slideIndex]);

  // Per-span styling routes through the editing element's imperative API (which
  // keeps focus + the selection); the optimistic textSel.style update keeps the
  // bar/Inspector toggles in sync before the store round-trips.
  const styleSpan = (patch) => {
    if (editApiRef.current) editApiRef.current.applyStyle(patch);
    setTextSel((ts) => (ts ? { ...ts, style: applyPatchToStyle(ts.style, patch) } : ts));
  };
  const clearSpanStyle = () => {
    if (editApiRef.current) editApiRef.current.clearStyle();
    setTextSel((ts) => (ts ? { ...ts, style: null } : ts));
  };
  // The bar's A−/A+ nudges the WHOLE text element's size (size stays element-wide).
  const sizeSpan = (delta) => {
    if (!textSel) return;
    const elx = slide && (slide.elements || []).find((e) => e.id === textSel.id);
    if (elx) dispatch({ type: "update", id: textSel.id, patch: { fontSize: Math.max(6, (elx.fontSize || 0) + delta) } });
  };

  // Create screen → generate in the chosen style → land in the editor. Capture
  // the current deck before the await so the user's brand kit (custom palette /
  // fonts / wordmark + logo) carries onto the freshly generated deck (§5).
  // The call is cancellable (AbortController) and reports coarse progress
  // (searching → writing); a "quick draft" skips the web search for speed.
  const handleGenerate = async ({ style, category, topic, quickDraft, ground, slides, tone, route }) => {
    if (generating) return;
    const prevDoc = state.doc;
    const ac = new AbortController();
    genAbort.current = ac;
    setGenerating(true); setGenError(""); setGenPhase(quickDraft ? "writing" : "searching");
    try {
      const doc = await generateCarousel(topic, {
        style, category, webSearch: !quickDraft, ground, slides, tone, route, signal: ac.signal, onPhase: setGenPhase,
      });
      dispatch({ type: "loadDoc", doc: carryBrandKit(doc, prevDoc) });
      setProjectName(topic);
      setScreen("editor");
    } catch (e) {
      // A user-initiated cancel surfaces as an AbortError — stay on the create
      // screen quietly; only real failures show an error.
      if (!(e && (e.name === "AbortError" || /abort/i.test(e.message || "")))) {
        setGenError(e && e.message ? e.message : "Generation failed");
      }
    } finally {
      setGenerating(false);
      setGenPhase(null);
      genAbort.current = null;
    }
  };

  const cancelGenerate = () => { if (genAbort.current) genAbort.current.abort(); };

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

  // Tap a shape in the Elements panel: WRAP the selected text element in it, or —
  // when no text is selected — drop a fresh editable text box already wearing it.
  // Either way you get a real, fully-editable text element with a shape backing.
  const wrapOrAddShape = (variantId) => {
    const sel = slide && (slide.elements || []).find((e) => e.id === state.selectedId);
    if (sel && sel.type === "text") { dispatch({ type: "setShape", id: sel.id, shape: variantId }); return; }
    const v = shapeVariant(variantId);
    const accent = (state.doc.brand && state.doc.brand.accent) || "#e23744";
    dispatch({ type: "add", element: makeElement("text", {
      x: Math.round((ARTBOARD_W - v.w) / 2), y: Math.round((ARTBOARD_H - v.h) / 2),
      w: v.w, h: v.h, rotation: v.rotation || 0,
      content: v.text, align: "center", lineHeight: 1.12,
      color: v.paper ? SHAPE_PAPER_INK : (v.knockout ? "#0c0c0c" : "#ffffff"),
      fontFamily: v.font, fontSize: v.size, fontWeight: 700, letterSpacing: v.spacing || 0,
      shape: v.id, shapeFill: v.paper ? SHAPE_PAPER : accent, tailSide: "left",
    }) });
  };

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
    try { await exportSlides(state.doc.slides, projectName, state.doc.caption); } finally { setExporting(false); }
  };

  // Fact-check: send the deck's claims through a live web-search verify pass and
  // show the per-claim verdict + score in the side panel. Cancellable, and it
  // reports the same searching → writing progress generation does.
  const runFactCheck = async () => {
    const ac = new AbortController();
    fcAbort.current = ac;
    setFc({ loading: true, error: "", result: null, phase: "searching" });
    try {
      const result = await verifyDeck(state.doc, {
        category: state.doc.category,
        signal: ac.signal,
        onPhase: (p) => setFc((f) => (f && f.loading ? { ...f, phase: p } : f)),
      });
      setFc({ loading: false, error: "", result, phase: null });
    } catch (e) {
      if (e && (e.name === "AbortError" || /abort/i.test(e.message || ""))) {
        setFc(null); // user cancelled — close the panel
      } else {
        setFc({ loading: false, error: (e && e.message) || "Fact check failed", result: null, phase: null });
      }
    } finally {
      fcAbort.current = null;
    }
  };

  const cancelFactCheck = () => { if (fcAbort.current) fcAbort.current.abort(); };

  const toggle = (key) => setActivePanel((p) => (p === key ? null : key));

  if (screen === "create") {
    return <CreateScreen onGenerate={handleGenerate} onBlank={startBlank} generating={generating} phase={genPhase} onCancel={cancelGenerate} error={genError} />;
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: UI.bg, color: UI.text, fontFamily: "Helvetica, Arial, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: UI.surface, borderBottom: "1px solid " + UI.border, flexShrink: 0 }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 5, marginRight: 2 }}>
          <span style={{ fontFamily: "'Courier Prime', 'Courier New', monospace", fontWeight: 700, fontSize: 17, letterSpacing: 0.5, color: "#fff" }}>
            L<span style={{ color: UI.brand }}>O</span>ATHR
          </span>
          <span style={{ fontSize: 9, letterSpacing: 2, color: UI.muted, textTransform: "uppercase" }}>studio</span>
        </span>
        <span style={{ width: 1, height: 22, background: UI.border, margin: "0 3px" }} />
        <button style={hbtn} onClick={() => setScreen("create")} title="Back to start">‹ New</button>
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          title="Project name"
          style={{ width: 230, height: 32, padding: "0 10px", background: "transparent", color: "#fff", border: "1px solid transparent", borderRadius: 6, fontSize: 14, fontWeight: 600 }}
          onFocus={(e) => { e.target.style.border = "1px solid " + UI.border; e.target.style.background = UI.surface2; }}
          onBlur={(e) => { e.target.style.border = "1px solid transparent"; e.target.style.background = "transparent"; }}
        />
        <button style={iconBtn(state.past.length > 0)} disabled={state.past.length === 0} onClick={() => dispatch({ type: "undo" })} title="Undo (Ctrl/Cmd+Z)">↶</button>
        <button style={iconBtn(state.future.length > 0)} disabled={state.future.length === 0} onClick={() => dispatch({ type: "redo" })} title="Redo (Ctrl/Cmd+Shift+Z)">↷</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: UI.muted, marginRight: 4 }}>
          {state.doc.slides.length} slide{state.doc.slides.length === 1 ? "" : "s"}
        </span>
        <button
          style={{ ...hbtn, opacity: fc && fc.loading ? 0.6 : 1 }}
          disabled={!!(fc && fc.loading)}
          onClick={runFactCheck}
          title="Fact-check the deck against a live web search"
        >
          {fc && fc.loading ? "Checking…" : "✓ Check facts"}
        </button>
        <div style={{ position: "relative" }}>
          <button
            style={{ ...hbtn, background: UI.brand, color: UI.onBrand, border: "none", fontWeight: 700, boxShadow: "0 2px 10px " + UI.brand + "30" }}
            disabled={exporting}
            onClick={() => setDlOpen((o) => !o)}
            title="Download as PNG"
          >
            {exporting ? "Exporting…" : "⬇ Download ▾"}
          </button>
          {dlOpen && (
            <>
              <div onClick={() => setDlOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
              <div style={{ position: "absolute", right: 0, top: 38, minWidth: 176, background: UI.surface2, border: "1px solid " + UI.border, borderRadius: 8, padding: 4, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.45)" }}>
                <button style={menuItem} onClick={exportCurrent}>This slide (PNG)</button>
                <button style={menuItem} onClick={exportDeck}>All {state.doc.slides.length} slides (.zip)</button>
              </div>
            </>
          )}
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Left tool rail */}
        <nav style={{ width: 72, flexShrink: 0, display: "flex", flexDirection: "column", gap: 3, padding: "8px 7px", background: UI.rail, borderRight: "1px solid " + UI.border }}>
          {TOOLS.map((t) => {
            const active = activePanel === t.key;
            return (
              <button key={t.key} onClick={() => toggle(t.key)} title={t.label}
                style={{
                  position: "relative",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                  height: 58, borderRadius: 9, cursor: "pointer", fontSize: 10,
                  background: active ? UI.surface2 : "transparent",
                  color: active ? "#fff" : UI.muted,
                  border: "1px solid " + (active ? UI.border : "transparent"),
                }}>
                {active && <span style={{ position: "absolute", left: -7, top: 14, bottom: 14, width: 3, borderRadius: "0 3px 3px 0", background: UI.brand }} />}
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
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: UI.muted, textTransform: "uppercase", margin: "16px 0 8px", borderTop: "1px solid " + UI.soft, paddingTop: 13 }}>Bubbles &amp; shapes</div>
            <div style={{ fontSize: 11, color: selectedIsText ? UI.brand : UI.muted, lineHeight: 1.45, marginBottom: 10 }}>
              {selectedIsText ? "↩ Wraps the selected text." : "Tap to drop editable text, or select text first to wrap it."}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {SHAPE_VARIANTS.map((v) => (
                <ShapeTile key={v.id} v={v} accent={(state.doc.brand && state.doc.brand.accent) || UI.brand} wrap={selectedIsText} onPick={wrapOrAddShape} />
              ))}
            </div>
          </SidePanel>
        )}
        {activePanel === "templates" && (
          <TemplatesPanel
            slide={slide}
            brand={state.doc.brand}
            onApply={(layout) => dispatch({ type: "setLayout", layout })}
            onApplyAll={(layout) => dispatch({ type: "setLayout", layout, all: true })}
            onReset={() => dispatch({ type: "resetSlideToBrand" })}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "brand" && (
          <BrandPanel
            brand={state.doc.brand}
            category={state.doc.category}
            slideFrame={(slide && slide.frame) || "off"}
            onApply={(prev, next) => dispatch({ type: "applyBrand", prev, brand: next })}
            onLogo={(logo) => dispatch({ type: "setLogo", logo })}
            onCaution={(text) => dispatch({ type: "setCaution", text })}
            onFrame={(frame, all) => dispatch({ type: "setFrame", frame, all })}
            onChrome={(key, on) => dispatch({ type: "setChrome", key, on })}
            onResetAll={() => dispatch({ type: "resetSlideToBrand", all: true })}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "caption" && (
          <CaptionPanel
            caption={state.doc.caption || ""}
            onChange={(text) => dispatch({ type: "setCaption", text })}
            onRegenerate={async () => { const t = await regenerateCaption(state.doc); if (t) dispatch({ type: "setCaption", text: t }); }}
            onClose={() => setActivePanel(null)}
          />
        )}

        <Artboard
          slide={slide}
          selectedId={state.selectedId}
          editingId={state.editingId}
          dispatch={dispatch}
          onTextSelect={setTextSel}
          onEditApi={(api) => { editApiRef.current = api; }}
        />

        {fc && (
          <FactCheckPanel
            loading={fc.loading}
            error={fc.error}
            result={fc.result}
            phase={fc.phase}
            onJump={(i) => dispatch({ type: "setSlide", index: i })}
            onClose={() => setFc(null)}
            onCancel={cancelFactCheck}
            onRetry={runFactCheck}
          />
        )}

        {/* Right Inspector (R3 · A) — properties of the selected element. In
            SELECTION mode (a text span is selected) its Style + Colour & effects
            controls target that span. */}
        <Inspector
          el={selectedEl}
          dispatch={dispatch}
          textSel={textSel}
          spanStyle={textSel ? textSel.style : null}
          onStyleSpan={styleSpan}
          onClearSpan={clearSpanStyle}
        />
      </div>

      {/* Floating format bar above a live text selection (per-span styling). */}
      {textSel && textSel.rect && textSel.end > textSel.start && (
        <FormatBar
          style={textSel.style}
          accent={(state.doc.brand && state.doc.brand.accent) || UI.brand}
          rect={textSel.rect}
          onStyle={styleSpan}
          onClear={clearSpanStyle}
          onSize={sizeSpan}
        />
      )}

      {/* Slide strip — lightweight thumbnails (FLAT-LAYERS §3) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: UI.surface, borderTop: "1px solid " + UI.border, overflowX: "auto", flexShrink: 0 }}>
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
          style={{ width: 60, height: 75, flexShrink: 0, borderRadius: 6, border: "1.5px dashed " + UI.border, background: "transparent", color: UI.muted, cursor: "pointer", fontSize: 22 }}>
          +
        </button>
        <span style={{ marginLeft: 6, fontSize: 11, color: UI.muted, whiteSpace: "nowrap" }}>
          drag thumbnails to reorder · hover for ⧉ duplicate / × delete · ⌘/Ctrl+Z undo
        </span>
      </div>
    </div>
  );
}

// Fold a style patch into the selection's resolved style, so the bar/Inspector
// reflect a toggle/colour immediately (bold → fontWeight; null clears a key).
function applyPatchToStyle(style, patch) {
  const s = Object.assign({}, style || {});
  for (const k of Object.keys(patch || {})) {
    const v = patch[k];
    if (k === "bold") s.fontWeight = v ? 700 : 400;
    else if (v == null) delete s[k];
    else s[k] = v;
  }
  return s;
}

const panelNote = { color: UI.muted, fontSize: 12, lineHeight: 1.5, margin: 0 };
const menuItem = {
  display: "block", width: "100%", textAlign: "left", height: 32, padding: "0 10px",
  background: "transparent", color: UI.text, border: "none", borderRadius: 6,
  cursor: "pointer", fontSize: 13,
};

function SidePanel({ title, onClose, children }) {
  return (
    <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, padding: 12, background: UI.surface, borderRight: "1px solid " + UI.border, fontFamily: "Helvetica, Arial, sans-serif", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 12, letterSpacing: 0.5 }}>{title}</strong>
        <button onClick={onClose} title="Close panel"
          style={{ width: 24, height: 24, background: "transparent", color: UI.muted, border: "none", cursor: "pointer", fontSize: 18, borderRadius: 5 }}>×</button>
      </div>
      {children}
    </div>
  );
}

function PanelButton({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ height: 36, padding: "0 12px", textAlign: "left", background: UI.surface2, color: UI.text, border: "1px solid " + UI.border, borderRadius: 7, cursor: "pointer", fontSize: 13 }}>
      {children}
    </button>
  );
}

// A grid swatch for a shape — a uniform tile with a small, consistently-scaled
// preview of the real ShapeBacking (so it shows exactly what drops) above a
// label. The shape is scaled to a fixed inner box with margin so tails / ears
// aren't clipped, keeping the grid tidy regardless of the shape's aspect.
function ShapeTile({ v, accent, wrap, onPick }) {
  const PW = 70, PH = 30; // preview box the shape is fit into (leaves margin)
  const s = Math.min(PW / v.w, PH / v.h);
  const el = {
    type: "text", shape: v.id, content: shapeSample(v), w: v.w, h: v.h, rotation: v.rotation || 0,
    shapeFill: v.paper ? SHAPE_PAPER : accent,
    color: v.paper ? SHAPE_PAPER_INK : (v.knockout ? "#0c0c0c" : "#ffffff"),
    fontFamily: v.font, fontSize: v.size, fontWeight: 700, letterSpacing: v.spacing || 0, align: "center",
    tailSide: "left", opacity: 1,
  };
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={() => onPick(v.id)} title={(wrap ? "Wrap selection in " : "Add ") + v.label}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, height: 66,
        background: hover ? UI.hover : UI.surface2, border: "1px solid " + (hover ? UI.brand : UI.border),
        borderRadius: 8, cursor: "pointer", overflow: "hidden", transition: "border-color .12s, background .12s" }}>
      <div style={{ position: "relative", width: v.w * s, height: v.h * s }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: v.w, height: v.h, transform: "scale(" + s + ")", transformOrigin: "top left" }}>
          <ShapeBacking el={el} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <span style={{ fontFamily: v.font, fontSize: v.size, fontWeight: 700, letterSpacing: (v.spacing || 0) + "px", color: el.color, lineHeight: 1.05, padding: "0 10%", whiteSpace: "nowrap" }}>{shapeSample(v)}</span>
          </div>
        </div>
      </div>
      <span style={{ fontSize: 10, color: UI.muted, letterSpacing: 0.2 }}>{v.label}</span>
    </button>
  );
}

// Short, uniform preview text per shape so the swatches stay tidy (the dropped
// element still uses the variant's full sample text).
function shapeSample(v) {
  return ({ speech: "Aa", cloud: "Aa", stamp: "OK", banner: "Aa", burst: "NEW", tag: "#1", pill: "SAVE", note: "Aa" })[v.id] || "Aa";
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
      style={{ position: "relative", flexShrink: 0, borderRadius: 6, outline: over ? "2px solid " + UI.brand : "none", outlineOffset: 1 }}
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
