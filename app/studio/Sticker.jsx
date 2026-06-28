"use client";
import React from "react";
import {
  stickerPaint, stickerRadius, stickerBorderW, tagNotch, speechTail,
  noteEar, hexA, BURST_POINTS, BANNER_RULE, STICKER_PAPER_EAR,
} from "./stickers";

// Shared CSS renderer for the eight sticker variants, used by BOTH the live
// canvas (Element.jsx) and the thumb/preview (StaticSlide.jsx). It fills its
// parent frame (position:absolute; inset:0); the frame owns position, size,
// rotation and opacity. The PNG export (export.js drawSticker) mirrors this
// exactly off the same geometry helpers in stickers.js.

function burstClip() {
  return "polygon(" + BURST_POINTS.map(([x, y]) => x + "% " + y + "%").join(",") + ")";
}
function tagClip(notch) {
  return "polygon(" + notch + "px 0, 100% 0, 100% 100%, " + notch + "px 100%, 0 50%)";
}

export default function Sticker({ el }) {
  const p = stickerPaint(el);
  const variant = el.variant || "speech";
  const radius = stickerRadius(el);
  const bw = stickerBorderW(el);
  const pad = Math.round(el.h * 0.16);

  const box = {
    position: "absolute", inset: 0,
    display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
    boxSizing: "border-box",
    background: p.bg,
    color: p.text,
    borderRadius: radius,
    padding: "0 " + pad + "px",
    overflow: "hidden",
  };
  if (p.border && p.border !== "none") {
    box.border = bw + "px " + (p.dashed ? "dashed " : "solid ") + p.border;
  }
  if (variant === "burst") { box.clipPath = burstClip(); box.borderRadius = 0; box.border = "none"; }
  if (variant === "tag") {
    const notch = tagNotch(el);
    box.clipPath = tagClip(notch); box.borderRadius = 0;
    box.paddingLeft = (notch + Math.round(el.h * 0.18)) + "px";
  }
  if (variant === "cloud") {
    box.boxShadow = "0 0 0 4px " + hexA(el.fill || "#e23744", 0.1);
    box.overflow = "visible";
  }
  if (variant === "banner") {
    box.borderTop = BANNER_RULE + "px solid " + (p.rule || el.fill);
    box.borderBottom = BANNER_RULE + "px solid " + (p.rule || el.fill);
  }

  const textStyle = {
    fontFamily: el.fontFamily,
    fontSize: el.fontSize,
    fontWeight: el.fontWeight || 700,
    fontStyle: el.italic ? "italic" : "normal",
    letterSpacing: (el.letterSpacing || 0) + "px",
    lineHeight: 1.12,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={box}><span style={textStyle}>{el.text}</span></div>
      {variant === "speech" && <Tail el={el} />}
      {variant === "note" && <Ear el={el} />}
    </div>
  );
}

// The speech tail — a CSS triangle hanging just below the bottom edge, accent-
// colored, on the chosen side.
function Tail({ el }) {
  const t = speechTail(el);
  return (
    <div style={{
      position: "absolute", top: "100%", left: t.x, width: 0, height: 0,
      borderLeft: (t.w / 2) + "px solid transparent",
      borderRight: (t.w / 2) + "px solid transparent",
      borderTop: t.h + "px solid " + (el.fill || "#e23744"),
    }} />
  );
}

// The paper note's folded dog-ear at the bottom-right.
function Ear({ el }) {
  const e = noteEar(el);
  return (
    <div style={{
      position: "absolute", right: 0, bottom: 0, width: 0, height: 0,
      borderStyle: "solid", borderWidth: "0 0 " + e + "px " + e + "px",
      borderColor: "transparent transparent " + STICKER_PAPER_EAR + " transparent",
    }} />
  );
}
