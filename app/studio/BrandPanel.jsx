"use client";
import React from "react";
import { UI } from "./theme";
import { brandFromStyle, EDITORIAL_PALETTES, paletteBrand, BRAND_FONT, FONT_OPTIONS, FONT_PRESETS, activePresetId, STYLE_LIST } from "./styles";
import { cautionFor } from "./categories";
import FontSelect from "./FontSelect";
import StylePreview from "./StylePreview";

// Brand panel (spec §7), reorganized into four sections — Look · Type · Brand
// marks · Closing. Deck-wide and undoable; re-themes by matching the current
// brand, so anything hand-edited off-brand is left untouched. Fonts apply by
// TIER (label/heading/body); the LOATHR marks stay Courier (see store.rethemeDoc).

const wrap = {
  width: 248, flexShrink: 0, display: "flex", flexDirection: "column",
  background: "#1b1b1f", borderRight: "1px solid #2a2a2f", minHeight: 0,
  fontFamily: "Helvetica, Arial, sans-serif",
};
const head = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 6px" };
const xBtn = { width: 24, height: 24, lineHeight: "22px", textAlign: "center", background: "transparent", color: "#999", border: "none", cursor: "pointer", fontSize: 18, borderRadius: 5 };
const body = { padding: "0 12px 14px", display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflowY: "auto" };
const sec = { fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: "#7c7c84", textTransform: "uppercase", margin: "14px 0 10px", borderTop: "1px solid #2a2a2f", paddingTop: 12 };
const secFirst = { ...sec, borderTop: "none", paddingTop: 4, marginTop: 6 };
const lbl = { fontSize: 11, color: "#9a9a9a", marginBottom: 6, display: "block" };
const sel = { width: "100%", height: 32, background: "#26262b", color: "#e8e8e8", border: "1px solid #36363c", borderRadius: 6, fontSize: 12.5, padding: "0 8px" };
const inp = { width: "100%", height: 34, background: "#26262b", color: "#fff", border: "1px solid #36363c", borderRadius: 6, fontSize: 13, padding: "0 10px" };
const miniBtn = { height: 30, padding: "0 10px", background: "#26262b", color: "#e8e8e8", border: "1px solid #36363c", borderRadius: 6, fontSize: 12, cursor: "pointer" };
const resetLookBtn = { width: "100%", height: 32, marginTop: 10, background: "#201a1a", color: "#e6a6a0", border: "1px solid #43302f", borderRadius: 7, fontSize: 12, cursor: "pointer" };
const uploadBtn = { width: "100%", height: 40, background: "#26262b", color: "#cfcfcf", border: "1px dashed #45454c", borderRadius: 6, fontSize: 13, cursor: "pointer" };
const disc = { width: "100%", display: "flex", alignItems: "center", gap: 8, height: 36, background: "#26262b", border: "1px solid #36363c", borderRadius: 6, color: "#e8e8e8", fontSize: 12.5, padding: "0 10px", cursor: "pointer" };
const frow = { display: "flex", alignItems: "center", gap: 9, marginBottom: 8 };
const frowK = { width: 56, flexShrink: 0, fontSize: 11, color: "#9a9a9a" };
const lock = { fontSize: 10.5, color: "#b9b48a", background: "#22221b", border: "1px solid #3a3a2a", borderRadius: 6, padding: "7px 9px", lineHeight: 1.45, marginTop: 6 };

function hex(c) {
  return typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c) ? c : "#000000";
}

// Display name from a CSS font stack: the first quoted family, else the first token.
function fontName(stack) {
  const m = String(stack || "").match(/'([^']+)'/);
  return m ? m[1] : String(stack || "").split(",")[0].trim();
}

// Deck-wide slide frame (R4). "Off" by default; the others map to frameElements.
const FRAME_MODES = [
  { id: "off", label: "Off" },
  { id: "edge", label: "Edge" },
  { id: "inset", label: "Inset" },
  { id: "corners", label: "Corners" },
];

// Read an uploaded image → a small, crisp PNG dataURL + a display size ~50px tall.
// dataURLs are same-origin, so the export canvas stays untainted. Browser-only.
function readLogoFile(file, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const MAX = 512;
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

export default function BrandPanel({ brand, category, family, slideFrame, onFamily, onApply, onLogo, onCaution, onFrame, onChrome, onResetAll, onClose }) {
  // Fill any missing fields from the editorial defaults so a swap always has a
  // known "previous" to remap from.
  const cur = Object.assign({}, brandFromStyle("editorial"), brand);
  // Auto-chrome visibility (R2). Absent = shown.
  const show = Object.assign({ wordmark: true, footer: true, pageno: true }, (brand && brand.show) || {});
  const brandless = show.brandless === true; // white-label: overrides the LOATHR marks off
  const set = (patch) => onApply(cur, Object.assign({}, cur, patch));
  const fileRef = React.useRef(null);
  const [looksOpen, setLooksOpen] = React.useState(false);
  const [frameAll, setFrameAll] = React.useState(false); // frame scope: this slide vs all
  const caution = cautionFor(category);

  const curLook = EDITORIAL_PALETTES.find((p) => cur.accent === p.accent && cur.bg === p.bg);
  const preset = activePresetId(cur);
  // Reset the LOOK (palette + fonts + frame) to the desk's default, keeping the
  // brand marks (wordmark / logo / caution) and white-label. Shown only once the
  // look has drifted from default. Undoable.
  const dflt = brandFromStyle(family);
  const LOOK_KEYS = ["accent", "secondary", "bg", "ink", "sub", "muted", "labelFont", "headFont", "bodyFont"];
  const lookDrifted = LOOK_KEYS.some((k) => (cur[k] || null) !== (dflt[k] || null)) || !!cur.frameColor || (slideFrame && slideFrame !== "off");
  const resetLook = () => {
    const next = Object.assign({}, cur);
    for (const k of LOOK_KEYS) next[k] = dflt[k];
    next.frameColor = null;
    onApply(cur, next);
    if (slideFrame && slideFrame !== "off") onFrame("off", true); // clear per-slide frames too
  };
  const applyPreset = (id) => {
    const p = FONT_PRESETS.find((x) => x.id === id);
    if (p) set({ labelFont: p.labelFont, headFont: p.headFont, bodyFont: p.bodyFont });
  };

  return (
    <div style={wrap}>
      <div style={head}>
        <strong style={{ fontSize: 12, letterSpacing: 0.5 }}>Brand</strong>
        <button style={xBtn} onClick={onClose} title="Close panel">×</button>
      </div>
      <div style={body}>
        {/* ---------- LOOK (collapsible) ---------- */}
        <div style={secFirst}>Look</div>
        {/* Style preset — switches the deck's cover/content layout AND its unique
            per-desk fonts (one pick), keeping the current colour palette. */}
        <div style={{ fontSize: 10, color: "#7c7c84", letterSpacing: 0.5, marginBottom: 8 }}>Style preset <span style={{ color: "#5f5f66" }}>· layout + fonts</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {STYLE_LIST.map((s) => {
            const on = (family || "editorial") === s.key;
            const fp = FONT_PRESETS.find((p) => p.id === s.key);
            const fonts = fp ? fontName(fp.headFont) + " · " + fontName(fp.bodyFont) : "";
            return (
              <button key={s.key} type="button" onClick={() => onFamily && onFamily(s.key)} title={s.label + " — layout + " + fonts}
                style={{ background: "transparent", border: "1.5px solid " + (on ? "#fff" : "#2c2c32"), borderRadius: 7, padding: 4, cursor: "pointer", overflow: "hidden" }}>
                <div style={{ borderRadius: 4, overflow: "hidden", lineHeight: 0 }}><StylePreview style={s} width={64} /></div>
                <div style={{ fontSize: 9, marginTop: 3, color: on ? "#fff" : "#9a9a9a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</div>
                <div style={{ fontSize: 7.5, color: "#6f6f78", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fonts}</div>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 10, color: "#7c7c84", letterSpacing: 0.5, marginBottom: 8 }}>Colour</div>
        <button type="button" style={disc} onClick={() => setLooksOpen((o) => !o)} title="Choose a look">
          <span style={{ color: "#9a9a9a" }}>{looksOpen ? "▾" : "▸"}</span>
          <span style={{ width: 22, height: 18, borderRadius: 4, background: cur.bg, position: "relative", boxShadow: "inset 0 0 0 1px #ffffff22", flexShrink: 0 }}>
            <span style={{ position: "absolute", left: 3, bottom: 3, width: 7, height: 7, borderRadius: 4, background: cur.accent }} />
          </span>
          <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{curLook ? curLook.label : "Custom look"}</span>
          {!looksOpen ? <span style={{ color: "#7c7c84", fontSize: 11 }}>9 looks</span> : null}
        </button>
        {looksOpen ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
              {EDITORIAL_PALETTES.map((p) => {
                const active = cur.accent === p.accent && cur.bg === p.bg;
                return (
                  <button key={p.id} title={p.label} onClick={() => set(paletteBrand(p))}
                    style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                    <span style={{ display: "block", height: 34, borderRadius: 6, background: p.bg, position: "relative", boxShadow: active ? "0 0 0 2px #ffffff" : "inset 0 0 0 1px #ffffff22" }}>
                      <span style={{ position: "absolute", left: 6, bottom: 6, width: 13, height: 13, borderRadius: 7, background: p.accent }} />
                      <span style={{ position: "absolute", right: 6, top: 4, fontSize: 12, fontWeight: 700, fontFamily: "Georgia, serif", color: p.ink }}>Aa</span>
                    </span>
                    <span style={{ display: "block", marginTop: 4, fontSize: 9.5, lineHeight: 1.2, color: active ? "#e8e8e8" : "#8a8a8a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.label}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={onResetAll}
              title="Re-render every slide from its text in this look — pulls any slide that drifted off-brand back in line. Discards manual per-element tweaks. Undoable."
              style={{ ...miniBtn, width: "100%", height: 32, marginTop: 10 }}>↺ Re-apply this look to all slides</button>
          </>
        ) : null}
        {lookDrifted && (
          <button type="button" onClick={resetLook}
            title="Revert palette, fonts & frame to this desk's default — keeps your wordmark, logo & caution. Undoable."
            style={resetLookBtn}>↺ Reset to default look</button>
        )}
        <div style={{ ...frow, marginTop: 11 }}>
          <span style={frowK}>Accent</span>
          <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, position: "relative", height: 32, padding: "0 9px", background: "#26262b", border: "1px solid #36363c", borderRadius: 6, cursor: "pointer" }}>
            <span style={{ width: 18, height: 18, borderRadius: 4, background: cur.accent, border: "1px solid #555" }} />
            <span style={{ fontSize: 12, color: "#bbb" }}>{cur.accent}</span>
            <input type="color" value={hex(cur.accent)} onChange={(e) => set({ accent: e.target.value })} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
          </label>
        </div>
        <div style={{ ...frow, marginTop: 6 }}>
          <span style={frowK} title="Drives the segment-header (kicker) colour">Secondary</span>
          <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, position: "relative", height: 32, padding: "0 9px", background: "#26262b", border: "1px solid #36363c", borderRadius: 6, cursor: "pointer" }}>
            <span style={{ width: 18, height: 18, borderRadius: 4, background: cur.secondary || cur.accent, border: "1px solid #555" }} />
            <span style={{ fontSize: 12, color: "#bbb" }}>{cur.secondary || cur.accent}</span>
            <input type="color" value={hex(cur.secondary || cur.accent)} onChange={(e) => set({ secondary: e.target.value })} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
          </label>
        </div>
        <div style={{ ...frow, marginTop: 2 }}>
          <span style={{ ...frowK, marginTop: 7 }}>Frame</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", border: "1px solid #36363c", borderRadius: 6, overflow: "hidden", marginBottom: 6 }}
              title="Scope: frame just this slide, or the whole deck.">
              {[["one", "This slide"], ["all", "All slides"]].map(([k, label]) => {
                const on = (frameAll ? "all" : "one") === k;
                return (
                  <button key={k} onClick={() => setFrameAll(k === "all")}
                    style={{ flex: 1, height: 26, fontSize: 11, cursor: "pointer", border: "none",
                      background: on ? UI.brand : "#26262b", color: on ? UI.onBrand : "#bbb", fontWeight: on ? 600 : 400 }}>
                    {label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 3 }} title="Border themed to the accent (News Desk uses ink).">
              {FRAME_MODES.map((m) => {
                const on = (slideFrame || "off") === m.id; // active = THIS slide's frame
                return (
                  <button key={m.id} onClick={() => onFrame(m.id, frameAll)}
                    style={{ flex: 1, height: 30, borderRadius: 6, cursor: "pointer", fontSize: 11,
                      background: on ? UI.brand : "#26262b", color: on ? UI.onBrand : "#cfcfcf",
                      border: "1px solid " + (on ? UI.brand : "#36363c"), fontWeight: on ? 600 : 400 }}>
                    {m.label}
                  </button>
                );
              })}
            </div>
            {/* Frame colour — an explicit override; absent = follows the accent
                (News Desk: ink). Deck-wide. Clear (↺) returns it to the accent. */}
            {/* Frame colour with an accent SYNC link. Linked (frameColor unset) =
                the frame follows the accent live; the 🔗 toggle unlinks it to a
                held colour (and re-links it back). */}
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {cur.frameColor ? (
                <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, position: "relative", height: 30, padding: "0 9px", background: "#26262b", border: "1px solid #36363c", borderRadius: 6, cursor: "pointer" }} title="Frame colour (deck-wide)">
                  <span style={{ width: 16, height: 16, borderRadius: 4, background: cur.frameColor, border: "1px solid #555" }} />
                  <span style={{ fontSize: 11.5, color: "#bbb" }}>{cur.frameColor}</span>
                  <input type="color" value={hex(cur.frameColor)} onChange={(e) => set({ frameColor: e.target.value })} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                </label>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, height: 30, padding: "0 9px", background: "#26262b", border: "1px solid #36363c", borderRadius: 6 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, background: cur.accent, border: "1px solid #555" }} />
                  <span style={{ fontSize: 11.5, color: "#7ed09a" }}>Linked to accent</span>
                </div>
              )}
              <button onClick={() => set({ frameColor: cur.frameColor ? null : cur.accent })}
                title={cur.frameColor ? "Link the frame to the accent" : "Unlink — hold a custom frame colour"}
                style={{ width: 30, height: 30, borderRadius: 6, background: cur.frameColor ? "#26262b" : UI.brand, color: cur.frameColor ? "#cfcfcf" : UI.onBrand, border: "1px solid " + (cur.frameColor ? "#36363c" : UI.brand), cursor: "pointer", fontSize: 13 }}>🔗</button>
            </div>
          </div>
        </div>

        {/* ---------- TYPE (fine-tune; the Style preset above sets the fonts) ---- */}
        <div style={sec}>Type <span style={{ fontWeight: 400, color: "#5f5f66", letterSpacing: 0 }}>· fine-tune</span></div>
        <div style={frow}><span style={frowK}>Label</span><FontSelect title="Label font" value={cur.labelFont} options={FONT_OPTIONS} onChange={(v) => set({ labelFont: v })} /></div>
        <div style={frow}><span style={frowK}>Heading</span><FontSelect title="Heading font" value={cur.headFont} options={FONT_OPTIONS} onChange={(v) => set({ headFont: v })} /></div>
        <div style={frow}><span style={frowK}>Body</span><FontSelect title="Body font" value={cur.bodyFont} options={FONT_OPTIONS} onChange={(v) => set({ bodyFont: v })} /></div>
        <div style={lock}>🔒 LOATHR marks (wordmark · footer · sign-off) stay Courier — not affected by these.</div>

        {/* ---------- ELEMENTS ---------- */}
        <div style={sec}>Elements</div>
        {/* White-label master toggle — removes every LOATHR mark (cover · footer ·
            closer lockup). Page numbers stay user-owned. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: brandless ? "#241f1a" : "#211c2a", border: "1px solid " + (brandless ? "#4a3a28" : "#332a40"), borderRadius: 9, padding: "10px 12px", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: brandless ? "#f0d9b8" : "#cdbfe0", fontWeight: 600 }}>Remove LOATHR branding
            <small style={{ display: "block", fontSize: 10, color: brandless ? "#b89a72" : "#8a7ca6", fontWeight: 400, marginTop: 2 }}>White-label · hides every mark, incl. closer</small></span>
          <button onClick={() => onChrome("brandless", !brandless)} title="Strip all LOATHR branding from every slide"
            style={{ width: 36, height: 20, borderRadius: 11, border: "none", cursor: "pointer", position: "relative", background: brandless ? "#e8b069" : "#3a3a42", flexShrink: 0 }}>
            <span style={{ position: "absolute", top: 2, left: brandless ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: brandless ? "#241a0e" : "#fff" }} />
          </button>
        </div>
        {[
          { k: "wordmark", label: "Cover wordmark", sub: "struck LOATHR / desk lockup", locked: brandless },
          { k: "footer", label: "Running footer", sub: "LOATHR · content slides", locked: brandless },
          { k: "pageno", label: "Page numbers", sub: "bottom-right · not a LOATHR mark", locked: false },
        ].map((row) => {
          const on = !row.locked && show[row.k] !== false; // white-label forces the marks visually off
          return (
            <div key={row.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 38, opacity: row.locked ? 0.45 : 1 }}>
              <span style={{ fontSize: 12.5, color: "#dcdcdc" }}>{row.label}<small style={{ display: "block", fontSize: 10, color: "#7c7c84" }}>{row.sub}</small></span>
              <button onClick={() => { if (!row.locked) onChrome(row.k, !on); }} disabled={row.locked}
                title={row.locked ? "Overridden by white-label" : (on ? "Hide" : "Show") + " " + row.label.toLowerCase() + " on every slide"}
                style={{ width: 36, height: 20, borderRadius: 11, border: "none", cursor: row.locked ? "default" : "pointer", position: "relative", background: on ? UI.brand : "#3a3a42", flexShrink: 0 }}>
                <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: on ? UI.onBrand : "#fff" }} />
              </button>
            </div>
          );
        })}
        <div style={{ fontSize: 10.5, color: "#7c7c84", lineHeight: 1.4, marginTop: 6 }}>Deck-wide. Frame is per-slide in Look; logo &amp; caution below.</div>

        {/* ---------- BRAND MARKS ---------- */}
        <div style={sec}>Brand marks</div>
        <label style={lbl}>Wordmark</label>
        <input value={cur.wordmark || ""} onChange={(e) => set({ wordmark: e.target.value })} style={{ ...inp, fontFamily: BRAND_FONT }} placeholder="LOATHR" />
        <label style={{ ...lbl, marginTop: 11 }}>Logo (cover &amp; closing)</label>
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

        {/* ---------- CLOSING ---------- */}
        <div style={sec}>Closing</div>
        <label style={lbl}>Caution label</label>
        <textarea value={cur.caution || ""} onChange={(e) => onCaution(e.target.value)} rows={2} placeholder="No caution label"
          style={{ ...inp, height: "auto", minHeight: 52, padding: "8px 10px", resize: "vertical", lineHeight: 1.4, fontFamily: "inherit" }} />
        {caution ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            <button style={miniBtn} title={caution.default} onClick={() => onCaution(caution.default)}>Default</button>
            {caution.alts.map((t, i) => (
              <button key={i} style={miniBtn} title={t} onClick={() => onCaution(t)}>Witty {i + 1}</button>
            ))}
          </div>
        ) : null}
        {cur.caution ? <button style={{ ...miniBtn, marginTop: 6 }} onClick={() => onCaution("")}>Remove</button> : null}
      </div>
    </div>
  );
}
