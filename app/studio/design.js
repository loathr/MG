// design.js — pure "copy design" (format-painter) for a slide's LOOK. Capture a
// source slide's styling and paint it onto another slide, keeping that slide's own
// TEXT and IMAGES — only the look changes. No React, no store; unit-tested.
//
// "Look only" = background treatment (colour / scrim) + the deck style/frame + the
// per-ROLE element styling (a heading's colour/font/shape/effect, a rule's fill,
// etc.). Element geometry (x/y/w/h), text content, and image sources are NOT
// copied, so a target slide with different content still fits.

// The style-only fields per element type (never content, position, or size).
const TEXT_LOOK = ["color", "fontFamily", "fontWeight", "italic", "letterSpacing", "lineHeight", "align", "textCase", "textBg", "textStroke", "textStrokeWidth", "effect", "effectColor", "shape", "shapeFill", "shapeBody", "shapeBorderC", "shapeBorderWidth", "shapeDash"];
const RECT_LOOK = ["fill", "stroke", "strokeWidth", "radius", "dash", "opacity"];
const IMG_LOOK  = ["radius", "scrim", "fit"];

function lookKeys(type) { return type === "text" ? TEXT_LOOK : type === "rect" ? RECT_LOOK : type === "image" ? IMG_LOOK : []; }
function pick(obj, keys) { const o = {}; for (const k of keys) if (obj[k] !== undefined) o[k] = obj[k]; return o; }

// Capture a slide's look: deck style/frame, background treatment, and the styling
// of the FIRST element of each role. Pure.
export function captureLook(slide) {
  const roles = {};
  for (const e of (slide && slide.elements) || []) {
    if (!e.role || roles[e.role]) continue;   // first element of each role wins
    roles[e.role] = { type: e.type, style: pick(e, lookKeys(e.type)) };
  }
  const bg = (slide && slide.background) || {};
  return {
    style: slide && slide.style,
    frame: slide && slide.frame,
    background: { color: bg.color, scrim: bg.scrim },
    roles,
  };
}

// Apply a captured look to a slide, returning a NEW slide (pure). Keeps the slide's
// own text/images/geometry — only styling + background treatment change. A target
// element adopts a role's styling only when the roles AND types match.
export function applyLook(slide, look) {
  if (!slide || !look) return slide;
  const bg = slide.background || {};
  let background = bg;
  if (bg.type === "image") {
    // keep the target's photo; adopt only the scrim treatment
    if (look.background.scrim != null) background = Object.assign({}, bg, { scrim: look.background.scrim });
  } else if (look.background.color) {
    background = Object.assign({}, bg, { color: look.background.color });
  }
  const elements = (slide.elements || []).map((e) => {
    const r = e.role && look.roles[e.role];
    if (!r || r.type !== e.type) return e;
    return Object.assign({}, e, r.style);
  });
  const out = Object.assign({}, slide, { background, elements });
  if (look.style != null) out.style = look.style;
  if (look.frame != null) out.frame = look.frame;
  return out;
}
