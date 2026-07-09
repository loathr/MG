"use client";
import React from "react";
import { elementPolygon } from "./model";

// The DOM rendering of a pure vector primitive (Elements ▸ Shapes): an ellipse
// (a div with border-radius:50%) or a free polygon (an inline SVG). Shared by the
// live canvas (Element.jsx) and the strip thumbnail (StaticSlide.jsx); the PNG
// export (export.js drawVectorShape) mirrors this off the same model helpers, so
// a circle/triangle/arrow looks identical live, in the strip and in the export.
//
// The polygon's viewBox is the element's own w×h so the points (0..1 fractions ×
// box) map 1:1 to artboard px — stroke width + dash are artboard px, exactly like
// the rectangle and the canvas export. The box aspect drives the shape, so
// resizing distorts freely (a circle stretches to an oval, a triangle leans).
export default function VectorShape({ el }) {
  if (el.type === "ellipse") {
    return (
      <div style={{
        width: "100%", height: "100%", boxSizing: "border-box",
        background: el.fill && el.fill !== "none" ? el.fill : "transparent",
        borderRadius: "50%",
        border: el.stroke && el.stroke !== "none" ? (el.strokeWidth || 1) + "px " + (el.dash || "solid") + " " + el.stroke : undefined,
      }} />
    );
  }
  const poly = elementPolygon(el);
  if (!poly) return null;
  const w = el.w || 1, h = el.h || 1;
  const pts = poly.map(([x, y]) => (x * w).toFixed(2) + "," + (y * h).toFixed(2)).join(" ");
  const hasFill = el.fill && el.fill !== "none";
  const hasStroke = el.stroke && el.stroke !== "none";
  const sw = el.strokeWidth || 1;
  const dash = el.dash === "dashed" ? sw * 2.5 + " " + sw * 2 : el.dash === "dotted" ? sw + " " + sw * 1.6 : undefined;
  return (
    <svg viewBox={"0 0 " + w + " " + h} width="100%" height="100%" preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
      <polygon
        points={pts}
        fill={hasFill ? el.fill : "none"}
        stroke={hasStroke ? el.stroke : "none"}
        strokeWidth={hasStroke ? sw : 0}
        strokeDasharray={dash}
        strokeLinejoin="round"
        strokeLinecap={el.dash === "dotted" ? "round" : "butt"}
      />
    </svg>
  );
}
