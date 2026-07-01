"use client";
import React from "react";
import { UI } from "./theme";
import { ChevronDown, Check } from "lucide-react";

// A compact font picker that previews each option IN its own face — a native
// <select> can't render options in their font, which matters when choosing
// display faces. `options` is the grouped FONT_OPTIONS shape from styles.js:
// [{ group, fonts: [{ label, value }] }]. Closes on outside click / Escape.

const btn = { width: "100%", height: 32, background: "#26262b", border: "1px solid #36363c", borderRadius: 6, color: "#e8e8e8", fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 9px", cursor: "pointer" };
const pop = { position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 60, background: "#202026", border: "1px solid #3a3a44", borderRadius: 8, padding: 5, maxHeight: 280, overflowY: "auto", boxShadow: "0 18px 50px rgba(0,0,0,0.6)" };
const grp = { fontSize: 9.5, fontWeight: 700, letterSpacing: 1, color: "#6f6f78", padding: "8px 8px 4px", fontFamily: "Helvetica, Arial, sans-serif" };
const opt = { fontSize: 15, color: "#e8e8e8", padding: "6px 9px", borderRadius: 6, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" };

export default function FontSelect({ value, options, onChange, title }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const flat = options.flatMap((g) => g.fonts);
  const cur = flat.find((f) => f.value === value);
  return (
    <div ref={ref} style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <button type="button" title={title} onClick={() => setOpen((o) => !o)} style={btn}>
        <span style={{ fontFamily: value, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cur ? cur.label : "Custom"}</span>
        <ChevronDown size={14} style={{ color: "#888", marginLeft: 6, flexShrink: 0 }} />
      </button>
      {open ? (
        <div style={pop}>
          {options.map((g) => (
            <div key={g.group}>
              <div style={grp}>{g.group}</div>
              {g.fonts.map((f) => {
                const on = f.value === value;
                return (
                  <div key={f.value} onClick={() => { onChange(f.value); setOpen(false); }}
                    style={Object.assign({}, opt, { fontFamily: f.value, background: on ? (UI.brand + "22") : "transparent", color: on ? "#ffffff" : "#e8e8e8" })}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</span>
                    {on ? <Check size={14} style={{ color: UI.brand, flexShrink: 0 }} /> : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
