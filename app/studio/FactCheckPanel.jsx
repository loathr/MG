"use client";
import React from "react";
import { ArrowRight, Check, Wand2 } from "lucide-react";
import { correctionReady } from "./verify";
import { correctionSite } from "./model";

// Fact-check results (rank 2). Presentational: Studio runs verifyDeck and passes
// the {loading, error, result} state in. Shows an overall score, a summary, and
// a per-claim list sorted problems-first; clicking a claim jumps to its slide.
// A claim the verifier returned a sourced correction for — and whose `wrong`
// phrase is an exact substring of the deck — gets a one-tap Apply (before→after
// diff); "Apply all verified" clears the safe fixes at once.

const wrap = {
  width: 300, flexShrink: 0, display: "flex", flexDirection: "column",
  background: "#1b1b1f", borderLeft: "1px solid #2a2a2f", minHeight: 0,
  fontFamily: "Helvetica, Arial, sans-serif",
};
const head = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 8px", flexShrink: 0 };
const xBtn = { width: 24, height: 24, lineHeight: "22px", textAlign: "center", background: "transparent", color: "#999", border: "none", cursor: "pointer", fontSize: 18, borderRadius: 5 };
const body = { padding: "0 12px 14px", overflowY: "auto", minHeight: 0 };
const applyAllBtn = { width: "100%", height: 32, marginBottom: 12, background: "#173225", border: "1px solid #2a5a40", color: "#8fd3a8", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 };
const applyBtn = { marginTop: 8, height: 28, padding: "0 12px", background: "#22303a", border: "1px solid #35586a", color: "#9fd0ea", borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 };
const fixedTag = { marginTop: 8, fontSize: 11, color: "#8fd3a8", display: "inline-flex", alignItems: "center", gap: 5 };
const cantApply = { marginTop: 7, fontSize: 10.5, color: "#8a7f5f", fontStyle: "italic" };
const diffWrong = { color: "#ff8a8a", textDecoration: "line-through", textDecorationColor: "#7a3a3a" };
const diffRight = { color: "#8fd3a8", fontWeight: 700, background: "#13251b", borderRadius: 3, padding: "0 4px" };

// supported < unsupported/misleading < unverifiable for display; but we sort
// PROBLEMS first so the user sees what's wrong before what's confirmed.
const VERDICT = {
  unsupported: { rank: 0, color: "#ff6b6b", label: "Unsupported" },
  misleading: { rank: 1, color: "#ffa94d", label: "Misleading" },
  unverifiable: { rank: 2, color: "#c9a227", label: "Unverifiable" },
  supported: { rank: 3, color: "#2ec27e", label: "Supported" },
};
function vinfo(v) { return VERDICT[v] || VERDICT.unverifiable; }

function scoreColor(s) {
  if (s == null) return "#9a9a9a";
  if (s >= 8) return "#2ec27e";
  if (s >= 5) return "#ffa94d";
  return "#ff6b6b";
}

function isUrl(s) { return /^https?:\/\//i.test(s || ""); }

export default function FactCheckPanel({ loading, error, result, phase, doc, onJump, onClose, onCancel, onRetry, onApply, onApplyAll }) {
  const claims = (result && result.claims) ? result.claims.slice().sort((a, b) => vinfo(a.verdict).rank - vinfo(b.verdict).rank) : [];
  const problems = claims.filter((c) => c.verdict === "unsupported" || c.verdict === "misleading").length;
  // A correction can be applied when the verifier returned a sourced fix AND its
  // `wrong` phrase is an exact substring of the deck (so the patch is safe).
  const canApply = (c) => !c.applied && correctionReady(c) && correctionSite(doc, c.slide, c.wrong);
  const ready = claims.filter(canApply);
  return (
    <div style={wrap}>
      <div style={head}>
        <strong style={{ fontSize: 12, letterSpacing: 0.5 }}>Fact check</strong>
        <button style={xBtn} onClick={onClose} title="Close">×</button>
      </div>

      <div style={body}>
        {loading && (
          <div style={{ color: "#bdbdbd", fontSize: 13, lineHeight: 1.6, padding: "10px 2px" }}>
            {phase === "writing" ? "Weighing the evidence…" : "Checking every claim against the web…"}
            <div style={{ color: "#7a7a7a", fontSize: 12, marginTop: 6 }}>This runs a live search pass — about 30–60 seconds.</div>
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
              <span style={{ fontSize: 14, color: "#8a8a8a" }}>/ 10 accuracy</span>
            </div>
            {result.summary ? <p style={{ fontSize: 12.5, color: "#cfcfcf", lineHeight: 1.5, margin: "0 0 6px" }}>{result.summary}</p> : null}
            <div style={{ fontSize: 11, color: problems ? "#ffb4a0" : "#8a8a8a", marginBottom: 12 }}>
              {problems ? problems + " claim" + (problems === 1 ? "" : "s") + " need attention" : "No problems flagged"}
            </div>

            {ready.length > 0 && (
              <button onClick={() => onApplyAll && onApplyAll(ready)} style={applyAllBtn}
                title="Apply every verified correction (each is undoable)">
                <Check size={13} /> Apply all verified ({ready.length})
              </button>
            )}

            {claims.length === 0 && (
              <div style={{ color: "#7a7a7a", fontSize: 12 }}>No checkable claims were flagged.</div>
            )}

            {claims.map((c, i) => {
              const vi = vinfo(c.verdict);
              return (
                <div key={i} style={{ borderTop: "1px solid #2a2a2f", padding: "10px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: vi.color }}>{vi.label}</span>
                    {c.slide != null && (
                      <button onClick={() => onJump(c.slide)} title="Go to this slide"
                        style={{ marginLeft: "auto", height: 20, padding: "0 7px", background: "#26262b", color: "#bdbdbd", border: "1px solid #36363c", borderRadius: 4, fontSize: 10.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        Slide {c.slide + 1} <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "#eaeaea", lineHeight: 1.35 }}>{c.claim}</div>
                  {/* Before→after diff when the verifier returned a fix for this claim. */}
                  {c.wrong && c.correction ? (
                    <div style={{ fontSize: 13, marginTop: 5, lineHeight: 1.4 }}>
                      <span style={diffWrong}>{c.wrong}</span>
                      <ArrowRight size={11} style={{ margin: "0 4px", color: "#6a6a72", verticalAlign: "middle" }} />
                      <span style={diffRight}>{c.correction}</span>
                    </div>
                  ) : null}
                  {c.note ? <div style={{ fontSize: 11.5, color: "#9a9a9a", lineHeight: 1.45, marginTop: 3 }}>{c.note}</div> : null}
                  {c.source ? (
                    isUrl(c.source)
                      ? <a href={c.source} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#5aa6ff", textDecoration: "none", marginTop: 3, display: "inline-block", wordBreak: "break-all" }}>{c.source}</a>
                      : <div style={{ fontSize: 11, color: "#7f7f87", marginTop: 3 }}>{c.source}</div>
                  ) : null}
                  {c.applied ? (
                    <div style={fixedTag}><Check size={12} /> Fixed · re-check to confirm the new score</div>
                  ) : canApply(c) ? (
                    <button onClick={() => onApply && onApply(c)} style={applyBtn} title="Replace the wrong text in the deck (undoable)">
                      <Wand2 size={12} /> Apply fix
                    </button>
                  ) : (c.wrong && c.correction) ? (
                    <div style={cantApply}>Can’t auto-apply — the exact phrase isn’t in the deck; fix by hand</div>
                  ) : null}
                </div>
              );
            })}

            <button onClick={onRetry} style={{ marginTop: 12, height: 30, padding: "0 12px", background: "#26262b", color: "#cfcfcf", border: "1px solid #36363c", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Re-check</button>
          </>
        )}
      </div>

      <p style={{ fontSize: 10.5, color: "#6f6f78", margin: 0, padding: "0 12px 12px", lineHeight: 1.5, flexShrink: 0 }}>
        A second-opinion pass — it searches the web to check the deck&apos;s facts. Use it as a guide, not gospel.
      </p>
    </div>
  );
}
