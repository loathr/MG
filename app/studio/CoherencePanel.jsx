"use client";
import React from "react";
import { ArrowRight } from "lucide-react";

// Coherence results (structure sibling of the Fact-check panel). Presentational:
// Studio runs checkCoherence and passes {loading, error, result} in. Shows the
// coherence score, the detected spine, and a per-slide issue list (problems first,
// strengths last); clicking an issue jumps to its slide.

const wrap = {
  width: 300, flexShrink: 0, display: "flex", flexDirection: "column",
  background: "#1b1b1f", borderLeft: "1px solid #2a2a2f", minHeight: 0,
  fontFamily: "Helvetica, Arial, sans-serif",
};
const head = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 8px", flexShrink: 0 };
const xBtn = { width: 24, height: 24, lineHeight: "22px", textAlign: "center", background: "transparent", color: "#999", border: "none", cursor: "pointer", fontSize: 18, borderRadius: 5 };
const body = { padding: "0 12px 14px", overflowY: "auto", minHeight: 0 };

// problems first (by severity), strengths last.
const KIND = {
  spine: { rank: 0, color: "#ff6b6b", label: "Off the spine" },
  repeat: { rank: 1, color: "#ff6b6b", label: "Repeated point" },
  callback: { rank: 2, color: "#ffa94d", label: "Broken callback" },
  transition: { rank: 3, color: "#ffa94d", label: "Weak transition" },
  arc: { rank: 4, color: "#c9a227", label: "Flat arc" },
  strength: { rank: 9, color: "#2ec27e", label: "Works" },
};
function kinfo(k) { return KIND[k] || KIND.spine; }

function scoreColor(s) {
  if (s == null) return "#9a9a9a";
  if (s >= 8) return "#2ec27e";
  if (s >= 5) return "#ffa94d";
  return "#ff6b6b";
}

export default function CoherencePanel({ loading, error, result, phase, onJump, onClose, onCancel, onRetry }) {
  const issues = (result && result.issues) ? result.issues.slice().sort((a, b) => kinfo(a.kind).rank - kinfo(b.kind).rank) : [];
  const problems = issues.filter((c) => c.kind !== "strength").length;
  return (
    <div style={wrap}>
      <div style={head}>
        <strong style={{ fontSize: 12, letterSpacing: 0.5 }}>Flow &amp; structure</strong>
        <button style={xBtn} onClick={onClose} title="Close">×</button>
      </div>

      <div style={body}>
        {loading && (
          <div style={{ color: "#bdbdbd", fontSize: 13, lineHeight: 1.6, padding: "10px 2px" }}>
            Reading the deck as one piece…
            <div style={{ color: "#7a7a7a", fontSize: 12, marginTop: 6 }}>Judging the spine, arc, and flow — a few seconds.</div>
            <button onClick={onCancel} style={{ marginTop: 12, height: 30, padding: "0 12px", background: "#26262b", color: "#cfcfcf", border: "1px solid #36363c", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Cancel</button>
          </div>
        )}

        {error && (
          <div>
            <div style={{ padding: "8px 10px", background: "#3a1f22", color: "#ff9a9a", fontSize: 12, borderRadius: 6, lineHeight: 1.4 }}>{error}</div>
            <button onClick={onRetry} style={{ marginTop: 10, height: 32, padding: "0 12px", background: "#26262b", color: "#e8e8e8", border: "1px solid #36363c", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Try again</button>
          </div>
        )}

        {result && !loading && (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: scoreColor(result.score), lineHeight: 1 }}>
                {result.score == null ? "—" : result.score}
              </span>
              <span style={{ fontSize: 14, color: "#8a8a8a" }}>/ 10 coherence</span>
            </div>
            {result.spine ? (
              <div style={{ margin: "0 0 10px", background: "#12251b", border: "1px solid #2a5a40", borderRadius: 8, padding: "9px 11px" }}>
                <div style={{ fontSize: 9.5, letterSpacing: 0.8, textTransform: "uppercase", color: "#8fd3a8", fontWeight: 700, marginBottom: 3 }}>Detected spine</div>
                <div style={{ fontSize: 12, color: "#bfe9cf", lineHeight: 1.45 }}>{result.spine}</div>
              </div>
            ) : null}
            {result.summary ? <p style={{ fontSize: 12.5, color: "#cfcfcf", lineHeight: 1.5, margin: "0 0 6px" }}>{result.summary}</p> : null}
            <div style={{ fontSize: 11, color: problems ? "#ffb4a0" : "#8a8a8a", marginBottom: 12 }}>
              {problems ? problems + " thing" + (problems === 1 ? "" : "s") + " weaken the arc" : "The arc holds together"}
            </div>

            {issues.length === 0 && (
              <div style={{ color: "#7a7a7a", fontSize: 12 }}>No structural issues flagged.</div>
            )}

            {issues.map((c, i) => {
              const ki = kinfo(c.kind);
              return (
                <div key={i} style={{ borderTop: "1px solid #2a2a2f", padding: "10px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: ki.color }}>{ki.label}</span>
                    {c.slide != null && (
                      <button onClick={() => onJump(c.slide)} title="Go to this slide"
                        style={{ marginLeft: "auto", height: 20, padding: "0 7px", background: "#26262b", color: "#bdbdbd", border: "1px solid #36363c", borderRadius: 4, fontSize: 10.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        Slide {c.slide + 1} <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#eaeaea", lineHeight: 1.4 }}>{c.note}</div>
                </div>
              );
            })}

            <button onClick={onRetry} style={{ marginTop: 12, height: 30, padding: "0 12px", background: "#26262b", color: "#cfcfcf", border: "1px solid #36363c", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Re-check</button>
          </>
        )}
      </div>

      <p style={{ fontSize: 10.5, color: "#6f6f78", margin: 0, padding: "0 12px 12px", lineHeight: 1.5, flexShrink: 0 }}>
        A structure pass — it reads the deck as one narrative and flags where the spine, arc, or flow breaks. A guide, not a grade.
      </p>
    </div>
  );
}
