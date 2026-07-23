"use client";
import React, { useEffect, useRef, useState } from "react";
import { UI } from "./theme";
import { HL_STYLES, normHlStyle, hlCss } from "./hlstyles";
import { normalizeHex, readRecents, pushRecent } from "./colors";

const STYLE_LABELS = { pill: "Pill", block: "Block", marker: "Marker", band: "Band", outline: "Outline" };

// An in-app colour / highlight control for the top toolbar. Clicking the pill opens
// a popover (swatches, optional highlight-style row, hex, recents, + a fallback to
// the system picker) INSTEAD of the OS colour input. Every control inside uses
// mousedown→preventDefault so the text editor keeps focus and the whole-box effect
// applies LIVE while editing; the popover is tagged data-formatbar so RichEditable's
// blur guard keeps the edit alive even when the hex field takes focus.
//
//   variant="text"      → onPick(color)
//   variant="highlight" → onPick(color) · onPickStyle(style) · onClear()
export default function ColorPopover({ variant, value, bgStyle, accent, onPick, onPickStyle, onClear, glyph, title, dim }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState("");
  const [recents, setRecents] = useState([]);
  const rootRef = useRef(null);
  const nativeRef = useRef(null);
  const isHl = variant === "highlight";

  useEffect(() => {
    if (!open) return undefined;
    setRecents(readRecents());
    setHex(value || accent || (isHl ? "#ffd34e" : "#ffffff"));
    const onDoc = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const hold = (e) => { if (e.target.tagName !== "INPUT") e.preventDefault(); };
  const pick = (c) => { const n = normalizeHex(c); if (!n) return; onPick(n); setHex(n); setRecents(pushRecent(n)); };
  const onHex = (v) => { setHex(v); const n = normalizeHex(v); if (n) onPick(n); };

  const swatches = isHl
    ? [accent || "#ffd34e", "#ffd34e", "#aef0c0", "#ffd0e0", "#bcdcff", "#e2473e"]
    : [accent || "#ffffff", "#ffffff", "#111111", "#e2473e", "#ffd34e", "#56b3ff"];
  const curStyle = normHlStyle(bgStyle);
  const prevBg = value || normalizeHex(hex) || "#f4c542";

  return (
    <span ref={rootRef} data-formatbar style={{ ...pill, position: "relative", opacity: dim ? 0.85 : 1 }}>
      <button
        title={title}
        onMouseDown={hold}
        onClick={() => setOpen((o) => !o)}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: UI.text, cursor: "pointer", padding: 0, font: "inherit" }}
      >
        {glyph}
        <span style={{ color: "#7c7c84", fontSize: 10 }}>▾</span>
      </button>
      {isHl && onClear && (
        <button style={miniClear} onMouseDown={hold} onClick={() => { onClear(); setOpen(false); }} title="No highlight">✕</button>
      )}

      {open && (
        <div style={popStyle} onMouseDown={hold}>
          <div style={popTitle}>{isHl ? "Highlight" : "Text colour"}</div>

          {isHl && <div style={popSub}>Colour</div>}
          <div style={{ display: "flex", gap: 6, marginBottom: 11, flexWrap: "wrap" }}>
            {swatches.map((c, i) => (
              <button key={i} onMouseDown={hold} onClick={() => pick(c)} title={c}
                style={{ ...gsw, background: c, outline: value && value.toLowerCase() === c.toLowerCase() ? "2px solid " + UI.select : "none", outlineOffset: 1 }} />
            ))}
            {isHl && (
              <button onMouseDown={hold} onClick={() => { onClear(); setOpen(false); }} title="No highlight"
                style={{ ...gsw, background: "#222", color: "#9a9a9a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>⊘</button>
            )}
          </div>

          {isHl && (
            <>
              <div style={popSub}>Style</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5, marginBottom: 11 }}>
                {HL_STYLES.map((st) => {
                  const on = curStyle === st;
                  return (
                    <button key={st} onMouseDown={hold} onClick={() => onPickStyle(st)} title={STYLE_LABELS[st]}
                      style={{ border: on ? "1px solid " + (accent || "#e2473e") : "1px solid #2c2c32", boxShadow: on ? "0 0 0 1px " + (accent || "#e2473e") : "none", borderRadius: 7, background: "#101013", padding: "7px 0 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 14, color: "#fff", lineHeight: 1, ...hlCss(prevBg, st, "#111") }}>Ab</span>
                      <span style={{ fontSize: 8, color: "#8a8a92" }}>{STYLE_LABELS[st]}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div style={hexRow}>
            <span style={{ ...chip, background: normalizeHex(hex) || "#26262b" }} />
            <span style={hexField}>
              <span style={{ color: "#7c7c84", fontSize: 14 }}>#</span>
              <input value={String(hex).replace(/^#/, "").toUpperCase()} onChange={(e) => onHex(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); pick(hex); setOpen(false); } else if (e.key === "Escape") { e.preventDefault(); setOpen(false); } e.stopPropagation(); }}
                spellCheck={false} maxLength={7} style={hexInput} />
            </span>
          </div>

          {recents.length > 0 && (
            <>
              <p style={recentLbl}>Recent</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {recents.map((c, i) => (
                  <button key={i} onMouseDown={hold} onClick={() => pick(c)} title={c} style={{ ...gsw, background: c }} />
                ))}
              </div>
            </>
          )}

          <button onMouseDown={hold} onClick={() => nativeRef.current && nativeRef.current.click()} style={nativeRow}>
            <span style={rainbowDot} />
            <span>Open system colour picker…</span>
          </button>
          <input ref={nativeRef} type="color" value={normalizeHex(hex) || "#ffffff"}
            onChange={(e) => pick(e.target.value)}
            style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }} />
        </div>
      )}
    </span>
  );
}

const pill = { height: 32, display: "inline-flex", alignItems: "center", gap: 4, padding: "0 8px", borderRadius: 9, background: "#24242a", border: "1px solid #34343c", color: "#eaeaea", fontSize: 12.5, whiteSpace: "nowrap" };
const miniClear = { background: "transparent", border: "none", color: "#9a9a9a", cursor: "pointer", fontSize: 12, padding: "0 2px", marginLeft: 1 };
const popStyle = { position: "absolute", top: 40, left: 0, width: 222, background: "#161619", border: "1px solid #34343c", borderRadius: 12, boxShadow: "0 18px 40px rgba(0,0,0,0.6)", padding: 12, zIndex: 70 };
const popTitle = { fontSize: 10, fontWeight: 700, letterSpacing: 1.1, color: "#7c7c84", textTransform: "uppercase", marginBottom: 9 };
const popSub = { fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, color: "#6a6a72", textTransform: "uppercase", margin: "2px 0 7px" };
const hexRow = { display: "flex", alignItems: "center", gap: 8, marginBottom: 11 };
const chip = { width: 34, height: 34, borderRadius: 8, border: "1px solid #00000055", flexShrink: 0 };
const hexField = { flex: 1, display: "flex", alignItems: "center", height: 34, background: "#26262b", border: "1px solid " + UI.select, borderRadius: 7, padding: "0 9px", gap: 2 };
const hexInput = { flex: 1, width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, fontFamily: "'Courier New', monospace", letterSpacing: 1 };
const recentLbl = { fontSize: 10, color: "#6f6f78", margin: "0 0 6px" };
const gsw = { width: 24, height: 24, borderRadius: 6, border: "1px solid #00000055", cursor: "pointer", padding: 0 };
const nativeRow = { display: "flex", alignItems: "center", gap: 7, width: "100%", marginTop: 11, paddingTop: 10, border: "none", borderTop: "1px solid #2a2a30", background: "transparent", color: "#9a9a9a", fontSize: 11, cursor: "pointer", textAlign: "left" };
const rainbowDot = { width: 20, height: 20, borderRadius: 5, flexShrink: 0, background: "conic-gradient(#ff4d4d,#ffd34e,#56e07a,#56b3ff,#b07cff,#ff4d4d)" };
