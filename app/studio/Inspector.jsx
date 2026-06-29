"use client";
import React from "react";
import { UI } from "./theme";
import FontSelect from "./FontSelect";
import { FONT_OPTIONS } from "./styles";
import { SHAPE_VARIANTS } from "./shapes";
import { fitShapeBox } from "./textfit";

// The right-hand Inspector (R3 · structural A) — the persistent home for the
// SELECTED element's properties, replacing the old floating toolbar. Per-element
// "individual expansion": Type (full type controls), Shape (the text-shape
// backing), and a common Arrange block (position / size / rotation / opacity /
// layer / delete). Wired to the same reducer actions the toolbar used.
//
// Deck-wide type/colour still lives in the Brand panel (left rail); this edits
// one element only. Editing the words themselves stays double-click-on-canvas.

export default function Inspector({ el, dispatch, textSel, spanStyle, onStyleSpan, onClearSpan }) {
  const up = (patch) => el && dispatch({ type: "update", id: el.id, patch });

  // Selection-aware styling: when a span of THIS text element is selected on the
  // canvas, the Style + Colour & effects controls target that span; otherwise the
  // whole element. `sel` carries the selected text for the hint/badge.
  const sel = (el && el.type === "text" && textSel && textSel.id === el.id && textSel.end > textSel.start)
    ? Object.assign({}, textSel) : null;
  const setStyle = (patch) => { if (sel && onStyleSpan) onStyleSpan(patch); else up(patch); };
  const clearSel = () => { if (onClearSpan) onClearSpan(); };

  return (
    <aside style={wrap}>
      {!el ? (
        <div style={empty}>
          <div style={{ fontSize: 30, opacity: 0.4, marginBottom: 12 }}>⌖</div>
          <b style={{ color: UI.text, fontSize: 13 }}>Nothing selected</b>
          <p style={{ margin: "8px 0 0", lineHeight: 1.5 }}>
            Click an element to edit it here. Double-click text to type; select a word to style just that span.
          </p>
        </div>
      ) : (
        <>
          <div style={head}>
            <span style={kindIcon}>{KIND_GLYPH[el.type] || "▦"}</span>
            <div>
              <b style={{ fontSize: 13, display: "block", lineHeight: 1.1 }}>{KIND_LABEL[el.type] || "Element"}</b>
              <small style={{ color: UI.muted, fontSize: 10.5 }}>{subLabel(el)}</small>
            </div>
          </div>

          {el.type === "text" && <TypeSection el={el} up={up} sel={sel} span={spanStyle} setStyle={setStyle} clearSel={clearSel} />}
          {el.type === "text" && <ShapeSection el={el} dispatch={dispatch} up={up} />}
          {el.type === "image" && <ImageSection el={el} dispatch={dispatch} up={up} />}
          {(el.type === "rect" || el.type === "line") && <FillSection el={el} up={up} />}

          <ArrangeSection el={el} dispatch={dispatch} up={up} />
        </>
      )}
    </aside>
  );
}

// ---- sections -------------------------------------------------------------

// The text Type controls. Character (font / size / line / tracking) and align
// are always element-wide. The Style toggles (B/I/S) and the Colour & effects
// (text colour, background marker, outline) target a SELECTED span when one is
// active (sel) — otherwise the whole element. `span` is the selected span's
// resolved style (so the toggles reflect the selection); `setStyle(patch)` routes
// to the span (styleText) or the element (update) accordingly.
const hold = (e) => e.preventDefault(); // keep the contentEditable's selection on click

function TypeSection({ el, up, sel, span, setStyle, clearSel }) {
  const bold = (sel ? (span && span.fontWeight) : el.fontWeight) >= 700;
  const italic = sel ? !!(span && span.italic) : !!el.italic;
  const strike = sel ? !!(span && span.strike) : !!el.strike;
  const textCol = sel ? (span && span.color) : el.color;
  const bgCol = sel ? (span && span.bg) : el.textBg;
  const strokeCol = sel ? (span && span.stroke) : el.textStroke;
  const strokeW = sel ? (span && span.strokeWidth) || 0 : el.textStrokeWidth || 0;
  // element-wide effect controls clear; span clears go through clearSel.
  const hasEffects = el.strike || el.textBg || (el.textStroke && el.textStrokeWidth);
  const clearEffects = () => up({ strike: false, strikeColor: null, textBg: null, textStroke: null, textStrokeWidth: 0 });
  return (
    <>
      <Sec>
        <span>Type</span>
        {sel ? <span style={scopeBadge}>SELECTION</span> : null}
      </Sec>
      <div style={pad}>
        <Grp>Character</Grp>
        <Row><FontSelect value={el.fontFamily} options={FONT_OPTIONS} onChange={(v) => up({ fontFamily: v })} title="Font (whole text)" /></Row>
        <Row>
          <Num label="Size" value={Math.round(el.fontSize || 0)} min={6} max={400} onChange={(n) => up({ fontSize: Math.max(6, n) })} />
          <Num label="Line" value={round2(el.lineHeight || 1.1)} step={0.05} min={0.7} max={3} onChange={(n) => up({ lineHeight: n })} />
          <Num label="Track" value={round2(el.letterSpacing || 0)} step={0.5} min={-10} max={40} onChange={(n) => up({ letterSpacing: n })} />
        </Row>
        <Grp>Style{sel ? " · selection" : ""}</Grp>
        <Row>
          <Seg>
            {/* In SELECTION mode the toggles keep the editor's focus (mousedown→
                preventDefault) so the run lands on the live selection. */}
            <SegBtn sel={sel} on={bold} onMouseDown={sel ? hold : undefined} onClick={() => setStyle(sel ? { bold: !bold } : { fontWeight: bold ? 400 : 700 })}><b>B</b></SegBtn>
            <SegBtn sel={sel} on={italic} onMouseDown={sel ? hold : undefined} onClick={() => setStyle({ italic: !italic })}><i>I</i></SegBtn>
            <SegBtn sel={sel} on={strike} onMouseDown={sel ? hold : undefined} onClick={() => setStyle({ strike: !strike })}><s>S</s></SegBtn>
            <SegBtn on={el.align === "left" || !el.align} onClick={() => up({ align: "left" })}>≣</SegBtn>
            <SegBtn on={el.align === "center"} onClick={() => up({ align: "center" })}>≡</SegBtn>
            <SegBtn on={el.align === "right"} onClick={() => up({ align: "right" })}>≖</SegBtn>
          </Seg>
        </Row>
        <Grp>Colour &amp; effects{sel ? " · selection" : ""}</Grp>
        {sel ? (
          // Span colours come from the floating bar's swatches (a native colour
          // picker would steal focus and drop the selection); the toggles above
          // cover bold/italic/strike for the span.
          <div style={selHint}>Colour, background &amp; outline for “{sel.text}”: use the swatches on the bar above your selection. Font, size, line &amp; align stay element-wide.</div>
        ) : (
          <>
            <Row>
              <Chip label="Text" value={textCol} onChange={(v) => up({ color: v })} />
              <EffectChip label="Background" value={bgCol} fallback="#ffd34e" onChange={(v) => up({ textBg: v })} />
            </Row>
            <Row>
              <EffectChip label="Outline" value={strokeCol} fallback="#ffffff"
                onChange={(v) => up({ textStroke: v, textStrokeWidth: strokeW || 4 })} />
              <Num label="Width" value={strokeW} min={0} max={40} onChange={(n) => up({ textStrokeWidth: Math.max(0, n) })} />
            </Row>
          </>
        )}
        {sel ? (
          <Row><Btn onMouseDown={hold} onClick={clearSel}>✕ Clear styling on selection</Btn></Row>
        ) : hasEffects ? (
          <Row><Btn onClick={clearEffects}>✕ Clear text effects</Btn></Row>
        ) : null}
      </div>
    </>
  );
}

function ShapeSection({ el, dispatch, up }) {
  const setShape = (shape) => dispatch({ type: "setShape", id: el.id, shape: shape || null });
  return (
    <>
      <Sec>Shape</Sec>
      <div style={pad}>
        <Row>
          <select value={el.shape || ""} onChange={(e) => setShape(e.target.value)} style={select} title="Shape backing">
            <option value="">No shape</option>
            {SHAPE_VARIANTS.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </Row>
        {el.shape && (
          <>
            <Row>
              <Chip label="Fill" value={el.shapeFill || UI.brand} onChange={(v) => up({ shapeFill: v })} />
              {el.shape === "speech" ? (
                <Box onClick={() => up({ tailSide: el.tailSide === "left" ? "center" : el.tailSide === "center" ? "right" : "left" })} title="Tail side">
                  <span style={{ color: UI.muted, fontSize: 10, marginRight: 6 }}>Tail</span>
                  {el.tailSide === "right" ? "▸ right" : el.tailSide === "center" ? "▾ center" : "◂ left"}
                </Box>
              ) : <div style={{ flex: 1 }} />}
            </Row>
            <Row>
              <Btn onClick={() => up(fitShapeBox(el, el.w))}>⤢ Fit to text</Btn>
              <Btn danger onClick={() => setShape(null)}>✕ Remove</Btn>
            </Row>
          </>
        )}
      </div>
    </>
  );
}

function ImageSection({ el, dispatch, up }) {
  return (
    <>
      <Sec>Image</Sec>
      <div style={pad}>
        <Row>
          <select value={el.fit || "cover"} onChange={(e) => up({ fit: e.target.value })} style={select} title="Fit">
            <option value="cover">Fill</option>
            <option value="contain">Fit</option>
          </select>
          <Num label="Radius" value={el.radius || 0} min={0} max={400} onChange={(n) => up({ radius: Math.max(0, n) })} />
        </Row>
        <Row><Btn onClick={() => dispatch({ type: "imageToBackground", id: el.id })}>⤓ Make slide background</Btn></Row>
      </div>
    </>
  );
}

function FillSection({ el, up }) {
  return (
    <>
      <Sec>Fill</Sec>
      <div style={pad}>
        <Row>
          <Chip label="Fill" value={el.fill} onChange={(v) => up({ fill: v })} />
          {el.type === "rect" && <Num label="Radius" value={el.radius || 0} min={0} max={400} onChange={(n) => up({ radius: Math.max(0, n) })} />}
        </Row>
        {el.type === "rect" && (
          <Row>
            <Chip label="Stroke" value={el.stroke && el.stroke !== "none" ? el.stroke : "#ffffff"} onChange={(v) => up({ stroke: v, strokeWidth: el.strokeWidth || 2 })} />
            <Num label="Width" value={el.strokeWidth || 0} min={0} max={60} onChange={(n) => up({ strokeWidth: Math.max(0, n), stroke: n > 0 ? (el.stroke && el.stroke !== "none" ? el.stroke : "#ffffff") : "none" })} />
          </Row>
        )}
      </div>
    </>
  );
}

function ArrangeSection({ el, dispatch, up }) {
  return (
    <>
      <Sec>Arrange</Sec>
      <div style={pad}>
        <Row>
          <Num label="X" value={Math.round(el.x)} onChange={(n) => up({ x: Math.round(n) })} />
          <Num label="Y" value={Math.round(el.y)} onChange={(n) => up({ y: Math.round(n) })} />
        </Row>
        <Row>
          <Num label="W" value={Math.round(el.w)} min={1} onChange={(n) => up({ w: Math.max(1, Math.round(n)) })} />
          <Num label="H" value={Math.round(el.h)} min={1} onChange={(n) => up({ h: Math.max(1, Math.round(n)) })} />
        </Row>
        <Row>
          <Num label="Rotate" value={Math.round(el.rotation || 0)} min={-180} max={180} onChange={(n) => up({ rotation: Math.round(n) })} />
          <Box style={{ gap: 8 }} title="Opacity">
            <span style={{ color: UI.muted, fontSize: 10 }}>Opacity</span>
            <input type="range" min={0} max={100} value={Math.round((el.opacity == null ? 1 : el.opacity) * 100)}
              onChange={(e) => up({ opacity: (+e.target.value || 0) / 100 })}
              style={{ flex: 1, accentColor: UI.brand }} />
          </Box>
        </Row>
        <Row>
          <Btn onClick={() => dispatch({ type: "raise", id: el.id })}>↑ Forward</Btn>
          <Btn onClick={() => dispatch({ type: "lower", id: el.id })}>↓ Back</Btn>
          <Btn danger onClick={() => dispatch({ type: "delete", id: el.id })} style={{ flex: "none", width: 40 }} title="Delete">🗑</Btn>
        </Row>
      </div>
    </>
  );
}

// ---- primitives -----------------------------------------------------------

function Row({ children }) { return <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>{children}</div>; }
function Sec({ children }) { return <div style={sec}>{children}</div>; }

function Num({ label, value, onChange, min, max, step }) {
  return (
    <label style={field}>
      <span style={fieldLab}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step || 1}
        onChange={(e) => onChange(e.target.value === "" ? 0 : +e.target.value)}
        style={numInput} />
    </label>
  );
}

function Chip({ label, value, onChange }) {
  return (
    <label style={{ ...field, cursor: "pointer", position: "relative", overflow: "hidden" }} title={label + " colour"}>
      <span style={fieldLab}>{label}</span>
      <span style={{ width: 16, height: 16, borderRadius: 4, background: value, border: "1px solid #555", marginLeft: "auto" }} />
      <input type="color" value={hexish(value)} onChange={(e) => onChange(e.target.value)}
        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
    </label>
  );
}

function Seg({ children }) { return <div style={{ display: "flex", gap: 4, flex: 1 }}>{children}</div>; }
function SegBtn({ on, sel, onClick, onMouseDown, children }) {
  // Active toggles read brand (white) element-wide, blue when targeting a span.
  const activeBg = sel ? UI.select : UI.brand;
  const activeFg = sel ? "#ffffff" : UI.onBrand;
  return <button onClick={onClick} onMouseDown={onMouseDown} style={{ flex: 1, height: 30, borderRadius: 6, fontSize: 13,
    background: on ? activeBg : UI.surface2, border: "1px solid " + (on ? activeBg : UI.border),
    color: on ? activeFg : UI.text, cursor: "pointer" }}>{children}</button>;
}
function Grp({ children }) { return <div style={grp}>{children}</div>; }
// A colour field that reads "off" (a checker swatch) until a colour is picked —
// for the optional Background / Outline effects, which are absent by default.
function EffectChip({ label, value, fallback, onChange }) {
  const on = !!value;
  return (
    <label style={{ ...field, cursor: "pointer", position: "relative", overflow: "hidden" }} title={label + (on ? "" : " — off; pick a colour")}>
      <span style={fieldLab}>{label}</span>
      <span style={{ width: 16, height: 16, borderRadius: 4, marginLeft: "auto", border: "1px solid #555",
        background: on ? value : "repeating-conic-gradient(#3a3a40 0% 25%, #1c1c20 0% 50%) 50% / 8px 8px" }} />
      <input type="color" value={hexish(value || fallback)} onChange={(e) => onChange(e.target.value)}
        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
    </label>
  );
}

function Btn({ onClick, onMouseDown, children, danger, style, title }) {
  return <button onClick={onClick} onMouseDown={onMouseDown} title={title} style={{ flex: 1, height: 30, borderRadius: 6, fontSize: 11.5,
    background: UI.surface2, border: "1px solid " + UI.border, color: danger ? "#ff8a8a" : UI.text,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, ...style }}>{children}</button>;
}

function Box({ children, onClick, style, title }) {
  return <div onClick={onClick} title={title} style={{ ...field, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>;
}

// ---- styles + helpers -----------------------------------------------------

const wrap = { width: 266, flexShrink: 0, background: UI.surface, borderLeft: "1px solid " + UI.border, overflowY: "auto", fontFamily: "Helvetica, Arial, sans-serif", color: UI.text };
const empty = { padding: "40px 22px", textAlign: "center", color: UI.muted, fontSize: 12 };
const head = { display: "flex", alignItems: "center", gap: 9, padding: "13px 13px 4px" };
const kindIcon = { width: 28, height: 28, borderRadius: 7, background: UI.surface2, border: "1px solid " + UI.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 };
const sec = { fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: "#74747c", textTransform: "uppercase", borderTop: "1px solid " + UI.soft, padding: "12px 13px 9px", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" };
const pad = { padding: "0 13px" };
const field = { flex: 1, height: 30, background: UI.surface2, border: "1px solid " + UI.border, borderRadius: 6, display: "flex", alignItems: "center", padding: "0 9px", fontSize: 12, color: UI.text, gap: 6, minWidth: 0 };
const fieldLab = { color: UI.muted, fontSize: 10, flexShrink: 0 };
const numInput = { flex: 1, minWidth: 0, width: "100%", background: "transparent", border: "none", color: UI.text, fontSize: 12, textAlign: "right", outline: "none" };
const select = { flex: 1, height: 30, background: UI.surface2, color: UI.text, border: "1px solid " + UI.border, borderRadius: 6, fontSize: 12, padding: "0 8px" };
const grp = { fontSize: 9.5, letterSpacing: 0.6, color: "#5f5f68", textTransform: "uppercase", margin: "2px 1px 7px", fontWeight: 700 };
const scopeBadge = { fontSize: 9, letterSpacing: 0.5, color: UI.select, background: "rgba(45,140,255,0.13)", border: "1px solid rgba(45,140,255,0.35)", borderRadius: 5, padding: "2px 6px", textTransform: "none", fontWeight: 700 };
const selHint = { fontSize: 10.5, color: UI.muted, lineHeight: 1.45, padding: "6px 1px 0" };

const KIND_LABEL = { text: "Text", image: "Image", rect: "Rectangle", line: "Line" };
const KIND_GLYPH = { text: "T", image: "▤", rect: "▢", line: "—" };

function subLabel(el) {
  if (el.type === "text") return el.shape ? "wearing a " + el.shape + " shape" : "text element";
  if (el.type === "image") return el.role === "logo" ? "brand logo" : "image element";
  return el.type + " element";
}
function round2(n) { return Math.round(n * 100) / 100; }
function hexish(c) { return (typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c)) ? c : "#ffffff"; }
