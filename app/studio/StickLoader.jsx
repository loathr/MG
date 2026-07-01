"use client";
import React from "react";

// A lightweight SVG stick-figure loader for the generation screen. Every limb is a
// group animated purely with CSS @keyframes (GPU-composited, off the React tree) —
// no raster frames, no per-frame re-renders, nothing on the artboard/export. So it
// is crash-safe by the FLAT-LAYERS rule. Two gaits (walk / run); one is picked per
// mount for variety. Honours prefers-reduced-motion (falls back to a still figure).

const CSS = `
@keyframes sl-fwd-walk {0%,100%{transform:rotate(26deg)}50%{transform:rotate(-26deg)}}
@keyframes sl-bwd-walk {0%,100%{transform:rotate(-26deg)}50%{transform:rotate(26deg)}}
@keyframes sl-fwd-run  {0%,100%{transform:rotate(44deg)}50%{transform:rotate(-44deg)}}
@keyframes sl-bwd-run  {0%,100%{transform:rotate(-44deg)}50%{transform:rotate(44deg)}}
@keyframes sl-bob {0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
.sl-fig g { transform-box: fill-box; transform-origin: center top; }
.sl-fig .sl-bob { transform-origin: center; }
.sl-walk .sl-legL{animation:sl-fwd-walk .9s ease-in-out infinite}
.sl-walk .sl-legR{animation:sl-bwd-walk .9s ease-in-out infinite}
.sl-walk .sl-armL{animation:sl-bwd-walk .9s ease-in-out infinite}
.sl-walk .sl-armR{animation:sl-fwd-walk .9s ease-in-out infinite}
.sl-walk .sl-bob{animation:sl-bob .45s ease-in-out infinite}
.sl-run .sl-legL{animation:sl-fwd-run .5s ease-in-out infinite}
.sl-run .sl-legR{animation:sl-bwd-run .5s ease-in-out infinite}
.sl-run .sl-armL{animation:sl-bwd-run .5s ease-in-out infinite}
.sl-run .sl-armR{animation:sl-fwd-run .5s ease-in-out infinite}
.sl-run .sl-bob{animation:sl-bob .25s ease-in-out infinite}
.sl-run .sl-fig{transform:rotate(6deg)}
@keyframes sl-track {from{background-position-x:0}to{background-position-x:-32px}}
.sl-bar{animation:sl-track .8s linear infinite}
@media (prefers-reduced-motion: reduce){
  .sl-fig g, .sl-bar{animation:none !important}
  .sl-run .sl-fig{transform:none}
}
`;

export default function StickLoader({ label }) {
  // Pick a gait after mount (client-only) so SSR output stays deterministic and
  // hydration never mismatches.
  const [gait, setGait] = React.useState("walk");
  React.useEffect(() => { setGait(Math.random() < 0.5 ? "walk" : "run"); }, []);
  const C = "#e6e6ea";
  return (
    <div style={wrap}>
      <style>{CSS}</style>
      <div className={"sl-" + gait} style={{ height: 108, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <svg className="sl-fig" width="86" height="104" viewBox="0 0 86 104" fill="none" stroke={C} strokeWidth="3.4" strokeLinecap="round">
          <g className="sl-bob">
            <circle cx="43" cy="16" r="10" />
            <line x1="43" y1="26" x2="43" y2="60" />
            {/* arms pivot at the shoulder (top of each group) */}
            <g className="sl-armL"><line x1="43" y1="33" x2="30" y2="52" /></g>
            <g className="sl-armR"><line x1="43" y1="33" x2="56" y2="52" /></g>
            {/* legs pivot at the hip */}
            <g className="sl-legL"><line x1="43" y1="60" x2="32" y2="92" /></g>
            <g className="sl-legR"><line x1="43" y1="60" x2="54" y2="92" /></g>
          </g>
        </svg>
      </div>
      <div style={{ width: 150, height: 2, background: "#2a2a31", borderRadius: 2, margin: "10px auto 0" }} />
      {label ? <div style={lab}>{label}</div> : null}
      <div className="sl-bar" style={bar} />
    </div>
  );
}

const wrap = { display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0 2px" };
const lab = { fontSize: 13, color: "#cdbcff", letterSpacing: 0.2, marginTop: 12 };
const bar = {
  width: 220, height: 5, borderRadius: 3, marginTop: 10,
  background: "repeating-linear-gradient(90deg,#6d3bd1 0 16px,#8b5cf6 16px 32px)",
  backgroundSize: "32px 100%", opacity: 0.9,
};
