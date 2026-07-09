"use client";
import React from "react";
import { ARTBOARD_W, ARTBOARD_H, imageTransform } from "./model";
import RichText from "./RichText";
import ShapeBacking from "./ShapeBacking";
import { shapePad, shapeVAlign, fitTextSize } from "./shapes";
import { effectCss } from "./textfx";

// A non-interactive, CSS-scaled miniature of a slide. Used by the slide strip
// (SlideThumb) and the Create-screen style previews (StylePreview), so both are
// faithful renders of the real layout — not approximations.
//
// FLAT-LAYERS §3: image backgrounds render `bg.thumb` only (the small variant),
// never the full-res `bg.src`; image elements likewise render their `thumb`.
// So a strip of nine photo slides decodes nine small thumbs, while the single
// full-res decode lives in the active Artboard. Pure CSS for text/rect/line.

function StaticElement({ el }) {
  const frame = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    transform: "rotate(" + (el.rotation || 0) + "deg)",
    transformOrigin: "center center",
    opacity: el.opacity == null ? 1 : el.opacity,
    overflow: "hidden",
  };
  if (el.type === "text") {
    const typography = {
      fontFamily: el.fontFamily,
      fontSize: el.shape ? fitTextSize(el) : el.fontSize,
      fontWeight: el.fontWeight,
      fontStyle: el.italic ? "italic" : "normal",
      color: el.color,
      textAlign: el.align,
      lineHeight: el.lineHeight,
      letterSpacing: (el.letterSpacing || 0) + "px",
      textDecorationLine: (el.underline || el.strike) ? [el.underline ? "underline" : "", el.strike ? "line-through" : ""].filter(Boolean).join(" ") : "none",
      textDecorationColor: el.strikeColor || el.color,
      textDecorationThickness: (el.underline || el.strike) ? "0.11em" : undefined,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      ...effectCss(el),   // element-level text effect (shadow / glow) — mirrors Element.jsx
    };
    // Shaped text: backing behind, copy padded + centered on top (overflow:visible
    // so the tail / dog-ear / glow aren't clipped). Mirrors Element.jsx.
    if (el.shape) {
      const pad = shapePad(el);
      return (
        <div style={{ ...frame, overflow: "visible" }}>
          <ShapeBacking el={el} />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: shapeVAlign(el), boxSizing: "border-box",
            justifyContent: el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start",
            paddingTop: pad.top, paddingRight: pad.right, paddingBottom: pad.bottom, paddingLeft: pad.left,
          }}>
            <div style={{ width: "100%", ...typography }}><RichText el={el} /></div>
          </div>
        </div>
      );
    }
    return <div style={{ ...frame, ...typography }}><RichText el={el} /></div>;
  }
  if (el.type === "image") {
    if (!el.thumb) return <div style={{ ...frame, background: "#2a2a2e", borderRadius: el.radius || 0 }} />;
    const img = <img src={el.thumb} alt="" draggable={false} style={imageStyle(frame, el)} />;
    if (!el.scrim) return img;
    // Photo-owned darkening overlay, matching the photo's box + rotation.
    const overlay = { position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h, transform: frame.transform, transformOrigin: "center center", background: "#000", opacity: el.scrim, borderRadius: el.radius || 0 };
    return <>{img}<div style={overlay} /></>;
  }
  if (el.type === "rect") {
    return <div style={{ ...frame, background: el.fill, borderRadius: el.radius || 0,
      border: el.stroke && el.stroke !== "none" ? (el.strokeWidth || 1) + "px " + (el.dash || "solid") + " " + el.stroke : undefined, boxSizing: "border-box" }} />;
  }
  if (el.type === "line") {
    return (el.dash && el.dash !== "solid")
      ? <div style={{ ...frame, boxSizing: "border-box", borderTop: el.h + "px " + el.dash + " " + el.fill }} />
      : <div style={{ ...frame, background: el.fill }} />;
  }
  return null;
}

// Image style merging the element frame (position + rotation) with the crop /
// flip / mono transform. When the element is rotated we keep the frame's centre
// origin (rotate dominates); otherwise we use the crop focal origin.
function imageStyle(frame, el) {
  const it = imageTransform(el);
  const base = { ...frame, width: el.w, height: el.h, objectFit: el.fit || "cover", borderRadius: el.radius || 0 };
  if ((el.rotation || 0) !== 0) {
    return Object.assign(base, { transform: frame.transform + (it.transform ? " " + it.transform : ""), objectPosition: it.objectPosition, filter: it.filter });
  }
  return Object.assign(base, it);
}

function StaticSlide({ slide, width }) {
  const bg = slide.background || {};
  const scale = width / ARTBOARD_W;
  const h = Math.round(ARTBOARD_H * scale);
  return (
    <div style={{ position: "relative", width, height: h, overflow: "hidden", background: bg.color || "#0c0c0c" }}>
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: ARTBOARD_W, height: ARTBOARD_H,
        transform: "scale(" + scale + ")", transformOrigin: "top left",
        pointerEvents: "none",
      }}>
        {bg.type === "image" && bg.thumb && (
          <img data-role="thumb-bg" src={bg.thumb} alt="" draggable={false}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {bg.type === "image" && bg.scrim ? (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0," + bg.scrim + ")" }} />
        ) : null}
        {(slide.elements || []).map((el) => <StaticElement key={el.id} el={el} />)}
      </div>
    </div>
  );
}

export default React.memo(StaticSlide);
