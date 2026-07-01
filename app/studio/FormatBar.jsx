"use client";
import React, { useEffect, useRef, useState } from "react";
import { UI } from "./theme";
import { barTop } from "./barlayout";
import { X } from "lucide-react";

const RECENT_KEY = "loathr.recentColors";

// Normalise a typed hex to "#rrggbb" (accepts "#rgb", "rrggbb", etc.) or null.
function normalizeHex(v) {
  if (!v) return null;
  let h = String(v).trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split("").map((c) => c + c).join("");
  if (/^[0-9a-fA-F]{6}$/.test(h)) return "#" + h.toLowerCase();
  return null;
}
function readRecents() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]").filter((c) => normalizeHex(c)); } catch (e) { return []; }
}
function pushRecent(hex) {
  if (typeof window === "undefined" || !hex) return readRecents();
  const next = [hex, ...readRecents().filter((c) => c.toLowerCase() !== hex.toLowerCase())].slice(0, 8);
  try { window.localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
  return next;
}

// The floating format bar that appears above a text SELECTION while editing —
// per-span colour (presets + a custom-hex popover), bold, italic, strike,
// background, outline (+ a quick size nudge). Preset/toggle controls use
// onMouseDown→preventDefault so the contentEditable keeps focus and the live
// selection survives the click. The hex field is allowed to take focus; styling
// then targets the STORED selection offsets (B2), and the editor's blur is
// guarded against [data-formatbar] so editing does not end.
export default function FormatBar({ style, accent, rect, onStyle, onClear, onSize }) {
  const [pop, setPop] = useState(null); // open colour popover: "text" | "bg" | null
  const [hex, setHex] = useState("");
  const [recents, setRecents] = useState([]);
  const [off, setOff] = useState({ x: 0, y: 0 }); // manual drag offset (grip)
  const colorRef = useRef(null);
  const dragRef = useRef(null);
  const key = pop === "bg" ? "bg" : "color"; // which run-style the popover edits

  useEffect(() => { setRecents(readRecents()); }, [pop]);
  // Seed the hex field from the selection's current colour/highlight when opened.
  useEffect(() => { if (pop) setHex((style && style[pop === "bg" ? "bg" : "color"]) || accent || "#ffffff"); }, [pop]); // eslint-disable-line react-hooks/exhaustive-deps
  // A new selection re-homes the bar (drop any manual drag offset).
  const anchorKey = rect ? Math.round(rect.top) + ":" + Math.round(rect.left) : "";
  useEffect(() => { setOff({ x: 0, y: 0 }); }, [anchorKey]);

  if (!rect) return null;
  const s = style || {};
  const bold = (s.fontWeight || 400) >= 700;
  const swatches = [accent || "#ffffff", "#ffffff", "#111111", "#e2473e", "#ffd34e", "#56b3ff"];
  const W = 480, H = 42; // W = centering/edge-clamp estimate; the bar itself sizes to its content
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const cx = Math.max(W / 2 + 8, Math.min((rect.left + rect.right) / 2, vw - W / 2 - 8)) + off.x;
  const place = barTop(rect, H, vh);
  const top = place.top + off.y; // nudged by any manual drag offset
  const hold = (e) => e.preventDefault(); // keep the editor's live selection

  // Drag the whole bar by its grip (pointer events; keeps the editor selection
  // because textSel is stored in Studio state and styling targets stored offsets).
  const onGripDown = (e) => {
    e.preventDefault();
    const start = { sx: e.clientX, sy: e.clientY, ox: off.x, oy: off.y };
    dragRef.current = start;
    const move = (ev) => { const d = dragRef.current; if (d) setOff({ x: d.ox + (ev.clientX - d.sx), y: d.oy + (ev.clientY - d.sy) }); };
    const up = () => { dragRef.current = null; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const apply = (c) => { const n = normalizeHex(c); if (!n) return; onStyle({ [key]: n }); setRecents(pushRecent(n)); };
  const onHexChange = (v) => { setHex(v); const n = normalizeHex(v); if (n) onStyle({ [key]: n }); };
  const customActive = !!(s.color && !swatches.some((c) => c.toLowerCase() === String(s.color).toLowerCase()));
  const HL_SWATCHES = [accent || "#ffd34e", "#ffd34e", "#aef0c0", "#ffd0e0", "#bcdcff", "#e2473e"];

  return (
    <div data-formatbar style={{ ...wrap, left: cx, top }} onMouseDown={(e) => { if (e.target.tagName !== "INPUT") hold(e); }}>
      {/* drag grip — reposition the whole bar */}
      <button onPointerDown={onGripDown} onMouseDown={hold} title="Drag to move" style={grip}>⠿</button>
      <span style={sep} />
      {/* preset text colours */}
      {swatches.map((c, i) => (
        <button key={i} onMouseDown={hold} onClick={() => { setPop(null); onStyle({ color: c }); }}
          title={"Text colour"} style={{ ...sw, background: c, outline: s.color === c ? "2px solid " + UI.select : "none" }} />
      ))}
      {/* custom-hex swatch — opens the text-colour popover */}
      <button onMouseDown={hold} onClick={() => setPop((p) => (p === "text" ? null : "text"))} title="Custom colour…"
        style={{ ...sw, ...rainbow, outline: (customActive || pop === "text") ? "2px solid " + UI.select : "none" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", textShadow: "0 1px 2px #0008", lineHeight: "16px" }}>+</span>
      </button>
      <span style={sep} />
      <Tog on={bold} onMouseDown={hold} onClick={() => onStyle({ bold: !bold })} title="Bold"><b>B</b></Tog>
      <Tog on={!!s.italic} onMouseDown={hold} onClick={() => onStyle({ italic: !s.italic })} title="Italic"><i>I</i></Tog>
      <Tog on={!!s.strike} onMouseDown={hold} onClick={() => onStyle({ strike: !s.strike })} title="Strikethrough"><s>S</s></Tog>
      <span style={sep} />
      <Tog on={!!s.bg || pop === "bg"} onMouseDown={hold} onClick={() => setPop((p) => (p === "bg" ? null : "bg"))} title="Highlight colour…">
        <span style={{ background: s.bg || "#ffd34e", color: "#101010", borderRadius: 3, padding: "0 3px", fontSize: 11, fontWeight: 700 }}>H</span>
      </Tog>
      <Tog on={!!(s.stroke && s.strokeWidth)} onMouseDown={hold} onClick={() => onStyle((s.stroke && s.strokeWidth) ? { stroke: null, strokeWidth: 0 } : { stroke: "#ffffff", strokeWidth: 4 })} title="Outline">
        <span style={{ WebkitTextStroke: "1px #fff", color: "transparent", fontWeight: 800, fontSize: 13 }}>O</span>
      </Tog>
      <span style={sep} />
      <Tog onMouseDown={hold} onClick={() => onSize(-6)} title="Smaller (selection)">A−</Tog>
      <Tog onMouseDown={hold} onClick={() => onSize(6)} title="Larger (selection)">A+</Tog>
      <span style={sep} />
      <Tog onMouseDown={hold} onClick={onClear} title="Clear styling on selection"><X size={14} style={{ color: UI.muted }} /></Tog>

      {pop && (
        <div style={popStyle} onMouseDown={(e) => { if (e.target.tagName !== "INPUT") hold(e); }}>
          <div style={popTitle}>{pop === "bg" ? "Highlight colour" : "Custom text colour"}</div>
          {pop === "bg" && (
            <div style={{ display: "flex", gap: 6, marginBottom: 11 }}>
              {HL_SWATCHES.map((c, i) => (
                <button key={i} onMouseDown={hold} onClick={() => { apply(c); setHex(c); }} title={c} style={{ ...gsw, background: c }} />
              ))}
              <button onMouseDown={hold} onClick={() => { onStyle({ bg: null }); setPop(null); }} title="No highlight"
                style={{ ...gsw, background: "#222", color: "#9a9a9a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>⊘</button>
            </div>
          )}
          <div style={hexRow}>
            <span style={{ ...chip, background: normalizeHex(hex) || "#26262b" }} />
            <span style={hexField}>
              <span style={{ color: "#7c7c84", fontSize: 14 }}>#</span>
              <input
                value={String(hex).replace(/^#/, "").toUpperCase()}
                onChange={(e) => onHexChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(hex); setPop(null); } else if (e.key === "Escape") { e.preventDefault(); setPop(null); } }}
                spellCheck={false} maxLength={7}
                style={hexInput} />
            </span>
          </div>
          {recents.length > 0 && (
            <>
              <p style={recentLbl}>Recent</p>
              <div style={grid}>
                {recents.map((c, i) => (
                  <button key={i} onMouseDown={hold} onClick={() => { apply(c); setHex(c); }} title={c}
                    style={{ ...gsw, background: c }} />
                ))}
              </div>
            </>
          )}
          <button onMouseDown={hold} onClick={() => colorRef.current && colorRef.current.click()} style={nativeRow}>
            <span style={rainbowDot} />
            <span>Open system colour picker…</span>
          </button>
          <input ref={colorRef} type="color" value={normalizeHex(hex) || "#ffffff"}
            onChange={(e) => { apply(e.target.value); setHex(e.target.value); }}
            style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }} />
        </div>
      )}
    </div>
  );
}

function Tog({ on, children, onClick, onMouseDown, title }) {
  return (
    <button onMouseDown={onMouseDown} onClick={onClick} title={title}
      style={{ ...tog, background: on ? UI.select : "transparent", color: on ? "#fff" : "#dadade" }}>
      {children}
    </button>
  );
}

const wrap = {
  position: "fixed", zIndex: 60, transform: "translateX(-50%)", height: 42,
  // Size to the controls (was a fixed 396 that clipped the last segments); never
  // wider than the viewport so a narrow window scrolls the page, not the bar.
  width: "max-content", maxWidth: "calc(100vw - 16px)",
  display: "flex", alignItems: "center", gap: 2, padding: "0 7px",
  background: "#101013", border: "1px solid #33333c", borderRadius: 11,
  boxShadow: "0 14px 32px rgba(0,0,0,0.55)", fontFamily: "Helvetica, Arial, sans-serif",
};
const tog = {
  height: 30, minWidth: 30, padding: "0 8px", borderRadius: 8, border: "none",
  cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
};
const grip = { height: 30, width: 18, padding: 0, border: "none", background: "transparent", color: "#6a6a72", cursor: "grab", fontSize: 14, lineHeight: "30px", letterSpacing: "-3px", flexShrink: 0, touchAction: "none" };
const sw = { width: 18, height: 18, borderRadius: 5, border: "1px solid #00000055", cursor: "pointer", padding: 0, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" };
const rainbow = { background: "conic-gradient(#ff4d4d,#ffd34e,#56e07a,#56b3ff,#b07cff,#ff4d4d)" };
const sep = { width: 1, height: 20, background: "#33333c", margin: "0 4px", flexShrink: 0 };

// --- custom-hex popover ---
const popStyle = {
  position: "absolute", top: 50, left: "50%", transform: "translateX(-50%)", width: 222,
  background: "#161619", border: "1px solid #34343c", borderRadius: 12,
  boxShadow: "0 18px 40px rgba(0,0,0,0.6)", padding: 12,
};
const popTitle = { fontSize: 10, fontWeight: 700, letterSpacing: 1.1, color: "#7c7c84", textTransform: "uppercase", marginBottom: 9 };
const hexRow = { display: "flex", alignItems: "center", gap: 8, marginBottom: 11 };
const chip = { width: 34, height: 34, borderRadius: 8, border: "1px solid #00000055", flexShrink: 0 };
const hexField = { flex: 1, display: "flex", alignItems: "center", height: 34, background: "#26262b", border: "1px solid " + UI.select, borderRadius: 7, padding: "0 9px", gap: 2 };
const hexInput = { flex: 1, width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, fontFamily: "'Courier New', monospace", letterSpacing: 1 };
const recentLbl = { fontSize: 10, color: "#6f6f78", margin: "0 0 6px" };
const grid = { display: "flex", flexWrap: "wrap", gap: 6 };
const gsw = { width: 24, height: 24, borderRadius: 6, border: "1px solid #00000055", cursor: "pointer", padding: 0 };
const nativeRow = { display: "flex", alignItems: "center", gap: 7, width: "100%", marginTop: 11, paddingTop: 10, border: "none", borderTop: "1px solid #2a2a30", background: "transparent", color: "#9a9a9a", fontSize: 11, cursor: "pointer", textAlign: "left" };
const rainbowDot = { width: 20, height: 20, borderRadius: 5, flexShrink: 0, background: "conic-gradient(#ff4d4d,#ffd34e,#56e07a,#56b3ff,#b07cff,#ff4d4d)" };
