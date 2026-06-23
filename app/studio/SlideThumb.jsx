"use client";
import React from "react";
import { ARTBOARD_W, ARTBOARD_H } from "./model";

// A LIGHTWEIGHT slide preview for the bottom strip (§3). It deliberately never
// renders the slide's full-res background (`bg.src`) — only the small `bg.thumb`
// if one exists, otherwise the solid background colour. Placed image *elements*
// are drawn as neutral boxes rather than decoded. The result: navigating a deck
// keeps exactly one heavy decode alive (the current Artboard), no matter how
// many photo slides exist. This is the whole fix for the old app's 3rd/4th-slide
// crash. Memoised so an unrelated slide edit never re-renders other thumbnails.
function SlideThumb({ slide, width = 58 }) {
  const scale = width / ARTBOARD_W;
  const height = Math.round(ARTBOARD_H * scale);
  const bg = slide.background || {};

  return (
    <div style={{ position: "relative", width, height, overflow: "hidden", background: bg.color || "#0c0c0c", borderRadius: 3 }}>
      {bg.type === "image" && bg.thumb ? (
        <img
          src={bg.thumb}
          data-role="thumb-bg"
          alt=""
          draggable={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
      {bg.type === "image" && bg.scrim ? (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0," + bg.scrim + ")" }} />
      ) : null}

      {/* static, non-interactive mini render of the elements */}
      <div style={{ position: "absolute", top: 0, left: 0, width: ARTBOARD_W, height: ARTBOARD_H, transform: "scale(" + scale + ")", transformOrigin: "top left", pointerEvents: "none" }}>
        {(slide.elements || []).map((el) => (
          <ThumbEl key={el.id} el={el} />
        ))}
      </div>
    </div>
  );
}

function ThumbEl({ el }) {
  const frame = {
    position: "absolute",
    left: el.x, top: el.y, width: el.w, height: el.h,
    transform: "rotate(" + (el.rotation || 0) + "deg)",
    transformOrigin: "center center",
    opacity: el.opacity == null ? 1 : el.opacity,
    overflow: "hidden",
  };
  if (el.type === "text") {
    return (
      <div style={Object.assign({}, frame, {
        fontFamily: el.fontFamily, fontSize: el.fontSize, fontWeight: el.fontWeight,
        fontStyle: el.italic ? "italic" : "normal", color: el.color, textAlign: el.align,
        lineHeight: el.lineHeight, letterSpacing: (el.letterSpacing || 0) + "px",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
      })}>{el.content}</div>
    );
  }
  if (el.type === "rect" || el.type === "line") {
    return <div style={Object.assign({}, frame, { background: el.fill, borderRadius: el.radius || 0 })} />;
  }
  if (el.type === "image") {
    // never decode element images in the strip — show a neutral placeholder box
    return <div style={Object.assign({}, frame, { background: "#3a3a40", borderRadius: el.radius || 0 })} />;
  }
  return null;
}

export default React.memo(SlideThumb);
