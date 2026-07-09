"use client";
import React, { useState, useRef, useEffect } from "react";
import { UI } from "./theme";
import { loadKits, saveKits, upsertKit, removeKit } from "./brandkits";
import { uid } from "./model";
import { brandFromStyle, EDITORIAL_PALETTES, paletteBrand, BRAND_FONT, FONT_OPTIONS, FONT_PRESETS, activePresetId, STYLE_LIST } from "./styles";
import { cautionFor } from "./categories";
import { uploadedFontGroup, fontFamilyValue } from "./fonts";
import { Link2, ChevronDown, ChevronRight } from "lucide-react";
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
// Collapsible section header (accordion). The panel had five always-open sections
// stacked into a long scroll; each is now a header you can fold.
const accHead = { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", borderTop: "1px solid #2a2a2f", cursor: "pointer", padding: "13px 2px 11px", textAlign: "left" };
const accHeadFirst = { ...accHead, borderTop: "none", paddingTop: 6 };
const accTitle = { fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2, color: "#b7b7bf", textTransform: "uppercase", display: "inline-flex", alignItems: "baseline", gap: 6 };
const accSub = { fontWeight: 400, letterSpacing: 0, color: "#5f5f66", textTransform: "none", fontSize: 9.5 };

// One foldable Brand section. `first` drops the top divider; `defaultOpen` starts
// it expanded (Look). Local open state — remembered while the panel stays mounted.
function Section({ title, sub, first, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} style={first ? accHeadFirst : accHead} title={open ? "Collapse" : "Expand"}>
        <span style={accTitle}>{title}{sub ? <span style={accSub}>· {sub}</span> : null}</span>
        <span style={{ color: open ? "#c9c9d0" : "#8a8a92", display: "inline-flex" }}>{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>
      </button>
      {open ? <div style={{ paddingBottom: 6 }}>{children}</div> : null}
    </div>
  );
}
const cmRow = { display: "flex", alignItems: "center", gap: 9, background: "#131418", border: "1px solid #2a2f3a", borderRadius: 9, padding: "10px 11px", margin: "8px 0 4px" };
const kitChip = { display: "inline-flex", alignItems: "center", gap: 8, background: "#101012", border: "1px solid #2c2c34", borderRadius: 9, padding: "6px 9px" };
const addAccent = { height: 28, padding: "0 11px", background: "#26262b", color: "#9a9aa2", border: "1px dashed #3a3a42", borderRadius: 7, fontSize: 11.5, cursor: "pointer" };
// One accent colour swatch (native colour input), optionally clearable.
function Swatch({ label, value, onChange, clearable, onClear }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <label style={{ position: "relative", width: 30, height: 30, borderRadius: 7, border: "1px solid #3a3a42", background: value, cursor: "pointer", overflow: "hidden" }}>
        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#3a86ff"} onChange={(e) => onChange(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
      </label>
      <span style={{ fontSize: 9.5, color: "#7c7c84" }}>{clearable ? <button type="button" onClick={onClear} title="Remove" style={{ background: "none", border: "none", color: "#8a8a92", cursor: "pointer", fontSize: 9.5, padding: 0 }}>{label} ✕</button> : label}</span>
    </div>
  );
}
// A row of segmented option pills (footer align / scope).
function Pills({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {options.map(([v, l]) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          style={{ fontSize: 11, padding: "5px 9px", borderRadius: 7, cursor: "pointer",
            background: value === v ? "#fff" : "#26262b", color: value === v ? "#0a0a0a" : "#bdbdc4",
            border: "1px solid " + (value === v ? "#fff" : "#36363c"), fontWeight: value === v ? 600 : 400 }}>{l}</button>
      ))}
    </div>
  );
}
// One font row for the client brand (label + picker).
function FontRow({ label, value, options, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "#8a8a92", width: 54, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0 }}><FontSelect title={label + " font"} value={value} options={options} onChange={onChange} /></div>
    </div>
  );
}
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
const fontUpBtn = { width: "100%", height: 34, marginTop: 4, background: "#201a2e", color: "#cdbcff", border: "1px dashed #4a3a6e", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const fontHint = { fontSize: 10, color: "#6f6f77", marginTop: 6, lineHeight: 1.45 };
const fontErrBox = { fontSize: 11, color: "#ffb3a6", background: "#2e1a1a", border: "1px solid #5a3030", borderRadius: 6, padding: "6px 8px", marginTop: 6, lineHeight: 1.4 };
const fontList = { marginTop: 8, display: "flex", flexDirection: "column", gap: 4 };
const fontRowItem = { display: "flex", alignItems: "center", gap: 8, background: "#26262b", border: "1px solid #34343c", borderRadius: 6, padding: "5px 6px 5px 9px" };
const fontNameItem = { flex: 1, fontSize: 13, color: "#eaeaea", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const fontDel = { background: "transparent", border: "none", color: "#9a9a9a", cursor: "pointer", fontSize: 12, padding: "0 4px" };

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

export default function BrandPanel({ brand, category, family, slideFrame, onFamily, onApply, onLogo, onCaution, onFrame, onChrome, onResetAll, onClose, fonts, onUploadFont, onRemoveFont, member, brandMode, clientBrand, onBrandMode, onClientBrand }) {
  const [fontErr, setFontErr] = useState("");
  const [fontBusy, setFontBusy] = useState(false);
  const fontRef = useRef(null);
  // Prepend the deck's uploaded fonts as a "Your fonts" group in every picker.
  const upl = uploadedFontGroup(fonts);
  const fontOptions = upl ? [upl].concat(FONT_OPTIONS) : FONT_OPTIONS;
  const pickFont = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f || !onUploadFont) return;
    setFontErr(""); setFontBusy(true);
    const err = await onUploadFont(f);
    setFontBusy(false);
    if (err) setFontErr(err);
  };
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

  const client = brandMode === "client";
  const cb = clientBrand || {};
  const setCB = (patch) => onClientBrand && onClientBrand(Object.assign({}, cb, patch));
  // Saved brand kits (localStorage). Loaded once; save/apply/remove update both.
  const [kits, setKits] = useState([]);
  useEffect(() => { setKits(loadKits()); }, []);
  const persistKits = (next) => { setKits(next); saveKits(next); };
  const saveCurrentKit = () => {
    const name = (cb.name || "").trim() || ("Brand " + (kits.length + 1));
    const next = upsertKit(kits, { id: uid("kit"), name, brand: Object.assign({}, cb, { name }) });
    persistKits(next);
  };
  const applyKit = (k) => onClientBrand && onClientBrand(Object.assign({}, k.brand));
  return (
    <div style={wrap}>
      <div style={head}>
        <strong style={{ fontSize: 12, letterSpacing: 0.5 }}>{client ? "Branding" : "Brand"}</strong>
        <button style={xBtn} onClick={onClose} title="Close panel">×</button>
      </div>
      <div style={body}>
        {/* Client mode toggle — members only. Guests never reach this (forced on,
            hidden). Flipping it re-themes the deck (store.setBrandMode). */}
        {member && onBrandMode && (
          <div style={cmRow}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e8e8ee" }}>Client mode</div>
              <div style={{ fontSize: 10.5, color: client ? "#8bb6ff" : "#6a6a72", marginTop: 1 }}>{client ? "On · LOATHR branding hidden" : "Off · using LOATHR branding"}</div>
            </div>
            <button type="button" onClick={() => onBrandMode(client ? "loathr" : "client")} title="Toggle client branding"
              style={{ marginLeft: "auto", width: 40, height: 23, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", background: client ? "#2f5f9e" : "#3a3a42" }}>
              <span style={{ position: "absolute", top: 2, [client ? "right" : "left"]: 2, width: 19, height: 19, borderRadius: "50%", background: "#fff" }} />
            </button>
          </div>
        )}

        {/* ---------- CLIENT BRANDING (client mode) ---------- */}
        {client ? (
          <div style={{ paddingTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <label style={{ ...lbl, marginBottom: 0 }}>Your brands</label>
              <button type="button" onClick={saveCurrentKit} style={{ marginLeft: "auto", fontSize: 11, color: "#7fb2ff", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>💾 Save current</button>
            </div>
            {kits.length > 0 ? (
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                {kits.map((k) => (
                  <div key={k.id} style={kitChip}>
                    <button type="button" onClick={() => applyKit(k)} title={"Apply " + k.name} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#dcdce2", fontSize: 11.5, padding: 0 }}>
                      <span style={{ display: "flex", gap: 2 }}>
                        {[k.brand && k.brand.accent1, k.brand && k.brand.accent2, k.brand && k.brand.accent3].filter(Boolean).slice(0, 3).map((c, i) => <span key={i} style={{ width: 10, height: 10, borderRadius: 3, background: c }} />)}
                      </span>
                      {k.name}
                    </button>
                    <button type="button" onClick={() => persistKits(removeKit(kits, k.id))} title="Remove" style={{ background: "none", border: "none", color: "#7a7a82", cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize: 10.5, color: "#6a6a72", marginBottom: 12 }}>Save a brand to reuse it on future decks.</div>}
            <label style={lbl}>Brand name</label>
            <input style={inp} value={cb.name || ""} placeholder="Your client's name" onChange={(e) => setCB({ name: e.target.value })} />
            <label style={{ ...lbl, marginTop: 10 }}>Handle</label>
            <input style={inp} value={cb.handle || ""} placeholder="@handle" onChange={(e) => setCB({ handle: e.target.value })} />
            <label style={{ ...lbl, marginTop: 12 }}>Accents</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Swatch label="1" value={cb.accent1 || "#3a86ff"} onChange={(v) => setCB({ accent1: v })} />
              <Swatch label="2" value={cb.accent2 || "#f4b740"} onChange={(v) => setCB({ accent2: v })} />
              {cb.accent3 != null
                ? <Swatch label="3" value={cb.accent3 || "#e85d75"} onChange={(v) => setCB({ accent3: v })} clearable onClear={() => setCB({ accent3: null })} />
                : <button type="button" style={addAccent} title="Add a third accent" onClick={() => setCB({ accent3: "#e85d75" })}>+ 3rd</button>}
            </div>
            <label style={{ ...lbl, marginTop: 14 }}>Fonts</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FontRow label="Labels" value={cb.labelFont} options={fontOptions} onChange={(v) => setCB({ labelFont: v })} />
              <FontRow label="Heading" value={cb.headFont} options={fontOptions} onChange={(v) => setCB({ headFont: v })} />
              <FontRow label="Body" value={cb.bodyFont} options={fontOptions} onChange={(v) => setCB({ bodyFont: v })} />
            </div>

            <label style={{ ...lbl, marginTop: 14 }}>Footer</label>
            <Pills value={(cb.footer && cb.footer.align) || "left"} onChange={(v) => setCB({ footer: Object.assign({ scope: "coverclose" }, cb.footer, { align: v }) })}
              options={[["none", "None"], ["left", "Left"], ["center", "Center"], ["right", "Right"]]} />
            <div style={{ height: 6 }} />
            <Pills value={(cb.footer && cb.footer.scope) || "coverclose"} onChange={(v) => setCB({ footer: Object.assign({ align: "left" }, cb.footer, { scope: v }) })}
              options={[["every", "Every"], ["coverclose", "Cover + close"], ["cover", "Cover only"]]} />

            <label style={{ ...lbl, marginTop: 14, display: "flex", alignItems: "center" }}>
              Closeout slide
              <button type="button" title="Toggle closeout slide" onClick={() => setCB({ closeout: Object.assign({ cta: "Follow for more →" }, cb.closeout, { on: !(cb.closeout && cb.closeout.on) }) })}
                style={{ marginLeft: "auto", width: 36, height: 21, borderRadius: 11, border: "none", cursor: "pointer", position: "relative", background: (cb.closeout && cb.closeout.on) ? "#2f6f52" : "#3a3a42" }}>
                <span style={{ position: "absolute", top: 2, [(cb.closeout && cb.closeout.on) ? "right" : "left"]: 2, width: 17, height: 17, borderRadius: "50%", background: "#fff" }} />
              </button>
            </label>
            <input style={inp} value={(cb.closeout && cb.closeout.cta) || ""} placeholder="Closing call-to-action" onChange={(e) => setCB({ closeout: Object.assign({ on: true }, cb.closeout, { cta: e.target.value }) })} />

            <p style={{ fontSize: 10.5, color: "#6a6a72", marginTop: 14, lineHeight: 1.5 }}>Brand marks are the client&apos;s — LOATHR branding is hidden on this deck.</p>
          </div>
        ) : (
        <>
        {/* ---------- LOOK ---------- */}
        <Section title="Look" first defaultOpen>
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
          <span style={{ color: "#9a9a9a", display: "inline-flex", alignItems: "center" }}>{looksOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
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
              style={{ ...miniBtn, width: "100%", height: 32, marginTop: 10 }}>Re-apply this look to all slides</button>
          </>
        ) : null}
        {lookDrifted && (
          <button type="button" onClick={resetLook}
            title="Revert palette, fonts & frame to this desk's default — keeps your wordmark, logo & caution. Undoable."
            style={resetLookBtn}>Reset to default look</button>
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
                (News Desk: ink). Deck-wide. Clear returns it to the accent. */}
            {/* Frame colour with an accent SYNC link. Linked (frameColor unset) =
                the frame follows the accent live; the link toggle unlinks it to a
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
                style={{ width: 30, height: 30, borderRadius: 6, background: cur.frameColor ? "#26262b" : UI.brand, color: cur.frameColor ? "#cfcfcf" : UI.onBrand, border: "1px solid " + (cur.frameColor ? "#36363c" : UI.brand), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Link2 size={14} /></button>
            </div>
          </div>
        </div>

        </Section>
        {/* ---------- TYPE (fine-tune; the Style preset above sets the fonts) ---- */}
        <Section title="Type" sub="fine-tune">
        <div style={frow}><span style={frowK}>Label</span><FontSelect title="Label font" value={cur.labelFont} options={fontOptions} onChange={(v) => set({ labelFont: v })} /></div>
        <div style={frow}><span style={frowK}>Heading</span><FontSelect title="Heading font" value={cur.headFont} options={fontOptions} onChange={(v) => set({ headFont: v })} /></div>
        <div style={frow}><span style={frowK}>Body</span><FontSelect title="Body font" value={cur.bodyFont} options={fontOptions} onChange={(v) => set({ bodyFont: v })} /></div>
        {/* Upload a custom font — embedded in the deck (persists + exports); shows
            up in all three pickers under "Your fonts". */}
        {onUploadFont && (
          <>
            <button type="button" style={fontUpBtn} disabled={fontBusy} onClick={() => fontRef.current && fontRef.current.click()}>
              {fontBusy ? "Adding…" : "Upload a font"}
            </button>
            <input ref={fontRef} type="file" accept=".ttf,.otf,.woff,.woff2,font/*" style={{ display: "none" }} onChange={pickFont} />
            <div style={fontHint}>TTF · OTF · WOFF · WOFF2 · up to 600 KB. Stored with the deck; stamps into exports.</div>
            {fontErr ? <div style={fontErrBox}>{fontErr}</div> : null}
            {(fonts && fonts.length) ? (
              <div style={fontList}>
                {fonts.map((f) => (
                  <div key={f.id} style={fontRowItem}>
                    <span style={{ ...fontNameItem, fontFamily: fontFamilyValue(f.family) }}>{f.name}</span>
                    <button type="button" style={fontDel} title={"Remove " + f.name} onClick={() => onRemoveFont && onRemoveFont(f.id)}>Remove</button>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
        <div style={lock}>LOATHR marks (wordmark · footer · sign-off) stay Courier — not affected by these.</div>

        </Section>
        {/* ---------- ELEMENTS ---------- */}
        <Section title="Elements">
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

        </Section>
        {/* ---------- BRAND MARKS ---------- */}
        <Section title="Brand marks">
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

        </Section>
        {/* ---------- CLOSING ---------- */}
        <Section title="Closing">
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
        </Section>
        </>
        )}
      </div>
    </div>
  );
}
