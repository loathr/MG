"use client";
import React, { useRef, useState, useEffect } from "react";
import FontSelect from "./FontSelect";
import { uid } from "./model";
import { readFontFile, fontFileError, uploadedFontGroup, registerFont, registerDocFonts } from "./fonts";
import { readImageFile } from "./imageFile";

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
const miniLbl = { fontSize: 9.5, letterSpacing: 0.5, textTransform: "uppercase", color: "#7c7c84", marginBottom: 6 };
const fontUp = { width: "100%", height: 34, marginTop: 8, background: "#201a2e", color: "#cdbcff", border: "1px dashed #4a3a6e", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const fontHint = { fontSize: 10, color: "#6f6f77", marginTop: 6, lineHeight: 1.45 };
const errText = { fontSize: 11, color: "#ffb3a6", marginTop: 6, lineHeight: 1.4 };
const fontItem = { display: "flex", alignItems: "center", gap: 8, background: "#26262b", border: "1px solid #34343c", borderRadius: 6, padding: "5px 6px 5px 9px" };
const xBtn = { background: "none", border: "none", color: "#7a7a82", cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 };
const imgUp = { width: "100%", height: 34, marginTop: 4, background: "#1a1a1e", color: "#cfcfcf", border: "1px dashed #45454c", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const imgThumb = { position: "relative", width: 52, height: 52, borderRadius: 8, overflow: "hidden", border: "1px solid #2c2c32", cursor: "pointer" };
const imgRm = { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#2a1618", color: "#ff9a8a", border: "1.5px solid #131316", fontSize: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };

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
// A corner picker for logo placement — the four corners plus top-center.
export function CornerPicker({ value, onChange }) {
  const dot = (id, title, pos) => (
    <button key={id} type="button" title={title} onClick={() => onChange(id)}
      style={Object.assign({ position: "absolute", width: 16, height: 16, borderRadius: 4, cursor: "pointer",
        background: value === id ? "#6d3bd1" : "#2a2a33", border: "1px solid " + (value === id ? "#8b5cf0" : "#3a3a42") }, pos)} />
  );
  return (
    <div style={{ position: "relative", width: 84, height: 70, borderRadius: 8, border: "1px solid #34343c", background: "#1a1a1e" }}>
      {dot("tl", "top-left", { top: 6, left: 6 })}
      {dot("tc", "top-center", { top: 6, left: "50%", transform: "translateX(-50%)" })}
      {dot("tr", "top-right", { top: 6, right: 6 })}
      {dot("bl", "bottom-left", { bottom: 6, left: 6 })}
      {dot("br", "bottom-right", { bottom: 6, right: 6 })}
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
// `onAddImage(img)` (optional) is called when a brand image is tapped in the editor —
// it drops the image onto the current slide; on the create screen it's omitted and
// the images are just the saved library.
export default function ClientBrandFields({ cb, setCB, fontOptions, onAddImage }) {
  const logoRef = useRef(null);
  const fontRef = useRef(null);
  const imgRef = useRef(null);
  const [fontErr, setFontErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Uploaded brand fonts sit at the top of every picker (Labels/Heading/Body).
  const uplGroup = uploadedFontGroup(cb.fonts);
  const fopts = uplGroup ? [uplGroup].concat(fontOptions || []) : (fontOptions || []);
  // Keep the uploaded fonts registered with the browser so previews + the deck render
  // them (also re-registers after a brand kit is applied).
  useEffect(() => { registerDocFonts(cb.fonts); }, [cb.fonts]);

  // Read a picked image into a data: URL — stored on cb.logo, stamped on the deck's
  // cover + close bookends via effectiveBrand → store.stampLogo.
  const onLogo = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCB({ logo: reader.result });
    reader.readAsDataURL(file);
  };
  // Upload a brand font → validate, embed (data URL), register, add to cb.fonts.
  const onFont = async (file) => {
    if (!file) return;
    const err = fontFileError(file);
    if (err) { setFontErr(err); return; }
    setFontErr(""); setBusy(true);
    try {
      const entry = await readFontFile(file, uid("font"));
      await registerFont(entry);
      setCB({ fonts: (cb.fonts || []).concat(entry) });
    } catch (e) { setFontErr((e && e.message) || "Couldn't read that font."); }
    finally { setBusy(false); }
  };
  const removeFont = (id) => setCB({ fonts: (cb.fonts || []).filter((f) => f.id !== id) });
  // Upload a brand image → downscaled {src,thumb,name}, added to the library.
  const onImage = (file) => {
    if (!file) return;
    readImageFile(file, (img) => { if (img) setCB({ images: (cb.images || []).concat({ src: img.src, thumb: img.thumb, name: img.name }) }); });
  };
  const removeImage = (i) => setCB({ images: (cb.images || []).filter((_, k) => k !== i) });

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
      {cb.logo && (
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginTop: 10 }}>
          <div>
            <div style={miniLbl}>Position</div>
            <CornerPicker value={cb.logoPos || "tr"} onChange={(v) => setCB({ logoPos: v })} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={miniLbl}>Show logo on</div>
            <Pills value={cb.logoScope || "coverclose"} onChange={(v) => setCB({ logoScope: v })}
              options={[["cover", "Cover"], ["coverclose", "Cover + close"], ["every", "Every"]]} />
          </div>
        </div>
      )}
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
        <FontRow label="Labels" value={cb.labelFont} options={fopts} onChange={(v) => setCB({ labelFont: v })} />
        <FontRow label="Heading" value={cb.headFont} options={fopts} onChange={(v) => setCB({ headFont: v })} />
        <FontRow label="Body" value={cb.bodyFont} options={fopts} onChange={(v) => setCB({ bodyFont: v })} />
      </div>
      <button type="button" style={fontUp} disabled={busy} onClick={() => fontRef.current && fontRef.current.click()}>
        {busy ? "Adding…" : "Upload a font…"}
      </button>
      <input ref={fontRef} type="file" accept=".ttf,.otf,.woff,.woff2,font/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; onFont(f); }} />
      <div style={fontHint}>.ttf · .otf · .woff · .woff2 — up to 600 KB. Embedded in the deck so it exports.</div>
      {fontErr ? <div style={errText}>{fontErr}</div> : null}
      {(cb.fonts || []).length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {cb.fonts.map((f) => (
            <div key={f.id} style={fontItem}>
              <span style={{ flex: 1, fontSize: 13, color: "#eaeaea", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'" + f.family + "', sans-serif" }}>{f.name}</span>
              <button type="button" style={xBtn} title="Remove font" onClick={() => removeFont(f.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <label style={{ ...lbl, marginTop: 14 }}>Footer</label>
      <div style={miniLbl}>Show</div>
      <Pills value={(cb.footer && cb.footer.content) || "off"} onChange={(v) => setCB({ footer: Object.assign({}, cb.footer, { content: v }) })}
        options={[["text", "Brand text"], ["logo", "Logo"], ["off", "Off"]]} />
      {(cb.footer && cb.footer.content) === "text" && (
        <>
          <div style={miniLbl}>Footer text</div>
          <input style={inp} value={(cb.footer && cb.footer.text) || ""}
            placeholder={[cb.name, cb.handle].filter(Boolean).join(" · ") || "Your footer line"}
            onChange={(e) => setCB({ footer: Object.assign({}, cb.footer, { text: e.target.value }) })} />
        </>
      )}
      {(cb.footer && cb.footer.content) && cb.footer.content !== "off" && (
        <>
          <div style={miniLbl}>Align</div>
          <Pills value={(cb.footer && cb.footer.align) || "center"} onChange={(v) => setCB({ footer: Object.assign({}, cb.footer, { align: v }) })}
            options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]} />
          <div style={miniLbl}>On slides</div>
          <Pills value={(cb.footer && cb.footer.scope) || "every"} onChange={(v) => setCB({ footer: Object.assign({}, cb.footer, { scope: v }) })}
            options={[["every", "Every"], ["coverclose", "Cover + close"], ["cover", "Cover"]]} />
        </>
      )}

      <label style={{ ...lbl, marginTop: 14, display: "flex", alignItems: "center" }}>
        Page numbers
        <button type="button" title="Show page numbers on content slides" onClick={() => setCB({ pageNumbers: !cb.pageNumbers })}
          style={{ marginLeft: "auto", width: 36, height: 21, borderRadius: 11, border: "none", cursor: "pointer", position: "relative", background: cb.pageNumbers ? "#2f6f52" : "#3a3a42" }}>
          <span style={{ position: "absolute", top: 2, [cb.pageNumbers ? "right" : "left"]: 2, width: 17, height: 17, borderRadius: "50%", background: "#fff" }} />
        </button>
      </label>
      {cb.pageNumbers && (
        <Pills value={cb.pageNumSide === "left" ? "left" : "right"} onChange={(v) => setCB({ pageNumSide: v })}
          options={[["left", "Left"], ["right", "Right"]]} />
      )}

      <label style={{ ...lbl, marginTop: 14, display: "flex", alignItems: "center" }}>
        Closeout slide
        <button type="button" title="Toggle closeout slide" onClick={() => setCB({ closeout: Object.assign({ cta: "Follow for more →" }, cb.closeout, { on: !(cb.closeout && cb.closeout.on) }) })}
          style={{ marginLeft: "auto", width: 36, height: 21, borderRadius: 11, border: "none", cursor: "pointer", position: "relative", background: (cb.closeout && cb.closeout.on) ? "#2f6f52" : "#3a3a42" }}>
          <span style={{ position: "absolute", top: 2, [(cb.closeout && cb.closeout.on) ? "right" : "left"]: 2, width: 17, height: 17, borderRadius: "50%", background: "#fff" }} />
        </button>
      </label>
      <input style={inp} value={(cb.closeout && cb.closeout.cta) || ""} placeholder="Closing call-to-action" onChange={(e) => setCB({ closeout: Object.assign({ on: true }, cb.closeout, { cta: e.target.value }) })} />

      <label style={{ ...lbl, marginTop: 14 }}>Brand images</label>
      <button type="button" style={imgUp} onClick={() => imgRef.current && imgRef.current.click()}>Upload images…</button>
      <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={(e) => { const fs = Array.from(e.target.files || []); e.target.value = ""; fs.forEach(onImage); }} />
      <div style={fontHint}>.jpg · .png · .webp — downscaled on device.{onAddImage ? " Tap one to drop it on the current slide." : " Saved with your brand for reuse."}</div>
      {(cb.images || []).length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {cb.images.map((im, i) => (
            <div key={i} style={imgThumb} title={onAddImage ? "Add to slide" : im.name} onClick={onAddImage ? () => onAddImage(im) : undefined}>
              <img src={im.thumb || im.src} alt={im.name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button type="button" style={imgRm} title="Remove" onClick={(e) => { e.stopPropagation(); removeImage(i); }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
