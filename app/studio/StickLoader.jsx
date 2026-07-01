"use client";
import React from "react";

// A lightweight SVG stick-figure loader for the generation screen. Every limb is a
// group animated purely with CSS @keyframes (GPU-composited, off the React tree) —
// no raster frames, no per-frame re-renders, nothing on the artboard/export. So it
// is crash-safe by the FLAT-LAYERS rule. The figure does an odd little WORKING task
// (paint / type / hammer / dig / sweep / dance) — one picked at random per mount for
// variety. Tools ride inside the moving arm group so they track the hand. Honours
// prefers-reduced-motion (falls back to a still figure).

const TASKS = ["painter", "typist", "builder", "digger", "sweeper", "dancer"];

const CSS = `
.sl-fig g { transform-box: fill-box; }
.sl-fig .sl-arm, .sl-fig .sl-leg { transform-origin: center top; }
.sl-fig .sl-bobg { transform-origin: center; }
.sl-fig .sl-body { transform-origin: center bottom; }
@keyframes sl-bob {0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
/* Painter — brush strokes on an easel */
@keyframes sl-paint {0%,100%{transform:rotate(-8deg)}50%{transform:rotate(-40deg)}}
.sl-painter .sl-armR{animation:sl-paint 1.1s ease-in-out infinite}
.sl-painter .sl-bobg{animation:sl-bob .55s ease-in-out infinite}
/* Typist — hands tap a laptop */
@keyframes sl-typeL {0%,100%{transform:rotate(0)}50%{transform:rotate(-9deg)}}
@keyframes sl-typeR {0%,100%{transform:rotate(-9deg)}50%{transform:rotate(0)}}
.sl-typist .sl-armL{animation:sl-typeL .28s ease-in-out infinite}
.sl-typist .sl-armR{animation:sl-typeR .28s ease-in-out infinite}
.sl-typist .sl-bobg{animation:sl-bob .56s ease-in-out infinite}
/* Builder — hammer swings down, spark on impact */
@keyframes sl-hammer {0%,100%{transform:rotate(-58deg)}55%{transform:rotate(18deg)}70%{transform:rotate(10deg)}}
@keyframes sl-spark {0%,60%{opacity:0}66%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.6)}}
.sl-builder .sl-armR{animation:sl-hammer .6s ease-in-out infinite}
.sl-builder .sl-spark{transform-origin:center;opacity:0;animation:sl-spark .6s ease-in-out infinite}
.sl-builder .sl-bobg{animation:sl-bob .6s ease-in-out infinite}
/* Digger — shovel dips + lifts, body bobs with the dig */
@keyframes sl-dig {0%,100%{transform:rotate(6deg)}45%{transform:rotate(40deg)}70%{transform:rotate(-14deg)}}
@keyframes sl-digbob {0%,100%{transform:translateY(0) rotate(0)}45%{transform:translateY(4px) rotate(7deg)}}
.sl-digger .sl-armL,.sl-digger .sl-armR{animation:sl-dig 1.2s ease-in-out infinite}
.sl-digger .sl-body{animation:sl-digbob 1.2s ease-in-out infinite}
/* Sweeper — broom side to side, body leans into each pass */
@keyframes sl-sweep {0%,100%{transform:rotate(24deg)}50%{transform:rotate(-6deg)}}
@keyframes sl-lean {0%,100%{transform:rotate(4deg)}50%{transform:rotate(-2deg)}}
.sl-sweeper .sl-armL,.sl-sweeper .sl-armR{animation:sl-sweep 1.4s ease-in-out infinite}
.sl-sweeper .sl-body{animation:sl-lean 1.4s ease-in-out infinite}
/* Dancer — arms wave overhead, body sways, feet kick */
@keyframes sl-sway {0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
@keyframes sl-waveL {0%,100%{transform:rotate(-18deg)}50%{transform:rotate(16deg)}}
@keyframes sl-waveR {0%,100%{transform:rotate(18deg)}50%{transform:rotate(-16deg)}}
@keyframes sl-kickL {0%,100%{transform:rotate(10deg)}50%{transform:rotate(-8deg)}}
@keyframes sl-kickR {0%,100%{transform:rotate(-10deg)}50%{transform:rotate(8deg)}}
.sl-dancer .sl-body{animation:sl-sway 1s ease-in-out infinite}
.sl-dancer .sl-armL{animation:sl-waveL .5s ease-in-out infinite}
.sl-dancer .sl-armR{animation:sl-waveR .5s ease-in-out infinite}
.sl-dancer .sl-legL{animation:sl-kickL 1s ease-in-out infinite}
.sl-dancer .sl-legR{animation:sl-kickR 1s ease-in-out infinite}
.sl-dancer .sl-bobg{animation:sl-bob .5s ease-in-out infinite}
@keyframes sl-track {from{background-position-x:0}to{background-position-x:-32px}}
.sl-bar{animation:sl-track .8s linear infinite}
@media (prefers-reduced-motion: reduce){
  .sl-fig g, .sl-bar{animation:none !important; transform:none !important}
}
`;

const C = "#e6e6ea";   // figure stroke
const A = "#8b5cf6";    // tool accent
const G = "#4a4a55";    // prop guide
const Y = "#ffd34e";    // spark

// Each task is a self-contained SVG on a common 120×112 viewBox. Static props are
// drawn first; the moving parts (arms/legs, with any tool nested in the arm so it
// tracks the hand) live inside .sl-body → .sl-bobg groups the CSS drives.
function Figure({ task }) {
  const svg = (children) => (
    <svg className="sl-fig" width="120" height="108" viewBox="0 0 120 112" fill="none"
      stroke={C} strokeWidth="3.4" strokeLinecap="round">{children}</svg>
  );
  if (task === "painter") return svg(<>
    <rect x="86" y="20" width="26" height="60" rx="2" stroke={G} />
    <line x1="99" y1="80" x2="90" y2="100" stroke={G} /><line x1="99" y1="80" x2="108" y2="100" stroke={G} />
    <g className="sl-body"><g className="sl-bobg">
      <circle cx="46" cy="18" r="10" /><line x1="46" y1="28" x2="46" y2="62" />
      <g className="sl-arm sl-armL"><line x1="46" y1="35" x2="33" y2="54" /></g>
      <g className="sl-arm sl-armR"><line x1="46" y1="35" x2="72" y2="44" /><line x1="72" y1="44" x2="86" y2="44" stroke={A} /></g>
      <g className="sl-leg sl-legL"><line x1="46" y1="62" x2="36" y2="96" /></g>
      <g className="sl-leg sl-legR"><line x1="46" y1="62" x2="56" y2="96" /></g>
    </g></g></>);
  if (task === "typist") return svg(<>
    <line x1="30" y1="88" x2="86" y2="88" stroke={G} />
    <rect x="52" y="74" width="26" height="12" rx="1.5" stroke={A} />
    <g className="sl-body"><g className="sl-bobg">
      <circle cx="42" cy="24" r="10" /><line x1="42" y1="34" x2="42" y2="66" />
      <g className="sl-arm sl-armL"><line x1="42" y1="42" x2="56" y2="70" /></g>
      <g className="sl-arm sl-armR"><line x1="42" y1="42" x2="64" y2="70" /></g>
      <g className="sl-leg sl-legL"><line x1="42" y1="66" x2="34" y2="94" /></g>
      <g className="sl-leg sl-legR"><line x1="42" y1="66" x2="52" y2="94" /></g>
    </g></g></>);
  if (task === "builder") return svg(<>
    <rect x="66" y="74" width="20" height="14" rx="2" stroke={G} />
    <g className="sl-spark" stroke={Y}><line x1="76" y1="66" x2="76" y2="60" /><line x1="70" y1="68" x2="66" y2="64" /><line x1="82" y1="68" x2="86" y2="64" /></g>
    <g className="sl-body"><g className="sl-bobg">
      <circle cx="44" cy="18" r="10" /><line x1="44" y1="28" x2="44" y2="62" />
      <g className="sl-arm sl-armL"><line x1="44" y1="35" x2="31" y2="54" /></g>
      <g className="sl-arm sl-armR"><line x1="44" y1="35" x2="66" y2="52" /><line x1="66" y1="52" x2="76" y2="66" stroke={A} strokeWidth="5" /></g>
      <g className="sl-leg sl-legL"><line x1="44" y1="62" x2="34" y2="96" /></g>
      <g className="sl-leg sl-legR"><line x1="44" y1="62" x2="54" y2="96" /></g>
    </g></g></>);
  if (task === "digger") return svg(
    <g className="sl-body">
      <circle cx="42" cy="18" r="10" /><line x1="42" y1="28" x2="48" y2="60" />
      <g className="sl-arm sl-armL"><line x1="44" y1="36" x2="64" y2="52" /></g>
      <g className="sl-arm sl-armR"><line x1="45" y1="40" x2="66" y2="58" /><line x1="64" y1="52" x2="80" y2="72" stroke={A} /><path d="M78 68 l8 4 -4 8 -8 -4 z" stroke={A} /></g>
      <g className="sl-leg sl-legL"><line x1="48" y1="60" x2="40" y2="94" /></g>
      <g className="sl-leg sl-legR"><line x1="48" y1="60" x2="58" y2="92" /></g>
    </g>);
  if (task === "sweeper") return svg(
    <g className="sl-body">
      <circle cx="46" cy="18" r="10" /><line x1="46" y1="28" x2="46" y2="60" />
      <g className="sl-arm sl-armL"><line x1="46" y1="35" x2="60" y2="56" /></g>
      <g className="sl-arm sl-armR"><line x1="46" y1="38" x2="62" y2="60" /><line x1="60" y1="56" x2="70" y2="94" stroke={A} /><line x1="62" y1="94" x2="78" y2="94" stroke={A} strokeWidth="5" /></g>
      <g className="sl-leg sl-legL"><line x1="46" y1="60" x2="37" y2="94" /></g>
      <g className="sl-leg sl-legR"><line x1="46" y1="60" x2="55" y2="94" /></g>
    </g>);
  // dancer
  return svg(
    <g className="sl-body"><g className="sl-bobg">
      <circle cx="46" cy="20" r="10" /><line x1="46" y1="30" x2="46" y2="62" />
      <g className="sl-arm sl-armL"><line x1="46" y1="36" x2="30" y2="22" /></g>
      <g className="sl-arm sl-armR"><line x1="46" y1="36" x2="62" y2="22" /></g>
      <g className="sl-leg sl-legL"><line x1="46" y1="62" x2="34" y2="94" /></g>
      <g className="sl-leg sl-legR"><line x1="46" y1="62" x2="58" y2="94" /></g>
    </g></g>);
}

export default function StickLoader({ label }) {
  // Pick a task after mount (client-only) so SSR output stays deterministic and
  // hydration never mismatches.
  const [task, setTask] = React.useState(TASKS[0]);
  React.useEffect(() => { setTask(TASKS[Math.floor(Math.random() * TASKS.length)]); }, []);
  return (
    <div style={wrap}>
      <style>{CSS}</style>
      <div className={"sl-" + task} style={{ height: 112, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <Figure task={task} />
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
