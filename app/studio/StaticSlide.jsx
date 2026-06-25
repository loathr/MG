"use client";
import React from "react";
import { ARTBOARD_W, ARTBOARD_H } from "./model";
import RichText from "./RichText";

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
    return (
      <div style={{
        ...frame,
        fontFamily: el.fontFamily,
        fontSize: el.fontSize,
        fontWeight: el.fontWeight,
        fontStyle: el.italic ? "italic" : "normal",
        color: el.color,
        textAlign: el.align,
        lineHeight: el.lineHeight,
        letterSpacing: (el.letterSpacing || 0) + "px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}><RichText el={el} /></div>
    );
  }
  if (el.type === "image") {
    return el.thumb ? (
      <img src={el.thumb} alt="" draggable={false}
        style={{ ...frame, width: el.w, height: el.h, objectFit: el.fit || "cover", borderRadius: el.radius || 0 }} />
    ) : (
      <div style={{ ...frame, background: "#2a2a2e", borderRadius: el.radius || 0 }} />
    );
  }
  if (el.type === "rect") {
    return <div style={{ ...frame, background: el.fill, borderRadius: el.radius || 0 }} />;
  }
  if (el.type === "line") {
    return <div style={{ ...frame, background: el.fill }} />;
  }
  return null;
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
