"use client";
import React from "react";

// A last-resort error boundary around the whole Studio. A render/runtime crash
// otherwise blanks the page (a white screen the user reads as "the tool crashed")
// with the actual error only in the console. This catches it and shows the
// message + stack on-screen — readable and screenshot-able — plus a Reload. It is
// a DIAGNOSTIC surface first: keep the raw error visible so a deploy-only crash we
// can't reproduce in the sandbox can still be reported back verbatim.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    try { console.error("[Studio crash]", error, info); } catch (e) { /* ignore */ }
  }
  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;
    const stack = (error && error.stack) || String(error);
    const comp = (info && info.componentStack) || "";
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={h}>Something in the editor crashed</div>
          <div style={sub}>
            This screen is a diagnostic — copy or screenshot the message below and send it
            over, and it can be fixed directly.
          </div>
          <div style={label}>Error</div>
          <pre style={pre}>{String((error && error.message) || error)}</pre>
          <div style={label}>Stack</div>
          <pre style={preSmall}>{stack}</pre>
          {comp ? (<><div style={label}>Component</div><pre style={preSmall}>{comp}</pre></>) : null}
          <div style={row}>
            <button type="button" style={btn} onClick={() => { try { window.location.reload(); } catch (e) {} }}>Reload</button>
            <button type="button" style={btnGhost}
              onClick={() => { try { navigator.clipboard.writeText(String((error && error.message) || error) + "\n\n" + stack + "\n\n" + comp); } catch (e) {} }}>
              Copy details
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const wrap = {
  position: "fixed", inset: 0, display: "grid", placeItems: "center", padding: 24, overflow: "auto",
  background: "radial-gradient(1100px 600px at 50% -10%, #140f0f 0%, #080707 55%, #000 100%)",
  fontFamily: "Helvetica, Arial, sans-serif", color: "#eaeaea",
};
const card = { width: "100%", maxWidth: 680, background: "#0d0d10", border: "1px solid #3a2323", borderRadius: 14, padding: "26px 28px" };
const h = { fontSize: 17, fontWeight: 700, marginBottom: 6 };
const sub = { fontSize: 12.5, color: "#a9a9b2", lineHeight: 1.5, marginBottom: 18 };
const label = { fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8a6f6f", fontWeight: 700, margin: "14px 0 6px" };
const pre = { whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13, color: "#ff9a8a", background: "#181113", border: "1px solid #3a2323", borderRadius: 8, padding: "10px 12px", margin: 0 };
const preSmall = { whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 11.5, lineHeight: 1.5, color: "#c9c9d2", background: "#101014", border: "1px solid #23232b", borderRadius: 8, padding: "10px 12px", margin: 0, maxHeight: 220, overflow: "auto" };
const row = { display: "flex", gap: 10, marginTop: 20 };
const btn = { height: 40, padding: "0 18px", background: "#fff", color: "#1f1f1f", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost = { height: 40, padding: "0 16px", background: "#1c1c20", color: "#cfcfd4", border: "1px solid #2c2c32", borderRadius: 9, fontSize: 13, cursor: "pointer" };
