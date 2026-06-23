// A 9-slide photo carousel used to prove the §3 crash-safety architecture: every
// slide carries a full-bleed photo background, yet navigating the whole deck only
// ever keeps ONE full-res decode alive (the current Artboard) because off-screen
// slides live in the strip as lightweight thumbnails. This is the exact scenario
// the old monolith died on (~3rd/4th slide). Reached via /studio?demo=photos9.
import { ARTBOARD_W, ARTBOARD_H, uid, makeElement } from "./model";

const M = 80;
const ACCENT = "#e23744";

function photoSlide(n, kicker, heading) {
  return {
    id: uid("slide"),
    w: ARTBOARD_W,
    h: ARTBOARD_H,
    background: {
      type: "image",
      src: "/demo/photo-" + n + ".jpg",   // full-res (heavy) — only the live Artboard renders this
      thumb: "/demo/thumb-" + n + ".jpg",  // small — used by the strip + grid
      scrim: 0.42,
      color: "#0c0c0c",
    },
    elements: [
      makeElement("rect", { id: uid("r"), x: M, y: 232, w: 64, h: 7, fill: ACCENT }),
      makeElement("text", { id: uid("t"), x: M, y: 262, w: ARTBOARD_W - 2 * M, h: 40, content: kicker, fontFamily: "Georgia, serif", fontSize: 25, fontWeight: 700, color: ACCENT, letterSpacing: 4, lineHeight: 1.2 }),
      makeElement("text", { id: uid("t"), x: M, y: 320, w: ARTBOARD_W - 2 * M, h: 480, content: heading, fontFamily: "Georgia, serif", fontSize: 88, fontWeight: 700, color: "#ffffff", lineHeight: 1.05 }),
      makeElement("text", { id: uid("t"), x: M, y: 1262, w: ARTBOARD_W - 2 * M, h: 40, content: "Slide " + n + " of 9 · demo", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 19, fontWeight: 400, color: "#cfcfcf", lineHeight: 1.2 }),
    ],
  };
}

const SLIDES = [
  ["THE OPENER", "Nine photos, one heap"],
  ["THE ORIGIN", "Where the old app fell over"],
  ["THE EVIDENCE", "Heap flat, tab dead"],
  ["THE DIAGNOSIS", "Cost lived in the compositor"],
  ["THE RULE", "Flat layers, one decode"],
  ["THE STRIP", "Thumbnails stay lightweight"],
  ["THE PROOF", "Navigate every slide"],
  ["THE RESULT", "No crash on the fourth"],
  ["THE CLOSER", "Built to stay light"],
];

export function makePhotoCarouselDoc() {
  return {
    id: uid("doc"),
    slides: SLIDES.map(([kicker, heading], i) => photoSlide(i + 1, kicker, heading)),
  };
}
