// ============================================================================
// A 9-slide PHOTO carousel for the FLAT-LAYERS stress test (§3) — the exact
// shape that killed the old app (nine full-bleed photos, navigated one by one).
//
// Each slide has a single image background with a real full-res `src`
// (<=1280x1600) AND a small `thumb`, mirroring what the Photos panel produces.
// Photos come from picsum.photos so no API key or generation tokens are spent;
// the same seed at two sizes proves the src-vs-thumb split.
//
// Load it in the editor with ?demo=photos9. Then navigate all nine slides with
// DevTools open: only ONE [data-role=artboard-bg] is ever mounted, the strip
// holds nine small [data-role=thumb-bg], and native/JS memory stays flat.
// ============================================================================
import { ARTBOARD_W, ARTBOARD_H, uid, makeElement } from "./model";

const M = 80;
const ACCENT = "#e23744";
const SERIF = "Georgia, serif";
const SANS = "Helvetica, Arial, sans-serif";

const SLIDES = [
  { seed: "origin", kicker: "THE ORIGIN", heading: "Where the story begins" },
  { seed: "turn", kicker: "THE TURNING POINT", heading: "The moment everything shifted" },
  { seed: "evidence", kicker: "THE EVIDENCE", heading: "What the numbers actually show" },
  { seed: "human", kicker: "THE HUMAN STORY", heading: "The people behind the data" },
  { seed: "stakes", kicker: "THE STAKES", heading: "Why this matters now" },
  { seed: "forecast", kicker: "THE FORECAST", heading: "Where it goes from here" },
  { seed: "signal", kicker: "THE SIGNAL", heading: "Reading what comes next" },
  { seed: "voices", kicker: "THE VOICES", heading: "What the experts are saying" },
  { seed: "closer", kicker: "", heading: "Follow @loathr for more" },
];

function txt(props) {
  return makeElement("text", Object.assign({ id: uid("t"), fontFamily: SERIF, color: "#ffffff", lineHeight: 1.08 }, props));
}

function demoSlide(spec) {
  const elements = [];
  if (spec.kicker) {
    elements.push(makeElement("rect", { id: uid("r"), x: M, y: 232, w: 64, h: 7, fill: ACCENT }));
    elements.push(txt({ x: M, y: 262, w: ARTBOARD_W - 2 * M, h: 40, content: spec.kicker, fontFamily: SANS, fontSize: 24, fontWeight: 700, color: ACCENT, letterSpacing: 4, lineHeight: 1.2 }));
  }
  elements.push(txt({ x: M, y: 980, w: ARTBOARD_W - 2 * M, h: 280, content: spec.heading, fontSize: 78, fontWeight: 700, lineHeight: 1.04 }));

  return {
    id: uid("slide"),
    w: ARTBOARD_W,
    h: ARTBOARD_H,
    background: {
      type: "image",
      src: "https://picsum.photos/seed/loathr-" + spec.seed + "/1280/1600",
      thumb: "https://picsum.photos/seed/loathr-" + spec.seed + "/200/250",
      scrim: 0.45,
      color: "#0c0c0c",
      source: "Demo",
    },
    elements,
  };
}

export function photosDemoDoc() {
  return { id: uid("doc"), slides: SLIDES.map(demoSlide) };
}
