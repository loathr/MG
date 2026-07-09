"use client";
import React, { useRef } from "react";
import FontSelect from "./FontSelect";

// The client-brand (self-branding) field block — name · handle · up to three
// accents · label/heading/body fonts · footer placement · closeout slide. Shared by
// the editor Brand panel (BrandPanel, "Client mode") AND the create screen's guest /
// client-mode branding accordion (CreateScreen), so the two can't drift. Pure-ish:
// reads `cb` (a clientBrand shape) and calls `setCB(patch)` to merge changes.

const lbl = { fontSize: 11, color: "#9a9a9a", marginBottom: 6, display: "block" };
const inp = { width: "100%", height: 34, background: "#26262b", color: "#fff", border: "1px solid #36363c", borderRadius: 6, fontSize: 13, padding: "0 10px", boxSizing: "border-box" };
const addAccent = { height: 28, padding: "0 11px", background: "#26262b", color: "#9a9aa2", border: "1px dashed #3a3a42", borderRadius: 7, fontSize: 11.5, cursor: "pointer" };
const logoBox = { width: 48, height: 48, flexShrink: 0, borderRadius: 9, border: "1.5px dashed #45454c", background: "#1a1a1e", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", padding: 0 };
const logoClear = { background: "none", border: "none", color: "#8a8a92", cursor: "pointer", fontSize: 11, padding: 0, textDecoration: "underline", textUnderlineOffset: 2 };

// One accent colour swatch (native colour input), optionally clearable.
export function Swatch({ label, value, onChange, clearable, onClear }) {
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
export function Pills({ value, onChange, options }) {
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
export function FontRow({ label, value, options, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "#8a8a92", width: 54, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0 }}><FontSelect title={label + " font"} value={value} options={options} onChange={onChange} /></div>
    </div>
  );
}

// The full client-brand field block (no kits row — the Brand panel adds that above).
export default function ClientBrandFields({ cb, setCB, fontOptions }) {
  const logoRef = useRef(null);
  // Read a picked image into a data: URL — stored on cb.logo, stamped on the deck's
  // cover + close bookends via effectiveBrand → store.stampLogo.
  const onLogo = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCB({ logo: reader.result });
    reader.readAsDataURL(file);
  };
  return (
    <>
      <label style={lbl}>Logo</label>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 4 }}>
        <button type="button" style={logoBox} title={cb.logo ? "Replace logo" : "Upload a logo"} onClick={() => logoRef.current && logoRef.current.click()}>
          {cb.logo ? <img src={cb.logo} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: 20, color: "#6f6f77", lineHeight: 1 }}>+</span>}
        </button>
        <div style={{ fontSize: 11, color: "#8a8a92", lineHeight: 1.4 }}>
          {cb.logo
            ? <button type="button" style={logoClear} onClick={() => setCB({ logo: null })}>Remove logo</button>
            : <>PNG or SVG.<br />Shown on the cover &amp; closing slides.</>}
        </div>
        <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; onLogo(f); }} />
      </div>
      <label style={{ ...lbl, marginTop: 12 }}>Brand name</label>
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
    </>
  );
}
