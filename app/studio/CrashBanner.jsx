"use client";
import React, { useEffect, useState } from "react";
import { installCrashCapture, readReport, clearReport, formatReport } from "./crashlog";

// The diagnostic banner. On mount it installs the crash capture (see crashlog.js),
// then reads any report the PREVIOUS session left when it died without a clean exit
// (an OOM/hang tab-kill — "This page couldn't load"). If there is one it shows the
// last breadcrumbs + captured console + JS-heap peak, so what ran right before the
// tab died is copyable on the next load. Renders nothing when there's no report.
export default function CrashBanner() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    installCrashCapture();     // writes the prior session's report, starts a fresh capture
    setReport(readReport());
  }, []);

  if (!report) return null;

  const dismiss = () => { clearReport(); setReport(null); };
  const copy = () => { try { navigator.clipboard.writeText(formatReport(report)); } catch (e) { /* ignore */ } };

  const crumbs = report.crumbs || [];
  const logs = report.console || [];
  let prevT = null;

  return (
    <div style={bar}>
      <div style={icon}>!</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={h}>The previous session ended unexpectedly</div>
        <div style={sub}>
          The tab closed without a clean exit — most likely the browser reaping an unresponsive/out-of-memory tab.
          Here&rsquo;s what the app was doing just before. Copy it and send it over.
        </div>
        <div style={grid}>
          <div>
            <div style={lbl}>Timeline (last steps before death)</div>
            <div style={box}>
              {crumbs.length === 0 ? <div style={dim}>no breadcrumbs recorded</div> : crumbs.map((c, i) => {
                const d = prevT == null ? 0 : c.t - prevT; prevT = c.t;
                return (
                  <div key={i} style={step}>
                    <span style={tCol}>{clock(c.t)}</span>
                    <span style={dCol}>+{d}ms</span>
                    <span style={nCol}>{c.name}</span>
                  </div>
                );
              })}
            </div>
            {report.heapPeak ? (
              <div style={meta}>JS heap: {mb(report.heapStart)} → <b style={{ color: "#ffab9d" }}>{mb(report.heapPeak)} peak</b></div>
            ) : null}
          </div>
          <div>
            <div style={lbl}>Console (errors &amp; warnings)</div>
            <div style={box}>
              {logs.length === 0 ? <div style={dim}>none captured</div> : logs.map((e, i) => (
                <div key={i} style={{ ...cline, color: e.level === "warn" ? "#e6cf8a" : "#ff9a8a" }}>
                  {e.level === "warn" ? "⚠ " : "✖ "}{e.msg}
                </div>
              ))}
            </div>
            <div style={row}>
              <button type="button" style={btn} onClick={copy}>Copy all</button>
              <button type="button" style={ghost} onClick={dismiss}>Dismiss</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function clock(t) { try { return new Date(t).toTimeString().slice(0, 8); } catch (e) { return ""; } }
function mb(bytes) { return Math.round((bytes || 0) / 1048576) + " MB"; }

const bar = { position: "fixed", top: 0, left: 0, right: 0, zIndex: 2147483647, background: "#140f10", borderBottom: "1px solid #3a2323", color: "#eaeaea", padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 14, fontFamily: "Helvetica, Arial, sans-serif", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" };
const icon = { flex: "0 0 auto", width: 26, height: 26, borderRadius: 7, background: "#2a1719", border: "1px solid #5a3030", display: "grid", placeItems: "center", color: "#ffab9d", fontWeight: 700, fontSize: 15 };
const h = { fontSize: 14, fontWeight: 700, margin: "2px 0" };
const sub = { fontSize: 12, color: "#a9a9b2", marginBottom: 12, lineHeight: 1.5 };
const grid = { display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14 };
const lbl = { fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8a6f6f", fontWeight: 700, margin: "0 0 6px" };
const box = { background: "#0d0d10", border: "1px solid #23232b", borderRadius: 8, padding: "8px 10px", maxHeight: 190, overflow: "auto" };
const step = { display: "flex", gap: 10, fontSize: 11.5, fontFamily: "'Courier New', monospace", lineHeight: 1.7, whiteSpace: "nowrap" };
const tCol = { color: "#6f6f78", flex: "0 0 62px", textAlign: "right" };
const dCol = { color: "#cbb26a", flex: "0 0 62px", textAlign: "right" };
const nCol = { color: "#d6d6dd", overflow: "hidden", textOverflow: "ellipsis" };
const cline = { fontSize: 11.5, fontFamily: "'Courier New', monospace", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" };
const dim = { fontSize: 11.5, color: "#5a5a63" };
const meta = { fontSize: 11, color: "#9a9aa2", marginTop: 8 };
const row = { display: "flex", gap: 8, marginTop: 12 };
const btn = { height: 32, padding: "0 14px", background: "#fff", color: "#1f1f1f", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" };
const ghost = { height: 32, padding: "0 12px", background: "#1c1c20", color: "#cfcfd4", border: "1px solid #2c2c32", borderRadius: 7, fontSize: 12, cursor: "pointer" };
