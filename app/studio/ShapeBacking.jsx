"use client";
import React from "react";
import {
  shapePaint, shapeRadius, shapeBorderW, shapePolygon, tagNotch, speechTail,
  noteEar, hexA, shapeAccentColor, shapeTailColor,
  BURST_POINTS, BANNER_RULE, SHAPE_PAPER_EAR,
} from "./shapes";

// The shape backing (no text) a text element wears. Fills its parent frame
// (position:absolute; inset:0); the frame owns position, size, rotation and
// opacity, and the editable text renders in a padded, centered layer ON TOP of
// this (see Element.jsx / StaticSlide.jsx). The PNG export (export.js
// drawShapeBacking) mirrors this exactly off the same geometry helpers.

function burstClip() {
  return "polygon(" + BURST_POINTS.map(([x, y]) => x + "% " + y + "%").join(",") + ")";
}
function tagClip(notch) {
  return "polygon(" + notch + "px 0, 100% 0, 100% 100%, " + notch + "px 100%, 0 50%)";
}
function polyClip(points) {
  return "polygon(" + points.map(([x, y]) => x + "% " + y + "%").join(",") + ")";
}

export default function ShapeBacking({ el }) {
  const p = shapePaint(el);
  const variant = el.shape || "speech";
  const radius = shapeRadius(el);
  const bw = shapeBorderW(el);

  const box = {
    position: "absolute", inset: 0, boxSizing: "border-box",
    background: p.bg, borderRadius: radius, overflow: "hidden",
  };
  if (p.border && p.border !== "none") {
    // p.dash is a literal CSS border-style: solid | dashed | dotted.
    box.border = bw + "px " + (p.dash || "solid") + " " + p.border;
  }
  if (variant === "burst") { box.clipPath = burstClip(); box.borderRadius = 0; box.border = "none"; }
  const poly = shapePolygon(el);
  if (poly) { box.clipPath = polyClip(poly); box.borderRadius = 0; box.border = "none"; }
  if (variant === "tag") { box.clipPath = tagClip(tagNotch(el)); box.borderRadius = 0; }
  if (variant === "cloud") {
    box.boxShadow = "0 0 0 4px " + hexA(shapeAccentColor(el), 0.1);
    box.overflow = "visible";
  }
  if (variant === "banner") {
    box.borderTop = BANNER_RULE + "px solid " + (p.rule || el.shapeFill);
    box.borderBottom = BANNER_RULE + "px solid " + (p.rule || el.shapeFill);
  }

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={box} />
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
      borderTop: t.h + "px solid " + shapeTailColor(el),
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
      borderColor: "transparent transparent " + SHAPE_PAPER_EAR + " transparent",
    }} />
  );
}
