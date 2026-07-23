"use client";
import React, { useState, useRef, useEffect } from "react";
import { UI } from "./theme";
import FontSelect from "./FontSelect";
import ColorPopover from "./ColorPopover";
import { normHlStyle } from "./hlstyles";
import { FONT_OPTIONS } from "./styles";
import { SHAPE_VARIANTS, shapePaint, shapeBorderW } from "./shapes";
import { TEXT_EFFECTS } from "./textfx";
import { fitShapeBox } from "./textfit";
import { readImageFile } from "./imageFile";
import { removeBackground } from "./bgRemove";
import { WRITE_KINDS, WRITE_KIND_ORDER } from "./aitext";
import { clearHighlightRuns, isVectorShape } from "./model";
import {
  Type, Image as ImageIcon, Square, Minus, AlignLeft, AlignCenter, AlignRight,
  Ban, Sparkles, Crop, Check, RotateCcw, Eraser, FlipHorizontal2, FlipVertical2,
  Contrast, Replace, ImageDown, MoreHorizontal, ChevronDown, ArrowUp, ArrowDown,
  Copy, CopyPlus, ClipboardPaste, Trash2, Link2, X, Maximize2, Minimize2,
} from "lucide-react";

// The element-type badge glyph (top-left of the bar) as a line icon.
const KIND_ICON = { text: Type, image: ImageIcon, rect: Square, line: Minus };
function KindIcon({ type }) { const I = KIND_ICON[type] || Square; return <I size={15} strokeWidth={2} />; }

// The top contextual toolbar (Canva-style, top-only). It replaces the right-hand
// Inspector: one horizontal bar above the canvas whose controls reflect the
// SELECTED element (text / image / rectangle / line). High-frequency controls sit
// inline; denser ones (Position, Effects, Shape) open as dropdown popovers
// anchored to the bar. Wired to the same reducer actions the Inspector used; a
// selected text SPAN still routes colour/weight through the floating FormatBar.
export default function Toolbar({ el, dispatch, editing, textSel, spanStyle, onStyleSpan, onClearSpan, cropping, siblings, onAiWrite, canPaste, fontOptions, onUploadFont }) {
  const [pop, setPop] = useState(null); // open popover: "position" | "effects" | "shape" | "crop" | "more" | "ai" | null
  const [bgBusy, setBgBusy] = useState(false);
  const [barW, setBarW] = useState(9999); // measured width → responsive overflow
  const fileRef = useRef(null);
  const fontRef = useRef(null);       // hidden input for the picker's "Add font…"
  const barRef = useRef(null);
  // Upload a font from the toolbar picker, then apply it to the selected text.
  const pickFontFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f || !onUploadFont) return;
    const family = await onUploadFont(f); // resolves to the CSS family, or null on error
    if (family) up({ fontFamily: family });
  };
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
  // Keep the editor focused when an effect button is clicked while a text box is
  // being edited (with or without a sub-selection), so a whole-box effect applies
  // live and editing continues instead of the click blurring and ending the edit.
  const keepEdit = !!sel || !!(el && el.type === "text" && editing);
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
  // Clearing a highlight (v=null) must strip BOTH the bg AND the paired knockout
  // text colour so the phrase's colour returns to the element base and the span
  // merges back into the surrounding copy — otherwise a removed highlight left the
  // text white (its knockout colour) and visibly detached. On a SELECTION that's a
  // bg:null + color:null run patch; on the WHOLE BOX it also strips every baked
  // highlight run (generated highlights fold into runs now, not the old `highlight`
  // marker) plus the legacy textBg/highlight fields for older decks.
  // v = colour (null clears); style = highlight shape (pill/block/…). A selection
  // routes to the run (bg/bgStyle); the whole box keeps textBg/textBgStyle — both
  // the renderers and the export read these, and the change previews live.
  const setHl = (v, style) => {
    const st = style || normHlStyle(el && el.textBgStyle);
    if (sel && onStyleSpan) onStyleSpan(v ? { bg: v, bgStyle: st } : { bg: null, color: null });
    else if (v) up({ textBg: v, textBgStyle: st });
    else up({ textBg: null, textBgStyle: null, highlight: null, highlightColor: null, highlightText: null, runs: clearHighlightRuns(el.runs) });
  };
  const hlStyle = el && el.type === "text" ? (sel ? normHlStyle(spanStyle && spanStyle.bgStyle) : normHlStyle(el.textBgStyle)) : "pill";

  return (
    <div ref={barRef} style={bar}>
      <span style={kind}><KindIcon type={el.type} /></span>
      <Sep />

      {el.type === "text" && (
        <>
          <span style={{ width: 150 }}><FontSelect value={el.fontFamily} options={fontOptions || FONT_OPTIONS} onChange={(v) => up({ fontFamily: v })} title="Font (whole text)" onAddFont={onUploadFont ? () => fontRef.current && fontRef.current.click() : undefined} /></span>
          <input ref={fontRef} type="file" accept=".ttf,.otf,.woff,.woff2,font/*" style={{ display: "none" }} onChange={pickFontFile} />
          <Stepper value={Math.round(el.fontSize || 0)} onDelta={(d) => up({ fontSize: Math.max(6, (el.fontSize || 0) + d) })} onSet={(v) => up({ fontSize: Math.max(6, Math.min(400, v)) })} />
          <ColorPopover variant="text" title="Text colour" value={textColor} accent={UI.brand} onPick={(v) => setStyle({ color: v })} glyph={<span style={{ fontWeight: 800, borderBottom: "3px solid " + (textColor || "#fff"), lineHeight: 1 }}>A</span>} />
          <Sep />
          <Seg>
            <SegBtn on={bold} sel={!!sel} onMouseDown={keepEdit ? hold : undefined} onClick={() => setStyle(sel ? { bold: !bold } : { fontWeight: bold ? 400 : 700 })}><b>B</b></SegBtn>
            <SegBtn on={italic} sel={!!sel} onMouseDown={keepEdit ? hold : undefined} onClick={() => setStyle({ italic: !italic })}><i>I</i></SegBtn>
            <SegBtn on={underline} sel={!!sel} onMouseDown={keepEdit ? hold : undefined} onClick={() => setStyle({ underline: !underline })}><u>U</u></SegBtn>
            <SegBtn on={strike} sel={!!sel} onMouseDown={keepEdit ? hold : undefined} onClick={() => setStyle({ strike: !strike })}><s>S</s></SegBtn>
          </Seg>
          <Seg>
            <SegBtn on={el.align === "left" || !el.align} onMouseDown={keepEdit ? hold : undefined} onClick={() => up({ align: "left" })} title="Align left"><AlignLeft size={15} /></SegBtn>
            <SegBtn on={el.align === "center"} onMouseDown={keepEdit ? hold : undefined} onClick={() => up({ align: "center" })} title="Align center"><AlignCenter size={15} /></SegBtn>
            <SegBtn on={el.align === "right"} onMouseDown={keepEdit ? hold : undefined} onClick={() => up({ align: "right" })} title="Align right"><AlignRight size={15} /></SegBtn>
          </Seg>
          <Sep />
          <ColorPopover variant="highlight" title="Highlight" value={hl || null} bgStyle={hlStyle} dim={!hl} accent={UI.brand}
            onPick={(v) => setHl(v)} onPickStyle={(st) => setHl(hl || "#ffd34e", st)} onClear={() => setHl(null)}
            glyph={<span style={{ background: hl || "#ffd34e", color: "#101010", borderRadius: 3, padding: "0 3px", fontSize: 11, fontWeight: 700 }}>H</span>} />
          {onAiWrite && <><Sep /><button style={{ ...aiPill, ...(pop === "ai" ? aiPillOn : null) }} onClick={() => toggle("ai")} title="Write this text with AI"><Sparkles size={14} /> Write</button></>}
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
              <TextBtn title="Finish cropping" onClick={() => dispatch({ type: "crop", id: el.id })} style={cropDone}><Check size={14} /> Done</TextBtn>
              <TextBtn title="Reset the crop" onClick={() => up({ crop: null })}><RotateCcw size={14} /> Reset</TextBtn>
            </>
          ) : (
            <PopBtn label={<><Crop size={14} /> Crop</>} open={false} onClick={() => dispatch({ type: "crop", id: el.id })} noCaret />
          )}
          <TextBtn title="Remove background (in-browser, no key)"
            onClick={async () => {
              if (bgBusy || !el.src) return;
              const id = el.id, srcWas = el.origSrc || el.src;
              setBgBusy(true);
              const out = await removeBackground(el.src);
              setBgBusy(false);
              if (out) dispatch({ type: "update", id, patch: { origSrc: srcWas, src: out, thumb: out } });
            }}><Eraser size={14} /> {bgBusy ? "Removing…" : "BG Remover"}</TextBtn>
          {el.origSrc && <TextBtn title="Restore the original image" onClick={() => up({ src: el.origSrc, thumb: el.origSrc, origSrc: null })}><RotateCcw size={14} /> Restore</TextBtn>}
          <Sep />
          <SelectBtn value={el.fit || "cover"} onChange={(v) => up({ fit: v })} title="Fit" options={[["cover", "Fill"], ["contain", "Fit"]]} />
          <NumBtn label="Radius" value={el.radius || 0} onChange={(n) => up({ radius: Math.max(0, n) })} />
          <Seg>
            <SegBtn on={!!el.flipX} onClick={() => up({ flipX: !el.flipX })} title="Flip horizontal"><FlipHorizontal2 size={15} /></SegBtn>
            <SegBtn on={!!el.flipY} onClick={() => up({ flipY: !el.flipY })} title="Flip vertical"><FlipVertical2 size={15} /></SegBtn>
            <SegBtn on={!!el.mono} onClick={() => up({ mono: !el.mono })} title="Black & white"><Contrast size={15} /></SegBtn>
          </Seg>
          {/* Photo-owned darkening overlay (the scrim) — fixed-width slider so it
              never overflows the bar; ⊘ clears it. */}
          <span style={{ ...pill, gap: 7 }} title="Darken this photo (overlay)">
            <span>Overlay</span>
            <input type="range" min={0} max={80} value={Math.round((el.scrim || 0) * 100)} onChange={(e) => up({ scrim: (+e.target.value || 0) / 100 })} style={{ width: 64, accentColor: UI.brand }} />
            <button style={miniClear} onClick={() => up({ scrim: 0 })} title="No overlay"><Ban size={13} /></button>
          </span>
          {showImgExtra && <Sep />}
          {showImgExtra && <TextBtn onClick={() => fileRef.current && fileRef.current.click()} title="Replace with another image"><Replace size={14} /> Replace</TextBtn>}
          {showImgExtra && <TextBtn onClick={() => dispatch({ type: "imageToBackground", id: el.id })} title="Set as slide background"><ImageDown size={14} /> Background</TextBtn>}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) readImageFile(f, (img) => { if (img) up({ src: img.src, thumb: img.thumb, crop: null }); }); e.target.value = ""; }} />
        </>
      )}

      {(isVectorShape(el) || el.type === "line") && (
        <>
          <ColorBtn title={el.type === "line" ? "Colour" : "Fill"} value={el.fill && el.fill !== "none" ? el.fill : "#ffffff"} dim={!el.fill || el.fill === "none"} onChange={(v) => up({ fill: v })}
            glyph={<span style={{ width: 16, height: 16, borderRadius: 4, background: el.fill && el.fill !== "none" ? el.fill : "#444", border: "1px solid #555" }} />}
            extra={el.type !== "line" ? <button style={miniClear} onClick={() => up({ fill: "none" })} title="No fill"><Ban size={13} /></button> : undefined} />
          {el.type !== "line" && (
            <>
              <ColorBtn title="Border" value={el.stroke && el.stroke !== "none" ? el.stroke : "#ffffff"} dim={!el.stroke || el.stroke === "none"}
                onChange={(v) => up({ stroke: v, strokeWidth: el.strokeWidth || 2 })}
                glyph={<span style={{ width: 16, height: 16, borderRadius: 4, border: "2px solid " + (el.stroke && el.stroke !== "none" ? el.stroke : "#666"), boxSizing: "border-box" }} />}
                extra={<button style={miniClear} onClick={() => up({ stroke: "none", strokeWidth: 0 })} title="No border"><Ban size={13} /></button>} />
              <NumBtn label="Width" value={el.strokeWidth || 0} onChange={(n) => up({ strokeWidth: Math.max(0, n), stroke: n > 0 ? (el.stroke && el.stroke !== "none" ? el.stroke : "#ffffff") : "none" })} />
              {el.type === "rect" && <NumBtn label="Radius" value={el.radius || 0} onChange={(n) => up({ radius: Math.max(0, n) })} />}
            </>
          )}
          {el.type === "line" && <NumBtn label="Weight" value={Math.round(el.h) || 0} onChange={(n) => up({ h: Math.max(1, Math.round(n)) })} />}
          <DashSelect value={el.dash || "solid"} onChange={(v) => up({ dash: v })} />
        </>
      )}

      <Spacer />
      <PopBtn label="Position" open={pop === "position"} onClick={() => toggle("position")} />
      <IconBtn title="More" onClick={() => toggle("more")}><MoreHorizontal size={16} /></IconBtn>

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
        <P2><WBtn onClick={() => dispatch({ type: "raise", id: el.id })}><ArrowUp size={14} /> Forward</WBtn><WBtn onClick={() => dispatch({ type: "lower", id: el.id })}><ArrowDown size={14} /> Back</WBtn></P2>
      </Popover>}

      {pop === "more" && <Popover onClose={() => setPop(null)} right>
        {/* Collapsed-from-the-bar controls appear here on a narrow canvas. */}
        {el.type === "text" && !showEffects && <><WBtn onClick={() => setPop("effects")}>Effects…</WBtn><div style={{ height: 6 }} /></>}
        {el.type === "text" && !showShape && <><WBtn onClick={() => setPop("shape")}>Shape…</WBtn><div style={{ height: 6 }} /></>}
        {el.type === "image" && !showImgExtra && <><WBtn onClick={() => { fileRef.current && fileRef.current.click(); setPop(null); }}><Replace size={14} /> Replace image</WBtn><div style={{ height: 6 }} /><WBtn onClick={() => { dispatch({ type: "imageToBackground", id: el.id }); setPop(null); }}><ImageDown size={14} /> Set as background</WBtn><div style={{ height: 6 }} /></>}
        {/* B6 tether: pin this element to a parent so it follows the parent's drag. */}
        {el.tetherTo
          ? <><div style={tetherRow}><span style={{ color: "#bfe9bf", display: "inline-flex", alignItems: "center", gap: 6 }}><Link2 size={13} /> Tethered to {tetherName(el.tetherTo, siblings)}</span><button style={miniClear} title="Untether" onClick={() => up({ tetherTo: null })}><X size={13} /></button></div><div style={{ height: 6 }} /></>
          : ((siblings && siblings.length) ? <><div style={tetherRow}><span style={{ ...pLab, display: "inline-flex", alignItems: "center", gap: 6 }}><Link2 size={13} /> Tether to…</span><select value="" onChange={(e) => { if (e.target.value) up({ tetherTo: e.target.value }); }} style={tetherSelect}><option value="">choose…</option>{siblings.map((s) => <option key={s.id} value={s.id}>{tetherLabel(s)}</option>)}</select></div><div style={{ height: 6 }} /></> : null)}
        {/* Element clipboard — mirrors ⌘C/⌘V/⌘D and the floating bar. */}
        <WBtn onClick={() => { dispatch({ type: "copyEl", id: el.id }); setPop(null); }}><Copy size={14} /> Copy</WBtn>
        <div style={{ height: 6 }} />
        <WBtn disabled={!canPaste} onClick={() => { dispatch({ type: "paste" }); setPop(null); }}><ClipboardPaste size={14} /> Paste</WBtn>
        <div style={{ height: 6 }} />
        <WBtn onClick={() => { dispatch({ type: "duplicate", id: el.id }); setPop(null); }}><CopyPlus size={14} /> Duplicate</WBtn>
        <div style={{ height: 6 }} />
        <WBtn danger onClick={() => { dispatch({ type: "delete", id: el.id }); setPop(null); }}><Trash2 size={14} /> Delete</WBtn>
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
        <div style={{ height: 8 }} />
        {/* Non-destructive text case — applied at render, original text preserved. */}
        <div style={caseRow}>
          <span style={caseLab}>Case</span>
          {[["upper", "AA", "UPPERCASE"], ["lower", "aa", "lowercase"], ["title", "Aa", "Title Case"], [null, "—", "Normal"]].map(([k, lab, ttl]) => (
            <button key={ttl} type="button" title={ttl} onClick={() => up({ textCase: k })} style={caseBtn((el.textCase || null) === k)}>{lab}</button>
          ))}
        </div>
        <div style={{ height: 8 }} />
        {/* Element-level drop shadow / glow (textfx.js) — a coloured shadow behind
            the whole text box, rendered live, in the strip, and on export. */}
        <P2>
          <SelectBtn value={el.effect || "none"} onChange={(v) => up({ effect: v })} title="Text effect" options={TEXT_EFFECTS.map((e) => [e.id, e.label])} />
          <EffectField label="FX colour" value={el.effect && el.effect !== "none" ? (el.effectColor || "#000000") : null} fallback="#000000" onChange={(v) => up({ effectColor: v })} />
        </P2>
        <div style={{ height: 8 }} />
        {/* Clear the element's text EFFECTS (background · outline · shadow) and
            restore Line/Track to defaults; the base text colour is left as-is. */}
        <WBtn onClick={() => up({ textBg: null, textStroke: null, textStrokeWidth: 0, effect: "none", lineHeight: 1.1, letterSpacing: 0 })}>
          <RotateCcw size={13} /> Reset text effects
        </WBtn>
      </Popover>}

      {pop === "shape" && el.type === "text" && <ShapePop el={el} up={up} dispatch={dispatch} onClose={() => setPop(null)} />}

      {pop === "ai" && el.type === "text" && onAiWrite && <AiPop onWrite={onAiWrite} onClose={() => setPop(null)} />}

    </div>
  );
}

// ---- ✨ inline-AI "write this for me" popover ----
// Self-contained: holds its own draft (instruction + preset chip) and in-flight
// state. `onWrite({kind,instruction})` is the parent's async writer — it resolves
// on success (we close) and throws on failure (we surface the message, stay open).
function AiPop({ onWrite, onClose }) {
  const [kind, setKind] = useState("heading");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const canGo = !busy && !!(kind || text.trim());
  const go = async () => {
    if (!canGo) return;
    setBusy(true); setErr("");
    try { await onWrite({ kind, instruction: text.trim() }); onClose(); }
    catch (e) { setErr((e && e.message) || "Couldn't generate — please try again."); setBusy(false); }
  };
  return (
    <>
      <div onClick={busy ? undefined : onClose} style={backdrop} />
      <div style={aiPop} onMouseDown={(e) => { const t = e.target.tagName; if (t !== "INPUT" && t !== "SELECT" && t !== "TEXTAREA" && t !== "BUTTON") e.preventDefault(); }}>
        <div style={aiHead}><Sparkles size={14} /> Write this for me</div>
        <div style={aiSub}>Generate copy into this text box, using the deck&rsquo;s topic for context.</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") go(); }}
          placeholder="Describe what to write… e.g. 'a punchy hook about Q3 revenue growth' — or just pick a chip"
          style={aiArea}
        />
        <div style={aiChips}>
          {WRITE_KIND_ORDER.map((k) => (
            <button key={k} onClick={() => setKind((cur) => (cur === k ? null : k))} style={{ ...aiChip, ...(kind === k ? aiChipOn : null) }}>{WRITE_KINDS[k].label}</button>
          ))}
        </div>
        {err ? <div style={aiErrBox}>{err}</div> : null}
        <div style={aiRow}>
          <span style={aiNote}>Replaces this text box · ⌘Z undoes it</span>
          <button onClick={busy ? undefined : onClose} style={aiCancel}>Cancel</button>
          <button onClick={go} disabled={!canGo} style={{ ...aiGo, opacity: canGo ? 1 : 0.5, cursor: canGo ? "pointer" : "default" }}><Sparkles size={13} /> {busy ? "Writing…" : "Generate"}</button>
        </div>
      </div>
    </>
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
              <button style={miniClear} onClick={() => up({ shapeBody: "transparent" })} title="No fill"><Ban size={13} /></button>
            </div>
            <EffectField label="Border" value={borderVal && borderVal !== "none" ? borderVal : null} fallback={UI.brand} onChange={(v) => up({ shapeBorderC: v })} />
          </P2>
          <P2>
            <NumField label="Border w" value={shapeBorderW(el)} onChange={(v) => up({ shapeBorderWidth: Math.max(0, v) })} step={1} />
            <SelectBtn value={el.shapeDash || "solid"} onChange={(v) => up({ shapeDash: v })} title="Border style" options={[["solid", "Solid"], ["dashed", "Dashed"], ["dotted", "Dotted"]]} />
          </P2>
          {/* Shrink the copy to sit inside the shape (vs. growing the box to the text). */}
          <P2>
            <ToggleBtn on={!!el.fitText} onClick={() => up({ fitText: !el.fitText })} title="Auto-shrink the text to stay inside the shape">
              <Minimize2 size={14} /> Fit text to shape
            </ToggleBtn>
          </P2>
          <P2><WBtn onClick={() => up(fitShapeBox(el, el.w))}><Maximize2 size={14} /> Fit box to text</WBtn><WBtn danger onClick={() => { setShape(null); onClose(); }}><X size={14} /> Remove</WBtn></P2>
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
  // The active brand background is WHITE, so a white glyph on it is invisible (the
  // "alignment button disappears when selected" bug). Use near-black on the white
  // brand fill; white only on the blue span-selection fill.
  const fg = on ? (sel ? "#fff" : UI.onBrand) : "#dadade";
  return <button title={title} onMouseDown={onMouseDown} onClick={onClick} style={{ ...segBtn, background: on ? bg : "transparent", color: fg }}>{children}</button>;
}
// The font-size control: −/+ buttons AND a directly TYPEABLE value. The middle is
// a numeric input (was a static label, so you couldn't type a size); onSet commits
// on Enter/blur, Escape reverts, and the draft re-syncs whenever `value` changes
// from outside (the ± buttons, undo, selecting another element).
function Stepper({ value, onDelta, onSet }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n) && onSet) onSet(n);
    else setDraft(String(value));
  };
  return (
    <span style={stepper}>
      <button style={stepBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => onDelta(-2)} title="Smaller">−</button>
      <input
        style={stepInput}
        value={draft}
        inputMode="numeric"
        aria-label="Font size"
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); e.currentTarget.blur(); }
          else if (e.key === "Escape") { e.preventDefault(); setDraft(String(value)); e.currentTarget.blur(); }
          else if (e.key === "ArrowUp") { e.preventDefault(); onDelta(2); }
          else if (e.key === "ArrowDown") { e.preventDefault(); onDelta(-2); }
          e.stopPropagation(); // keep canvas shortcuts (Delete, etc.) from firing while typing
        }}
        onBlur={commit}
      />
      <button style={stepBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => onDelta(2)} title="Larger">+</button>
    </span>
  );
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
    <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
  </select>;
}
function TextBtn({ children, onClick, title, style }) { return <button style={style ? { ...pillBtn, ...style } : pillBtn} onClick={onClick} title={title}>{children}</button>; }
function IconBtn({ children, onClick, title }) { return <button style={{ ...pillBtn, padding: "0 10px" }} onClick={onClick} title={title}>{children}</button>; }
function PopBtn({ label, open, onClick, noCaret }) { return <button style={{ ...pillBtn, background: open ? "#34343c" : pillBtn.background }} onClick={onClick}>{label}{!noCaret && <ChevronDown size={14} style={{ opacity: 0.7, marginLeft: -1 }} />}</button>; }

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
function WBtn({ children, onClick, danger, disabled }) { return <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ ...wBtn, color: danger ? "#ff8a8a" : UI.text, opacity: disabled ? 0.4 : 1, cursor: disabled ? "default" : "pointer" }}>{children}</button>; }
// A full-width on/off toggle button — filled brand when on, hollow when off.
function ToggleBtn({ children, on, onClick, title }) {
  return <button onClick={onClick} title={title} style={{ ...wBtn, flex: 1, justifyContent: "center", background: on ? UI.brand : wBtn.background, color: on ? UI.onBrand : UI.text, borderColor: on ? UI.brand : UI.border }}>{children}</button>;
}

// A short label for an element in the tether picker (native <option> text, so it's
// a word not an icon): a content hint for text, a type name otherwise.
function tetherLabel(e) {
  if (e.type === "text") { const t = (e.content || "").trim().replace(/\s+/g, " "); return t ? "“" + t.slice(0, 16) + (t.length > 16 ? "…" : "") + "”" : "Text"; }
  return { image: "Photo", rect: "Rectangle", line: "Line" }[e.type] || "Element";
}
function tetherName(id, siblings) { const m = (siblings || []).find((s) => s.id === id); return m ? tetherLabel(m) : "another element"; }
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
const pillBtn = { height: 32, padding: "0 11px", borderRadius: 9, background: "#24242a", border: "1px solid #34343c", color: "#eaeaea", fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 };
const cropDone = { background: "#1f7a3a", border: "1px solid #2a9a4a", color: "#eafff0", fontWeight: 700 };
const tetherRow = { display: "flex", alignItems: "center", gap: 7, height: 32, background: UI.surface2, border: "1px solid " + UI.border, borderRadius: 7, padding: "0 9px", fontSize: 12 };
const tetherSelect = { marginLeft: "auto", maxWidth: 130, background: "#2a2a30", color: "#eaeaea", border: "1px solid #3a3a42", borderRadius: 6, fontSize: 12, padding: "2px 4px", cursor: "pointer" };
const miniClear = { background: "transparent", border: "none", color: "#9a9a9a", cursor: "pointer", fontSize: 13, padding: "0 2px", marginLeft: 2 };
const segWrap = { display: "inline-flex", height: 32, background: "#24242a", border: "1px solid #34343c", borderRadius: 9, overflow: "hidden", flexShrink: 0 };
const segBtn = { width: 32, height: 30, border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" };
const stepper = { display: "inline-flex", alignItems: "center", height: 32, background: "#24242a", border: "1px solid #34343c", borderRadius: 9, overflow: "hidden" };
const stepBtn = { width: 28, height: 30, border: "none", background: "transparent", color: "#eaeaea", cursor: "pointer", fontSize: 15 };
const stepVal = { minWidth: 30, textAlign: "center", color: "#eaeaea", fontSize: 12.5, fontWeight: 600 };
const stepInput = { width: 34, textAlign: "center", color: "#eaeaea", fontSize: 12.5, fontWeight: 600, background: "transparent", border: "none", outline: "none", padding: 0, MozAppearance: "textfield" };
const backdrop = { position: "fixed", inset: 0, zIndex: 70 };
const popover = { position: "absolute", top: 54, zIndex: 71, width: 230, background: "#161619", border: "1px solid #34343c", borderRadius: 12, boxShadow: "0 18px 40px rgba(0,0,0,0.6)", padding: 12 };
// ✨ inline-AI "Write" pill + its popover (gradient accent so it reads as the AI affordance)
const aiPill = { height: 32, padding: "0 13px", borderRadius: 9, background: "linear-gradient(135deg,#3a2a6e,#6d3bd1)", border: "1px solid #7d54e0", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: "0 0 0 1px rgba(125,84,224,0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 };
const aiPillOn = { background: "linear-gradient(135deg,#4a3686,#7d4ae6)", boxShadow: "0 0 0 2px rgba(125,84,224,0.4)" };
const aiPop = { position: "absolute", top: 54, left: 8, zIndex: 71, width: 340, maxWidth: "calc(100vw - 24px)", background: "#1a1a1d", border: "1px solid #34343c", borderRadius: 12, boxShadow: "0 18px 50px rgba(0,0,0,0.6)", padding: 14 };
const aiHead = { fontSize: 13, fontWeight: 600, color: UI.text, marginBottom: 3, display: "inline-flex", alignItems: "center", gap: 6 };
const aiSub = { fontSize: 11.5, color: UI.muted, lineHeight: 1.45, marginBottom: 11 };
const aiArea = { width: "100%", boxSizing: "border-box", background: "#111114", border: "1px solid #34343c", borderRadius: 8, padding: "9px 11px", fontSize: 13, color: UI.text, minHeight: 60, resize: "vertical", lineHeight: 1.4, outline: "none", fontFamily: "inherit" };
const aiChips = { display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0 12px" };
const aiChip = { fontSize: 11, padding: "5px 10px", borderRadius: 999, background: "#232327", border: "1px solid #34343c", color: "#bcbcc2", cursor: "pointer" };
const aiChipOn = { background: "#2a2150", borderColor: "#6d3bd1", color: "#cdbcff" };
const aiErrBox = { fontSize: 11.5, color: "#ff9a9a", marginBottom: 9, lineHeight: 1.4 };
const aiRow = { display: "flex", alignItems: "center", gap: 8 };
const aiNote = { fontSize: 10.5, color: UI.muted, flex: 1, minWidth: 0 };
const aiCancel = { fontSize: 12, fontWeight: 600, padding: "8px 13px", borderRadius: 8, background: "#232327", color: "#bcbcc2", border: "1px solid #34343c", cursor: "pointer" };
const aiGo = { fontSize: 12, fontWeight: 600, padding: "8px 15px", borderRadius: 8, background: "linear-gradient(135deg,#6d3bd1,#8b5cf6)", color: "#fff", border: "none", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 };
const popTitle = { fontSize: 10, fontWeight: 700, letterSpacing: 1.1, color: "#7c7c84", textTransform: "uppercase", marginBottom: 10 };
const popSelect = { width: "100%", height: 32, background: UI.surface2, color: UI.text, border: "1px solid " + UI.border, borderRadius: 7, fontSize: 12.5, padding: "0 8px" };
const pField = { flex: 1, height: 32, background: UI.surface2, border: "1px solid " + UI.border, borderRadius: 7, display: "flex", alignItems: "center", padding: "0 9px", gap: 6, minWidth: 0 };
const pLab = { color: UI.muted, fontSize: 10, flexShrink: 0 };
const pNum = { flex: 1, minWidth: 0, width: "100%", background: "transparent", border: "none", color: UI.text, fontSize: 12, textAlign: "right", outline: "none" };
const pHint = { fontSize: 11, color: UI.muted, lineHeight: 1.45 };
const caseRow = { display: "flex", alignItems: "center", gap: 6 };
const caseLab = { fontSize: 11, color: UI.muted, width: 40, flexShrink: 0 };
function caseBtn(on) {
  return { flex: 1, height: 30, borderRadius: 7, cursor: "pointer", fontSize: 12.5, fontWeight: 700,
    background: on ? UI.brand : UI.surface2, color: on ? UI.onBrand : UI.text,
    border: "1px solid " + (on ? UI.brand : UI.border) };
}
const wBtn = { width: "100%", height: 32, borderRadius: 7, background: UI.surface2, border: "1px solid " + UI.border, color: UI.text, cursor: "pointer", fontSize: 12.5, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 };
