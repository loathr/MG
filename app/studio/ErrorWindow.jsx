"use client";
import React, { useEffect, useState } from "react";
import { fromErrorEvent, fromRejection, recordKey, formatForCopy, kindLabel } from "./errtrap";

// The GLOBAL error window. ErrorBoundary catches React render crashes; this catches
// the two things it can't — a module-load / import-time error (thrown before React
// mounts, otherwise a blank white screen) and an unhandled promise rejection. The
// early inline trap in app/layout.tsx installs window listeners BEFORE any app
// module evaluates and buffers what it catches into `window.__STUDIO_ERRORS__`; this
// component drains that buffer on mount, keeps listening live, and renders the panel.
// If the whole bundle failed to load, React never mounts this — the inline trap draws
// its own bare-DOM fallback instead (and this component clears it once it does mount).
export default function ErrorWindow() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const seen = new Set();
    const add = (rec) => {
      if (!rec) return;
      const k = recordKey(rec);
      if (seen.has(k)) return;
      seen.add(k);
      setRecords((prev) => prev.concat(rec));
    };
    const drain = () => {
      const buf = (typeof window !== "undefined" && window.__STUDIO_ERRORS__) || [];
      for (const rec of buf) add(rec);
    };

    // We're up: tell the inline trap to stop drawing its bare-DOM fallback, and
    // remove one already on screen so we don't stack two panels.
    if (typeof window !== "undefined") window.__STUDIO_ERR_MOUNTED__ = true;
    const fb = typeof document !== "undefined" && document.getElementById("studio-errtrap-fallback");
    if (fb && fb.parentNode) fb.parentNode.removeChild(fb);

    drain();                                   // anything buffered before we mounted
    const onBuf = () => drain();               // inline trap dispatches this on each catch
    const onErr = (e) => add(fromErrorEvent(e));
    const onRej = (e) => add(fromRejection(e));
    window.addEventListener("studio-error", onBuf);
    window.addEventListener("error", onErr, true); // capture → also sees resource-load errors
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("studio-error", onBuf);
      window.removeEventListener("error", onErr, true);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  if (!records.length) return null;

  const copy = () => {
    try { navigator.clipboard.writeText(formatForCopy(records)); } catch (e) { /* ignore */ }
  };
  const reload = () => { try { window.location.reload(); } catch (e) { /* ignore */ } };

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={h}>The editor failed to load</div>
        <div style={sub}>
          This is a diagnostic screen. It caught an error that happened <em>outside</em> React&rsquo;s
          render — a failed import, a script that couldn&rsquo;t load, or an unhandled async error — which
          the normal crash screen can&rsquo;t see. Click <b>Copy all</b> and send it over, and it can be
          fixed at the exact line below.
        </div>
        <div style={count}>{records.length} error{records.length === 1 ? "" : "s"} captured · earliest first</div>
        {records.map((r, i) => (
          <div key={i} style={item}>
            <div style={badgeRow}>
              <span style={{ ...badge, ...badgeStyle(r.kind) }}>{kindLabel(r.kind)}</span>
              {r.source ? <span style={src}>{r.source}</span> : null}
            </div>
            <div style={label}>Error</div>
            <pre style={pre}>{r.message}</pre>
            {r.stack ? (<><div style={label}>Stack</div><pre style={preSmall}>{r.stack}</pre></>) : null}
          </div>
        ))}
        <div style={row}>
          <button type="button" style={btn} onClick={reload}>Reload</button>
          <button type="button" style={btnGhost} onClick={copy}>Copy all</button>
        </div>
      </div>
    </div>
  );
}

function badgeStyle(kind) {
  return kind === "load" ? bLoad : kind === "rejection" ? bRej : bErr;
}

const wrap = {
  position: "fixed", inset: 0, zIndex: 2147483647, display: "grid", placeItems: "center", padding: 24, overflow: "auto",
  background: "radial-gradient(1100px 600px at 50% -10%, #140f0f 0%, #080707 55%, #000 100%)",
  fontFamily: "Helvetica, Arial, sans-serif", color: "#eaeaea",
};
const card = { width: "100%", maxWidth: 680, background: "#0d0d10", border: "1px solid #3a2323", borderRadius: 14, padding: "26px 28px", boxSizing: "border-box" };
const h = { fontSize: 17, fontWeight: 700, marginBottom: 6 };
const sub = { fontSize: 12.5, color: "#a9a9b2", lineHeight: 1.5, marginBottom: 18 };
const count = { fontSize: 11, color: "#8a6f6f", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 14 };
const item = { border: "1px solid #23232b", borderRadius: 10, padding: "14px 15px", marginBottom: 12, background: "#0b0b0e" };
const badgeRow = { display: "flex", alignItems: "center", gap: 8, marginBottom: 9, flexWrap: "wrap" };
const badge = { fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700, padding: "3px 8px", borderRadius: 20 };
const bErr = { background: "#2a1719", color: "#ffab9d", border: "1px solid #5a3030" };
const bRej = { background: "#2a2410", color: "#e6cf8a", border: "1px solid #574a1c" };
const bLoad = { background: "#181820", color: "#9db4ff", border: "1px solid #34506f" };
const src = { fontSize: 11, color: "#7d7d85", fontFamily: "'Courier New', monospace", wordBreak: "break-all" };
const label = { fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8a6f6f", fontWeight: 700, margin: "12px 0 6px" };
const pre = { whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13, color: "#ff9a8a", background: "#181113", border: "1px solid #3a2323", borderRadius: 8, padding: "10px 12px", margin: 0 };
const preSmall = { whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 11.5, lineHeight: 1.5, color: "#c9c9d2", background: "#101014", border: "1px solid #23232b", borderRadius: 8, padding: "10px 12px", margin: 0, maxHeight: 180, overflow: "auto", fontFamily: "'Courier New', monospace" };
const row = { display: "flex", gap: 10, marginTop: 20 };
const btn = { height: 40, padding: "0 18px", background: "#fff", color: "#1f1f1f", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost = { height: 40, padding: "0 16px", background: "#1c1c20", color: "#cfcfd4", border: "1px solid #2c2c32", borderRadius: 9, fontSize: 13, cursor: "pointer" };
