"use client";
import React from "react";
import { ARTBOARD_W, ARTBOARD_H } from "./model";

// A lightweight, non-interactive thumbnail of a slide for the bottom strip.
//
// FLAT-LAYERS §3: off-screen slides must NOT decode their full-res background.
// This component renders only `bg.thumb` (a ~200-400px image) and, for image
// elements, their `thumb` too — never `bg.src` / `el.src`. Text/rect/line are
// pure CSS and cost nothing. So a 9-slide photo deck shows 9 small decodes in
// the strip (~0.5MB each) while the single full-res decode lives in the active
// Artboard. That separation is the whole fix for the old app's slide-nav crash.
//
// The slide is rendered at full artboard size and CSS-scaled down, so the
// thumbnail is a faithful miniature of the real layout (like Canva), not an
// approximation.

const THUMB_W = 60; // strip thumbnail width, px

function ThumbElement({ el }) {
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
      }}>{el.content}</div>
    );
  }
  if (el.type === "image") {
    // thumb only — never decode the full-res element src in the strip.
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

function SlideThumb({ slide, index, active, onClick }) {
  const bg = slide.background || {};
  const scale = THUMB_W / ARTBOARD_W;
  const h = Math.round(ARTBOARD_H * scale);
  return (
    <button
      type="button"
      onClick={onClick}
      data-role="slide-thumb"
      title={"Slide " + (index + 1)}
      style={{
        position: "relative",
        width: THUMB_W,
        height: h,
        flexShrink: 0,
        padding: 0,
        border: "1.5px solid " + (active ? "#2d8cff" : "#36363c"),
        borderRadius: 5,
        overflow: "hidden",
        cursor: "pointer",
        background: bg.color || "#0c0c0c",
        boxShadow: active ? "0 0 0 1px #2d8cff" : "none",
      }}
    >
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
        {(slide.elements || []).map((el) => <ThumbElement key={el.id} el={el} />)}
      </div>
      <span style={{
        position: "absolute", bottom: 1, right: 3,
        fontSize: 9, lineHeight: 1.4, color: "#fff",
        textShadow: "0 1px 2px rgba(0,0,0,0.9)",
        fontFamily: "Helvetica, Arial, sans-serif",
      }}>{index + 1}</span>
    </button>
  );
}

// memo: a thumbnail only re-renders when its own slide object changes. Editing
// slide 3 never re-renders slides 1,2,4… (same isolation principle as Element).
export default React.memo(SlideThumb);
