"use client";
import React, { useState, useRef, useEffect } from "react";
import { UI } from "./theme";
import FontSelect from "./FontSelect";
import { FONT_OPTIONS } from "./styles";
import { SHAPE_VARIANTS, shapePaint } from "./shapes";
import { fitShapeBox } from "./textfit";
import { readImageFile } from "./imageFile";
import { removeBackground } from "./bgRemove";

// The top contextual toolbar (Canva-style, top-only). It replaces the right-hand
// Inspector: one horizontal bar above the canvas whose controls reflect the
// SELECTED element (text / image / rectangle / line). High-frequency controls sit
// inline; denser ones (Position, Effects, Shape) open as dropdown popovers
// anchored to the bar. Wired to the same reducer actions the Inspector used; a
// selected text SPAN still routes colour/weight through the floating FormatBar.
export default function Toolbar({ el, dispatch, textSel, spanStyle, onStyleSpan, onClearSpan, cropping }) {
  const [pop, setPop] = useState(null); // open popover: "position" | "effects" | "shape" | "crop" | "more" | null
  const [bgBusy, setBgBusy] = useState(false);
  const [barW, setBarW] = useState(9999); // measured width → responsive overflow
  const fileRef = useRef(null);
  const barRef = useRef(null);
  // Collapse low-priority pills into the ⋯ menu as the canvas narrows (Canva-style)
  // so the bar never wraps. High-frequency controls always stay inline.
  useEffect(() => {
    const node = barRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver((entries) => { for (const e of entries) setBarW(e.contentRect.width); });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  const up = (patch) => el && dispatch({ type: "update", id: el.id, patch });
  const sel = (el && el.type === "text" && textSel && textSel.id === el.id && textSel.end > textSel.start) ? textSel : null;
  const setStyle = (patch) => { if (sel && onStyleSpan) onStyleSpan(patch); else up(patch); };
  const toggle = (name) => setPop((p) => (p === name ? null : name));

  if (!el) {
    return <div ref={barRef} style={bar}><span style={hint}>Select an element to edit — or add one from the left rail.</span></div>;
  }

  // Responsive collapse — drop the rightmost optional groups into ⋯ as width shrinks.
  const showShape = barW >= 1080;    // text: Shape popover (first to go)
  const showEffects = barW >= 1000;  // text: Effects popover
  const showImgExtra = barW >= 620;  // image: Replace + Background

  const s = el.type === "text" ? (sel ? spanStyle || {} : el) : {};
  const bold = el.type === "text" ? ((sel ? (spanStyle && spanStyle.fontWeight) : el.fontWeight) >= 700) : false;
  const italic = el.type === "text" ? (sel ? !!(spanStyle && spanStyle.italic) : !!el.italic) : false;
  const strike = el.type === "text" ? (sel ? !!(spanStyle && spanStyle.strike) : !!el.strike) : false;
  const underline = el.type === "text" ? (sel ? !!(spanStyle && spanStyle.underline) : !!el.underline) : false;
  const textColor = el.type === "text" ? (sel ? (spanStyle && spanStyle.color) : el.color) || "#ffffff" : "#fff";
  const hl = el.type === "text" ? (sel ? (spanStyle && spanStyle.bg) : el.textBg) : null;
  // Highlight: a span keeps it on its run (`bg`); the whole text box keeps it on
  // `textBg` (what the renderers read) — the old setStyle wrote `bg` element-wide,
  // which nothing rendered, so the H button looked dead off a selection.
  const setHl = (v) => { if (sel && onStyleSpan) onStyleSpan({ bg: v }); else up({ textBg: v }); };

  return (
    <div ref={barRef} style={bar}>
      <span style={kind}>{KIND_GLYPH[el.type] || "▦"}</span>
      <Sep />

      {el.type === "text" && (
        <>
          <span style={{ width: 150 }}><FontSelect value={el.fontFamily} options={FONT_OPTIONS} onChange={(v) => up({ fontFamily: v })} title="Font (whole text)" /></span>
          <Stepper value={Math.round(el.fontSize || 0)} onDelta={(d) => up({ fontSize: Math.max(6, (el.fontSize || 0) + d) })} />
          <ColorBtn title="Text colour" value={textColor} onChange={(v) => setStyle({ color: v })} glyph={<span style={{ fontWeight: 800, borderBottom: "3px solid " + (textColor || "#fff"), lineHeight: 1 }}>A</span>} />
          <Sep />
          <Seg>
            <SegBtn on={bold} sel={!!sel} onMouseDown={sel ? hold : undefined} onClick={() => setStyle(sel ? { bold: !bold } : { fontWeight: bold ? 400 : 700 })}><b>B</b></SegBtn>
            <SegBtn on={italic} sel={!!sel} onMouseDown={sel ? hold : undefined} onClick={() => setStyle({ italic: !italic })}><i>I</i></SegBtn>
            <SegBtn on={underline} sel={!!sel} onMouseDown={sel ? hold : undefined} onClick={() => setStyle({ underline: !underline })}><u>U</u></SegBtn>
            <SegBtn on={strike} sel={!!sel} onMouseDown={sel ? hold : undefined} onClick={() => setStyle({ strike: !strike })}><s>S</s></SegBtn>
          </Seg>
          <Seg>
            <SegBtn on={el.align === "left" || !el.align} onClick={() => up({ align: "left" })}>≣</SegBtn>
            <SegBtn on={el.align === "center"} onClick={() => up({ align: "center" })}>≡</SegBtn>
            <SegBtn on={el.align === "right"} onClick={() => up({ align: "right" })}>≖</SegBtn>
          </Seg>
          <Sep />
          <ColorBtn title="Highlight" value={hl || "#ffd34e"} dim={!hl} onChange={(v) => setHl(v)}
            glyph={<span style={{ background: hl || "#ffd34e", color: "#101010", borderRadius: 3, padding: "0 3px", fontSize: 11, fontWeight: 700 }}>H</span>}
            extra={<button style={miniClear} onMouseDown={sel ? hold : undefined} onClick={() => setHl(null)} title="No highlight">⊘</button>} />
          {showEffects && <PopBtn label="Effects" open={pop === "effects"} onClick={() => toggle("effects")} />}
          {showShape && <PopBtn label="Shape" open={pop === "shape"} onClick={() => toggle("shape")} />}
        </>
      )}

      {el.type === "image" && (
        <>
          {/* Free-form crop: a MODE toggle (drag the photo to reposition, scroll to
              zoom — see Artboard). While active it swaps to Done + Reset. */}
          {cropping ? (
            <>
              <TextBtn title="Finish cropping" onClick={() => dispatch({ type: "crop", id: el.id })} style={cropDone}>✓ Done</TextBtn>
              <TextBtn title="Reset the crop" onClick={() => up({ crop: null })}>↺ Reset</TextBtn>
            </>
          ) : (
            <PopBtn label="⌗ Crop" open={false} onClick={() => dispatch({ type: "crop", id: el.id })} />
          )}
          <TextBtn title="Remove background (in-browser, no key)"
            onClick={async () => {
              if (bgBusy || !el.src) return;
              const id = el.id, srcWas = el.origSrc || el.src;
              setBgBusy(true);
              const out = await removeBackground(el.src);
              setBgBusy(false);
              if (out) dispatch({ type: "update", id, patch: { origSrc: srcWas, src: out, thumb: out } });
            }}>{bgBusy ? "… removing" : "✦ BG Remover"}</TextBtn>
          {el.origSrc && <TextBtn title="Restore the original image" onClick={() => up({ src: el.origSrc, thumb: el.origSrc, origSrc: null })}>↺ Restore</TextBtn>}
          <Sep />
          <SelectBtn value={el.fit || "cover"} onChange={(v) => up({ fit: v })} title="Fit" options={[["cover", "Fill"], ["contain", "Fit"]]} />
          <NumBtn label="Radius" value={el.radius || 0} onChange={(n) => up({ radius: Math.max(0, n) })} />
          <Seg>
            <SegBtn on={!!el.flipX} onClick={() => up({ flipX: !el.flipX })} title="Flip horizontal">⇋</SegBtn>
            <SegBtn on={!!el.flipY} onClick={() => up({ flipY: !el.flipY })} title="Flip vertical">⥯</SegBtn>
            <SegBtn on={!!el.mono} onClick={() => up({ mono: !el.mono })} title="Black & white">◑</SegBtn>
          </Seg>
          {showImgExtra && <Sep />}
          {showImgExtra && <TextBtn onClick={() => fileRef.current && fileRef.current.click()} title="Replace with another image">⧉ Replace</TextBtn>}
          {showImgExtra && <TextBtn onClick={() => dispatch({ type: "imageToBackground", id: el.id })} title="Set as slide background">⤓ Background</TextBtn>}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) readImageFile(f, (img) => { if (img) up({ src: img.src, thumb: img.thumb, crop: null }); }); e.target.value = ""; }} />
        </>
      )}

      {(el.type === "rect" || el.type === "line") && (
        <>
          <ColorBtn title={el.type === "line" ? "Colour" : "Fill"} value={el.fill && el.fill !== "none" ? el.fill : "#ffffff"} dim={!el.fill || el.fill === "none"} onChange={(v) => up({ fill: v })}
            glyph={<span style={{ width: 16, height: 16, borderRadius: 4, background: el.fill && el.fill !== "none" ? el.fill : "#444", border: "1px solid #555" }} />}
            extra={el.type === "rect" ? <button style={miniClear} onClick={() => up({ fill: "none" })} title="No fill">⊘</button> : undefined} />
          {el.type === "rect" && (
            <>
              <ColorBtn title="Stroke" value={el.stroke && el.stroke !== "none" ? el.stroke : "#ffffff"} dim={!el.stroke || el.stroke === "none"}
                onChange={(v) => up({ stroke: v, strokeWidth: el.strokeWidth || 2 })}
                glyph={<span style={{ width: 16, height: 16, borderRadius: 4, border: "2px solid " + (el.stroke && el.stroke !== "none" ? el.stroke : "#666"), boxSizing: "border-box" }} />}
                extra={<button style={miniClear} onClick={() => up({ stroke: "none", strokeWidth: 0 })} title="No stroke">⊘</button>} />
              <NumBtn label="Width" value={el.strokeWidth || 0} onChange={(n) => up({ strokeWidth: Math.max(0, n), stroke: n > 0 ? (el.stroke && el.stroke !== "none" ? el.stroke : "#ffffff") : "none" })} />
              <NumBtn label="Radius" value={el.radius || 0} onChange={(n) => up({ radius: Math.max(0, n) })} />
            </>
          )}
          {el.type === "line" && <NumBtn label="Weight" value={Math.round(el.h) || 0} onChange={(n) => up({ h: Math.max(1, Math.round(n)) })} />}
          <DashSelect value={el.dash || "solid"} onChange={(v) => up({ dash: v })} />
        </>
      )}

      <Spacer />
      <PopBtn label="Position" open={pop === "position"} onClick={() => toggle("position")} />
      <IconBtn title="More" onClick={() => toggle("more")}>⋯</IconBtn>

      {/* ---- popovers ---- */}
      {pop === "position" && <Popover onClose={() => setPop(null)} right>
        <Title>Position &amp; size</Title>
        <P2><NumField label="X" value={Math.round(el.x)} onChange={(n) => up({ x: Math.round(n) })} /><NumField label="Y" value={Math.round(el.y)} onChange={(n) => up({ y: Math.round(n) })} /></P2>
        <P2><NumField label="W" value={Math.round(el.w)} onChange={(n) => up({ w: Math.max(1, Math.round(n)) })} /><NumField label="H" value={Math.round(el.h)} onChange={(n) => up({ h: Math.max(1, Math.round(n)) })} /></P2>
        <P2><NumField label="Rotate" value={Math.round(el.rotation || 0)} onChange={(n) => up({ rotation: Math.round(n) })} /><div style={{ flex: 1 }} /></P2>
        {/* Opacity gets its OWN full-width row so the range can shrink to fit
            (minWidth:0) instead of overflowing the popover, with a % readout. */}
        <label style={{ ...pField, marginBottom: 7 }}>
          <span style={pLab}>Opacity</span>
          <input type="range" min={0} max={100} value={Math.round((el.opacity == null ? 1 : el.opacity) * 100)} onChange={(e) => up({ opacity: (+e.target.value || 0) / 100 })} style={{ flex: 1, minWidth: 0, accentColor: UI.brand }} />
          <span style={{ ...pLab, width: 30, textAlign: "right", color: UI.text }}>{Math.round((el.opacity == null ? 1 : el.opacity) * 100)}%</span>
        </label>
        <P2><WBtn onClick={() => dispatch({ type: "raise", id: el.id })}>↑ Forward</WBtn><WBtn onClick={() => dispatch({ type: "lower", id: el.id })}>↓ Back</WBtn></P2>
      </Popover>}

      {pop === "more" && <Popover onClose={() => setPop(null)} right>
        {/* Collapsed-from-the-bar controls appear here on a narrow canvas. */}
        {el.type === "text" && !showEffects && <><WBtn onClick={() => setPop("effects")}>Effects…</WBtn><div style={{ height: 6 }} /></>}
        {el.type === "text" && !showShape && <><WBtn onClick={() => setPop("shape")}>Shape…</WBtn><div style={{ height: 6 }} /></>}
        {el.type === "image" && !showImgExtra && <><WBtn onClick={() => { fileRef.current && fileRef.current.click(); setPop(null); }}>⧉ Replace image</WBtn><div style={{ height: 6 }} /><WBtn onClick={() => { dispatch({ type: "imageToBackground", id: el.id }); setPop(null); }}>⤓ Set as background</WBtn><div style={{ height: 6 }} /></>}
        <WBtn onClick={() => { dispatch({ type: "duplicate", id: el.id }); setPop(null); }}>⧉ Duplicate</WBtn>
        <div style={{ height: 6 }} />
        <WBtn danger onClick={() => { dispatch({ type: "delete", id: el.id }); setPop(null); }}>🗑 Delete</WBtn>
      </Popover>}

      {pop === "effects" && el.type === "text" && <Popover onClose={() => setPop(null)}>
        <Title>Colour &amp; effects</Title>
        {sel ? <div style={pHint}>Colour, background &amp; outline for the selected words live on the floating bar above your selection.</div> : (
          <>
            <P2><ColorField label="Text" value={el.color} onChange={(v) => up({ color: v })} /><EffectField label="Background" value={el.textBg} fallback="#ffd34e" onChange={(v) => up({ textBg: v })} /></P2>
            <P2><EffectField label="Outline" value={el.textStroke} fallback="#fff" onChange={(v) => up({ textStroke: v, textStrokeWidth: el.textStrokeWidth || 4 })} /><NumField label="O.Width" value={el.textStrokeWidth || 0} onChange={(n) => up({ textStrokeWidth: Math.max(0, n) })} /></P2>
          </>
        )}
        <P2><NumField label="Line" value={round2(el.lineHeight || 1.1)} step={0.05} onChange={(n) => up({ lineHeight: n })} /><NumField label="Track" value={round2(el.letterSpacing || 0)} step={0.5} onChange={(n) => up({ letterSpacing: n })} /></P2>
      </Popover>}

      {pop === "shape" && el.type === "text" && <ShapePop el={el} up={up} dispatch={dispatch} onClose={() => setPop(null)} />}

    </div>
  );
}

const hold = (e) => e.preventDefault(); // keep the editor's live selection when targeting a span

// ---- shape popover (ported from the Inspector ShapeSection) ----
function ShapePop({ el, up, dispatch, onClose }) {
  const setShape = (shape) => dispatch({ type: "setShape", id: el.id, shape: shape || null });
  const paint = el.shape ? shapePaint(el) : null;
  const borderVal = paint ? (paint.rule != null ? paint.rule : paint.border) : null;
  return (
    <Popover onClose={onClose}>
      <Title>Shape backing</Title>
      <select value={el.shape || ""} onChange={(e) => setShape(e.target.value)} style={popSelect}>
        <option value="">No shape</option>
        {SHAPE_VARIANTS.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
      </select>
      {el.shape && (
        <>
          <P2 style={{ marginTop: 8 }}>
            <div style={{ flex: 1, display: "flex", gap: 4 }}>
              <ColorField label="Fill" value={paint.bg === "transparent" ? UI.brand : paint.bg} onChange={(v) => up({ shapeBody: v })} />
              <button style={miniClear} onClick={() => up({ shapeBody: "transparent" })} title="No fill">⊘</button>
            </div>
            <EffectField label="Border" value={borderVal && borderVal !== "none" ? borderVal : null} fallback={UI.brand} onChange={(v) => up({ shapeBorderC: v })} />
          </P2>
          <P2><WBtn onClick={() => up(fitShapeBox(el, el.w))}>⤢ Fit to text</WBtn><WBtn danger onClick={() => { setShape(null); onClose(); }}>✕ Remove</WBtn></P2>
        </>
      )}
    </Popover>
  );
}

// ---- inline bar primitives ----
function Sep() { return <span style={sep} />; }
function Spacer() { return <span style={{ flex: 1 }} />; }
function Sect() { return null; }

function Seg({ children }) { return <span style={segWrap}>{children}</span>; }
function SegBtn({ on, sel, onClick, onMouseDown, title, children }) {
  const bg = sel ? UI.select : UI.brand;
  return <button title={title} onMouseDown={onMouseDown} onClick={onClick} style={{ ...segBtn, background: on ? bg : "transparent", color: on ? "#fff" : "#dadade" }}>{children}</button>;
}
function Stepper({ value, onDelta }) {
  return <span style={stepper}><button style={stepBtn} onClick={() => onDelta(-2)}>−</button><span style={stepVal}>{value}</span><button style={stepBtn} onClick={() => onDelta(2)}>+</button></span>;
}
function ColorBtn({ value, onChange, glyph, title, dim, extra }) {
  return (
    <span style={{ ...pill, position: "relative", opacity: dim ? 0.85 : 1, paddingRight: extra ? 4 : 11 }} title={title}>
      <label style={{ display: "flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
        {glyph}
        <input type="color" value={hexish(value)} onChange={(e) => onChange(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
      </label>
      {extra}
    </span>
  );
}
function NumBtn({ label, value, onChange }) {
  return <label style={pill} title={label}><span style={pillLab}>{label}</span><input type="number" value={value} onChange={(e) => onChange(e.target.value === "" ? 0 : +e.target.value)} style={pillNum} /></label>;
}
function SelectBtn({ value, onChange, options, title }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} title={title} style={pillSelect}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>;
}
function DashSelect({ value, onChange }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} title="Line style" style={pillSelect}>
    <option value="solid">—— Solid</option><option value="dashed">- - Dashed</option><option value="dotted">··· Dotted</option>
  </select>;
}
function TextBtn({ children, onClick, title, style }) { return <button style={style ? { ...pillBtn, ...style } : pillBtn} onClick={onClick} title={title}>{children}</button>; }
function IconBtn({ children, onClick, title }) { return <button style={{ ...pillBtn, padding: "0 10px" }} onClick={onClick} title={title}>{children}</button>; }
function PopBtn({ label, open, onClick }) { return <button style={{ ...pillBtn, background: open ? "#34343c" : pillBtn.background }} onClick={onClick}>{label} ▾</button>; }

// ---- popover primitives ----
function Popover({ children, onClose, right }) {
  return (
    <>
      <div onClick={onClose} style={backdrop} />
      <div style={{ ...popover, ...(right ? { right: 8 } : { left: 8 }) }} onMouseDown={(e) => { if (e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT") e.preventDefault(); }}>{children}</div>
    </>
  );
}
function Title({ children }) { return <div style={popTitle}>{children}</div>; }
function P2({ children, style }) { return <div style={{ display: "flex", gap: 7, marginBottom: 7, ...style }}>{children}</div>; }
function NumField({ label, value, onChange, step }) { return <label style={pField}><span style={pLab}>{label}</span><input type="number" step={step || 1} value={value} onChange={(e) => onChange(e.target.value === "" ? 0 : +e.target.value)} style={pNum} /></label>; }
function ColorField({ label, value, onChange }) {
  return <label style={{ ...pField, cursor: "pointer", position: "relative", overflow: "hidden" }}><span style={pLab}>{label}</span><span style={{ width: 16, height: 16, borderRadius: 4, marginLeft: "auto", background: value || "#fff", border: "1px solid #555" }} /><input type="color" value={hexish(value)} onChange={(e) => onChange(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0 }} /></label>;
}
function EffectField({ label, value, fallback, onChange }) {
  const on = !!value;
  return <label style={{ ...pField, cursor: "pointer", position: "relative", overflow: "hidden" }}><span style={pLab}>{label}</span><span style={{ width: 16, height: 16, borderRadius: 4, marginLeft: "auto", border: "1px solid #555", background: on ? value : "repeating-conic-gradient(#3a3a40 0% 25%, #1c1c20 0% 50%) 50% / 8px 8px" }} /><input type="color" value={hexish(value || fallback)} onChange={(e) => onChange(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0 }} /></label>;
}
function WBtn({ children, onClick, danger }) { return <button onClick={onClick} style={{ ...wBtn, color: danger ? "#ff8a8a" : UI.text }}>{children}</button>; }

const KIND_GLYPH = { text: "T", image: "▤", rect: "▢", line: "—" };
function round2(n) { return Math.round(n * 100) / 100; }
function hexish(c) { return (typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c)) ? c : "#ffffff"; }

// ---- styles ----
const bar = { display: "flex", alignItems: "center", gap: 5, height: 50, padding: "0 12px", background: "#141417", borderBottom: "1px solid " + UI.border, fontFamily: "Helvetica, Arial, sans-serif", overflow: "visible", position: "relative", flexShrink: 0 };
const hint = { color: UI.muted, fontSize: 12.5 };
const kind = { width: 28, height: 30, borderRadius: 7, background: UI.surface2, border: "1px solid " + UI.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, color: UI.text };
const sep = { width: 1, height: 22, background: "#2f2f37", margin: "0 3px", flexShrink: 0 };
const pill = { height: 32, display: "inline-flex", alignItems: "center", gap: 6, padding: "0 11px", borderRadius: 9, background: "#24242a", border: "1px solid #34343c", color: "#eaeaea", fontSize: 12.5, whiteSpace: "nowrap" };
const pillLab = { color: "#8a8a90", fontSize: 10.5 };
const pillNum = { width: 42, background: "transparent", border: "none", color: "#eaeaea", fontSize: 12.5, textAlign: "right", outline: "none" };
const pillSelect = { height: 32, background: "#24242a", color: "#eaeaea", border: "1px solid #34343c", borderRadius: 9, fontSize: 12.5, padding: "0 8px", cursor: "pointer" };
const pillBtn = { height: 32, padding: "0 11px", borderRadius: 9, background: "#24242a", border: "1px solid #34343c", color: "#eaeaea", fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" };
const cropDone = { background: "#1f7a3a", border: "1px solid #2a9a4a", color: "#eafff0", fontWeight: 700 };
const miniClear = { background: "transparent", border: "none", color: "#9a9a9a", cursor: "pointer", fontSize: 13, padding: "0 2px", marginLeft: 2 };
const segWrap = { display: "inline-flex", height: 32, background: "#24242a", border: "1px solid #34343c", borderRadius: 9, overflow: "hidden", flexShrink: 0 };
const segBtn = { width: 32, height: 30, border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" };
const stepper = { display: "inline-flex", alignItems: "center", height: 32, background: "#24242a", border: "1px solid #34343c", borderRadius: 9, overflow: "hidden" };
const stepBtn = { width: 28, height: 30, border: "none", background: "transparent", color: "#eaeaea", cursor: "pointer", fontSize: 15 };
const stepVal = { minWidth: 30, textAlign: "center", color: "#eaeaea", fontSize: 12.5, fontWeight: 600 };
const backdrop = { position: "fixed", inset: 0, zIndex: 70 };
const popover = { position: "absolute", top: 54, zIndex: 71, width: 230, background: "#161619", border: "1px solid #34343c", borderRadius: 12, boxShadow: "0 18px 40px rgba(0,0,0,0.6)", padding: 12 };
const popTitle = { fontSize: 10, fontWeight: 700, letterSpacing: 1.1, color: "#7c7c84", textTransform: "uppercase", marginBottom: 10 };
const popSelect = { width: "100%", height: 32, background: UI.surface2, color: UI.text, border: "1px solid " + UI.border, borderRadius: 7, fontSize: 12.5, padding: "0 8px" };
const pField = { flex: 1, height: 32, background: UI.surface2, border: "1px solid " + UI.border, borderRadius: 7, display: "flex", alignItems: "center", padding: "0 9px", gap: 6, minWidth: 0 };
const pLab = { color: UI.muted, fontSize: 10, flexShrink: 0 };
const pNum = { flex: 1, minWidth: 0, width: "100%", background: "transparent", border: "none", color: UI.text, fontSize: 12, textAlign: "right", outline: "none" };
const pHint = { fontSize: 11, color: UI.muted, lineHeight: 1.45 };
const wBtn = { width: "100%", height: 32, borderRadius: 7, background: UI.surface2, border: "1px solid " + UI.border, color: UI.text, cursor: "pointer", fontSize: 12.5 };
