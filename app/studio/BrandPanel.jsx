"use client";
import React from "react";
import { brandFromStyle, EDITORIAL_PALETTES, paletteBrand } from "./styles";

// Brand panel (spec §7). Deck-wide accent color, heading/body fonts, and the
// closing wordmark — applied across every slide and undoable. Re-themes by
// matching the current brand values, so anything you've hand-edited off-brand is
// left untouched.

const FONTS = [
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "Times (serif)", value: "'Times New Roman', serif" },
  { label: "Helvetica (sans)", value: "Helvetica, Arial, sans-serif" },
  { label: "Arial Black", value: "'Arial Black', Impact, sans-serif" },
  { label: "Trebuchet (sans)", value: "'Trebuchet MS', sans-serif" },
  { label: "Courier (mono)", value: "'Courier New', monospace" },
];

const wrap = {
  width: 240, flexShrink: 0, display: "flex", flexDirection: "column",
  background: "#1b1b1f", borderRight: "1px solid #2a2a2f", minHeight: 0,
  fontFamily: "Helvetica, Arial, sans-serif",
};
const head = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 8px" };
const xBtn = { width: 24, height: 24, lineHeight: "22px", textAlign: "center", background: "transparent", color: "#999", border: "none", cursor: "pointer", fontSize: 18, borderRadius: 5 };
const sel = { width: "100%", height: 34, background: "#26262b", color: "#e8e8e8", border: "1px solid #36363c", borderRadius: 6, fontSize: 13, padding: "0 8px" };
const inp = { width: "100%", height: 34, background: "#26262b", color: "#fff", border: "1px solid #36363c", borderRadius: 6, fontSize: 13, padding: "0 10px" };
const lbl = { fontSize: 11, color: "#9a9a9a", marginBottom: 6, display: "block" };
const miniBtn = { height: 30, padding: "0 10px", background: "#26262b", color: "#e8e8e8", border: "1px solid #36363c", borderRadius: 6, fontSize: 12, cursor: "pointer" };
const uploadBtn = { width: "100%", height: 40, background: "#26262b", color: "#cfcfcf", border: "1px dashed #45454c", borderRadius: 6, fontSize: 13, cursor: "pointer" };

function hex(c) {
  return typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c) ? c : "#000000";
}

// Read an uploaded image → a small, crisp PNG dataURL + a display size ~50px
// tall (width by aspect ratio, capped). dataURLs are same-origin, so the export
// canvas stays untainted. Browser-only (called from a file input's onChange).
function readLogoFile(file, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const MAX = 512; // cap the stored bitmap so the dataURL stays light
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const cw = Math.max(1, Math.round(img.width * scale));
      const ch = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
      let src;
      try { src = canvas.toDataURL("image/png"); } catch (e) { src = String(reader.result); }
      const ratio = img.width / img.height || 1;
      const h = 50;
      const w = Math.min(280, Math.round(h * ratio));
      cb({ src, w, h: Math.round(w / ratio) });
    };
    img.onerror = () => cb(null);
    img.src = String(reader.result);
  };
  reader.onerror = () => cb(null);
  reader.readAsDataURL(file);
}

function Field({ label, children }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

export default function BrandPanel({ brand, onApply, onLogo, onClose }) {
  // Fill any missing color fields from the editorial defaults so a palette swap
  // always has a known "previous" to remap from.
  const cur = Object.assign({}, brandFromStyle("editorial"), brand);
  const set = (patch) => onApply(cur, Object.assign({}, cur, patch));
  const fileRef = React.useRef(null);
  return (
    <div style={wrap}>
      <div style={head}>
        <strong style={{ fontSize: 12, letterSpacing: 0.5 }}>Brand</strong>
        <button style={xBtn} onClick={onClose} title="Close panel">×</button>
      </div>
      <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Palette">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {EDITORIAL_PALETTES.map((p) => {
              const active = cur.accent === p.accent && cur.bg === p.bg;
              return (
                <button key={p.id} title={p.label} onClick={() => set(paletteBrand(p))}
                  style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                  <span style={{ display: "block", height: 36, borderRadius: 6, background: p.bg, position: "relative",
                    boxShadow: active ? "0 0 0 2px #ffffff" : "inset 0 0 0 1px #ffffff22" }}>
                    <span style={{ position: "absolute", left: 6, bottom: 6, width: 14, height: 14, borderRadius: 7, background: p.accent }} />
                    <span style={{ position: "absolute", right: 7, top: 5, fontSize: 12, fontWeight: 700, fontFamily: "Georgia, serif", color: p.ink }}>Aa</span>
                  </span>
                  <span style={{ display: "block", marginTop: 4, fontSize: 9.5, lineHeight: 1.2, color: active ? "#e8e8e8" : "#8a8a8a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Accent color">
          <label style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", height: 34, padding: "0 8px", background: "#26262b", border: "1px solid #36363c", borderRadius: 6, cursor: "pointer" }}>
            <span style={{ width: 20, height: 20, borderRadius: 4, background: cur.accent, border: "1px solid #555" }} />
            <span style={{ fontSize: 12, color: "#bbb" }}>{cur.accent}</span>
            <input type="color" value={hex(cur.accent)} onChange={(e) => set({ accent: e.target.value })} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
          </label>
        </Field>
        <Field label="Heading font">
          <select value={cur.headFont} onChange={(e) => set({ headFont: e.target.value })} style={sel}>
            {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>
        <Field label="Body font">
          <select value={cur.bodyFont} onChange={(e) => set({ bodyFont: e.target.value })} style={sel}>
            {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>
        <Field label="Wordmark (closing slide)">
          <input value={cur.wordmark || ""} onChange={(e) => set({ wordmark: e.target.value })} style={inp} placeholder="LOATHR" />
        </Field>
        <Field label="Logo (every slide)">
          {cur.logo && cur.logo.src ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 64, height: 40, borderRadius: 6, background: "#0e0e12", border: "1px solid #36363c", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                <img src={cur.logo.src} alt="" style={{ maxWidth: "86%", maxHeight: "80%", objectFit: "contain", display: "block" }} />
              </span>
              <button style={miniBtn} onClick={() => fileRef.current && fileRef.current.click()}>Replace</button>
              <button style={miniBtn} onClick={() => onLogo(null)}>Remove</button>
            </div>
          ) : (
            <button style={uploadBtn} onClick={() => fileRef.current && fileRef.current.click()}>Upload image…</button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) readLogoFile(f, (L) => L && onLogo(L)); e.target.value = ""; }} />
        </Field>
        <p style={{ fontSize: 11, color: "#777", margin: 0, lineHeight: 1.5 }}>
          Palette, accent, fonts &amp; wordmark apply across every slide. The logo
          is stamped top-right on each slide — drag to reposition. Undoable (⌘/Ctrl+Z).
        </p>
      </div>
    </div>
  );
}
