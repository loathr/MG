// ============================================================================
// Geometry for direct manipulation. Pure functions, artboard-coordinate space.
// Pointer coordinates passed in are already converted to artboard units by the
// Artboard (client px -> artboard units via the fit scale).
// ============================================================================

const MIN_SIZE = 16;

export function deg2rad(d) { return (d * Math.PI) / 180; }
export function rad2deg(r) { return (r * 180) / Math.PI; }

// Local unit axes of an element rotated by `rotation` degrees.
export function axes(rotation) {
  const t = deg2rad(rotation || 0);
  const c = Math.cos(t), s = Math.sin(t);
  return { ux: { x: c, y: s }, uy: { x: -s, y: c } };
}

export function center(el) {
  return { x: el.x + el.w / 2, y: el.y + el.h / 2 };
}

const dot = (a, b) => a.x * b.x + a.y * b.y;
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a, k) => ({ x: a.x * k, y: a.y * k });

// World position of a handle. (sx, sy) in {-1,0,1}: corners use both ±1,
// edges use one 0. Returns artboard-space point accounting for rotation.
export function handlePoint(el, sx, sy) {
  const C = center(el);
  const { ux, uy } = axes(el.rotation);
  return add(add(C, mul(ux, sx * el.w / 2)), mul(uy, sy * el.h / 2));
}

// Resize keeping the OPPOSITE handle fixed in world space, working in the
// element's local (rotated) frame so rotated resize feels natural. Returns a
// patch { x, y, w, h }.
export function resize(el, sx, sy, pointer, opts) {
  const min = (opts && opts.min) || MIN_SIZE;
  const C = center(el);
  const { ux, uy } = axes(el.rotation);
  // Anchor = opposite side/corner (fixed during the drag).
  const anchor = add(add(C, mul(ux, -sx * el.w / 2)), mul(uy, -sy * el.h / 2));
  const d = sub(pointer, anchor);
  const px = dot(d, ux);
  const py = dot(d, uy);
  let w = sx !== 0 ? Math.max(min, px * sx) : el.w;
  let h = sy !== 0 ? Math.max(min, py * sy) : el.h;
  // New center: anchor plus half the (signed) extent along each local axis.
  const nc = add(anchor, add(mul(ux, (sx * w) / 2), mul(uy, (sy * h) / 2)));
  return { x: nc.x - w / 2, y: nc.y - h / 2, w, h };
}

// Font-aware CORNER resize for a text element: scale the font size (and tracking)
// with the box instead of just reflowing it. `box` is the geoResize output for the
// same drag. Picks a single uniform scale (the axis the pointer moved most), clamps
// the font to [minFont, maxFont], recomputes the box from the clamped scale, and
// keeps the OPPOSITE corner fixed. Pure; the caller only uses this for non-rotated
// text on a corner handle (edges keep reflowing). Returns a patch.
export function scaleTextResize(startEl, sx, sy, box, opts) {
  const minF = (opts && opts.minFont) || 6;
  const maxF = (opts && opts.maxFont) || 400;
  const startFont = startEl.fontSize || 32;
  const sw = startEl.w ? box.w / startEl.w : 1;
  const sh = startEl.h ? box.h / startEl.h : 1;
  const s = Math.abs(sw - 1) >= Math.abs(sh - 1) ? sw : sh;
  let font = Math.round(startFont * s);
  font = Math.max(minF, Math.min(maxF, font));
  const eff = font / startFont;                       // effective scale after clamp
  const w = Math.max(16, Math.round(startEl.w * eff));
  const h = Math.max(16, Math.round(startEl.h * eff));
  const x = sx >= 0 ? startEl.x : Math.round(startEl.x + startEl.w - w);
  const y = sy >= 0 ? startEl.y : Math.round(startEl.y + startEl.h - h);
  const patch = { x, y, w, h, fontSize: font };
  if (startEl.letterSpacing) patch.letterSpacing = +(startEl.letterSpacing * eff).toFixed(2);
  return patch;
}

// Rotation from a pointer at the rotate handle (which sits above top-center).
// Optionally snap to the nearest 15° when within `snapWithin` degrees.
export function rotate(el, pointer, snapWithin) {
  const C = center(el);
  let deg = rad2deg(Math.atan2(pointer.y - C.y, pointer.x - C.x)) + 90;
  deg = ((deg % 360) + 360) % 360;
  if (snapWithin) {
    const step = 15;
    const nearest = Math.round(deg / step) * step;
    if (Math.abs(deg - nearest) <= snapWithin) deg = nearest % 360;
  }
  return deg > 180 ? deg - 360 : deg;
}

// Axis-aligned snap lines of a box: its three x positions and three y positions.
function boxLines(b) {
  return {
    xs: [b.x, b.x + b.w / 2, b.x + b.w], // left, centerX, right
    ys: [b.y, b.y + b.h / 2, b.y + b.h], // top, centerY, bottom
  };
}

// Snap a moving box (proposed {x,y,w,h}) to artboard + sibling lines. Returns
// { x, y, guides:[{axis,pos}] } — a corrected position plus guide lines to draw.
export function snapMove(box, artboard, siblings, threshold) {
  const th = threshold == null ? 7 : threshold;
  const targetXs = [0, artboard.w / 2, artboard.w];
  const targetYs = [0, artboard.h / 2, artboard.h];
  (siblings || []).forEach((s) => {
    const l = boxLines(s);
    targetXs.push.apply(targetXs, l.xs);
    targetYs.push.apply(targetYs, l.ys);
  });
  const lines = boxLines(box);
  let bestX = null, bestY = null;
  const guides = [];

  lines.xs.forEach((lx, i) => {
    targetXs.forEach((tx) => {
      const diff = tx - lx;
      if (Math.abs(diff) <= th && (bestX == null || Math.abs(diff) < Math.abs(bestX.diff))) {
        bestX = { diff, pos: tx, fromIdx: i };
      }
    });
  });
  lines.ys.forEach((ly, i) => {
    targetYs.forEach((ty) => {
      const diff = ty - ly;
      if (Math.abs(diff) <= th && (bestY == null || Math.abs(diff) < Math.abs(bestY.diff))) {
        bestY = { diff, pos: ty, fromIdx: i };
      }
    });
  });

  let x = box.x, y = box.y;
  if (bestX) { x += bestX.diff; guides.push({ axis: "x", pos: bestX.pos }); }
  if (bestY) { y += bestY.diff; guides.push({ axis: "y", pos: bestY.pos }); }
  return { x, y, guides };
}

// Nearest target value within `th` of `v`, or null. Pure helper.
function nearestLine(targets, v, th) {
  let best = null;
  for (const t of targets) {
    const d = Math.abs(t - v);
    if (d <= th && (best == null || d < Math.abs(best - v))) best = t;
  }
  return best;
}

// Snap a RESIZE in progress. Given the proposed resized box and which handle is
// dragged (sx, sy in {-1,0,1}), snap only the MOVING edge(s) to artboard + sibling
// lines, keeping the opposite edge fixed, and never below `min`. Returns
// { x, y, w, h, guides } — a corrected box + guide lines to draw. Pure. Assumes
// axis-aligned (rotation 0); the caller skips it for rotated elements, as snapMove
// also implicitly does.
export function snapResize(box, sx, sy, artboard, siblings, threshold, min) {
  const th = threshold == null ? 7 : threshold;
  const floor = min == null ? MIN_SIZE : min;
  const targetXs = [0, artboard.w / 2, artboard.w];
  const targetYs = [0, artboard.h / 2, artboard.h];
  (siblings || []).forEach((s) => {
    const l = boxLines(s);
    targetXs.push.apply(targetXs, l.xs);
    targetYs.push.apply(targetYs, l.ys);
  });
  let x = box.x, y = box.y, w = box.w, h = box.h;
  const guides = [];
  if (sx === 1) {                                   // right edge moves; left fixed
    const t = nearestLine(targetXs, x + w, th);
    if (t != null && (t - x) >= floor) { w = t - x; guides.push({ axis: "x", pos: t }); }
  } else if (sx === -1) {                            // left edge moves; right fixed
    const right = x + w;
    const t = nearestLine(targetXs, x, th);
    if (t != null && (right - t) >= floor) { x = t; w = right - t; guides.push({ axis: "x", pos: t }); }
  }
  if (sy === 1) {                                    // bottom edge moves; top fixed
    const t = nearestLine(targetYs, y + h, th);
    if (t != null && (t - y) >= floor) { h = t - y; guides.push({ axis: "y", pos: t }); }
  } else if (sy === -1) {                            // top edge moves; bottom fixed
    const bottom = y + h;
    const t = nearestLine(targetYs, y, th);
    if (t != null && (bottom - t) >= floor) { y = t; h = bottom - t; guides.push({ axis: "y", pos: t }); }
  }
  return { x, y, w, h, guides };
}
